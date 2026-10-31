import type { Config } from "@netlify/functions";
import Stripe from "stripe";
import { bodyJson, json, method, publicBaseUrl } from "./lib/http";
import { nowIso, type Order, verifyToken } from "./lib/model";
import { getJson, keys, putJson, writeAudit } from "./lib/store";

function suppliedToken(req: Request, url: URL, input?: Record<string, unknown>) {
  const authorization = req.headers.get("authorization") || "";
  if (authorization.startsWith("Bearer ")) return authorization.slice(7).trim();
  return String(input?.token || url.searchParams.get("token") || "").trim();
}

function publicOrder(order: Order) {
  return {
    id: order.id,
    createdAt: order.createdAt,
    title: order.title,
    scopeSummary: order.scopeSummary,
    serviceRoute: order.serviceRoute,
    amountCents: order.amountCents,
    currency: order.currency,
    status: order.status,
    termsVersion: order.termsVersion,
    expiresAt: order.expiresAt,
    orderFormAcceptedAt: order.orderFormAcceptedAt,
    paymentReceivedAt: order.paymentReceivedAt,
    paymentClearedAt: order.paymentClearedAt,
    intakeReleasedAt: order.intakeReleasedAt,
  };
}

function testPaymentLinkFallback(order: Order) {
  const paymentLink = process.env.STRIPE_TEST_PAYMENT_LINK?.trim();
  const expectedAmount = Number(process.env.STRIPE_TEST_PAYMENT_LINK_AMOUNT_CENTS || "0");
  const expectedCurrency = (process.env.STRIPE_TEST_PAYMENT_LINK_CURRENCY || "eur").toLowerCase();
  if (!paymentLink || !Number.isSafeInteger(expectedAmount) || expectedAmount < 1) return undefined;
  if (order.amountCents !== expectedAmount || order.currency.toLowerCase() !== expectedCurrency) return undefined;
  try {
    const url = new URL(paymentLink);
    if (url.protocol !== "https:" || url.hostname !== "buy.stripe.com") return undefined;
    url.searchParams.set("client_reference_id", order.id);
    url.searchParams.set("prefilled_email", order.customerEmail);
    return url.toString();
  } catch {
    return undefined;
  }
}

export default async (req: Request) => {
  const invalidMethod = method(req, ["GET", "POST"]);
  if (invalidMethod) return invalidMethod;
  const url = new URL(req.url);
  const id = url.searchParams.get("reference") || url.pathname.split("/").filter(Boolean).at(-1) || "";
  const order = await getJson<Order>(keys.order(id));
  if (!order) return json(404, { error: "order_not_found" });

  const input = req.method === "POST" ? await bodyJson<Record<string, unknown>>(req) : undefined;
  if (req.method === "POST" && !input) return json(400, { error: "invalid_json" });
  const token = suppliedToken(req, url, input ?? undefined);
  if (!verifyToken(token, order.accessTokenHash)) return json(403, { error: "order_access_denied" });
  if (new Date(order.expiresAt).getTime() < Date.now() && !["paid", "payment_cleared", "intake_released", "active"].includes(order.status)) {
    return json(410, { error: "order_link_expired", message: "Please ask your BatteryDocs contact to issue a refreshed order link." });
  }

  if (req.method === "GET") return json(200, { ok: true, order: publicOrder(order), serviceBoundary: "Evidence review and technical-data preparation only; no certification, legal advice, laboratory testing or Battery Passport issuance." });

  const postInput = input as Record<string, unknown>;
  const action = String(postInput.action || "");
  if (action === "accept_order_form") {
    const acceptedBy = String(postInput.acceptedBy || "").trim().slice(0, 160);
    const accepted = postInput.accepted === true;
    if (!accepted || !acceptedBy) return json(422, { error: "order_form_acceptance_required" });
    if (order.status !== "order_form_pending" && order.status !== "draft") return json(409, { error: "order_form_not_available", status: order.status });
    const updated: Order = {
      ...order,
      status: "order_form_accepted",
      updatedAt: nowIso(),
      orderFormAcceptedAt: nowIso(),
      orderFormAcceptedBy: acceptedBy,
      orderFormAcceptanceText: "I accept the written scope, exclusions, amount and payment terms shown in this private Order Form.",
    };
    await putJson(keys.order(updated.id), updated);
    await writeAudit({ kind: "order.order_form_accepted", entityType: "order", entityId: updated.id, actor: "customer", detail: { acceptedBy } });
    return json(200, { ok: true, order: publicOrder(updated) });
  }

  if (action !== "create_test_checkout") return json(422, { error: "unknown_order_action" });
  if (order.status !== "order_form_accepted" && order.status !== "checkout_open") return json(409, { error: "order_form_not_accepted", status: order.status });
  if (order.stripeCheckoutUrl && order.status === "checkout_open") return json(200, { ok: true, checkoutUrl: order.stripeCheckoutUrl, reused: true });

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || !key.startsWith("sk_test_")) {
    const checkoutUrl = testPaymentLinkFallback(order);
    if (!checkoutUrl) {
      return json(503, { error: "test_checkout_not_configured", message: "Test-mode Stripe Checkout is not configured for this order. The only fallback is a fixed, server-approved test Payment Link; live charges are disabled." });
    }
    const updated: Order = { ...order, status: "checkout_open", updatedAt: nowIso(), stripeCheckoutUrl: checkoutUrl };
    await putJson(keys.order(updated.id), updated);
    await writeAudit({ kind: "order.test_payment_link_opened", entityType: "order", entityId: order.id, actor: "customer", detail: { amountCents: order.amountCents, currency: order.currency, testMode: true } });
    return json(201, { ok: true, checkoutUrl, testMode: true, paymentLinkFallback: true });
  }

  const stripe = new Stripe(key);
  const base = publicBaseUrl(req);
  const orderPath = `${base}/order?reference=${encodeURIComponent(order.id)}`;
  const orderUrl = `${orderPath}#token=${encodeURIComponent(token)}`;
  const session = await stripe.checkout.sessions.create(
    {
      mode: "payment",
      customer_email: order.customerEmail,
      customer_creation: "always",
      billing_address_collection: "required",
      tax_id_collection: { enabled: true },
      line_items: [{
        quantity: 1,
        price_data: {
          currency: order.currency,
          unit_amount: order.amountCents,
          product_data: { name: order.title, description: order.scopeSummary.slice(0, 500) },
        },
      }],
      metadata: { batterydocs_order_id: order.id },
      payment_intent_data: { metadata: { batterydocs_order_id: order.id } },
      success_url: `${orderPath}&session_id={CHECKOUT_SESSION_ID}#token=${encodeURIComponent(token)}`,
      cancel_url: orderUrl,
    },
    { idempotencyKey: `batterydocs-${order.id}-checkout-v1` },
  );
  if (!session.url) return json(502, { error: "checkout_url_missing" });

  const updated: Order = { ...order, status: "checkout_open", updatedAt: nowIso(), stripeCheckoutSessionId: session.id, stripeCheckoutUrl: session.url };
  await putJson(keys.order(updated.id), updated);
  await writeAudit({ kind: "order.test_checkout_created", entityType: "order", entityId: order.id, actor: "customer", detail: { stripeCheckoutSessionId: session.id, testMode: true } });
  return json(201, { ok: true, checkoutUrl: session.url, testMode: true });
};

export const config: Config = { path: "/api/orders/*" };
