/* ------------------------------------------------------------------
   Theo dõi mẫu test — Excel round-trip (v58.4), pure logic (no React/Supabase).
   Export: 1 dòng / 1 lượt theo dõi, mỗi bước có cột "Thực tế" (+ "Ấn định",
   "Hẹn lại" cho bước ngày ấn định). Import: so sánh từng ô với dữ liệu hiện tại
   → danh sách thay đổi để xem trước, rồi mới ghi.
   Cột được nhận theo TÊN tiêu đề (đổi thứ tự cột trong Excel không sao).
------------------------------------------------------------------- */
import { WEAVE_OPTIONS } from "./sampleTestLogic.js";

export const NA_TEXT = "N/A";
const READONLY = " (chỉ xem)";
export const META_COLUMNS = [
  { key: "id", header: "ID (không sửa)" },
  { key: "erp", header: "Mã ERP" + READONLY },
  { key: "desc", header: "Mô tả" + READONLY },
  { key: "customer", header: "Khách" + READONLY },
  { key: "lsx", header: "LSX" + READONLY },
  { key: "status", header: "Tình trạng" + READONLY },
  { key: "owner", header: "Người phụ trách", edit: "tracking" },
  { key: "startDate", header: "Ngày bắt đầu", edit: "tracking", date: true },
  { key: "testDeadline", header: "Hạn mang đi test", edit: "tracking", date: true },
  { key: "weaveOn", header: "Đan dây trên (Khung sắt / Khung gỗ / Cả hai / Không đan)", edit: "tracking" },
];

const pad = (n) => String(n).padStart(2, "0");
/** ISO → "dd/mm/yyyy" for the sheet */
export function toSheetDate(iso) {
  if (!iso) return "";
  const [y, m, d] = String(iso).slice(0, 10).split("-");
  return d ? `${d}/${m}/${y}` : String(iso);
}
/** Cell → { kind: "empty" | "na" | "date" | "invalid", value } */
export function parseCellDate(raw) {
  if (raw === null || raw === undefined) return { kind: "empty", value: "" };
  const text = String(raw).trim();
  if (!text) return { kind: "empty", value: "" };
  if (/^(n\/?a|na|-|không|khong|x)$/i.test(text)) return { kind: "na", value: NA_TEXT };
  if (/^\d+(\.\d+)?$/.test(text)) {
    const n = Number(text);
    if (n > 20000 && n < 80000) { // Excel serial date
      const d = new Date(Date.UTC(1899, 11, 30) + Math.round(n) * 86400000);
      return { kind: "date", value: d.toISOString().slice(0, 10) };
    }
    return { kind: "invalid", value: text };
  }
  let m = text.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  let y, mo, d;
  if (m) { y = +m[1]; mo = +m[2]; d = +m[3]; }
  else if ((m = text.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/))) { d = +m[1]; mo = +m[2]; y = +m[3]; if (y < 100) y += 2000; }
  else return { kind: "invalid", value: text };
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return { kind: "invalid", value: text };
  return { kind: "date", value: `${y}-${pad(mo)}-${pad(d)}` };
}
const weaveLabel = (v) => WEAVE_OPTIONS.find((o) => o.value === v)?.label || "";
function weaveValue(text) {
  const t = String(text || "").trim().toLowerCase();
  if (!t) return { ok: true, value: "" };
  const hit = WEAVE_OPTIONS.find((o) => o.label.toLowerCase() === t || o.value === t);
  return hit ? { ok: true, value: hit.value } : { ok: false, value: text };
}

/** Column list for the current step settings. */
export function stepColumns(settings) {
  const cols = [];
  for (const s of settings.steps) {
    if (s.source !== "input") { cols.push({ key: `${s.code}:actual`, header: `${s.short} · Thực tế${READONLY}`, step: s.code }); continue; }
    if (s.planType === "fixed") cols.push({ key: `${s.code}:plan`, header: `${s.short} · Ấn định`, step: s.code, edit: "plan" });
    else cols.push({ key: `${s.code}:forecast`, header: `${s.short} · Dự kiến${READONLY}`, step: s.code });
    cols.push({ key: `${s.code}:actual`, header: `${s.short} · Thực tế`, step: s.code, edit: "actual" });
    if (s.planType === "fixed") cols.push({ key: `${s.code}:resched`, header: `${s.short} · Hẹn lại`, step: s.code, edit: "resched" });
  }
  return cols;
}
export const allColumns = (settings) => [...META_COLUMNS, ...stepColumns(settings)];

