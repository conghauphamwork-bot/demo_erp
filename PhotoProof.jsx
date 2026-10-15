/* Ảnh minh chứng — upload nhiều ảnh lên Supabase Storage (bucket hiện có),
   hiển thị thumbnail, bấm để xem ảnh gốc, xoá từng ảnh. Dùng chung cho
   vật tư mẫu test, bước mẫu test và phiếu QA/QC. */
import React, { useRef, useState } from "react";
import { Camera, X } from "lucide-react";
import { uploadStorageImage } from "./supabaseRest";

export default function PhotoProof({ images = [], onChange, folder = "proof", prefix = "proof", disabled = false, size = 34, label = "Ảnh", max = 12 }) {
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const list = Array.isArray(images) ? images.filter(Boolean) : [];

  const pick = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;
    const tooBig = files.find((f) => f.size > 15 * 1024 * 1024);
    if (tooBig) { alert(`Ảnh "${tooBig.name}" lớn hơn 15 MB.`); return; }
    if (list.length + files.length > max) { alert(`Tối đa ${max} ảnh.`); return; }
    setBusy(true);
    try {
      const urls = [];
      for (const f of files) urls.push(await uploadStorageImage(f, folder, prefix));
      onChange([...list, ...urls]);
    } catch (err) {
      alert("Upload ảnh thất bại: " + (err?.message || err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
      {list.map((url) => (
        <span key={url} style={{ position: "relative", display: "inline-block" }}>
          <a href={url} target="_blank" rel="noreferrer" title="Xem ảnh gốc">
            <img src={url} alt="" style={{ width: size, height: size, objectFit: "cover", borderRadius: 6, border: "1px solid #E4E9F2", display: "block" }} />
          </a>
          {!disabled && (
            <button type="button" title="Xoá ảnh" onClick={() => { if (confirm("Xoá ảnh minh chứng này?")) onChange(list.filter((x) => x !== url)); }}
              style={{ position: "absolute", top: -6, right: -6, width: 16, height: 16, borderRadius: 99, border: "none", background: "#DC2626", color: "#fff", display: "grid", placeItems: "center", cursor: "pointer", padding: 0 }}>
              <X size={10} />
            </button>
          )}
        </span>
      ))}
      {!disabled && (
        <>
          <input ref={input} type="file" accept="image/*" multiple onChange={pick} style={{ display: "none" }} />
          <button type="button" onClick={() => input.current?.click()} disabled={busy} title="Thêm ảnh minh chứng"
            style={{ height: size, minWidth: size, padding: "0 7px", borderRadius: 6, border: "1px dashed #ADBBCB", background: "#F8FAFC", color: "#576D87", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4, cursor: busy ? "wait" : "pointer", fontSize: 11.5 }}>
            <Camera size={14} />{busy ? "…" : list.length ? "" : label}
          </button>
        </>
      )}
      {disabled && !list.length && <span style={{ fontSize: 11.5, color: "#94A0B2" }}>—</span>}
    </div>
  );
}
