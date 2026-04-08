import Link from "next/link";

export function HomeFooter() {
  return (
    <footer
      className="mt-auto w-full border-t py-12"
      style={{
        borderColor:
          "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 10%, transparent)",
        background: "var(--stitch-color-background, var(--stitch-color-surface))",
      }}
    >
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 md:grid-cols-4 md:px-12">
        <div className="space-y-6">
          <div
            className="text-lg font-bold"
            style={{
              fontFamily: "var(--stitch-font-headline)",
              color: "var(--stitch-color-primary)",
            }}
          >
            RioShop
          </div>
          <p className="text-sm leading-relaxed text-slate-500">
            Pushing the boundaries of digital commerce with elite tech for elite players. Join the
            kinetic revolution.
          </p>
          <div className="flex gap-4">
            <a
              href="#"
              className="flex h-10 w-10 items-center justify-center rounded-full transition-colors"
              style={{
                background: "var(--stitch-color-surface-container)",
                color: "var(--stitch-color-on-surface-variant)",
              }}
            >
              <span className="material-symbols-outlined text-xl">public</span>
            </a>
            <a
              href="#"
              className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:text-[var(--stitch-color-secondary)]"
              style={{
                background: "var(--stitch-color-surface-container)",
                color: "var(--stitch-color-on-surface-variant)",
              }}
            >
              <span className="material-symbols-outlined text-xl">share</span>
            </a>
          </div>
        </div>

        <div>
          <h4 className="mb-6 font-bold text-white" style={{ fontFamily: "var(--stitch-font-headline)" }}>
            Quick Links
          </h4>
          <ul className="space-y-3 text-sm text-slate-500">
            {["Support", "Gift Cards", "Terms of Service", "Privacy Policy"].map((x) => (
              <li key={x}>
                <Link href="#" className="inline-block transition hover:translate-x-1 hover:text-pink-500">
                  {x}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-6 font-bold text-white" style={{ fontFamily: "var(--stitch-font-headline)" }}>
            Account
          </h4>
          <ul className="space-y-3 text-sm text-slate-500">
            {["My Profile", "Order History", "Wishlist", "Settings"].map((x) => (
              <li key={x}>
                <Link href="#" className="inline-block transition hover:translate-x-1 hover:text-blue-400">
                  {x}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-6">
          <h4 className="font-bold text-white" style={{ fontFamily: "var(--stitch-font-headline)" }}>
            Newsletter
          </h4>
          <p className="text-sm text-slate-500">Get the latest drops directly in your inbox.</p>
          <div className="relative">
            <input
              type="email"
              placeholder="Email address"
              className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-1"
              style={{
                background: "var(--stitch-color-surface-container)",
                borderColor:
                  "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 30%, transparent)",
                color: "var(--stitch-color-on-surface)",
              }}
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2"
              style={{ color: "var(--stitch-color-primary)" }}
            >
              <span className="material-symbols-outlined">send</span>
            </button>
          </div>
        </div>
      </div>

      <div
        className="mx-auto mt-12 flex max-w-7xl flex-col items-center justify-between gap-4 border-t px-6 pt-8 md:flex-row md:px-12"
        style={{
          borderColor:
            "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 10%, transparent)",
        }}
      >
        <p className="text-xs text-slate-500">© 2026 RioShop. High-Octane Tech Editorial.</p>
        <div className="flex gap-6 opacity-50 grayscale">
          <span className="material-symbols-outlined">payments</span>
          <span className="material-symbols-outlined">credit_card</span>
          <span className="material-symbols-outlined">account_balance_wallet</span>
        </div>
      </div>
    </footer>
  );
}

