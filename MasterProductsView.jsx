/* ------------------------------------------------------------------
   Master Products (v58)
   Sample --(khách accept)--> Master Products --> Hàng mang đi test
   Mỗi master product (1 mã ERP) hiển thị toàn bộ PI / PO / LSX (mẫu, đại trà,
   thay đổi, điều chỉnh), hàng mang đi test, QA/QC và lịch sử thay đổi.
   UI atoms đến từ prop `ui` (không import tanhoa_erp.jsx → không vòng lặp).
------------------------------------------------------------------- */
import React, { useEffect, useMemo, useState } from "react";
import { Boxes, ArrowLeft, RefreshCw, Search, Image as ImageIcon, FlaskConical, ExternalLink, Plus, Layers } from "lucide-react";
import { saveMaster, saveChange, saveChanges as saveChangeRows, deleteChange, lsxForMaster, pisForMaster, firstLine } from "./masterApi";
import BulkChangeModal, { newGroupId } from "./BulkChangeModal.jsx";
import { loadTestTracking } from "./sampleTestApi";
import { computeTracking, todayIso } from "./sampleTestLogic";
import { QcProductSection } from "./QcView.jsx";
import ProductChangeHistory, { isChangeOpen } from "./ProductChangeHistory.jsx";
import PhotoProof from "./PhotoProof.jsx";
import { RowHistoryButton } from "./RowHistory.jsx";

const fmt = (d) => { if (!d) return ""; const [y, m, day] = String(d).slice(0, 10).split("-"); return day ? `${day}/${m}/${String(y).slice(2)}` : d; };
export const lsxTone = (t) => ({ "Mẫu": "teal", "Đại trà": "wood", "Thay đổi": "amber", "Điều chỉnh": "red" }[t] || "neutral");
export const piTone = (s) => ({ Draft: "neutral", Sent: "teal", Confirmed: "green", Cancelled: "red" }[s] || "neutral");

function Thumb({ src, size = 44, COLORS }) {
  return src
    ? <img src={src} alt="" style={{ width: size, height: size, objectFit: "cover", borderRadius: 8, border: `1px solid ${COLORS.line}`, display: "block" }} />
    : <div style={{ width: size, height: size, borderRadius: 8, border: `1px solid ${COLORS.line}`, background: "#F6F7F9", color: COLORS.inkSoft, display: "grid", placeItems: "center" }}><ImageIcon size={16} /></div>;
}

export function MissingSqlPanel({ ui, error, onReload }) {
  const { Panel, Button, COLORS } = ui;
  return (
    <Panel title="Cần chạy SQL v58 một lần để bật Master Products / PI">
      <div style={{ lineHeight: 1.7, fontSize: 14 }}>
        Chưa tìm thấy bảng <code>master_products</code>, <code>proforma_invoices</code> trong Supabase.<br />
        Supabase → SQL Editor → chạy lần lượt <b>v56 → v57 → tanhoa_v58_master_products_pi.sql</b>, rồi bấm <b>Tải lại</b>.
        Mã đã Approved trong Sample sẽ tự chuyển sang Master Products. Các module khác không bị ảnh hưởng.
        <div style={{ marginTop: 10 }}><Button small variant="ghost" onClick={onReload}><RefreshCw size={14} /> Tải lại</Button></div>
        {error && <div style={{ marginTop: 10, color: COLORS.inkSoft, fontSize: 12 }}>Chi tiết lỗi: {error}</div>}
      </div>
    </Panel>
  );
}

