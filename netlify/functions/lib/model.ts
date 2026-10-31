import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export const SERVICE_BOUNDARY =
  "BatteryDocs provides evidence review and technical-data preparation only. It does not provide certification, legal advice, laboratory testing, Digital Product Passport issuance, EU registry submission, production DPP hosting, or a guarantee of regulatory approval or market access.";

export type ServiceRoute = "audit" | "closure" | "combined" | "unsure";
export type LeadStatus = "new" | "reviewed" | "qualified" | "declined" | "closed";
export type OrderStatus =
  | "draft"
  | "order_form_pending"
  | "order_form_accepted"
  | "checkout_open"
  | "paid"
  | "payment_cleared"
  | "intake_released"
  | "active"
  | "cancelled"
  | "expired"
  | "refunded"
  | "disputed";
export type DocumentStatus = "quarantined_pending_review" | "manual_clean" | "rejected";

export type Lead = {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: LeadStatus;
  serviceInterest: ServiceRoute;
  language: "en" | "pl" | "de";
  name: string;
  workEmail: string;
  company: string;
  batteryModel?: string;
  evidenceIssue?: string;
  context?: string;
  privacyAcceptedAt: string;
  source: "public_scope_check";
};

export type Consultation = {
  id: string;
  createdAt: string;
  name: string;
  workEmail: string;
  company: string;
  timezone: string;
  preferredWindow: string;
  discussionPoint?: string;
  privacyAcceptedAt: string;
  status: "new" | "scheduled" | "closed";
};

export type Order = {
  id: string;
  createdAt: string;
  updatedAt: string;
  leadId?: string;
  customerName: string;
  customerEmail: string;
  customerCompany: string;
  title: string;
  scopeSummary: string;
  serviceRoute: ServiceRoute;
  amountCents: number;
  currency: "eur";
  status: OrderStatus;
  termsVersion: string;
  accessTokenHash: string;
  expiresAt: string;
  orderFormAcceptedAt?: string;
  orderFormAcceptedBy?: string;
  orderFormAcceptanceText?: string;
  stripeCheckoutSessionId?: string;
  stripeCheckoutUrl?: string;
  paymentReceivedAt?: string;
  paymentClearedAt?: string;
  intakeReleasedAt?: string;
};

export type DocumentRecord = {
  id: string;
  orderId: string;
  createdAt: string;
  originalName: string;
  contentType: string;
  bytes: number;
  sha256: string;
  status: DocumentStatus;
  storageKey: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
};

export type AuditEvent = {
  id: string;
  createdAt: string;
  kind: string;
  entityType: "lead" | "consultation" | "order" | "document" | "payment" | "system";
  entityId: string;
  actor: "public" | "customer" | "ops" | "stripe" | "system";
  detail?: Record<string, string | number | boolean | null>;
};

export function nowIso() {
  return new Date().toISOString();
}

export function opaqueId(prefix: string) {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `${prefix}-${date}-${randomBytes(4).toString("hex").toUpperCase()}`;
}

export function createAccessToken() {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function verifyToken(token: string | null | undefined, tokenHash: string) {
  if (!token || !/^[A-Za-z0-9_-]{32,}$/.test(token) || !/^[a-f0-9]{64}$/i.test(tokenHash)) return false;
  const expected = Buffer.from(tokenHash, "hex");
  const actual = Buffer.from(hashToken(token), "hex");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function normaliseEmail(value: unknown) {
  const email = String(value ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email) || email.length > 320) return null;
  return email;
}

export function text(value: unknown, max = 500) {
  return String(value ?? "").trim().replace(/\s+/g, " ").slice(0, max);
}

export function multiline(value: unknown, max = 4000) {
  return String(value ?? "").trim().replace(/\u0000/g, "").slice(0, max);
}

export function isRoute(value: unknown): value is ServiceRoute {
  return value === "audit" || value === "closure" || value === "combined" || value === "unsure";
}

export function isLanguage(value: unknown): value is "en" | "pl" | "de" {
  return value === "en" || value === "pl" || value === "de";
}

export function isAllowedDocument(name: string, contentType: string) {
  const extension = name.toLowerCase().match(/\.(pdf|xlsx|csv)$/)?.[1];
  const allowedMime = new Set([
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/csv",
    "application/csv",
    "text/plain",
    "application/octet-stream",
  ]);
  return Boolean(extension) && allowedMime.has(contentType.toLowerCase());
}
