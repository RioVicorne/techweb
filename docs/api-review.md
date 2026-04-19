# API Review

Tài liệu này tóm tắt nhanh các nhóm API chính và nhận xét tổng quan.

## 1) Catalog APIs

- `GET /api/catalog/products`
- `GET /api/catalog/products/[slug]`
- `GET /api/catalog/products/[slug]/related`
- `GET /api/catalog/categories`

### Nhận xét
- Phân tách public endpoints rõ ràng.
- Dữ liệu map từ `lib/catalog.ts` giúp ổn định shape cho UI.
- Nên thống nhất schema response và bổ sung versioning strategy nếu dự án mở rộng.

## 2) User Account APIs

- `GET /api/account/overview`
- `GET /api/account/orders`
- `GET /api/account/orders-summary`
- `GET /api/account/order-status-counts`
- `GET /api/account/purchases`

### Nhận xét
- Có xác thực bearer token bằng Supabase server auth trước khi truy cập dữ liệu user.
- Một số route đã tối ưu query song song (`Promise.all`).
- Nên chuẩn hóa pagination thay vì hard limit cố định cho data growth.

## 3) Order APIs

- `POST /api/orders`
- `GET /api/orders/[orderId]`

### Nhận xét
- `POST /api/orders` có rate-limit + validate payload cơ bản.
- Tạo order qua RPC `create_order_with_items` là hướng tốt để tránh ghi dở dang.
- Hỗ trợ nhiều phương thức thanh toán (COD/MOMO/BANK) và trả về QR/deeplink theo case.

### Rủi ro/đề xuất
- Cần idempotency key thật sự cho create order để chống double-submit từ retry mạng.
- Nên thống nhất mã lỗi business (ví dụ: `ORDER_RATE_LIMITED`, `INVALID_TOTALS`) để frontend xử lý ổn định.

## 4) Admin APIs

- Auth:
  - `POST /api/admin/auth/login`
  - `POST /api/admin/auth/logout`
  - `GET /api/admin/auth/me`
- Dashboard:
  - `GET /api/admin/stats`
- Orders:
  - `GET /api/admin/orders`
  - `PATCH /api/admin/orders/[orderId]`
- Products:
  - `GET/POST/PATCH/DELETE /api/admin/products`
- Reviews moderation:
  - `GET/PATCH /api/admin/reviews/[reviewId]`

### Nhận xét
- Admin guard được kiểm tra ở middleware và từng route (defense in depth).
- Route stats/order có logic tổng hợp phục vụ dashboard tốt cho MVP.
- Nên thêm audit log khi admin cập nhật order/review/product.

## 5) Tiêu chuẩn đề xuất cho API

1. Chuẩn hóa response envelope
   - Thành công: `{ data, meta?, error: null }`
   - Lỗi: `{ data: null, error: { code, message, details? } }`

2. Chuẩn hóa pagination
   - Query params: `cursor`, `limit`.
   - Response meta: `nextCursor`, `hasMore`.

3. Chuẩn hóa enum trạng thái
   - Dùng constants dùng chung ở `src/lib` + ràng buộc CHECK ở DB.

4. Test coverage tối thiểu
   - Unit cho validate input.
   - Integration cho các route nghiệp vụ chính (`orders`, `admin/orders`, `admin/auth`).
