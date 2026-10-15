/* ------------------------------------------------------------------
   Theo dõi mẫu test — cập nhật hàng loạt theo lô (v58.7), pure logic.
   planBulk() tính trước dòng nào sẽ được ghi / bị bỏ qua (và lý do) cho
   1 bước × nhiều mã, đồng thời giữ bản cũ để Hoàn tác.
------------------------------------------------------------------- */
export const NA = "N/A";
export const BULK_FIELDS = [
  { key: "actual", label: "Thực tế (xong)" },
  { key: "plan", label: "Ấn định (KH gốc)" },
  { key: "resched", label: "Hẹn lại" },
];

const baseRow = (trackingId, stepCode, row = {}) => ({
  id: `${trackingId}:${stepCode}`, trackingId, stepCode, planDate: "", actualDate: "", notApplicable: false,
  rescheduleDate: "", note: "", proofImages: [], ...row,
});

/**
 * entries: [{ id, tracking, info, computed }]   (computed.byCode[code].row = current step row or {})
 * opts: { stepCode, field: "actual"|"plan"|"resched", value: "YYYY-MM-DD" | "" (xoá) | "N/A", overwrite: boolean }
 * → { rows: next step rows to save, prev: rows to restore on undo, skipped: [{ id, erp, reason }], unchanged: n }
 */
export function planBulk(entries, selectedIds, opts) {
  const { stepCode, field, value, overwrite = false } = opts;
  const out = { rows: [], prev: [], skipped: [], unchanged: 0 };
  const sel = new Set(selectedIds);
  for (const e of entries) {
    if (!sel.has(e.id)) continue;
    const s = e.computed.byCode?.[stepCode];
    const erp = e.info?.erpNo || e.id;
    const skip = (reason) => out.skipped.push({ id: e.id, erp, reason });
    if (!s) { skip("không có bước này"); continue; }
    if (s.source !== "input") { skip("bước lấy từ nhật ký test"); continue; }
    if (s.hasParts) { skip("theo chi tiết vật tư — cập nhật ở từng chi tiết"); continue; }
    if (stepCode === "DAN_DAY" && e.tracking.weaveOn === "none") { skip('mã đang "Không đan"'); continue; }
    const cur = baseRow(e.id, stepCode, s.row || {});
    const isNa = Boolean(cur.notApplicable);
    let next = null;

    if (field === "actual") {
      if (value === NA) {
        if (stepCode === "LAP_RAP") { skip("Lắp ráp không được N/A"); continue; }
        if (isNa) { out.unchanged++; continue; }
        if (cur.actualDate && !overwrite) { skip("đã có ngày thực tế"); continue; }
        next = { ...cur, notApplicable: true, actualDate: "" };
      } else if (!value) { // xoá
        if (!cur.actualDate && !isNa) { out.unchanged++; continue; }
        next = { ...cur, notApplicable: false, actualDate: "" };
      } else {
        if (isNa && !overwrite) { skip("đang N/A"); continue; }
        if (cur.actualDate === value && !isNa) { out.unchanged++; continue; }
        if (cur.actualDate && !overwrite) { skip(`đã có ngày ${cur.actualDate}`); continue; }
        next = { ...cur, notApplicable: false, actualDate: value };
      }
    } else if (field === "plan") {
      if (s.planType !== "fixed") { skip("bước tính theo lead time, không có ngày ấn định"); continue; }
      if (isNa) { skip("đang N/A"); continue; }
      if ((cur.planDate || "") === (value || "")) { out.unchanged++; continue; }
      if (cur.planDate && value && !overwrite) { skip(`đã có ấn định ${cur.planDate}`); continue; }
      next = { ...cur, planDate: value || "" };
    } else if (field === "resched") {
      if (isNa) { skip("đang N/A"); continue; }
      if (cur.actualDate && value) { skip("bước đã xong"); continue; }
      if ((cur.rescheduleDate || "") === (value || "")) { out.unchanged++; continue; }
      if (cur.rescheduleDate && value && !overwrite) { skip(`đã có hẹn lại ${cur.rescheduleDate}`); continue; }
      next = { ...cur, rescheduleDate: value || "" };
    } else { skip("trường không hợp lệ"); continue; }

    out.prev.push(cur);
    out.rows.push(next);
  }
  return out;
}
