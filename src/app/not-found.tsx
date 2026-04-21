import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6">
      <h1
        className="text-2xl font-bold"
        style={{
          fontFamily: "var(--stitch-font-headline)",
          color: "var(--stitch-color-on-surface)",
        }}
      >
        Không tìm thấy trang
      </h1>
      <Link href="/" className="font-medium underline" style={{ color: "var(--stitch-color-primary)" }}>
        Về trang chủ
      </Link>
    </div>
  );
}
