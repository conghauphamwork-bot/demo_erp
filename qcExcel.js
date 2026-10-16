/* ------------------------------------------------------------------
   QA/QC — Excel import / export (v59), pure logic.
   Mã ERP là khoá liên kết: phiếu tự gắn vào Sample (mẫu mới nhất cùng mã ERP)
   và hiện trong khối QA/QC của Sample + Master Products có mã đó.
   Dòng có ID = sửa phiếu cũ (chỉ ghi ô thay đổi); không ID = phiếu mới.
------------------------------------------------------------------- */
import { QC_SOURCES, QC_STATUSES } from "./qcLogic.js";
import { parseCellDate, toSheetDate } from "./sampleTestExcel.js";

export const QC_COLUMNS = [
  { key: "id", header: "ID (để trống = phiếu mới)" },
  { key: "erpNo", header: "Mã ERP *" },
  { key: "productName", header: "Sản phẩm (chỉ xem)", readonly: true },
  { key: "source", header: "Nguồn (Mẫu test / Mẫu ship / Hàng Final / Khác)" },
  { key: "stageLabel", header: "Công đoạn kiểm" },
  { key: "inspectionDate", header: "Ngày kiểm *", date: true },
  { key: "inspector", header: "Người kiểm" },
  { key: "qtyChecked", header: "SL kiểm", num: true },
  { key: "qtyDefect", header: "SL lỗi", num: true },
  { key: "result", header: "Kết quả (Pass / Fail) *" },
  { key: "defectCategory", header: "Phân loại lỗi" },
  { key: "severity", header: "Mức độ" },
  { key: "defectDescription", header: "Mô tả lỗi" },
  { key: "rootCause", header: "Nguyên nhân" },
  { key: "correctiveAction", header: "Hướng xử lý" },
  { key: "responsible", header: "Người xử lý" },
  { key: "dueDate", header: "Hạn xử lý", date: true },
  { key: "completedDate", header: "Ngày hoàn thành xử lý", date: true },
  { key: "status", header: "Trạng thái (Mở / Đang xử lý / Đã xử lý)" },
  { key: "ncrNo", header: "Số NCR" },
  { key: "note", header: "Ghi chú" },
];
const LABEL = Object.fromEntries(QC_COLUMNS.map((c) => [c.key, c.header.split(" (")[0].replace(" *", "")]));
const norm = (h) => String(h || "").toLowerCase().split(" (")[0].replace(/\*/g, "").replace(/\s+/g, " ").trim();
const fold = (t) => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().trim();

export function buildQcExport(records) {
  return {
    headers: QC_COLUMNS.map((c) => c.header),
    rows: records.map((r) => QC_COLUMNS.map((c) => (c.date ? toSheetDate(r[c.key]) : r[c.key] ?? ""))),
  };
}

function normResult(v) {
  const f = fold(v);
  if (!f) return "";
  if (["pass", "dat", "ok", "p"].includes(f)) return "Pass";
  if (["fail", "khong dat", "loi", "ng", "f"].includes(f)) return "Fail";
  return null;
}
function normFrom(list, v) {
  const f = fold(v);
  if (!f) return "";
  return list.find((x) => fold(x) === f) || null;
}

/**
 * rows: [{ rowNumber, cells: { A: v, ... } }] (row 1 = headers)
 * ctx: { records, samples, masterProducts, settings }
 * → { creates: [rec], updates: [{ id, patch, erp }], changes: [{row, erp, field, from, to}], errors, warnings, skipped, rowsRead }
 */
