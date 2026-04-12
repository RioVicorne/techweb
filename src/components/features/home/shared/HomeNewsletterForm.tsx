"use client";

import { useState } from "react";

const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

export function HomeNewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");
  const [msg, setMsg] = useState("");

  function submit() {
    const t = email.trim();
    if (!t) {
      setStatus("err");
      setMsg("Vui lòng nhập email.");
      return;
    }
    if (!emailOk(t)) {
      setStatus("err");
      setMsg("Email không hợp lệ.");
      return;
    }
    setStatus("ok");
    setMsg("Đã ghi nhận — bạn sẽ nhận thông tin ưu đãi qua email.");
    setEmail("");
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <label htmlFor="footer-newsletter-email" className="sr-only">
          Email nhận bản tin
        </label>
        <input
          id="footer-newsletter-email"
          type="email"
          autoComplete="email"
          placeholder="Địa chỉ email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status !== "idle") {
              setStatus("idle");
              setMsg("");
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          className="w-full rounded-xl border px-4 py-3 pr-12 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--stitch-color-secondary)]"
          style={{
            background: "var(--stitch-color-surface-container)",
            borderColor:
              "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 30%, transparent)",
            color: "var(--stitch-color-on-surface)",
          }}
        />
        <button
          type="button"
          className="absolute right-2 top-1/2 flex h-10 w-10 min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center rounded-lg transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--stitch-color-secondary)] active:scale-95"
          style={{ color: "var(--stitch-color-primary)" }}
          aria-label="Đăng ký nhận bản tin"
          onClick={submit}
        >
          <span className="material-symbols-outlined" aria-hidden>
            send
          </span>
        </button>
      </div>
      <p
        className="min-h-[1.25rem] text-xs"
        style={{
          color:
            status === "err"
              ? "var(--stitch-color-error)"
              : "var(--stitch-color-on-surface-variant)",
        }}
        aria-live="polite"
      >
        {status === "idle" ? "" : msg}
      </p>
    </div>
  );
}
