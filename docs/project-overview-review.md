# Project Overview Review

## 1) Mục tiêu dự án

Dự án là một ứng dụng e-commerce xây bằng Next.js (App Router), tập trung vào:
- Catalog sản phẩm + trang chi tiết.
- Giỏ hàng phía client.
- Đặt hàng và theo dõi đơn.
- Khu vực admin để quản trị đơn hàng, sản phẩm, tồn kho, review.
- Tích hợp Supabase làm backend dữ liệu và auth người dùng.

## 2) Tech stack chính

- Framework: Next.js 15 (App Router), React 19, TypeScript.
- Backend data/auth: Supabase (`@supabase/supabase-js`).
- Styling/UI: Tailwind CSS 4 + theme tokens Stitch.
- Payment: COD + MoMo (deeplink/QR) + BANK transfer (VietQR), Stripe có sẵn trong dependencies.

## 3) Cấu trúc module mức cao

- `src/app/*`: pages + API routes theo domain (`/api/catalog`, `/api/orders`, `/api/account`, `/api/admin`).
- `src/lib/*`: tích hợp Supabase, auth admin, env helpers, rate limit, catalog data mapping.
- `src/components/*`: UI theo feature (home, product, shop).
- `src/context/cart-context.tsx`: state giỏ hàng client-side.
- `supabase/schema.sql` + `supabase/migrations/*`: schema và migration DB.

## 4) Luồng nghiệp vụ chính

### User flow
1. User duyệt catalog và thêm sản phẩm vào giỏ.
2. User đăng nhập qua Supabase Auth.
3. Client gọi `POST /api/orders` (kèm Bearer token).
4. Server xác thực user, rate-limit, gọi RPC `create_order_with_items` để tạo đơn và order_items theo transaction.
5. User theo dõi đơn qua API account/order endpoints.

### Admin flow
1. Admin đăng nhập riêng tại `/admin/login` (không dùng Supabase user login flow).
2. API login admin phát hành cookie HttpOnly đã ký HMAC.
3. `middleware.ts` bảo vệ route `/admin/*`.
4. Admin dùng các API `/api/admin/*` để xem/chỉnh đơn, sản phẩm, thống kê, review.

## 5) Điểm mạnh hiện tại

- Tách rõ domain API: catalog/account/orders/admin.
- Dùng transactional RPC cho tạo đơn + chi tiết đơn, tránh ghi lệch dữ liệu.
- Có auth tách biệt user/admin, giảm trộn session model.
- Có rate limit ở các endpoint nhạy cảm (đăng nhập admin, tạo đơn).
- Có tài liệu vận hành cơ bản (`README`, `docs/ai-change-log.md`, `docs/rollback-runbook.md`).

## 6) Điểm cần lưu ý

- Rate limit đang lưu in-memory (`Map`) nên không chia sẻ giữa nhiều instance khi scale ngang.
- Một số API dùng service role key để thao tác DB; cần kỷ luật chặt về validate input/authorization.
- Tên status/payment status cần chuẩn hóa tập giá trị xuyên suốt schema + frontend + admin API.
- Cart dùng localStorage là hợp lý cho demo/MVP, nhưng cần strategy sync nếu muốn multi-device cart.

## 7) Kết luận nhanh

Codebase có nền tảng tốt cho MVP thương mại điện tử, đã có phân lớp API/DB/admin tương đối rõ. Bước tiếp theo nên tập trung vào hardening vận hành (rate-limit phân tán, chuẩn hóa trạng thái, test coverage và observability).
