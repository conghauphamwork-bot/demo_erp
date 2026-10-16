/* ------------------------------------------------------------------
   Theo dõi mẫu test — Sample Test Tracking module (v56)
   List + quick filters · Việc hôm nay · Detail (steps, part lines, test log)
   · Settings. Scheduling rules live in sampleTestLogic.js; data access in
   sampleTestApi.js. Shared UI atoms are passed in via the `ui` prop so this
   file does not import from tanhoa_erp.jsx (no circular import).
------------------------------------------------------------------- */
import React, { useEffect, useMemo, useState } from "react";
import { FlaskConical, Plus, X, Search, ArrowLeft, Lock, Trash2, CalendarClock, Settings, ListChecks, Image as ImageIcon, RefreshCw, Download, Upload, Table2, Undo2 } from "lucide-react";
import {
  computeTracking, FILTERS, todayItems, suggestFromProduct, WEAVE_OPTIONS, IQC_RESULTS, TEST_TYPES, TEST_RESULTS,
  PLACES, todayIso, mergeSettings,
} from "./sampleTestLogic";
import {
  loadTestTracking, saveTracking, deleteTracking, saveStepRows, savePart, deletePart, saveTest, deleteTest, saveTestSettings,
} from "./sampleTestApi";
import PhotoProof from "./PhotoProof.jsx";
import { RowHistoryButton } from "./RowHistory.jsx";
import { QcForm } from "./QcView.jsx";
import { loadQc, saveQc, deleteQc } from "./qcApi";
import { qcFieldsFromTest, qcIdForTest, mergeQcSettings } from "./qcLogic";
import { lsxForMaster } from "./masterApi";
import { buildExportTable, diffImport } from "./sampleTestExcel.js";
import { planBulk, BULK_FIELDS, NA as BULK_NA } from "./sampleTestBulk.js";

const PART_STEPS = ["KHUNG_SAT", "HW", "NEM"];
const PART_SUGGESTIONS = {
  HW: ["Ốc", "Pas", "Tạ chống lật", "Bulong", "Long đền", "Chân nhựa", "Bản lề", "Ke góc"],
  NEM: ["Nệm ngồi", "Nệm lưng", "Gối"],
  KHUNG_SAT: ["Khung sắt"],
};

function uid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "id-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}
function fmt(d) {
  if (!d) return "";
  const [y, m, day] = String(d).slice(0, 10).split("-");
  return `${day}/${m}/${String(y).slice(2)}`;
}
function firstLine(text) {
  return String(text || "").split(/\r?\n/)[0];
}
function statusTone(s) {
  if (!s) return "neutral";
  if (/^(Trễ|Fail|Thiếu|IQC không đạt|Không đạt)/.test(s)) return "red";
  if (/^(Xong trễ|Đến hạn|Sắp đến hạn|Chưa chọn|Chờ:|Chưa có ngày)/.test(s) || s === "Chờ") return "amber";
  if (/^(Đang chờ KQ|Chờ KQ)/.test(s)) return "teal";
  if (/^(Hoàn tất|Xong|Đã về|Sẵn sàng|Đã lắp ráp|Đạt|OK)/.test(s)) return "green";
  if (s === "Đúng tiến độ" || s === "Chưa đến hạn") return "wood";
  return "neutral";
}

/* Text input that saves on blur (avoids one request per keystroke). */
function BlurInput({ value, onCommit, ui, ...rest }) {
  const [draft, setDraft] = useState(value ?? "");
  useEffect(() => { setDraft(value ?? ""); }, [value]);
  return (
    <ui.Input
      {...rest}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => { if (String(draft) !== String(value ?? "")) onCommit(draft); }}
      onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
    />
  );
}

const cellInput = { padding: "5px 7px", fontSize: 12.5, borderRadius: 8, minWidth: 0 };

/* Thông tin sản phẩm của lượt theo dõi: ưu tiên dữ liệu nhập trong module,
   thiếu thì lấy từ Products (nếu đã liên kết). Module này KHÔNG phải master product. */
function productInfo(t, product) {
  return {
    erpNo: t.erpNo || product?.erpNo || "",
    description: t.productDescription || firstLine(product?.name) || "",
    customerId: t.customerId || product?.customerId || "",
    image: t.imageUrl || product?.image || "",
    linked: Boolean(product),
    product,
  };
}
function saveErrorHint(e) {
  const m = String(e?.message || e);
  return /PGRST204|column/i.test(m) ? "\n\nCó thể chưa chạy file SQL v57 (tanhoa_v57_qc_photos_change_history.sql) trong Supabase." : "";
}

