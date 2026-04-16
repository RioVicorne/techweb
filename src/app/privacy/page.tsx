import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <main className="mx-auto max-w-2xl px-6 pb-16 pt-24">
      <Link href="/" className="mb-8 inline-flex text-sm font-bold text-[var(--stitch-color-primary)]">
        ← Về trang chủ
      </Link>
      <h1 className="mb-4 text-2xl font-black" style={{ fontFamily: "var(--stitch-font-headline)" }}>
        Chính sách bảo mật
      </h1>
      <p className="leading-relaxed" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
        RioShop cam kết bảo vệ thông tin cá nhân theo quy định hiện hành. Dữ liệu tài khoản và đơn hàng chỉ phục vụ xử lý
        giao dịch và hỗ trợ khách hàng. Chi tiết sẽ được bổ sung tại đây khi có cập nhật chính thức.
      </p>
      </main>
    </div>
  );
}
