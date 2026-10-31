import { timingSafeEqual } from "node:crypto";

const jsonHeaders = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };

export function json(status: number, payload: unknown) {
  return new Response(JSON.stringify(payload), { status, headers: jsonHeaders });
}

export function method(req: Request, allowed: string[]) {
  if (allowed.includes(req.method.toUpperCase())) return null;
  return json(405, { error: "method_not_allowed", allowed });
}

export function clientIp(req: Request) {
  return req.headers.get("x-nf-client-connection-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export function publicBaseUrl(req: Request) {
  const configured = process.env.URL?.trim();
  return (configured && /^https:\/\//.test(configured) ? configured : new URL(req.url).origin).replace(/\/$/, "");
}

export async function bodyJson<T extends Record<string, unknown>>(req: Request): Promise<T | null> {
  try {
    const value = await req.json();
    return value && typeof value === "object" && !Array.isArray(value) ? (value as T) : null;
  } catch {
    return null;
  }
}

export function noStore(response: Response) {
  response.headers.set("cache-control", "no-store");
  return response;
}

export function opsIdentity(req: Request) {
  const expectedUser = process.env.OPS_USERNAME;
  const expectedPassword = process.env.OPS_PASSWORD;
  if (!expectedUser || !expectedPassword) return null;
  const header = req.headers.get("authorization") || "";
  if (!header.startsWith("Basic ")) return null;
  try {
    const [username, password] = Buffer.from(header.slice(6), "base64").toString("utf8").split(":");
    const userOk = username && username.length === expectedUser.length && timingSafeEqual(Buffer.from(username), Buffer.from(expectedUser));
    const passwordOk = password && password.length === expectedPassword.length && timingSafeEqual(Buffer.from(password), Buffer.from(expectedPassword));
    return userOk && passwordOk ? username : null;
  } catch {
    return null;
  }
}

export function requireOps(req: Request) {
  const username = opsIdentity(req);
  if (username) return { username };
  return null;
}

export function unauthorizedOps() {
  return new Response(JSON.stringify({ error: "ops_auth_required" }), {
    status: 401,
    headers: { ...jsonHeaders, "www-authenticate": 'Basic realm="BatteryDocs Operations", charset="UTF-8"' },
  });
}