/** entries = [{ id, tracking, info, computed }] (same shape as the view). */
export function buildExportTable(entries, settings, customerName = (x) => x) {
  const cols = allColumns(settings);
  const rows = entries.map((e) => {
    const t = e.tracking, c = e.computed;
    const by = c.byCode || Object.fromEntries(c.steps.map((s) => [s.code, s]));
    return cols.map((col) => {
      switch (col.key) {
        case "id": return t.id;
        case "erp": return e.info.erpNo;
        case "desc": return e.info.description;
        case "customer": return customerName(e.info.customerId);
        case "lsx": return t.lsxNo;
        case "status": return c.status;
        case "owner": return t.owner;
        case "startDate": return toSheetDate(t.startDate);
        case "testDeadline": return toSheetDate(t.testDeadline);
        case "weaveOn": return weaveLabel(t.weaveOn);
        default: {
          const s = by[col.step];
          if (!s) return "";
          const kind = col.key.split(":")[1];
          if (s.na) return kind === "actual" || kind === "plan" ? NA_TEXT : "";
          if (kind === "plan") return toSheetDate(s.row.planDate || (s.hasParts ? s.plan : ""));
          if (kind === "forecast") return toSheetDate(s.forecast);
          if (kind === "resched") return toSheetDate(s.row.rescheduleDate || (s.hasParts ? s.reschedule : ""));
          return toSheetDate(s.actual || s.row.actualDate);
        }
      }
    });
  });
  return { headers: cols.map((c) => c.header), rows };
}

const norm = (h) => String(h || "").replace(/\s+/g, " ").trim().toLowerCase();

/**
 * rows: [{ rowNumber, cells: { A: value, B: ... } }] (first row = headers)
 * Returns { changes, errors, skipped, unchangedRows, trackingPatches, stepPatches }
 *   change = { trackingId, erp, field, label, from, to }
 */
