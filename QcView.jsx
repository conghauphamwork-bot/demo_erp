/* ------------------------------------------------------------------
   QA/QC — ghi nhận chất lượng (Pass / Fail) từ mẫu test, mẫu ship và
   kiểm tra khác: phân loại lỗi, ngày lỗi, nguyên nhân, hướng xử lý,
   ngày hoàn thành xử lý, ảnh lỗi / ảnh sau xử lý.
   - QcView: module riêng (danh sách, bộ lọc, KPI, Pareto lỗi, thiết lập)
   - QcForm: form dùng chung (module QA/QC, nút "+ QC" ở mẫu test, Products)
   - QcProductSection: khối QA/QC trong chi tiết sản phẩm (mẫu ship)
------------------------------------------------------------------- */
import React, { useEffect, useMemo, useState } from "react";
import { ShieldCheck, Plus, X, Search, RefreshCw, Settings, ListChecks, Download, Upload } from "lucide-react";
import PhotoProof from "./PhotoProof.jsx";
import { RowHistoryButton } from "./RowHistory.jsx";
import { loadQc, saveQc, saveQcMany, deleteQc, saveQcSettings } from "./qcApi";
import { buildQcExport, diffQcImport } from "./qcExcel.js";
import { QC_SOURCES, QC_RESULTS, QC_STATUSES, QC_FILTERS, qcSummary, qcOverdueDays, isQcOpen, mergeQcSettings } from "./qcLogic";
import { todayIso } from "./sampleTestLogic";
import { loadTestTracking } from "./sampleTestApi";

function uid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "qc-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}
function fmt(d) {
  if (!d) return "";
  const [y, m, day] = String(d).slice(0, 10).split("-");
  return `${day}/${m}/${String(y).slice(2)}`;
}
function firstLine(text) { return String(text || "").split(/\r?\n/)[0]; }
export function qcTone(r) {
  if (r.result === "Pass") return "green";
  if (r.status === "Đã xử lý") return "teal";
  if (qcOverdueDays(r) !== null) return "red";
  return r.status === "Đang xử lý" ? "amber" : "red";
}
function qcLabel(r) {
  if (r.result === "Pass") return "Pass";
  const od = qcOverdueDays(r);
  return od !== null ? `Fail · quá hạn ${od} ngày` : `Fail · ${r.status}`;
}

export function blankQc(extra = {}) {
  return {
    id: uid(), source: "Mẫu ship", trackingId: "", sampleId: "", testId: "", erpNo: "", productName: "", customerId: "",
    stageCode: "", stageLabel: "", inspectionDate: todayIso(), inspector: "", qtyChecked: "", qtyDefect: "", result: "Fail",
    defectCategory: "", severity: "", defectDescription: "", rootCause: "", correctiveAction: "", responsible: "", dueDate: "",
    completedDate: "", status: "Mở", ncrNo: "", photos: [], fixPhotos: [], note: "", ...extra,
  };
}

