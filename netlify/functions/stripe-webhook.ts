import type { Config } from "@netlify/functions";
import { createHmac, timingSafeEqual } from "node:crypto";
import { json, method } from "./lib/http";
import { nowIso, type Order } from "./lib/model";
import { getJson, keys, putJson, writeAudit } from "./lib/store";

type StripeWebhookEvent = {
  id?: string;
  type?: string;
  data?: {
    object?: {
      metadata?: Record<string, string>;
      client_reference_id?: string;
      payment_status?: string;
    };
  };
};

function validStripeSignature(payload: string, signature: string, secret: string) {
  const fields = signature.split(",").map(part => part.trim().split("=", 2));
  const timestamp = fields.find(([key]) => key === "t")?.[1];
  const candidates = fields.filter(([key, value]) => key === "v1" && value).map(([, value]) => value!);
  const timestampSeconds = Number(timestamp);
  if (!Number.isSafeInteger(timestampSeconds) || candidates.length === 0) return false;
  if (Math.abs(Math.floor(Date.now() / 1000) - timestampSeconds) > 300) return false;
  const expected = createHmac("sha256", secret).update(`${timestampSeconds}.${payload}`, "utf8").digest("hex");
  const expectedBytes = Buffer.from(expected, "hex");
  return candidates.some(candidate => {
    if (!/^[a-f0-9]{64}$/i.test(candidate)) return false;
    const receivedBytes = Buffer.from(candidate, "hex");
    return receivedBytes.length === expectedBytes.length && timingSafeEqual(receivedBytes, expectedBytes);
  });
}

export default async (req: Request) => {
  const invalidMethod = method(req, ["POST"]);
  if (invalidMethod) return invalidMethod;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) return json(503, { error: "stripe_webhook_not_configured" });
  const signature = req.headers.get("stripe-signature");
  if (!signature) return json(400, { error: "stripe_signature_missing" });
  const payload = await req.text();
  if (!validStripeSignature(payload, signature, webhookSecret)) return json(400, { error: "stripe_signature_invalid" });
  let event: StripeWebhookEvent;
  try {
    event = JSON.parse(payload) as StripeWebhookEvent;
  } catch {
    return json(400, { error: "stripe_event_invalid" });
  }
  if (!event.id || !event.type) return json(400, { error: "stripe_event_invalid" });
  if (await getJson(keys.webhook(event.id))) return json(200, { ok: true, duplicate: true });
  await putJson(keys.webhook(event.id), { id: event.id, type: event.type, receivedAt: nowIso() });
  const session = event.data?.object;
  const orderId = session?.metadata?.batterydocs_order_id || session?.client_reference_id;
  if (!orderId) return json(200, { ok: true, ignored: true });
  const order = await getJson<Order>(keys.order(orderId));
  if (!order) return json(200, { ok: true, ignored: true });
  let updated = order;
  if ((event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") && session?.payment_status === "paid") {
    updated = { ...order, status: "paid", updatedAt: nowIso(), paymentReceivedAt: nowIso() };
  } else if (event.type === "charge.dispute.created") {
    updated = { ...order, status: "disputed", updatedAt: nowIso() };
  } else if (event.type === "charge.refunded" || event.type === "refund.created") {
    updated = { ...order, status: "refunded", updatedAt: nowIso() };
  }
  if (updated !== order) {
    await putJson(keys.order(updated.id), updated);
    await writeAudit({ kind: `stripe.${event.type}`, entityType: "payment", entityId: updated.id, actor: "stripe", detail: { eventId: event.id, paymentStatus: String(session?.payment_status || "unknown") } });
    await putJson(`outbox/${event.id}.json`, { type: `stripe.${event.type}`, orderId: updated.id, createdAt: nowIso(), state: "pending_ops_review" });
  }
  return json(200, { ok: true });
};

export const config: Config = { path: "/api/webhooks/stripe", method: "POST" };
