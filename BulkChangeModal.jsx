/* v59 — Ghi 1 thay đổi từ khách cho nhiều sản phẩm cùng lúc (Master Products / Sample).
   items: [{ id, erp, title, sub, tags: [] }]  · onSave(record, ids) → Promise<boolean>
   Mỗi mã nhận 1 dòng lịch sử riêng (cùng group_id) để sau này xử lý / tra cứu theo từng mã. */
import React, { useMemo, useState } from "react";
import { X, Search, Layers } from "lucide-react";
import FileAttach from "./FileAttach.jsx";
import { CHANGE_STATUSES } from "./ProductChangeHistory.jsx";

const today = () => new Date().toISOString().slice(0, 10);
export const newGroupId = () => `grp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

export default function BulkChangeModal({ ui, title = "Ghi thay đổi hàng loạt", items = [], tagLabel = "Lọc theo LSX", onSave, onClose, folder = "changes/bulk" }) {
  const { Button, Input, Select, TextArea, Field, Badge, COLORS } = ui;
  const [q, setQ] = useState("");
  const [tag, setTag] = useState("");
  const [sel, setSel] = useState(() => new Set());
  const [form, setForm] = useState({ date: today(), requestedBy: "", changeReason: "", note: "", attachments: [], status: "Chưa xử lý", processedDate: "" });
  const [saving, setSaving] = useState(false);
  const tags = useMemo(() => { const m = new Map(); items.forEach((it) => (it.tags || []).forEach((t) => t && m.set(t, (m.get(t) || 0) + 1))); return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0])); }, [items]);
  const needle = q.trim().toLowerCase();
  const shown = items.filter((it) => (!tag || (it.tags || []).includes(tag)) && (!needle || `${it.erp} ${it.title} ${it.sub} ${(it.tags || []).join(" ")}`.toLowerCase().includes(needle)));
  const allShown = shown.length > 0 && shown.every((it) => sel.has(it.id));
  const toggle = (id) => setSel((s0) => { const s1 = new Set(s0); s1.has(id) ? s1.delete(id) : s1.add(id); return s1; });
  const toggleAll = () => setSel((s0) => { const s1 = new Set(s0); shown.forEach((it) => (allShown ? s1.delete(it.id) : s1.add(it.id))); return s1; });
  const submit = async () => {
    if (!sel.size) { alert("Tích chọn ít nhất 1 mã."); return; }
    if (!form.changeReason.trim()) { alert("Nhập nội dung thay đổi."); return; }
    if (!confirm(`Ghi thay đổi này cho ${sel.size} mã? Mỗi mã có 1 dòng lịch sử riêng.`)) return;
    setSaving(true);
    const rec = { ...form, processedDate: form.status === "Đã xử lý" ? (form.processedDate || today()) : "",
      photo: form.attachments.find((x) => /^image\//.test(x.type || "") || /\.(png|jpe?g|gif|webp)(\?|$)/i.test(x.url))?.url || "" };
    const ok = await onSave(rec, [...sel]);
    setSaving(false);
    if (ok !== false) onClose();
  };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.45)", zIndex: 1600, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "36px 16px", overflowY: "auto" }} onClick={saving ? undefined : onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "min(1000px, 100%)", background: "#FFFFFF", borderRadius: 14, padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 800, fontSize: 18, display: "flex", gap: 8, alignItems: "center" }}><Layers size={18} /> {title}</div>
          <Button small variant="ghost" onClick={onClose} disabled={saving}><X size={14} /> Đóng</Button>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: "1 1 280px" }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: 11, color: COLORS.inkSoft }} />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Gõ mã ERP / mô tả / khách…" style={{ paddingLeft: 30 }} />
          </div>
          {tags.length > 0 && (
            <Select value={tag} onChange={(e) => setTag(e.target.value)} style={{ maxWidth: 280 }}>
              <option value="">{tagLabel}: tất cả</option>
              {tags.map(([t, n]) => <option key={t} value={t}>{t} ({n} mã)</option>)}
            </Select>
          )}
          <Button small variant="subtle" onClick={toggleAll} disabled={!shown.length}>{allShown ? "Bỏ chọn" : "Chọn tất cả"} ({shown.length})</Button>
          {sel.size > 0 && <Button small variant="ghost" onClick={() => setSel(new Set())}>Bỏ chọn hết</Button>}
          <Badge tone={sel.size ? "wood" : "neutral"}>Đã chọn {sel.size} mã</Badge>
        </div>
        <div style={{ border: `1px solid ${COLORS.line}`, borderRadius: 10, maxHeight: 250, overflowY: "auto" }}>
          {!shown.length && <div style={{ padding: 12, fontSize: 13, color: COLORS.inkSoft }}>Không có mã nào khớp.</div>}
          {shown.slice(0, 400).map((it, i) => (
            <label key={it.id} style={{ display: "flex", gap: 10, alignItems: "center", padding: "6px 10px", borderTop: i ? `1px solid ${COLORS.line}` : "none", background: sel.has(it.id) ? "#EEF3FE" : "#FFFFFF", cursor: "pointer", fontSize: 13 }}>
              <input type="checkbox" checked={sel.has(it.id)} onChange={() => toggle(it.id)} />
              <span style={{ fontWeight: 700, minWidth: 190 }}>{it.erp || it.id}</span>
              <span style={{ flex: 1, minWidth: 0, color: COLORS.inkSoft, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.title}{it.sub ? ` · ${it.sub}` : ""}</span>
              {(it.tags || []).length > 0 && <span style={{ fontSize: 11.5, color: COLORS.inkSoft, whiteSpace: "nowrap" }}>{it.tags.join(" ")}</span>}
            </label>
          ))}
          {shown.length > 400 && <div style={{ padding: "6px 10px", fontSize: 12, color: COLORS.inkSoft }}>+{shown.length - 400} mã khác — lọc thêm</div>}
        </div>

        <div style={{ border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "140px minmax(0,1fr) 150px 140px", gap: 10 }}>
            <Field label="Ngày thay đổi"><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
            <Field label="Khách / người yêu cầu · kênh"><Input value={form.requestedBy} onChange={(e) => setForm({ ...form, requestedBy: e.target.value })} placeholder="VD: SKLUM – email 12/10" /></Field>
            <Field label="Trạng thái"><Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{CHANGE_STATUSES.map((x) => <option key={x}>{x}</option>)}</Select></Field>
            <Field label="Ngày xử lý xong"><Input type="date" value={form.processedDate} disabled={form.status !== "Đã xử lý"} onChange={(e) => setForm({ ...form, processedDate: e.target.value })} /></Field>
          </div>
          <Field label="Nội dung thay đổi *"><TextArea rows={2} value={form.changeReason} onChange={(e) => setForm({ ...form, changeReason: e.target.value })} placeholder="VD: Đổi màu sơn chân TH-14 → TH-12 cho toàn bộ dòng Dubai" /></Field>
          <Field label="Ghi chú / cách xử lý"><Input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></Field>
          <Field label="Ảnh / tài liệu (ảnh, PDF, Word, Excel…) — dùng chung cho các mã">
            <FileAttach files={form.attachments} folder={folder} prefix="change" onChange={(list) => setForm({ ...form, attachments: list })} />
          </Field>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button onClick={submit} disabled={saving || !sel.size}>{saving ? "Đang ghi…" : `Ghi thay đổi cho ${sel.size} mã`}</Button>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Huỷ</Button>
        </div>
      </div>
    </div>
  );
}
