/* QA/QC — Supabase data access (generic helpers from supabaseRest only). */
import { selectAll, upsertRows, deleteRow, saveJsonRecord } from "./supabaseRest";
import { mergeQcSettings } from "./qcLogic";

const nz = (v) => (v === "" || v === undefined ? null : v);
const num = (v) => (v === "" || v === null || v === undefined || Number.isNaN(Number(v)) ? null : Number(v));
const arr = (v) => (Array.isArray(v) ? v : []);

const MAP = [
  ["id", "id"], ["source", "source"], ["trackingId", "tracking_id"], ["sampleId", "sample_id"], ["testId", "test_id"],
  ["erpNo", "erp_no"], ["productName", "product_name"], ["customerId", "customer_id"], ["stageCode", "stage_code"],
  ["stageLabel", "stage_label"], ["inspectionDate", "inspection_date"], ["inspector", "inspector"], ["qtyChecked", "qty_checked", "num"],
  ["qtyDefect", "qty_defect", "num"], ["result", "result"], ["defectCategory", "defect_category"], ["severity", "severity"],
  ["defectDescription", "defect_description"], ["rootCause", "root_cause"], ["correctiveAction", "corrective_action"],
  ["responsible", "responsible"], ["dueDate", "due_date"], ["completedDate", "completed_date"], ["status", "status"],
  ["ncrNo", "ncr_no"], ["photos", "photos", "arr"], ["fixPhotos", "fix_photos", "arr"], ["note", "note"], ["createdAt", "created_at"],
];

export function qcToApp(r) {
  const out = {};
  for (const [app, col, kind] of MAP) out[app] = kind === "arr" ? arr(r[col]) : (r[col] ?? "");
  out.result = out.result || "Fail";
  out.status = out.status || "Mở";
  return out;
}
/** Only keys present on `x` are written, so partial upserts never blank other columns. */
export function qcToRow(x) {
  const row = {};
  for (const [app, col, kind] of MAP) {
    if (!(app in x) || app === "createdAt") continue;
    row[col] = kind === "num" ? num(x[app]) : kind === "arr" ? arr(x[app]) : nz(x[app]);
  }
  row.updated_at = new Date().toISOString();
  return row;
}

function isMissingTable(err) {
  return /PGRST205|42P01|does not exist|Could not find the table|404/.test(String(err?.message || err));
}

export async function loadQc() {
  try {
    const [rows, records] = await Promise.all([selectAll("qc_records"), selectAll("erp_records")]);
    const saved = (records || []).find((r) => r.record_type === "qc_settings")?.payload;
    return { available: true, records: (rows || []).map(qcToApp), settings: mergeQcSettings(saved) };
  } catch (err) {
    if (isMissingTable(err)) return { available: false, records: [], settings: mergeQcSettings(), error: String(err?.message || err) };
    throw err;
  }
}

export const saveQc = (rec) => upsertRows("qc_records", [qcToRow(rec)]);
/** v59: many full records at once (same keys on every row — required by PostgREST batch upsert). */
export async function saveQcMany(list) { for (let i = 0; i < list.length; i += 200) await upsertRows("qc_records", list.slice(i, i + 200).map(qcToRow)); }
export const deleteQc = (id) => deleteRow("qc_records", id);
export const saveQcSettings = (s) => saveJsonRecord("qc_settings", { ...s, id: "qc_settings_default" });