/* ================= Form ================= */
export function QcForm({ ui, draft, settings, canEdit = true, onCancel, onSave, onDelete, customerName, samples, stageOptions, trackingOptions }) {
  const { Panel, Button, Field, Input, Select, TextArea, COLORS } = ui;
  const [f, setF] = useState(draft);
  useEffect(() => { setF(draft); }, [draft?.id]);
  const set = (k) => (e) => setF({ ...f, [k]: e?.target ? e.target.value : e });
  const ro = !canEdit;
  const fail = f.result === "Fail";
  const fromTestLog = Boolean(f.testId);
  const pickProduct = (id) => {
    const p = (samples || []).find((x) => x.id === id);
    setF({ ...f, sampleId: id, erpNo: p?.erpNo || "", productName: firstLine(p?.name), customerId: p?.customerId || "", stageLabel: f.stageLabel || p?.stage || "" });
  };
  const pickTracking = (id) => {
    const t = (trackingOptions || []).find((x) => x.id === id);
    setF({ ...f, trackingId: id, sampleId: t?.sampleId || "", erpNo: t?.erpNo || "", productName: t?.description || "", customerId: t?.customerId || "" });
  };
  const submit = (e) => {
    e.preventDefault();
    if (!f.erpNo && !f.productName) { alert("Chọn / nhập sản phẩm (Mã ERP hoặc tên)."); return; }
    if (fail && !f.defectDescription.trim()) { alert("Fail: mô tả lỗi là bắt buộc."); return; }
    if (fail && f.status === "Đã xử lý" && !f.completedDate) { alert("Đã xử lý: nhập ngày hoàn thành xử lý."); return; }
    const status = !fail ? "Đạt" : (f.status === "Đạt" ? "Mở" : (f.completedDate && f.status === "Mở" ? "Đã xử lý" : f.status));
    onSave({ ...f, status });
  };

  return (
    <Panel title={`${draft.createdAt ? "Phiếu QA/QC" : "Ghi kết quả QA/QC"}${f.erpNo ? ` — ${f.erpNo}` : ""}`} action={<Button small variant="ghost" onClick={onCancel}><X size={14} /> Đóng</Button>}>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {fromTestLog && <div style={{ fontSize: 12, color: COLORS.inkSoft, background: COLORS.bg, padding: "8px 10px", borderRadius: 8 }}>Phiếu tự tạo từ nhật ký test. Ngày, kết quả, mô tả lỗi, nguyên nhân, CAPA, hạn và ngày đóng NCR được đồng bộ từ nhật ký test mỗi khi lần test được sửa — các ô còn lại (phân loại, mức độ, ảnh, người kiểm…) chỉ sửa ở đây.</div>}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 12 }}>
          <Field label="Nguồn">
            <Select value={f.source} disabled={ro || fromTestLog || Boolean(draft.trackingId && !trackingOptions)} onChange={set("source")}>
              {QC_SOURCES.map((x) => <option key={x}>{x}</option>)}
            </Select>
          </Field>
          {f.source === "Mẫu ship" && samples ? (
            <div style={{ gridColumn: "span 2" }}>
              <Field label="Sản phẩm (Products)">
                <Select value={f.sampleId} disabled={ro} onChange={(e) => pickProduct(e.target.value)}>
                  <option value="">— Chọn —</option>
                  {samples.map((p) => <option key={p.id} value={p.id}>{p.erpNo || p.id} — {firstLine(p.name)}</option>)}
                </Select>
              </Field>
            </div>
          ) : f.source === "Mẫu test" && trackingOptions ? (
            <div style={{ gridColumn: "span 2" }}>
              <Field label="Mẫu đang theo dõi test">
                <Select value={f.trackingId} disabled={ro || fromTestLog} onChange={(e) => pickTracking(e.target.value)}>
                  <option value="">— Chọn —</option>
                  {trackingOptions.map((t) => <option key={t.id} value={t.id}>{t.erpNo || "(no ERP)"} — {t.description}</option>)}
                </Select>
              </Field>
            </div>
          ) : (
            <>
              <Field label="Mã ERP"><Input value={f.erpNo} disabled={ro || Boolean(draft.trackingId || draft.sampleId)} onChange={set("erpNo")} /></Field>
              <Field label="Sản phẩm"><Input value={f.productName} disabled={ro || Boolean(draft.trackingId || draft.sampleId)} onChange={set("productName")} /></Field>
            </>
          )}
          <Field label="Công đoạn kiểm">
            {stageOptions ? (
              <Select value={f.stageLabel} disabled={ro || fromTestLog} onChange={set("stageLabel")}>
                <option value="">—</option>
                {stageOptions.map((x) => <option key={x}>{x}</option>)}
              </Select>
            ) : <Input value={f.stageLabel} disabled={ro || fromTestLog} onChange={set("stageLabel")} placeholder="VD: Lắp ráp, Final QC…" />}
          </Field>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(0,1fr))", gap: 12 }}>
          <Field label="Ngày kiểm / ngày lỗi"><Input type="date" value={f.inspectionDate} disabled={ro || fromTestLog} onChange={set("inspectionDate")} /></Field>
          <Field label="Người kiểm"><Input value={f.inspector} disabled={ro} onChange={set("inspector")} /></Field>
          <Field label="SL kiểm"><Input type="number" value={f.qtyChecked} disabled={ro} onChange={set("qtyChecked")} /></Field>
          <Field label="SL lỗi"><Input type="number" value={f.qtyDefect} disabled={ro || !fail} onChange={set("qtyDefect")} /></Field>
          <Field label="Kết quả">
            <Select value={f.result} disabled={ro || fromTestLog} onChange={(e) => setF({ ...f, result: e.target.value, status: e.target.value === "Pass" ? "Đạt" : (f.status === "Đạt" ? "Mở" : f.status) })} style={{ fontWeight: 700, color: fail ? COLORS.red : COLORS.green }}>
              {QC_RESULTS.map((x) => <option key={x}>{x}</option>)}
            </Select>
          </Field>
          <Field label="Ảnh kiểm / ảnh lỗi"><PhotoProof images={f.photos} disabled={ro} folder={`qc/${f.id}`} prefix="defect" onChange={(imgs) => setF({ ...f, photos: imgs })} /></Field>
        </div>
        {fail && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, background: "#FFF7F7", border: `1px solid ${COLORS.redSoft}`, padding: 12, borderRadius: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 12 }}>
              <Field label="Phân loại lỗi">
                <Select value={f.defectCategory} disabled={ro} onChange={set("defectCategory")}>
                  <option value="">— Chọn —</option>
                  {settings.categories.map((x) => <option key={x}>{x}</option>)}
                </Select>
              </Field>
              <Field label="Mức độ">
                <Select value={f.severity} disabled={ro} onChange={set("severity")}>
                  <option value="">—</option>
                  {settings.severities.map((x) => <option key={x}>{x}</option>)}
                </Select>
              </Field>
              <Field label="Số NCR"><Input value={f.ncrNo} disabled={ro || fromTestLog} onChange={set("ncrNo")} /></Field>
              <Field label="Trạng thái xử lý">
                <Select value={f.status === "Đạt" ? "Mở" : f.status} disabled={ro} onChange={set("status")}>
                  {QC_STATUSES.filter((x) => x !== "Đạt").map((x) => <option key={x}>{x}</option>)}
                </Select>
              </Field>
            </div>
            <Field label="Mô tả lỗi *"><TextArea rows={2} value={f.defectDescription} disabled={ro || fromTestLog} onChange={set("defectDescription")} /></Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Nguyên nhân lỗi"><TextArea rows={2} value={f.rootCause} disabled={ro || fromTestLog} onChange={set("rootCause")} /></Field>
              <Field label="Hướng xử lý"><TextArea rows={2} value={f.correctiveAction} disabled={ro || fromTestLog} onChange={set("correctiveAction")} /></Field>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 12 }}>
              <Field label="Người / bộ phận xử lý"><Input value={f.responsible} disabled={ro || fromTestLog} onChange={set("responsible")} /></Field>
              <Field label="Hạn xử lý"><Input type="date" value={f.dueDate} disabled={ro || fromTestLog} onChange={set("dueDate")} /></Field>
              <Field label="Ngày hoàn thành xử lý"><Input type="date" value={f.completedDate} disabled={ro || fromTestLog} onChange={(e) => setF({ ...f, completedDate: e.target.value, status: e.target.value ? "Đã xử lý" : (f.status === "Đã xử lý" ? "Đang xử lý" : f.status) })} /></Field>
              <Field label="Ảnh sau xử lý"><PhotoProof images={f.fixPhotos} disabled={ro} folder={`qc/${f.id}`} prefix="fixed" onChange={(imgs) => setF({ ...f, fixPhotos: imgs })} /></Field>
            </div>
          </div>
        )}
        <Field label="Ghi chú"><Input value={f.note} disabled={ro} onChange={set("note")} /></Field>
        {canEdit && (
          <div style={{ display: "flex", gap: 8, justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: 8 }}>
              <Button type="submit">Lưu phiếu</Button>
              <Button type="button" variant="ghost" onClick={onCancel}>Huỷ</Button>
            </div>
            {onDelete && draft.createdAt && !fromTestLog && <Button type="button" variant="danger" onClick={() => onDelete(f)}>Xoá phiếu</Button>}
          </div>
        )}
      </form>
    </Panel>
  );
}

