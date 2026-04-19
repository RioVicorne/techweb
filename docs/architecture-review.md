# Architecture Review

## Tổng quan kiến trúc

Ứng dụng theo mô hình BFF trong Next.js:
- Frontend pages/components render từ App Router.
- API routes trong cùng codebase đóng vai trò backend layer.
- Supabase là data/auth platform.

## Thành phần chính

### 1) Presentation layer
- `src/app/*` + `src/components/*`.
- Theme/UI dùng Stitch tokens; layout chung bọc bởi `CartProvider`.

### 2) Application/API layer
- `/api/catalog/*`: public catalog data.
- `/api/orders/*`: nghiệp vụ checkout/order user.
- `/api/account/*`: dashboard/account data theo user.
- `/api/admin/*`: nghiệp vụ quản trị.

### 3) Data layer
- PostgreSQL (Supabase) với các bảng: `profiles`, `categories`, `products`, `product_variants`, `inventory`, `orders`, `order_items`, `payments`, `product_reviews`.
- RPC `create_order_with_items` đảm bảo tạo đơn theo transaction semantics phía DB.

## Mô hình auth hiện tại

### User auth
- Client dùng Supabase browser client (`persistSession: true`).
- Server API xác thực bearer token bằng Supabase anon client (`auth.getUser(token)`).

### Admin auth
- Credential admin tách biệt qua env (`ADMIN_EMAIL`, `ADMIN_PASSWORD`).
- Session admin là cookie HttpOnly chứa token ký HMAC (`ADMIN_SESSION_SECRET`).
- `middleware.ts` bảo vệ mọi route `/admin*`.
- API admin còn check thêm `requireAdmin` ở từng route.

## Caching & performance

- Catalog sử dụng `unstable_cache` + `revalidate: 300`.
- Một số route có `revalidateTag` trong flow admin product update (phục vụ invalidation).
- Rate-limit hiện tại in-memory, phù hợp local/single-instance.

## Nhận xét kiến trúc

### Điểm tốt
- Tách bạch rõ miền nghiệp vụ trong API routes.
- Có mô hình auth phân vai user/admin độc lập.
- Logic dữ liệu catalog đã bắt đầu chuẩn hoá qua `lib/catalog.ts`.

### Rủi ro/khoản nợ kỹ thuật
1. **Distributed rate limit**
   - In-memory limit không hiệu quả khi deploy nhiều instance.
2. **Service role blast radius**
   - API server dùng service role để bypass RLS; cần guard logic nghiêm ngặt.
3. **Business enum consistency**
   - Các trạng thái đơn/thanh toán cần centralized constants + DB constraints.
4. **Observability**
   - Chưa thấy lớp logging/tracing chuẩn cho API critical path.

## Đề xuất ưu tiên

### Ưu tiên cao
- Chuyển rate limit sang Redis/Upstash hoặc Supabase-backed table lock window.
- Chuẩn hóa constants cho `order status`/`payment status` ở cả frontend + backend + DB.
- Bổ sung integration tests cho luồng create-order RPC và admin order update.

### Ưu tiên trung bình
- Thêm structured logging cho các API quan trọng (`orders`, `admin/auth`, `admin/orders`).
- Tăng cường audit trail cho admin actions (ai đổi gì, khi nào).

### Ưu tiên thấp
- Tối ưu thêm cache invalidation theo tag cho catalog/account dashboards.
- Rà soát naming/typing để giảm casting thủ công trong API routes.
