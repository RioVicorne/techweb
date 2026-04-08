"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/browser";

type Mode = "login" | "signup";

export function LoginClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const returnTo = sp.get("returnTo") || "/";
  const supabase = useMemo(() => getSupabaseBrowser(), []);

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    const em = email.trim();
    if (!em || !password) {
      setError("Vui lòng nhập email và mật khẩu.");
      return;
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
      setNotice("Tạo tài khoản thành công. Nếu bật email confirm, hãy kiểm tra inbox rồi đăng nhập.");
      setMode("login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng nhập thất bại");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="min-h-dvh p-4"
      style={{
        background:
          "radial-gradient(circle at 20% 30%, rgba(133, 173, 255, 0.05) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(255, 108, 144, 0.05) 0%, transparent 40%)",
      }}
    >
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 overflow-hidden rounded-[2rem] border border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.5)] md:grid-cols-2">
        {/* Left (Desktop only) */}
        <div
          className="relative hidden flex-col justify-between overflow-hidden p-12 md:flex"
          style={{ background: "var(--stitch-color-surface-container-low)" }}
        >
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-gradient-to-br from-[color:var(--stitch-color-primary)]/20 via-transparent to-[color:var(--stitch-color-secondary)]/10" />
            <div
              className="h-full w-full opacity-10"
              style={{
                backgroundImage: "radial-gradient(circle, #85adff 1px, transparent 1px)",
                backgroundSize: "30px 30px",
              }}
            />
          </div>

          <div className="relative z-10">
            <Link href="/" className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg shadow-[0_0_15px_rgba(133,173,255,0.4)]"
                style={{ background: "var(--stitch-color-primary)" }}
              >
                <span className="material-symbols-outlined font-bold" style={{ color: "var(--stitch-color-on-primary-container)" }}>
                  bolt
                </span>
              </div>
              <span className="text-2xl font-bold tracking-tighter" style={{ fontFamily: "var(--stitch-font-headline)" }}>
                CYBERPULSE
              </span>
            </Link>
          </div>

          <div className="relative z-10">
            <h1 className="mb-6 text-5xl font-bold leading-tight" style={{ fontFamily: "var(--stitch-font-headline)" }}>
              ENGINEERED FOR{" "}
              <span style={{ color: "var(--stitch-color-primary)", fontStyle: "italic" }}>VELOCITY</span>.
            </h1>
            <p className="max-w-md text-lg font-medium" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
              Access the next generation of high-performance tech ecosystem. Your kinetic journey starts here.
            </p>
          </div>

          <div className="relative z-10 flex gap-4">
            <div className="flex -space-x-3">
              {[
                "https://lh3.googleusercontent.com/aida-public/AB6AXuD2MSvS0jcZxl3TwbrDOPnomEEG-abvtWjBgiyvNkwdSNuHny2x_yUoteUvjZR_Qo3dqLKIHwN2i1lLlOxzKsv7RfLWKeCwmuhVc4l3XyMtQXCunN7EWNTWI5VnAPds2uHDVpiRDv-8DFjNUz4dFApTH2xIJhstRRT-RjkO6rJXbg_nr4Wu7tcexONw5iwDxNrDrqmXAHhy_S5b3-1iKF6OKug_LpBrzTGgzdnFe2Nh0RTO78Im8x-a9L2OufHYs7hSUSV7MlQ8WYGA",
                "https://lh3.googleusercontent.com/aida-public/AB6AXuDdjs8Ak4NEXbTgvqCSFEI_TR2CNvbkpHsXlUOFU21AErloZT4BePBulr8rL47CjPwb1vO2gRHCOBnycY87CgyyavPBX_xUn6P09jZzYVx02gZlUqCYcPF84GMpfNgTBAVUaKrJqHUKT3zXaJBzyaMsPe3RCQ-0OsERCc5g79CJEV4h7oWOnRZozA_kpNPOKtsN1cascODfP6MzfJHmRBH32SQ4C2yO6y6uAJlayrprKeriWHhf22usNpE2i11LBuAiEADU_JfL5AtW",
                "https://lh3.googleusercontent.com/aida-public/AB6AXuCaEVqJLrtcX1gjw2n7kQb0DVnaXcwBlpakLLJi4y8QoGZkpyC-LZZmLwNTN4N993FAZT4FCN8xXbd7N8ne7Eb_OTxmO8g4aBrEC3ZvMXtTniuffSBqTXvVjkXrdL9yjYu-L57H4S57L7PzBqukcWLwnWxaJXnRHZnmqh_z05JZWqhe_GI9a1523fC02tWyia2W1LCmb4JRr-15nIgFKZcSUUwJllheTy4inmmb1VAFN7hayETCbujfvqe-2WhcmV5iTNEX9x9aBPaJ",
              ].map((src, i) => (
                <div
                  key={src}
                  className="h-10 w-10 overflow-hidden rounded-full border-2"
                  style={{ borderColor: "var(--stitch-color-surface-container-low)" }}
                  aria-label={`Member ${i + 1}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img alt="" src={src} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
            <div className="text-sm font-medium">
              <p className="text-white">50k+ Members</p>
              <p style={{ color: "var(--stitch-color-on-surface-variant)" }}>Live in the pulse</p>
            </div>
          </div>
        </div>

        {/* Right */}
        <div
          className="flex flex-col justify-center p-8 md:p-16"
          style={{ background: "rgba(24, 24, 43, 0.7)", backdropFilter: "blur(20px)" }}
        >
          <div className="mb-10">
            <h2 className="mb-2 text-3xl font-bold text-white" style={{ fontFamily: "var(--stitch-font-headline)" }}>
              {mode === "login" ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="font-medium" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
              {mode === "login" ? "Enter your credentials to synchronize." : "Create an account to continue checkout."}
            </p>
          </div>

          <form className="space-y-6" onSubmit={onSubmit}>
            <div>
              <label className="mb-2 ml-1 block text-xs font-bold uppercase tracking-widest" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                Identity
              </label>
              <div className="group relative">
                <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center transition-colors" style={{ color: "var(--stitch-color-outline)" }}>
                  <span className="material-symbols-outlined">alternate_email</span>
                </div>
                <input
                  className="w-full rounded-xl border-none py-4 pl-12 pr-4 text-white placeholder:text-[color:var(--stitch-color-outline-variant)] outline-none transition-all focus:ring-2 focus:ring-[color:var(--stitch-color-primary)]/50"
                  style={{ background: "var(--stitch-color-surface-container-high)" }}
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
                <label className="block text-xs font-bold uppercase tracking-widest" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                  Access Key
                </label>
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--stitch-color-secondary-dim)" }}>
                  {/* placeholder */}
                </span>
              </div>
              <div className="group relative">
                <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center transition-colors" style={{ color: "var(--stitch-color-outline)" }}>
                  <span className="material-symbols-outlined">lock_open</span>
                </div>
                <input
                  className="w-full rounded-xl border-none py-4 pl-12 pr-12 text-white placeholder:text-[color:var(--stitch-color-outline-variant)] outline-none transition-all focus:ring-2 focus:ring-[color:var(--stitch-color-primary)]/50"
                  style={{ background: "var(--stitch-color-surface-container-high)" }}
                  placeholder="••••••••"
                  type={showPw ? "text" : "password"}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
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
                  <span className="material-symbols-outlined">{showPw ? "visibility" : "visibility_off"}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 px-1">
              <input
                id="remember"
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-5 w-5 rounded"
              />
              <label htmlFor="remember" className="cursor-pointer select-none text-sm font-medium" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                Maintain Active Session
              </label>
            </div>

            {error ? (
              <div className="rounded-xl border px-4 py-3 text-sm" style={{ borderColor: "color-mix(in srgb, var(--stitch-color-error) 35%, transparent)", color: "var(--stitch-color-on-surface)" }}>
                {error}
              </div>
            ) : null}
            {notice ? (
              <div className="rounded-xl border px-4 py-3 text-sm" style={{ borderColor: "color-mix(in srgb, var(--stitch-color-primary) 35%, transparent)", color: "var(--stitch-color-on-surface)" }}>
                {notice}
              </div>
            ) : null}

            <button
              className="flex w-full items-center justify-center gap-2 rounded-xl py-4 text-lg font-bold transition-all active:scale-[0.98] disabled:opacity-60"
              style={{
                background: "linear-gradient(135deg, var(--stitch-color-primary) 0%, var(--stitch-color-primary-dim, var(--stitch-color-primary)) 100%)",
                color: "var(--stitch-color-on-primary-fixed, black)",
                boxShadow: "0 0 25px rgba(133,173,255,0.3)",
              }}
              type="submit"
              disabled={busy}
            >
              <span>{mode === "login" ? "INITIALIZE LOGIN" : "CREATE ACCOUNT"}</span>
              <span className="material-symbols-outlined">{mode === "login" ? "login" : "person_add"}</span>
            </button>
          </form>

          <div className="mt-12 text-center">
            {mode === "login" ? (
              <p className="font-medium" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                New to the network?{" "}
                <button
                  type="button"
                  className="ml-1 font-bold underline underline-offset-4"
                  style={{ color: "var(--stitch-color-primary)" }}
                  onClick={() => setMode("signup")}
                >
                  Request Uplink (Sign Up)
                </button>
              </p>
            ) : (
              <p className="font-medium" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                Already have an account?{" "}
                <button
                  type="button"
                  className="ml-1 font-bold underline underline-offset-4"
                  style={{ color: "var(--stitch-color-primary)" }}
                  onClick={() => setMode("login")}
                >
                  Login
                </button>
              </p>
            )}
          </div>

          <div className="mt-6 text-center text-xs" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
            <Link href="/" className="font-bold hover:underline">
              Back to store
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

