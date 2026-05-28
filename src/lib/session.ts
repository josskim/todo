import crypto from "node:crypto";

export const SESSION_COOKIE = "todo_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

type SessionCookieStore = {
  set(name: string, value: string, options: ReturnType<typeof buildSessionCookieOptions>): void;
  delete(name: string): void;
};

function getSessionSecret() {
  return process.env.SESSION_SECRET || "todo-dev-session-secret";
}

function base64Url(input: string) {
  return Buffer.from(input).toString("base64url");
}

export function createSessionToken(userId: string) {
  const expiresAt = Date.now() + SESSION_MAX_AGE * 1000;
  const payload = `${userId}.${expiresAt}`;
  const signature = crypto
    .createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("base64url");
  return `${base64Url(payload)}.${signature}`;
}

export function verifySessionToken(token: string) {
  const [payloadB64, signature] = token.split(".");
  if (!payloadB64 || !signature) return null;

  const payload = Buffer.from(payloadB64, "base64url").toString("utf8");
  const [userId, expiresAtText] = payload.split(".");
  if (!userId || !expiresAtText) return null;

  const expectedSignature = crypto
    .createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("base64url");

  const sigA = Buffer.from(signature);
  const sigB = Buffer.from(expectedSignature);
  if (sigA.length !== sigB.length || !crypto.timingSafeEqual(sigA, sigB)) {
    return null;
  }

  const expiresAt = Number(expiresAtText);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return null;

  return { userId, expiresAt };
}

export function buildSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
}

export function setSessionCookie(cookieStore: SessionCookieStore, token: string) {
  cookieStore.set(SESSION_COOKIE, token, buildSessionCookieOptions());
}

export function clearSessionCookie(cookieStore: SessionCookieStore) {
  cookieStore.delete(SESSION_COOKIE);
}
