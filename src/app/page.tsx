import Image from "next/image";
import Link from "next/link";
import { ProductCardActions } from "@/components/shop/ProductCardActions";
import { ShopHeader } from "@/components/shop/ShopHeader";
import { PRODUCTS } from "@/data/products";

const HERO_IMG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBxzUSOASNSRACLjBeOlhVmigbe3IswwZsuY3jUQnadi2RQPt_LZGhCM4obq4SvqtJc_pUWul7DmaaM4b--3HZMXZtFmNdZq-_cGcU56dKOnj5jCn-BgWtOYZV6SPxUdMnKSsasMXiqYfBRpQ7DgI0H5QNzeX6whrsfNPu8Q5QJamWgZuxHIAgsd8R3EE7jd8jUkrtBaHMcz4ldA6Ma5QRYulkuWkPLz3PVijrctHy9450N3YDyaALjbreLtUkm28ptjsBM_ArVYOIV";
const SIDE_PC =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuA47Z62c8BrfG5CNuRLmWSFY4q4m4cs-58xalHuZ8yot3n4tSfblStB0T442WrHiLNOcM1YJELo2YsfzydKCmIIRZ3TRkBbG8vhjRSYK1Pt-r2cBLnRryUgDITcCBfPTcS58qMDAyMTULLzUlobMS6-JMfn9Y7cAdFPT1TOh0rcEAo4MrUB46WRerv76vpV-EeeQl2zraD3ekptbQN6EwhNM5qqsnOxITfsD6vMo5N26wjQhRm0_FPucRqSupyzuAqCsSfNp10pCNRH";
const SIDE_CONSOLE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAzE1YCKMhk27Ad8Eef3INMQKjjreX5stonVwLUuGt4pbVANEbHZzQsx97o-Q5Ws-Ey1F8vq3S_Io2woL5MIT4eLkrgoE2kn-VXSm9nlqkBlxgoIDWmqFvbjU8BPmcgmidnULSjb0-QCqp5OnpVQtW0kZmKFmF56PaRrTF9xTvNuNIBZOmRJ1N0nYVTzrU2KeDJuZ0kfqrT4rIHxJyaAUAWfjcwoQTFmO2RaLk0vENqvuodniPI9ZxcTD4OiqscMc1h3wzbn1OIq1w6";

