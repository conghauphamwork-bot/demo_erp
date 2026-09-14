const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || "").replace(/\/$/, "");
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

const STORAGE_BUCKET = "erp-images";

const AUTH_STORAGE_KEY = "tanhoa_erp_auth_session";

export async function signIn(email, password) {
  assertConfigured();
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error_description || data.msg || data.message || "Login failed.");
  // Keep an explicit expiry timestamp so the app does not refresh a fresh token
  // immediately on first load.
  if (data?.expires_in && !data.expires_at) data.expires_at = Math.floor(Date.now() / 1000) + Number(data.expires_in);
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
  return data;
}

export function getAuthSession() {
  try { return JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) || "null"); } catch (_) { return null; }
}

export async function refreshAuthSession() {
  const current = getAuthSession();
  if (!current?.refresh_token) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  let res;
  try {
    res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: current.refresh_token }),
    signal: controller.signal,
  });
  } catch (_) {
    return null;
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) { localStorage.removeItem(AUTH_STORAGE_KEY); return null; }
  const data = await res.json();
  if (data?.expires_in && !data.expires_at) data.expires_at = Math.floor(Date.now() / 1000) + Number(data.expires_in);
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
  return data;
}

export async function getCurrentUser() {
  const session = getAuthSession();
  if (!session?.access_token) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${session.access_token}` },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    return res.json();
  } catch (_) {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function signOut() {
  const session = getAuthSession();
  if (session?.access_token) {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method: "POST", headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${session.access_token}` },
    }).catch(() => {});
  }
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export async function getMyProfile(userId = null) {
  // Prefer the user id already returned by Supabase during password login.
  // This avoids an extra /auth/v1/user request that can leave the UI waiting
  // on some deployments/network conditions.
  const session = getAuthSession();
  const id = userId || session?.user?.id || null;
  if (!id) return null;
  return requestWithTimeout(`profiles?id=eq.${encodeURIComponent(id)}&select=*`, {}, 8000)
    .then((rows) => rows?.[0] || null);
}

async function requestWithTimeout(path, options = {}, timeoutMs = 8000) {
  assertConfigured();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const headers = {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${getAuthSession()?.access_token || SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      ...options.headers,
    };
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...options, headers, signal: controller.signal });
    const text = await res.text();
    if (!res.ok) {
      let message = text;
      try { message = JSON.parse(text)?.message || JSON.parse(text)?.hint || text; } catch (_) {}
      throw new Error(`Supabase ${res.status}: ${message}`);
    }
    return text ? JSON.parse(text) : null;
  } finally {
    clearTimeout(timer);
  }
}

export function authHeaders() {
  const session = getAuthSession();
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
}


function storageObjectPath(path) {
  return String(path || "").split("/").map((part) => encodeURIComponent(part)).join("/");
}

async function getStorageAccessToken() {
  let session = getAuthSession();
  if (!session?.access_token) {
    throw new Error("You must be signed in before uploading an image.");
  }

  const now = Math.floor(Date.now() / 1000);
  const expiresAt = Number(session.expires_at || 0);
  if (expiresAt && expiresAt - now <= 60 && session.refresh_token) {
    const refreshed = await refreshAuthSession();
    session = refreshed || getAuthSession();
  }

  if (!session?.access_token) {
    throw new Error("Your login session has expired. Please sign in again and retry the upload.");
  }
  return session.access_token;
}

