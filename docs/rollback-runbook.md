# Rollback Runbook

Checklist rollback nhanh, an toàn, có truy vết.

## 1) Xác định phạm vi sự cố

- Environment bị ảnh hưởng: `dev` / `staging` / `prod`
- Triệu chứng chính: lỗi API, tăng latency, dữ liệu sai, v.v.
- Commit/MR nghi ngờ (ưu tiên thay đổi gần nhất).

## 2) Chọn chiến lược rollback

### A. Rollback code (khuyến nghị)

```bash
git revert <sha>
```

- Tạo commit đảo ngược, giữ lịch sử sạch.
- Phù hợp khi thay đổi đã merge và cần khôi phục nhanh.

### B. Rollback nhiều commit liên tiếp

```bash
git revert <oldest_sha>^..<newest_sha>
```

- Dùng khi có chuỗi commit cùng gây lỗi.

### C. Rollback bằng GitLab MR Revert

- Dùng nút **Revert** ngay trên MR đã merge.
- Phù hợp nếu team đang review/approve theo flow GitLab.

## 3) Nếu có thay đổi Database

- Xác định migration liên quan.
- Chạy migration down/compensating migration theo chuẩn dự án.
- Backup hoặc snapshot trước thao tác dữ liệu phá huỷ.
- Kiểm tra tính toàn vẹn sau rollback.

## 4) Xác thực sau rollback

- Smoke test luồng chính (login, order, payment nếu có).
- Kiểm tra logs, error rate, latency.
- Xác nhận CI/CD pass ở commit rollback.

## 5) Ghi nhận vào AI Change Log

Sau rollback, thêm entry vào `docs/ai-change-log.md`:
- Nguyên nhân rollback
- Commit đã revert
- Kết quả xác thực
- Hành động phòng ngừa tái diễn

## 6) Mẫu lệnh hay dùng

```bash
# Xem lịch sử ngắn
git log --oneline -n 20

# Revert 1 commit
git revert <sha>

# Revert 1 khoảng commit
git revert <oldest_sha>^..<newest_sha>

# Kiểm tra trạng thái
git status
```

## Lưu ý

- Hạn chế dùng `reset --hard` cho nhánh đã chia sẻ.
- Ưu tiên `revert` vì an toàn và audit-friendly.
- Với lỗi dữ liệu production, luôn có người review thứ hai trước khi chạy rollback DB.
