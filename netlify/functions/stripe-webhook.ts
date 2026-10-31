import type { Config } from "@netlify/functions";
import Stripe from "stripe";
import { json, method } from "./lib/http";
import { nowIso, type Order } from "./lib/model";
import { getJson, keys, putJson, writeAudit } from "./lib/store";

export default async (req: Request) => {
  const invalidMethod = method(req, ["POST"]);
  if (invalidMethod) return invalidMethod;
  const key = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!key || !key.startsWith("sk_test_") || !webhookSecret) return json(503, { error: "stripe_webhook_not_configured" });
  const signature = req.headers.get("stripe-signature");
  if (!signature) return json(400, { error: "stripe_signature_missing" });

  let event: Stripe.Event;
  try {
    const payload = await req.text();
    event = new Stripe(key).webhooks.constructEvent(payload, signature, webhookSecret);
  } catch {
    return json(400, { error: "stripe_signature_invalid" });
  }

  if (await getJson(keys.webhook(event.id))) return json(200, { ok: true, duplicate: true });
  await putJson(keys.webhook(event.id), { id: event.id, type: event.type, receivedAt: nowIso() });

  const session = event.data.object as Stripe.Checkout.Session;
  const orderId = session.metadata?.batterydocs_order_id;
  if (!orderId) return json(200, { ok: true, ignored: true });
  const order = await getJson<Order>(keys.order(orderId));
  if (!order) return json(200, { ok: true, ignored: true });

  let updated = order;
  if ((event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") && session.payment_status === "paid") {
    updated = { ...order, status: "paid", updatedAt: nowIso(), paymentReceivedAt: nowIso() };
  } else if (event.type === "charge.dispute.created") {
    updated = { ...order, status: "disputed", updatedAt: nowIso() };
  } else if (event.type === "charge.refunded" || event.type === "refund.created") {
    updated = { ...order, status: "refunded", updatedAt: nowIso() };
  }

  if (updated !== order) {
    await putJson(keys.order(updated.id), updated);
    await writeAudit({ kind: `stripe.${event.type}`, entityType: "payment", entityId: updated.id, actor: "stripe", detail: { eventId: event.id, paymentStatus: String(session.payment_status || "unknown") } });
    await putJson(`outbox/${event.id}.json`, { type: `stripe.${event.type}`, orderId: updated.id, createdAt: nowIso(), state: "pending_ops_review" });
  }
  return json(200, { ok: true });
};

export const config: Config = { path: "/api/webhooks/stripe", method: "POST" };
