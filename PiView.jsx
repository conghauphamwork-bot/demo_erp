/* ------------------------------------------------------------------
   PI — Proforma Invoice (v58)
   PI gồm nhiều dòng sản phẩm lấy từ Master Products. Sau khi khách confirm PI
   sẽ gửi PO → nhập Số PO / Ngày PO trên PI. LSX (Manufacturing Orders) liên kết
   ngược về PI, nên Master Products thấy đủ chuỗi PI → PO → LSX.
------------------------------------------------------------------- */
import React, { useEffect, useMemo, useState } from "react";
import { FileText, Plus, X, ArrowLeft, RefreshCw, Search, Trash2 } from "lucide-react";
import { PI_STATUSES, savePi, deletePi, savePiLines, deletePiLine, firstLine, todayStr, piTotals } from "./masterApi";
import { MissingSqlPanel, piTone, lsxTone } from "./MasterProductsView.jsx";

const fmt = (d) => { if (!d) return ""; const [y, m, day] = String(d).slice(0, 10).split("-"); return day ? `${day}/${m}/${String(y).slice(2)}` : d; };
const uid = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `pi-${Date.now()}-${Math.random().toString(16).slice(2)}`);
const n = (v) => (v === "" || v === null || v === undefined ? 0 : Number(v) || 0);
const money = (v) => Number(v || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });

