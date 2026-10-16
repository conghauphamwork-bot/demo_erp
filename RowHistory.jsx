/* ------------------------------------------------------------------
   v59 — Lịch sử sửa đổi từng dòng.
   Dữ liệu do trigger SQL ghi vào erp_audit_log (bảng, id dòng, trường đổi
   cũ → mới, người sửa, ngày giờ). Nút <RowHistoryButton table="samples" rowId="SA00001" />
   dùng được ở mọi bảng; bấm mở cửa sổ xem lịch sử.
------------------------------------------------------------------- */
import React, { useEffect, useState } from "react";
import { History, X } from "lucide-react";
import { selectPath } from "./supabaseRest";

const C = { ink: "#111827", soft: "#6B7280", line: "#E5E7EB", bg: "#F6F8FB", red: "#DC2626", green: "#059669", blue: "#2563EB", amber: "#B45309" };

export const TABLE_LABELS = {
  samples: "Sample", sample_components: "Vật tư mẫu ship", customers: "Khách hàng", tasks: "Công việc",
  manufacturing_orders: "LSX", mo_product_lines: "Dòng sản phẩm LSX", production_approvals: "Phê duyệt sản xuất",
  production_lots: "Lô sản xuất", mass_production_test_samples: "Mẫu test hàng đại trà",
  test_trackings: "Theo dõi mẫu test", test_tracking_steps: "Bước tiến độ mẫu test", test_tracking_parts: "Chi tiết vật tư (mẫu test)",
  test_tracking_tests: "Nhật ký test", qc_records: "Phiếu QA/QC", master_products: "Master Product",
  master_product_changes: "Lịch sử thay đổi (Master)", proforma_invoices: "PI", proforma_invoice_lines: "Dòng PI",
  "erp_records:quote": "Báo giá", "erp_records:order": "Đơn hàng", "erp_records:shipment": "Lô giao hàng",
  product_types: "Loại sản phẩm", main_materials: "Vật liệu chính", finishes: "Màu hoàn thiện", wood_surface_treatments: "Xử lý bề mặt gỗ",
  fabric_types: "Loại vải", fabric_colors: "Màu vải", rope_types: "Loại dây", rope_colors: "Màu dây", cemboard_colors: "Màu cemboard",
};
const FIELD_LABELS = {
  name: "Tên / mô tả", description: "Mô tả", erp_no: "Mã ERP", customer_id: "Khách hàng", product_type_id: "Loại sản phẩm", qty: "Số lượng",
  width: "Rộng", depth: "Sâu", height: "Cao", arm_height: "Cao tay", seat_height: "Cao ngồi", image_url: "Ảnh",
  main_material_id: "Vật liệu chính", finishes_color_id: "Màu hoàn thiện", wood_surface_treatment_id: "Xử lý bề mặt gỗ",
  fabric_type_id: "Loại vải", fabric_color_id: "Màu vải", rope_type_id: "Loại dây", rope_diameter: "Đường kính dây", rope_color_id: "Màu dây",
  metal_name: "Kim loại", metal_color: "Màu kim loại", cemboard_color_id: "Màu cemboard", hardware: "Hardware", construction: "Kết cấu",
  current_revision: "Revision", stage: "Công đoạn", stage_status: "Trạng thái công đoạn", stage_start_date: "Ngày bắt đầu công đoạn",
  target_date: "Ngày mục tiêu", completed_date: "Ngày hoàn thành", priority: "Ưu tiên", overall_status: "Tình trạng chung",
  manufacturing_order_no: "Số LSX mẫu", idp_no: "IDP", idc_no: "IDC", pcs_per_ctn: "Pcs/Ctn", cbm: "CBM",
  carton_length: "Carton dài", carton_width: "Carton rộng", carton_height: "Carton cao", net_weight: "NW", gross_weight: "GW", carton_qty: "Số carton",
  customer_approval_status: "Khách duyệt", customer_approval_date: "Ngày khách duyệt", customer_approval_note: "Ghi chú duyệt", customer_approval_by: "Người ghi nhận duyệt",
  status: "Trạng thái", notes: "Ghi chú", note: "Ghi chú", owner: "Người phụ trách", start_date: "Ngày bắt đầu", test_deadline: "Hạn mang đi test",
  weave_on: "Đan dây trên", lsx_no: "LSX", plan_date: "KH gốc / ấn định", actual_date: "Thực tế", reschedule_date: "Hẹn lại",
  not_applicable: "N/A", proof_images: "Ảnh minh chứng", step_code: "Bước", mo_no: "Số LSX", mo_type: "Loại LSX", issue_date: "Ngày thực hiện",
  po_reference: "PO", order_qty_total: "Tổng SL", planned_ship_date: "Ngày ship dự kiến", pi_id: "PI", qty_ordered: "SL đặt",
  unit_price: "Đơn giá", production_stage: "Công đoạn SX", planned_complete_date: "Dự kiến xong", actual_complete_date: "Thực tế xong",
  pi_no: "Số PI", pi_date: "Ngày PI", po_no: "Số PO", po_date: "Ngày PO", ship_date: "Ngày ship", currency: "Tiền tệ",
  source: "Nguồn", result: "Kết quả", defect_category: "Phân loại lỗi", severity: "Mức độ", defect_description: "Mô tả lỗi",
  root_cause: "Nguyên nhân", corrective_action: "Hướng xử lý", responsible: "Người xử lý", due_date: "Hạn xử lý", inspection_date: "Ngày kiểm",
  inspector: "Người kiểm", qty_checked: "SL kiểm", qty_defect: "SL lỗi", ncr_no: "Số NCR", photos: "Ảnh lỗi", fix_photos: "Ảnh sau xử lý",
  change_date: "Ngày thay đổi", content: "Nội dung thay đổi", requested_by: "Người yêu cầu", processed_date: "Ngày xử lý", photo_url: "Ảnh / tài liệu",
  attachments: "File đính kèm", specs: "Thông số", accepted_date: "Ngày khách accept", item_name: "Chi tiết", promised_date: "Ngày hẹn",
  received_date: "Ngày nhận", iqc_result: "IQC", rescheduled_date: "Hẹn lại", supplier: "NCC", deadline: "Hạn", reference_person: "Người liên quan",
};
const label = (k) => FIELD_LABELS[k] || k;
const pad = (n) => String(n).padStart(2, "0");
const fmtTime = (iso) => { const d = new Date(iso); return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
export function showValue(v) {
  if (v === null || v === undefined || v === "") return "—";
  if (v === true) return "Có"; if (v === false) return "Không";
  if (typeof v === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) { const [y, m, d] = v.split("-"); return `${d}/${m}/${y}`; }
    if (/^\d{4}-\d{2}-\d{2}T/.test(v)) return fmtTime(v);
    return v;
  }
  if (Array.isArray(v)) return v.length ? `${v.length} mục` : "—";
  if (typeof v === "object") return Object.entries(v).filter(([, x]) => x !== null && x !== "").map(([k, x]) => `${label(k)}: ${typeof x === "object" ? JSON.stringify(x) : x}`).join(" · ").slice(0, 400) || "—";
  return String(v);
}
const decodeActor = (a) => { try { return a ? decodeURIComponent(a) : ""; } catch (_) { return a || ""; } };

