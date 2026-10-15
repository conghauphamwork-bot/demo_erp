/* Sample Test Tracking — Supabase data access.
   Uses only the generic helpers already exported by supabaseRest.js, so the
   existing data layer stays untouched. If the v56 SQL has not been run yet,
   loadTestTracking() returns { available: false } instead of throwing, and the
   rest of the ERP keeps working. */
import { selectAll, upsertRows, deleteRow, saveJsonRecord } from "./supabaseRest";
import { mergeSettings } from "./sampleTestLogic";

const SETTINGS_ID = "test_settings_default";

const nz = (v) => (v === "" || v === undefined ? null : v);
const num = (v) => (v === "" || v === null || v === undefined || Number.isNaN(Number(v)) ? null : Number(v));

export function trackingToApp(r) {
  return {
    id: r.id, sampleId: r.sample_id || "", lsxNo: r.lsx_no || "", owner: r.owner || "",
    startDate: r.start_date || "", testDeadline: r.test_deadline || "", weaveOn: r.weave_on || "",
    baselineLockedAt: r.baseline_locked_at || "", status: r.status || "Active", notes: r.notes || "",
    erpNo: r.erp_no || "", productDescription: r.product_description || "", customerId: r.customer_id || "", imageUrl: r.image_url || "",
    createdAt: r.created_at || "",
  };
}
function trackingToRow(x) {
  return {
    id: x.id, sample_id: nz(x.sampleId), lsx_no: nz(x.lsxNo), owner: nz(x.owner),
    start_date: nz(x.startDate), test_deadline: nz(x.testDeadline), weave_on: nz(x.weaveOn),
    baseline_locked_at: nz(x.baselineLockedAt), status: x.status || "Active", notes: nz(x.notes),
    erp_no: nz(x.erpNo), product_description: nz(x.productDescription), customer_id: nz(x.customerId), image_url: nz(x.imageUrl),
    updated_at: new Date().toISOString(),
  };
}
export function stepToApp(r) {
  return {
    id: r.id, trackingId: r.tracking_id, stepCode: r.step_code, planDate: r.plan_date || "",
    actualDate: r.actual_date || "", notApplicable: Boolean(r.not_applicable),
    rescheduleDate: r.reschedule_date || "", note: r.note || "", proofImages: Array.isArray(r.proof_images) ? r.proof_images : [],
  };
}
function stepToRow(x) {
  return {
    id: x.id || `${x.trackingId}:${x.stepCode}`, tracking_id: x.trackingId, step_code: x.stepCode,
    plan_date: nz(x.planDate), actual_date: nz(x.actualDate), not_applicable: Boolean(x.notApplicable),
    reschedule_date: nz(x.rescheduleDate), note: nz(x.note), proof_images: Array.isArray(x.proofImages) ? x.proofImages : [],
    updated_at: new Date().toISOString(),
  };
}
export function partToApp(r) {
  return {
    id: r.id, trackingId: r.tracking_id, stepCode: r.step_code, itemName: r.item_name || "", spec: r.spec || "",
    qty: r.qty ?? "", unit: r.unit || "", supplier: r.supplier || "", poNo: r.po_no || "",
    promisedDate: r.promised_date || "", rescheduledDate: r.rescheduled_date || "", receivedDate: r.received_date || "",
    iqcResult: r.iqc_result || "Chờ", note: r.note || "", sortOrder: r.sort_order ?? 0, createdAt: r.created_at || "",
    proofImages: Array.isArray(r.proof_images) ? r.proof_images : [],
  };
}
function partToRow(x) {
  return {
    id: x.id, tracking_id: x.trackingId, step_code: x.stepCode, item_name: x.itemName || "(chưa đặt tên)", spec: nz(x.spec),
    qty: num(x.qty), unit: nz(x.unit), supplier: nz(x.supplier), po_no: nz(x.poNo),
    promised_date: nz(x.promisedDate), rescheduled_date: nz(x.rescheduledDate), received_date: nz(x.receivedDate),
    iqc_result: x.iqcResult || "Chờ", note: nz(x.note), sort_order: Number(x.sortOrder) || 0,
    proof_images: Array.isArray(x.proofImages) ? x.proofImages : [],
  };
}
export function testToApp(r) {
  return {
    id: r.id, trackingId: r.tracking_id, testType: r.test_type, sentDate: r.sent_date || "", resultDate: r.result_date || "",
    result: r.result || "Chờ KQ", center: r.center || "", failedItems: r.failed_items || "", rootCause: r.root_cause || "",
    capa: r.capa || "", redoStepCode: r.redo_step_code || "", capaOwner: r.capa_owner || "", capaDue: r.capa_due || "",
    ncrNo: r.ncr_no || "", ncrClosedDate: r.ncr_closed_date || "", reportUrl: r.report_url || "", note: r.note || "",
    createdAt: r.created_at || "",
  };
}
function testToRow(x) {
  return {
    id: x.id, tracking_id: x.trackingId, test_type: x.testType, sent_date: nz(x.sentDate), result_date: nz(x.resultDate),
    result: x.result || "Chờ KQ", center: nz(x.center), failed_items: nz(x.failedItems), root_cause: nz(x.rootCause),
    capa: nz(x.capa), redo_step_code: nz(x.redoStepCode), capa_owner: nz(x.capaOwner), capa_due: nz(x.capaDue),
    ncr_no: nz(x.ncrNo), ncr_closed_date: nz(x.ncrClosedDate), report_url: nz(x.reportUrl), note: nz(x.note),
    ...(x.createdAt ? { created_at: x.createdAt } : {}),
  };
}

function isMissingTable(err) {
  const m = String(err?.message || err);
  return /PGRST205|42P01|does not exist|Could not find the table|404/.test(m);
}

export async function loadTestTracking() {
  try {
    const [trackings, steps, parts, tests, records] = await Promise.all([
      selectAll("test_trackings"),
      selectAll("test_tracking_steps"),
      selectAll("test_tracking_parts"),
      selectAll("test_tracking_tests"),
      selectAll("erp_records"),
    ]);
    const settingsRecord = (records || []).find((r) => r.record_type === "test_settings")?.payload;
    return {
      available: true,
      trackings: (trackings || []).map(trackingToApp),
      steps: (steps || []).map(stepToApp),
      parts: (parts || []).map(partToApp),
      tests: (tests || []).map(testToApp),
      settings: mergeSettings(settingsRecord),
    };
  } catch (err) {
    if (isMissingTable(err)) return { available: false, error: String(err?.message || err) };
    throw err;
  }
}

export const saveTracking = (t) => upsertRows("test_trackings", [trackingToRow(t)]);
export const deleteTracking = (id) => deleteRow("test_trackings", id); // steps/parts/tests cascade
export const saveStepRows = (rows) => upsertRows("test_tracking_steps", rows.map(stepToRow));
export const savePart = (p) => upsertRows("test_tracking_parts", [partToRow(p)]);
export const deletePart = (id) => deleteRow("test_tracking_parts", id);
export const saveTest = (t) => upsertRows("test_tracking_tests", [testToRow(t)]);
export const deleteTest = (id) => deleteRow("test_tracking_tests", id);
export const saveTestSettings = (settings) => saveJsonRecord("test_settings", { ...settings, id: SETTINGS_ID });
