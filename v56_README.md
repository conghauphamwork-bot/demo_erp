# Tân Hòa ERP v56 — Module "Theo dõi mẫu test"

Module mới trong nhóm **SUPPLY CHAIN**: theo dõi tiến độ mẫu mang đi trung tâm test qua 14 mốc
(nhám nguội → giao lên sơn → sơn gỗ → khung sắt → đan dây → mặt đá → sơn mặt đá → hardware → nệm
→ lắp ráp → QA nhà máy → đi trung tâm → KQ trung tâm → nhận mẫu về).

## Có gì
- **Danh sách + bộ lọc 1 chạm**: Trễ · Đến hạn hôm nay · Sắp đến hạn · Thiếu Hardware · Thiếu nệm ·
  Thiếu khung sắt · Sẵn sàng lắp ráp · Chờ KQ test · Fail – làm lại · Thiếu ngày ấn định · Nguy cơ trễ hạn test.
  Lọc "Thiếu …" hiện luôn chi tiết còn thiếu (vd *Tạ chống lật · Đúc An Phú, trễ 14/10*).
- **Việc hôm nay**: mọi bước / chi tiết vật tư trễ, đến hạn, sắp đến hạn; cột "Gọi ai" (xưởng hay NCC).
- **Chi tiết mẫu**: 14 bước với KH gốc / Dự kiến / Thực tế / Hẹn lại / Lệch; nút **Chốt KH gốc**.
- **Vật tư theo chi tiết**: Hardware (ốc, pas, tạ…), Nệm, Khung sắt — mỗi dòng có NCC, PO, ngày hẹn,
  hẹn lại, ngày về, IQC. Bước tự "xong" khi mọi dòng IQC đạt; 1 dòng trễ → cả bước báo trễ.
- **Nhật ký test**: mỗi lần QA/trung tâm là 1 dòng; fail bắt buộc ghi hạng mục, có CAPA, NCR, bước làm lại.
  Bước QA / Đi TT / KQ TT tự lấy ngày từ nhật ký.
- **Thiết lập** (chỉ level 0): lead time, nơi làm, ấn định/lead time, thứ tự bước (x = phải xong trước,
  d = dự phòng), ngày nghỉ tuần, ngày lễ, số ngày cảnh báo.
- Logic giống hệt file Excel v7: đan dây theo "Đan dây trên" (Khung sắt / Khung gỗ / Cả hai / Không đan),
  xong sớm mặc định không kéo lịch, xong trễ đẩy lùi các bước sau, cổng sẵn sàng lắp ráp.

## Triển khai (1 lần)
1. **Supabase → SQL Editor**: dán và chạy `tanhoa_v56_sample_test_tracking.sql`.
   Chỉ tạo 4 bảng mới (`test_trackings`, `test_tracking_steps`, `test_tracking_parts`, `test_tracking_tests`),
   không sửa bảng cũ. Thiết lập lưu trong `erp_records` (record_type = `test_settings`).
2. **GitHub**: upload các file
   - mới: `SampleTestTrackingView.jsx`, `sampleTestLogic.js`, `sampleTestApi.js`,
     `tanhoa_v56_sample_test_tracking.sql`, `tests/sampleTestLogic.test.mjs`, `v56_README.md`
   - sửa: `tanhoa_erp.jsx` (chỉ thêm import, 1 mục menu, quyền xem, và route — 19 dòng)
3. Vercel tự deploy. Mở ERP → **Theo dõi mẫu test**.

Nếu chưa chạy SQL, ERP vẫn chạy bình thường; riêng module này hiện hướng dẫn chạy SQL.

## Quyền
- Level 0: toàn quyền + Thiết lập. Level 2: xem/sửa, không xoá. Level 3: chỉ xem. Level 1: không thấy module.

## Kiểm tra đã chạy
- `node tests/sampleTestLogic.test.mjs` — 14 tình huống (các trường hợp đã kiểm trên Excel: đan dây 4 kiểu,
  không khung sắt, sơn gỗ trễ đẩy lùi, xong sớm, HW + nệm cùng hạn, vật tư theo chi tiết, nhật ký test,
  thiếu ngày ấn định, gợi ý N/A từ thông số sản phẩm).
- `vite build` thành công.
- Chạy giao diện với dữ liệu giả: danh sách, bộ lọc, việc hôm nay, chi tiết, thêm vật tư, ghi test, chốt KH gốc,
  thiết lập — không lỗi runtime.
- Chưa chạy với Supabase thật (môi trường build không có quyền vào database).