export default function PiView({ ui, master, setMaster, reloadMaster, manufacturingOrders = [], customers = [], customerName, canEdit = true, canDelete = true, onOpenMaster, focusId, onFocusUsed }) {
  const { Panel, Badge, Input, Select, Button, COLORS, FONT_HEAD } = ui;
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [editing, setEditing] = useState(null); // { pi, lines, isNew }
  useEffect(() => {
    if (!focusId) return;
    const p = master.pis.find((x) => x.id === focusId);
    if (p) setEditing({ pi: { ...p }, lines: master.piLines.filter((l) => l.piId === p.id).sort((a, b) => a.sortOrder - b.sortOrder), isNew: false });
    onFocusUsed?.();
  }, [focusId, master.pis.length]);

  const rows = useMemo(() => master.pis.map((p) => {
    const lines = master.piLines.filter((l) => l.piId === p.id);
    const mos = manufacturingOrders.filter((m) => m.piId === p.id);
    return { p, lines, mos, ...piTotals(lines) };
  }), [master, manufacturingOrders]);
  const q = query.trim().toLowerCase();
  const mpById = new Map(master.masterProducts.map((m) => [m.id, m]));
  const list = rows.filter(({ p, lines }) => (!statusFilter || p.status === statusFilter)
    && (!q || [p.piNo, p.poNo, customerName(p.customerId), ...lines.map((l) => mpById.get(l.masterProductId)?.erpNo)].join(" ").toLowerCase().includes(q)))
    .sort((a, b) => String(b.p.piDate || "").localeCompare(String(a.p.piDate || "")));

  const header = (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
        <div style={{ width: 46, height: 46, borderRadius: 15, background: "#EEF1F4", color: COLORS.woodDark, display: "grid", placeItems: "center", border: `1px solid ${COLORS.wood}66` }}><FileText size={22} /></div>
        <div>
          <h1 style={{ fontFamily: FONT_HEAD, fontSize: 26, margin: 0 }}>PI — Proforma Invoice</h1>
          <div style={{ marginTop: 4, color: COLORS.inkSoft, fontSize: 13 }}>Dòng hàng lấy từ Master Products · khách confirm PI → nhập Số PO · LSX liên kết về PI</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <Button variant="ghost" small onClick={reloadMaster}><RefreshCw size={14} /> Tải lại</Button>
        {canEdit && master.available && !editing && <Button onClick={() => setEditing({ pi: { id: uid(), piNo: "", customerId: customers[0]?.id || "", piDate: todayStr(), status: "Draft", poNo: "", poDate: "", shipDate: "", currency: "USD", notes: "" }, lines: [], isNew: true })}><Plus size={15} /> PI mới</Button>}
      </div>
    </div>
  );

  if (master.loading) return <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>{header}<Panel><div style={{ color: COLORS.inkSoft }}>Đang tải…</div></Panel></div>;
  if (!master.available) return <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>{header}<MissingSqlPanel ui={ui} error={master.error} onReload={reloadMaster} /></div>;

  if (editing) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {header}
        <PiForm ui={ui} key={editing.pi.id} initial={editing} master={master} setMaster={setMaster} customers={customers} customerName={customerName}
          mos={manufacturingOrders.filter((m) => m.piId === editing.pi.id)} canEdit={canEdit} canDelete={canDelete} onOpenMaster={onOpenMaster}
          onClose={() => setEditing(null)} />
      </div>
    );
  }

  const th = { textAlign: "left", padding: "8px 10px", fontSize: 11.5, color: COLORS.inkSoft, fontWeight: 700, borderBottom: `1px solid ${COLORS.line}`, whiteSpace: "nowrap" };
  const td = { padding: "8px 10px", borderBottom: `1px solid ${COLORS.line}`, fontSize: 13 };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {header}
      <Panel>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12, alignItems: "center" }}>
          <div style={{ position: "relative", flex: "1 1 260px" }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: 11, color: COLORS.inkSoft }} />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm số PI, số PO, khách, mã ERP…" style={{ paddingLeft: 30 }} />
          </div>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ maxWidth: 180 }}>
            <option value="">Mọi trạng thái</option>
            {PI_STATUSES.map((s) => <option key={s}>{s}</option>)}
          </Select>
          <span style={{ fontSize: 12.5, color: COLORS.inkSoft }}>{rows.filter((r) => r.p.status === "Confirmed" && !r.p.poNo).length ? <Badge tone="amber">{rows.filter((r) => r.p.status === "Confirmed" && !r.p.poNo).length} PI đã confirm chưa có PO</Badge> : null}</span>
        </div>
        {!rows.length ? <div style={{ color: COLORS.inkSoft, fontSize: 13.5 }}>Chưa có PI. Bấm <b>PI mới</b>.</div> : (
          <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><th style={th}>Số PI</th><th style={th}>Khách</th><th style={th}>Ngày PI</th><th style={th}>Trạng thái</th><th style={th}>Số PO</th><th style={th}>Ngày PO</th><th style={th}>Ngày ship</th><th style={th}>Mã</th><th style={th}>Tổng SL</th><th style={th}>Tổng tiền</th><th style={th}>LSX</th></tr></thead>
            <tbody>{list.map(({ p, lines, mos, qty, amount }) => (
              <tr key={p.id} style={{ cursor: "pointer" }} onClick={() => setEditing({ pi: { ...p }, lines: lines.slice().sort((a, b) => a.sortOrder - b.sortOrder), isNew: false })}>
                <td style={{ ...td, fontWeight: 700 }}>{p.piNo}</td><td style={td}>{customerName(p.customerId)}</td><td style={td}>{fmt(p.piDate)}</td>
                <td style={td}><Badge tone={piTone(p.status)}>{p.status}</Badge></td>
                <td style={{ ...td, fontWeight: 600 }}>{p.poNo || (p.status === "Confirmed" ? <span style={{ color: COLORS.amber }}>chờ PO</span> : "—")}</td>
                <td style={td}>{fmt(p.poDate)}</td><td style={td}>{fmt(p.shipDate)}</td>
                <td style={td}>{lines.length}</td><td style={td}>{money(qty)}</td><td style={td}>{money(amount)} {p.currency}</td>
                <td style={td}>{mos.map((m) => m.moNo).join(", ") || "—"}</td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </Panel>
    </div>
  );
}

function PiForm({ ui, initial, master, setMaster, customers, customerName, mos, canEdit, canDelete, onOpenMaster, onClose }) {
  const { Panel, Badge, Field, Input, Select, TextArea, Button, COLORS } = ui;
  const [pi, setPi] = useState(initial.pi);
  const [lines, setLines] = useState(initial.lines);
  const [pick, setPick] = useState("");
  const [onlyCustomer, setOnlyCustomer] = useState(true);
  const [saving, setSaving] = useState(false);
  const ro = !canEdit;
  const mpById = new Map(master.masterProducts.map((m) => [m.id, m]));
  const options = master.masterProducts.filter((m) => m.status === "Active" && (!onlyCustomer || !pi.customerId || m.customerId === pi.customerId))
    .sort((a, b) => String(a.erpNo).localeCompare(String(b.erpNo)));
  const totals = piTotals(lines);

  const addLine = () => {
    const m = mpById.get(pick);
    if (!m) return;
    setLines([...lines, { id: uid(), piId: pi.id, masterProductId: m.id, qty: "", unitPrice: "", description: m.description || firstLine(m.name), sortOrder: lines.length }]);
    setPick("");
  };
  const patchLine = (id, patch) => setLines(lines.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  const setPo = (poNo) => setPi((p) => ({ ...p, poNo, status: poNo && (p.status === "Draft" || p.status === "Sent") ? "Confirmed" : p.status, poDate: poNo && !p.poDate ? todayStr() : p.poDate }));

  const save = async () => {
    if (!pi.piNo.trim()) { alert("Nhập Số PI."); return; }
    if (master.pis.some((x) => x.id !== pi.id && x.piNo.trim().toLowerCase() === pi.piNo.trim().toLowerCase()) && !confirm(`Đã có PI số ${pi.piNo}. Vẫn lưu?`)) return;
    if (lines.some((l) => !l.masterProductId)) { alert("Có dòng chưa chọn sản phẩm."); return; }
    const nextPi = { ...pi, piNo: pi.piNo.trim() };
    const nextLines = lines.map((l, i) => ({ ...l, piId: pi.id, sortOrder: i }));
    const prevIds = new Set(master.piLines.filter((l) => l.piId === pi.id).map((l) => l.id));
    const removed = [...prevIds].filter((id) => !nextLines.some((l) => l.id === id));
    setSaving(true);
    try {
      await savePi(nextPi);              // header first: lines reference it (FK)
      await savePiLines(nextLines);
      for (const id of removed) await deletePiLine(id);
      setMaster((x) => ({
        ...x,
        pis: x.pis.some((p) => p.id === nextPi.id) ? x.pis.map((p) => (p.id === nextPi.id ? nextPi : p)) : [...x.pis, nextPi],
        piLines: [...x.piLines.filter((l) => l.piId !== nextPi.id), ...nextLines],
      }));
      onClose();
    } catch (e) {
      alert("Lưu PI thất bại: " + (e?.message || e));
    } finally { setSaving(false); }
  };
  const remove = async () => {
    if (mos.length) { alert(`PI đang được dùng bởi LSX ${mos.map((m) => m.moNo).join(", ")}. Bỏ liên kết trong Manufacturing Orders trước.`); return; }
    if (!confirm(`Xoá PI ${pi.piNo}? Các dòng sản phẩm của PI cũng bị xoá.`)) return;
    try {
      await deletePi(pi.id);
      setMaster((x) => ({ ...x, pis: x.pis.filter((p) => p.id !== pi.id), piLines: x.piLines.filter((l) => l.piId !== pi.id) }));
      onClose();
    } catch (e) { alert("Xoá PI thất bại: " + (e?.message || e)); }
  };

  const th = { textAlign: "left", padding: "7px 8px", fontSize: 11.5, color: COLORS.inkSoft, fontWeight: 700, borderBottom: `1px solid ${COLORS.line}` };
  const td = { padding: "6px 8px", borderBottom: `1px solid ${COLORS.line}`, fontSize: 12.5, verticalAlign: "middle" };
  const cell = { padding: "5px 7px", fontSize: 12.5 };
  return (
    <Panel title={initial.isNew ? "PI mới" : `PI ${initial.pi.piNo}`} action={<Button small variant="ghost" onClick={onClose}><ArrowLeft size={14} /> Danh sách</Button>}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 12 }}>
          <Field label="Số PI *"><Input value={pi.piNo} disabled={ro} onChange={(e) => setPi({ ...pi, piNo: e.target.value })} placeholder="PI-SKL-2026-015" /></Field>
          <Field label="Khách hàng">
            <Select value={pi.customerId} disabled={ro} onChange={(e) => setPi({ ...pi, customerId: e.target.value })}>
              <option value="">—</option>{customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
          <Field label="Ngày PI"><Input type="date" value={pi.piDate} disabled={ro} onChange={(e) => setPi({ ...pi, piDate: e.target.value })} /></Field>
          <Field label="Trạng thái">
            <Select value={pi.status} disabled={ro} onChange={(e) => setPi({ ...pi, status: e.target.value })}>{PI_STATUSES.map((s) => <option key={s}>{s}</option>)}</Select>
          </Field>
          <Field label="Số PO (khách gửi sau khi confirm)"><Input value={pi.poNo} disabled={ro} onChange={(e) => setPo(e.target.value)} placeholder="Nhập khi có PO" /></Field>
          <Field label="Ngày PO"><Input type="date" value={pi.poDate} disabled={ro} onChange={(e) => setPi({ ...pi, poDate: e.target.value })} /></Field>
          <Field label="Ngày ship"><Input type="date" value={pi.shipDate} disabled={ro} onChange={(e) => setPi({ ...pi, shipDate: e.target.value })} /></Field>
          <Field label="Tiền tệ">
            <Select value={pi.currency} disabled={ro} onChange={(e) => setPi({ ...pi, currency: e.target.value })}>{["USD", "EUR", "VND"].map((c) => <option key={c}>{c}</option>)}</Select>
          </Field>
        </div>
        <Field label="Ghi chú"><TextArea rows={2} value={pi.notes} disabled={ro} onChange={(e) => setPi({ ...pi, notes: e.target.value })} /></Field>

        <div>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Sản phẩm trong PI ({lines.length})</div>
          {canEdit && (
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 8 }}>
              <Select value={pick} onChange={(e) => setPick(e.target.value)} style={{ flex: "1 1 360px" }}>
                <option value="">— Chọn từ Master Products —</option>
                {options.map((m) => <option key={m.id} value={m.id}>{m.erpNo || "(no ERP)"} — {m.description || firstLine(m.name)}</option>)}
              </Select>
              <label style={{ fontSize: 12.5, display: "inline-flex", gap: 5, alignItems: "center" }}><input type="checkbox" checked={onlyCustomer} onChange={(e) => setOnlyCustomer(e.target.checked)} /> chỉ mã của khách này</label>
              <Button small onClick={addLine} disabled={!pick}><Plus size={13} /> Thêm dòng</Button>
            </div>
          )}
          {!options.length && canEdit && <div style={{ fontSize: 12.5, color: COLORS.amber, marginBottom: 8 }}>Không có Master Product nào {onlyCustomer && pi.customerId ? `của ${customerName(pi.customerId)}` : ""}. Sản phẩm phải được chuyển từ Sample sang Master trước.</div>}
          <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><th style={th}>#</th><th style={th}>Mã ERP</th><th style={th}>Mô tả</th><th style={{ ...th, width: 110 }}>SL</th><th style={{ ...th, width: 130 }}>Đơn giá</th><th style={th}>Thành tiền</th><th style={th}></th></tr></thead>
            <tbody>
              {lines.map((l, i) => {
                const m = mpById.get(l.masterProductId);
                return (
                  <tr key={l.id}>
                    <td style={td}>{i + 1}</td>
                    <td style={{ ...td, fontWeight: 700, whiteSpace: "nowrap" }}>{m ? <button type="button" onClick={() => onOpenMaster?.(m.id)} style={{ border: "none", background: "none", padding: 0, color: COLORS.wood, fontWeight: 700, cursor: onOpenMaster ? "pointer" : "default" }}>{m.erpNo || m.id}</button> : <span style={{ color: COLORS.red }}>(đã xoá)</span>}</td>
                    <td style={td}><Input value={l.description} disabled={ro} onChange={(e) => patchLine(l.id, { description: e.target.value })} style={cell} /></td>
                    <td style={td}><Input type="number" value={l.qty} disabled={ro} onChange={(e) => patchLine(l.id, { qty: e.target.value })} style={cell} /></td>
                    <td style={td}><Input type="number" value={l.unitPrice} disabled={ro} onChange={(e) => patchLine(l.id, { unitPrice: e.target.value })} style={cell} /></td>
                    <td style={{ ...td, whiteSpace: "nowrap" }}>{money(n(l.qty) * n(l.unitPrice))}</td>
                    <td style={td}>{canEdit && <button type="button" title="Xoá dòng" onClick={() => setLines(lines.filter((x) => x.id !== l.id))} style={{ border: "none", background: "none", color: COLORS.red, cursor: "pointer" }}><X size={14} /></button>}</td>
                  </tr>
                );
              })}
              <tr><td style={td} colSpan={3}><b>Tổng</b></td><td style={{ ...td, fontWeight: 700 }}>{money(totals.qty)}</td><td style={td}></td><td style={{ ...td, fontWeight: 700 }}>{money(totals.amount)} {pi.currency}</td><td style={td}></td></tr>
            </tbody>
          </table></div>
        </div>

        <div>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>LSX liên kết ({mos.length})</div>
          {!mos.length ? <div style={{ fontSize: 12.5, color: COLORS.inkSoft }}>Chưa có LSX. Trong <b>Manufacturing Orders</b>, tạo LSX → chọn “PI liên kết” = PI này (PO và khách tự điền, có nút thêm dòng từ PI).</div>
            : <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{mos.map((m) => <Badge key={m.id} tone={lsxTone(m.moType)}>{m.moType || "Đại trà"} · {m.moNo}{m.issueDate ? ` · ${fmt(m.issueDate)}` : ""}</Badge>)}</div>}
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "space-between", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 8 }}>
            {canEdit && <Button onClick={save} disabled={saving}>{saving ? "Đang lưu…" : initial.isNew ? "Tạo PI" : "Lưu PI"}</Button>}
            <Button variant="ghost" onClick={onClose}>Đóng</Button>
          </div>
          {canDelete && !initial.isNew && <Button variant="danger" onClick={remove}><Trash2 size={13} /> Xoá PI</Button>}
        </div>
      </div>
    </Panel>
  );
}