export default function SampleTestTrackingView({ samples = [], customers = [], customerName, materialLists = {}, currentUser, canEdit = true, canDelete = true, canSettings = true, ui, onCreateMasterProduct,
  masterAvailable = false, masterProducts = [], manufacturingOrders = [], moProductLines = [], presetMasterId = "", onPresetUsed, onOpenMaster, excel = null }) {
  const { Button, Panel, Badge, Field, Input, Select, TextArea, COLORS, FONT_HEAD } = ui;
  const [state, setState] = useState({ loading: true, available: true, error: "" });
  const [trackings, setTrackings] = useState([]);
  const [stepRows, setStepRows] = useState([]);
  const [parts, setParts] = useState([]);
  const [tests, setTests] = useState([]);
  const [settings, setSettings] = useState(mergeSettings());
  const [tab, setTab] = useState("list");
  const [filter, setFilter] = useState("active");
  const [query, setQuery] = useState("");
  const [customerFilter, setCustomerFilter] = useState("");
  const [openId, setOpenId] = useState("");
  const [creating, setCreating] = useState(false);
  const [qc, setQc] = useState({ available: false, records: [], settings: mergeQcSettings() });
  const [qcDraft, setQcDraft] = useState(null);
  const today = todayIso();

  const reload = async () => {
    setState((s) => ({ ...s, loading: true }));
    try {
      const data = await loadTestTracking();
      if (!data.available) { setState({ loading: false, available: false, error: data.error }); return; }
      setTrackings(data.trackings); setStepRows(data.steps); setParts(data.parts); setTests(data.tests); setSettings(data.settings);
      setState({ loading: false, available: true, error: "" });
      loadQc().then(setQc).catch(() => {});
    } catch (e) {
      setState({ loading: false, available: true, error: e?.message || String(e) });
    }
  };
  useEffect(() => { reload(); }, []);
  // v58: "Mang đi test" from a Master Product opens the form with that product picked
  const [initialMasterId, setInitialMasterId] = useState("");
  useEffect(() => {
    if (!presetMasterId) return;
    setInitialMasterId(presetMasterId); setCreating(true); setOpenId(""); setTab("list");
    onPresetUsed?.();
  }, [presetMasterId]);
  // memoised so the batch form's LSX index is not rebuilt on every keystroke
  const lsxOptionsFor = useMemo(() => {
    const ctx = { samples, mos: manufacturingOrders, moLines: moProductLines };
    const cache = new Map();
    return (m) => {
      if (!m) return [];
      if (!cache.has(m.id)) cache.set(m.id, lsxForMaster(m, ctx).filter((x) => x.kind === "mo"));
      return cache.get(m.id);
    };
  }, [samples, manufacturingOrders, moProductLines, masterProducts]);

  const run = (promise, what) => promise.catch((e) => { alert(`${what} thất bại: ${e?.message || e}${saveErrorHint(e)}\nDữ liệu sẽ được tải lại.`); reload(); });

  const productById = useMemo(() => new Map(samples.map((s) => [s.id, s])), [samples]);
  const entries = useMemo(() => trackings.map((t) => {
    const product = productById.get(t.sampleId) || null;
    const computed = computeTracking({
      tracking: t,
      stepRows: stepRows.filter((r) => r.trackingId === t.id),
      parts: parts.filter((p) => p.trackingId === t.id),
      tests: tests.filter((x) => x.trackingId === t.id),
      settings, today,
    });
    return { id: t.id, tracking: t, product, info: productInfo(t, product), computed };
  }), [trackings, stepRows, parts, tests, settings, productById, today]);

  /* ---------- mutations ---------- */
  const patchTracking = (id, patch) => {
    const next = { ...trackings.find((t) => t.id === id), ...patch };
    setTrackings((list) => list.map((t) => (t.id === id ? next : t)));
    run(saveTracking(next), "Lưu thông tin mẫu");
  };
  const setStep = (trackingId, stepCode, patch) => {
    const id = `${trackingId}:${stepCode}`;
    const existing = stepRows.find((r) => r.id === id) || { id, trackingId, stepCode, planDate: "", actualDate: "", notApplicable: false, rescheduleDate: "", note: "" };
    const next = { ...existing, ...patch };
    setStepRows((rows) => (rows.some((r) => r.id === id) ? rows.map((r) => (r.id === id ? next : r)) : [...rows, next]));
    run(saveStepRows([next]), "Lưu bước");
  };
  const lockBaseline = (entry) => {
    const rows = entry.computed.steps
      .filter((s) => !s.na && s.plan && !s.row.planDate)
      .map((s) => ({ ...(stepRows.find((r) => r.id === `${entry.id}:${s.code}`) || { id: `${entry.id}:${s.code}`, trackingId: entry.id, stepCode: s.code, actualDate: "", notApplicable: false, rescheduleDate: "", note: "" }), planDate: s.plan }));
    if (!rows.length && entry.tracking.baselineLockedAt) return;
    if (!confirm(`Chốt KH gốc cho ${rows.length} bước? Sau khi chốt, đổi lead time sẽ không làm thay đổi KH gốc của mẫu này.`)) return;
    setStepRows((all) => { const map = new Map(all.map((r) => [r.id, r])); rows.forEach((r) => map.set(r.id, r)); return [...map.values()]; });
    run(saveStepRows(rows), "Chốt KH gốc");
    patchTracking(entry.id, { baselineLockedAt: new Date().toISOString() });
  };
  const upsertPart = (p) => {
    setParts((list) => (list.some((x) => x.id === p.id) ? list.map((x) => (x.id === p.id ? p : x)) : [...list, p]));
    run(savePart(p), "Lưu chi tiết vật tư");
  };
  const removePart = (p) => {
    if (!confirm(`Xoá dòng "${p.itemName}"?`)) return;
    setParts((list) => list.filter((x) => x.id !== p.id));
    run(deletePart(p.id), "Xoá chi tiết vật tư");
  };
  const upsertTest = (t) => {
    setTests((list) => (list.some((x) => x.id === t.id) ? list.map((x) => (x.id === t.id ? t : x)) : [...list, t]));
    const entry = entries.find((e) => e.id === t.trackingId);
    const qcFields = entry && qc.available ? qcFieldsFromTest(t, { trackingId: entry.id, sampleId: entry.tracking.sampleId, erpNo: entry.info.erpNo, productName: entry.info.description, customerId: entry.info.customerId }) : null;
    run(saveTest(t).then(async () => {
      if (qcFields) {
        await saveQc(qcFields);
        setQc((q) => ({ ...q, records: q.records.some((r) => r.id === qcFields.id) ? q.records.map((r) => (r.id === qcFields.id ? { ...r, ...qcFields } : r)) : [...q.records, { photos: [], fixPhotos: [], status: "Mở", ...qcFields }] }));
      }
    }), "Lưu nhật ký test");
  };
  const removeTest = (t) => {
    if (!confirm("Xoá lần test này khỏi nhật ký? Phiếu QA/QC tự tạo từ lần test này cũng bị xoá.")) return;
    setTests((list) => list.filter((x) => x.id !== t.id));
    const qcId = qcIdForTest(t.id);
    run(deleteTest(t.id).then(() => (qc.available ? deleteQc(qcId) : null)), "Xoá nhật ký test");
    setQc((q) => ({ ...q, records: q.records.filter((r) => r.id !== qcId) }));
  };
  const openQcForStep = (entry, step) => {
    if (!qc.available) { alert("Module QA/QC chưa bật: cần chạy file SQL v57 trong Supabase."); return; }
    setQcDraft({
      id: uid(), source: "Mẫu test", trackingId: entry.id, sampleId: entry.tracking.sampleId || "", testId: "", erpNo: entry.info.erpNo,
      productName: entry.info.description, customerId: entry.info.customerId, stageCode: step.code, stageLabel: step.short,
      inspectionDate: todayIso(), inspector: currentUser?.full_name || "", qtyChecked: "", qtyDefect: "", result: "Pass", defectCategory: "",
      severity: "", defectDescription: "", rootCause: "", correctiveAction: "", responsible: "", dueDate: "", completedDate: "",
      status: "Đạt", ncrNo: "", photos: [], fixPhotos: [], note: "",
    });
  };
  const saveQcDraft = (rec) => {
    const next = { ...rec, status: rec.result === "Pass" ? "Đạt" : (rec.status === "Đạt" ? "Mở" : rec.status) };
    setQc((q) => ({ ...q, records: q.records.some((r) => r.id === next.id) ? q.records.map((r) => (r.id === next.id ? next : r)) : [...q.records, next] }));
    run(saveQc(next), "Lưu phiếu QA/QC");
    setQcDraft(null);
  };
  const removeTracking = (entry) => {
    const label = entry.info.erpNo || entry.info.description || entry.id;
    if (!confirm(`Xoá theo dõi mẫu ${label}? Toàn bộ ngày, chi tiết vật tư và nhật ký test của mẫu này sẽ bị xoá.`)) return;
    setTrackings((l) => l.filter((t) => t.id !== entry.id));
    setStepRows((l) => l.filter((r) => r.trackingId !== entry.id));
    setParts((l) => l.filter((r) => r.trackingId !== entry.id));
    setTests((l) => l.filter((r) => r.trackingId !== entry.id));
    setOpenId("");
    run(deleteTracking(entry.id), "Xoá theo dõi");
  };
  const buildTracking = (draft) => {
    const id = uid();
    const tracking = { id, sampleId: draft.sampleId || "", lsxNo: draft.lsxNo, owner: draft.owner, startDate: draft.startDate, testDeadline: draft.testDeadline, weaveOn: draft.weaveOn, baselineLockedAt: "", status: "Active", notes: "",
      erpNo: draft.erpNo || "", productDescription: draft.productDescription || "", customerId: draft.customerId || "", imageUrl: draft.imageUrl || "",
      masterProductId: draft.masterProductId || "", moId: draft.moId || "" };
    const rows = settings.steps
      .filter((s) => draft.na.includes(s.code) || draft.fixed[s.code])
      .map((s) => ({ id: `${id}:${s.code}`, trackingId: id, stepCode: s.code, planDate: draft.na.includes(s.code) ? "" : (draft.fixed[s.code] || ""), actualDate: "", notApplicable: draft.na.includes(s.code), rescheduleDate: "", note: "" }));
    return { tracking, rows };
  };
  // v58.2: one or many test samples at once (batch from Master Products)
  const createTracking = async (input) => {
    const drafts = Array.isArray(input) ? input : [input];
    const done = [];
    try {
      for (const d of drafts) {
        const { tracking, rows } = buildTracking(d);
        await saveTracking(tracking);
        if (rows.length) await saveStepRows(rows);
        done.push({ tracking, rows });
      }
    } catch (e) {
      alert(`Tạo theo dõi thất bại sau ${done.length}/${drafts.length} mã: ` + (e?.message || e) + saveErrorHint(e));
    }
    if (!done.length) return;
    setTrackings((l) => [...l, ...done.map((x) => x.tracking)]);
    setStepRows((l) => [...l, ...done.flatMap((x) => x.rows)]);
    setCreating(false);
    setInitialMasterId("");
    if (done.length === 1) setOpenId(done[0].tracking.id);
    else { setOpenId(""); setTab("list"); setFilter("active"); }
  };
  const transferToMaster = async (entry) => {
    const { tracking: t, info } = entry;
    if (masterAvailable) {
      // v58: test samples belong to a Master Product — link by ERP code (never creates products from here).
      const m = info.erpNo && masterProducts.find((x) => x.erpNo && x.erpNo.toLowerCase() === info.erpNo.trim().toLowerCase());
      if (!m) { alert(`Mã ${info.erpNo || "(trống)"} chưa có trong Master Products.\nVào Sample → mở mẫu khách đã accept → "Chuyển sang Master Products", rồi quay lại liên kết.`); return; }
      if (!confirm(`Liên kết lượt test này với Master Product ${m.erpNo}?`)) return;
      patchTracking(t.id, { masterProductId: m.id, sampleId: t.sampleId || m.sourceSampleId || "" });
      return;
    }
    if (!info.erpNo) { alert("Nhập Mã ERP trước khi chuyển sang Products."); return; }
    const existing = samples.find((x) => String(x.erpNo || "").trim().toLowerCase() === info.erpNo.trim().toLowerCase());
    if (existing) {
      if (!confirm(`Products đã có mã ${info.erpNo} (${existing.id}). Liên kết lượt theo dõi này với sản phẩm đó?`)) return;
      patchTracking(t.id, { sampleId: existing.id });
      return;
    }
    if (!onCreateMasterProduct) return;
    if (!confirm(`Tạo sản phẩm mới trong Products với mã ${info.erpNo}?\nThông tin chuyển sang: Mã ERP, Product Description (làm tên), khách hàng, ảnh, số LSX.`)) return;
    const newId = onCreateMasterProduct({ erpNo: info.erpNo, name: t.productDescription || info.description, customerId: info.customerId, image: info.image, manufacturingOrderNo: t.lsxNo });
    if (newId) patchTracking(t.id, { sampleId: newId });
  };
  /* ---------- v58.4: Excel round-trip ---------- */
  const [importing, setImporting] = useState(false);
  const exportExcel = async () => {
    const list = entries.filter((e) => e.tracking.status !== "Closed")
      .sort((a, b) => String(a.tracking.lsxNo || "").localeCompare(String(b.tracking.lsxNo || "")) || String(a.info.erpNo).localeCompare(String(b.info.erpNo)));
    if (!list.length) { alert("Chưa có mẫu nào đang theo dõi để xuất."); return; }
    const { headers, rows } = buildExportTable(list, settings, customerName);
    try { await excel.download(`TheoDoiMauTest_${todayIso().replace(/-/g, "")}.xlsx`, headers, rows); }
    catch (e) { alert("Xuất Excel thất bại: " + (e?.message || e)); }
  };
  const applyImport = async (diff) => {
    const stepNext = [];
    for (const [tid, steps] of Object.entries(diff.stepPatches)) {
      for (const [code, patch] of Object.entries(steps)) {
        const id = `${tid}:${code}`;
        const base = stepRows.find((r) => r.id === id) || { id, trackingId: tid, stepCode: code, planDate: "", actualDate: "", notApplicable: false, rescheduleDate: "", note: "", proofImages: [] };
        stepNext.push({ ...base, ...patch });
      }
    }
    const trNext = Object.entries(diff.trackingPatches).map(([tid, p]) => ({ ...trackings.find((t) => t.id === tid), ...p })).filter((t) => t.id);
    try {
      for (let i = 0; i < stepNext.length; i += 200) await saveStepRows(stepNext.slice(i, i + 200));
      for (const t of trNext) await saveTracking(t);
    } catch (e) {
      alert("Ghi dữ liệu từ Excel bị lỗi giữa chừng: " + (e?.message || e) + saveErrorHint(e) + "\nDữ liệu sẽ được tải lại — nhập lại file để ghi nốt (các ô đã ghi sẽ không bị tính là thay đổi).");
      reload(); return false;
    }
    setStepRows((all) => { const m = new Map(all.map((r) => [r.id, r])); stepNext.forEach((r) => m.set(r.id, r)); return [...m.values()]; });
    setTrackings((all) => all.map((t) => trNext.find((x) => x.id === t.id) || t));
    return true;
  };

  /* ---------- v58.7: bulk update (rows already computed by planBulk) ---------- */
  const saveBulkRows = async (rows) => {
    try {
      for (let i = 0; i < rows.length; i += 200) await saveStepRows(rows.slice(i, i + 200));
    } catch (e) {
      alert("Ghi hàng loạt thất bại: " + (e?.message || e) + saveErrorHint(e) + "\nDữ liệu sẽ được tải lại.");
      reload(); return false;
    }
    setStepRows((all) => { const m = new Map(all.map((r) => [r.id, r])); rows.forEach((r) => m.set(r.id, r)); return [...m.values()]; });
    return true;
  };

  const persistSettings = (next) => {
    setSettings(next);
    run(saveTestSettings(next), "Lưu thiết lập");
  };

  /* ---------- render ---------- */
  const header = (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
        <div style={{ width: 46, height: 46, borderRadius: 15, background: "#EEF1F4", color: COLORS.woodDark, display: "grid", placeItems: "center", border: `1px solid ${COLORS.wood}66` }}><FlaskConical size={22} /></div>
        <div>
          <h1 style={{ fontFamily: FONT_HEAD, fontSize: 26, margin: 0 }}>Theo dõi mẫu test</h1>
          <div style={{ marginTop: 4, color: COLORS.inkSoft, fontSize: 13 }}>14 mốc từ nhám nguội đến nhận mẫu về · KH gốc / Dự kiến / Thực tế · vật tư theo chi tiết · nhật ký test</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Button variant="ghost" small onClick={reload}><RefreshCw size={14} /> Tải lại</Button>
        {excel && state.available && <Button variant="subtle" small onClick={exportExcel}><Download size={14} /> Xuất Excel</Button>}
        {excel && state.available && canEdit && <Button variant="subtle" small onClick={() => setImporting(true)}><Upload size={14} /> Nhập Excel</Button>}
        {canEdit && state.available && <Button onClick={() => { setCreating(true); setOpenId(""); setTab("list"); }}><Plus size={15} /> Theo dõi mẫu mới</Button>}
      </div>
    </div>
  );

  if (state.loading) return <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>{header}<Panel><div style={{ color: COLORS.inkSoft }}>Đang tải dữ liệu theo dõi mẫu…</div></Panel></div>;
  if (!state.available) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {header}
        <Panel title="Cần chạy SQL một lần để bật module">
          <div style={{ lineHeight: 1.7, fontSize: 14 }}>
            Chưa tìm thấy các bảng <code>test_trackings</code>, <code>test_tracking_steps</code>, <code>test_tracking_parts</code>, <code>test_tracking_tests</code> trong Supabase.<br />
            Mở Supabase → SQL Editor → dán nội dung file <b>tanhoa_v56_sample_test_tracking.sql</b> → Run, rồi bấm <b>Tải lại</b>. Các module khác của ERP không bị ảnh hưởng.
            <div style={{ marginTop: 10, color: COLORS.inkSoft, fontSize: 12 }}>Chi tiết lỗi: {state.error}</div>
          </div>
        </Panel>
      </div>
    );
  }

  const open = entries.find((e) => e.id === openId);
  const tabs = [
    { key: "list", label: "Danh sách", icon: ListChecks },
    { key: "today", label: "Việc hôm nay", icon: CalendarClock },
    ...(canEdit ? [{ key: "bulk", label: "Cập nhật theo lô", icon: Table2 }] : []),
    ...(canSettings ? [{ key: "settings", label: "Thiết lập", icon: Settings }] : []),
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {header}
      {state.error && <div style={{ background: COLORS.redSoft, color: COLORS.red, padding: "10px 14px", borderRadius: 10, fontSize: 13 }}>{state.error}</div>}
      {!open && !creating && (
        <div style={{ display: "flex", gap: 6, borderBottom: `1px solid ${COLORS.line}` }}>
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 14px", border: "none", background: "transparent", cursor: "pointer", fontWeight: 600, fontSize: 13.5, color: tab === t.key ? COLORS.wood : COLORS.inkSoft, borderBottom: `2px solid ${tab === t.key ? COLORS.wood : "transparent"}`, marginBottom: -1 }}>
              <t.icon size={15} /> {t.label}
            </button>
          ))}
        </div>
      )}

      {creating && (
        masterAvailable ? (
          <NewBatchFromMasterForm ui={ui} samples={samples} customerName={customerName} materialLists={materialLists} settings={settings} existing={trackings} currentUser={currentUser}
            masterProducts={masterProducts} lsxOptionsFor={lsxOptionsFor} initialMasterId={initialMasterId}
            onCancel={() => { setCreating(false); setInitialMasterId(""); }} onCreate={createTracking} />
        ) : <NewTrackingForm ui={ui} samples={samples} customers={customers} customerName={customerName} materialLists={materialLists} settings={settings} existing={trackings} currentUser={currentUser}
          masterAvailable={masterAvailable} masterProducts={masterProducts} lsxOptionsFor={lsxOptionsFor} initialMasterId={initialMasterId}
          onCancel={() => { setCreating(false); setInitialMasterId(""); }} onCreate={createTracking} />
      )}

      {open && !creating && (
        <TrackingDetail ui={ui} entry={open} settings={settings} customerName={customerName} canEdit={canEdit} canDelete={canDelete}
          onBack={() => setOpenId("")} patchTracking={patchTracking} setStep={setStep} lockBaseline={lockBaseline}
          upsertPart={upsertPart} removePart={removePart} upsertTest={upsertTest} removeTest={removeTest} removeTracking={removeTracking}
          customers={customers} transferToMaster={transferToMaster} canTransfer={Boolean(onCreateMasterProduct)}
          masterAvailable={masterAvailable} masterProducts={masterProducts} lsxOptionsFor={lsxOptionsFor} onOpenMaster={onOpenMaster}
          qcRecords={qc.records.filter((r) => r.trackingId === open.id)} openQcForStep={openQcForStep} onOpenQc={setQcDraft} />
      )}
      {importing && <ExcelImportModal ui={ui} excel={excel} entries={entries} settings={settings} onApply={applyImport} onClose={() => setImporting(false)} />}
      {qcDraft && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.45)", zIndex: 1500, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 16px", overflowY: "auto" }} onClick={() => setQcDraft(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "min(980px, 100%)" }}>
            <QcForm ui={ui} draft={qcDraft} settings={qc.settings} canEdit={canEdit} onCancel={() => setQcDraft(null)} onSave={saveQcDraft} customerName={customerName} />
          </div>
        </div>
      )}

      {!open && !creating && tab === "list" && (
        <TrackingList ui={ui} entries={entries} customers={customers} customerName={customerName} filter={filter} setFilter={setFilter}
          query={query} setQuery={setQuery} customerFilter={customerFilter} setCustomerFilter={setCustomerFilter} onOpen={setOpenId} />
      )}
      {!open && !creating && tab === "bulk" && canEdit && <BulkUpdatePanel ui={ui} entries={entries} settings={settings} customerName={customerName} onSaveRows={saveBulkRows} onOpen={setOpenId} />}
      {!open && !creating && tab === "today" && <TodayList ui={ui} entries={entries} customerName={customerName} onOpen={setOpenId} />}
      {!open && !creating && tab === "settings" && canSettings && <SettingsPanel ui={ui} settings={settings} onSave={persistSettings} />}
    </div>
  );
}

/* ================= List + filters ================= */
function ProductThumb({ image, ui, size = 44 }) {
  const { COLORS } = ui;
  return image
    ? <img src={image} alt="" style={{ width: size, height: size, objectFit: "cover", borderRadius: 8, border: `1px solid ${COLORS.line}`, display: "block" }} />
    : <div style={{ width: size, height: size, borderRadius: 8, border: `1px solid ${COLORS.line}`, background: "#F6F7F9", color: COLORS.inkSoft, display: "grid", placeItems: "center" }}><ImageIcon size={16} /></div>;
}