/* ================= Table ================= */
function QcTable({ ui, rows, customerName, onOpen, showProduct = true }) {
  const { Badge, COLORS } = ui;
  if (!rows.length) return <div style={{ padding: "24px 0", textAlign: "center", color: COLORS.inkSoft, fontSize: 13.5 }}>Chưa có phiếu nào.</div>;
  const heads = ["Ngày", ...(showProduct ? ["Mã ERP · Sản phẩm"] : []), "Nguồn · Công đoạn", "Kết quả", "Phân loại · Mô tả lỗi", "Nguyên nhân → Hướng xử lý", "Hạn / Hoàn thành", "Ảnh", ""];
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
        <thead><tr>{heads.map((h) => <th key={h} style={{ textAlign: "left", padding: "7px 9px", borderBottom: `2px solid ${COLORS.line}`, color: COLORS.inkSoft, fontWeight: 600, fontSize: 11.5, whiteSpace: "nowrap" }}>{h}</th>)}</tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} onClick={() => onOpen(r)} style={{ cursor: "pointer", borderBottom: `1px solid ${COLORS.line}` }}
              onMouseEnter={(e) => (e.currentTarget.style.background = COLORS.bg)} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
              <td style={{ padding: "7px 9px", whiteSpace: "nowrap" }}>{fmt(r.inspectionDate)}</td>
              {showProduct && <td style={{ padding: "7px 9px", minWidth: 170 }}><div style={{ fontWeight: 700 }}>{r.erpNo || "—"}</div><div style={{ color: COLORS.inkSoft, fontSize: 11.5 }}>{r.productName}{r.customerId ? ` · ${customerName(r.customerId)}` : ""}</div></td>}
              <td style={{ padding: "7px 9px", fontSize: 12 }}><div>{r.source}</div><div style={{ color: COLORS.inkSoft }}>{r.stageLabel || "—"}{r.testId ? " · từ nhật ký test" : ""}</div></td>
              <td style={{ padding: "7px 9px" }}><Badge tone={qcTone(r)}>{qcLabel(r)}</Badge></td>
              <td style={{ padding: "7px 9px", maxWidth: 260 }}>{r.result === "Fail" ? <><div style={{ fontWeight: 600 }}>{r.defectCategory || <span style={{ color: COLORS.amber }}>chưa phân loại</span>}{r.severity ? ` · ${r.severity}` : ""}</div><div style={{ color: COLORS.inkSoft }}>{r.defectDescription}</div></> : <span style={{ color: COLORS.inkSoft }}>{r.qtyChecked ? `Kiểm ${r.qtyChecked}` : ""}</span>}</td>
              <td style={{ padding: "7px 9px", maxWidth: 260, color: COLORS.inkSoft }}>{r.rootCause}{r.correctiveAction ? <div style={{ color: COLORS.ink }}>→ {r.correctiveAction}</div> : null}</td>
              <td style={{ padding: "7px 9px", whiteSpace: "nowrap", fontSize: 12 }}>{r.dueDate ? <div>Hạn {fmt(r.dueDate)}</div> : null}{r.completedDate ? <div style={{ color: COLORS.green }}>Xong {fmt(r.completedDate)}</div> : null}</td>
              <td style={{ padding: "7px 9px" }}>{(r.photos?.length || 0) + (r.fixPhotos?.length || 0) ? <img src={(r.photos?.[0] || r.fixPhotos?.[0])} alt="" style={{ width: 30, height: 30, objectFit: "cover", borderRadius: 6 }} /> : ""}</td>
              <td style={{ padding: "7px 9px" }}><RowHistoryButton table="qc_records" rowId={r.id} title={`${r.erpNo || ""} · ${r.stageLabel || r.source}`} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ================= Module ================= */
