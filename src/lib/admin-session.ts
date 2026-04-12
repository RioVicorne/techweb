import { getOptionalEnv } from "@/lib/env";

/** HttpOnly cookie chứa token đã ký — tách khỏi session Supabase khách hàng. */
export const ADMIN_SESSION_COOKIE = "admin_session";

const MAX_AGE_SEC = 60 * 60 * 24 * 7; // 7 ngày

const enc = new TextEncoder();

function base64UrlEncodeBytes(buf: ArrayBuffer | Uint8Array): string {
  const u8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < u8.length; i++) bin += String.fromCharCode(u8[i]!);
  return btoa(bin).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function base64UrlDecodeToUint8Array(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = s.replaceAll("-", "+").replaceAll("_", "/") + pad;
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

export type AdminSessionPayload = { email: string; exp: number };

export async function signAdminSession(email: string, secret: string): Promise<string> {
  const payload: AdminSessionPayload = {
    email: email.trim().toLowerCase(),
    exp: Math.floor(Date.now() / 1000) + MAX_AGE_SEC,
  };
  const payloadRaw = JSON.stringify(payload);
  const key = await importHmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payloadRaw));
  const p64 = base64UrlEncodeBytes(enc.encode(payloadRaw));
  const s64 = base64UrlEncodeBytes(sig);
  return `${p64}.${s64}`;
}

/** Trả về email nếu token hợp lệ và chưa hết hạn. */
export async function verifyAdminSessionToken(
  token: string,
  secret: string,
): Promise<{ email: string } | null> {
  const dot = token.indexOf(".");
  if (dot === -1) return null;
  const p64 = token.slice(0, dot);
  const s64 = token.slice(dot + 1);
  if (!p64 || !s64) return null;

  let payloadRaw: string;
  try {
    payloadRaw = new TextDecoder().decode(base64UrlDecodeToUint8Array(p64));
  } catch {
    return null;
  }

  let payload: AdminSessionPayload;
  try {
    payload = JSON.parse(payloadRaw) as AdminSessionPayload;
  } catch {
    return null;
  }

  if (typeof payload.email !== "string" || typeof payload.exp !== "number") return null;
  if (payload.exp < Math.floor(Date.now() / 1000)) return null;

  let sig: Uint8Array;
  try {
    sig = base64UrlDecodeToUint8Array(s64);
  } catch {
    return null;
  }

  const key = await importHmacKey(secret);
  const ok = await crypto.subtle.verify("HMAC", key, new Uint8Array(sig), enc.encode(payloadRaw));
  if (!ok) return null;

  return { email: payload.email };
}

export function getAdminSessionSecret(): string {
  return getOptionalEnv("ADMIN_SESSION_SECRET");
}

export function adminSessionCookieOptions(path = "/") {
  const maxAge = MAX_AGE_SEC;
  return {
    httpOnly: true as const,
    path,
    maxAge,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}
