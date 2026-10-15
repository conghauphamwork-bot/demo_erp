# Tân Hòa ERP v57 — Product Description · Ảnh minh chứng · QA/QC · Lịch sử thay đổi

## 1. Theo dõi mẫu test: thông tin sản phẩm riêng + Product Description
- Module mẫu test **không phải master product**. Tạo mẫu mới có 2 cách:
  **Nhập thông tin mẫu** (Mã ERP, Product Description, khách hàng, ảnh) hoặc **Lấy từ Products có sẵn**.
- Trường mới **Product Description** (mô tả ngắn) — hiện ở danh sách, việc hôm nay, chi tiết; sửa được.
- Nút **Chuyển sang Products**: đưa Mã ERP, Product Description (làm tên), khách, ảnh, số LSX sang bảng
  Products. Nếu Products đã có mã ERP đó → chỉ liên kết, không tạo trùng.

## 2. Module QA/QC (menu SUPPLY CHAIN → QA/QC)
- Phiếu kiểm Pass/Fail: nguồn (Mẫu test / Mẫu ship / Khác), công đoạn kiểm, ngày kiểm/ngày lỗi, người kiểm,
  SL kiểm/lỗi, **phân loại lỗi**, mức độ, mô tả, **nguyên nhân**, **hướng xử lý**, người xử lý, hạn,
  **ngày hoàn thành xử lý**, trạng thái (Mở / Đang xử lý / Đã xử lý), số NCR, ảnh lỗi, ảnh sau xử lý.
- Bộ lọc: Lỗi đang mở · Quá hạn xử lý · Tất cả Fail · Đã xử lý · Pass. KPI: tỷ lệ Pass, lỗi mở, quá hạn,
  TB ngày xử lý. Biểu đồ lỗi theo phân loại (bấm để lọc). Tab "Phân loại lỗi" để sửa danh mục (level 0).
- Liên kết:
  - **Mẫu test**: mỗi lần test QA nhà máy / trung tâm có kết quả (Đạt / Không đạt) **tự tạo phiếu QC**;
    sửa lần test → phiếu tự cập nhật (không ghi đè phân loại, mức độ, ảnh, trạng thái QC đã nhập).
    Ở bảng 14 bước có nút **+ QC** từng bước và badge số lỗi mở.
  - **Mẫu ship (Products)**: chi tiết sản phẩm có khối **QA/QC** + nút **Ghi QC** theo stage hiện tại.

## 3. Ảnh minh chứng
- Mẫu test: cột **Ảnh nhận hàng** cho từng chi tiết vật tư (Hardware, Nệm, Khung sắt…) — nhiều ảnh/dòng;
  cảnh báo "Chưa có ảnh" khi đã có ngày về mà chưa chụp. Bảng 14 bước có cột **Ảnh minh chứng** cho bước
  không chia chi tiết.
- Mẫu ship: Products → Material progress đã có ảnh minh chứng sẵn (giữ nguyên, không đổi).
- Ảnh lưu trong Supabase Storage bucket hiện có (`erp-images`).

## 4. Products: Lịch sử thay đổi từ khách hàng
- Thay cho "Revision history": mỗi dòng có ngày thay đổi, khách/người yêu cầu · kênh, nội dung, ghi chú,
  ảnh, trạng thái **Chưa xử lý / Đã xử lý** + ngày xử lý. Lọc theo trạng thái, bấm badge để đổi nhanh.
- Lưu trong bảng `sample_revisions` có sẵn (thêm 3 cột). Các revision cũ hiện là "Chưa xử lý" — rà và bấm
  đổi trạng thái một lần.

## Triển khai
1. Supabase → SQL Editor → chạy **`tanhoa_v57_qc_photos_change_history.sql`** (sau v56). Chỉ thêm cột / bảng.
   **Chạy SQL TRƯỚC khi deploy code** — code v57 ghi vào các cột mới.
2. GitHub: upload các file mới `PhotoProof.jsx`, `QcView.jsx`, `qcApi.js`, `qcLogic.js`,
   `ProductChangeHistory.jsx`, `tests/qcLogic.test.mjs`, `tanhoa_v57_qc_photos_change_history.sql`,
   `v57_README.md` và các file sửa `tanhoa_erp.jsx`, `supabaseRest.js`, `SampleTestTrackingView.jsx`,
   `sampleTestApi.js`.
3. Vercel tự deploy.

## Kiểm tra đã chạy
- `node tests/sampleTestLogic.test.mjs` (14) và `node tests/qcLogic.test.mjs` (4) — pass.
- `vite build` — OK.
- Giao diện với dữ liệu giả: tạo mẫu nhập riêng, chuyển sang Products, thêm chi tiết + upload ảnh,
  ghi test fail → phiếu QC tự tạo, form QC theo bước, module QA/QC, khối QA/QC + lịch sử thay đổi trong
  chi tiết Products — không lỗi runtime. Chưa chạy với Supabase thật.
