import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const memory = new Map<string, unknown>();
const blobs = new Map<string, Blob>();

vi.mock("@netlify/blobs", () => ({
  getStore: () => ({
    setJSON: async (key: string, value: unknown) => { memory.set(key, structuredClone(value)); },
    get: async (key: string, options?: { type?: string }) => {
      if (options?.type === "blob") {
        const value = blobs.get(key);
        if (!value) throw new Error("not_found");
        return value;
      }
      const value = memory.get(key);
      if (value === undefined) throw new Error("not_found");
      return structuredClone(value);
    },
    set: async (key: string, value: Blob) => { blobs.set(key, value); },
    delete: async (key: string) => { memory.delete(key); blobs.delete(key); },
    list: async ({ prefix = "" } = {}) => ({ blobs: [...memory.keys()].filter(key => key.startsWith(prefix)).map(key => ({ key, etag: "test" })), directories: [] }),
  }),
}));

import leadHandler from "../netlify/functions/leads";
import opsHandler from "../netlify/functions/ops";
import orderHandler from "../netlify/functions/orders";
import intakeHandler from "../netlify/functions/intake";
import stripeWebhookHandler from "../netlify/functions/stripe-webhook";
import { createAccessToken, hashToken, verifyToken } from "../netlify/functions/lib/model";
import { keys, putJson } from "../netlify/functions/lib/store";

