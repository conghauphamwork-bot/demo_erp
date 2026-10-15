/* Lịch sử thay đổi từ khách hàng cho 1 sản phẩm (Products / master).
   Lưu trong bảng sample_revisions có sẵn (+ cột status, processed_date,
   requested_by từ SQL v57). Mỗi thay đổi: ngày, người/kênh yêu cầu, nội dung,
   ghi chú, ảnh, trạng thái Chưa xử lý / Đã xử lý + ngày xử lý. */
import React, { useState } from "react";
import { Plus, X, Pencil } from "lucide-react";
import PhotoProof from "./PhotoProof.jsx";

export const CHANGE_STATUSES = ["Chưa xử lý", "Đã xử lý"];
const today = () => new Date().toISOString().slice(0, 10);
const fmt = (d) => { if (!d) return ""; const [y, m, day] = String(d).slice(0, 10).split("-"); return `${day}/${m}/${String(y).slice(2)}`; };
export const isChangeOpen = (r) => (r.status || "Chưa xử lý") !== "Đã xử lý";

export default function ProductChangeHistory({ ui, sample, onSaveSample, canEdit = true, SectionHeading }) {
  const { Button, Badge, Input, Select, TextArea, Field, COLORS } = ui;
  const list = sample.revisions || [];
  const [filter, setFilter] = useState("all");
  const blank = { id: "", date: today(), requestedBy: "", changeReason: "", note: "", photo: "", status: "Chưa xử lý", processedDate: "" };
  const [form, setForm] = useState(null);
  const open = list.filter(isChangeOpen).length;
  const rows = list
    .filter((r) => filter === "all" || (filter === "open" ? isChangeOpen(r) : !isChangeOpen(r)))
    .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));

  const persist = (next) => onSaveSample({ ...sample, revisions: next });
  const submit = () => {
    if (!form.changeReason.trim()) { alert("Nhập nội dung thay đổi."); return; }
    const rec = { ...form, processedDate: form.status === "Đã xử lý" ? (form.processedDate || today()) : "" };
    if (rec.id) persist(list.map((r) => (r.id === rec.id ? rec : r)));
    else persist([{ ...rec, id: "rev" + Date.now() }, ...list]);
    setForm(null);
  };
  const toggle = (r) => {
    const done = isChangeOpen(r);
    persist(list.map((x) => (x.id === r.id ? { ...x, status: done ? "Đã xử lý" : "Chưa xử lý", processedDate: done ? today() : "" } : x)));
  };
  const remove = (r) => { if (confirm("Xoá dòng lịch sử thay đổi này?")) persist(list.filter((x) => x.id !== r.id)); };
  const Heading = SectionHeading || (({ children }) => <div style={{ fontWeight: 700 }}>{children}</div>);

  return (
    <div style={{ marginTop: 20 }}>
      <Heading>Lịch sử thay đổi từ khách hàng {list.length ? `(${list.length}${open ? ` · ${open} chưa xử lý` : ""})` : ""}</Heading>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, margin: "8px 0", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 6 }}>
          {[["all", "Tất cả"], ["open", "Chưa xử lý"], ["done", "Đã xử lý"]].map(([k, l]) => (
            <button key={k} type="button" onClick={() => setFilter(k)} style={{ border: `1px solid ${filter === k ? COLORS.wood : COLORS.line}`, background: filter === k ? COLORS.wood : "#FFFFFF", color: filter === k ? "#FFFFFF" : COLORS.ink, borderRadius: 999, padding: "4px 11px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{l}</button>
          ))}
        </div>
        {canEdit && !form && <Button small onClick={() => setForm(blank)}><Plus size={13} /> Ghi thay đổi</Button>}
      </div>

      {form && (
        <div style={{ border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 12, display: "flex", flexDirection: "column", gap: 10, marginBottom: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "140px minmax(0,1fr) 150px 140px", gap: 10 }}>
            <Field label="Ngày thay đổi"><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
            <Field label="Khách / người yêu cầu · kênh"><Input value={form.requestedBy} onChange={(e) => setForm({ ...form, requestedBy: e.target.value })} placeholder="VD: SKLUM – email 12/10" /></Field>
            <Field label="Trạng thái"><Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{CHANGE_STATUSES.map((x) => <option key={x}>{x}</option>)}</Select></Field>
            <Field label="Ngày xử lý xong"><Input type="date" value={form.processedDate} disabled={form.status !== "Đã xử lý"} onChange={(e) => setForm({ ...form, processedDate: e.target.value })} /></Field>
          </div>
          <Field label="Nội dung thay đổi *"><TextArea rows={2} value={form.changeReason} onChange={(e) => setForm({ ...form, changeReason: e.target.value })} placeholder="VD: Đổi màu sơn từ TH-14 sang TH-12; tăng chiều cao chân +20mm" /></Field>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 160px", gap: 10 }}>
            <Field label="Ghi chú / cách xử lý"><Input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></Field>
            <Field label="Ảnh / tài liệu"><PhotoProof images={form.photo ? [form.photo] : []} max={1} folder={`samples/${sample.id}`} prefix="change" onChange={(imgs) => setForm({ ...form, photo: imgs[0] || "" })} /></Field>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Button small onClick={submit}>{form.id ? "Lưu" : "Thêm vào lịch sử"}</Button>
            <Button small variant="ghost" onClick={() => setForm(null)}>Huỷ</Button>
          </div>
        </div>
      )}

      {!rows.length ? <div style={{ color: COLORS.inkSoft, fontSize: 13.5 }}>{list.length ? "Không có dòng nào khớp." : "Chưa ghi nhận thay đổi nào từ khách."}</div> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {rows.map((r) => {
            const openRow = isChangeOpen(r);
            return (
              <div key={r.id} style={{ display: "grid", gridTemplateColumns: r.photo ? "64px minmax(0,1fr) auto" : "minmax(0,1fr) auto", gap: 12, alignItems: "start", background: openRow ? "#FFFBEB" : COLORS.bg, border: `1px solid ${openRow ? "#FDE68A" : "transparent"}`, borderRadius: 10, padding: "9px 11px" }}>
                {r.photo && <a href={r.photo} target="_blank" rel="noreferrer"><img src={r.photo} alt="" style={{ width: 60, height: 60, borderRadius: 8, objectFit: "cover" }} /></a>}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: COLORS.inkSoft }}>{fmt(r.date)}{r.requestedBy ? ` · ${r.requestedBy}` : ""}</div>
                  <div style={{ fontWeight: 600, fontSize: 13.5, whiteSpace: "pre-wrap" }}>{r.changeReason}</div>
                  {r.note && <div style={{ fontSize: 12.5, color: COLORS.inkSoft }}>{r.note}</div>}
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <button type="button" disabled={!canEdit} onClick={() => toggle(r)} title={canEdit ? "Bấm để đổi trạng thái" : ""} style={{ border: "none", background: "transparent", padding: 0, cursor: canEdit ? "pointer" : "default" }}>
                    <Badge tone={openRow ? "amber" : "green"}>{openRow ? "Chưa xử lý" : `Đã xử lý${r.processedDate ? " " + fmt(r.processedDate) : ""}`}</Badge>
                  </button>
                  {canEdit && <button type="button" title="Sửa" onClick={() => setForm({ ...blank, ...r, status: r.status || "Chưa xử lý" })} style={{ border: "none", background: "transparent", cursor: "pointer", color: COLORS.inkSoft }}><Pencil size={14} /></button>}
                  {canEdit && <button type="button" title="Xoá" onClick={() => remove(r)} style={{ border: "none", background: "transparent", cursor: "pointer", color: COLORS.red }}><X size={14} /></button>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
