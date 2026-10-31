import type { Config } from "@netlify/functions";
import { bodyJson, clientIp, json, method } from "./lib/http";
import { isLanguage, isRoute, multiline, normaliseEmail, nowIso, opaqueId, text, type Lead } from "./lib/model";
import { checkRateLimit, keys, putJson, writeAudit } from "./lib/store";

export default async (req: Request) => {
  const invalidMethod = method(req, ["POST"]);
  if (invalidMethod) return invalidMethod;
  if (!(await checkRateLimit("scope-check", clientIp(req), 8))) return json(429, { error: "rate_limited", message: "Please try again later." });

  const input = await bodyJson<Record<string, unknown>>(req);
  if (!input) return json(400, { error: "invalid_json" });
  if (text(input.website, 200)) return json(202, { ok: true, reference: "BD-RECEIVED" });

  const name = text(input.name, 160);
  const workEmail = normaliseEmail(input.workEmail);
  const company = text(input.company, 200);
  if (!name || !workEmail || !company || !isRoute(input.serviceInterest) || input.privacyAccepted !== true) {
    return json(422, { error: "invalid_scope_check", message: "Name, work email, company, service route and privacy acknowledgement are required." });
  }

  const createdAt = nowIso();
  const lead: Lead = {
    id: opaqueId("BD-L"),
    createdAt,
    updatedAt: createdAt,
    status: "new",
    serviceInterest: input.serviceInterest,
    language: isLanguage(input.language) ? input.language : "en",
    name,
    workEmail,
    company,
    batteryModel: multiline(input.batteryModel, 300) || undefined,
    evidenceIssue: multiline(input.evidenceIssue, 2000) || undefined,
    context: multiline(input.context, 2000) || undefined,
    privacyAcceptedAt: createdAt,
    source: "public_scope_check",
  };
  await putJson(keys.lead(lead.id), lead);
  await writeAudit({ kind: "lead.created", entityType: "lead", entityId: lead.id, actor: "public", detail: { serviceInterest: lead.serviceInterest, language: lead.language } });
  await putJson(`outbox/${opaqueId("OUT")}.json`, { type: "lead.created", leadId: lead.id, createdAt, state: "pending_owner_notification" });

  return json(201, {
    ok: true,
    reference: lead.id,
    message: "Your scope-check request has been recorded. Please do not send confidential documents unless you receive a private intake link after an agreed Order Form and cleared payment.",
  });
};

export const config: Config = { path: "/api/leads", method: "POST" };
