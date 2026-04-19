# Project Review Checklist (Actionable)

## A. Security

- [ ] Đảm bảo mọi `/api/admin/*` đều gọi `requireAdmin`.
- [ ] Review toàn bộ route dùng `getSupabaseAdmin()` để xác nhận authorization logic đầy đủ.
- [ ] Kiểm tra env secrets không bị lộ trong client bundle.
- [ ] Bật giới hạn tốc độ phân tán (Redis/Upstash) cho login + create-order.

## B. Data Integrity

- [ ] Chuẩn hóa enum cho `orders.status` và `orders.payment_status`.
- [ ] Thêm DB constraints/checks cho các trạng thái nghiệp vụ.
- [ ] Bổ sung idempotency cho `POST /api/orders`.
- [ ] Xác nhận migration docs có hướng dẫn rollback rõ ràng.

## C. Reliability

- [ ] Thêm structured logs cho API critical.
- [ ] Thiết lập cảnh báo theo tỉ lệ lỗi 4xx/5xx ở các route quan trọng.
- [ ] Kiểm tra timeout/retry policy cho các tích hợp thanh toán.

## D. Testing

- [ ] Integration test cho flow đặt hàng (success/fail/rate-limit).
- [ ] Test auth admin (login, cookie verify, middleware redirect).
- [ ] Test moderation review và cập nhật trạng thái đơn.

## E. Performance

- [ ] Rà soát các query list lớn, bổ sung index nếu cần.
- [ ] Áp dụng pagination thực cho endpoints admin/account list.
- [ ] Theo dõi cache hit/miss của catalog data.

## F. Documentation

- [ ] Cập nhật `README.md` với sơ đồ luồng user/admin.
- [ ] Duy trì `docs/ai-change-log.md` cho mọi thay đổi bởi AI.
- [ ] Duy trì `docs/rollback-runbook.md` cho thao tác sự cố.

---

## Ưu tiên triển khai gợi ý

1. **P0**: Security + data integrity (A + B)
2. **P1**: Reliability + testing (C + D)
3. **P2**: Performance + documentation hoàn thiện (E + F)