export default function QcView({ ui, samples = [], masterProducts = [], customers = [], customerName, currentUser, canEdit = true, canDelete = true, canSettings = true, sampleStages = [], excel = null }) {
  const { Panel, Button, Badge, Input, Select, COLORS, FONT_HEAD } = ui;
  const [state, setState] = useState({ loading: true, available: true, error: "" });
  const [records, setRecords] = useState([]);
  const [settings, setSettings] = useState(mergeQcSettings());
  const [tab, setTab] = useState("list");
  const [filter, setFilter] = useState("open");
  const [source, setSource] = useState("");
  const [category, setCategory] = useState("");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null);
  const [testTrackingOptions, setTestTrackingOptions] = useState(null);
  const [importing, setImporting] = useState(false);

  const reload = async () => {
    setState((s) => ({ ...s, loading: true }));
    loadTestTracking().then((d) => {
      if (!d.available) return;
      const byId = new Map(samples.map((x) => [x.id, x]));
      setTestTrackingOptions(d.trackings.filter((t) => t.status !== "Closed").map((t) => {
        const p = byId.get(t.sampleId);
        return { id: t.id, sampleId: t.sampleId, erpNo: t.erpNo || p?.erpNo || "", description: t.productDescription || firstLine(p?.name), customerId: t.customerId || p?.customerId || "" };
      }));
    }).catch(() => {});
    try {
      const d = await loadQc();
      setRecords(d.records); setSettings(d.settings);
      setState({ loading: false, available: d.available, error: d.error || "" });
    } catch (e) { setState({ loading: false, available: true, error: e?.message || String(e) }); }
  };
  useEffect(() => { reload(); }, []);
  const run = (p, what) => p.catch((e) => { alert(`${what} thất bại: ${e?.message || e}`); reload(); });

  const save = (rec) => {
    const next = rec.createdAt ? rec : { ...rec, createdAt: new Date().toISOString() };
    setRecords((l) => (l.some((x) => x.id === next.id) ? l.map((x) => (x.id === next.id ? next : x)) : [...l, next]));
    run(saveQc(next), "Lưu phiếu QA/QC");
    setEditing(null);
  };
  const remove = (rec) => {
    if (!confirm("Xoá phiếu QA/QC này?")) return;
    setRecords((l) => l.filter((x) => x.id !== rec.id));
    run(deleteQc(rec.id), "Xoá phiếu");
    setEditing(null);
  };

  /* v59: Excel export (current filter; empty list → blank template) and import with preview */
  const exportExcel = async (list) => {
    const { headers, rows: data } = buildQcExport(list);
    try { await excel.download(`QAQC_${todayIso().replace(/-/g, "")}.xlsx`, headers, data); }
    catch (e) { alert("Xuất Excel thất bại: " + (e?.message || e)); }
  };
  const applyImport = async (d) => {
    try {
      if (d.creates.length) await saveQcMany(d.creates.map((r) => ({ ...r, createdAt: undefined })));
      for (const u of d.updates) await saveQc({ id: u.id, ...u.patch });
    } catch (e) { alert("Ghi dữ liệu QA/QC bị lỗi giữa chừng: " + (e?.message || e) + "\nDữ liệu sẽ được tải lại."); reload(); return false; }
    setRecords((l) => [...l.map((r) => { const u = d.updates.find((x) => x.id === r.id); return u ? { ...r, ...u.patch } : r; }), ...d.creates]);
    return true;
  };

  const q = query.trim().toLowerCase();
  const base = records.filter((r) => (!source || r.source === source) && (!category || (r.defectCategory || "(chưa phân loại)") === category)
    && (!q || [r.erpNo, r.productName, r.stageLabel, r.defectDescription, r.ncrNo, r.responsible, customerName(r.customerId)].join(" ").toLowerCase().includes(q)));
  const active = QC_FILTERS.find((x) => x.key === filter) || QC_FILTERS[0];
  const rows = base.filter(active.test).sort((a, b) => String(b.inspectionDate || "").localeCompare(String(a.inspectionDate || "")));
  const sum = useMemo(() => qcSummary(base), [base]);
  const maxPareto = sum.pareto[0]?.[1] || 1;

  const header = (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
        <div style={{ width: 46, height: 46, borderRadius: 15, background: "#EEF1F4", color: COLORS.woodDark, display: "grid", placeItems: "center", border: `1px solid ${COLORS.wood}66` }}><ShieldCheck size={22} /></div>
        <div>
          <h1 style={{ fontFamily: FONT_HEAD, fontSize: 26, margin: 0 }}>QA/QC</h1>
          <div style={{ marginTop: 4, color: COLORS.inkSoft, fontSize: 13 }}>Kết quả kiểm Pass / Fail từ mẫu test, mẫu ship · phân loại lỗi · nguyên nhân · hướng xử lý · ngày hoàn thành</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <Button variant="ghost" small onClick={reload}><RefreshCw size={14} /> Tải lại</Button>
        {excel && state.available && <Button variant="subtle" small onClick={() => exportExcel(rows)} title="Xuất các phiếu đang lọc — cũng dùng làm file mẫu để nhập"><Download size={14} /> Xuất Excel</Button>}
        {excel && state.available && canEdit && <Button variant="subtle" small onClick={() => setImporting(true)}><Upload size={14} /> Nhập Excel</Button>}
        {canEdit && state.available && <Button onClick={() => setEditing(blankQc({ inspector: currentUser?.full_name || "" }))}><Plus size={15} /> Ghi phiếu QC</Button>}
      </div>
    </div>
  );

  if (state.loading) return <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>{header}<Panel><div style={{ color: COLORS.inkSoft }}>Đang tải…</div></Panel></div>;
  if (!state.available) return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>{header}
      <Panel title="Cần chạy SQL v57 một lần để bật module">
        <div style={{ fontSize: 14, lineHeight: 1.7 }}>Chưa có bảng <code>qc_records</code>. Mở Supabase → SQL Editor → chạy file <b>tanhoa_v57_qc_photos_change_history.sql</b> → bấm Tải lại.<div style={{ fontSize: 12, color: COLORS.inkSoft }}>{state.error}</div></div>
      </Panel>
    </div>
  );

  const stat = (label, value, tone) => (
    <div style={{ background: "#FFFFFF", border: `1px solid ${COLORS.line}`, borderRadius: 14, padding: "14px 16px" }}>
      <div style={{ fontSize: 12, color: COLORS.inkSoft }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4, color: tone || COLORS.ink }}>{value}</div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {header}
      {importing && <QcImportModal ui={ui} excel={excel} ctx={{ records, samples, masterProducts, settings }} onApply={applyImport} onTemplate={() => exportExcel([])} onClose={() => setImporting(false)} />}
      {state.error && <div style={{ background: COLORS.redSoft, color: COLORS.red, padding: "10px 14px", borderRadius: 10, fontSize: 13 }}>{state.error}</div>}
      {editing ? (
        <QcForm ui={ui} draft={editing} settings={settings} canEdit={canEdit} customerName={customerName} onCancel={() => setEditing(null)} onSave={save} onDelete={canDelete ? remove : null}
          samples={samples} stageOptions={editing.source === "Mẫu ship" ? sampleStages : null} trackingOptions={testTrackingOptions} />
      ) : (
        <>
          <div style={{ display: "flex", gap: 6, borderBottom: `1px solid ${COLORS.line}` }}>
            {[{ key: "list", label: "Phiếu QA/QC", icon: ListChecks }, ...(canSettings ? [{ key: "settings", label: "Phân loại lỗi", icon: Settings }] : [])].map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 14px", border: "none", background: "transparent", cursor: "pointer", fontWeight: 600, fontSize: 13.5, color: tab === t.key ? COLORS.wood : COLORS.inkSoft, borderBottom: `2px solid ${tab === t.key ? COLORS.wood : "transparent"}`, marginBottom: -1 }}><t.icon size={15} /> {t.label}</button>
            ))}
          </div>
          {tab === "list" && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0,1fr))", gap: 12 }}>
                {stat("Lần kiểm", sum.total)}
                {stat("Tỷ lệ Pass", sum.passRate === null ? "—" : `${Math.round(sum.passRate * 100)}%`, COLORS.green)}
                {stat("Lỗi đang mở", sum.open, sum.open ? COLORS.red : undefined)}
                {stat("Quá hạn xử lý", sum.overdue, sum.overdue ? COLORS.red : undefined)}
                {stat("TB ngày xử lý lỗi", sum.avgFixDays === null ? "—" : sum.avgFixDays)}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 300px", gap: 16, alignItems: "start" }}>
                <Panel>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <div style={{ position: "relative", flex: "1 1 240px", maxWidth: 340 }}>
                        <Search size={15} style={{ position: "absolute", left: 10, top: 11, color: COLORS.inkSoft }} />
                        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm mã ERP, lỗi, NCR, người xử lý…" style={{ paddingLeft: 32 }} />
                      </div>
                      <Select value={source} onChange={(e) => setSource(e.target.value)} style={{ width: 150 }}><option value="">Mọi nguồn</option>{QC_SOURCES.map((x) => <option key={x}>{x}</option>)}</Select>
                      <Select value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: 200 }}><option value="">Mọi loại lỗi</option>{[...settings.categories, "(chưa phân loại)"].map((x) => <option key={x}>{x}</option>)}</Select>
                    </div>
                    <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                      {QC_FILTERS.map((fl) => {
                        const on = fl.key === filter; const n = base.filter(fl.test).length;
                        return <button key={fl.key} onClick={() => setFilter(fl.key)} style={{ border: `1px solid ${on ? COLORS.wood : COLORS.line}`, background: on ? COLORS.wood : "#FFFFFF", color: on ? "#FFFFFF" : COLORS.ink, borderRadius: 999, padding: "6px 12px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>{fl.label} <span style={{ opacity: 0.75 }}>{n}</span></button>;
                      })}
                    </div>
                    <QcTable ui={ui} rows={rows} customerName={customerName} onOpen={setEditing} />
                  </div>
                </Panel>
                <Panel title="Lỗi theo phân loại">
                  {!sum.pareto.length ? <div style={{ color: COLORS.inkSoft, fontSize: 13 }}>Chưa có lỗi.</div> : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {sum.pareto.map(([k, n]) => (
                        <button key={k} onClick={() => { setCategory(k); setFilter("fail"); }} style={{ border: "none", background: "transparent", padding: 0, textAlign: "left", cursor: "pointer" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}><span>{k}</span><b>{n}</b></div>
                          <div style={{ height: 7, background: COLORS.bg, borderRadius: 99, marginTop: 3 }}><div style={{ width: `${(n / maxPareto) * 100}%`, height: "100%", background: COLORS.red, borderRadius: 99, opacity: 0.75 }} /></div>
                        </button>
                      ))}
                    </div>
                  )}
                </Panel>
              </div>
            </>
          )}
          {tab === "settings" && canSettings && <QcSettings ui={ui} settings={settings} onSave={(s) => { setSettings(s); run(saveQcSettings(s), "Lưu phân loại lỗi"); }} />}
        </>
      )}
    </div>
  );
}

