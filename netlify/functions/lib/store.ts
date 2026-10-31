import { getStore } from "@netlify/blobs";
import { createHash } from "node:crypto";
import type { AuditEvent, Consultation, DocumentRecord, Lead, Order } from "./model";
import { nowIso, opaqueId } from "./model";

const STORE_NAME = "batterydocs-workflow-v1";
const store = () => getStore(STORE_NAME);

export const keys = {
  lead: (id: string) => `leads/${id}.json`,
  consultation: (id: string) => `consultations/${id}.json`,
  order: (id: string) => `orders/${id}.json`,
  document: (id: string) => `documents/${id}.json`,
  documentContent: (id: string) => `private-documents/${id}/content`,
  webhook: (id: string) => `stripe-webhooks/${id}.json`,
  audit: (id: string) => `audit/${id}.json`,
  rate: (bucket: string, ip: string) => `rate/${bucket}/${createHash("sha256").update(ip).digest("hex")}.json`,
};

export async function putJson<T>(key: string, value: T) {
  await store().setJSON(key, value);
  return value;
}

export async function getJson<T>(key: string) {
  try {
    return (await store().get(key, { type: "json", consistency: "strong" })) as T | null;
  } catch {
    return null;
  }
}

export async function deleteKey(key: string) {
  await store().delete(key);
}

async function listJson<T>(prefix: string, limit = 200) {
  const raw = (await store().list({ prefix })) as { blobs?: Array<{ key: string }> };
  const rows = (await Promise.all((raw.blobs ?? []).slice(0, limit).map(async blob => getJson<T>(blob.key)))) as Array<T | null>;
  return rows.filter((row): row is T => row !== null);
}

export const listLeads = () => listJson<Lead>("leads/");
export const listConsultations = () => listJson<Consultation>("consultations/");
export const listOrders = () => listJson<Order>("orders/");
export const listDocuments = () => listJson<DocumentRecord>("documents/");

export async function writeAudit(event: Omit<AuditEvent, "id" | "createdAt">) {
  const record: AuditEvent = { id: opaqueId("EVT"), createdAt: nowIso(), ...event };
  await putJson(keys.audit(record.id), record);
  return record;
}

export async function checkRateLimit(bucket: string, clientIp: string, limit: number) {
  const windowKey = new Date().toISOString().slice(0, 13).replace(/[-:T]/g, "");
  const key = keys.rate(`${bucket}-${windowKey}`, clientIp || "unknown");
  const existing = await getJson<{ count: number }>(key);
  const count = (existing?.count ?? 0) + 1;
  await putJson(key, { count, updatedAt: nowIso() });
  return count <= limit;
}

export async function putDocumentBody(key: string, body: Blob) {
  await store().set(key, body);
}

export async function getDocumentBody(key: string) {
  try {
    return await store().get(key, { type: "blob", consistency: "strong" });
  } catch {
    return null;
  }
}
