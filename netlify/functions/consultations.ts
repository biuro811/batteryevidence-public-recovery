import type { Config } from "@netlify/functions";
import { bodyJson, clientIp, json, method } from "./lib/http";
import { multiline, normaliseEmail, nowIso, opaqueId, text, type Consultation } from "./lib/model";
import { checkRateLimit, keys, putJson, writeAudit } from "./lib/store";

export default async (req: Request) => {
  const invalidMethod = method(req, ["POST"]);
  if (invalidMethod) return invalidMethod;
  if (!(await checkRateLimit("consultation", clientIp(req), 5))) return json(429, { error: "rate_limited", message: "Please try again later." });

  const input = await bodyJson<Record<string, unknown>>(req);
  if (!input) return json(400, { error: "invalid_json" });
  if (text(input.website, 200)) return json(202, { ok: true, reference: "BD-RECEIVED" });

  const name = text(input.name, 160);
  const workEmail = normaliseEmail(input.workEmail);
  const company = text(input.company, 200);
  const timezone = text(input.timezone, 80);
  const preferredWindow = text(input.preferredWindow, 240);
  if (!name || !workEmail || !company || !timezone || !preferredWindow || input.privacyAccepted !== true) {
    return json(422, { error: "invalid_consultation", message: "Name, work email, company, timezone, preferred window and privacy acknowledgement are required." });
  }

  const createdAt = nowIso();
  const consultation: Consultation = {
    id: opaqueId("BD-C"),
    createdAt,
    name,
    workEmail,
    company,
    timezone,
    preferredWindow,
    discussionPoint: multiline(input.discussionPoint, 2000) || undefined,
    privacyAcceptedAt: createdAt,
    status: "new",
  };
  await putJson(keys.consultation(consultation.id), consultation);
  await writeAudit({ kind: "consultation.created", entityType: "consultation", entityId: consultation.id, actor: "public", detail: { timezone } });
  await putJson(`outbox/${opaqueId("OUT")}.json`, { type: "consultation.created", consultationId: consultation.id, createdAt, state: "pending_owner_notification" });

  return json(201, { ok: true, reference: consultation.id, message: "Your consultation request has been recorded. A coordinator will confirm any meeting separately." });
};

export const config: Config = { path: "/api/consultations", method: "POST" };