function QcSettings({ ui, settings, onSave }) {
  const { Panel, Button, Input, COLORS } = ui;
  const [cats, setCats] = useState(settings.categories);
  const [sev, setSev] = useState(settings.severities);
  const [newCat, setNewCat] = useState("");
  const dirty = JSON.stringify(cats) !== JSON.stringify(settings.categories) || JSON.stringify(sev) !== JSON.stringify(settings.severities);
  return (
    <Panel title="Phân loại lỗi & mức độ" action={<Button small disabled={!dirty} onClick={() => onSave({ categories: cats.filter(Boolean), severities: sev.filter(Boolean) })}>Lưu</Button>}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.inkSoft, marginBottom: 8 }}>Phân loại lỗi</div>
          {cats.map((c, i) => (
            <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
              <Input value={c} onChange={(e) => setCats(cats.map((x, j) => (j === i ? e.target.value : x)))} style={{ padding: "6px 9px" }} />
              <Button small variant="danger" onClick={() => setCats(cats.filter((_, j) => j !== i))}><X size={13} /></Button>
            </div>
          ))}
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            <Input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="Thêm phân loại…" style={{ padding: "6px 9px" }} />
            <Button small onClick={() => { if (newCat.trim()) setCats([...cats, newCat.trim()]); setNewCat(""); }}><Plus size={13} /></Button>
          </div>
          <div style={{ fontSize: 11.5, color: COLORS.inkSoft, marginTop: 8 }}>Đổi tên một phân loại không tự đổi các phiếu cũ đã dùng tên đó.</div>
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.inkSoft, marginBottom: 8 }}>Mức độ</div>
          {sev.map((c, i) => (
            <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
              <Input value={c} onChange={(e) => setSev(sev.map((x, j) => (j === i ? e.target.value : x)))} style={{ padding: "6px 9px" }} />
              <Button small variant="danger" onClick={() => setSev(sev.filter((_, j) => j !== i))}><X size={13} /></Button>
            </div>
          ))}
          <Button small variant="subtle" onClick={() => setSev([...sev, ""])}><Plus size={13} /> Thêm mức độ</Button>
        </div>
      </div>
    </Panel>
  );
}