export async function loadRowHistory(table, rowId, includeRelated) {
  const id = String(rowId);
  const q = includeRelated
    ? `erp_audit_log?or=${encodeURIComponent(`(and(table_name.eq."${table}",row_id.eq."${id}"),parent_ids.cs.{"${id}"})`)}&order=changed_at.desc,id.desc`
    : `erp_audit_log?table_name=eq.${encodeURIComponent(table)}&row_id=eq.${encodeURIComponent(id)}&order=changed_at.desc,id.desc`;
  return (await selectPath(q, 1000)) || [];
}

/** Changes of a specs/payload object are shown per sub-field. */
function expand(changed) {
  const out = [];
  for (const [k, v] of Object.entries(changed || {})) {
    const o = v?.old, n = v?.new;
    if (o && n && typeof o === "object" && typeof n === "object" && !Array.isArray(o) && !Array.isArray(n)) {
      for (const sk of new Set([...Object.keys(o), ...Object.keys(n)])) {
        if (JSON.stringify(o[sk]) !== JSON.stringify(n[sk])) out.push({ field: `${label(k)} › ${label(sk)}`, old: o[sk], new: n[sk] });
      }
    } else out.push({ field: label(k), old: o, new: n });
  }
  return out;
}

export function RowHistoryModal({ table, rowId, title, related = true, onClose }) {
  const [state, setState] = useState({ loading: true, rows: [], error: "" });
  const [withRelated, setWithRelated] = useState(false);
  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true }));
    loadRowHistory(table, rowId, withRelated)
      .then((rows) => alive && setState({ loading: false, rows, error: "" }))
      .catch((e) => alive && setState({ loading: false, rows: [], error: String(e?.message || e) }));
    return () => { alive = false; };
  }, [table, rowId, withRelated]);
  const missing = /erp_audit_log|PGRST205|42P01|does not exist/i.test(state.error);
  const th = { textAlign: "left", padding: "5px 8px", fontSize: 11.5, color: C.soft, fontWeight: 700, borderBottom: `1px solid ${C.line}` };
  const td = { padding: "5px 8px", fontSize: 12.5, borderBottom: `1px solid ${C.line}`, verticalAlign: "top", wordBreak: "break-word" };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.45)", zIndex: 2000, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 16px", overflowY: "auto" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "min(920px, 100%)", background: "#FFFFFF", borderRadius: 14, padding: 18, display: "flex", flexDirection: "column", gap: 12, color: C.ink, textAlign: "left" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17, display: "flex", alignItems: "center", gap: 8 }}><History size={17} /> Lịch sử sửa đổi</div>
            <div style={{ fontSize: 12.5, color: C.soft }}>{TABLE_LABELS[table] || table} · {title || rowId}</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {related && <label style={{ fontSize: 12.5, display: "inline-flex", gap: 6, alignItems: "center" }}><input type="checkbox" checked={withRelated} onChange={(e) => setWithRelated(e.target.checked)} /> Gồm dữ liệu liên quan</label>}
            <button type="button" onClick={onClose} style={{ border: `1px solid ${C.line}`, background: "#FFF", borderRadius: 8, padding: "5px 9px", cursor: "pointer" }}><X size={14} /></button>
          </div>
        </div>
        {state.loading && <div style={{ fontSize: 13, color: C.soft }}>Đang tải…</div>}
        {!state.loading && state.error && (
          <div style={{ fontSize: 13, color: missing ? C.amber : C.red }}>
            {missing ? <>Chưa bật lịch sử sửa đổi: chạy file <b>tanhoa_v59_audit_qc_attachments.sql</b> trong Supabase. Lịch sử chỉ ghi từ lúc chạy SQL trở đi.</> : state.error}
          </div>
        )}
        {!state.loading && !state.error && !state.rows.length && <div style={{ fontSize: 13, color: C.soft }}>Chưa có sửa đổi nào được ghi nhận (lịch sử bắt đầu từ khi chạy SQL v59).</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: "68vh", overflowY: "auto" }}>
          {state.rows.map((r) => {
            const tone = r.action === "INSERT" ? C.green : r.action === "DELETE" ? C.red : C.blue;
            const otherRow = r.table_name !== table || String(r.row_id) !== String(rowId);
            const items = r.action === "UPDATE" ? expand(r.changed) : Object.entries(r.changed || {}).filter(([k]) => k !== "id").map(([k, v]) => ({ field: label(k), value: v }));
            return (
              <div key={r.id} style={{ border: `1px solid ${C.line}`, borderRadius: 10, padding: "8px 10px" }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", fontSize: 12.5, marginBottom: 6 }}>
                  <b>{fmtTime(r.changed_at)}</b>
                  <span style={{ color: tone, fontWeight: 700 }}>{r.action === "INSERT" ? "Tạo mới" : r.action === "DELETE" ? "Xoá" : "Sửa"}</span>
                  <span style={{ color: C.soft }}>{decodeActor(r.actor) || "(không rõ người sửa)"}</span>
                  {otherRow && <span style={{ background: C.bg, borderRadius: 6, padding: "1px 7px", color: C.soft }}>{TABLE_LABELS[r.table_name] || r.table_name} · {r.row_id}</span>}
                </div>
                {r.action === "UPDATE" ? (
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead><tr><th style={{ ...th, width: "28%" }}>Trường</th><th style={th}>Trước</th><th style={th}>Sau</th></tr></thead>
                    <tbody>{items.map((x, i) => (
                      <tr key={i}><td style={{ ...td, fontWeight: 600 }}>{x.field}</td><td style={{ ...td, color: C.soft, textDecoration: "line-through" }}>{showValue(x.old)}</td><td style={{ ...td, fontWeight: 600 }}>{showValue(x.new)}</td></tr>
                    ))}</tbody>
                  </table>
                ) : (
                  <div style={{ fontSize: 12, color: C.soft, lineHeight: 1.6 }}>{items.slice(0, 14).map((x) => `${x.field}: ${showValue(x.value)}`).join(" · ")}{items.length > 14 ? " …" : ""}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** Small icon button for a table row. Stops the click from opening the row. */
export function RowHistoryButton({ table, rowId, title, related = true, label: text = "", size = 14 }) {
  const [open, setOpen] = useState(false);
  if (!rowId) return null;
  return (
    <>
      <button type="button" title="Lịch sử sửa đổi" onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        style={{ border: `1px solid ${C.line}`, background: "#FFFFFF", borderRadius: 8, padding: text ? "4px 9px" : "4px 6px", cursor: "pointer", color: C.soft, display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600 }}>
        <History size={size} />{text}
      </button>
      {open && <span onClick={(e) => e.stopPropagation()}><RowHistoryModal table={table} rowId={rowId} title={title} related={related} onClose={() => setOpen(false)} /></span>}
    </>
  );
}
