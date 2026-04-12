import { getOptionalEnv } from "@/lib/env";

/** So khớp chuỗi theo thời gian không phụ thuộc độ dài (tránh lộ độ dài mật khẩu). */
function timingSafeEqualStr(a: string, b: string): boolean {
  const ea = new TextEncoder();
  const ba = ea.encode(a);
  const bb = ea.encode(b);
  if (ba.length !== bb.length) return false;
  let out = 0;
  for (let i = 0; i < ba.length; i++) out |= ba[i]! ^ bb[i]!;
  return out === 0;
}

/**
 * Đăng nhập admin riêng (không dùng Supabase Auth khách hàng).
 * ADMIN_EMAIL + ADMIN_PASSWORD trong env.
 */
export function getConfiguredAdminEmail(): string {
  return getOptionalEnv("ADMIN_EMAIL").trim().toLowerCase();
}

export function getConfiguredAdminPassword(): string {
  return getOptionalEnv("ADMIN_PASSWORD");
}

export function credentialsAreConfigured(): boolean {
  return Boolean(getConfiguredAdminEmail() && getConfiguredAdminPassword());
}

export function verifyAdminPassword(email: string, password: string): boolean {
  const wantEmail = getConfiguredAdminEmail();
  const wantPassword = getConfiguredAdminPassword();
  if (!wantEmail || !wantPassword) return false;
  const e = email.trim().toLowerCase();
  if (e !== wantEmail) return false;
  return timingSafeEqualStr(password, wantPassword);
}
