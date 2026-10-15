/* Master Products / PI — pure helpers (no React, no Supabase) — v58 */
export const todayStr = () => new Date().toISOString().slice(0, 10);
export const firstLine = (t) => String(t || "").split(/\r?\n/)[0];
export const PI_STATUSES = ["Draft", "Sent", "Confirmed", "Cancelled"];

export const LSX_TYPES = ["Mẫu", "Đại trà", "Thay đổi", "Điều chỉnh"];

/** All LSX of one master product: LSX mẫu from its Sample rows + Manufacturing Orders containing it. */
export function lsxForMaster(master, { samples = [], mos = [], moLines = [] }) {
  const out = [];
  const sameErp = (s) => s.id === master.sourceSampleId || (master.erpNo && String(s.erpNo || "").trim() === master.erpNo);
  for (const s of samples.filter(sameErp)) {
    if (!s.manufacturingOrderNo) continue;
    out.push({ key: `sample-${s.id}`, kind: "sample", type: "Mẫu", moNo: s.manufacturingOrderNo, date: s.stageStartDate || s.customerApprovalDate || "", description: `LSX mẫu của Sample ${s.id}${s.currentRevision ? ` · rev ${s.currentRevision}` : ""}`, qty: s.qty || "", status: s.stage || "", sampleId: s.id });
  }
  const sampleIds = new Set(samples.filter(sameErp).map((s) => s.id));
  const lines = moLines.filter((l) => l.masterProductId === master.id || (!l.masterProductId && sampleIds.has(l.productId)));
  const byMo = new Map();
  for (const l of lines) byMo.set(l.moId, [...(byMo.get(l.moId) || []), l]);
  for (const [moId, ls] of byMo) {
    const mo = mos.find((m) => m.id === moId);
    if (!mo) continue;
    out.push({ key: mo.id, kind: "mo", type: mo.moType || "Đại trà", moNo: mo.moNo, date: mo.issueDate || "", description: mo.description || mo.notes || "", qty: ls.reduce((a, l) => a + (Number(l.qtyOrdered) || 0), 0) || "", status: mo.status, poReference: mo.poReference, piId: mo.piId, plannedShipDate: mo.plannedShipDate, mo });
  }
  return out.sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
}

/** PI lines of one master product joined with their PI header. */
export function pisForMaster(master, { pis = [], piLines = [] }) {
  return piLines
    .filter((l) => l.masterProductId === master.id)
    .map((l) => ({ line: l, pi: pis.find((p) => p.id === l.piId) }))
    .filter((x) => x.pi)
    .sort((a, b) => String(b.pi.piDate || "").localeCompare(String(a.pi.piDate || "")));
}

const n = (v) => (v === "" || v === null || v === undefined ? 0 : Number(v) || 0);
/** Total qty / amount of PI lines. */
export function piTotals(lines) {
  return { qty: lines.reduce((a, l) => a + n(l.qty), 0), amount: lines.reduce((a, l) => a + n(l.qty) * n(l.unitPrice), 0) };
}