/* ================= Products (mẫu ship) section ================= */
export function QcProductSection({ ui, sample, customerName, currentUser, canEdit = true, sampleStages = [], SectionHeading }) {
  const { Button, Badge, COLORS } = ui;
  const [data, setData] = useState({ loading: true, available: true, records: [], settings: mergeQcSettings() });
  const [editing, setEditing] = useState(null);
  useEffect(() => {
    let alive = true;
    loadQc().then((d) => alive && setData({ loading: false, ...d })).catch(() => alive && setData((x) => ({ ...x, loading: false, available: false })));
    return () => { alive = false; };
  }, [sample.id]);
  const mine = data.records.filter((r) => r.sampleId === sample.id || (sample.erpNo && r.erpNo === sample.erpNo)).sort((a, b) => String(b.inspectionDate).localeCompare(String(a.inspectionDate)));
  const open = mine.filter(isQcOpen).length;
  const save = (rec) => {
    const next = rec.createdAt ? rec : { ...rec, createdAt: new Date().toISOString() };
    setData((d) => ({ ...d, records: d.records.some((x) => x.id === next.id) ? d.records.map((x) => (x.id === next.id ? next : x)) : [...d.records, next] }));
    saveQc(next).catch((e) => alert("Lưu phiếu QA/QC thất bại: " + (e?.message || e)));
    setEditing(null);
  };
  const Heading = SectionHeading || (({ children }) => <div style={{ fontWeight: 700 }}>{children}</div>);
  return (
    <div style={{ marginTop: 20 }}>
      <Heading>QA/QC {mine.length ? `(${mine.length} lần kiểm${open ? ` · ${open} lỗi mở` : ""})` : ""}</Heading>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "8px 0" }}>
        <div style={{ fontSize: 12.5, color: COLORS.inkSoft }}>Ghi kết quả kiểm ở các bước QC của mẫu ship (Pass/Fail, phân loại lỗi, nguyên nhân, hướng xử lý, ảnh).</div>
        {canEdit && data.available && <Button small onClick={() => setEditing(blankQc({ source: "Mẫu ship", sampleId: sample.id, erpNo: sample.erpNo || "", productName: firstLine(sample.name), customerId: sample.customerId || "", stageLabel: sample.stage || "", inspector: currentUser?.full_name || "", result: "Pass", status: "Đạt" }))}><Plus size={13} /> Ghi QC</Button>}
      </div>
      {!data.available ? <div style={{ fontSize: 12.5, color: COLORS.inkSoft }}>Module QA/QC chưa bật (cần chạy SQL v57).</div>
        : data.loading ? <div style={{ fontSize: 12.5, color: COLORS.inkSoft }}>Đang tải…</div>
        : <QcTable ui={ui} rows={mine} customerName={customerName} onOpen={setEditing} showProduct={false} />}
      {editing && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.45)", zIndex: 1500, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 16px", overflowY: "auto" }} onClick={() => setEditing(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "min(980px, 100%)" }}>
            <QcForm ui={ui} draft={editing} settings={data.settings} canEdit={canEdit} customerName={customerName} onCancel={() => setEditing(null)} onSave={save} stageOptions={sampleStages} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= v59: Excel import with preview ================= */