export default function MasterProductsView({
  ui, master, setMaster, reloadMaster, samples = [], manufacturingOrders = [], moProductLines = [], customers = [], customerName,
  currentUser, canEdit = true, sampleStages = [], onOpenSample, onNewTest, onOpenPi, onGoto, focusId, onFocusUsed,
}) {
  const { Panel, Badge, Input, Select, Button, COLORS, FONT_HEAD } = ui;
  const [query, setQuery] = useState("");
  const [customerFilter, setCustomerFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("Active");
  const [openId, setOpenId] = useState("");
  const [tt, setTt] = useState({ available: false, trackings: [], steps: [], parts: [], tests: [], settings: null });
  const [bulkOpen, setBulkOpen] = useState(false);
  // v59: one customer change for many master products (each gets its own row, same group id)
  const saveBulkChange = async (rec, ids) => {
    const groupId = newGroupId();
    const list = ids.map((id, i) => ({ ...rec, id: `MPC-${groupId}-${i}`, masterProductId: id, groupId }));
    try { await saveChangeRows(list); }
    catch (e) { alert("Ghi thay đổi hàng loạt thất bại: " + (e?.message || e)); return false; }
    setMaster((x) => ({ ...x, changes: [...x.changes, ...list] }));
    return true;
  };
  const bulkModal = bulkOpen && (
    <BulkChangeModal ui={ui} title="Ghi thay đổi hàng loạt — Master Products" tagLabel="Lọc theo LSX" folder="changes/master-bulk"
      items={master.masterProducts.filter((m) => m.status === "Active").map((m) => ({ id: m.id, erp: m.erpNo, title: m.description || firstLine(m.name), sub: customerName(m.customerId),
        tags: lsxForMaster(m, { samples, mos: manufacturingOrders, moLines: moProductLines }).map((x) => x.moNo) }))}
      onSave={saveBulkChange} onClose={() => setBulkOpen(false)} />
  );

  useEffect(() => { if (focusId) { setOpenId(focusId); onFocusUsed?.(); } }, [focusId]);
  useEffect(() => { loadTestTracking().then((d) => d.available && setTt(d)).catch(() => {}); }, []);

  const ctx = { samples, mos: manufacturingOrders, moLines: moProductLines, pis: master.pis, piLines: master.piLines };
  const rows = useMemo(() => master.masterProducts.map((m) => {
    const lsx = lsxForMaster(m, ctx);
    const pi = pisForMaster(m, ctx);
    const pos = new Set(pi.map((x) => x.pi.poNo).filter(Boolean));
    const tests = tt.trackings.filter((t) => t.masterProductId === m.id || (!t.masterProductId && m.erpNo && String(t.erpNo || "").trim() === m.erpNo));
    const openChanges = master.changes.filter((c) => c.masterProductId === m.id && isChangeOpen(c)).length;
    return { m, lsx, pi, poCount: pos.size, tests, openChanges };
  }), [master, samples, manufacturingOrders, moProductLines, tt.trackings]);

  const q = query.trim().toLowerCase();
  const list = rows.filter(({ m }) => (!customerFilter || m.customerId === customerFilter) && (!statusFilter || m.status === statusFilter)
    && (!q || [m.erpNo, m.name, m.description, m.id, customerName(m.customerId)].join(" ").toLowerCase().includes(q)))
    .sort((a, b) => String(a.m.erpNo || "~").localeCompare(String(b.m.erpNo || "~")));
  const open = rows.find((r) => r.m.id === openId);

  const header = (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
        <div style={{ width: 46, height: 46, borderRadius: 15, background: "#EEF1F4", color: COLORS.woodDark, display: "grid", placeItems: "center", border: `1px solid ${COLORS.wood}66` }}><Boxes size={22} /></div>
        <div>
          <h1 style={{ fontFamily: FONT_HEAD, fontSize: 26, margin: 0 }}>Master Products</h1>
          <div style={{ marginTop: 4, color: COLORS.inkSoft, fontSize: 13 }}>Sản phẩm khách đã accept · mỗi mã gom toàn bộ PI / PO / LSX / hàng mang đi test / QA-QC / thay đổi</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {canEdit && master.available && <Button variant="subtle" small onClick={() => setBulkOpen(true)}><Layers size={14} /> Ghi thay đổi hàng loạt</Button>}
        <Button variant="ghost" small onClick={reloadMaster}><RefreshCw size={14} /> Tải lại</Button>
      </div>
    </div>
  );

  if (master.loading) return <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>{header}<Panel><div style={{ color: COLORS.inkSoft }}>Đang tải…</div></Panel></div>;
  if (!master.available) return <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>{header}<MissingSqlPanel ui={ui} error={master.error} onReload={reloadMaster} /></div>;

  if (open) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {header}
        {bulkModal}
        <MasterDetail ui={ui} row={open} master={master} setMaster={setMaster} tt={tt} samples={samples} customers={customers} customerName={customerName}
          currentUser={currentUser} canEdit={canEdit} sampleStages={sampleStages} onBack={() => setOpenId("")}
          onOpenSample={onOpenSample} onNewTest={onNewTest} onOpenPi={onOpenPi} onGoto={onGoto} />
      </div>
    );
  }

  const th = { textAlign: "left", padding: "8px 10px", fontSize: 11.5, color: COLORS.inkSoft, fontWeight: 700, borderBottom: `1px solid ${COLORS.line}`, whiteSpace: "nowrap" };
  const td = { padding: "8px 10px", borderBottom: `1px solid ${COLORS.line}`, fontSize: 13, verticalAlign: "middle" };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {header}
      {bulkModal}
      <Panel>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12, alignItems: "center" }}>
          <div style={{ position: "relative", flex: "1 1 260px" }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: 11, color: COLORS.inkSoft }} />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm mã ERP, mô tả, khách…" style={{ paddingLeft: 30 }} />
          </div>
          <Select value={customerFilter} onChange={(e) => setCustomerFilter(e.target.value)} style={{ maxWidth: 220 }}>
            <option value="">Tất cả khách</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ maxWidth: 160 }}>
            <option value="">Mọi trạng thái</option><option value="Active">Active</option><option value="Ngừng">Ngừng</option>
          </Select>
          <span style={{ fontSize: 12.5, color: COLORS.inkSoft }}>{list.length} / {rows.length} mã</span>
        </div>
        {!rows.length ? (
          <div style={{ color: COLORS.inkSoft, fontSize: 13.5, lineHeight: 1.6 }}>Chưa có Master Product. Vào <b>Sample</b> → mở mẫu khách đã accept → bấm <b>Chuyển sang Master Products</b>.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>
                <th style={th}></th><th style={th}>Mã ERP</th><th style={th}>Mô tả</th><th style={th}>Khách</th>
                <th style={th}>PI</th><th style={th}>PO</th><th style={th}>LSX</th><th style={th}>Mang đi test</th><th style={th}>Thay đổi chưa xử lý</th><th style={th}>Trạng thái</th><th style={th}></th>
              </tr></thead>
              <tbody>
                {list.map(({ m, lsx, pi, poCount, tests, openChanges }) => (
                  <tr key={m.id} onClick={() => setOpenId(m.id)} style={{ cursor: "pointer" }}>
                    <td style={{ ...td, width: 52 }}><Thumb src={m.imageUrl} COLORS={COLORS} /></td>
                    <td style={{ ...td, fontWeight: 700, whiteSpace: "nowrap" }}>{m.erpNo || <span style={{ color: COLORS.amber }}>(chưa có mã)</span>}</td>
                    <td style={{ ...td, maxWidth: 360 }}>{m.description || firstLine(m.name)}</td>
                    <td style={td}>{customerName(m.customerId)}</td>
                    <td style={td}>{new Set(pi.map((x) => x.pi.id)).size || "—"}</td>
                    <td style={td}>{poCount || "—"}</td>
                    <td style={td}>{lsx.length ? <span title={lsx.map((x) => `${x.type}: ${x.moNo}`).join("\n")}>{lsx.length}</span> : "—"}</td>
                    <td style={td}>{tests.length || "—"}</td>
                    <td style={td}>{openChanges ? <Badge tone="amber">{openChanges}</Badge> : "—"}</td>
                    <td style={td}><Badge tone={m.status === "Active" ? "green" : "neutral"}>{m.status}</Badge></td>
                    <td style={td}><RowHistoryButton table="master_products" rowId={m.id} title={`${m.erpNo || m.id} · ${m.description || ""}`} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}

/* ================= Detail ================= */
const SPEC_FIELDS = [
  ["Kích thước W×D×H (mm)", (s) => [s.width, s.depth, s.height].some((v) => v !== null && v !== undefined && v !== "") ? `${s.width ?? "—"} × ${s.depth ?? "—"} × ${s.height ?? "—"}` : ""],
  ["Cao tay / cao ngồi", (s) => [s.arm_height, s.seat_height].some(Boolean) ? `${s.arm_height ?? "—"} / ${s.seat_height ?? "—"}` : ""],
  ["Kim loại", (s) => [s.metal_name, s.metal_color].filter(Boolean).join(" · ")],
  ["Dây đan", (s) => (s.rope_diameter ? `Ø${s.rope_diameter}` : "")],
  ["Hardware", (s) => s.hardware || ""],
  ["Kết cấu", (s) => s.construction || ""],
  ["Carton L×W×H", (s) => [s.carton_length, s.carton_width, s.carton_height].some(Boolean) ? `${s.carton_length ?? "—"} × ${s.carton_width ?? "—"} × ${s.carton_height ?? "—"}` : ""],
  ["NW / GW · pcs/ctn · CBM", (s) => [s.net_weight, s.gross_weight, s.pcs_per_ctn, s.cbm].some(Boolean) ? `${s.net_weight ?? "—"} / ${s.gross_weight ?? "—"} · ${s.pcs_per_ctn ?? "—"} · ${s.cbm ?? "—"}` : ""],
  ["Revision lúc accept", (s) => s.current_revision || ""],
];

function MasterDetail({ ui, row, master, setMaster, tt, samples, customers, customerName, currentUser, canEdit, sampleStages, onBack, onOpenSample, onNewTest, onOpenPi, onGoto }) {
  const { Panel, Badge, Field, Input, Select, TextArea, Button, COLORS } = ui;
  const { m, lsx, pi, tests } = row;
  const [draft, setDraft] = useState(m);
  useEffect(() => setDraft(m), [m.id]);
  const dirty = JSON.stringify(draft) !== JSON.stringify(m);
  const sourceSample = samples.find((s) => s.id === m.sourceSampleId);
  const changes = master.changes.filter((c) => c.masterProductId === m.id);

  const persist = (next) => {
    setMaster((x) => ({ ...x, masterProducts: x.masterProducts.map((p) => (p.id === next.id ? next : p)) }));
    saveMaster(next).catch((e) => alert("Lưu Master Product thất bại: " + (e?.message || e)));
  };
  const saveChanges = (nextList) => {
    const prev = new Map(changes.map((c) => [c.id, c]));
    const next = nextList.map((c) => ({ ...c, masterProductId: m.id }));
    const nextIds = new Set(next.map((c) => c.id));
    setMaster((x) => ({ ...x, changes: [...x.changes.filter((c) => c.masterProductId !== m.id), ...next] }));
    const jobs = [];
    for (const c of next) if (JSON.stringify(prev.get(c.id)) !== JSON.stringify(c)) jobs.push(saveChange(c));
    for (const id of prev.keys()) if (!nextIds.has(id)) jobs.push(deleteChange(id));
    Promise.all(jobs).catch((e) => alert("Lưu lịch sử thay đổi thất bại: " + (e?.message || e)));
  };

  const th = { textAlign: "left", padding: "7px 9px", fontSize: 11.5, color: COLORS.inkSoft, fontWeight: 700, borderBottom: `1px solid ${COLORS.line}`, whiteSpace: "nowrap" };
  const td = { padding: "7px 9px", borderBottom: `1px solid ${COLORS.line}`, fontSize: 12.5, verticalAlign: "top" };
  const qcSample = { id: m.sourceSampleId || m.id, erpNo: m.erpNo, name: m.description || m.name, customerId: m.customerId, stage: "" };
  const changeHolder = { id: m.id, revisions: changes };
  const today = todayIso();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div><Button small variant="ghost" onClick={onBack}><ArrowLeft size={14} /> Danh sách</Button></div>

      <Panel>
        <div style={{ display: "grid", gridTemplateColumns: "140px minmax(0,1fr)", gap: 18 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <Thumb src={draft.imageUrl} size={140} COLORS={COLORS} />
            {canEdit && <PhotoProof images={draft.imageUrl ? [draft.imageUrl] : []} max={1} size={28} label="Đổi ảnh" folder={`master-products/${m.id}`} prefix="product" onChange={(imgs) => setDraft({ ...draft, imageUrl: imgs[0] || "" })} />}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 21, fontWeight: 800 }}>{m.erpNo || "(chưa có mã ERP)"}</div>
                <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <Badge tone={m.status === "Active" ? "green" : "neutral"}>{m.status}</Badge>
                  {m.acceptedDate && <Badge tone="teal">Khách accept {fmt(m.acceptedDate)}</Badge>}
                  <Badge>{pi.length} dòng PI · {row.poCount} PO · {lsx.length} LSX · {tests.length} lượt test</Badge>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-start" }}>
                <RowHistoryButton table="master_products" rowId={m.id} title={`${m.erpNo || m.id} · ${m.description || ""}`} label="Lịch sử" />
                {sourceSample && <Button small variant="subtle" onClick={() => onOpenSample?.(sourceSample.id)}><ExternalLink size={13} /> Sample gốc {sourceSample.id}</Button>}
                {canEdit && dirty && <Button small onClick={() => persist(draft)}>Lưu thông tin</Button>}
                {canEdit && dirty && <Button small variant="ghost" onClick={() => setDraft(m)}>Huỷ sửa</Button>}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr) 140px", gap: 10 }}>
              <Field label="Mã ERP"><Input value={draft.erpNo} disabled={!canEdit} onChange={(e) => setDraft({ ...draft, erpNo: e.target.value })} /></Field>
              <Field label="Khách hàng">
                <Select value={draft.customerId} disabled={!canEdit} onChange={(e) => setDraft({ ...draft, customerId: e.target.value })}>
                  <option value="">—</option>
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
              </Field>
              <Field label="Trạng thái">
                <Select value={draft.status} disabled={!canEdit} onChange={(e) => setDraft({ ...draft, status: e.target.value })}><option>Active</option><option>Ngừng</option></Select>
              </Field>
            </div>
            <Field label="Product Description (mô tả ngắn)"><Input value={draft.description} disabled={!canEdit} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></Field>
            <Field label="Ghi chú"><TextArea rows={2} value={draft.notes} disabled={!canEdit} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} /></Field>
          </div>
        </div>
      </Panel>

      <Panel title="Thông số lúc khách accept (chụp từ Sample)">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "8px 18px", fontSize: 13 }}>
          {SPEC_FIELDS.map(([label, get]) => { const v = get(m.specs || {}); return v ? <div key={label}><div style={{ fontSize: 11.5, color: COLORS.inkSoft }}>{label}</div><div style={{ fontWeight: 600, whiteSpace: "pre-wrap" }}>{v}</div></div> : null; })}
          {m.name && <div style={{ gridColumn: "1 / -1" }}><div style={{ fontSize: 11.5, color: COLORS.inkSoft }}>Tên đầy đủ</div><div style={{ whiteSpace: "pre-wrap" }}>{m.name}</div></div>}
        </div>
      </Panel>

      <Panel title={`PI / PO (${pi.length})`} action={onGoto && <Button small variant="subtle" onClick={() => onGoto("pi")}><Plus size={13} /> Tạo PI</Button>}>
        {!pi.length ? <div style={{ color: COLORS.inkSoft, fontSize: 13 }}>Chưa có PI nào chứa mã này. Tạo ở module <b>PI</b>.</div> : (
          <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><th style={th}>Số PI</th><th style={th}>Ngày PI</th><th style={th}>Trạng thái</th><th style={th}>Số PO</th><th style={th}>Ngày PO</th><th style={th}>SL</th><th style={th}>Đơn giá</th><th style={th}>Ngày ship</th><th style={th}>LSX từ PI</th></tr></thead>
            <tbody>{pi.map(({ pi: p, line }) => {
              const mos = lsx.filter((x) => x.kind === "mo" && x.piId === p.id);
              return (
                <tr key={line.id} onClick={() => onOpenPi?.(p.id)} style={{ cursor: onOpenPi ? "pointer" : "default" }}>
                  <td style={{ ...td, fontWeight: 700 }}>{p.piNo}</td><td style={td}>{fmt(p.piDate)}</td><td style={td}><Badge tone={piTone(p.status)}>{p.status}</Badge></td>
                  <td style={{ ...td, fontWeight: 600 }}>{p.poNo || <span style={{ color: COLORS.inkSoft }}>chưa có</span>}</td><td style={td}>{fmt(p.poDate)}</td>
                  <td style={td}>{line.qty}</td><td style={td}>{line.unitPrice !== "" ? `${line.unitPrice} ${p.currency}` : ""}</td><td style={td}>{fmt(p.shipDate)}</td>
                  <td style={td}>{mos.map((x) => x.moNo).join(", ") || "—"}</td>
                </tr>
              );
            })}</tbody>
          </table></div>
        )}
      </Panel>

      <Panel title={`Lệnh sản xuất — LSX (${lsx.length})`} action={onGoto && <Button small variant="subtle" onClick={() => onGoto("manufacturingOrders")}><Plus size={13} /> Tạo LSX</Button>}>
        {!lsx.length ? <div style={{ color: COLORS.inkSoft, fontSize: 13 }}>Chưa có LSX. LSX mẫu lấy từ Sample; LSX đại trà / thay đổi / điều chỉnh tạo ở <b>Manufacturing Orders</b>.</div> : (
          <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><th style={th}>Loại</th><th style={th}>Số LSX</th><th style={th}>Ngày thực hiện</th><th style={th}>Mô tả</th><th style={th}>PO / PI</th><th style={th}>SL</th><th style={th}>Trạng thái</th><th style={th}>Ship dự kiến</th></tr></thead>
            <tbody>{lsx.map((x) => {
              const p = x.piId ? master.pis.find((pp) => pp.id === x.piId) : null;
              return (
                <tr key={x.key}>
                  <td style={td}><Badge tone={lsxTone(x.type)}>{x.type}</Badge></td>
                  <td style={{ ...td, fontWeight: 700, whiteSpace: "nowrap" }}>{x.moNo}</td>
                  <td style={{ ...td, whiteSpace: "nowrap" }}>{fmt(x.date) || <span style={{ color: COLORS.amber }}>chưa nhập</span>}</td>
                  <td style={{ ...td, maxWidth: 380, whiteSpace: "pre-wrap" }}>{x.description || "—"}</td>
                  <td style={td}>{[x.poReference, p?.piNo].filter(Boolean).join(" / ") || "—"}</td>
                  <td style={td}>{x.qty || "—"}</td>
                  <td style={td}>{x.status || "—"}</td>
                  <td style={td}>{fmt(x.plannedShipDate)}</td>
                </tr>
              );
            })}</tbody>
          </table></div>
        )}
      </Panel>

      <Panel title={`Hàng mang đi test (${tests.length})`} action={canEdit && onNewTest && <Button small onClick={() => onNewTest(m.id)}><FlaskConical size={13} /> Mang đi test</Button>}>
        {!tests.length ? <div style={{ color: COLORS.inkSoft, fontSize: 13 }}>Chưa có lượt mang đi test. Bấm <b>Mang đi test</b> → chọn LSX đại trà mà mẫu được lấy ra.</div> : (
          <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><th style={th}>LSX</th><th style={th}>Bắt đầu</th><th style={th}>Hạn đi test</th><th style={th}>Tình trạng</th><th style={th}>Kết quả test gần nhất</th><th style={th}>Phụ trách</th></tr></thead>
            <tbody>{tests.map((t) => {
              let status = t.status;
              try {
                if (tt.settings) status = computeTracking({ tracking: t, stepRows: tt.steps.filter((r) => r.trackingId === t.id), parts: tt.parts.filter((p) => p.trackingId === t.id), tests: tt.tests.filter((x) => x.trackingId === t.id), settings: tt.settings, today }).status;
              } catch (_) { /* keep raw status */ }
              const last = tt.tests.filter((x) => x.trackingId === t.id).sort((a, b) => String(b.resultDate || b.sentDate || "").localeCompare(String(a.resultDate || a.sentDate || "")))[0];
              return (
                <tr key={t.id} onClick={() => onGoto?.("sampleTests")} style={{ cursor: onGoto ? "pointer" : "default" }}>
                  <td style={{ ...td, fontWeight: 700 }}>{t.lsxNo || "—"}</td><td style={td}>{fmt(t.startDate)}</td><td style={td}>{fmt(t.testDeadline)}</td>
                  <td style={td}><Badge tone={/Trễ|Fail/.test(status) ? "red" : /Hoàn|Đúng/.test(status) ? "green" : /Sắp|Đến hạn|Thiếu|Chưa/.test(status) ? "amber" : "neutral"}>{status}</Badge></td>
                  <td style={td}>{last ? <Badge tone={last.result === "Đạt" ? "green" : last.result === "Không đạt" ? "red" : "amber"}>{last.testType} · {last.result}</Badge> : "—"}</td>
                  <td style={td}>{t.owner || "—"}</td>
                </tr>
              );
            })}</tbody>
          </table></div>
        )}
      </Panel>

      <Panel>
        <QcProductSection ui={ui} sample={qcSample} customerName={customerName} currentUser={currentUser} canEdit={canEdit} sampleStages={sampleStages} />
        <ProductChangeHistory ui={ui} sample={changeHolder} canEdit={canEdit} onSaveSample={(x) => saveChanges(x.revisions || [])}
          groupCount={(g) => master.changes.filter((c) => c.groupId === g).length}
          onGroupStatus={(g, status, date) => {
            const upd = master.changes.filter((c) => c.groupId === g).map((c) => ({ ...c, status, processedDate: status === "Đã xử lý" ? (c.processedDate || date) : "" }));
            setMaster((x) => ({ ...x, changes: x.changes.map((c) => upd.find((u) => u.id === c.id) || c) }));
            saveChangeRows(upd).catch((e) => alert("Cập nhật trạng thái cả nhóm thất bại: " + (e?.message || e)));
          }} />
      </Panel>
    </div>
  );
}
