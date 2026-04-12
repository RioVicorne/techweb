const VI_ABS: Intl.DateTimeFormatOptions = {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
};

/** Thời điểm đặt đơn — tương đối khi còn mới, sau đó chuyển sang giờ địa phương (vi-VN). */
export function formatOrderTimeLive(iso: string, nowMs: number): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  const diffMs = nowMs - t;
  if (diffMs < 0) {
    return new Date(iso).toLocaleString("vi-VN", VI_ABS);
  }
  const sec = Math.floor(diffMs / 1000);
  if (sec < 45) return "Vừa xong";
  if (sec < 3600) {
    const m = Math.max(1, Math.floor(sec / 60));
    return `${m} phút trước`;
  }
  if (sec < 86400) {
    const h = Math.max(1, Math.floor(sec / 3600));
    return `${h} giờ trước`;
  }
  if (sec < 7 * 86400) {
    const d = Math.max(1, Math.floor(sec / 86400));
    return `${d} ngày trước`;
  }
  return new Date(iso).toLocaleString("vi-VN", VI_ABS);
}