export function diffImport(rows, entries, settings) {
  const cols = allColumns(settings);
  const out = { changes: [], errors: [], skipped: [], trackingPatches: {}, stepPatches: {}, rowsRead: 0, unknownHeaders: [] };
  if (!rows.length) { out.errors.push({ row: 0, message: "File trống." }); return out; }
  const header = rows[0].cells;
  const colByLetter = {};
  for (const [letter, label] of Object.entries(header)) {
    const col = cols.find((c) => norm(c.header) === norm(label));
    if (col) colByLetter[letter] = col; else if (String(label || "").trim()) out.unknownHeaders.push(String(label));
  }
  const idLetter = Object.keys(colByLetter).find((l) => colByLetter[l].key === "id");
  if (!idLetter) { out.errors.push({ row: 1, message: 'Không thấy cột "ID (không sửa)". Hãy dùng file xuất từ ERP.' }); return out; }
  const byId = new Map(entries.map((e) => [e.id, e]));
  const seen = new Set();

  for (const r of rows.slice(1)) {
    const cells = r.cells;
    if (!Object.values(cells).some((v) => String(v ?? "").trim() !== "")) continue;
    out.rowsRead++;
    const id = String(cells[idLetter] ?? "").trim();
    const e = byId.get(id);
    if (!e) { out.errors.push({ row: r.rowNumber, message: id ? `ID ${id} không còn trong hệ thống (đã xoá?) — bỏ qua dòng.` : "Thiếu ID — dòng mới không tạo từ Excel, bỏ qua." }); continue; }
    if (seen.has(id)) { out.errors.push({ row: r.rowNumber, message: `ID ${id} xuất hiện 2 lần — chỉ lấy dòng đầu.` }); continue; }
    seen.add(id);
    const t = e.tracking, c = e.computed;
    const by = c.byCode || Object.fromEntries(c.steps.map((s) => [s.code, s]));
    const erp = e.info.erpNo || id;
    const push = (field, label, from, to) => out.changes.push({ trackingId: id, erp, row: r.rowNumber, field, label, from, to });
    const tp = {}, sp = {};

    for (const [letter, col] of Object.entries(colByLetter)) {
      if (!col.edit) continue;
      const raw = cells[letter];
      if (col.edit === "tracking") {
        if (col.key === "owner") {
          const v = String(raw ?? "").trim();
          if (v !== String(t.owner || "").trim()) { tp.owner = v; push("owner", "Người phụ trách", t.owner || "", v); }
        } else if (col.key === "weaveOn") {
          const w = weaveValue(raw);
          if (!w.ok) out.errors.push({ row: r.rowNumber, erp, message: `Đan dây trên "${raw}" không hợp lệ (Khung sắt / Khung gỗ / Cả hai / Không đan).` });
          else if (w.value !== (t.weaveOn || "")) { tp.weaveOn = w.value; push("weaveOn", "Đan dây trên", weaveLabel(t.weaveOn), weaveLabel(w.value)); }
        } else {
          const p = parseCellDate(raw);
          if (p.kind === "invalid" || p.kind === "na") { out.errors.push({ row: r.rowNumber, erp, message: `${col.header}: "${raw}" không phải ngày.` }); continue; }
          if (p.value !== (t[col.key] || "")) {
            if (col.key === "startDate" && !p.value) { out.errors.push({ row: r.rowNumber, erp, message: "Ngày bắt đầu không được để trống." }); continue; }
            tp[col.key] = p.value; push(col.key, col.header, toSheetDate(t[col.key]), toSheetDate(p.value));
          }
        }
        continue;
      }
      // step columns
      const s = by[col.step];
      if (!s) continue;
      const p = parseCellDate(raw);
      if (p.kind === "invalid") { out.errors.push({ row: r.rowNumber, erp, message: `${col.header}: "${raw}" không phải ngày (dd/mm/yyyy) hoặc N/A.` }); continue; }
      const stepLabel = col.header;
      const curNa = Boolean(s.row.notApplicable) || (s.code === "DAN_DAY" && t.weaveOn === "none");
      const patch = (sp[s.code] ||= {});
      if (col.edit === "actual") {
        const cur = curNa ? NA_TEXT : (s.hasParts ? (s.actual || "") : (s.row.actualDate || ""));
        const next = p.kind === "na" ? NA_TEXT : p.value;
        if (next === cur) continue;
        if (s.hasParts) { out.skipped.push({ row: r.rowNumber, erp, message: `${stepLabel}: bước theo chi tiết vật tư — cập nhật ngày ở phần chi tiết trong app.` }); continue; }
        if (s.code === "DAN_DAY" && t.weaveOn === "none" && next !== NA_TEXT) { out.skipped.push({ row: r.rowNumber, erp, message: `${stepLabel}: mã đang "Không đan" — đổi "Đan dây trên" trước.` }); continue; }
        if (s.code === "DAN_DAY" && t.weaveOn === "none") continue;
        if (next === NA_TEXT) {
          if (s.code === "LAP_RAP") { out.errors.push({ row: r.rowNumber, erp, message: "Lắp ráp không được N/A." }); continue; }
          patch.notApplicable = true; patch.actualDate = "";
        } else { patch.notApplicable = false; patch.actualDate = next; }
        push(`${s.code}:actual`, stepLabel, toSheetDate(cur) || cur, next === NA_TEXT ? NA_TEXT : (toSheetDate(next) || "(xoá)"));
      } else if (col.edit === "plan") {
        if (curNa || p.kind === "na") continue; // N/A is controlled from the "Thực tế" column
        const cur = s.row.planDate || "";
        if (p.value === cur || (s.hasParts && p.value === (s.plan || ""))) continue;
        if (s.hasParts) { out.skipped.push({ row: r.rowNumber, erp, message: `${stepLabel}: bước theo chi tiết vật tư — ngày hẹn nhập ở từng chi tiết.` }); continue; }
        patch.planDate = p.value; push(`${s.code}:plan`, stepLabel, toSheetDate(cur), toSheetDate(p.value) || "(xoá)");
      } else if (col.edit === "resched") {
        if (curNa || p.kind === "na") continue;
        const cur = s.row.rescheduleDate || "";
        if (p.value === cur || (s.hasParts && p.value === (s.reschedule || ""))) continue;
        if (s.hasParts) { out.skipped.push({ row: r.rowNumber, erp, message: `${stepLabel}: bước theo chi tiết vật tư — hẹn lại nhập ở từng chi tiết.` }); continue; }
        patch.rescheduleDate = p.value; push(`${s.code}:resched`, stepLabel, toSheetDate(cur), toSheetDate(p.value) || "(xoá)");
      }
    }
    for (const k of Object.keys(sp)) if (!Object.keys(sp[k]).length) delete sp[k];
    if (Object.keys(tp).length) out.trackingPatches[id] = tp;
    if (Object.keys(sp).length) out.stepPatches[id] = sp;
  }
  return out;
}
