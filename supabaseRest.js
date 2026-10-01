const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || "").replace(/\/$/, "");
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

const STORAGE_BUCKET = "erp-images";

function storageObjectPath(path) {
  return String(path || "").split("/").map((part) => encodeURIComponent(part)).join("/");
}

export async function uploadStorageImage(file, folder, prefix = "image") {
  assertConfigured();
  if (!file || !file.type || !file.type.startsWith("image/")) {
    throw new Error("Please choose an image file.");
  }
  const extension = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const safeFolder = String(folder || "general").replace(/[^a-zA-Z0-9_-]/g, "_");
  const safePrefix = String(prefix || "image").replace(/[^a-zA-Z0-9_-]/g, "_");
  const path = `${safeFolder}/${safePrefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
  // NOTE (v55 auth fix): Storage upload keeps using the bare anon key exactly as before.
  // PROTECTED_AREAS.md says Storage/bucket/Storage-RLS behavior must not change without
  // explicit approval, so this function is intentionally left untouched.
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${STORAGE_BUCKET}/${storageObjectPath(path)}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "x-upsert": "false",
      "cache-control": "3600",
    },
    body: file,
  });
  if (!res.ok) {
    const text = await res.text();
    let message = text;
    try { message = JSON.parse(text)?.message || JSON.parse(text)?.error || JSON.parse(text)?.statusCode || text; } catch (_) {}
    throw new Error(`Supabase Storage ${res.status}: ${message}`);
  }
  return `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${storageObjectPath(path)}`;
}

function assertConfigured() {
  if (!supabaseConfigured) {
    throw new Error("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the Vercel/local environment.");
  }
}

async function request(path, options = {}) {
  assertConfigured();
  // NOTE (v55 auth fix): data-table requests keep using the anon key exactly as before
  // (the project currently runs a permissive allow-all RLS policy on these tables, chosen
  // deliberately by the project owner for convenience). Only the new profiles/auth-aware
  // helpers below (getMyProfile) send the signed-in user's own token.
  const headers = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
    ...options.headers,
  };
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...options, headers });
  if (!res.ok) {
    const text = await res.text();
    let message = text;
    try { message = JSON.parse(text)?.message || JSON.parse(text)?.hint || text; } catch (_) {}
    throw new Error(`Supabase ${res.status}: ${message}`);
  }
  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export async function selectAll(table) {
  return request(`${table}?select=*`, {
    headers: { Range: "0-9999", Prefer: "count=exact" },
  });
}

export async function upsertRows(table, rows) {
  if (!rows?.length) return [];
  return request(table, {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(rows),
  });
}

export async function deleteRow(table, id) {
  return request(`${table}?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function deleteWhere(table, column, value) {
  return request(`${table}?${column}=eq.${encodeURIComponent(value)}`, { method: "DELETE" });
}

export async function syncArray(table, previous, next, toRow) {
  const oldIds = new Set((previous || []).map((x) => x.id));
  const newIds = new Set((next || []).map((x) => x.id));
  for (const id of oldIds) {
    if (!newIds.has(id)) await deleteRow(table, id);
  }
  const rows = (next || []).filter((x) => x?.id).map(toRow);
  await upsertRows(table, rows);
}

/* ---------------------------------------------------------
   AUTH (v55 fix)
   tanhoa_erp.jsx imports signIn / signOut / getAuthSession /
   refreshAuthSession / getMyProfile from this file. They were
   missing from the v55 handover's supabaseRest.js, which made the
   app crash immediately on load (import of undefined bindings).
   Implemented directly against the Supabase GoTrue REST API so no
   extra npm dependency (@supabase/supabase-js) is required, matching
   the rest of this file's hand-rolled-fetch style.
--------------------------------------------------------- */

const AUTH_SESSION_KEY = "tanhoa_erp_auth_session";

export function getAuthSession() {
  try {
    const raw = localStorage.getItem(AUTH_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

function storeSession(session) {
  try {
    if (session) localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(AUTH_SESSION_KEY);
  } catch (_) {}
}

function toSession(data, fallbackUser, fallbackRefreshToken) {
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token || fallbackRefreshToken || null,
    expires_at: data.expires_at || Math.floor(Date.now() / 1000) + (data.expires_in || 3600),
    user: data.user || fallbackUser || null,
  };
}

export async function signIn(email, password) {
  assertConfigured();
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error_description || data?.msg || data?.error || `Supabase Auth ${res.status}`);
  }
  const session = toSession(data);
  storeSession(session);
  return session;
}

export async function signOut() {
  const session = getAuthSession();
  if (SUPABASE_URL && session?.access_token) {
    try {
      await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
        method: "POST",
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${session.access_token}` },
      });
    } catch (_) {
      // Best-effort server-side revoke; local session is cleared regardless.
    }
  }
  storeSession(null);
}

export async function refreshAuthSession() {
  const session = getAuthSession();
  if (!SUPABASE_URL || !session?.refresh_token) return null;
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: session.refresh_token }),
  });
  if (!res.ok) {
    storeSession(null);
    return null;
  }
  const data = await res.json().catch(() => ({}));
  const next = toSession(data, session.user, session.refresh_token);
  storeSession(next);
  return next;
}

export async function getMyProfile(userId) {
  if (!userId || !SUPABASE_URL) return null;
  // Uses the signed-in user's own access token (not the shared anon key) so the
  // "authenticated user reads own profile row" RLS policy on `profiles` applies.
  const session = getAuthSession();
  const token = session?.access_token || SUPABASE_ANON_KEY;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=*`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const rows = await res.json().catch(() => []);
  return rows?.[0] || null;
}

export async function loadWorkspace() {
  const [customers, samples, quotes, orders, shipments, components, notes, revisions, tasks,
    productTypes, mainMaterials, finishes, woodSurface, fabricTypes, fabricColors, ropeTypes, ropeColors, cemboardColors,
    manufacturingOrders, moProductLines, productionApprovals, productionLots, massProductionTestSamples,
  ] = await Promise.all([
    selectAll("customers"),
    selectAll("samples"),
    loadJsonRecords("quote"),
    loadJsonRecords("order"),
    loadJsonRecords("shipment"),
    selectAll("sample_components"),
    selectAll("sample_notes"),
    selectAll("sample_revisions"),
    selectAll("tasks"),
    selectAll("product_types"),
    selectAll("main_materials"),
    selectAll("finishes"),
    selectAll("wood_surface_treatments"),
    selectAll("fabric_types"),
    selectAll("fabric_colors"),
    selectAll("rope_types"),
    selectAll("rope_colors"),
    selectAll("cemboard_colors"),
    // Mass Production upgrade, Phase 1 tables.
    selectAll("manufacturing_orders"),
    selectAll("mo_product_lines"),
    selectAll("production_approvals"),
    selectAll("production_lots"),
    selectAll("mass_production_test_samples"),
  ]);

  const noteMap = groupBy(sampleNotesToApp(notes), "sampleId");
  const revisionMap = groupBy(sampleRevisionsToApp(revisions), "sampleId");
  const componentRows = sampleComponentsToApp(components);
  const componentMap = groupBy(componentRows, "sampleId");

  const appSamples = samples.map(sampleToApp).map((s) => normalizeLoadedSample({
    ...s,
    noteHistory: noteMap[s.id] || [],
    revisions: revisionMap[s.id] || [],
    requiredComponents: componentMap[s.id] || [],
  }));

  return {
    customers: customers.map(customerToApp),
    samples: appSamples,
    quotes,
    orders,
    shipments,
    materialPreps: componentRows,
    tasks: tasks.map(taskToApp),
    materialLists: {
      productTypes: productTypes.map(simpleMasterToApp),
      mainMaterials: mainMaterials.map(simpleMasterToApp),
      // Finish / Fabric color / Rope color masters also carry a reference image
      // (image_url) per DATABASE_MAP.md — route them through colorMasterToApp
      // instead of the generic simpleMasterToApp so `.image` survives the load.
      finishes: finishes.map(colorMasterToApp),
      woodSurface: woodSurface.map(simpleMasterToApp),
      fabricTypes: fabricTypes.map(simpleMasterToApp),
      fabricColors: fabricColors.map(colorMasterToApp),
      ropeTypes: ropeTypes.map(simpleMasterToApp),
      ropeColors: ropeColors.map(colorMasterToApp),
      cemboardColors: cemboardColors.map(simpleMasterToApp),
    },
    manufacturingOrders: manufacturingOrders.map(manufacturingOrderToApp),
    moProductLines: moProductLines.map(moProductLineToApp),
    productionApprovals: productionApprovals.map(productionApprovalToApp),
    productionLots: productionLots.map(productionLotToApp),
    massProductionTestSamples: massProductionTestSamples.map(massProductionTestSampleToApp),
  };
}

async function loadJsonRecords(recordType) {
  const rows = await selectAll("erp_records");
  return rows.filter((r) => r.record_type === recordType).map((r) => r.payload);
}

function groupBy(rows, key) {
  return rows.reduce((acc, row) => { (acc[row[key]] ||= []).push(row); return acc; }, {});
}

function nullify(value) { return value === "" || value === undefined ? null : value; }
function customerToApp(r) { return { id: r.id, name: r.name || "", country: r.country || "", contact: r.contact_person || "", email: r.email || "", phone: r.phone || "" }; }
function simpleMasterToApp(r) { return { id: r.id, code: r.code || "", name: r.name || "" }; }
// v55 fix: loader for color/finish masters that also carry a reference image.
function colorMasterToApp(r) { return { id: r.id, code: r.code || "", name: r.name || "", image: r.image_url || "" }; }
function taskToApp(r) { return { id: r.id, name: r.name || "", type: r.type || "Daily", description: r.description || "", referencePerson: r.reference_person || "", deadline: r.deadline || "", status: r.status || "To Do", priority: r.priority || "", sampleId: r.sample_id || "", note: r.note || "", image: r.image_url || "" }; }
function sampleComponentsToApp(rows) { return rows.map((r) => ({ id: r.id, sampleId: r.sample_id, materialName: r.component_name || "", qty: r.qty ?? 1, startDate: r.start_date || "", dueDate: r.target_date || "", status: r.status || "Waiting", photo: r.proof_image_url || "" })); }
function sampleNotesToApp(rows) { return rows.map((r) => ({ id: r.id, sampleId: r.sample_id, text: r.note || "", createdAt: r.created_at || new Date().toISOString() })); }
function sampleRevisionsToApp(rows) { return rows.map((r) => ({ id: r.id, sampleId: r.sample_id, date: r.revision_date || "", changeReason: r.change_reason || "", photo: r.photo_url || "", note: r.note || "" })); }

function sampleToApp(r) {
  return {
    id: r.id, customerId: r.customer_id || "", name: r.name || "", productTypeId: r.product_type_id || "", qty: r.qty ?? "",
    designFrom: r.design_from || "TanHoa", productStatus: r.product_status || "Accept",
    erpNo: r.erp_no || "", manufacturingOrderNo: r.manufacturing_order_no || "", idpNo: r.idp_no || "", idcNo: r.idc_no || "",
    width: r.width ?? "", depth: r.depth ?? "", height: r.height ?? "", armHeight: r.arm_height ?? "", seatHeight: r.seat_height ?? "",
    mainMaterialId: r.main_material_id || "", finishesColorId: r.finishes_color_id || "", woodSurfaceTreatmentId: r.wood_surface_treatment_id || "",
    fabricTypeId: r.fabric_type_id || "", fabricColorId: r.fabric_color_id || "", ropeTypeId: r.rope_type_id || "", ropeDiameter: r.rope_diameter ?? "", ropeColorId: r.rope_color_id || "",
    metalName: r.metal_name || "", metalColor: r.metal_color || "", cemboardColorId: r.cemboard_color_id || "", hardware: r.hardware || "", construction: r.construction || "", currentRevision: r.current_revision || "",
    stageGroup: r.stage_group || "", stage: r.stage || "Request Received", waitingFor: r.waiting_for || "", nextAction: r.next_action || "", stageStartDate: r.stage_start_date || "", stageStatus: r.stage_status || "",
    priority: r.priority || "", targetDate: r.target_date || "", completedDate: r.completed_date || "", overallStatus: r.overall_status || "", image: r.image_url || "", notes: "", orderId: r.order_id || "",
    cartonLength: r.carton_length ?? "", cartonWidth: r.carton_width ?? "", cartonHeight: r.carton_height ?? "",
    netWeight: r.net_weight ?? "", grossWeight: r.gross_weight ?? "", pcsPerCtn: r.pcs_per_ctn ?? "", cartonQty: r.carton_qty ?? "", cbm: r.cbm ?? "",
    // Mass Production upgrade, Phase 0: customer approval gate before mass production.
    customerApprovalStatus: r.customer_approval_status || "Pending", customerApprovalDate: r.customer_approval_date || "", customerApprovalNote: r.customer_approval_note || "", customerApprovalBy: r.customer_approval_by || "",
    requiredComponents: [], noteHistory: [], revisions: [],
  };
}

function normalizeLoadedSample(s) { return s; }

export const adapters = {
  customers: (x) => ({ id: x.id, code: x.code || x.id, name: x.name || "", country: x.country || "", contact_person: nullify(x.contact), email: nullify(x.email), phone: nullify(x.phone) }),
  samples: (x) => ({
    id: x.id, customer_id: nullify(x.customerId), name: x.name || "", product_type_id: nullify(x.productTypeId), qty: x.qty === "" ? null : x.qty,
    design_from: x.designFrom || "TanHoa", product_status: x.productStatus || "Accept",
    erp_no: nullify(x.erpNo), manufacturing_order_no: nullify(x.manufacturingOrderNo), idp_no: nullify(x.idpNo), idc_no: nullify(x.idcNo),
    width: x.width === "" ? null : x.width, depth: x.depth === "" ? null : x.depth, height: x.height === "" ? null : x.height, arm_height: x.armHeight === "" ? null : x.armHeight, seat_height: x.seatHeight === "" ? null : x.seatHeight,
    main_material_id: nullify(x.mainMaterialId), finishes_color_id: nullify(x.finishesColorId), wood_surface_treatment_id: nullify(x.woodSurfaceTreatmentId), fabric_type_id: nullify(x.fabricTypeId), fabric_color_id: nullify(x.fabricColorId),
    rope_type_id: nullify(x.ropeTypeId), rope_diameter: nullify(x.ropeDiameter), rope_color_id: nullify(x.ropeColorId), metal_name: nullify(x.metalName), metal_color: nullify(x.metalColor), cemboard_color_id: nullify(x.cemboardColorId),
    hardware: nullify(x.hardware), construction: nullify(x.construction), current_revision: nullify(x.currentRevision), stage_group: nullify(x.stageGroup), stage: nullify(x.stage), waiting_for: nullify(x.waitingFor),
    next_action: nullify(x.nextAction), stage_start_date: nullify(x.stageStartDate), stage_status: nullify(x.stageStatus), priority: nullify(x.priority), target_date: nullify(x.targetDate), completed_date: nullify(x.completedDate), overall_status: nullify(x.overallStatus), image_url: nullify(x.image), order_id: nullify(x.orderId),
    carton_length: x.cartonLength === "" ? null : x.cartonLength, carton_width: x.cartonWidth === "" ? null : x.cartonWidth, carton_height: x.cartonHeight === "" ? null : x.cartonHeight,
    net_weight: x.netWeight === "" ? null : x.netWeight, gross_weight: x.grossWeight === "" ? null : x.grossWeight, pcs_per_ctn: x.pcsPerCtn === "" ? null : x.pcsPerCtn, carton_qty: x.cartonQty === "" ? null : x.cartonQty, cbm: x.cbm === "" ? null : x.cbm,
    customer_approval_status: x.customerApprovalStatus || "Pending", customer_approval_date: nullify(x.customerApprovalDate), customer_approval_note: nullify(x.customerApprovalNote), customer_approval_by: nullify(x.customerApprovalBy),
  }),
  components: (x) => ({ id: x.id, sample_id: x.sampleId, component_name: x.materialName || "", qty: x.qty ?? 1, start_date: nullify(x.startDate), target_date: nullify(x.dueDate), status: x.status || "Waiting", proof_image_url: nullify(x.photo) }),
  tasks: (x) => ({ id: x.id, name: x.name || "", type: x.type || "Daily", description: nullify(x.description), reference_person: nullify(x.referencePerson), deadline: nullify(x.deadline), status: x.status || "To Do", priority: nullify(x.priority), sample_id: nullify(x.sampleId), note: nullify(x.note), image_url: nullify(x.image) }),
  masters: (x) => ({ id: x.id, code: x.code || "", name: x.name || "" }),
  // v55 fix: was referenced by tanhoa_erp.jsx (MaterialsView save logic for
  // Finishes / Fabric Colors / Rope Colors) but missing from this file, which
  // crashed with "adapters.colorMasters is not a function" on save.
  colorMasters: (x) => ({ id: x.id, code: x.code || "", name: x.name || "", image_url: nullify(x.image) }),

  // Mass Production upgrade, Phase 1: manufacturing_orders / mo_product_lines /
  // production_approvals / production_lots / mass_production_test_samples.
  manufacturingOrders: (x) => ({
    id: x.id, mo_no: x.moNo || "", customer_id: nullify(x.customerId), po_reference: nullify(x.poReference),
    order_qty_total: x.orderQtyTotal === "" ? null : x.orderQtyTotal, planned_ship_date: nullify(x.plannedShipDate),
    status: x.status || "Draft", notes: nullify(x.notes),
  }),
  moProductLines: (x) => ({
    id: x.id, mo_id: x.moId, product_id: x.productId, qty_ordered: x.qtyOrdered === "" ? null : x.qtyOrdered, unit_price: x.unitPrice === "" ? null : x.unitPrice,
    production_stage: x.productionStage || "Not Started", stage_status: x.stageStatus || "On track",
    planned_complete_date: nullify(x.plannedCompleteDate), actual_complete_date: nullify(x.actualCompleteDate),
    mass_production_approval_id: nullify(x.massProductionApprovalId), is_exception: Boolean(x.isException),
  }),
  productionApprovals: (x) => ({
    id: x.id, product_id: x.productId, mo_product_line_id: nullify(x.moProductLineId), approval_type: x.approvalType || "Standard",
    customer_confirmation_reference: nullify(x.customerConfirmationReference), reason: nullify(x.reason),
    approved_by: nullify(x.approvedBy), approved_at: x.approvedAt || new Date().toISOString(), status: x.status || "Approved",
  }),
  productionLots: (x) => ({
    id: x.id, mo_product_line_id: x.moProductLineId, lot_no: x.lotNo || "", qty: x.qty === "" ? null : x.qty,
    production_date: nullify(x.productionDate), status: nullify(x.status), notes: nullify(x.notes),
  }),
  massProductionTestSamples: (x) => ({
    id: x.id, mo_id: x.moId, product_id: x.productId, mo_product_line_id: x.moProductLineId, lot_id: nullify(x.lotId),
    pulled_qty: x.pulledQty === "" ? null : x.pulledQty, pulled_date: nullify(x.pulledDate), pulled_by: nullify(x.pulledBy),
    test_purpose: nullify(x.testPurpose), test_result: nullify(x.testResult), test_report_url: nullify(x.testReportUrl),
    reviewed_by: nullify(x.reviewedBy), reviewed_at: nullify(x.reviewedAt), linked_shipment_id: nullify(x.linkedShipmentId),
  }),
};

function manufacturingOrderToApp(r) {
  return { id: r.id, moNo: r.mo_no || "", customerId: r.customer_id || "", poReference: r.po_reference || "", orderQtyTotal: r.order_qty_total ?? "", plannedShipDate: r.planned_ship_date || "", status: r.status || "Draft", notes: r.notes || "", createdAt: r.created_at || "" };
}
function moProductLineToApp(r) {
  return { id: r.id, moId: r.mo_id, productId: r.product_id, qtyOrdered: r.qty_ordered ?? "", unitPrice: r.unit_price ?? "", productionStage: r.production_stage || "Not Started", stageStatus: r.stage_status || "On track", plannedCompleteDate: r.planned_complete_date || "", actualCompleteDate: r.actual_complete_date || "", massProductionApprovalId: r.mass_production_approval_id || "", isException: Boolean(r.is_exception), createdAt: r.created_at || "" };
}
function productionApprovalToApp(r) {
  return { id: r.id, productId: r.product_id, moProductLineId: r.mo_product_line_id || "", approvalType: r.approval_type || "Standard", customerConfirmationReference: r.customer_confirmation_reference || "", reason: r.reason || "", approvedBy: r.approved_by || "", approvedAt: r.approved_at || "", status: r.status || "Approved" };
}
function productionLotToApp(r) {
  return { id: r.id, moProductLineId: r.mo_product_line_id, lotNo: r.lot_no || "", qty: r.qty ?? "", productionDate: r.production_date || "", status: r.status || "", notes: r.notes || "" };
}
function massProductionTestSampleToApp(r) {
  return { id: r.id, moId: r.mo_id, productId: r.product_id, moProductLineId: r.mo_product_line_id, lotId: r.lot_id || "", pulledQty: r.pulled_qty ?? "", pulledDate: r.pulled_date || "", pulledBy: r.pulled_by || "", testPurpose: r.test_purpose || "", testResult: r.test_result || "", testReportUrl: r.test_report_url || "", reviewedBy: r.reviewed_by || "", reviewedAt: r.reviewed_at || "", linkedShipmentId: r.linked_shipment_id || "" };
}

export async function saveSampleChildren(sample) {
  const notes = (sample.noteHistory || []).map((n) => ({ id: n.id, sample_id: sample.id, note: n.text || "", created_at: n.createdAt || new Date().toISOString() }));
  const revisions = (sample.revisions || []).map((r) => ({ id: r.id, sample_id: sample.id, revision_date: r.date || null, change_reason: r.changeReason || "", photo_url: r.photo || null, note: r.note || null }));
  await deleteWhere("sample_notes", "sample_id", sample.id);
  await deleteWhere("sample_revisions", "sample_id", sample.id);
  await upsertRows("sample_notes", notes);
  await upsertRows("sample_revisions", revisions);
}

export async function saveJsonRecord(recordType, record) {
  await upsertRows("erp_records", [{ id: record.id, record_type: recordType, payload: record }]);
}
export async function deleteJsonRecord(recordType, id) {
  await request(`erp_records?record_type=eq.${encodeURIComponent(recordType)}&id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
}