describe("BatteryDocs workflow controls", () => {
  beforeEach(() => {
    memory.clear(); blobs.clear();
    process.env.OPS_USERNAME = "owner";
    process.env.OPS_PASSWORD = "strong-test-password";
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.STRIPE_TEST_PAYMENT_LINK;
    delete process.env.STRIPE_TEST_PAYMENT_LINK_AMOUNT_CENTS;
    delete process.env.STRIPE_TEST_PAYMENT_LINK_CURRENCY;
  });

  it("uses opaque private tokens instead of storing the raw token", () => {
    const token = createAccessToken();
    const digest = hashToken(token);
    expect(token).not.toEqual(digest);
    expect(verifyToken(token, digest)).toBe(true);
    expect(verifyToken("incorrect-token", digest)).toBe(false);
  });

  it("fails closed when an Operations request has no Basic Auth", async () => {
    const response = await opsHandler(new Request("https://batteryevidence.eu/api/ops"));
    expect(response.status).toBe(401);
  });

  it("records a public text-only lead and requires accepted Order Form before checkout", async () => {
    const leadRequest = new Request("https://batteryevidence.eu/api/leads", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": "198.51.100.11" },
      body: JSON.stringify({ name: "Test Contact", workEmail: "test@example.com", company: "Test Battery Co", serviceInterest: "audit", privacyAccepted: true, language: "en", batteryModel: "TB-100", evidenceIssue: "Need source reconciliation", website: "" }),
    });
    const leadResponse = await leadHandler(leadRequest);
    expect(leadResponse.status).toBe(201);
    const lead = await leadResponse.json() as { reference: string };
    expect(lead.reference).toMatch(/^BD-L-/);

    const auth = `Basic ${Buffer.from("owner:strong-test-password").toString("base64")}`;
    const orderResponse = await opsHandler(new Request("https://batteryevidence.eu/api/ops/orders", {
      method: "POST", headers: { authorization: auth, "content-type": "application/json" },
      body: JSON.stringify({ leadId: lead.reference, customerName: "Test Contact", customerEmail: "test@example.com", customerCompany: "Test Battery Co", serviceRoute: "audit", title: "Package 1", scopeSummary: "One defined model; no certification or legal advice.", amountCents: 149000 }),
    }));
    expect(orderResponse.status).toBe(201);
    const order = await orderResponse.json() as { order: { id: string }; privateUrl: string };
    const token = new URLSearchParams(new URL(order.privateUrl).hash.slice(1)).get("token")!;
    expect(token).toHaveLength(43);

    const blockedCheckout = await orderHandler(new Request(`https://batteryevidence.eu/api/orders/${order.order.id}`, { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify({ action: "create_test_checkout" }) }));
    expect(blockedCheckout.status).toBe(409);

    const accepted = await orderHandler(new Request(`https://batteryevidence.eu/api/orders/${order.order.id}`, { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify({ action: "accept_order_form", accepted: true, acceptedBy: "Test Contact" }) }));
    expect(accepted.status).toBe(200);

    const noStripeCheckout = await orderHandler(new Request(`https://batteryevidence.eu/api/orders/${order.order.id}`, { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify({ action: "create_test_checkout" }) }));
    expect(noStripeCheckout.status).toBe(503);

    const closedIntake = await intakeHandler(new Request(`https://batteryevidence.eu/api/intake?reference=${order.order.id}`, { headers: { authorization: `Bearer ${token}` } }));
    expect(closedIntake.status).toBe(423);
  });

  it("opens a fixed Stripe test Payment Link only for a server-approved accepted order", async () => {
    const token = createAccessToken();
    await putJson(keys.order("BD-O-TEST-LINK"), {
      id: "BD-O-TEST-LINK", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), customerName: "Test Contact", customerEmail: "test@example.com", customerCompany: "Test Battery Co", title: "Workflow test", scopeSummary: "Test only", serviceRoute: "audit", amountCents: 100, currency: "eur", status: "order_form_accepted", termsVersion: "test", accessTokenHash: hashToken(token), expiresAt: new Date(Date.now() + 86_400_000).toISOString(), orderFormAcceptedAt: new Date().toISOString(), orderFormAcceptedBy: "Test Contact",
    });
    process.env.STRIPE_TEST_PAYMENT_LINK = "https://buy.stripe.com/test_demo";
    process.env.STRIPE_TEST_PAYMENT_LINK_AMOUNT_CENTS = "100";
    process.env.STRIPE_TEST_PAYMENT_LINK_CURRENCY = "eur";
    const response = await orderHandler(new Request("https://batteryevidence.eu/api/orders/BD-O-TEST-LINK", { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify({ action: "create_test_checkout" }) }));
    const payload = await response.json() as { checkoutUrl: string; paymentLinkFallback: boolean };
    expect(response.status).toBe(201);
    expect(payload.paymentLinkFallback).toBe(true);
    const url = new URL(payload.checkoutUrl);
    expect(url.searchParams.get("client_reference_id")).toBe("BD-O-TEST-LINK");
    expect(url.searchParams.get("prefilled_email")).toBe("test@example.com");
  });

  it("accepts a current, validly signed test webhook and keeps intake release separate", async () => {
    const token = createAccessToken();
    await putJson(keys.order("BD-O-WEBHOOK"), {
      id: "BD-O-WEBHOOK", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), customerName: "Test Contact", customerEmail: "test@example.com", customerCompany: "Test Battery Co", title: "Workflow test", scopeSummary: "Test only", serviceRoute: "audit", amountCents: 100, currency: "eur", status: "checkout_open", termsVersion: "test", accessTokenHash: hashToken(token), expiresAt: new Date(Date.now() + 86_400_000).toISOString(), orderFormAcceptedAt: new Date().toISOString(), orderFormAcceptedBy: "Test Contact",
    });
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_batterydocs";
    const event = JSON.stringify({ id: "evt_batterydocs_signed_test", type: "checkout.session.completed", data: { object: { client_reference_id: "BD-O-WEBHOOK", payment_status: "paid" } } });
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = createHmac("sha256", process.env.STRIPE_WEBHOOK_SECRET).update(`${timestamp}.${event}`, "utf8").digest("hex");
    const response = await stripeWebhookHandler(new Request("https://batteryevidence.eu/api/webhooks/stripe", { method: "POST", headers: { "stripe-signature": `t=${timestamp},v1=${signature}` }, body: event }));
    expect(response.status).toBe(200);
    const orderResponse = await orderHandler(new Request("https://batteryevidence.eu/api/orders/BD-O-WEBHOOK", { headers: { authorization: `Bearer ${token}` } }));
    const orderPayload = await orderResponse.json() as { order: { status: string } };
    expect(orderPayload.order.status).toBe("paid");
  });
});
