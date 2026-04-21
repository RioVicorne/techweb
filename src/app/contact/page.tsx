import Image, { type StaticImageData } from "next/image";
import Link from "next/link";

import discordLogo from "@/assets/svg/discord-icon.svg";
import facebookLogo from "@/assets/svg/facebook.svg";
import telegramLogo from "@/assets/svg/telegram.svg";
import zaloLogo from "@/assets/svg/zalo-seeklogo.svg";

type SupportChannel = {
  name: string;
  href: string;
  brandColor: string;
  logo: StaticImageData;
};

const SUPPORT_CHANNELS: SupportChannel[] = [
  {
    name: "Zalo",
    href: "https://zalo.me/",
    brandColor: "var(--stitch-color-primary)",
    logo: zaloLogo,
  },
  {
    name: "Facebook",
    href: "https://www.facebook.com/",
    brandColor: "var(--stitch-color-secondary)",
    logo: facebookLogo,
  },
  {
    name: "Telegram",
    href: "https://t.me/",
    brandColor: "var(--stitch-color-primary-dim, var(--stitch-color-primary))",
    logo: telegramLogo,
  },
  {
    name: "Discord",
    href: "https://discord.com/",
    brandColor: "var(--stitch-color-primary-container)",
    logo: discordLogo,
  },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen">
      <main className="mx-auto max-w-3xl px-6 pb-16 pt-24 md:px-10">
        <Link href="/" className="mb-8 inline-flex text-sm font-bold text-[var(--stitch-color-primary)]">
          ← Về trang chủ
        </Link>

        <h1 className="mb-3 text-3xl font-black" style={{ fontFamily: "var(--stitch-font-headline)" }}>
          Liên hệ RioShop
        </h1>
        <p className="mb-8 text-sm leading-relaxed" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
          Chọn kênh phù hợp để nhắn tin nhanh với RioShop.
        </p>

        <section className="mb-8" aria-label="Kênh hỗ trợ RioShop">
          <div className="grid gap-4 md:grid-cols-2">
            {SUPPORT_CHANNELS.map((channel) => (
              <a
                key={channel.name}
                href={channel.href}
                target="_blank"
                rel="noopener noreferrer"
                className="led-rgb-border flex items-center gap-4 rounded-3xl p-5"
                style={{ background: "var(--stitch-color-surface-container)" }}
              >
                <span
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl"
                  style={{
                    background: "var(--stitch-color-surface)",
                    border: `1px solid color-mix(in srgb, ${channel.brandColor} 28%, var(--stitch-color-surface))`,
                    boxShadow: `0 6px 16px color-mix(in srgb, ${channel.brandColor} 35%, transparent)`,
                  }}
                >
                  <Image
                    src={channel.logo}
                    alt={`${channel.name} logo`}
                    width={24}
                    height={24}
                    className="h-6 w-6 object-contain"
                  />
                </span>
                <span className="min-w-0">
                  <h2 className="text-lg font-black" style={{ fontFamily: "var(--stitch-font-headline)" }}>
                    {channel.name}
                  </h2>
                  <p className="text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                    Chat với RioShop qua {channel.name}.
                  </p>
                </span>
              </a>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
