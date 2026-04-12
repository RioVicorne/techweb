import Link from "next/link";
import { ShopHeader } from "@/components/features/shop/shared/ShopHeader";

export default function TermsPage() {
  return (
    <div className="min-h-screen">
      <ShopHeader />
      <main className="mx-auto max-w-2xl px-6 pb-16 pt-24">
      <Link href="/" className="mb-8 inline-flex text-sm font-bold text-[var(--stitch-color-primary)]">
        ← Về trang chủ
      </Link>
      <h1 className="mb-4 text-2xl font-black" style={{ fontFamily: "var(--stitch-font-headline)" }}>
        Điều khoản dịch vụ
      </h1>
      <p className="leading-relaxed" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
        Nội dung điều khoản sẽ được RioShop cập nhật. Mua hàng trên website đồng nghĩa bạn đồng ý với các điều khoản
        chung và chính sách giao dịch hiện hành. Liên hệ hỗ trợ qua mục Liên hệ ở cuối trang chủ.
      </p>
      </main>
    </div>
  );
}
