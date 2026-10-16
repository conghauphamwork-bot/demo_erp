/* v59 — đính kèm nhiều file (ảnh, PDF, Word, Excel, PowerPoint, zip…) vào Supabase Storage.
   value: [{ url, name, type }] */
import React, { useRef, useState } from "react";
import { Paperclip, X, FileText, FileSpreadsheet, File as FileIcon, Image as ImageIcon } from "lucide-react";
import { uploadStorageFile } from "./supabaseRest";

export const isImageUrl = (u, type = "") => /^image\//.test(type) || /\.(png|jpe?g|gif|webp|bmp|svg)(\?|$)/i.test(String(u || ""));
const extOf = (name = "", url = "") => (String(name || url).split("?")[0].split(".").pop() || "").toLowerCase();
function iconFor(f) {
  const e = extOf(f.name, f.url);
  if (isImageUrl(f.url, f.type)) return ImageIcon;
  if (["xls", "xlsx", "csv"].includes(e)) return FileSpreadsheet;
  if (["pdf", "doc", "docx", "txt", "ppt", "pptx"].includes(e)) return FileText;
  return FileIcon;
}
/** Legacy single photo_url + new attachments → one list for display. */
export function allAttachments(rec) {
  const list = Array.isArray(rec?.attachments) ? rec.attachments.filter((x) => x && x.url) : [];
  if (rec?.photo && !list.some((x) => x.url === rec.photo)) return [{ url: rec.photo, name: "Ảnh", type: "image/*" }, ...list];
  return list;
}

export function AttachmentList({ files = [], onRemove, size = 54 }) {
  if (!files.length) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {files.map((f, i) => {
        const Icon = iconFor(f);
        const img = isImageUrl(f.url, f.type);
        return (
          <div key={f.url + i} style={{ position: "relative", display: "inline-flex" }}>
            <a href={f.url} target="_blank" rel="noreferrer" title={f.name || f.url}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, border: "1px solid #E5E7EB", borderRadius: 8, background: "#FFFFFF", textDecoration: "none", color: "#111827", padding: img ? 0 : "5px 9px", fontSize: 12, maxWidth: 220, height: img ? size : "auto" }}>
              {img ? <img src={f.url} alt="" style={{ width: size, height: size, objectFit: "cover", borderRadius: 7 }} />
                : <><Icon size={15} color="#2563EB" /><span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.name || extOf(f.name, f.url).toUpperCase()}</span></>}
            </a>
            {onRemove && <button type="button" title="Bỏ file" onClick={() => onRemove(i)} style={{ position: "absolute", top: -6, right: -6, width: 18, height: 18, borderRadius: 999, border: "none", background: "#DC2626", color: "#FFF", cursor: "pointer", display: "grid", placeItems: "center", padding: 0 }}><X size={11} /></button>}
          </div>
        );
      })}
    </div>
  );
}

export default function FileAttach({ files = [], onChange, folder = "attachments", prefix = "file", disabled = false, max = 10, accept = "image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.txt,.zip" }) {
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const pick = async (e) => {
    const chosen = [...(e.target.files || [])]; e.target.value = "";
    if (!chosen.length) return;
    if (files.length + chosen.length > max) { setErr(`Tối đa ${max} file.`); return; }
    setBusy(true); setErr("");
    const added = [];
    try {
      for (const f of chosen) added.push({ url: await uploadStorageFile(f, folder, prefix), name: f.name, type: f.type || "" });
    } catch (x) { setErr(String(x?.message || x)); }
    finally {
      setBusy(false);
      if (added.length) onChange([...files, ...added]);
    }
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <AttachmentList files={files} onRemove={disabled ? null : (i) => onChange(files.filter((_, j) => j !== i))} />
      {!disabled && (
        <div>
          <button type="button" onClick={() => input.current?.click()} disabled={busy}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, border: "1px dashed #93A3B8", background: "#FFFFFF", color: "#2563EB", borderRadius: 8, padding: "6px 10px", fontSize: 12.5, fontWeight: 600, cursor: busy ? "wait" : "pointer" }}>
            <Paperclip size={14} /> {busy ? "Đang tải lên…" : "Đính kèm ảnh / PDF / Word / Excel"}
          </button>
          <input ref={input} type="file" multiple accept={accept} onChange={pick} style={{ display: "none" }} />
        </div>
      )}
      {err && <div style={{ color: "#DC2626", fontSize: 12 }}>{err}</div>}
    </div>
  );
}
