"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatVndDisplay } from "@/data/products";
import { getSupabaseBrowser } from "@/lib/supabase/browser";

const BANK = {
  code: "BIDV",
  accountNumber: "8886612856",
  accountName: "TRAN DINH KHOA",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  UNPAID: "Chưa thanh toán",
  AWAITING_PAYMENT: "Đang chờ thanh toán",
  PAID: "Đã thanh toán",
  REFUNDED: "Đã hoàn tiền",
};

type OrderLookupResponse = {
  order?: {
    id: string;
    total_vnd: number;
    payment_status: string;
    qr_code_url: string | null;
  };
};

export function QrPaymentClient() {
  const router = useRouter();
  const params = useSearchParams();
  const orderId = params.get("orderId") || "";
  const supabase = useMemo(() => getSupabaseBrowser(), []);

  const [orderCode, setOrderCode] = useState("");
  const [totalVnd, setTotalVnd] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState<string>("AWAITING_PAYMENT");
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(300); // 5 minutes
  const [isPaid, setIsPaid] = useState(false);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [confirmSuccessText, setConfirmSuccessText] = useState<string | null>(null);

  const loadOrderStatus = useCallback(async (targetOrderId: string): Promise<string | null> => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token || "";
    if (!token) {
      throw new Error("Bạn cần đăng nhập để xem đơn hàng");
    }

    const res = await fetch(`/api/orders/${encodeURIComponent(targetOrderId)}`, {
      method: "GET",
      headers: { authorization: `Bearer ${token}` },
    });
    const json = (await res.json()) as OrderLookupResponse;
    if (!res.ok || !json.order) {
      throw new Error("Không tìm thấy đơn hàng");
    }

    setOrderCode(json.order.id);
    setTotalVnd(json.order.total_vnd);
    setPaymentStatus(json.order.payment_status);
    setQrCodeUrl(json.order.qr_code_url);

    return json.order.payment_status;
  }, [supabase]);

  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;

    async function loadOrder() {
      try {
        const latestStatus = await loadOrderStatus(orderId);
        if (cancelled) return;

        if (latestStatus === "PAID") {
          setIsPaid(true);
          router.push(`/checkout/success?orderId=${encodeURIComponent(orderId)}`);
        }
      } catch {
        if (!cancelled) {
          setError("Không thể tải thông tin đơn hàng");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadOrder();

    return () => {
      cancelled = true;
    };
  }, [orderId, router, loadOrderStatus]);

  // Supabase Realtime subscription for payment status updates
  useEffect(() => {
    if (!orderId || isPaid) return;

    setConfirmSuccessText(null);

    const channel = supabase
      .channel(`order-payment:${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `order_code=eq.${orderId}`,
        },
        (payload) => {
          const newStatus = (payload.new as Record<string, unknown>)?.payment_status as string;
          if (newStatus) {
            setPaymentStatus(newStatus);
            if (newStatus === "PAID") {
              setIsPaid(true);
              router.push(`/checkout/success?orderId=${encodeURIComponent(orderId)}`);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, isPaid, router, supabase]);

  // Countdown timer
  useEffect(() => {
    if (isPaid) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setError("Mã QR đã hết hạn.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isPaid]);

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;

  async function handleConfirmPayment() {
    if (!orderId || confirmingPayment) return;

    setConfirmingPayment(true);
    setConfirmSuccessText(null);

    try {
      const latestStatus = await loadOrderStatus(orderId);

      if (latestStatus === "PAID") {
        setConfirmSuccessText("Thanh toán thành công. Admin đã xác nhận giao dịch.");
        setIsPaid(true);
        router.push(`/checkout/success?orderId=${encodeURIComponent(orderId)}`);
        return;
      }

      const popupMessage =
        "Thanh toán thất bại: Admin chưa xác nhận nhận được tiền. Vui lòng kiểm tra lại sau.";
      window.alert(popupMessage);
    } catch {
      window.alert("Không thể đối chiếu thanh toán lúc này. Vui lòng thử lại sau.");
    } finally {
      setConfirmingPayment(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-screen-lg px-6 pb-20 pt-28 md:px-12">
        <div
          className="rounded-3xl border p-10 text-center"
          style={{
            background: "var(--stitch-color-surface-container)",
            borderColor:
              "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 10%, transparent)",
          }}
        >
          <span
            className="material-symbols-outlined mb-4 text-5xl animate-spin"
            style={{ color: "var(--stitch-color-primary)" }}
            aria-hidden
          >
            hourglass_top
          </span>
          <h1 className="mb-2 text-xl font-bold text-white" style={{ fontFamily: "var(--stitch-font-headline)" }}>
            Đang tải...
          </h1>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-screen-lg px-6 pb-20 pt-28 md:px-12">
        <div
          className="rounded-3xl border p-10 text-center"
          style={{
            background: "var(--stitch-color-surface-container)",
            borderColor:
              "color-mix(in srgb, var(--stitch-color-error, var(--stitch-color-secondary)) 20%, transparent)",
          }}
        >
          <span
            className="material-symbols-outlined mb-4 text-5xl"
            style={{ color: "var(--stitch-color-error, var(--stitch-color-secondary))" }}
            aria-hidden
          >
            error
          </span>
          <h1 className="mb-2 text-xl font-bold text-white" style={{ fontFamily: "var(--stitch-font-headline)" }}>
            Lỗi
          </h1>
          <p className="mb-8 text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
            {error}
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl px-8 py-3 text-sm font-bold transition active:scale-95"
            style={{
              background: `linear-gradient(135deg, var(--stitch-color-primary) 0%, var(--stitch-color-primary-dim, var(--stitch-color-primary)) 100%)`,
              color: "var(--stitch-color-on-primary)",
            }}
          >
            Về cửa hàng
          </Link>
        </div>
      </main>
    );
  }

  if (isPaid) {
    return (
      <main className="mx-auto max-w-screen-lg px-6 pb-20 pt-28 md:px-12">
        <div
          className="rounded-3xl border p-10 text-center"
          style={{
            background: "var(--stitch-color-surface-container)",
            borderColor:
              "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 10%, transparent)",
          }}
        >
          <span
            className="material-symbols-outlined mb-4 text-5xl"
            style={{ color: "var(--stitch-color-primary)" }}
            aria-hidden
          >
            check_circle
          </span>
          <h1 className="mb-2 text-xl font-bold text-white" style={{ fontFamily: "var(--stitch-font-headline)" }}>
            Đang chuyển hướng...
          </h1>
          <p className="text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
            Thanh toán thành công!
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-screen-lg px-6 pb-20 pt-28 md:px-12">
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-black italic tracking-tighter text-white" style={{ fontFamily: "var(--stitch-font-headline)" }}>
          Quét mã QR để thanh toán
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
          Mở app ngân hàng và quét mã QR bên dưới
        </p>
      </div>

      {/* Countdown */}
      <div className="mb-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-black" style={{ background: "color-mix(in srgb, var(--stitch-color-secondary, var(--stitch-color-primary)) 15%, transparent)", color: "var(--stitch-color-secondary, var(--stitch-color-primary))" }}>
          <span className="material-symbols-outlined text-[18px]" aria-hidden>
            schedule
          </span>
          Mã QR hết hạn sau: {minutes}:{seconds.toString().padStart(2, "0")}
        </div>
      </div>

      <div className="flex flex-col gap-8 lg:grid lg:grid-cols-12 lg:items-start">
        {/* Left: QR Code */}
        <div
          className="rounded-3xl border p-6 text-center lg:col-span-7"
          style={{
            background: "var(--stitch-color-surface-container)",
            borderColor:
              "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 10%, transparent)",
          }}
        >
          <div className="mb-4 text-sm font-black uppercase tracking-widest" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
            Mã QR Thanh Toán
          </div>

          <div className="mx-auto mb-4 inline-block rounded-2xl border bg-white p-4" style={{ borderColor: "color-mix(in srgb, var(--stitch-color-primary) 30%, transparent)" }}>
            {qrCodeUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrCodeUrl}
                alt="VietQR Code"
                className="h-64 w-64 object-contain"
              />
            ) : (
              <div className="flex h-64 w-64 items-center justify-center text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                Không có mã QR
              </div>
            )}
          </div>

          <div className="space-y-2 text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
            <p className="font-black text-white">{formatVndDisplay(totalVnd)} đ</p>
            <p>Mã đơn: <span className="font-black text-white">{orderCode}</span></p>
            <p>Ngân hàng: <span className="font-bold text-white">{BANK.accountName}</span></p>
            <p>Số TK: <span className="font-bold text-white">{BANK.accountNumber}</span> ({BANK.code})</p>
            <p className="text-xs mt-3" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
              Vui lòng chuyển đúng số tiền và ghi nội dung: <span className="font-black text-white">TT {orderCode}</span>
            </p>
          </div>
        </div>

        {/* Right: Instructions & Status */}
        <div
          className="rounded-3xl border p-6 lg:col-span-5"
          style={{
            background: "var(--stitch-color-surface-container)",
            borderColor:
              "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 10%, transparent)",
          }}
        >
          <h2 className="mb-4 text-lg font-bold text-white" style={{ fontFamily: "var(--stitch-font-headline)" }}>
            Hướng dẫn thanh toán
          </h2>

          <ol className="space-y-3 text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
            <li className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black text-white" style={{ background: "var(--stitch-color-primary)" }}>1</span>
              <span>Mở app ngân hàng trên điện thoại</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black text-white" style={{ background: "var(--stitch-color-primary)" }}>2</span>
              <span>Nhấn tính năng <span className="font-bold text-white">Quét mã QR</span> hoặc <span className="font-bold text-white">Chuyển tiền</span></span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black text-white" style={{ background: "var(--stitch-color-primary)" }}>3</span>
              <span>Quét mã QR bên trái hoặc nhập thủ công số tài khoản</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black text-white" style={{ background: "var(--stitch-color-primary)" }}>4</span>
              <span>Nhập nội dung chuyển khoản: <span className="font-bold text-white">TT {orderCode}</span></span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black text-white" style={{ background: "var(--stitch-color-primary)" }}>5</span>
              <span>Xác nhận chuyển khoản</span>
            </li>
          </ol>

          <div className="my-6 h-px" style={{ background: "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 15%, transparent)" }} />

          {/* Payment Status */}
          <div className="text-center">
            <div className="mb-2 text-xs font-black uppercase tracking-widest" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
              Trạng thái
            </div>
            <div
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-black"
              style={{
                background: "color-mix(in srgb, var(--stitch-color-secondary, var(--stitch-color-primary)) 15%, transparent)",
                color: "var(--stitch-color-secondary, var(--stitch-color-primary))",
              }}
            >
              <span className="material-symbols-outlined text-[18px] animate-pulse" aria-hidden>
                sync
              </span>
              {PAYMENT_STATUS_LABELS[paymentStatus] ?? paymentStatus}
            </div>
            <p className="mt-2 text-xs" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
              Tự động cập nhật khi nhận được tiền
            </p>

            <button
              type="button"
              onClick={() => {
                void handleConfirmPayment();
              }}
              disabled={confirmingPayment || isPaid}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-black transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                background: `linear-gradient(135deg, var(--stitch-color-primary) 0%, var(--stitch-color-primary-dim, var(--stitch-color-primary)) 100%)`,
                color: "var(--stitch-color-on-primary)",
              }}
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden>
                {confirmingPayment ? "hourglass_top" : "fact_check"}
              </span>
              {confirmingPayment ? "Đang đối chiếu với admin..." : "Xác nhận thanh toán"}
            </button>

            {confirmSuccessText ? (
              <p className="mt-3 text-xs font-bold" style={{ color: "#34d399" }}>
                {confirmSuccessText}
              </p>
            ) : null}
          </div>

          <div className="mt-6">
            <Link
              href="/"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition active:scale-[0.98]"
              style={{
                background: "var(--stitch-color-surface-container-highest, var(--stitch-color-surface-container))",
                color: "var(--stitch-color-primary)",
              }}
            >
              <span className="material-symbols-outlined" aria-hidden>
                store
              </span>
              Về cửa hàng
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
