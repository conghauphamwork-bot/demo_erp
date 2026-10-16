/* Master Products + PI — Supabase data access (v58).
   Uses only generic helpers from supabaseRest.js. If the v58 SQL has not been
   run, loadMasterData() returns { available: false } and the rest of the ERP
   keeps working exactly as before. */
import { selectAll, upsertRows, deleteRow, adapters } from "./supabaseRest";

import { todayStr, firstLine, PI_STATUSES } from "./masterLogic.js";
export * from "./masterLogic.js";

const nz = (v) => (v === "" || v === undefined ? null : v);
const num = (v) => (v === "" || v === null || v === undefined || Number.isNaN(Number(v)) ? null : Number(v));

/* ---------- Master Products ---------- */
export function masterToApp(r) {
  return {
    id: r.id, erpNo: r.erp_no || "", name: r.name || "", description: r.description || "", customerId: r.customer_id || "",
    productTypeId: r.product_type_id || "", imageUrl: r.image_url || "", sourceSampleId: r.source_sample_id || "",
    acceptedDate: r.accepted_date || "", status: r.status || "Active", specs: r.specs && typeof r.specs === "object" ? r.specs : {},
    notes: r.notes || "", createdAt: r.created_at || "",
  };
}
function masterToRow(x) {
  return {
    id: x.id, erp_no: nz(String(x.erpNo || "").trim()), name: x.name || "", description: nz(x.description), customer_id: nz(x.customerId),
    product_type_id: nz(x.productTypeId), image_url: nz(x.imageUrl), source_sample_id: nz(x.sourceSampleId),
    accepted_date: nz(x.acceptedDate), status: x.status || "Active", specs: x.specs || {}, notes: nz(x.notes),
    updated_at: new Date().toISOString(),
  };
}

/** Build a master product from a Sample row (snapshot of its specs at acceptance). */
export function masterFromSample(sample) {
  let specs = {};
  try { specs = adapters.samples(sample); } catch (_) { specs = {}; }
  return {
    id: "MP" + sample.id, erpNo: String(sample.erpNo || "").trim(), name: sample.name || "", description: firstLine(sample.name),
    customerId: sample.customerId || "", productTypeId: sample.productTypeId || "", imageUrl: sample.image || "",
    sourceSampleId: sample.id, acceptedDate: sample.customerApprovalDate || todayStr(), status: "Active", specs, notes: "",
  };
}

/* ---------- change history ---------- */
export function changeToApp(r) {
  return {
    id: r.id, masterProductId: r.master_product_id, date: r.change_date || "", requestedBy: r.requested_by || "",
    changeReason: r.content || "", note: r.note || "", photo: r.photo_url || "", status: r.status || "Chưa xử lý",
    processedDate: r.processed_date || "", createdAt: r.created_at || "",
    attachments: Array.isArray(r.attachments) ? r.attachments : [], groupId: r.group_id || "",
  };
}
function changeToRow(x) {
  return {
    id: x.id, master_product_id: x.masterProductId, change_date: nz(x.date), requested_by: nz(x.requestedBy),
    content: x.changeReason || "", note: nz(x.note), photo_url: nz(x.photo), status: x.status || "Chưa xử lý",
    processed_date: x.status === "Đã xử lý" ? nz(x.processedDate) : null,
    attachments: Array.isArray(x.attachments) ? x.attachments : [], group_id: nz(x.groupId),
  };
}

/* ---------- PI ---------- */
export function piToApp(r) {
  return {
    id: r.id, piNo: r.pi_no || "", customerId: r.customer_id || "", piDate: r.pi_date || "", status: r.status || "Draft",
    poNo: r.po_no || "", poDate: r.po_date || "", shipDate: r.ship_date || "", currency: r.currency || "USD", notes: r.notes || "",
    createdAt: r.created_at || "",
  };
}
function piToRow(x) {
  return {
    id: x.id, pi_no: x.piNo || "", customer_id: nz(x.customerId), pi_date: nz(x.piDate), status: x.status || "Draft",
    po_no: nz(x.poNo), po_date: nz(x.poDate), ship_date: nz(x.shipDate), currency: x.currency || "USD", notes: nz(x.notes),
    updated_at: new Date().toISOString(),
  };
}
export function piLineToApp(r) {
  return { id: r.id, piId: r.pi_id, masterProductId: r.master_product_id || "", qty: r.qty ?? "", unitPrice: r.unit_price ?? "", description: r.description || "", sortOrder: r.sort_order ?? 0 };
}
function piLineToRow(x) {
  return { id: x.id, pi_id: x.piId, master_product_id: nz(x.masterProductId), qty: num(x.qty), unit_price: num(x.unitPrice), description: nz(x.description), sort_order: Number(x.sortOrder) || 0 };
}

function isMissingTable(err) {
  return /PGRST205|42P01|does not exist|Could not find the table|404/.test(String(err?.message || err));
}

export async function loadMasterData() {
  try {
    const [mp, ch, pis, lines] = await Promise.all([
      selectAll("master_products"), selectAll("master_product_changes"), selectAll("proforma_invoices"), selectAll("proforma_invoice_lines"),
    ]);
    return {
      available: true,
      masterProducts: (mp || []).map(masterToApp),
      changes: (ch || []).map(changeToApp),
      pis: (pis || []).map(piToApp),
      piLines: (lines || []).map(piLineToApp),
    };
  } catch (err) {
    if (isMissingTable(err)) return { available: false, masterProducts: [], changes: [], pis: [], piLines: [], error: String(err?.message || err) };
    throw err;
  }
}

export const saveMaster = (m) => upsertRows("master_products", [masterToRow(m)]);
export const deleteMaster = (id) => deleteRow("master_products", id);
// v59 columns (attachments, group_id) are dropped and retried if the v59 SQL has not been run yet
export const saveChanges = async (list) => {
  const rows = list.map(changeToRow);
  try { await upsertRows("master_product_changes", rows); }
  catch (err) {
    if (!/PGRST204|column/i.test(String(err?.message || err))) throw err;
    await upsertRows("master_product_changes", rows.map(({ attachments, group_id, ...rest }) => rest));
  }
};
export const saveChange = (c) => saveChanges([c]);
export const deleteChange = (id) => deleteRow("master_product_changes", id);
export const savePi = (p) => upsertRows("proforma_invoices", [piToRow(p)]);
export const deletePi = (id) => deleteRow("proforma_invoices", id);
export const savePiLines = (lines) => upsertRows("proforma_invoice_lines", lines.map(piLineToRow));
export const deletePiLine = (id) => deleteRow("proforma_invoice_lines", id);

