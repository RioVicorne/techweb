import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, Manrope, Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/cart-context";
import { MobileBottomNav } from "@/components/layout/mobile/MobileBottomNav";
import {
  getAppStitchThemeStyle,
  getStitchProjectTitle,
  isStitchDarkMode,
} from "@/lib/stitch-app-theme";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export async function generateMetadata(): Promise<Metadata> {
  const title = await getStitchProjectTitle();
  return {
    title: title ? `${title} — Stitch` : "Stitch Design — Next.js",
    description: "RioShop — theme từ design tokens Stitch",
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const themeStyle = await getAppStitchThemeStyle();
  const dark = await isStitchDarkMode();

  return (
    <html lang="vi" className={dark ? "dark" : undefined}>
      <head>
        {/* Material Symbols — không có tương đương next/font; dùng cho icon trang chủ theo Stitch */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${plusJakarta.variable} ${spaceGrotesk.variable} ${manrope.variable} antialiased`}
        style={themeStyle}
      >
        <CartProvider>
          <div className="min-h-dvh pb-24 lg:pb-0">{children}</div>
          <MobileBottomNav />
        </CartProvider>
      </body>
    </html>
  );
}