function QcImportModal({ ui, excel, ctx, onApply, onTemplate, onClose }) {
  const { Button, Badge, COLORS } = ui;
  const [stage, setStage] = useState("pick");
  const [diff, setDiff] = useState(null);
  const [fileName, setFileName] = useState("");
  const [err, setErr] = useState("");
  const choose = async (e) => {
    const f = e.target.files?.[0]; e.target.value = "";
    if (!f) return;
    setFileName(f.name); setErr(""); setStage("parsing");
    try { const parsed = await excel.parse(f); setDiff(diffQcImport(parsed.rows || [], ctx)); setStage("preview"); }
    catch (x) { setErr(x?.message || String(x)); setStage("pick"); }
  };
  const apply = async () => { setStage("saving"); const ok = await onApply(diff); setStage(ok ? "done" : "preview"); };
  const th = { textAlign: "left", padding: "6px 8px", fontSize: 11.5, color: COLORS.inkSoft, fontWeight: 700, borderBottom: `1px solid ${COLORS.line}`, position: "sticky", top: 0, background: "#FFFFFF" };
  const td = { padding: "5px 8px", borderBottom: `1px solid ${COLORS.line}`, fontSize: 12.5 };
  const nChanges = diff ? diff.creates.length + diff.updates.length : 0;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.45)", zIndex: 1500, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 16px", overflowY: "auto" }} onClick={stage === "saving" ? undefined : onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "min(1040px, 100%)", background: "#FFFFFF", borderRadius: 14, padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 800, fontSize: 18 }}>Nhập phiếu QA/QC từ Excel</div>
          {stage !== "saving" && <Button small variant="ghost" onClick={onClose}><X size={14} /> Đóng</Button>}
        </div>
        {(stage === "pick" || stage === "parsing") && (
          <div style={{ fontSize: 13, lineHeight: 1.7 }}>
            <ol style={{ margin: "0 0 10px", paddingLeft: 18 }}>
              <li>Tải <button type="button" onClick={onTemplate} style={{ border: "none", background: "none", padding: 0, color: COLORS.wood, fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}>file mẫu trống</button> hoặc bấm <b>Xuất Excel</b> (các phiếu đang lọc, có cột ID để sửa).</li>
              <li>Mỗi dòng 1 lần kiểm. Bắt buộc: <b>Mã ERP</b>, <b>Ngày kiểm</b> (dd/mm/yyyy), <b>Kết quả</b> (Pass/Fail hoặc Đạt/Không đạt). <b>Nguồn</b>: Mẫu test / Mẫu ship / <b>Hàng Final</b> / Khác.</li>
              <li><b>Mã ERP là khoá</b>: phiếu tự gắn vào Sample (mẫu mới nhất cùng mã) và hiện ở khối QA/QC của Sample + Master Products có mã đó.</li>
              <li>Để trống ID = phiếu mới. Có ID = sửa phiếu đó (chỉ ghi ô thay đổi). Dòng trùng phiếu đã có tự bỏ qua (nhập lại file không bị nhân đôi).</li>
            </ol>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 8, border: `1px dashed ${COLORS.wood}`, color: COLORS.wood, borderRadius: 10, padding: "10px 14px", cursor: "pointer", fontWeight: 600 }}>
              <Upload size={15} /> {stage === "parsing" ? `Đang đọc ${fileName}…` : "Chọn file .xlsx"}
              <input type="file" accept=".xlsx" onChange={choose} style={{ display: "none" }} disabled={stage === "parsing"} />
            </label>
            {err && <div style={{ color: COLORS.red, marginTop: 8 }}>{err}</div>}
          </div>
        )}
        {diff && stage !== "pick" && stage !== "parsing" && (
          <>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Badge>{fileName}</Badge><Badge>{diff.rowsRead} dòng đọc</Badge>
              <Badge tone={diff.creates.length ? "green" : "neutral"}>{diff.creates.length} phiếu mới</Badge>
              <Badge tone={diff.updates.length ? "wood" : "neutral"}>{diff.updates.length} phiếu sửa ({diff.changes.length} ô)</Badge>
              {diff.skipped.length > 0 && <Badge tone="amber">{diff.skipped.length} dòng trùng bỏ qua</Badge>}
              {diff.warnings.length > 0 && <Badge tone="amber">{diff.warnings.length} lưu ý</Badge>}
              {diff.errors.length > 0 && <Badge tone="red">{diff.errors.length} lỗi (không nhập)</Badge>}
              {diff.unknownHeaders.length > 0 && <Badge tone="amber">cột lạ bỏ qua: {diff.unknownHeaders.join(", ")}</Badge>}
            </div>
            {(diff.errors.length + diff.warnings.length + diff.skipped.length) > 0 && (
              <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10, padding: "8px 12px", fontSize: 12.5, maxHeight: 160, overflowY: "auto" }}>
                {diff.errors.map((x, i) => <div key={"e" + i} style={{ color: COLORS.red }}>Dòng {x.row}{x.erp ? ` · ${x.erp}` : ""}: {x.message}</div>)}
                {diff.warnings.map((x, i) => <div key={"w" + i} style={{ color: "#92400E" }}>Dòng {x.row}{x.erp ? ` · ${x.erp}` : ""}: {x.message}</div>)}
                {diff.skipped.map((x, i) => <div key={"s" + i} style={{ color: COLORS.inkSoft }}>Dòng {x.row} · {x.erp}: {x.message}</div>)}
              </div>
            )}
            <div style={{ maxHeight: 360, overflowY: "auto", border: `1px solid ${COLORS.line}`, borderRadius: 10 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr><th style={th}>Loại</th><th style={th}>Mã ERP</th><th style={th}>Sản phẩm liên kết</th><th style={th}>Nguồn · Ngày</th><th style={th}>Kết quả</th><th style={th}>Nội dung</th></tr></thead>
                <tbody>
                  {diff.creates.map((r) => (
                    <tr key={r.id}><td style={td}><Badge tone="green">Mới</Badge></td><td style={{ ...td, fontWeight: 700 }}>{r.erpNo}</td>
                      <td style={td}>{r.productName || <span style={{ color: COLORS.amber }}>chưa liên kết</span>}{r.sampleId ? <span style={{ color: COLORS.inkSoft }}> · {r.sampleId}</span> : ""}</td>
                      <td style={td}>{r.source} · {r.inspectionDate.split("-").reverse().join("/")}</td><td style={td}><Badge tone={r.result === "Pass" ? "green" : "red"}>{r.result}</Badge> {r.status}</td>
                      <td style={{ ...td, color: COLORS.inkSoft }}>{[r.stageLabel, r.defectCategory, r.defectDescription].filter(Boolean).join(" · ")}</td></tr>
                  ))}
                  {diff.changes.map((c, i) => (
                    <tr key={"c" + i}><td style={td}><Badge tone="wood">Sửa</Badge></td><td style={{ ...td, fontWeight: 700 }}>{c.erp}</td><td style={td} colSpan={3}>{c.field}: <span style={{ color: COLORS.inkSoft }}>{String(c.from || "—")}</span> → <b>{String(c.to || "(xoá)")}</b></td><td style={td}></td></tr>
                  ))}
                </tbody>
              </table>
              {!nChanges && <div style={{ padding: 12, fontSize: 13, color: COLORS.inkSoft }}>Không có phiếu mới hoặc thay đổi nào.</div>}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {stage === "done"
                ? <><Badge tone="green">Đã nhập {diff.creates.length} phiếu mới, sửa {diff.updates.length} phiếu</Badge><Button small onClick={onClose}>Xong</Button></>
                : <><Button onClick={apply} disabled={!nChanges || stage === "saving"}>{stage === "saving" ? "Đang ghi…" : `Áp dụng (${diff.creates.length} mới · ${diff.updates.length} sửa)`}</Button>
                    <Button variant="ghost" onClick={() => { setDiff(null); setStage("pick"); }} disabled={stage === "saving"}>Chọn file khác</Button></>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
