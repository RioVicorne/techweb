"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/browser";

type Mode = "login" | "signup";

function toVietnameseAuthError(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "Email hoặc mật khẩu không đúng.";
  }
  if (normalized.includes("email not confirmed")) {
    return "Email chưa được xác nhận. Vui lòng kiểm tra hộp thư để xác thực tài khoản.";
  }
  if (normalized.includes("user already registered")) {
    return "Email này đã được đăng ký.";
  }
  if (normalized.includes("password should be at least")) {
    return "Mật khẩu chưa đủ độ dài tối thiểu.";
  }

  return message;
}

export function LoginClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const returnTo = sp.get("returnTo") || "/";
  const supabase = useMemo(() => getSupabaseBrowser(), []);

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const heroText = "ENGINEERED FOR VELOCITY.";
  const accentWord = "VELOCITY";
  const [typedLength, setTypedLength] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCaret, setShowCaret] = useState(true);
  const typingDelayMs = 120;
  const deletingDelayMs = 70;
  const pauseAfterTypedMs = 5000;
  const pauseBeforeRetypeMs = 450;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const atEnd = typedLength >= heroText.length;
      const atStart = typedLength <= 0;

      if (!isDeleting && atEnd) {
        setIsDeleting(true);
        return;
      }

      if (isDeleting && atStart) {
        setIsDeleting(false);
        return;
      }

      setTypedLength((prev) => prev + (isDeleting ? -1 : 1));
    },
    !isDeleting && typedLength >= heroText.length
      ? pauseAfterTypedMs
      : isDeleting && typedLength <= 0
        ? pauseBeforeRetypeMs
        : isDeleting
          ? deletingDelayMs
          : typingDelayMs);

    return () => window.clearTimeout(timer);
  }, [heroText.length, isDeleting, typedLength]);

  useEffect(() => {
    const caretTimer = setInterval(() => {
      setShowCaret((prev) => !prev);
    }, 500);

    return () => clearInterval(caretTimer);
  }, []);

  const typedHeroText = heroText.slice(0, typedLength);
  const accentStart = heroText.indexOf(accentWord);
  const accentEnd = accentStart + accentWord.length;
  const typedBeforeAccent = typedHeroText.slice(
    0,
    Math.min(typedHeroText.length, accentStart),
  );
  const typedAccent =
    typedHeroText.length > accentStart
      ? typedHeroText.slice(accentStart, Math.min(typedHeroText.length, accentEnd))
      : "";
  const typedAfterAccent =
    typedHeroText.length > accentEnd ? typedHeroText.slice(accentEnd) : "";
  const isSignup = mode === "signup";

  const switchMode = useCallback(
    (
      nextMode: Mode,
      options?: { keepNotice?: boolean; allowWhileBusy?: boolean },
    ) => {
      if (nextMode === mode) return;
      if (busy && !options?.allowWhileBusy) return;
      setError(null);
      if (!options?.keepNotice) {
        setNotice(null);
      }
      setMode(nextMode);
    },
    [busy, mode],
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    const em = email.trim();
    if (!em || !password) {
      setError("Vui lòng nhập email và mật khẩu.");
      return;
    }

    if (mode === "signup") {
      if (!confirmPassword) {
        setError("Vui lòng nhập xác nhận mật khẩu.");
        return;
      }

      if (password !== confirmPassword) {
        setError("Mật khẩu xác nhận không khớp.");
        return;
      }
    }

    setBusy(true);
    try {
      if (!remember) {
        // Supabase JS uses localStorage by default; to emulate session-only, we sign in then
        // immediately set session persistence off by clearing storage on unload.
        // Keeping simple for demo: still sign in normally.
      }

      if (mode === "login") {
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: em,
          password,
        });
        if (signInErr) throw signInErr;
        router.replace(returnTo);
        return;
      }

      const { error: signUpErr } = await supabase.auth.signUp({
        email: em,
        password,
      });
      if (signUpErr) throw signUpErr;
      setNotice(
        "Tạo tài khoản thành công. Nếu bật email confirm, hãy kiểm tra inbox rồi đăng nhập.",
      );
      switchMode("login", { keepNotice: true, allowWhileBusy: true });
    } catch (err) {
      setError(
        err instanceof Error
          ? toVietnameseAuthError(err.message)
          : "Đăng nhập thất bại",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="flex min-h-[100dvh] items-center p-4 pt-24 lg:pt-4"
      style={{
        background:
          "radial-gradient(circle at 20% 30%, rgba(133, 173, 255, 0.05) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(255, 108, 144, 0.05) 0%, transparent 40%)",
      }}
    >
      <div className="relative mx-auto grid w-full max-w-6xl grid-cols-1 overflow-hidden rounded-[2rem] border border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.5)] md:grid-cols-2">
        {/* Left (Desktop only) */}
        <div
          className={`relative hidden flex-col justify-between overflow-hidden p-12 md:flex md:transform-gpu md:transition-transform md:duration-700 md:ease-[cubic-bezier(0.22,1,0.36,1)] ${
            isSignup ? "md:translate-x-full" : "md:translate-x-0"
          }`}
          style={{
            background: "var(--stitch-color-surface-container-low)",
          }}
        >
          <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-0 bg-gradient-to-br from-[color:var(--stitch-color-primary)]/20 via-transparent to-[color:var(--stitch-color-secondary)]/10" />
            <div className="login-shape login-shape-a absolute -left-10 top-12 h-44 w-44 rotate-12 rounded-[2.5rem] border border-[color:var(--stitch-color-primary)]/35 bg-[color:var(--stitch-color-primary)]/10" />
            <div className="login-shape login-shape-b absolute right-8 top-20 h-32 w-32 rounded-full border-2 border-[color:var(--stitch-color-secondary)]/45" />
            <div className="login-shape login-shape-c absolute bottom-24 left-20 h-24 w-24 rotate-45 rounded-2xl border border-[color:var(--stitch-color-tertiary)]/50 bg-[color:var(--stitch-color-tertiary)]/10" />
            <div className="login-shape login-shape-d absolute bottom-14 right-16 h-48 w-48 rounded-[3rem] border border-[color:var(--stitch-color-primary)]/20" />
            <div className="login-shape login-shape-e absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-white/30" />
          </div>

          <div className="relative z-10">
            <Link href="/" className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg shadow-[0_0_15px_rgba(133,173,255,0.4)]"
                style={{ background: "var(--stitch-color-primary)" }}
              >
                <span
                  className="material-symbols-outlined font-bold"
                  style={{ color: "var(--stitch-color-on-primary-container)" }}
                >
                  bolt
                </span>
              </div>
              <span
                className="text-2xl font-bold tracking-tighter"
                style={{ fontFamily: "var(--stitch-font-headline)" }}
              >
                CYBERPULSE
              </span>
            </Link>
          </div>

          <div className="relative z-10">
            <h1
              className="mb-6 text-5xl font-bold leading-tight"
              style={{ fontFamily: "var(--stitch-font-headline)" }}
            >
              <span>{typedBeforeAccent}</span>
              {typedAccent ? (
                <span
                  style={{
                    color: "var(--stitch-color-primary)",
                    fontStyle: "italic",
                  }}
                >
                  {typedAccent}
                </span>
              ) : null}
              <span>{typedAfterAccent}</span>
              {showCaret ? <span className="ml-1 text-white/80">|</span> : null}
            </h1>
            <p
              className="max-w-md text-lg font-medium"
              style={{ color: "var(--stitch-color-on-surface-variant)" }}
            >
              Access the next generation of high-performance tech ecosystem.
              Your kinetic journey starts here.
            </p>
          </div>

          <div
            className="relative z-10 rounded-2xl border p-4"
            style={{
              borderColor:
                "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 24%, transparent)",
              background:
                "color-mix(in srgb, var(--stitch-color-surface-container-high) 70%, transparent)",
            }}
          >
            <p
              className="text-xs font-bold uppercase tracking-[0.2em]"
              style={{ color: "var(--stitch-color-on-surface-variant)" }}
            >
              Trạng thái nền tảng
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl border px-2 py-3" style={{ borderColor: "var(--stitch-color-outline-variant)" }}>
                <span className="material-symbols-outlined text-xl" style={{ color: "var(--stitch-color-primary)" }}>
                  shield_lock
                </span>
                <p className="mt-1 text-[11px] font-semibold text-white">Bảo mật</p>
                <p className="text-[10px]" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                  SSL 256-bit
                </p>
              </div>
              <div className="rounded-xl border px-2 py-3" style={{ borderColor: "var(--stitch-color-outline-variant)" }}>
                <span className="material-symbols-outlined text-xl" style={{ color: "var(--stitch-color-primary)" }}>
                  speed
                </span>
                <p className="mt-1 text-[11px] font-semibold text-white">Hiệu năng</p>
                <p className="text-[10px]" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                  Tối ưu realtime
                </p>
              </div>
              <div className="rounded-xl border px-2 py-3" style={{ borderColor: "var(--stitch-color-outline-variant)" }}>
                <span className="material-symbols-outlined text-xl" style={{ color: "var(--stitch-color-primary)" }}>
                  support_agent
                </span>
                <p className="mt-1 text-[11px] font-semibold text-white">Hỗ trợ</p>
                <p className="text-[10px]" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                  24/7 liên tục
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right */}
        <div
          className={`relative flex flex-col justify-center overflow-hidden p-8 md:p-16 md:transform-gpu md:transition-transform md:duration-700 md:ease-[cubic-bezier(0.22,1,0.36,1)] ${
            isSignup ? "md:-translate-x-full" : "md:translate-x-0"
          }`}
          style={{
            background: "rgba(24, 24, 43, 0.7)",
            backdropFilter: "blur(20px)",
          }}
        >
          <div className="relative z-10">
            <div className="mb-10">
              <h2
                className="mb-2 text-3xl font-bold text-white"
                style={{ fontFamily: "var(--stitch-font-headline)" }}
              >
                {mode === "login" ? "Chào mừng quay lại" : "Tạo tài khoản"}
              </h2>
              <p
                className="font-medium"
                style={{ color: "var(--stitch-color-on-surface-variant)" }}
              >
                {mode === "login"
                  ? "Nhập thông tin để đăng nhập và đồng bộ tài khoản"
                  : "Tạo tài khoản để tiếp tục thanh toán."}
              </p>
            </div>

            <form className="space-y-6" onSubmit={onSubmit}>
            {error ? (
              <p className="px-1 text-sm font-medium text-red-400">
                {error}
              </p>
            ) : null}

            <div>
              <label
                className="mb-2 ml-1 block text-xs font-bold uppercase tracking-widest"
                style={{ color: "var(--stitch-color-on-surface-variant)" }}
              >
                Tài khoản
              </label>
              <div className="group relative">
                <div
                  className="pointer-events-none absolute inset-y-0 left-4 flex items-center transition-colors"
                  style={{ color: "var(--stitch-color-outline)" }}
                >
                  <span className="material-symbols-outlined">
                    alternate_email
                  </span>
                </div>
                <input
                  className="w-full rounded-xl border py-4 pl-12 pr-4 text-white placeholder:text-[color:var(--stitch-color-outline-variant)] outline-none transition-all focus:ring-2 focus:ring-[color:var(--stitch-color-primary)]/50"
                  style={{
                    background: "var(--stitch-color-surface-container-high)",
                    borderColor: error ? "#ef4444" : "transparent",
                  }}
                  placeholder="Email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <div className="mb-2 ml-1 flex items-center justify-between">
                <label
                  className="block text-xs font-bold uppercase tracking-widest"
                  style={{ color: "var(--stitch-color-on-surface-variant)" }}
                >
                  Mật khẩu
                </label>
                <span
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: "var(--stitch-color-secondary-dim)" }}
                >
                  {/* placeholder */}
                </span>
              </div>
              <div className="group relative">
                <div
                  className="pointer-events-none absolute inset-y-0 left-4 flex items-center transition-colors"
                  style={{ color: "var(--stitch-color-outline)" }}
                >
                  <span className="material-symbols-outlined">lock_open</span>
                </div>
                <input
                  className="w-full rounded-xl border py-4 pl-12 pr-12 text-white placeholder:text-[color:var(--stitch-color-outline-variant)] outline-none transition-all focus:ring-2 focus:ring-[color:var(--stitch-color-primary)]/50"
                  style={{
                    background: "var(--stitch-color-surface-container-high)",
                    borderColor: error ? "#ef4444" : "transparent",
                  }}
                  placeholder="••••••••"
                  type={showPw ? "text" : "password"}
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  className="absolute inset-y-0 right-4 flex items-center transition-colors"
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  style={{ color: "var(--stitch-color-outline)" }}
                  aria-label={showPw ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  <span className="material-symbols-outlined">
                    {showPw ? "visibility" : "visibility_off"}
                  </span>
                </button>
              </div>
            </div>

            {mode === "signup" ? (
              <div>
                <label
                  className="mb-2 ml-1 block text-xs font-bold uppercase tracking-widest"
                  style={{ color: "var(--stitch-color-on-surface-variant)" }}
                >
                  Xác nhận mật khẩu
                </label>
                <div className="group relative">
                  <div
                    className="pointer-events-none absolute inset-y-0 left-4 flex items-center transition-colors"
                    style={{ color: "var(--stitch-color-outline)" }}
                  >
                    <span className="material-symbols-outlined">lock</span>
                  </div>
                  <input
                    className="w-full rounded-xl border py-4 pl-12 pr-12 text-white placeholder:text-[color:var(--stitch-color-outline-variant)] outline-none transition-all focus:ring-2 focus:ring-[color:var(--stitch-color-primary)]/50"
                    style={{
                      background: "var(--stitch-color-surface-container-high)",
                      borderColor: error ? "#ef4444" : "transparent",
                    }}
                    placeholder="••••••••"
                    type={showConfirmPw ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button
                    className="absolute inset-y-0 right-4 flex items-center transition-colors"
                    type="button"
                    onClick={() => setShowConfirmPw((v) => !v)}
                    style={{ color: "var(--stitch-color-outline)" }}
                    aria-label={showConfirmPw ? "Ẩn xác nhận mật khẩu" : "Hiện xác nhận mật khẩu"}
                  >
                    <span className="material-symbols-outlined">
                      {showConfirmPw ? "visibility" : "visibility_off"}
                    </span>
                  </button>
                </div>
              </div>
            ) : null}

            <div className="flex items-center gap-2 px-1">
              <input
                id="remember"
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-5 w-5 rounded"
              />
              <label
                htmlFor="remember"
                className="cursor-pointer select-none text-sm font-medium"
                style={{ color: "var(--stitch-color-on-surface-variant)" }}
              >
                Duy trì đăng nhập
              </label>
            </div>

            {notice ? (
              <div
                className="rounded-xl border px-4 py-3 text-sm"
                style={{
                  borderColor:
                    "color-mix(in srgb, var(--stitch-color-primary) 35%, transparent)",
                  color: "var(--stitch-color-on-surface)",
                }}
              >
                {notice}
              </div>
            ) : null}

            <button
              className="flex w-full items-center justify-center gap-2 rounded-xl py-4 text-lg font-bold transition-all active:scale-[0.98] disabled:opacity-60"
              style={{
                background:
                  "linear-gradient(135deg, var(--stitch-color-primary) 0%, var(--stitch-color-primary-dim, var(--stitch-color-primary)) 100%)",
                color: "var(--stitch-color-on-primary-fixed, black)",
                boxShadow: "0 0 25px rgba(133,173,255,0.3)",
              }}
              type="submit"
              disabled={busy}
            >
              <span>
                {mode === "login" ? "ĐĂNG NHẬP" : "TẠO TÀI KHOẢN"}
              </span>
              <span className="material-symbols-outlined">
                {mode === "login" ? "login" : "person_add"}
              </span>
            </button>
          </form>

          <div className="mt-12 text-center">
            {mode === "login" ? (
              <p
                className="font-medium"
                style={{ color: "var(--stitch-color-on-surface-variant)" }}
              >
                Chưa có tài khoản?{" "}
                <button
                  type="button"
                  className="ml-1 font-bold underline underline-offset-4"
                  style={{ color: "var(--stitch-color-primary)" }}
                  onClick={() => switchMode("signup")}
                >
                  Đăng ký ngay
                </button>
              </p>
            ) : (
              <p
                className="font-medium"
                style={{ color: "var(--stitch-color-on-surface-variant)" }}
              >
                Đã có tài khoản?{" "}
                <button
                  type="button"
                  className="ml-1 font-bold underline underline-offset-4"
                  style={{ color: "var(--stitch-color-primary)" }}
                  onClick={() => switchMode("login")}
                >
                  Đăng nhập
                </button>
              </p>
            )}
          </div>

          <div
            className="mt-6 text-center text-xs"
            style={{ color: "var(--stitch-color-on-surface-variant)" }}
          >
            <Link href="/" className="font-bold hover:underline">
              Quay lại cửa hàng
            </Link>
          </div>
          </div>
        </div>
      </div>

    </div>
  );
}
