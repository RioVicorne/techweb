import { AccountClient } from "@/app/account/AccountClient";
import { Suspense } from "react";

export default function AccountPage() {
  return (
    <div className="min-h-screen">
      <Suspense
        fallback={
          <main className="mx-auto max-w-screen-2xl px-6 pb-20 pt-28 md:px-12">
            <div
              className="rounded-3xl border p-8"
              style={{
                background: "var(--stitch-color-surface-container)",
                borderColor:
                  "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 10%, transparent)",
              }}
            >
              <p className="text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                Đang tải...
              </p>
            </div>
          </main>
        }
      >
        <AccountClient />
      </Suspense>
    </div>
  );
}

