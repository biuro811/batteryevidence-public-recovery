import type { Config } from "@netlify/functions";
import { createHash } from "node:crypto";
import { json, method } from "./lib/http";
import { isAllowedDocument, nowIso, opaqueId, type DocumentRecord, type Order, verifyToken } from "./lib/model";
import { getJson, keys, listDocuments, putDocumentBody, putJson, writeAudit } from "./lib/store";

function readToken(req: Request, url: URL) {
  const authorization = req.headers.get("authorization") || "";
  return authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : url.searchParams.get("token") || "";
}

export default async (req: Request) => {
  const invalidMethod = method(req, ["GET", "POST"]);
  if (invalidMethod) return invalidMethod;
  const url = new URL(req.url);
  const orderId = url.searchParams.get("reference") || req.headers.get("x-batterydocs-order") || "";
  const order = await getJson<Order>(keys.order(orderId));
  if (!order) return json(404, { error: "order_not_found" });
  if (!verifyToken(readToken(req, url), order.accessTokenHash)) return json(403, { error: "intake_access_denied" });
  if (!["intake_released", "active"].includes(order.status)) return json(423, { error: "intake_not_released", status: order.status, message: "A private intake is released only after verified payment and an authorised operations decision." });

  if (req.method === "GET") {
    const documents: DocumentRecord[] = (await listDocuments()).filter(document => document.orderId === order.id);
    const publicDocuments = documents.map(document => ({
      id: document.id,
      originalName: document.originalName,
      bytes: document.bytes,
      sha256: document.sha256,
      createdAt: document.createdAt,
      status: document.status,
      rejectionReason: document.rejectionReason,
    }));
    return json(200, { ok: true, order: { id: order.id, title: order.title, status: order.status, intakeReleasedAt: order.intakeReleasedAt }, documents: publicDocuments, notice: "Uploads enter a private quarantine state. They are not automatically malware-scanned in this deployment and must be manually reviewed before they are available to operations." });
  }

  const name = decodeURIComponent(req.headers.get("x-file-name") || "").replace(/[\\/\u0000]/g, "_").slice(0, 180);
  const contentType = (req.headers.get("content-type") || "application/octet-stream").split(";")[0].trim();
  if (!name || !isAllowedDocument(name, contentType)) return json(422, { error: "file_type_not_allowed", message: "Only PDF, XLSX and CSV files are accepted." });
  const bytes = await req.arrayBuffer();
  if (bytes.byteLength < 1 || bytes.byteLength > 10 * 1024 * 1024) return json(413, { error: "file_size_not_allowed", message: "Each file must be no larger than 10 MB." });
  const id = opaqueId("BD-D");
  const record: DocumentRecord = {
    id,
    orderId: order.id,
    createdAt: nowIso(),
    originalName: name,
    contentType,
    bytes: bytes.byteLength,
    sha256: createHash("sha256").update(Buffer.from(bytes)).digest("hex"),
    status: "quarantined_pending_review",
    storageKey: keys.documentContent(id),
  };
  await putDocumentBody(record.storageKey, new Blob([bytes], { type: contentType }));
  await putJson(keys.document(record.id), record);
  await writeAudit({ kind: "document.quarantined", entityType: "document", entityId: record.id, actor: "customer", detail: { orderId: order.id, bytes: record.bytes, contentType } });
  return json(201, { ok: true, document: { id: record.id, originalName: record.originalName, bytes: record.bytes, sha256: record.sha256, status: record.status } });
};

export const config: Config = { path: "/api/intake/*" };
