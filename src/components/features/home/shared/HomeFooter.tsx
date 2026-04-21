import Link from "next/link";
import { HomeNewsletterForm } from "@/components/features/home/shared/HomeNewsletterForm";

export function HomeFooter() {
  return (
    <footer
      className="mt-auto w-full border-t py-8 md:py-10"
      style={{
        borderColor:
          "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 10%, transparent)",
        background: "var(--stitch-color-background, var(--stitch-color-surface))",
      }}
    >
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-6 md:grid-cols-4 md:gap-10 md:px-12">
        <div className="space-y-4">
          <div
            className="text-lg font-bold"
            style={{
              fontFamily: "var(--stitch-font-headline)",
              color: "var(--stitch-color-primary)",
            }}
          >
            RioShop
          </div>
          <p className="text-sm leading-relaxed" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
            Thiết bị công nghệ cho game thủ đẳng cấp.
          </p>
          <div className="flex gap-3">
            <a
              href="https://www.facebook.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-10 w-10 min-h-[44px] min-w-[44px] items-center justify-center rounded-full transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--stitch-color-secondary)]"
              style={{
                background: "var(--stitch-color-surface-container)",
                color: "var(--stitch-color-on-surface-variant)",
              }}
              aria-label="Facebook RioShop (mở tab mới)"
            >
              <span className="material-symbols-outlined text-xl" aria-hidden>
                public
              </span>
            </a>
            <a
              href="mailto:support@rioshop.vn"
              className="flex h-10 w-10 min-h-[44px] min-w-[44px] items-center justify-center rounded-full transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--stitch-color-secondary)]"
              style={{
                background: "var(--stitch-color-surface-container)",
                color: "var(--stitch-color-on-surface-variant)",
              }}
              aria-label="Gửi email hỗ trợ"
            >
              <span className="material-symbols-outlined text-xl" aria-hidden>
                mail
              </span>
            </a>
          </div>
        </div>

        <div>
          <h4
            className="mb-4 font-bold"
            style={{
              fontFamily: "var(--stitch-font-headline)",
              color: "var(--stitch-color-on-surface)",
            }}
          >
            Liên kết nhanh
          </h4>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
            <li>
              <Link
                href="/contact"
                className="inline-block rounded transition hover:translate-x-1 hover:text-[var(--stitch-color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--stitch-color-secondary)]"
              >
                Hỗ trợ
              </Link>
            </li>
            <li>
              <Link
                href="/category"
                className="inline-block rounded transition hover:translate-x-1 hover:text-[var(--stitch-color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--stitch-color-secondary)]"
              >
                Ưu đãi / quà tặng
              </Link>
            </li>
            <li>
              <Link
                href="/terms"
                className="inline-block rounded transition hover:translate-x-1 hover:text-[var(--stitch-color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--stitch-color-secondary)]"
              >
                Điều khoản dịch vụ
              </Link>
            </li>
            <li>
              <Link
                href="/privacy"
                className="inline-block rounded transition hover:translate-x-1 hover:text-[var(--stitch-color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--stitch-color-secondary)]"
              >
                Chính sách bảo mật
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4
            className="mb-4 font-bold"
            style={{
              fontFamily: "var(--stitch-font-headline)",
              color: "var(--stitch-color-on-surface)",
            }}
          >
            Tài khoản
          </h4>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
            <li>
              <Link
                href="/account"
                className="inline-block rounded transition hover:translate-x-1 hover:text-[var(--stitch-color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--stitch-color-secondary)]"
              >
                Hồ sơ
              </Link>
            </li>
            <li>
              <Link
                href="/orders"
                className="inline-block rounded transition hover:translate-x-1 hover:text-[var(--stitch-color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--stitch-color-secondary)]"
              >
                Đơn hàng
              </Link>
            </li>
            <li>
              <Link
                href="/account"
                className="inline-block rounded transition hover:translate-x-1 hover:text-[var(--stitch-color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--stitch-color-secondary)]"
              >
                Yêu thích
              </Link>
            </li>
            <li>
              <Link
                href="/account"
                className="inline-block rounded transition hover:translate-x-1 hover:text-[var(--stitch-color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--stitch-color-secondary)]"
              >
                Cài đặt
              </Link>
            </li>
          </ul>
        </div>

        <div id="contact" className="scroll-mt-28 space-y-4">
          <h4
            className="font-bold"
            style={{
              fontFamily: "var(--stitch-font-headline)",
              color: "var(--stitch-color-on-surface)",
            }}
          >
            Liên hệ
          </h4>
          <p className="text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
            Gửi yêu cầu qua email{" "}
            <a href="mailto:support@rioshop.vn" className="font-bold underline-offset-2 hover:underline" style={{ color: "var(--stitch-color-primary)" }}>
              support@rioshop.vn
            </a>
            . Phản hồi trong giờ hành chính.
          </p>
          <div>
            <h4
              className="mb-2 font-bold"
              style={{
                fontFamily: "var(--stitch-font-headline)",
                color: "var(--stitch-color-on-surface)",
              }}
            >
              Bản tin
            </h4>
            <p className="mb-3 text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
              Nhận thông tin sản phẩm mới và khuyến mãi.
            </p>
            <HomeNewsletterForm />
          </div>
        </div>
      </div>

      <div
        className="mx-auto mt-8 flex max-w-7xl flex-col items-center justify-between gap-3 border-t px-6 pt-6 md:flex-row md:px-12"
        style={{
          borderColor:
            "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 10%, transparent)",
        }}
      >
        <p className="text-xs" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
          © 2026 RioShop.
        </p>
        <div className="flex gap-5 opacity-50 grayscale" aria-hidden>
          <span className="material-symbols-outlined">payments</span>
          <span className="material-symbols-outlined">credit_card</span>
          <span className="material-symbols-outlined">account_balance_wallet</span>
        </div>
      </div>
    </footer>
  );
}
