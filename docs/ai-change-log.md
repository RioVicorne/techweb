# AI Change Log

Tài liệu này lưu lại các thay đổi do AI thực hiện để:
- Tái sử dụng khi gặp lại case tương tự.
- Truy vết nhanh nguyên nhân và phạm vi ảnh hưởng.
- Rollback an toàn bằng commit SHA.

## Quy ước bắt buộc

1. Mỗi thay đổi logic nên đi kèm **1 commit nhỏ, rõ ràng**.
2. Mỗi thay đổi phải có **1 entry** trong file này.
3. Rollback chuẩn dùng Git (`git revert <sha>`), không rollback bằng sửa tay.
4. Nếu có thay đổi schema/data, bắt buộc ghi rõ migration và cách rollback DB.

---

## Entry Template (copy để dùng)

```md
## YYYY-MM-DD - <short title>

- Context: <bối cảnh / triệu chứng>
- Root cause: <nguyên nhân gốc>
- Decision: <giải pháp đã chọn + lý do ngắn>
- Changed files:
  - `<path/to/file1>`
  - `<path/to/file2>`
- Commit: `<sha>`
- Verification:
  - <cách test 1>
  - <cách test 2>
- Rollback:
  - `git revert <sha>`
- Follow-up:
  - <việc nên làm tiếp theo nếu có>
```

---

## Example

## 2026-04-19 - Prevent duplicate order creation

- Context: API `/api/orders` tạo trùng đơn khi client retry.
- Root cause: thiếu idempotency check trước khi insert.
- Decision: thêm check theo `Idempotency-Key` trước khi tạo order.
- Changed files:
  - `src/app/api/orders/route.ts`
- Commit: `abc1234`
- Verification:
  - Gửi 3 request cùng `Idempotency-Key`, chỉ tạo 1 order.
  - Kiểm tra response trả về cùng `orderId`.
- Rollback:
  - `git revert abc1234`
- Follow-up:
  - Bổ sung integration test cho retry scenario.

## 2026-04-19 - Reduce duplicate fetches on Account/Orders

- Context: trang `/account` và `/orders` vẫn có cảm giác lag khi điều hướng vì gọi lại cùng API trong thời gian ngắn.
- Root cause: thiếu cache ngắn hạn ở client và chưa dedupe request đang in-flight.
- Decision: thêm memory cache theo token + orderId với TTL ngắn, đồng thời dedupe promise đang chạy để tránh request trùng.
- Changed files:
  - `src/app/account/AccountClient.tsx`
  - `src/app/orders/OrdersClient.tsx`
- Commit: `5721bfc`
- Verification:
  - `npm run lint`
  - `npm test`
  - `npm run build`
- Rollback:
  - `git revert 5721bfc`
- Follow-up:
  - Theo dõi hit rate của cache ở môi trường thực tế để cân chỉnh TTL.

## 2026-04-19 - Lazy-load dữ liệu địa chỉ VN để giảm bundle

- Context: route `/account` có first-load JS cao vì import tĩnh `pc-vn` ngay từ lần render đầu.
- Root cause: dữ liệu tỉnh/quận/phường được load trong main bundle dù user có thể chưa mở phần chỉnh sửa địa chỉ.
- Decision: chuyển sang dynamic import `pc-vn` qua `loadVnAddressDataset()` và chỉ khởi tạo khi cần mapping địa chỉ; đồng thời giữ UI editable với trạng thái loading rõ ràng.
- Changed files:
  - `src/app/account/AccountClient.tsx`
- Commit: `<pending>`
- Verification:
  - `npm run lint`
  - `npm test`
  - `npm run build`
  - Build output: `/account` First Load JS giảm từ `355 kB` xuống `171 kB`.
- Rollback:
  - `git restore src/app/account/AccountClient.tsx`
- Follow-up:
  - Có thể tách riêng AddressEditor thành component dynamic để giảm thêm JS tải ban đầu.
