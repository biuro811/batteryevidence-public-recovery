import type { Config } from "@netlify/functions";
import { json, method } from "./lib/http";

export default async (req: Request) => {
  const invalidMethod = method(req, ["GET"]);
  if (invalidMethod) return invalidMethod;
  return json(200, {
    ok: true,
    service: "BatteryDocs workflow",
    features: {
      scopeChecks: true,
      consultations: true,
      privateOrders: true,
      operationsAuthConfigured: Boolean(process.env.OPS_USERNAME && process.env.OPS_PASSWORD),
      testStripeCheckoutConfigured: Boolean(
        process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_") || process.env.STRIPE_TEST_PAYMENT_LINK,
      ),
      signedStripeWebhookConfigured: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
      livePaymentsEnabled: false,
      postPaymentIntake: true,
      automatedMalwareScanning: false,
    },
  });
};

export const config: Config = { path: "/api/health", method: "GET" };
