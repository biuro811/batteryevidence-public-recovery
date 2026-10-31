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

import leadHandler from "./leads";
import opsHandler from "./ops";
import orderHandler from "./orders";
import intakeHandler from "./intake";
import { createAccessToken, hashToken, verifyToken } from "./lib/model";

describe("BatteryDocs workflow controls", () => {
  beforeEach(() => {
    memory.clear(); blobs.clear();
    process.env.OPS_USERNAME = "owner";
    process.env.OPS_PASSWORD = "strong-test-password";
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
  });

  it("uses opaque private tokens instead of storing the raw token", () => {
    const token = createAccessToken();
    const digest = hashToken(token);
    expect(token).not.toEqual(digest);
    expect(verifyToken(token, digest)).toBe(true);
    expect(verifyToken("incorrect-token", digest)).toBe(false);
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
});