async function storageUploadRequest(path, file, accessToken) {
  return fetch(`${SUPABASE_URL}/storage/v1/object/${STORAGE_BUCKET}/${storageObjectPath(path)}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
      "x-upsert": "false",
      "cache-control": "3600",
      "Content-Type": file.type || "application/octet-stream",
    },
    body: file,
  });
}

export async function uploadStorageImage(file, folder, prefix = "image") {
  assertConfigured();
  if (!file || !file.type || !file.type.startsWith("image/")) {
    throw new Error("Please choose an image file.");
  }
  if (file.size > 15 * 1024 * 1024) {
    throw new Error("Please choose an image smaller than 15 MB.");
  }

  const extension = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const safeFolder = String(folder || "general").replace(/[^a-zA-Z0-9_-]/g, "_");
  const safePrefix = String(prefix || "image").replace(/[^a-zA-Z0-9_-]/g, "_");
  const path = `${safeFolder}/${safePrefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;

  let accessToken = await getStorageAccessToken();
  let res = await storageUploadRequest(path, file, accessToken);

  // A session can expire between the token check and the actual upload.
  // Refresh once for 401/expired-session responses; do not blindly retry RLS
  // policy failures because those require a database/storage policy fix.
  if (res.status === 401) {
    const refreshed = await refreshAuthSession();
    if (refreshed?.access_token) {
      accessToken = refreshed.access_token;
      res = await storageUploadRequest(path, file, accessToken);
    }
  }

  if (!res.ok) {
    const text = await res.text();
    let details = text;
    try {
      const body = JSON.parse(text);
      details = body?.message || body?.error || body?.statusCode || text;
    } catch (_) {}

    if (res.status === 401) {
      throw new Error("Your login session is no longer valid. Please sign out, sign in again, and retry the upload.");
    }
    if (res.status === 403 || /row-level security|violates row-level security policy/i.test(details)) {
      throw new Error("Supabase Storage permission denied. Run the Tân Hòa storage/RLS migration once, then retry the upload.");
    }
    throw new Error(`Supabase Storage ${res.status}: ${details}`);
  }

  return `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${storageObjectPath(path)}`;
}

export async function deleteStorageImage(publicUrlOrPath) {
  assertConfigured();
  const marker = `/storage/v1/object/public/${STORAGE_BUCKET}/`;
  const raw = String(publicUrlOrPath || "");
  const path = raw.includes(marker) ? decodeURIComponent(raw.split(marker)[1]) : raw.replace(/^\/+/, "");
  if (!path || path.includes("..")) return false;

  const accessToken = await getStorageAccessToken();
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${STORAGE_BUCKET}/${storageObjectPath(path)}`, {
    method: "DELETE",
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok && res.status !== 404) {
    const text = await res.text();
    throw new Error(`Supabase Storage ${res.status}: ${text || "Could not delete image."}`);
  }
  return true;
}

function assertConfigured() {
  if (!supabaseConfigured) {
    throw new Error("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the Vercel/local environment.");
  }
}

async function request(path, options = {}) {
  assertConfigured();
  const headers = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${getAuthSession()?.access_token || SUPABASE_ANON_KEY}`,
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

export async function loadWorkspace(userLevel = 3) {
  const level = Number(userLevel ?? 3);
  // Only Level 0 is allowed to read Quotes/Orders/Shipments. Avoid requesting
  // intentionally forbidden tables for lower levels; one 403 must not abort
  // the whole workspace Promise.all().
  const canLoadSalesRecords = level === 0;

  const [customers, samples, components, notes, revisions, tasks,
    productTypes, mainMaterials, finishes, woodSurface, fabricTypes, fabricColors,
    ropeTypes, ropeColors, cemboardColors, quotes, orders, shipments] = await Promise.all([
    selectAll("customers"),
    selectAll("samples"),
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
    canLoadSalesRecords ? loadJsonRecords("quote") : Promise.resolve([]),
    canLoadSalesRecords ? loadJsonRecords("order") : Promise.resolve([]),
    canLoadSalesRecords ? loadJsonRecords("shipment") : Promise.resolve([]),
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
      finishes: finishes.map(simpleMasterToApp),
      woodSurface: woodSurface.map(simpleMasterToApp),
      fabricTypes: fabricTypes.map(simpleMasterToApp),
      fabricColors: fabricColors.map(simpleMasterToApp),
      ropeTypes: ropeTypes.map(simpleMasterToApp),
      ropeColors: ropeColors.map(simpleMasterToApp),
      cemboardColors: cemboardColors.map(simpleMasterToApp),
    },
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
function simpleMasterToApp(r) { return { id: r.id, code: r.code || "", name: r.name || "", image: r.image_url || "" }; }
function taskToApp(r) { return { id: r.id, name: r.name || "", type: r.type || "Daily", description: r.description || "", referencePerson: r.reference_person || "", deadline: r.deadline || "", status: r.status || "To Do", priority: r.priority || "", sampleId: r.sample_id || "", note: r.note || "", image: r.image_url || "" }; }
function sampleComponentsToApp(rows) { return rows.map((r) => ({ id: r.id, sampleId: r.sample_id, materialName: r.component_name || "", qty: r.qty ?? 1, startDate: r.start_date || "", dueDate: r.target_date || "", status: r.status || "Waiting", photo: r.proof_image_url || "" })); }
function sampleNotesToApp(rows) { return rows.map((r) => ({ id: r.id, sampleId: r.sample_id, text: r.note || "", createdAt: r.created_at || new Date().toISOString() })); }
function sampleRevisionsToApp(rows) { return rows.map((r) => ({ id: r.id, sampleId: r.sample_id, date: r.revision_date || "", changeReason: r.change_reason || "", photo: r.photo_url || "", note: r.note || "" })); }

function sampleToApp(r) {
  return {
    id: r.id, customerId: r.customer_id || "", name: r.name || "", productTypeId: r.product_type_id || "", qty: r.qty ?? "",
    erpNo: r.erp_no || "", manufacturingOrderNo: r.manufacturing_order_no || "", idpNo: r.idp_no || "", idcNo: r.idc_no || "",
    width: r.width ?? "", depth: r.depth ?? "", height: r.height ?? "", armHeight: r.arm_height ?? "", seatHeight: r.seat_height ?? "",
    mainMaterialId: r.main_material_id || "", finishesColorId: r.finishes_color_id || "", woodSurfaceTreatmentId: r.wood_surface_treatment_id || "",
    fabricTypeId: r.fabric_type_id || "", fabricColorId: r.fabric_color_id || "", ropeTypeId: r.rope_type_id || "", ropeDiameter: r.rope_diameter ?? "", ropeColorId: r.rope_color_id || "",
    metalName: r.metal_name || "", metalColor: r.metal_color || "", cemboardColorId: r.cemboard_color_id || "", hardware: r.hardware || "", construction: r.construction || "", currentRevision: r.current_revision || "",
    stageGroup: r.stage_group || "", stage: r.stage || "Request Received", waitingFor: r.waiting_for || "", nextAction: r.next_action || "", stageStartDate: r.stage_start_date || "", stageStatus: r.stage_status || "",
    priority: r.priority || "", targetDate: r.target_date || "", completedDate: r.completed_date || "", overallStatus: r.overall_status || "", image: r.image_url || "", notes: "", orderId: r.order_id || "",
    requiredComponents: [], noteHistory: [], revisions: [],
  };
}

function normalizeLoadedSample(s) { return s; }

export const adapters = {
  customers: (x) => ({ id: x.id, code: x.code || x.id, name: x.name || "", country: x.country || "", contact_person: nullify(x.contact), email: nullify(x.email), phone: nullify(x.phone) }),
  samples: (x) => ({ id: x.id, customer_id: nullify(x.customerId), name: x.name || "", product_type_id: nullify(x.productTypeId), qty: x.qty === "" ? null : x.qty, erp_no: nullify(x.erpNo), manufacturing_order_no: nullify(x.manufacturingOrderNo), idp_no: nullify(x.idpNo), idc_no: nullify(x.idcNo), width: x.width === "" ? null : x.width, depth: x.depth === "" ? null : x.depth, height: x.height === "" ? null : x.height, arm_height: x.armHeight === "" ? null : x.armHeight, seat_height: x.seatHeight === "" ? null : x.seatHeight, main_material_id: nullify(x.mainMaterialId), finishes_color_id: nullify(x.finishesColorId), wood_surface_treatment_id: nullify(x.woodSurfaceTreatmentId), fabric_type_id: nullify(x.fabricTypeId), fabric_color_id: nullify(x.fabricColorId), rope_type_id: nullify(x.ropeTypeId), rope_diameter: nullify(x.ropeDiameter), rope_color_id: nullify(x.ropeColorId), metal_name: nullify(x.metalName), metal_color: nullify(x.metalColor), cemboard_color_id: nullify(x.cemboardColorId), hardware: nullify(x.hardware), construction: nullify(x.construction), current_revision: nullify(x.currentRevision), stage_group: nullify(x.stageGroup), stage: nullify(x.stage), waiting_for: nullify(x.waitingFor), next_action: nullify(x.nextAction), stage_start_date: nullify(x.stageStartDate), stage_status: nullify(x.stageStatus), priority: nullify(x.priority), target_date: nullify(x.targetDate), completed_date: nullify(x.completedDate), overall_status: nullify(x.overallStatus), image_url: nullify(x.image), order_id: nullify(x.orderId) }),
  components: (x) => ({ id: x.id, sample_id: x.sampleId, component_name: x.materialName || "", qty: x.qty ?? 1, start_date: nullify(x.startDate), target_date: nullify(x.dueDate), status: x.status || "Waiting", proof_image_url: nullify(x.photo) }),
  tasks: (x) => ({ id: x.id, name: x.name || "", type: x.type || "Daily", description: nullify(x.description), reference_person: nullify(x.referencePerson), deadline: nullify(x.deadline), status: x.status || "To Do", priority: nullify(x.priority), sample_id: nullify(x.sampleId), note: nullify(x.note), image_url: nullify(x.image) }),
  // IMPORTANT: every material master table currently has only these writable
  // columns in the database. Keep this adapter strict so UI-only fields such as
  // image_url can never leak into a master-table POST/UPSERT and trigger
  // PostgREST schema-cache errors (PGRST204).
  masters: (x) => ({ id: x.id, code: x.code || "", name: x.name || "" }),
  colorMasters: (x) => ({ id: x.id, code: x.code || "", name: x.name || "", image_url: nullify(x.image) }),
};

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