export function diffQcImport(rows, ctx, newId = (i) => `qc-imp-${Date.now().toString(36)}-${i}`) {
  const { records = [], samples = [], masterProducts = [], settings = { categories: [], severities: [] } } = ctx;
  const out = { creates: [], updates: [], changes: [], errors: [], warnings: [], skipped: [], rowsRead: 0, unknownHeaders: [] };
  if (!rows.length) { out.errors.push({ row: 0, message: "File trống." }); return out; }
  const colByLetter = {};
  for (const [letter, label] of Object.entries(rows[0].cells)) {
    const col = QC_COLUMNS.find((c) => norm(c.header) === norm(label));
    if (col) colByLetter[letter] = col; else if (String(label || "").trim()) out.unknownHeaders.push(String(label));
  }
  const has = (k) => Object.values(colByLetter).some((c) => c.key === k);
  if (!has("erpNo") && !has("id")) { out.errors.push({ row: 1, message: 'Không thấy cột "Mã ERP". Dùng file mẫu xuất từ ERP.' }); return out; }

  const byId = new Map(records.map((r) => [r.id, r]));
  const lc = (x) => String(x || "").trim().toLowerCase();
  const masterByErp = new Map(masterProducts.filter((m) => m.erpNo).map((m) => [lc(m.erpNo), m]));
  const sampleByErp = new Map();
  for (const s of [...samples].sort((a, b) => String(a.id).localeCompare(String(b.id)))) if (s.erpNo) sampleByErp.set(lc(s.erpNo), s); // latest id wins
  const sig = (r) => [lc(r.erpNo), r.inspectionDate, lc(r.stageLabel), r.result, lc(r.defectDescription)].join("|");
  const existingSig = new Set(records.map(sig));
  const cats = new Set((settings.categories || []).map(fold));
  const sevs = new Set((settings.severities || []).map(fold));
  let n = 0;

  for (const r of rows.slice(1)) {
    const cells = r.cells;
    if (!Object.values(cells).some((v) => String(v ?? "").trim() !== "")) continue;
    out.rowsRead++;
    const v = {};
    let bad = false;
    for (const [letter, col] of Object.entries(colByLetter)) {
      if (col.readonly) continue;
      const raw = cells[letter];
      const text = String(raw ?? "").trim();
      if (col.date) {
        const p = parseCellDate(raw);
        if (p.kind === "invalid" || p.kind === "na") { out.errors.push({ row: r.rowNumber, message: `${LABEL[col.key]}: "${raw}" không phải ngày (dd/mm/yyyy).` }); bad = true; continue; }
        v[col.key] = p.value;
      } else if (col.num) {
        if (text && Number.isNaN(Number(text.replace(/,/g, "")))) { out.errors.push({ row: r.rowNumber, message: `${LABEL[col.key]}: "${raw}" không phải số.` }); bad = true; continue; }
        v[col.key] = text ? Number(text.replace(/,/g, "")) : "";
      } else v[col.key] = text;
    }
    if (bad) continue;
    const erp = v.erpNo || "";
    if ("result" in v) { const x = normResult(v.result); if (x === null) { out.errors.push({ row: r.rowNumber, erp, message: `Kết quả "${v.result}" phải là Pass hoặc Fail.` }); continue; } v.result = x; }
    if ("source" in v) { const x = normFrom(QC_SOURCES, v.source); if (x === null) { out.errors.push({ row: r.rowNumber, erp, message: `Nguồn "${v.source}" phải là ${QC_SOURCES.join(" / ")}.` }); continue; } v.source = x; }
    if ("status" in v) { const x = normFrom(QC_STATUSES, v.status); if (x === null) { out.errors.push({ row: r.rowNumber, erp, message: `Trạng thái "${v.status}" phải là ${QC_STATUSES.join(" / ")}.` }); continue; } v.status = x; }
    if (v.defectCategory && !cats.has(fold(v.defectCategory))) out.warnings.push({ row: r.rowNumber, erp, message: `Phân loại lỗi "${v.defectCategory}" chưa có trong danh mục — vẫn nhập.` });
    if (v.severity && !sevs.has(fold(v.severity))) out.warnings.push({ row: r.rowNumber, erp, message: `Mức độ "${v.severity}" chưa có trong danh mục — vẫn nhập.` });

    // link by ERP
    const link = (code) => {
      const m = masterByErp.get(lc(code)), s = sampleByErp.get(lc(code));
      if (!m && !s) out.warnings.push({ row: r.rowNumber, erp: code, message: "Mã ERP chưa có trong Sample / Master Products — vẫn nhập, chưa liên kết sản phẩm." });
      return { sampleId: s?.id || m?.sourceSampleId || "", productName: m?.description || String(s?.name || "").split("\n")[0] || "", customerId: m?.customerId || s?.customerId || "" };
    };

    if (v.id) {
      const cur = byId.get(v.id);
      if (!cur) { out.errors.push({ row: r.rowNumber, erp, message: `ID ${v.id} không có trong hệ thống — để trống ID nếu là phiếu mới.` }); continue; }
      const patch = {};
      for (const k of Object.keys(v)) {
        if (k === "id") continue;
        const a = cur[k] ?? "", b = v[k] ?? "";
        const isDate = QC_COLUMNS.find((c) => c.key === k)?.date;
        if (String(a) !== String(b)) { patch[k] = v[k]; out.changes.push({ row: r.rowNumber, erp: cur.erpNo || erp, field: LABEL[k] || k, from: isDate ? toSheetDate(a) : a, to: isDate ? toSheetDate(b) : b, id: v.id }); }
      }
      if (patch.erpNo !== undefined && patch.erpNo !== cur.erpNo) Object.assign(patch, link(patch.erpNo));
      if (patch.result === "Pass") patch.status = "Đạt";
      else if (patch.result === "Fail" && cur.status === "Đạt" && !patch.status) patch.status = patch.completedDate || cur.completedDate ? "Đã xử lý" : "Mở";
      if (Object.keys(patch).length) out.updates.push({ id: v.id, patch, erp: cur.erpNo || erp });
      continue;
    }
    // new record
    if (!erp) { out.errors.push({ row: r.rowNumber, message: "Thiếu Mã ERP." }); continue; }
    if (!v.inspectionDate) { out.errors.push({ row: r.rowNumber, erp, message: "Thiếu Ngày kiểm." }); continue; }
    if (!v.result) { out.errors.push({ row: r.rowNumber, erp, message: "Thiếu Kết quả (Pass / Fail)." }); continue; }
    const rec = {
      id: newId(n++), source: v.source || "Khác", trackingId: "", testId: "", stageCode: "", erpNo: erp, ...link(erp),
      stageLabel: v.stageLabel || "", inspectionDate: v.inspectionDate, inspector: v.inspector || "", qtyChecked: v.qtyChecked ?? "", qtyDefect: v.qtyDefect ?? "",
      result: v.result, defectCategory: v.defectCategory || "", severity: v.severity || "", defectDescription: v.defectDescription || "",
      rootCause: v.rootCause || "", correctiveAction: v.correctiveAction || "", responsible: v.responsible || "", dueDate: v.dueDate || "",
      completedDate: v.completedDate || "", ncrNo: v.ncrNo || "", note: v.note || "", photos: [], fixPhotos: [],
    };
    rec.status = rec.result === "Pass" ? "Đạt" : (v.status && v.status !== "Đạt" ? v.status : (rec.completedDate ? "Đã xử lý" : "Mở"));
    const s = sig(rec);
    if (existingSig.has(s)) { out.skipped.push({ row: r.rowNumber, erp, message: "Trùng phiếu đã có (cùng mã ERP, ngày kiểm, công đoạn, kết quả, mô tả lỗi) — bỏ qua." }); continue; }
    existingSig.add(s);
    out.creates.push(rec);
  }
  return out;
}
