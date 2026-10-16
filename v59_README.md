# Tân Hòa ERP v59 — Lịch sử sửa đổi · File đính kèm · Thay đổi hàng loạt · Import QA/QC

## 1. Lịch sử sửa đổi từng dòng (mọi bảng)
- Nút đồng hồ **Lịch sử sửa đổi** ở cuối mỗi dòng: Customers, Quotes, Orders, Shipping, Materials, Tasks,
  Manufacturing Orders (+ dòng sản phẩm, mẫu test đại trà), Sample (bảng + chi tiết), Master Products (bảng + chi tiết),
  PI, Theo dõi mẫu test (bảng + chi tiết), QA/QC.
- Bấm → xem từng lần Tạo / Sửa / Xoá: ngày giờ, người sửa, **trường nào đổi, trước → sau**.
  Tích "Gồm dữ liệu liên quan" để xem cả dòng con (VD Master: lịch sử thay đổi, dòng LSX, PI, QA/QC của mã đó).
- Ghi bằng trigger trong Supabase (bảng `erp_audit_log`) → ghi được mọi đường sửa (app, import, SQL). Lưu lại lần
  bấm Lưu không đổi gì thì không ghi. Người sửa lấy từ tài khoản đang đăng nhập.
- Lịch sử **bắt đầu từ lúc chạy SQL v59** (không có dữ liệu cũ).

## 2. Lịch sử thay đổi sản phẩm: đính kèm ảnh, PDF, Word, Excel…
- Ô "Ảnh / tài liệu" nhận nhiều file (tối đa 20 MB/file). Ảnh hiện thu nhỏ, file khác hiện tên + icon, bấm để mở.

## 3. Ghi thay đổi hàng loạt (Master Products & Sample)
- Nút **Ghi thay đổi hàng loạt** ở đầu trang: lọc theo LSX / gõ mã → tích nhiều mã → nhập 1 thay đổi (ngày, người yêu cầu,
  nội dung, file) → mỗi mã nhận 1 dòng lịch sử riêng, cùng mã nhóm.
- Đổi trạng thái 1 dòng thuộc nhóm → hỏi có áp dụng cho cả nhóm không.

## 4. QA/QC: Xuất / Nhập Excel + nguồn "Hàng Final"
- **Xuất Excel** = các phiếu đang lọc (cũng là file mẫu). **Nhập Excel** → xem trước phiếu mới / ô sửa / lỗi → Áp dụng.
- Bắt buộc: Mã ERP, Ngày kiểm, Kết quả (Pass/Fail hoặc Đạt/Không đạt). Có ID = sửa phiếu cũ; trống ID = phiếu mới.
- **Mã ERP là khoá**: phiếu tự gắn Sample (mẫu mới nhất cùng mã), hiện ở QA/QC của Sample và Master Products.
- Dòng trùng phiếu đã có (mã, ngày, công đoạn, kết quả, mô tả) tự bỏ qua → nhập lại file không nhân đôi.
- Nguồn mới: **Hàng Final**.

## Triển khai
1. Supabase → SQL Editor → chạy **`tanhoa_v59_audit_qc_attachments.sql`** (sau v56–v58; chạy lại không sao).
   **Chạy SQL TRƯỚC khi deploy** — nếu chưa chạy: lịch sử báo "chưa bật", file đính kèm vẫn lưu ảnh đầu tiên,
   nguồn "Hàng Final" bị Supabase từ chối.
2. Nếu đính kèm PDF/Word báo lỗi "mime type": bỏ dấu `--` ở dòng cuối file SQL (mục 4) rồi chạy dòng đó.
3. Upload file mới: `RowHistory.jsx`, `FileAttach.jsx`, `BulkChangeModal.jsx`, `qcExcel.js`, `tests/qcExcel.test.mjs`,
   `tanhoa_v59_audit_qc_attachments.sql`, `v59_README.md`; file sửa: `tanhoa_erp.jsx`, `supabaseRest.js`, `masterApi.js`,
   `qcApi.js`, `qcLogic.js`, `QcView.jsx`, `ProductChangeHistory.jsx`, `MasterProductsView.jsx`, `PiView.jsx`,
   `SampleTestTrackingView.jsx`.

## Kiểm tra đã chạy
- SQL v59 trên Postgres 16 (chạy 2 lần): ghi INSERT/UPDATE/DELETE đúng trường, bỏ qua lưu-không-đổi, quote/order theo
  payload, người sửa từ header, chặn nguồn lạ, nhận "Hàng Final".
- Node tests: qcExcel (2), sampleTestBulk (3), sampleTestExcel (5), masterLogic (4), qcLogic (4), sampleTestLogic (14) — pass.
- Giao diện với dữ liệu giả: cửa sổ lịch sử, đính kèm PDF + Excel, ghi thay đổi 2 mã theo LSX + đổi trạng thái cả nhóm,
  nhập Excel QA/QC (3 mới, 1 sửa, cảnh báo mã chưa có). Chưa chạy với Supabase thật.
