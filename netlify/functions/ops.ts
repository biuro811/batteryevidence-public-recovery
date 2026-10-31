import type { Config } from "@netlify/functions";
import { bodyJson, json, method, publicBaseUrl, requireOps, unauthorizedOps } from "./lib/http";
import { createAccessToken, hashToken, isRoute, multiline, normaliseEmail, nowIso, opaqueId, text, type DocumentRecord, type Order } from "./lib/model";
import { getDocumentBody, getJson, keys, listConsultations, listDocuments, listLeads, listOrders, putJson, writeAudit } from "./lib/store";

const packageNames: Record<string, string> = {
  audit: "Package 1 — Readiness & Evidence Audit",
  closure: "Package 2 — Evidence Closure & Technical Data Pack",
  combined: "Package 1 + 2 — Audit and Evidence Closure",
  unsure: "BatteryDocs — Scoped Evidence Engagement",
};

function sortByUpdated<T extends { createdAt: string; updatedAt?: string }>(items: T[]) {
  return items.sort((a, b) => (b.updatedAt || b.createdAt).localeCompare(a.updatedAt || a.createdAt));
}

export default async (req: Request) => {
  const auth = requireOps(req);
  if (!auth) return unauthorizedOps();
  const invalidMethod = method(req, ["GET", "POST"]);
  if (invalidMethod) return invalidMethod;
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/api\/ops\/?/, "");

  if (req.method === "GET" && (path === "summary" || path === "")) {
    const [leads, consultations, orders, documents] = await Promise.all([listLeads(), listConsultations(), listOrders(), listDocuments()]);
    return json(200, {
      ok: true,
      leads: sortByUpdated(leads),
      consultations: consultations.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      orders: sortByUpdated(orders),
      documents: documents.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      operationalNotice: "A manual clean/reject review is required before any document download. Stripe webhook receipt records paid; payment clearance and intake release are separate operations controls.",
    });
  }

  if (req.method === "POST" && path === "orders") {
    const input = await bodyJson<Record<string, unknown>>(req);
    if (!input) return json(400, { error: "invalid_json" });
    const customerName = text(input.customerName, 160);
    const customerEmail = normaliseEmail(input.customerEmail);
    const customerCompany = text(input.customerCompany, 200);
    const title = text(input.title, 200);
    const scopeSummary = multiline(input.scopeSummary, 4000);
    const amountCents = Number(input.amountCents);
    if (!customerName || !customerEmail || !customerCompany || !title || !scopeSummary || !isRoute(input.serviceRoute) || !Number.isSafeInteger(amountCents) || amountCents < 100) {
      return json(422, { error: "invalid_order", message: "Customer identity, service route, title, scope and an EUR amount of at least €1 are required." });
    }
    const token = createAccessToken();
    const createdAt = nowIso();
    const order: Order = {
      id: opaqueId("BD-O"),
      createdAt,
      updatedAt: createdAt,
      leadId: text(input.leadId, 100) || undefined,
      customerName,
      customerEmail,
      customerCompany,
      title,
      scopeSummary,
      serviceRoute: input.serviceRoute,
      amountCents,
      currency: "eur",
      status: "order_form_pending",
      termsVersion: text(input.termsVersion, 80) || "BatteryDocs Order Form v1.0",
      accessTokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    };
    await putJson(keys.order(order.id), order);
    await writeAudit({ kind: "order.created", entityType: "order", entityId: order.id, actor: "ops", detail: { by: auth.username, amountCents, serviceRoute: order.serviceRoute } });
    const privateUrl = `${publicBaseUrl(req)}/order?reference=${encodeURIComponent(order.id)}#token=${encodeURIComponent(token)}`;
    return json(201, { ok: true, order, privateUrl, deliveryNote: "Copy the private link to the authorised customer through an approved business channel. The token is shown only in this response." });
  }

  const documentDownload = path.match(/^documents\/([^/]+)\/download$/);
  if (req.method === "GET" && documentDownload) {
    const document = await getJson<DocumentRecord>(keys.document(decodeURIComponent(documentDownload[1])));
    if (!document) return json(404, { error: "document_not_found" });
    if (document.status !== "manual_clean") return json(409, { error: "document_not_released", status: document.status });
    const body = await getDocumentBody(document.storageKey);
    if (!body) return json(404, { error: "document_body_not_found" });
    await writeAudit({ kind: "document.downloaded", entityType: "document", entityId: document.id, actor: "ops", detail: { by: auth.username } });
    return new Response(body, { headers: { "content-type": document.contentType, "content-disposition": `attachment; filename="${document.originalName.replaceAll('"', "")}"`, "cache-control": "no-store" } });
  }

  const actionMatch = path.match(/^orders\/([^/]+)\/action$/);
  if (req.method === "POST" && actionMatch) {
    const input = await bodyJson<Record<string, unknown>>(req);
    if (!input) return json(400, { error: "invalid_json" });
    const order = await getJson<Order>(keys.order(decodeURIComponent(actionMatch[1])));
    if (!order) return json(404, { error: "order_not_found" });
    const action = String(input.action || "");
    let updated: Order = { ...order, updatedAt: nowIso() };
    if (action === "payment_cleared") {
      if (order.status !== "paid") return json(409, { error: "payment_not_paid", status: order.status });
      updated = { ...updated, status: "payment_cleared", paymentClearedAt: nowIso() };
    } else if (action === "release_intake") {
      if (order.status !== "payment_cleared") return json(409, { error: "payment_not_cleared", status: order.status });
      updated = { ...updated, status: "intake_released", intakeReleasedAt: nowIso() };
    } else if (action === "activate") {
      if (order.status !== "intake_released") return json(409, { error: "intake_not_released", status: order.status });
      updated = { ...updated, status: "active" };
    } else if (action === "cancel") {
      if (["paid", "payment_cleared", "intake_released", "active"].includes(order.status)) return json(409, { error: "use_finance_control_for_paid_order" });
      updated = { ...updated, status: "cancelled" };
    } else {
      return json(422, { error: "unknown_order_action" });
    }
    await putJson(keys.order(updated.id), updated);
    await writeAudit({ kind: `order.${action}`, entityType: "order", entityId: updated.id, actor: "ops", detail: { by: auth.username } });
    return json(200, { ok: true, order: updated });
  }

  const documentAction = path.match(/^documents\/([^/]+)\/action$/);
  if (req.method === "POST" && documentAction) {
    const input = await bodyJson<Record<string, unknown>>(req);
    if (!input) return json(400, { error: "invalid_json" });
    const document = await getJson<DocumentRecord>(keys.document(decodeURIComponent(documentAction[1])));
    if (!document) return json(404, { error: "document_not_found" });
    const action = String(input.action || "");
    let updated: DocumentRecord;
    if (action === "mark_manual_clean") updated = { ...document, status: "manual_clean", reviewedAt: nowIso(), reviewedBy: auth.username };
    else if (action === "reject") updated = { ...document, status: "rejected", reviewedAt: nowIso(), reviewedBy: auth.username, rejectionReason: multiline(input.reason, 500) || "Rejected by manual security review" };
    else return json(422, { error: "unknown_document_action" });
    await putJson(keys.document(updated.id), updated);
    await writeAudit({ kind: `document.${action}`, entityType: "document", entityId: updated.id, actor: "ops", detail: { by: auth.username } });
    return json(200, { ok: true, document: updated });
  }

  return json(404, { error: "ops_route_not_found" });
};

export const config: Config = { path: ["/api/ops", "/api/ops/*"] };