function StarRow({ filled, reviews }: { filled: number; reviews: string }) {
  return (
    <div className="mb-2 flex flex-wrap items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className="material-symbols-outlined text-sm"
          style={{
            fontVariationSettings: `'FILL' ${i <= filled ? 1 : 0}`,
            color:
              i <= filled
                ? "var(--stitch-color-tertiary, var(--stitch-color-secondary))"
                : "var(--stitch-color-on-surface-variant)",
          }}
        >
          star
        </span>
      ))}
      <span className="text-[10px]" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
        {reviews}
      </span>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen">
      <ShopHeader />

      <aside className="pointer-events-none fixed left-6 top-1/2 z-40 hidden -translate-y-1/2 xl:pointer-events-auto xl:flex xl:flex-col xl:gap-4">
        <div
          className="group flex h-64 w-12 cursor-pointer flex-col items-center justify-center gap-8 rounded-full py-6 transition-all hover:opacity-95"
          style={{ background: "var(--stitch-color-surface-container-high, var(--stitch-color-surface-container))" }}
        >
          <span
            className="text-[10px] font-black uppercase tracking-[0.3em]"
            style={{
              color: "var(--stitch-color-secondary)",
              writingMode: "vertical-rl",
            }}
          >
            FLASH SALE
          </span>
          <span
            className="material-symbols-outlined animate-pulse"
            style={{ color: "var(--stitch-color-secondary)" }}
          >
            bolt
          </span>
        </div>
      </aside>
      <aside className="pointer-events-none fixed right-6 top-1/2 z-40 hidden -translate-y-1/2 xl:pointer-events-auto xl:flex xl:flex-col xl:gap-4">
        <div
          className="group flex h-64 w-12 cursor-pointer flex-col items-center justify-center gap-8 rounded-full border py-6 transition-all hover:opacity-95"
          style={{
            background: "var(--stitch-color-surface-container-high, var(--stitch-color-surface-container))",
            borderColor: "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 10%, transparent)",
          }}
        >
          <span
            className="text-[10px] font-black uppercase tracking-[0.3em]"
            style={{
              color: "var(--stitch-color-primary)",
              writingMode: "vertical-rl",
            }}
          >
            NEW DROP
          </span>
          <span className="material-symbols-outlined" style={{ color: "var(--stitch-color-primary)" }}>
            rocket_launch
          </span>
        </div>
      </aside>

      <main className="mx-auto max-w-screen-2xl px-6 pb-12 pt-24 md:px-12">
        <section className="mb-16 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="group relative h-[420px] cursor-pointer overflow-hidden rounded-3xl shadow-2xl md:h-[500px] lg:col-span-8">
            <Image
              src={HERO_IMG}
              alt="Gaming setup"
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 1024px) 100vw, 66vw"
              priority
              unoptimized
            />
            <div
              className="absolute inset-0 opacity-90"
              style={{
                background:
                  "linear-gradient(to top, var(--stitch-color-surface) 0%, transparent 55%)",
              }}
            />
            <div className="absolute bottom-8 left-8 max-w-lg md:bottom-10 md:left-10">
              <span
                className="mb-4 inline-block rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest"
                style={{
                  background: "var(--stitch-color-secondary-container)",
                  color: "var(--stitch-color-on-secondary-container)",
                }}
              >
                Limited Edition
              </span>
              <h1
                className="mb-4 text-4xl font-bold italic leading-tight tracking-tighter text-white md:text-6xl"
                style={{ fontFamily: "var(--stitch-font-headline)" }}
              >
                CYBERPULSE{" "}
                <span style={{ color: "var(--stitch-color-primary)" }}>ELITE X</span>
              </h1>
              <p
                className="mb-8 text-lg font-medium"
                style={{ color: "var(--stitch-color-on-surface-variant)" }}
              >
                Next-generation haptic feedback. Zero latency. Pure dominance. Experience the
                future of competitive play.
              </p>
              <button
                type="button"
                className="group flex items-center gap-3 rounded-full px-8 py-4 font-extrabold transition-all active:scale-95"
                style={{
                  background: "#ffffff",
                  color: "var(--stitch-color-surface)",
                }}
              >
                DISCOVER NOW
                <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">
                  arrow_forward
                </span>
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-6 lg:col-span-4">
            <div className="group relative h-[220px] flex-1 cursor-pointer overflow-hidden rounded-3xl md:h-[240px]">
              <Image
                src={SIDE_PC}
                alt="PC components"
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                sizes="400px"
                unoptimized
              />
              <div
                className="absolute inset-0 flex flex-col justify-end bg-gradient-to-r p-6 md:p-8"
                style={{
                  background: `linear-gradient(to right, color-mix(in srgb, var(--stitch-color-surface-container-lowest, #000) 80%, transparent), transparent)`,
                }}
              >
                <h2
                  className="mb-1 text-2xl font-bold text-white"
                  style={{ fontFamily: "var(--stitch-font-headline)" }}
                >
                  RTX SERIES
                </h2>
                <p className="text-sm font-bold" style={{ color: "var(--stitch-color-tertiary)" }}>
                  UP TO 25% OFF
                </p>
              </div>
            </div>
            <div className="group relative h-[220px] flex-1 cursor-pointer overflow-hidden rounded-3xl md:h-[240px]">
              <Image
                src={SIDE_CONSOLE}
                alt="Gaming console"
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                sizes="400px"
                unoptimized
              />
              <div
                className="absolute inset-0 flex flex-col justify-end bg-gradient-to-r p-6 md:p-8"
                style={{
                  background: `linear-gradient(to right, color-mix(in srgb, var(--stitch-color-surface-container-lowest, #000) 80%, transparent), transparent)`,
                }}
              >
                <h2
                  className="mb-1 text-2xl font-bold text-white"
                  style={{ fontFamily: "var(--stitch-font-headline)" }}
                >
                  PRO GEAR
                </h2>
                <p className="text-sm font-bold" style={{ color: "var(--stitch-color-primary)" }}>
                  LEVEL UP YOUR CONSOLE
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-20">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2
                className="flex items-center gap-3 text-2xl font-black uppercase italic tracking-tighter text-white md:text-3xl"
                style={{ fontFamily: "var(--stitch-font-headline)" }}
              >
                <span
                  className="h-0.5 w-10"
                  style={{ background: "var(--stitch-color-secondary)" }}
                />
                HOT DEALS
              </h2>
              <p className="mt-2" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                The most wanted hardware at exclusive prices.
              </p>
            </div>
            <button
              type="button"
              className="flex items-center gap-2 font-bold transition hover:underline"
              style={{ color: "var(--stitch-color-primary)" }}
            >
              View All
              <span className="material-symbols-outlined text-sm">open_in_new</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {PRODUCTS.map((p) => (
              <div
                key={p.id}
                className="group/card relative rounded-3xl border p-5 transition-all duration-300 hover:bg-[var(--stitch-color-surface-bright,var(--stitch-color-surface-container))]"
                style={{
                  background: "var(--stitch-color-surface-container)",
                  borderColor:
                    "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 10%, transparent)",
                }}
              >
                {"badge" in p && p.badge ? (
                  <div className="absolute right-4 top-4 z-10">
                    <div
                      className="rounded-full px-3 py-1 text-[10px] font-black text-white"
                      style={{ background: "var(--stitch-color-secondary)" }}
                    >
                      {p.badge}
                    </div>
                  </div>
                ) : null}
                {"tag" in p && p.tag ? (
                  <div className="absolute left-4 top-4 z-10">
                    <div
                      className="rounded-full px-3 py-1 text-[10px] font-black text-white"
                      style={{
                        background:
                          "var(--stitch-color-primary-dim, var(--stitch-color-primary))",
                      }}
                    >
                      {p.tag}
                    </div>
                  </div>
                ) : null}
                <div
                  className="relative mb-6 h-56 overflow-hidden rounded-2xl"
                  style={{ background: "var(--stitch-color-surface-container-low, var(--stitch-color-surface))" }}
                >
                  <Image
                    src={p.img}
                    alt={p.title}
                    fill
                    className={p.title.includes("Mouse") ? "object-contain" : "object-cover"}
                    sizes="(max-width: 640px) 100vw, 25vw"
                    unoptimized
                  />
                </div>
                <StarRow filled={p.stars} reviews={p.reviews} />
                <h3
                  className="mb-2 line-clamp-1 text-lg font-bold text-white"
                  style={{ fontFamily: "var(--stitch-font-headline)" }}
                >
                  {p.title}
                </h3>
                <p
                  className="mb-6 text-2xl font-black"
                  style={{ color: "var(--stitch-color-primary)" }}
                >
                  {p.price}{" "}
                  <span className="text-xs font-normal">VND</span>
                </p>
                <ProductCardActions product={p} />
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h2
            className="mb-8 text-2xl font-black italic tracking-tighter"
            style={{
              fontFamily: "var(--stitch-font-headline)",
              color: "var(--stitch-color-on-surface-variant)",
            }}
          >
            BROWSE GEAR
          </h2>
          <div className="scrollbar-hide flex gap-4 overflow-x-auto pb-4">
            {[
              { icon: "computer", label: "Laptops", accent: "secondary" as const },
              { icon: "videogame_asset", label: "Consoles", accent: "primary" as const },
              { icon: "headphones", label: "Audio", accent: "neutral" as const },
              { icon: "keyboard", label: "Peripherals", accent: "neutral" as const },
              { icon: "storage", label: "Hardware", accent: "neutral" as const },
            ].map((c) => {
              const isPri = c.accent === "primary";
              const isSec = c.accent === "secondary";
              return (
                <div
                  key={c.label}
                  className="flex h-32 w-64 flex-shrink-0 cursor-pointer items-center justify-center gap-4 rounded-2xl border transition-all"
                  style={{
                    background: isSec
                      ? "color-mix(in srgb, var(--stitch-color-secondary-container) 20%, transparent)"
                      : isPri
                        ? "color-mix(in srgb, var(--stitch-color-primary-container, var(--stitch-color-primary)) 20%, transparent)"
                        : "var(--stitch-color-surface-container-high, var(--stitch-color-surface-container))",
                    borderColor: isSec
                      ? "color-mix(in srgb, var(--stitch-color-secondary) 20%, transparent)"
                      : isPri
                        ? "color-mix(in srgb, var(--stitch-color-primary) 20%, transparent)"
                        : "transparent",
                  }}
                >
                  <span
                    className="material-symbols-outlined text-4xl"
                    style={{
                      color:
                        c.accent === "neutral"
                          ? "var(--stitch-color-on-surface-variant)"
                          : isSec
                            ? "var(--stitch-color-secondary)"
                            : "var(--stitch-color-primary)",
                    }}
                  >
                    {c.icon}
                  </span>
                  <span
                    className="text-xl font-bold"
                    style={{ fontFamily: "var(--stitch-font-headline)" }}
                  >
                    {c.label}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      </main>

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
              NEON KINETIC
            </div>
            <p className="text-sm leading-relaxed text-slate-500">
              Pushing the boundaries of digital commerce with elite tech for elite players. Join
              the kinetic revolution.
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
          <p className="text-xs text-slate-500">
            © 2026 NEON KINETIC. High-Octane Tech Editorial.
          </p>
          <div className="flex gap-6 opacity-50 grayscale">
            <span className="material-symbols-outlined">payments</span>
            <span className="material-symbols-outlined">credit_card</span>
            <span className="material-symbols-outlined">account_balance_wallet</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