function TrackingList({ ui, entries, customers, customerName, filter, setFilter, query, setQuery, customerFilter, setCustomerFilter, onOpen }) {
  const { Panel, Badge, Input, Select, COLORS } = ui;
  const q = query.trim().toLowerCase();
  const base = entries.filter((e) => {
    if (customerFilter && e.info.customerId !== customerFilter) return false;
    if (!q) return true;
    const hay = [e.info.erpNo, e.info.description, e.product?.name, e.tracking.lsxNo, e.tracking.owner, customerName(e.info.customerId)].join(" ").toLowerCase();
    return hay.includes(q);
  });
  const counts = Object.fromEntries(FILTERS.map((f) => [f.key, base.filter((e) => f.test(e.computed)).length]));
  const active = FILTERS.find((f) => f.key === filter) || FILTERS[0];
  const rows = base.filter((e) => active.test(e.computed)).sort((a, b) => String(a.computed.nextDate || "9999").localeCompare(String(b.computed.nextDate || "9999")));
  const missCode = filter.startsWith("miss:") ? filter.slice(5) : "";
  const usedCustomers = customers.filter((c) => entries.some((e) => e.info.customerId === c.id));

  return (
    <Panel>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: "1 1 260px", maxWidth: 380 }}>
            <Search size={15} style={{ position: "absolute", left: 10, top: 11, color: COLORS.inkSoft }} />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm mã ERP, tên, LSX, người phụ trách…" style={{ paddingLeft: 32 }} />
          </div>
          <Select value={customerFilter} onChange={(e) => setCustomerFilter(e.target.value)} style={{ width: 200 }}>
            <option value="">Tất cả khách hàng</option>
            {usedCustomers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </div>
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
          {FILTERS.map((f) => {
            const on = f.key === filter;
            return (
              <button key={f.key} onClick={() => setFilter(f.key)} style={{ border: `1px solid ${on ? COLORS.wood : COLORS.line}`, background: on ? COLORS.wood : "#FFFFFF", color: on ? "#FFFFFF" : COLORS.ink, borderRadius: 999, padding: "6px 12px", fontSize: 12.5, fontWeight: 600, cursor: "pointer", display: "inline-flex", gap: 6, alignItems: "center" }}>
                {f.label}
                <span style={{ background: on ? "rgba(255,255,255,.25)" : (counts[f.key] && f.tone === "red" ? COLORS.redSoft : COLORS.bg), color: on ? "#FFFFFF" : (counts[f.key] && f.tone === "red" ? COLORS.red : COLORS.inkSoft), borderRadius: 999, padding: "1px 7px", fontSize: 11.5 }}>{counts[f.key]}</span>
              </button>
            );
          })}
        </div>

        {!rows.length ? (
          <div style={{ padding: "30px 0", textAlign: "center", color: COLORS.inkSoft, fontSize: 14 }}>{entries.length ? "Không có mẫu nào khớp bộ lọc." : "Chưa theo dõi mẫu nào. Bấm “Theo dõi mẫu mới” để bắt đầu."}</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  {["", "Mã ERP · Sản phẩm", "Khách · LSX", "Trạng thái", missCode ? "Còn thiếu" : "Bước cần follow", "Hạn", "Lắp ráp", "Test gần nhất", "Dự kiến đi test", ""].map((h, i) => (
                    <th key={i} style={{ textAlign: "left", padding: "8px 10px", borderBottom: `2px solid ${COLORS.line}`, color: COLORS.inkSoft, fontWeight: 600, fontSize: 12, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((e) => {
                  const c = e.computed;
                  const missStep = missCode ? c.byCode[missCode] : null;
                  const missingParts = missStep ? missStep.parts.filter((p) => !(p.iqcResult === "Đạt" && p.receivedDate)) : [];
                  return (
                    <tr key={e.id} onClick={() => onOpen(e.id)} style={{ cursor: "pointer", borderBottom: `1px solid ${COLORS.line}` }}
                      onMouseEnter={(ev) => (ev.currentTarget.style.background = COLORS.bg)} onMouseLeave={(ev) => (ev.currentTarget.style.background = "transparent")}>
                      <td style={{ padding: "8px 10px" }}><ProductThumb image={e.info.image} ui={ui} /></td>
                      <td style={{ padding: "8px 10px", minWidth: 200 }}>
                        <div style={{ fontWeight: 700 }}>{e.info.erpNo || "(chưa có mã ERP)"}</div>
                        <div style={{ color: COLORS.inkSoft, fontSize: 12 }}>{e.info.description || "—"}</div>
                      </td>
                      <td style={{ padding: "8px 10px", fontSize: 12 }}>
                        <div>{customerName(e.info.customerId)}</div>
                        <div style={{ color: COLORS.inkSoft }}>{e.tracking.lsxNo || "—"}</div>
                      </td>
                      <td style={{ padding: "8px 10px" }}><Badge tone={statusTone(c.status)}>{c.status}</Badge></td>
                      <td style={{ padding: "8px 10px", minWidth: 170, fontSize: 12.5 }}>
                        {missStep ? (
                          missingParts.length
                            ? missingParts.map((p) => <div key={p.id}>{p.itemName}{p.supplier ? ` · ${p.supplier}` : ""} <span style={{ color: COLORS.inkSoft }}>({p.status}{p.rescheduledDate || p.promisedDate ? ` ${fmt(p.rescheduledDate || p.promisedDate)}` : ""})</span></div>)
                            : <span>{missStep.short} chưa xong{missStep.forecast ? ` · dự kiến ${fmt(missStep.forecast)}` : ""}</span>
                        ) : (c.nextSteps.map((s) => s.short).join("; ") || "—")}
                      </td>
                      <td style={{ padding: "8px 10px", whiteSpace: "nowrap" }}>
                        {c.nextDate ? <><div>{fmt(c.nextDate)}</div><div style={{ fontSize: 11.5, color: c.daysLeft < 0 ? COLORS.red : COLORS.inkSoft }}>{c.daysLeft < 0 ? `trễ ${-c.daysLeft} ngày` : c.daysLeft === 0 ? "hôm nay" : `còn ${c.daysLeft} ngày`}</div></> : "—"}
                      </td>
                      <td style={{ padding: "8px 10px" }}>
                        <Badge tone={statusTone(c.gate)}>{c.gate || "—"}</Badge>
                        {c.gate === "Chờ" && <div style={{ fontSize: 11, color: COLORS.inkSoft, marginTop: 3, maxWidth: 180 }}>{c.gateMissing.map((s) => s.short).join(", ")}</div>}
                      </td>
                      <td style={{ padding: "8px 10px", fontSize: 12 }}>
                        {c.latest ? <Badge tone={statusTone(c.latest.result)}>{c.latest.testType === "QA nhà máy" ? "QA" : "TT"} lần {c.latest.attempt}: {c.latest.result}</Badge> : <span style={{ color: COLORS.inkSoft }}>Chưa test</span>}
                      </td>
                      <td style={{ padding: "8px 10px", whiteSpace: "nowrap", fontSize: 12.5 }}>
                        <div>{fmt(c.expectedSend) || "—"}</div>
                        {c.risk && <div style={{ fontSize: 11.5, color: c.riskDays > 0 ? COLORS.red : COLORS.green }}>{c.risk}{e.tracking.testDeadline ? ` (hạn ${fmt(e.tracking.testDeadline)})` : ""}</div>}
                      </td>
                      <td style={{ padding: "8px 10px" }}><RowHistoryButton table="test_trackings" rowId={e.id} title={`${e.info.erpNo || ""} · ${e.tracking.lsxNo || ""}`} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Panel>
  );
}

/* ================= Today ================= */
function TodayList({ ui, entries, customerName, onOpen }) {
  const { Panel, Badge, COLORS } = ui;
  const items = todayItems(entries);
  const counts = { late: items.filter((i) => i.status === "Trễ" || i.status === "IQC không đạt").length, today: items.filter((i) => i.status === "Đến hạn hôm nay").length, soon: items.filter((i) => i.status === "Sắp đến hạn").length };
  return (
    <Panel title={`Việc cần follow — ${fmt(todayIso())}`} action={<div style={{ display: "flex", gap: 6 }}><Badge tone="red">Trễ: {counts.late}</Badge><Badge tone="amber">Hôm nay: {counts.today}</Badge><Badge tone="amber">Sắp đến hạn: {counts.soon}</Badge></div>}>
      {!items.length ? <div style={{ color: COLORS.inkSoft, padding: "20px 0", textAlign: "center" }}>Không có việc trễ hay sắp đến hạn.</div> : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr>{["Hạn", "Còn", "Mã ERP · Sản phẩm", "Công đoạn / chi tiết", "Gọi ai", "Trạng thái"].map((h) => <th key={h} style={{ textAlign: "left", padding: "8px 10px", borderBottom: `2px solid ${COLORS.line}`, color: COLORS.inkSoft, fontWeight: 600, fontSize: 12 }}>{h}</th>)}</tr></thead>
            <tbody>
              {items.map(({ entry: e, step: s, part: p, date, status, daysLeft }) => (
                <tr key={`${e.id}:${s.code}:${p?.id || ""}`} onClick={() => onOpen(e.id)} style={{ cursor: "pointer", borderBottom: `1px solid ${COLORS.line}` }}
                  onMouseEnter={(ev) => (ev.currentTarget.style.background = COLORS.bg)} onMouseLeave={(ev) => (ev.currentTarget.style.background = "transparent")}>
                  <td style={{ padding: "8px 10px", whiteSpace: "nowrap", fontWeight: 600 }}>{fmt(date)}</td>
                  <td style={{ padding: "8px 10px", whiteSpace: "nowrap", color: daysLeft < 0 ? COLORS.red : COLORS.inkSoft }}>{daysLeft === null ? "" : daysLeft < 0 ? `trễ ${-daysLeft}` : daysLeft === 0 ? "hôm nay" : `${daysLeft} ngày`}</td>
                  <td style={{ padding: "8px 10px" }}><div style={{ fontWeight: 700 }}>{e.info.erpNo || "—"}</div><div style={{ fontSize: 12, color: COLORS.inkSoft }}>{e.info.description} · {customerName(e.info.customerId)}</div></td>
                  <td style={{ padding: "8px 10px" }}>
                    <div style={{ fontWeight: 600 }}>{s.short}{p ? `: ${p.itemName}` : ""}</div>
                    {p && <div style={{ fontSize: 12, color: COLORS.inkSoft }}>{[p.qty ? `SL ${p.qty}${p.unit ? " " + p.unit : ""}` : "", p.poNo ? `PO ${p.poNo}` : "", p.rescheduledDate ? `NCC dời từ ${fmt(p.promisedDate)}` : ""].filter(Boolean).join(" · ")}</div>}
                  </td>
                  <td style={{ padding: "8px 10px", fontSize: 12 }}><div style={{ fontWeight: s.place === "Thuê ngoài" ? 700 : 400, color: s.place === "Thuê ngoài" ? "#C55A11" : COLORS.ink }}>{p?.supplier || s.place}</div><div style={{ color: COLORS.inkSoft }}>{s.dept}</div></td>
                  <td style={{ padding: "8px 10px" }}><Badge tone={statusTone(status)}>{status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

/* ================= Create ================= */
/* ================= v58.7: bulk update by batch (LSX) ================= */
const shortDate = (d) => { if (!d) return ""; const [, m, day] = String(d).split("-"); return `${day}/${m}`; };
function BulkUpdatePanel({ ui, entries, settings, customerName, onSaveRows, onOpen }) {
  const { Panel, Button, Input, Select, Badge, COLORS } = ui;
  const [lsx, setLsx] = useState("");
  const [query, setQuery] = useState("");
  const [sel, setSel] = useState(() => new Set());
  const [step, setStep] = useState("NHAM");
  const [field, setField] = useState("actual");
  const [date, setDate] = useState(todayIso());
  const [overwrite, setOverwrite] = useState(false);
  const [onlyPending, setOnlyPending] = useState(false);
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState(null); // { label, rows, prev, skipped }
  const steps = settings.steps;
  const stepDef = steps.find((x) => x.code === step);
  const active = entries.filter((e) => e.tracking.status !== "Closed");
  const lsxCounts = useMemo(() => { const m = new Map(); active.forEach((e) => { const k = e.tracking.lsxNo || "(chưa có LSX)"; m.set(k, (m.get(k) || 0) + 1); }); return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0])); }, [entries]);
  const q = query.trim().toLowerCase();
  const pending = (e) => { const s = e.computed.byCode[step]; return s && !s.na && !s.actual; };
  const rows = active
    .filter((e) => !lsx || (e.tracking.lsxNo || "(chưa có LSX)") === lsx)
    .filter((e) => !q || `${e.info.erpNo} ${e.info.description} ${e.tracking.lsxNo}`.toLowerCase().includes(q))
    .filter((e) => !onlyPending || pending(e))
    .sort((a, b) => String(a.tracking.lsxNo || "").localeCompare(String(b.tracking.lsxNo || "")) || String(a.info.erpNo).localeCompare(String(b.info.erpNo)));
  const shownIds = rows.map((e) => e.id);
  const selShown = shownIds.filter((id) => sel.has(id));
  const allShown = shownIds.length > 0 && selShown.length === shownIds.length;
  const toggle = (id) => setSel((s0) => { const s1 = new Set(s0); s1.has(id) ? s1.delete(id) : s1.add(id); return s1; });
  const toggleAll = () => setSel((s0) => { const s1 = new Set(s0); if (allShown) shownIds.forEach((id) => s1.delete(id)); else shownIds.forEach((id) => s1.add(id)); return s1; });
  const fieldOk = field !== "plan" || stepDef?.planType === "fixed";

  const run = async (value, label) => {
    const ids = [...sel];
    if (!ids.length) { alert("Tích chọn ít nhất 1 mã."); return; }
    const plan = planBulk(entries, ids, { stepCode: step, field, value, overwrite });
    if (!plan.rows.length) { setLast({ label, rows: [], prev: [], skipped: plan.skipped, unchanged: plan.unchanged }); return; }
    if (!confirm(`${label}\n\nGhi cho ${plan.rows.length} mã${plan.skipped.length ? `, bỏ qua ${plan.skipped.length} mã` : ""}${plan.unchanged ? `, ${plan.unchanged} mã không đổi` : ""}. Tiếp tục?`)) return;
    setBusy(true);
    const ok = await onSaveRows(plan.rows);
    setBusy(false);
    if (ok) setLast({ label, ...plan });
  };
  const undo = async () => {
    if (!last?.prev?.length) return;
    setBusy(true);
    const ok = await onSaveRows(last.prev);
    setBusy(false);
    if (ok) setLast({ label: `Đã hoàn tác: ${last.label}`, rows: [], prev: [], skipped: [], undone: true });
  };
  const stepName = stepDef?.short || step;
  const fieldName = BULK_FIELDS.find((f) => f.key === field)?.label || field;

  const th = { textAlign: "left", padding: "6px 6px", fontSize: 11, color: COLORS.inkSoft, fontWeight: 700, borderBottom: `1px solid ${COLORS.line}`, position: "sticky", top: 0, background: "#FFFFFF", zIndex: 1, whiteSpace: "nowrap" };
  const td = { padding: "5px 6px", borderBottom: `1px solid ${COLORS.line}`, fontSize: 12, whiteSpace: "nowrap" };
  const cell = (e, s) => {
    if (!s) return "";
    if (s.na) return <span style={{ color: "#B0B7C3" }}>N/A</span>;
    if (s.actual) return <span style={{ color: COLORS.green, fontWeight: 700 }}>✓ {shortDate(s.actual)}</span>;
    const late = s.status === "Trễ";
    return <span style={{ color: late ? COLORS.red : COLORS.inkSoft }} title={`Dự kiến${s.hasParts ? " (theo chi tiết vật tư)" : ""}`}>{s.forecast ? shortDate(s.forecast) : "—"}{s.hasParts ? "*" : ""}</span>;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Panel>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <Select value={lsx} onChange={(e) => { setLsx(e.target.value); }} style={{ maxWidth: 300, ...(lsx ? { borderColor: COLORS.wood } : {}) }}>
              <option value="">Lọc theo LSX: tất cả ({active.length} mã)</option>
              {lsxCounts.map(([k, n]) => <option key={k} value={k}>{k} ({n} mã)</option>)}
            </Select>
            <div style={{ position: "relative", flex: "1 1 240px" }}>
              <Search size={14} style={{ position: "absolute", left: 10, top: 11, color: COLORS.inkSoft }} />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm mã ERP / mô tả / LSX…" style={{ paddingLeft: 30 }} />
            </div>
            <label style={{ fontSize: 12.5, display: "inline-flex", gap: 6, alignItems: "center" }}><input type="checkbox" checked={onlyPending} onChange={(e) => setOnlyPending(e.target.checked)} /> Chỉ mã chưa xong bước <b>{stepName}</b></label>
            <Button small variant="subtle" onClick={toggleAll} disabled={!shownIds.length}>{allShown ? "Bỏ chọn" : "Chọn tất cả"} ({shownIds.length})</Button>
            {sel.size > 0 && <Button small variant="ghost" onClick={() => setSel(new Set())}>Bỏ chọn hết</Button>}
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", background: "#F6F8FB", border: `1px solid ${COLORS.line}`, borderRadius: 10, padding: "10px 12px" }}>
            <b style={{ fontSize: 13 }}>Đã chọn {sel.size} mã →</b>
            <Select value={step} onChange={(e) => setStep(e.target.value)} style={{ width: 170, padding: "6px 8px" }}>
              {steps.filter((x) => x.source === "input").map((x, i) => <option key={x.code} value={x.code}>{steps.indexOf(x) + 1}. {x.short}</option>)}
            </Select>
            <Select value={field} onChange={(e) => setField(e.target.value)} style={{ width: 160, padding: "6px 8px" }}>
              {BULK_FIELDS.map((f) => <option key={f.key} value={f.key} disabled={f.key === "plan" && stepDef?.planType !== "fixed"}>{f.label}{f.key === "plan" && stepDef?.planType !== "fixed" ? " (chỉ bước ấn định)" : ""}</option>)}
            </Select>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: 150, padding: "6px 8px" }} />
            <Button small onClick={() => run(date, `${stepName} · ${fieldName} = ${shortDate(date)}`)} disabled={busy || !sel.size || !date || !fieldOk}>Ghi ngày cho {sel.size} mã</Button>
            {field === "actual" && <Button small variant="subtle" onClick={() => { setDate(todayIso()); run(todayIso(), `${stepName} · Xong hôm nay (${shortDate(todayIso())})`); }} disabled={busy || !sel.size}>Xong hôm nay</Button>}
            {field === "actual" && step !== "LAP_RAP" && <Button small variant="subtle" onClick={() => run(BULK_NA, `${stepName} · N/A`)} disabled={busy || !sel.size}>Đánh N/A</Button>}
            <Button small variant="ghost" onClick={() => run("", `${stepName} · Xoá ${fieldName}`)} disabled={busy || !sel.size || !fieldOk}>Xoá ngày</Button>
            <label style={{ fontSize: 12, display: "inline-flex", gap: 5, alignItems: "center", color: overwrite ? COLORS.red : COLORS.inkSoft }}><input type="checkbox" checked={overwrite} onChange={(e) => setOverwrite(e.target.checked)} /> Ghi đè ô đã có ngày / N/A</label>
          </div>

          {last && (
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flexWrap: "wrap", background: last.undone ? "#F1F5F9" : "#ECFDF5", border: `1px solid ${last.undone ? COLORS.line : "#A7F3D0"}`, borderRadius: 10, padding: "8px 12px", fontSize: 12.5 }}>
              <div style={{ flex: 1, minWidth: 260 }}>
                <b>{last.label}</b>{!last.undone && <> — đã ghi <b>{last.rows.length}</b> mã{last.unchanged ? `, ${last.unchanged} không đổi` : ""}</>}
                {last.skipped?.length > 0 && (
                  <details style={{ marginTop: 4 }}><summary style={{ cursor: "pointer", color: "#92400E" }}>Bỏ qua {last.skipped.length} mã (bấm để xem lý do)</summary>
                    <div style={{ maxHeight: 140, overflowY: "auto" }}>{last.skipped.map((x) => <div key={x.id}>{x.erp}: {x.reason}</div>)}</div>
                  </details>
                )}
              </div>
              {!last.undone && last.prev?.length > 0 && <Button small variant="danger" onClick={undo} disabled={busy}><Undo2 size={13} /> Hoàn tác</Button>}
              <button type="button" onClick={() => setLast(null)} style={{ border: "none", background: "none", cursor: "pointer", color: COLORS.inkSoft }}><X size={14} /></button>
            </div>
          )}
        </div>
      </Panel>

      <Panel>
        <div style={{ overflow: "auto", maxHeight: "65vh" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>
              <th style={th}><input type="checkbox" checked={allShown} onChange={toggleAll} /></th>
              <th style={th}>Mã ERP</th><th style={th}>LSX</th>
              {steps.map((x, i) => (
                <th key={x.code} style={{ ...th, cursor: x.source === "input" ? "pointer" : "default", color: x.code === step ? COLORS.wood : th.color, background: x.code === step ? "#EEF3FE" : "#FFFFFF" }}
                  title={x.source === "input" ? "Bấm để chọn bước này" : "Lấy từ nhật ký test"} onClick={() => x.source === "input" && setStep(x.code)}>{i + 1}. {x.short}</th>
              ))}
            </tr></thead>
            <tbody>
              {!rows.length && <tr><td style={td} colSpan={steps.length + 3}>Không có mã nào khớp bộ lọc.</td></tr>}
              {rows.map((e) => (
                <tr key={e.id} style={{ background: sel.has(e.id) ? "#EEF3FE" : "transparent" }}>
                  <td style={td}><input type="checkbox" checked={sel.has(e.id)} onChange={() => toggle(e.id)} /></td>
                  <td style={{ ...td, fontWeight: 700 }}><button type="button" onClick={() => onOpen(e.id)} title={e.info.description} style={{ border: "none", background: "none", padding: 0, cursor: "pointer", fontWeight: 700, color: COLORS.ink }}>{e.info.erpNo || e.id}</button></td>
                  <td style={{ ...td, color: COLORS.inkSoft }}>{e.tracking.lsxNo}</td>
                  {steps.map((x) => <td key={x.code} style={{ ...td, background: x.code === step ? "#F6F8FB" : undefined }}>{cell(e, e.computed.byCode[x.code])}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 8, fontSize: 11.5, color: COLORS.inkSoft }}>✓ = đã xong (ngày thực tế) · ngày xám = dự kiến · đỏ = trễ · * = theo chi tiết vật tư (cập nhật trong chi tiết mẫu) · bấm tiêu đề cột để chọn bước · bấm mã ERP để mở chi tiết.</div>
      </Panel>
    </div>
  );
}

/* ================= v58.4: Excel import with preview ================= */
function ExcelImportModal({ ui, excel, entries, settings, onApply, onClose }) {
  const { Button, Badge, COLORS } = ui;
  const [stage, setStage] = useState("pick"); // pick | parsing | preview | saving | done
  const [diff, setDiff] = useState(null);
  const [fileName, setFileName] = useState("");
  const [err, setErr] = useState("");
  const choose = async (e) => {
    const f = e.target.files?.[0]; e.target.value = "";
    if (!f) return;
    setFileName(f.name); setErr(""); setStage("parsing");
    try {
      const parsed = await excel.parse(f);
      setDiff(diffImport(parsed.rows || [], entries, settings)); setStage("preview");
    } catch (x) { setErr(x?.message || String(x)); setStage("pick"); }
  };
  const apply = async () => { setStage("saving"); const ok = await onApply(diff); setStage(ok ? "done" : "preview"); };
  const nTracking = diff ? new Set(diff.changes.map((c) => c.trackingId)).size : 0;
  const th = { textAlign: "left", padding: "6px 8px", fontSize: 11.5, color: COLORS.inkSoft, fontWeight: 700, borderBottom: `1px solid ${COLORS.line}`, position: "sticky", top: 0, background: "#FFFFFF" };
  const td = { padding: "5px 8px", borderBottom: `1px solid ${COLORS.line}`, fontSize: 12.5 };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.45)", zIndex: 1500, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 16px", overflowY: "auto" }} onClick={stage === "saving" ? undefined : onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "min(1000px, 100%)", background: "#FFFFFF", borderRadius: 14, padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 800, fontSize: 18 }}>Nhập tiến độ từ Excel</div>
          {stage !== "saving" && <Button small variant="ghost" onClick={onClose}><X size={14} /> Đóng</Button>}
        </div>
        {(stage === "pick" || stage === "parsing") && (
          <div style={{ fontSize: 13, lineHeight: 1.7 }}>
            <ol style={{ margin: "0 0 10px", paddingLeft: 18 }}>
              <li>Bấm <b>Xuất Excel</b> để lấy file mới nhất (mỗi dòng 1 mẫu, cột "ID" để nhận diện — <b>không sửa cột ID</b>).</li>
              <li>Điền ngày vào các cột <b>Thực tế / Ấn định / Hẹn lại</b> (dd/mm/yyyy), gõ <b>N/A</b> nếu mẫu không có bước đó. Cột "(chỉ xem)" sẽ bị bỏ qua. Có thể copy-paste, kéo thả, xoá dòng không cần.</li>
              <li>Chọn file ở đây → xem trước các ô thay đổi → bấm <b>Áp dụng</b>.</li>
            </ol>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 8, border: `1px dashed ${COLORS.wood}`, color: COLORS.wood, borderRadius: 10, padding: "10px 14px", cursor: "pointer", fontWeight: 600 }}>
              <Upload size={15} /> {stage === "parsing" ? `Đang đọc ${fileName}…` : "Chọn file .xlsx"}
              <input type="file" accept=".xlsx" onChange={choose} style={{ display: "none" }} disabled={stage === "parsing"} />
            </label>
            {err && <div style={{ color: COLORS.red, marginTop: 8 }}>{err}</div>}
          </div>
        )}
        {diff && (stage === "preview" || stage === "saving" || stage === "done") && (
          <>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", fontSize: 13 }}>
              <Badge>{fileName}</Badge>
              <Badge>{diff.rowsRead} dòng đọc</Badge>
              <Badge tone={diff.changes.length ? "wood" : "neutral"}>{diff.changes.length} ô thay đổi · {nTracking} mẫu</Badge>
              {diff.skipped.length > 0 && <Badge tone="amber">{diff.skipped.length} ô bỏ qua</Badge>}
              {diff.errors.length > 0 && <Badge tone="red">{diff.errors.length} lỗi</Badge>}
              {diff.unknownHeaders.length > 0 && <Badge tone="amber">{diff.unknownHeaders.length} cột lạ bị bỏ qua</Badge>}
            </div>
            {(diff.errors.length > 0 || diff.skipped.length > 0) && (
              <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10, padding: "8px 12px", fontSize: 12.5, maxHeight: 160, overflowY: "auto" }}>
                {diff.errors.map((x, i) => <div key={"e" + i} style={{ color: COLORS.red }}>Dòng {x.row}{x.erp ? ` · ${x.erp}` : ""}: {x.message}</div>)}
                {diff.skipped.map((x, i) => <div key={"s" + i} style={{ color: "#92400E" }}>Dòng {x.row} · {x.erp}: {x.message}</div>)}
              </div>
            )}
            {diff.changes.length ? (
              <div style={{ maxHeight: 380, overflowY: "auto", border: `1px solid ${COLORS.line}`, borderRadius: 10 }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr><th style={th}>Dòng</th><th style={th}>Mã ERP</th><th style={th}>Cột</th><th style={th}>Hiện tại</th><th style={th}>Mới</th></tr></thead>
                  <tbody>{diff.changes.map((c, i) => (
                    <tr key={i}>
                      <td style={td}>{c.row}</td><td style={{ ...td, fontWeight: 700 }}>{c.erp}</td><td style={td}>{c.label}</td>
                      <td style={{ ...td, color: COLORS.inkSoft }}>{c.from || "—"}</td>
                      <td style={{ ...td, fontWeight: 600, color: c.to === "(xoá)" ? COLORS.red : COLORS.ink }}>{c.to || "—"}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            ) : <div style={{ fontSize: 13, color: COLORS.inkSoft }}>Không có ô nào khác với dữ liệu hiện tại.</div>}
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {stage === "done"
                ? <><Badge tone="green">Đã ghi {diff.changes.length} ô</Badge><Button small onClick={onClose}>Xong</Button></>
                : <>
                    <Button onClick={apply} disabled={!diff.changes.length || stage === "saving"}>{stage === "saving" ? "Đang ghi…" : `Áp dụng ${diff.changes.length} thay đổi`}</Button>
                    <Button variant="ghost" onClick={() => { setDiff(null); setStage("pick"); }} disabled={stage === "saving"}>Chọn file khác</Button>
                    {diff.changes.some((c) => c.to === "(xoá)") && <span style={{ fontSize: 12.5, color: COLORS.red }}>Có ô bị xoá trắng — kiểm tra lại trước khi áp dụng.</span>}
                  </>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ================= v58.2: tick many Master Products → many test trackings ================= */
const STEP_CHIP_EXCLUDE = ["LAP_RAP", "NHAN_VE", "DAN_DAY"];
function NewBatchFromMasterForm({ ui, samples, customerName, materialLists, settings, existing, currentUser, masterProducts, lsxOptionsFor, initialMasterId = "", onCancel, onCreate }) {
  const { Panel, Button, Field, Input, Select, Badge, COLORS } = ui;
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState([]); // [{ masterId, moKey, productDescription, weaveOn, na }]
  const [common, setCommon] = useState({ owner: currentUser?.full_name || "", startDate: todayIso(), testDeadline: "", fixed: {} });
  const [saving, setSaving] = useState(false);
  const byId = useMemo(() => new Map(masterProducts.map((m) => [m.id, m])), [masterProducts]);
  const tracked = useMemo(() => new Set(existing.filter((t) => t.status !== "Closed").map((t) => t.masterProductId).filter(Boolean)), [existing]);
  const chipSteps = settings.steps.filter((x) => x.source === "input" && !STEP_CHIP_EXCLUDE.includes(x.code));
  const fixedSteps = settings.steps.filter((x) => x.planType === "fixed");

  const q = search.trim().toLowerCase();
  // v58.5: LSX index — which Master Products are in which LSX (from Manufacturing Orders)
  const [lsxFilter, setLsxFilter] = useState("");
  const { lsxIndex, lsxOfMaster } = useMemo(() => {
    const idx = new Map(), of = new Map();
    for (const m of masterProducts) {
      const opts = lsxOptionsFor(m);
      of.set(m.id, opts);
      for (const x of opts) {
        const cur = idx.get(x.key) || { key: x.key, moNo: x.moNo, type: x.type, date: x.date, ids: new Set() };
        cur.ids.add(m.id); idx.set(x.key, cur);
      }
    }
    return { lsxIndex: idx, lsxOfMaster: of };
  }, [masterProducts, lsxOptionsFor]);
  const lsxList = [...lsxIndex.values()].sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")) || String(a.moNo).localeCompare(String(b.moNo)));

  const rowFor = (m, preferKey = "") => {
    const src = samples.find((x) => x.id === m.sourceSampleId);
    const sug = src ? suggestFromProduct(src, materialLists) : { weaveOn: "", na: [] };
    const opts = lsxOfMaster.get(m.id) || lsxOptionsFor(m);
    const chosen = (preferKey && opts.find((x) => x.key === preferKey)) || opts.find((x) => x.type === "Đại trà") || opts[0];
    return { masterId: m.id, moKey: chosen?.key || "", productDescription: m.description || firstLine(m.name), weaveOn: sug.weaveOn || "", na: sug.na || [] };
  };
  const isPicked = (id) => picked.some((p) => p.masterId === id);
  // LSX to pre-select when ticking: the LSX filter, else an LSX whose number matches the search text
  const preferLsx = () => lsxFilter || (q ? (lsxList.find((x) => String(x.moNo).toLowerCase() === q) || lsxList.find((x) => String(x.moNo).toLowerCase().includes(q)))?.key || "" : "");
  const toggle = (m) => setPicked((list) => (list.some((p) => p.masterId === m.id) ? list.filter((p) => p.masterId !== m.id) : [...list, rowFor(m, preferLsx())]));
  const patch = (id, ch) => setPicked((list) => list.map((p) => (p.masterId === id ? { ...p, ...ch } : p)));
  useEffect(() => { const m = initialMasterId && byId.get(initialMasterId); if (m && !isPicked(m.id)) setPicked((l) => [...l, rowFor(m)]); }, [initialMasterId]);

  const lsxSel = lsxFilter ? lsxIndex.get(lsxFilter) : null;
  const lsxText = (m) => (lsxOfMaster.get(m.id) || []).map((x) => x.moNo).join(" ");
  const options = masterProducts.filter((m) => m.status === "Active"
      && (!lsxSel || lsxSel.ids.has(m.id))
      && (!q || `${m.erpNo} ${m.description} ${m.name} ${customerName(m.customerId)} ${lsxText(m)}`.toLowerCase().includes(q)))
    .sort((a, b) => String(a.erpNo).localeCompare(String(b.erpNo)));
  const shown = options.slice(0, 300);
  const pickAllShown = () => { const k = preferLsx(); setPicked((list) => [...list, ...shown.filter((m) => !list.some((p) => p.masterId === m.id)).map((m) => rowFor(m, k))]); };

  const submit = async () => {
    if (!picked.length) { alert("Tích chọn ít nhất 1 sản phẩm."); return; }
    if (!common.startDate) { alert("Nhập ngày bắt đầu."); return; }
    const missing = picked.filter((p) => !lsxOptionsFor(byId.get(p.masterId)).some((x) => x.key === p.moKey));
    if (missing.length) { alert("Chưa chọn LSX cho: " + missing.map((p) => byId.get(p.masterId)?.erpNo || p.masterId).join(", ")); return; }
    const notMass = picked.filter((p) => lsxOptionsFor(byId.get(p.masterId)).find((x) => x.key === p.moKey)?.type !== "Đại trà");
    if (notMass.length && !confirm(`${notMass.length} mã đang chọn LSX không phải "Đại trà". Vẫn tạo?`)) return;
    const drafts = picked.map((p) => {
      const m = byId.get(p.masterId);
      const lsx = lsxOptionsFor(m).find((x) => x.key === p.moKey);
      return { erpNo: (m.erpNo || "").trim(), productDescription: p.productDescription, customerId: m.customerId || "", imageUrl: m.imageUrl || "",
        sampleId: m.sourceSampleId || "", masterProductId: m.id, moId: lsx.key, lsxNo: lsx.moNo,
        owner: common.owner, startDate: common.startDate, testDeadline: common.testDeadline, weaveOn: p.weaveOn, na: p.na, fixed: common.fixed };
    });
    setSaving(true);
    try { await onCreate(drafts); } finally { setSaving(false); }
  };

  const th = { textAlign: "left", padding: "7px 8px", fontSize: 11.5, color: COLORS.inkSoft, fontWeight: 700, borderBottom: `1px solid ${COLORS.line}`, whiteSpace: "nowrap" };
  const td = { padding: "7px 8px", borderBottom: `1px solid ${COLORS.line}`, fontSize: 12.5, verticalAlign: "top" };
  return (
    <Panel title="Mang hàng đi test — chọn nhiều sản phẩm" action={<Button small variant="ghost" onClick={onCancel}><X size={14} /> Huỷ</Button>}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ fontSize: 12.5, color: COLORS.inkSoft }}>Tích chọn các mã trong <b>Master Products</b>; mỗi mã chọn <b>LSX đại trà</b> lấy hàng đi test. Người phụ trách, ngày bắt đầu, hạn đi test và ngày ấn định áp dụng chung (sửa riêng từng mã sau trong chi tiết).</div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 8 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: "1 1 320px" }}>
              <Search size={14} style={{ position: "absolute", left: 10, top: 11, color: COLORS.inkSoft }} />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Gõ mã ERP / mô tả / khách / số LSX để lọc…" style={{ paddingLeft: 30 }} />
            </div>
            <Select value={lsxFilter} onChange={(e) => setLsxFilter(e.target.value)} style={{ maxWidth: 300, ...(lsxFilter ? { borderColor: COLORS.wood } : {}) }}>
              <option value="">Lọc theo LSX: tất cả</option>
              {lsxList.map((x) => <option key={x.key} value={x.key}>{x.type} · {x.moNo} ({x.ids.size} mã)</option>)}
            </Select>
            <Button small variant="subtle" onClick={pickAllShown} disabled={(!q && !lsxFilter) || !shown.length}>Chọn tất cả {q || lsxFilter ? `(${shown.length})` : ""}</Button>
            {picked.length > 0 && <Button small variant="ghost" onClick={() => setPicked([])}>Bỏ chọn hết</Button>}
            <span style={{ fontSize: 12.5, color: COLORS.inkSoft }}>Đã chọn <b>{picked.length}</b> / {options.length} mã</span>
          </div>
          <div style={{ border: `1px solid ${COLORS.line}`, borderRadius: 10, maxHeight: 260, overflowY: "auto" }}>
            {!masterProducts.length && <div style={{ padding: 12, fontSize: 12.5, color: COLORS.amber }}>Chưa có Master Product nào. Chuyển mẫu đã accept từ Sample sang Master trước.</div>}
            {shown.map((m, i) => {
              const on = isPicked(m.id);
              const nLsx = (lsxOfMaster.get(m.id) || []).length;
              return (
                <label key={m.id} style={{ display: "flex", gap: 10, alignItems: "center", padding: "7px 10px", borderTop: i ? `1px solid ${COLORS.line}` : "none", background: on ? "#EEF3FE" : "#FFFFFF", cursor: "pointer", fontSize: 13 }}>
                  <input type="checkbox" checked={on} onChange={() => toggle(m)} />
                  <ProductThumb image={m.imageUrl} ui={ui} size={30} />
                  <span style={{ fontWeight: 700, minWidth: 190 }}>{m.erpNo || "(no ERP)"}</span>
                  <span style={{ flex: 1, minWidth: 0, color: COLORS.inkSoft, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.description || firstLine(m.name)} · {customerName(m.customerId)}</span>
                  {nLsx > 0 && <span style={{ fontSize: 11.5, color: COLORS.inkSoft, whiteSpace: "nowrap" }}>{lsxText(m)}</span>}
                  {tracked.has(m.id) && <Badge tone="teal">Đang test</Badge>}
                  {!nLsx && <Badge tone="amber">Chưa có LSX</Badge>}
                </label>
              );
            })}
            {options.length > shown.length && <div style={{ padding: "7px 10px", fontSize: 12, color: COLORS.inkSoft }}>+{options.length - shown.length} mã khác — gõ để lọc</div>}
          </div>
        </div>

        {picked.length > 1 && (() => {
          const all = new Map();
          picked.forEach((p) => lsxOptionsFor(byId.get(p.masterId)).forEach((x) => { const c = all.get(x.key) || { ...x, n: 0 }; c.n++; all.set(x.key, c); }));
          const list = [...all.values()].sort((a, b) => b.n - a.n);
          return list.length ? (
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", fontSize: 12.5 }}>
              <span style={{ fontWeight: 600 }}>Áp dụng 1 LSX cho các mã đã chọn:</span>
              <Select value="" onChange={(e) => { const k = e.target.value; if (!k) return; setPicked((rows) => rows.map((p) => (lsxOptionsFor(byId.get(p.masterId)).some((x) => x.key === k) ? { ...p, moKey: k } : p))); }} style={{ ...cellInput, maxWidth: 360 }}>
                <option value="">— Chọn LSX —</option>
                {list.map((x) => <option key={x.key} value={x.key}>{x.type} · {x.moNo} — có {x.n}/{picked.length} mã</option>)}
              </Select>
            </div>
          ) : null;
        })()}
        {picked.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><th style={th}>#</th><th style={th}>Mã ERP</th><th style={th}>Product Description</th><th style={th}>LSX lấy hàng đi test *</th><th style={th}>Đan dây trên</th><th style={th}>Công đoạn (bỏ tick = N/A)</th><th style={th}></th></tr></thead>
              <tbody>
                {picked.map((p, i) => {
                  const m = byId.get(p.masterId);
                  const opts = lsxOptionsFor(m);
                  const sel = opts.find((x) => x.key === p.moKey);
                  return (
                    <tr key={p.masterId}>
                      <td style={td}>{i + 1}</td>
                      <td style={{ ...td, fontWeight: 700, whiteSpace: "nowrap" }}>{m?.erpNo}{tracked.has(p.masterId) && <div><Badge tone="teal">đang có lượt test</Badge></div>}</td>
                      <td style={{ ...td, minWidth: 200 }}><Input value={p.productDescription} onChange={(e) => patch(p.masterId, { productDescription: e.target.value })} style={cellInput} /></td>
                      <td style={{ ...td, minWidth: 210 }}>
                        <Select value={p.moKey} onChange={(e) => patch(p.masterId, { moKey: e.target.value })} style={{ ...cellInput, ...(!sel ? { borderColor: COLORS.amber } : {}) }}>
                          <option value="">— Chọn LSX —</option>
                          {opts.map((x) => <option key={x.key} value={x.key}>{x.type} · {x.moNo}{x.poReference ? ` · PO ${x.poReference}` : ""}</option>)}
                        </Select>
                        {!opts.length && <div style={{ fontSize: 11.5, color: COLORS.amber, marginTop: 3 }}>Mã chưa có trong LSX nào</div>}
                        {sel && sel.type !== "Đại trà" && <div style={{ fontSize: 11.5, color: COLORS.amber, marginTop: 3 }}>Không phải LSX đại trà</div>}
                      </td>
                      <td style={{ ...td, minWidth: 130 }}>
                        <Select value={p.weaveOn} onChange={(e) => patch(p.masterId, { weaveOn: e.target.value })} style={cellInput}>
                          <option value="">— Chọn —</option>
                          {WEAVE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </Select>
                      </td>
                      <td style={{ ...td, minWidth: 260 }}>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {chipSteps.map((x) => {
                            const onStep = !p.na.includes(x.code);
                            return (
                              <button key={x.code} type="button" onClick={() => patch(p.masterId, { na: onStep ? [...p.na, x.code] : p.na.filter((c) => c !== x.code) })}
                                style={{ border: `1px solid ${onStep ? COLORS.wood : COLORS.line}`, background: onStep ? "#EEF3FE" : "#FFFFFF", color: onStep ? COLORS.wood : COLORS.inkSoft, borderRadius: 999, padding: "2px 8px", fontSize: 11.5, cursor: "pointer", textDecoration: onStep ? "none" : "line-through" }}>{x.short}</button>
                            );
                          })}
                        </div>
                      </td>
                      <td style={td}><button type="button" title="Bỏ" onClick={() => toggle(m)} style={{ border: "none", background: "none", color: COLORS.red, cursor: "pointer" }}><X size={14} /></button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 12 }}>
          <Field label="Người phụ trách"><Input value={common.owner} onChange={(e) => setCommon({ ...common, owner: e.target.value })} /></Field>
          <Field label="Ngày bắt đầu *"><Input type="date" value={common.startDate} onChange={(e) => setCommon({ ...common, startDate: e.target.value })} /></Field>
          <Field label="Hạn mang đi test"><Input type="date" value={common.testDeadline} onChange={(e) => setCommon({ ...common, testDeadline: e.target.value })} /></Field>
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.inkSoft, marginBottom: 6 }}>Ngày ấn định chung (bỏ qua với mã có bước đó = N/A; có thể để trống, nhập sau theo từng mã)</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 12 }}>
            {fixedSteps.map((x) => (
              <Field key={x.code} label={`${x.short}${x.place === "Thuê ngoài" ? " (thuê ngoài)" : ""}`}>
                <Input type="date" value={common.fixed[x.code] || ""} onChange={(e) => setCommon({ ...common, fixed: { ...common.fixed, [x.code]: e.target.value } })} />
              </Field>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button onClick={submit} disabled={saving || !picked.length}><Plus size={14} /> {saving ? "Đang tạo…" : `Tạo ${picked.length || ""} theo dõi`}</Button>
          <Button variant="ghost" onClick={onCancel}>Huỷ</Button>
        </div>
      </div>
    </Panel>
  );
}

function NewTrackingForm({ ui, samples, customers, customerName, materialLists, settings, existing, currentUser, onCancel, onCreate, masterAvailable = false, masterProducts = [], lsxOptionsFor = () => [], initialMasterId = "" }) {
  const { Panel, Button, Field, Input, Select, TextArea, COLORS } = ui;
  // v58: when Master Products exist, a test sample is always taken from a Master Product + an LSX.
  const [mode, setMode] = useState(masterAvailable ? "master" : "new"); // master | new = nhập riêng | pick = chọn từ Products
  const [masterId, setMasterId] = useState("");
  const [moId, setMoId] = useState("");
  const [sampleId, setSampleId] = useState("");
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState({ erpNo: "", productDescription: "", customerId: customers[0]?.id || "", imageUrl: "", lsxNo: "", owner: currentUser?.full_name || "", startDate: todayIso(), testDeadline: "", weaveOn: "", na: [], fixed: {} });
  const masterSel = mode === "master" ? masterProducts.find((m) => m.id === masterId) || null : null;
  const lsxOptions = lsxOptionsFor(masterSel);
  const lsxSel = lsxOptions.find((x) => x.key === moId) || null;
  const product = mode === "pick" ? samples.find((s) => s.id === sampleId) : mode === "master" ? samples.find((s) => s.id === masterSel?.sourceSampleId) || null : null;
  const trackedErp = new Set(existing.filter((t) => t.status !== "Closed").map((t) => String(t.erpNo || samples.find((s) => s.id === t.sampleId)?.erpNo || "").toLowerCase()).filter(Boolean));
  const q = search.trim().toLowerCase();
  const options = samples.filter((s) => !q || `${s.erpNo} ${s.name} ${s.id}`.toLowerCase().includes(q)).slice(0, 200);
  const masterOptions = masterProducts.filter((m) => m.status === "Active" && (!q || `${m.erpNo} ${m.description} ${m.name}`.toLowerCase().includes(q))).slice(0, 300);
  const erpNow = (mode === "pick" ? product?.erpNo : draft.erpNo) || "";
  const dupErp = erpNow && trackedErp.has(erpNow.toLowerCase());
  const masterMatch = mode === "new" && draft.erpNo.trim() ? samples.find((s) => String(s.erpNo || "").trim().toLowerCase() === draft.erpNo.trim().toLowerCase()) : null;

  const pick = (id) => {
    setSampleId(id);
    const p = samples.find((s) => s.id === id);
    if (!p) return;
    const sug = suggestFromProduct(p, materialLists);
    setDraft((d) => ({ ...d, erpNo: p.erpNo || "", productDescription: firstLine(p.name), customerId: p.customerId || d.customerId, lsxNo: p.manufacturingOrderNo || d.lsxNo, weaveOn: sug.weaveOn, na: sug.na }));
  };
  const pickMaster = (id) => {
    setMasterId(id);
    const m = masterProducts.find((x) => x.id === id);
    if (!m) return;
    const src = samples.find((s) => s.id === m.sourceSampleId);
    const sug = src ? suggestFromProduct(src, materialLists) : { weaveOn: "", na: [] };
    const opts = lsxOptionsFor(m);
    const firstMass = opts.find((x) => x.type === "Đại trà") || opts[0];
    setMoId(firstMass?.key || "");
    setDraft((d) => ({ ...d, erpNo: m.erpNo || "", productDescription: m.description || firstLine(m.name), customerId: m.customerId || d.customerId, imageUrl: m.imageUrl || "", weaveOn: sug.weaveOn, na: sug.na }));
  };
  useEffect(() => { if (initialMasterId && masterAvailable) pickMaster(initialMasterId); }, [initialMasterId]);
  const toggleNa = (code) => setDraft((d) => ({ ...d, na: d.na.includes(code) ? d.na.filter((c) => c !== code) : [...d.na, code] }));
  const fixedSteps = settings.steps.filter((s) => s.planType === "fixed");
  const submit = (e) => {
    e.preventDefault();
    if (mode === "master") {
      if (!masterSel) { alert("Chọn sản phẩm trong Master Products."); return; }
      if (!lsxSel) { alert("Chọn LSX mà hàng test được lấy ra (bắt buộc)."); return; }
      if (!draft.startDate) { alert("Nhập ngày bắt đầu."); return; }
      if (lsxSel.type !== "Đại trà" && !confirm(`LSX ${lsxSel.moNo} là loại "${lsxSel.type}", không phải LSX đại trà. Vẫn tạo?`)) return;
      onCreate({ ...draft, erpNo: (masterSel.erpNo || "").trim(), sampleId: masterSel.sourceSampleId || "", masterProductId: masterSel.id, moId: lsxSel.key, lsxNo: lsxSel.moNo });
      return;
    }
    if (mode === "pick" && !sampleId) { alert("Chọn sản phẩm trong Products."); return; }
    if (mode === "new" && !draft.erpNo.trim()) { alert("Nhập Mã ERP."); return; }
    if (!draft.startDate) { alert("Nhập ngày bắt đầu."); return; }
    onCreate({ ...draft, erpNo: draft.erpNo.trim(), sampleId: mode === "pick" ? sampleId : (masterMatch?.id || ""), imageUrl: mode === "pick" ? "" : draft.imageUrl });
  };
  const tabBtn = (key, label) => (
    <button type="button" onClick={() => setMode(key)} style={{ border: `1px solid ${mode === key ? COLORS.wood : COLORS.line}`, background: mode === key ? "#EEF3FE" : "#FFFFFF", color: mode === key ? COLORS.wood : COLORS.ink, borderRadius: 9, padding: "7px 12px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>{label}</button>
  );

  return (
    <Panel title="Theo dõi mẫu mới" action={<Button small variant="ghost" onClick={onCancel}><X size={14} /> Huỷ</Button>}>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {masterAvailable ? (
          <div style={{ fontSize: 12.5, color: COLORS.inkSoft }}>Hàng mang đi test lấy từ <b>Master Products</b> (mã khách đã accept) và phải thuộc một <b>LSX đại trà</b> trong Manufacturing Orders.</div>
        ) : (
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {tabBtn("new", "Nhập thông tin mẫu")}
            {tabBtn("pick", "Lấy từ Products có sẵn")}
            <span style={{ fontSize: 12, color: COLORS.inkSoft }}>Module này chỉ theo dõi tiến độ mẫu test. Khi chốt, bấm “Chuyển sang Products” để đưa thông tin vào bảng master.</span>
          </div>
        )}

        {mode === "master" ? (
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,2fr) minmax(0,1fr)", gap: 14 }}>
            <Field label="Master Product (tìm theo mã ERP / mô tả) *">
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Gõ mã ERP hoặc mô tả…" />
              <Select value={masterId} onChange={(e) => pickMaster(e.target.value)} size={6} style={{ marginTop: 6, height: "auto" }}>
                {masterOptions.map((m) => <option key={m.id} value={m.id}>{m.erpNo || "(no ERP)"} — {m.description || firstLine(m.name)} · {customerName(m.customerId)}</option>)}
              </Select>
              {!masterProducts.length && <div style={{ fontSize: 12.5, color: COLORS.amber, marginTop: 6 }}>Chưa có Master Product nào. Chuyển mẫu đã accept từ Sample sang Master trước.</div>}
            </Field>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <ProductThumb image={masterSel?.imageUrl || product?.image} ui={ui} size={96} />
              <div style={{ fontSize: 12.5, lineHeight: 1.5 }}>
                <div style={{ fontWeight: 700 }}>{masterSel?.erpNo || "Chưa chọn"}</div>
                <div style={{ color: COLORS.inkSoft }}>{masterSel ? customerName(masterSel.customerId) : ""}</div>
              </div>
            </div>
            {masterSel && (
              <>
                <Field label="LSX lấy hàng đi test *">
                  <Select value={moId} onChange={(e) => setMoId(e.target.value)} style={!lsxSel ? { borderColor: COLORS.amber } : undefined}>
                    <option value="">— Chọn LSX —</option>
                    {lsxOptions.map((x) => <option key={x.key} value={x.key}>{x.type} · {x.moNo}{x.date ? ` · ${fmt(x.date)}` : ""}{x.poReference ? ` · PO ${x.poReference}` : ""}</option>)}
                  </Select>
                  {!lsxOptions.length && <div style={{ fontSize: 12.5, color: COLORS.amber, marginTop: 6 }}>Mã này chưa nằm trong LSX nào. Tạo LSX đại trà trong Manufacturing Orders (thêm mã vào LSX) rồi quay lại.</div>}
                  {lsxSel && lsxSel.type !== "Đại trà" && <div style={{ fontSize: 12.5, color: COLORS.amber, marginTop: 6 }}>LSX này là loại “{lsxSel.type}”, không phải đại trà.</div>}
                </Field>
                <Field label="Product Description (mô tả ngắn, sửa được)"><Input value={draft.productDescription} onChange={(e) => setDraft({ ...draft, productDescription: e.target.value })} /></Field>
              </>
            )}
          </div>
        ) : mode === "new" ? (
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1.6fr) minmax(0,0.9fr) 120px", gap: 12, alignItems: "start" }}>
            <Field label="Mã ERP *"><Input value={draft.erpNo} onChange={(e) => setDraft({ ...draft, erpNo: e.target.value })} placeholder="10DGRM0004ASSKL0536" /></Field>
            <Field label="Product Description (mô tả ngắn)"><TextArea rows={2} value={draft.productDescription} onChange={(e) => setDraft({ ...draft, productDescription: e.target.value })} placeholder="VD: Table top SET 8 – W1200xD1200, Acacia + superstone" /></Field>
            <Field label="Khách hàng">
              <Select value={draft.customerId} onChange={(e) => setDraft({ ...draft, customerId: e.target.value })}>
                <option value="">—</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>
            <Field label="Ảnh sản phẩm">
              <PhotoProof images={draft.imageUrl ? [draft.imageUrl] : []} max={1} size={56} label="Ảnh" folder="test-tracking/products" prefix="product" onChange={(imgs) => setDraft({ ...draft, imageUrl: imgs[0] || "" })} />
            </Field>
            {masterMatch && <div style={{ gridColumn: "1 / -1", fontSize: 12.5, color: COLORS.wood }}>Products đã có mã này ({masterMatch.id} — {firstLine(masterMatch.name)}). Lượt theo dõi sẽ tự liên kết với sản phẩm đó.</div>}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,2fr) minmax(0,1fr)", gap: 14 }}>
            <Field label="Sản phẩm (tìm theo mã ERP / tên)">
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Gõ mã ERP hoặc tên…" />
              <Select value={sampleId} onChange={(e) => pick(e.target.value)} size={6} style={{ marginTop: 6, height: "auto" }}>
                {options.map((s) => <option key={s.id} value={s.id}>{s.erpNo || "(no ERP)"} — {firstLine(s.name)} · {customerName(s.customerId)}</option>)}
              </Select>
            </Field>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <ProductThumb image={product?.image} ui={ui} size={96} />
              <div style={{ fontSize: 12.5, lineHeight: 1.5 }}>
                <div style={{ fontWeight: 700 }}>{product?.erpNo || "Chưa chọn"}</div>
                <div style={{ color: COLORS.inkSoft, whiteSpace: "pre-line", maxHeight: 96, overflow: "hidden" }}>{product?.name}</div>
              </div>
            </div>
            {product && <div style={{ gridColumn: "1 / -1" }}><Field label="Product Description (mô tả ngắn, sửa được)"><Input value={draft.productDescription} onChange={(e) => setDraft({ ...draft, productDescription: e.target.value })} /></Field></div>}
          </div>
        )}
        {dupErp && <div style={{ color: COLORS.amber, fontWeight: 600, fontSize: 12.5 }}>Mã ERP này đang được theo dõi — tạo thêm nghĩa là một lượt test mới.</div>}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0,1fr))", gap: 12 }}>
          {mode === "master"
            ? <Field label="LSX"><Input value={lsxSel?.moNo || ""} disabled placeholder="chọn ở trên" /></Field>
            : <Field label="Số LSX mẫu"><Input value={draft.lsxNo} onChange={(e) => setDraft({ ...draft, lsxNo: e.target.value })} /></Field>}
          <Field label="Người phụ trách"><Input value={draft.owner} onChange={(e) => setDraft({ ...draft, owner: e.target.value })} /></Field>
          <Field label="Ngày bắt đầu"><Input type="date" value={draft.startDate} onChange={(e) => setDraft({ ...draft, startDate: e.target.value })} /></Field>
          <Field label="Hạn mang đi test"><Input type="date" value={draft.testDeadline} onChange={(e) => setDraft({ ...draft, testDeadline: e.target.value })} /></Field>
          <Field label="Đan dây trên">
            <Select value={draft.weaveOn} onChange={(e) => setDraft({ ...draft, weaveOn: e.target.value })}>
              <option value="">— Chọn —</option>
              {WEAVE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
          </Field>
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.inkSoft, marginBottom: 6 }}>Mẫu có những công đoạn nào? (bỏ tick = N/A{mode !== "new" ? " — đã gợi ý theo thông số sản phẩm, hãy kiểm tra lại" : ""})</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {settings.steps.filter((s) => s.source === "input" && s.code !== "LAP_RAP" && s.code !== "NHAN_VE" && s.code !== "DAN_DAY").map((s) => {
              const on = !draft.na.includes(s.code);
              return (
                <label key={s.code} style={{ display: "inline-flex", gap: 6, alignItems: "center", border: `1px solid ${on ? COLORS.wood : COLORS.line}`, borderRadius: 999, padding: "5px 11px", fontSize: 12.5, cursor: "pointer", background: on ? "#EEF3FE" : "#FFFFFF" }}>
                  <input type="checkbox" checked={on} onChange={() => toggleNa(s.code)} /> {s.short}
                </label>
              );
            })}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.inkSoft, marginBottom: 6 }}>Ngày ấn định (có thể nhập sau; Hardware/Nệm/Khung sắt cũng có thể để trống và nhập theo từng chi tiết vật tư)</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 12 }}>
            {fixedSteps.filter((s) => !draft.na.includes(s.code)).map((s) => (
              <Field key={s.code} label={`${s.short}${s.place === "Thuê ngoài" ? " (thuê ngoài)" : ""}`}>
                <Input type="date" value={draft.fixed[s.code] || ""} onChange={(e) => setDraft({ ...draft, fixed: { ...draft.fixed, [s.code]: e.target.value } })} />
              </Field>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button type="submit"><Plus size={14} /> Tạo theo dõi</Button>
          <Button type="button" variant="ghost" onClick={onCancel}>Huỷ</Button>
        </div>
      </form>
    </Panel>
  );
}

/* ================= Detail ================= */
function TrackingDetail({ ui, entry, settings, customerName, canEdit, canDelete, onBack, patchTracking, setStep, lockBaseline, upsertPart, removePart, upsertTest, removeTest, removeTracking, customers = [], transferToMaster, canTransfer, qcRecords = [], openQcForStep, onOpenQc, masterAvailable = false, masterProducts = [], lsxOptionsFor = () => [], onOpenMaster }) {
  const { Panel, Button, Badge, Field, Input, Select, TextArea, COLORS } = ui;
  const { tracking: t, product: p, info, computed: c } = entry;
  const ro = !canEdit;
  const masterOfT = masterAvailable && t.masterProductId ? masterProducts.find((m) => m.id === t.masterProductId) || null : null;
  const lsxOpts = lsxOptionsFor(masterOfT);
  const dateCell = (value, onChange, disabled) => <Input type="date" value={value || ""} disabled={disabled || ro} onChange={(e) => onChange(e.target.value)} style={{ ...cellInput, width: 128 }} />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div><Button small variant="ghost" onClick={onBack}><ArrowLeft size={14} /> Danh sách</Button></div>

      <Panel>
        <div style={{ display: "grid", gridTemplateColumns: "120px minmax(0,1fr)", gap: 18 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <ProductThumb image={info.image} ui={ui} size={120} />
            {canEdit && <PhotoProof images={t.imageUrl ? [t.imageUrl] : []} max={1} size={28} label="Đổi ảnh" folder={`test-tracking/${t.id}`} prefix="product" onChange={(imgs) => patchTracking(t.id, { imageUrl: imgs[0] || "" })} />}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 20, fontWeight: 800 }}>{info.erpNo || "(chưa có mã ERP)"}</div>
                <div style={{ color: COLORS.inkSoft, fontSize: 13 }}>{info.description || "Chưa có Product Description"}</div>
                <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <Badge tone={statusTone(c.status)}>{c.status}</Badge>
                  <Badge tone={statusTone(c.gate)}>Lắp ráp: {c.gate}{c.gate === "Chờ" ? ` (${c.gateMissing.map((s) => s.short).join(", ")})` : ""}</Badge>
                  {c.risk && <Badge tone={c.riskDays > 0 ? "red" : "green"}>Đi test dự kiến {fmt(c.expectedSend)} · {c.risk}</Badge>}
                  {t.baselineLockedAt ? <Badge tone="wood">KH gốc đã chốt {fmt(t.baselineLockedAt)}</Badge> : <Badge tone="amber">KH gốc chưa chốt</Badge>}
                  {masterAvailable
                    ? (masterOfT
                      ? <button type="button" onClick={() => onOpenMaster?.(masterOfT.id)} style={{ border: "none", background: "none", padding: 0, cursor: onOpenMaster ? "pointer" : "default" }}><Badge tone="green">Master: {masterOfT.erpNo || masterOfT.id}</Badge></button>
                      : <Badge tone="amber">Chưa liên kết Master Products</Badge>)
                    : (info.linked ? <Badge tone="green">Đã có trong Products ({p.id})</Badge> : <Badge>Chưa chuyển sang Products</Badge>)}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-start" }}>
                {canEdit && masterAvailable && !masterOfT && <Button small variant="subtle" onClick={() => transferToMaster(entry)}>Liên kết Master Products</Button>}
                {canEdit && !masterAvailable && !info.linked && canTransfer && <Button small variant="subtle" onClick={() => transferToMaster(entry)}>Chuyển sang Products</Button>}
                <RowHistoryButton table="test_trackings" rowId={t.id} title={`${info.erpNo || ""} · ${t.lsxNo || ""}`} label="Lịch sử" />
                {canEdit && <Button small variant="subtle" onClick={() => lockBaseline(entry)}><Lock size={13} /> Chốt KH gốc</Button>}
                {canEdit && <Button small variant="subtle" onClick={() => patchTracking(t.id, { status: t.status === "Closed" ? "Active" : "Closed" })}>{t.status === "Closed" ? "Mở lại" : "Đóng theo dõi"}</Button>}
                {canDelete && <Button small variant="danger" onClick={() => removeTracking(entry)}><Trash2 size={13} /> Xoá</Button>}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,2fr) minmax(0,1fr)", gap: 10 }}>
              <Field label="Mã ERP"><BlurInput ui={ui} value={info.erpNo} disabled={ro} onCommit={(v) => patchTracking(t.id, { erpNo: v.trim() })} /></Field>
              <Field label="Product Description (mô tả ngắn)"><BlurInput ui={ui} value={t.productDescription || info.description} disabled={ro} onCommit={(v) => patchTracking(t.id, { productDescription: v })} /></Field>
              <Field label="Khách hàng">
                <Select value={info.customerId} disabled={ro} onChange={(e) => patchTracking(t.id, { customerId: e.target.value })}>
                  <option value="">—</option>
                  {customers.map((cu) => <option key={cu.id} value={cu.id}>{cu.name}</option>)}
                </Select>
              </Field>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0,1fr))", gap: 10 }}>
              {masterOfT
                ? <Field label="LSX lấy hàng đi test">
                    <Select value={t.moId || ""} disabled={ro} onChange={(e) => { const x = lsxOpts.find((o) => o.key === e.target.value); patchTracking(t.id, { moId: e.target.value, lsxNo: x?.moNo || "" }); }} style={!t.moId ? { borderColor: COLORS.amber } : undefined}>
                      <option value="">{t.lsxNo ? `${t.lsxNo} (chưa liên kết)` : "— Chọn LSX —"}</option>
                      {lsxOpts.map((x) => <option key={x.key} value={x.key}>{x.type} · {x.moNo}</option>)}
                    </Select>
                  </Field>
                : <Field label="Số LSX mẫu"><BlurInput ui={ui} value={t.lsxNo} disabled={ro} onCommit={(v) => patchTracking(t.id, { lsxNo: v })} /></Field>}
              <Field label="Người phụ trách"><BlurInput ui={ui} value={t.owner} disabled={ro} onCommit={(v) => patchTracking(t.id, { owner: v })} /></Field>
              <Field label="Ngày bắt đầu"><Input type="date" value={t.startDate} disabled={ro} onChange={(e) => patchTracking(t.id, { startDate: e.target.value })} /></Field>
              <Field label="Hạn mang đi test"><Input type="date" value={t.testDeadline} disabled={ro} onChange={(e) => patchTracking(t.id, { testDeadline: e.target.value })} /></Field>
              <Field label="Đan dây trên">
                <Select value={t.weaveOn} disabled={ro} onChange={(e) => patchTracking(t.id, { weaveOn: e.target.value })} style={!t.weaveOn && c.weaveUnset ? { borderColor: COLORS.amber } : undefined}>
                  <option value="">— Chọn —</option>
                  {WEAVE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </Select>
              </Field>
            </div>
          </div>
        </div>
      </Panel>

      <Panel title="Tiến độ 14 bước">
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
            <thead>
              <tr>{["#", "Công đoạn", "Nơi làm", "KH gốc", "Dự kiến", "Thực tế", "Hẹn lại", "Lệch", "Trạng thái", "Ảnh minh chứng", "QC", "N/A"].map((h) => <th key={h} style={{ textAlign: "left", padding: "7px 8px", borderBottom: `2px solid ${COLORS.line}`, color: COLORS.inkSoft, fontWeight: 600, fontSize: 11.5, whiteSpace: "nowrap" }}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {c.steps.map((s, i) => {
                const locked = s.source !== "input" || s.hasParts;
                const planEditable = s.planType === "fixed" && !s.hasParts;
                return (
                  <tr key={s.code} style={{ borderBottom: `1px solid ${COLORS.line}`, background: s.na ? "#FAFAFA" : "transparent", color: s.na ? COLORS.inkSoft : COLORS.ink }}>
                    <td style={{ padding: "6px 8px" }}>{i + 1}</td>
                    <td style={{ padding: "6px 8px", minWidth: 140 }}>
                      <div style={{ fontWeight: 600 }}>{s.short}</div>
                      <div style={{ fontSize: 11, color: COLORS.inkSoft }}>{s.planType === "fixed" ? "Ấn định" : `Lead ${s.lead} ngày`}{s.code === "DAN_DAY" && s.usedPreds.length ? ` · sau ${s.usedPreds.map((x) => c.byCode[x]?.short).join(" + ")}` : ""}</div>
                    </td>
                    <td style={{ padding: "6px 8px", fontSize: 11.5, color: s.place === "Thuê ngoài" ? "#C55A11" : COLORS.inkSoft, fontWeight: s.place === "Thuê ngoài" ? 700 : 400 }}>{s.place}</td>
                    <td style={{ padding: "6px 8px" }}>
                      {s.na ? "—" : planEditable
                        ? dateCell(s.row.planDate, (v) => setStep(t.id, s.code, { planDate: v }))
                        : <span title={s.planSource === "manual" ? "Đã chốt / ghi đè" : s.planSource === "parts" ? "Theo ngày hẹn muộn nhất của chi tiết" : "Tự tính theo lead time"}>{fmt(s.plan) || "—"}{s.planSource === "manual" ? " 🔒" : ""}</span>}
                      {s.missingFixed && <div style={{ color: COLORS.red, fontSize: 11 }}>Thiếu ngày ấn định</div>}
                    </td>
                    <td style={{ padding: "6px 8px", fontWeight: 600 }}>{s.na ? "—" : fmt(s.forecast) || "—"}</td>
                    <td style={{ padding: "6px 8px" }}>
                      {s.na ? "N/A" : locked
                        ? <span title={s.hasParts ? "Tự xong khi mọi chi tiết IQC đạt" : "Lấy từ nhật ký test"}>{fmt(s.actual) || <span style={{ color: COLORS.inkSoft }}>{s.hasParts ? "theo chi tiết" : "theo nhật ký test"}</span>}</span>
                        : dateCell(s.row.actualDate, (v) => setStep(t.id, s.code, { actualDate: v }))}
                    </td>
                    <td style={{ padding: "6px 8px" }}>{s.na || s.actual || s.hasParts ? (s.hasParts && s.reschedule ? fmt(s.reschedule) : "—") : dateCell(s.row.rescheduleDate, (v) => setStep(t.id, s.code, { rescheduleDate: v }))}</td>
                    <td style={{ padding: "6px 8px", whiteSpace: "nowrap", color: s.deviation > 0 ? COLORS.red : s.deviation < 0 ? COLORS.green : COLORS.inkSoft }}>{s.deviation === null || s.na ? "" : s.deviation > 0 ? `+${s.deviation}` : s.deviation}</td>
                    <td style={{ padding: "6px 8px" }}>{s.status && <Badge tone={statusTone(s.status)}>{s.status}</Badge>}</td>
                    <td style={{ padding: "6px 8px", minWidth: 90 }}>
                      {s.na ? "" : s.hasParts
                        ? <span style={{ fontSize: 11, color: COLORS.inkSoft }}>{s.parts.reduce((n, x) => n + (x.proofImages?.length || 0), 0)} ảnh ở chi tiết</span>
                        : <PhotoProof images={s.row.proofImages || []} size={26} label="" disabled={ro} folder={`test-tracking/${t.id}`} prefix={`step-${s.code}`} onChange={(imgs) => setStep(t.id, s.code, { proofImages: imgs })} />}
                    </td>
                    <td style={{ padding: "6px 8px", whiteSpace: "nowrap" }}>
                      {(() => {
                        const recs = qcRecords.filter((r) => r.stageCode === s.code || (s.code === "QA" && r.stageCode === "QA") || (s.code === "KQ_TT" && r.stageCode === "KQ_TT"));
                        const fails = recs.filter((r) => r.result === "Fail");
                        const open = fails.filter((r) => r.status !== "Đã xử lý");
                        return (
                          <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
                            {recs.length > 0 && <button type="button" onClick={() => onOpenQc(recs[recs.length - 1])} title="Mở phiếu QC gần nhất" style={{ border: "none", background: "transparent", padding: 0, cursor: "pointer" }}><Badge tone={open.length ? "red" : fails.length ? "amber" : "green"}>{open.length ? `${open.length} lỗi mở` : fails.length ? `${fails.length} lỗi đã xử lý` : `${recs.length} pass`}</Badge></button>}
                            {canEdit && !s.na && s.source === "input" && <button type="button" onClick={() => openQcForStep(entry, s)} title="Ghi kết quả kiểm QC cho bước này" style={{ border: `1px solid ${COLORS.line}`, background: "#FFFFFF", borderRadius: 7, padding: "2px 7px", fontSize: 11, cursor: "pointer", color: COLORS.inkSoft }}>+ QC</button>}
                          </span>
                        );
                      })()}
                    </td>
                    <td style={{ padding: "6px 8px" }}>
                      {s.source === "input" && s.code !== "LAP_RAP" && (
                        <input type="checkbox" disabled={ro} checked={Boolean(s.row.notApplicable) || (s.code === "DAN_DAY" && t.weaveOn === "none")}
                          onChange={(e) => s.code === "DAN_DAY" && t.weaveOn === "none" ? patchTracking(t.id, { weaveOn: "" }) : setStep(t.id, s.code, { notApplicable: e.target.checked })} />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 10, fontSize: 11.5, color: COLORS.inkSoft, lineHeight: 1.6 }}>
          Thực tế chỉ ghi khi QC/IQC đã ký đạt. Bước có chi tiết vật tư tự xong khi mọi dòng IQC đạt. Bước QA nhà máy / Đi TT / KQ TT lấy từ nhật ký test bên dưới. Hẹn lại = xưởng/NCC báo dời (KH gốc giữ nguyên).
        </div>
      </Panel>

      <PartsPanel ui={ui} entry={entry} settings={settings} canEdit={canEdit} upsertPart={upsertPart} removePart={removePart} />
      <TestsPanel ui={ui} entry={entry} settings={settings} canEdit={canEdit} upsertTest={upsertTest} removeTest={removeTest} />

      <Panel title="Ghi chú">
        <TextArea rows={3} defaultValue={t.notes} disabled={ro} onBlur={(e) => e.target.value !== t.notes && patchTracking(t.id, { notes: e.target.value })} placeholder="Ghi chú chung cho mẫu này…" />
      </Panel>
    </div>
  );
}

function PartsPanel({ ui, entry, settings, canEdit, upsertPart, removePart }) {
  const { Panel, Button, Badge, Input, Select, COLORS } = ui;
  const { tracking: t, computed: c } = entry;
  const ro = !canEdit;
  const [addStep, setAddStep] = useState("HW");
  const steps = settings.steps.filter((s) => s.source === "input" && (PART_STEPS.includes(s.code) || c.byCode[s.code]?.hasParts));
  const extraSteps = settings.steps.filter((s) => s.source === "input" && !steps.includes(s));
  const add = (stepCode, name = "") => {
    const existing = c.byCode[stepCode]?.parts || [];
    upsertPart({ id: uid(), trackingId: t.id, stepCode, itemName: name || "Chi tiết mới", spec: "", qty: "", unit: "", supplier: existing[existing.length - 1]?.supplier || "", poNo: existing[existing.length - 1]?.poNo || "", promisedDate: c.byCode[stepCode]?.row?.planDate || "", rescheduledDate: "", receivedDate: "", iqcResult: "Chờ", note: "", sortOrder: existing.length, proofImages: [] });
  };
  const upd = (part, patch) => upsertPart({ ...part, ...patch });

  return (
    <Panel title="Vật tư theo chi tiết (Khung sắt · Hardware · Nệm…)" action={canEdit && (
      <div style={{ display: "flex", gap: 6 }}>
        <Select value={addStep} onChange={(e) => setAddStep(e.target.value)} style={{ width: 160, padding: "6px 9px", fontSize: 13 }}>
          {[...steps, ...extraSteps].map((s) => <option key={s.code} value={s.code}>{s.short}</option>)}
        </Select>
        <Button small onClick={() => add(addStep)}><Plus size={13} /> Thêm dòng</Button>
      </div>
    )}>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {steps.map((s) => {
          const cs = c.byCode[s.code];
          if (!cs) return null;
          const rows = [...cs.parts].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
          const done = rows.filter((x) => x.iqcResult === "Đạt" && x.receivedDate).length;
          return (
            <div key={s.code}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                <div style={{ fontWeight: 700 }}>{s.short}</div>
                {cs.na ? <Badge>N/A</Badge> : rows.length ? <Badge tone={done === rows.length ? "green" : "amber"}>{done}/{rows.length} chi tiết đạt</Badge> : <span style={{ fontSize: 12, color: COLORS.inkSoft }}>Chưa chia chi tiết — đang theo dõi bằng 1 ngày ở bảng 14 bước</span>}
                {canEdit && !cs.na && (PART_SUGGESTIONS[s.code] || []).map((n) => (
                  <button key={n} onClick={() => add(s.code, n)} style={{ border: `1px dashed ${COLORS.line}`, background: "#FFFFFF", borderRadius: 999, padding: "2px 9px", fontSize: 11.5, cursor: "pointer", color: COLORS.inkSoft }}>+ {n}</button>
                ))}
              </div>
              {rows.length > 0 && (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                    <thead><tr>{["Chi tiết", "Quy cách", "SL", "ĐVT", "NCC", "PO", "Ngày hẹn", "Hẹn lại", "Ngày về", "IQC", "Ảnh nhận hàng", "Trạng thái", ""].map((h, i) => <th key={i} style={{ textAlign: "left", padding: "6px 6px", borderBottom: `2px solid ${COLORS.line}`, color: COLORS.inkSoft, fontWeight: 600, fontSize: 11.5, whiteSpace: "nowrap" }}>{h}</th>)}</tr></thead>
                    <tbody>
                      {rows.map((x) => (
                        <tr key={x.id} style={{ borderBottom: `1px solid ${COLORS.line}` }}>
                          <td style={{ padding: "5px 6px", minWidth: 130 }}><BlurInput ui={ui} value={x.itemName} disabled={ro} onCommit={(v) => upd(x, { itemName: v })} style={cellInput} /></td>
                          <td style={{ padding: "5px 6px", minWidth: 110 }}><BlurInput ui={ui} value={x.spec} disabled={ro} onCommit={(v) => upd(x, { spec: v })} style={cellInput} /></td>
                          <td style={{ padding: "5px 6px", width: 64 }}><BlurInput ui={ui} type="number" value={x.qty} disabled={ro} onCommit={(v) => upd(x, { qty: v })} style={{ ...cellInput, width: 60 }} /></td>
                          <td style={{ padding: "5px 6px", width: 64 }}><BlurInput ui={ui} value={x.unit} disabled={ro} onCommit={(v) => upd(x, { unit: v })} style={{ ...cellInput, width: 60 }} /></td>
                          <td style={{ padding: "5px 6px", minWidth: 100 }}><BlurInput ui={ui} value={x.supplier} disabled={ro} onCommit={(v) => upd(x, { supplier: v })} style={cellInput} /></td>
                          <td style={{ padding: "5px 6px", minWidth: 90 }}><BlurInput ui={ui} value={x.poNo} disabled={ro} onCommit={(v) => upd(x, { poNo: v })} style={cellInput} /></td>
                          {["promisedDate", "rescheduledDate", "receivedDate"].map((k) => (
                            <td key={k} style={{ padding: "5px 6px" }}><Input type="date" value={x[k] || ""} disabled={ro} onChange={(e) => upd(x, { [k]: e.target.value })} style={{ ...cellInput, width: 126 }} /></td>
                          ))}
                          <td style={{ padding: "5px 6px" }}>
                            <Select value={x.iqcResult} disabled={ro} onChange={(e) => upd(x, { iqcResult: e.target.value })} style={{ ...cellInput, width: 100 }}>
                              {IQC_RESULTS.map((r) => <option key={r} value={r}>{r}</option>)}
                            </Select>
                          </td>
                          <td style={{ padding: "5px 6px", minWidth: 96 }}>
                            <PhotoProof images={x.proofImages || []} size={26} label="" disabled={ro} folder={`test-tracking/${t.id}`} prefix={`part-${x.id}`} onChange={(imgs) => upd(x, { proofImages: imgs })} />
                            {x.receivedDate && !(x.proofImages || []).length && <div style={{ fontSize: 10.5, color: COLORS.amber }}>Chưa có ảnh</div>}
                          </td>
                          <td style={{ padding: "5px 6px" }}><Badge tone={statusTone(x.status)}>{x.status}</Badge></td>
                          <td style={{ padding: "5px 6px" }}>{canEdit && <button onClick={() => removePart(x)} title="Xoá dòng" style={{ border: "none", background: "transparent", color: COLORS.red, cursor: "pointer" }}><X size={14} /></button>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function TestsPanel({ ui, entry, settings, canEdit, upsertTest, removeTest }) {
  const { Panel, Button, Badge, Field, Input, Select, COLORS } = ui;
  const { tracking: t, computed: c } = entry;
  const ro = !canEdit;
  const blank = { testType: "QA nhà máy", sentDate: todayIso(), resultDate: "", result: "Chờ KQ", center: "", failedItems: "", rootCause: "", capa: "", redoStepCode: "", capaOwner: "", capaDue: "", ncrNo: "", ncrClosedDate: "", reportUrl: "", note: "" };
  const [form, setForm] = useState(null);
  const submit = (e) => {
    e.preventDefault();
    if (form.result === "Không đạt" && !form.failedItems.trim()) { alert("Test không đạt: ghi hạng mục không đạt để làm NCR."); return; }
    upsertTest({ ...form, id: form.id || uid(), trackingId: t.id, createdAt: form.createdAt || new Date().toISOString() });
    setForm(null);
  };
  const stepName = (code) => settings.steps.find((s) => s.code === code)?.short || "";

  return (
    <Panel title="Nhật ký test (QA nhà máy · Trung tâm)" action={canEdit && !form && <Button small onClick={() => setForm(blank)}><Plus size={13} /> Ghi lần test</Button>}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {form && (
          <form onSubmit={submit} style={{ border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0,1fr))", gap: 10 }}>
              <Field label="Loại test"><Select value={form.testType} onChange={(e) => setForm({ ...form, testType: e.target.value })}>{TEST_TYPES.map((x) => <option key={x}>{x}</option>)}</Select></Field>
              <Field label={form.testType === "Trung tâm" ? "Ngày gửi TT" : "Ngày test"}><Input type="date" value={form.sentDate} onChange={(e) => setForm({ ...form, sentDate: e.target.value })} /></Field>
              <Field label="Ngày có KQ"><Input type="date" value={form.resultDate} onChange={(e) => setForm({ ...form, resultDate: e.target.value })} /></Field>
              <Field label="Kết quả"><Select value={form.result} onChange={(e) => setForm({ ...form, result: e.target.value })}>{TEST_RESULTS.map((x) => <option key={x}>{x}</option>)}</Select></Field>
              <Field label="Trung tâm / tiêu chuẩn"><Input value={form.center} onChange={(e) => setForm({ ...form, center: e.target.value })} /></Field>
            </div>
            {form.result === "Không đạt" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 10, background: COLORS.redSoft, padding: 10, borderRadius: 10 }}>
                <Field label="Hạng mục không đạt"><Input value={form.failedItems} onChange={(e) => setForm({ ...form, failedItems: e.target.value })} /></Field>
                <Field label="Nguyên nhân gốc"><Input value={form.rootCause} onChange={(e) => setForm({ ...form, rootCause: e.target.value })} /></Field>
                <Field label="Hành động khắc phục (CAPA)"><Input value={form.capa} onChange={(e) => setForm({ ...form, capa: e.target.value })} /></Field>
                <Field label="Bước phải làm lại"><Select value={form.redoStepCode} onChange={(e) => setForm({ ...form, redoStepCode: e.target.value })}><option value="">—</option>{settings.steps.map((s) => <option key={s.code} value={s.code}>{s.short}</option>)}</Select></Field>
                <Field label="Người khắc phục"><Input value={form.capaOwner} onChange={(e) => setForm({ ...form, capaOwner: e.target.value })} /></Field>
                <Field label="Hạn khắc phục"><Input type="date" value={form.capaDue} onChange={(e) => setForm({ ...form, capaDue: e.target.value })} /></Field>
                <Field label="Số NCR"><Input value={form.ncrNo} onChange={(e) => setForm({ ...form, ncrNo: e.target.value })} /></Field>
                <Field label="Ngày đóng NCR"><Input type="date" value={form.ncrClosedDate} onChange={(e) => setForm({ ...form, ncrClosedDate: e.target.value })} /></Field>
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field label="Link report (nếu có)"><Input value={form.reportUrl} onChange={(e) => setForm({ ...form, reportUrl: e.target.value })} placeholder="https://…" /></Field>
              <Field label="Ghi chú"><Input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></Field>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Button small type="submit">{form.id ? "Lưu" : "Thêm vào nhật ký"}</Button>
              <Button small type="button" variant="ghost" onClick={() => setForm(null)}>Huỷ</Button>
            </div>
            <div style={{ fontSize: 11.5, color: COLORS.inkSoft }}>Test lại sau khi fail = THÊM lần test mới (không sửa lần cũ) để giữ lịch sử NCR.</div>
          </form>
        )}
        {!c.tests.length ? <div style={{ color: COLORS.inkSoft, fontSize: 13 }}>Chưa có lần test nào.</div> : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
              <thead><tr>{["Lần", "Ngày test/gửi", "Ngày KQ", "Kết quả", "Trung tâm", "Không đạt · CAPA", "Làm lại", "NCR", ""].map((h, i) => <th key={i} style={{ textAlign: "left", padding: "6px 8px", borderBottom: `2px solid ${COLORS.line}`, color: COLORS.inkSoft, fontWeight: 600, fontSize: 11.5 }}>{h}</th>)}</tr></thead>
              <tbody>
                {c.tests.map((x) => (
                  <tr key={x.id} style={{ borderBottom: `1px solid ${COLORS.line}` }}>
                    <td style={{ padding: "6px 8px", whiteSpace: "nowrap", fontWeight: 600 }}>{x.testType === "QA nhà máy" ? "QA" : "TT"} lần {x.attempt}</td>
                    <td style={{ padding: "6px 8px" }}>{fmt(x.sentDate)}</td>
                    <td style={{ padding: "6px 8px" }}>{fmt(x.resultDate)}</td>
                    <td style={{ padding: "6px 8px" }}><Badge tone={statusTone(x.result)}>{x.result}</Badge></td>
                    <td style={{ padding: "6px 8px" }}>{x.center}</td>
                    <td style={{ padding: "6px 8px", maxWidth: 260 }}>{x.failedItems}{x.capa ? <div style={{ color: COLORS.inkSoft }}>→ {x.capa}{x.capaDue ? ` (hạn ${fmt(x.capaDue)})` : ""}</div> : null}</td>
                    <td style={{ padding: "6px 8px" }}>{stepName(x.redoStepCode)}</td>
                    <td style={{ padding: "6px 8px", whiteSpace: "nowrap" }}>{x.ncrNo}{x.ncrNo ? (x.ncrClosedDate ? <span style={{ color: COLORS.green }}> · đóng {fmt(x.ncrClosedDate)}</span> : <span style={{ color: COLORS.red }}> · mở</span>) : ""}</td>
                    <td style={{ padding: "6px 8px", whiteSpace: "nowrap" }}>
                      {x.reportUrl && <a href={x.reportUrl} target="_blank" rel="noreferrer" style={{ marginRight: 8, fontSize: 12 }}>Report</a>}
                      {canEdit && <Button small variant="subtle" onClick={() => setForm({ ...blank, ...x })}>Sửa</Button>}
                      {canEdit && <button onClick={() => removeTest(x)} title="Xoá" style={{ border: "none", background: "transparent", color: COLORS.red, cursor: "pointer", marginLeft: 4 }}><X size={14} /></button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Panel>
  );
}

/* ================= Settings ================= */
function SettingsPanel({ ui, settings, onSave }) {
  const { Panel, Button, Input, Select, Field, COLORS } = ui;
  const [draft, setDraft] = useState(settings);
  const [holiday, setHoliday] = useState("");
  useEffect(() => { setDraft(settings); }, [settings]);
  const dirty = JSON.stringify(draft) !== JSON.stringify(settings);
  const setStepField = (code, patch) => setDraft((d) => ({ ...d, steps: d.steps.map((s) => (s.code === code ? { ...s, ...patch } : s)) }));
  const togglePred = (code, pred, key) => setDraft((d) => ({
    ...d,
    steps: d.steps.map((s) => {
      if (s.code !== code) return s;
      const list = s[key] || [];
      const other = key === "preds" ? "fallback" : "preds";
      return { ...s, [key]: list.includes(pred) ? list.filter((x) => x !== pred) : [...list, pred], [other]: (s[other] || []).filter((x) => x !== pred) };
    }),
  }));
  const days = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Panel title="Thông số" action={<div style={{ display: "flex", gap: 8 }}>
        <Button small variant="ghost" onClick={() => setDraft(mergeSettings())}>Về mặc định</Button>
        <Button small disabled={!dirty} onClick={() => onSave(draft)}>Lưu thiết lập</Button>
      </div>}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 14 }}>
          <Field label="Xong sớm thì kéo lịch bước sau sớm lên?">
            <Select value={draft.pullEarly ? "1" : "0"} onChange={(e) => setDraft({ ...draft, pullEarly: e.target.value === "1" })}><option value="0">Không (giữ lịch cũ)</option><option value="1">Có</option></Select>
          </Field>
          <Field label="Cảnh báo “sắp đến hạn” trước (ngày)"><Input type="number" value={draft.warnDays} onChange={(e) => setDraft({ ...draft, warnDays: Number(e.target.value) || 0 })} /></Field>
          <Field label="Nhắc NCC (thuê ngoài) trước (ngày)"><Input type="number" value={draft.warnDaysOutsourced} onChange={(e) => setDraft({ ...draft, warnDaysOutsourced: Number(e.target.value) || 0 })} /></Field>
          <Field label="Ngày nghỉ trong tuần">
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {days.map((d, i) => {
                const off = (draft.weekOff || "0000000")[i] === "1";
                return <button key={d} type="button" onClick={() => { const arr = (draft.weekOff || "0000000").padEnd(7, "0").split(""); arr[i] = off ? "0" : "1"; setDraft({ ...draft, weekOff: arr.join("") }); }} style={{ border: `1px solid ${off ? COLORS.red : COLORS.line}`, background: off ? COLORS.redSoft : "#FFFFFF", color: off ? COLORS.red : COLORS.ink, borderRadius: 8, padding: "6px 8px", fontSize: 12, cursor: "pointer" }}>{d}</button>;
              })}
            </div>
          </Field>
        </div>
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.inkSoft, marginBottom: 6 }}>Ngày lễ / nghỉ công ty</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            {draft.holidays.sort().map((h) => <span key={h} style={{ background: COLORS.bg, border: `1px solid ${COLORS.line}`, borderRadius: 999, padding: "3px 6px 3px 10px", fontSize: 12 }}>{fmt(h)} <button onClick={() => setDraft({ ...draft, holidays: draft.holidays.filter((x) => x !== h) })} style={{ border: "none", background: "transparent", cursor: "pointer", color: COLORS.red }}>×</button></span>)}
            <Input type="date" value={holiday} onChange={(e) => setHoliday(e.target.value)} style={{ width: 150, padding: "5px 8px" }} />
            <Button small variant="subtle" onClick={() => { if (holiday && !draft.holidays.includes(holiday)) setDraft({ ...draft, holidays: [...draft.holidays, holiday] }); setHoliday(""); }}>Thêm ngày</Button>
          </div>
        </div>
      </Panel>

      <Panel title="Công đoạn, lead time và thứ tự">
        <div style={{ fontSize: 12, color: COLORS.inkSoft, marginBottom: 10, lineHeight: 1.6 }}>
          Bấm vào bước ở cột “Phải xong trước” để bật/tắt. <b>x</b> = phải xong trước; <b>d</b> = dự phòng, chỉ dùng khi mọi bước x của mẫu là N/A. Chỉ chọn được bước đứng trước. Riêng Đan dây: cột “Đan dây trên” của từng mẫu được ưu tiên hơn x/d.
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
            <thead><tr>{["#", "Tên ngắn", "Bộ phận", "Nơi làm", "Cách lập KH", "Lead (ngày LV)", "Phải xong trước (x) / dự phòng (d)"].map((h) => <th key={h} style={{ textAlign: "left", padding: "6px 8px", borderBottom: `2px solid ${COLORS.line}`, color: COLORS.inkSoft, fontWeight: 600, fontSize: 11.5 }}>{h}</th>)}</tr></thead>
            <tbody>
              {draft.steps.map((s, i) => (
                <tr key={s.code} style={{ borderBottom: `1px solid ${COLORS.line}` }}>
                  <td style={{ padding: "6px 8px" }}>{i + 1}</td>
                  <td style={{ padding: "6px 8px", minWidth: 120 }}><Input value={s.short} onChange={(e) => setStepField(s.code, { short: e.target.value })} style={cellInput} /></td>
                  <td style={{ padding: "6px 8px", minWidth: 150 }}><Input value={s.dept} onChange={(e) => setStepField(s.code, { dept: e.target.value })} style={cellInput} /></td>
                  <td style={{ padding: "6px 8px" }}><Select value={s.place} onChange={(e) => setStepField(s.code, { place: e.target.value })} style={{ ...cellInput, width: 120 }}>{PLACES.map((x) => <option key={x}>{x}</option>)}</Select></td>
                  <td style={{ padding: "6px 8px" }}>
                    {s.source === "input"
                      ? <Select value={s.planType} onChange={(e) => setStepField(s.code, { planType: e.target.value })} style={{ ...cellInput, width: 110 }}><option value="fixed">Ấn định</option><option value="lead">Lead time</option></Select>
                      : <span style={{ color: COLORS.inkSoft, fontSize: 11.5 }}>Lead time · ngày thực tế từ nhật ký test</span>}
                  </td>
                  <td style={{ padding: "6px 8px", width: 90 }}>{s.planType === "lead" ? <Input type="number" value={s.lead} onChange={(e) => setStepField(s.code, { lead: Number(e.target.value) || 0 })} style={{ ...cellInput, width: 70 }} /> : "—"}</td>
                  <td style={{ padding: "6px 8px" }}>
                    <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                      {draft.steps.slice(0, i).map((p) => {
                        const isX = (s.preds || []).includes(p.code), isD = (s.fallback || []).includes(p.code);
                        return (
                          <button key={p.code} type="button" title="Bấm: x → d → bỏ"
                            onClick={() => (isX ? togglePred(s.code, p.code, "fallback") : isD ? togglePred(s.code, p.code, "fallback") : togglePred(s.code, p.code, "preds"))}
                            style={{ border: `1px solid ${isX ? COLORS.wood : isD ? COLORS.amber : COLORS.line}`, background: isX ? COLORS.wood : isD ? COLORS.amberSoft : "#FFFFFF", color: isX ? "#FFFFFF" : isD ? COLORS.amber : COLORS.inkSoft, borderRadius: 7, padding: "2px 7px", fontSize: 11, cursor: "pointer" }}>
                            {isX ? "x " : isD ? "d " : ""}{p.short}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
