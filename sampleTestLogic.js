/* ------------------------------------------------------------------
   Sample Test Tracking — pure scheduling logic (no React, no Supabase).
   Ported 1:1 from the Excel tracker "Theo_doi_tien_do_mau_test.xlsx" v7:
   KH gốc (baseline) / Dự kiến (forecast) / Thực tế (actual), reschedule,
   predecessor rules with fallback, "Đan dây trên" override, assembly gate,
   test log. Dates are ISO strings "YYYY-MM-DD".
------------------------------------------------------------------- */

export const PLACES = ["Nhà máy", "Thuê ngoài", "CS", "Trung tâm test"];
export const WEAVE_OPTIONS = [
  { value: "iron", label: "Khung sắt" },
  { value: "wood", label: "Khung gỗ" },
  { value: "both", label: "Cả hai" },
  { value: "none", label: "Không đan" },
];
export const IQC_RESULTS = ["Chờ", "Đạt", "Không đạt"];
export const TEST_TYPES = ["QA nhà máy", "Trung tâm"];
export const TEST_RESULTS = ["Chờ KQ", "Đạt", "Không đạt"];

// planType: "fixed" = ngày ấn định (nhập tay) | "lead" = tính theo lead time
// source:   "input" | "log_qa" | "log_send" | "log_result"
// preds:    bước phải xong trước (x) ; fallback: dùng khi mọi bước x là N/A (d)
export const DEFAULT_STEPS = [
  { code: "NHAM", name: "Hoàn thành nhám nguội", short: "Nhám nguội", dept: "Xưởng nguội / QC", place: "Nhà máy", planType: "fixed", lead: 5, preds: [], fallback: [], source: "input", criteria: "QC công đoạn ký đạt (kích thước, độ nhẵn, mối ghép)" },
  { code: "GIAO_SON", name: "Nhám nguội giao lên sơn", short: "Giao lên sơn", dept: "Xưởng nguội → Xưởng sơn / QC", place: "Nhà máy", planType: "lead", lead: 1, preds: ["NHAM"], fallback: [], source: "input", criteria: "Hàng đã QC kiểm ĐẠT và bàn giao lên khu sơn (phiếu giao nhận)" },
  { code: "SON_GO", name: "Hoàn thành sơn gỗ", short: "Sơn gỗ", dept: "Xưởng sơn / QC", place: "Nhà máy", planType: "lead", lead: 3, preds: ["GIAO_SON"], fallback: [], source: "input", criteria: "Màu đúng mẫu duyệt, khô hoàn toàn, QC ký đạt" },
  { code: "KHUNG_SAT", name: "Hoàn thành khung sắt", short: "Khung sắt", dept: "NCC ngoài · Thu mua follow / IQC", place: "Thuê ngoài", planType: "fixed", lead: 7, preds: [], fallback: [], source: "input", criteria: "NCC giao khung đúng bản vẽ + IQC nhận hàng ĐẠT" },
  { code: "DAN_DAY", name: "Hoàn thành đan dây", short: "Đan dây", dept: "Tổ đan / QC", place: "Nhà máy", planType: "lead", lead: 4, preds: ["KHUNG_SAT"], fallback: ["SON_GO"], source: "input", criteria: "Đúng kiểu đan, độ căng, không lỏng/xù, QC ký đạt" },
  { code: "MAT_DA", name: "Hoàn thành mặt đá", short: "Mặt đá", dept: "Xưởng đá / QC", place: "Nhà máy", planType: "lead", lead: 7, preds: [], fallback: [], source: "input", criteria: "Đúng bản vẽ, không nứt/mẻ, QC ký đạt" },
  { code: "SON_DA", name: "Hoàn thành sơn mặt đá", short: "Sơn mặt đá", dept: "Xưởng sơn / QC", place: "Nhà máy", planType: "lead", lead: 2, preds: ["MAT_DA"], fallback: [], source: "input", criteria: "Phủ đều, khô, QC ký đạt" },
  { code: "HW", name: "Hoàn thành Hardwares", short: "Hardware", dept: "NCC ngoài · Thu mua follow / IQC", place: "Thuê ngoài", planType: "fixed", lead: 10, preds: [], fallback: [], source: "input", criteria: "Đủ chi tiết theo BOM (ốc, pas, tạ...) + IQC ĐẠT" },
  { code: "NEM", name: "Hoàn thành Nệm", short: "Nệm", dept: "NCC ngoài · Thu mua follow / IQC", place: "Thuê ngoài", planType: "fixed", lead: 7, preds: [], fallback: [], source: "input", criteria: "Đúng vải/màu/kích thước + IQC ĐẠT" },
  { code: "LAP_RAP", name: "Hoàn thành lắp ráp", short: "Lắp ráp", dept: "Xưởng lắp ráp", place: "Nhà máy", planType: "lead", lead: 2, preds: ["NHAM", "GIAO_SON", "SON_GO", "KHUNG_SAT", "DAN_DAY", "MAT_DA", "SON_DA", "HW", "NEM"], fallback: [], source: "input", criteria: "Lắp đủ, kiểm chức năng, chụp ảnh mẫu hoàn chỉnh" },
  { code: "QA", name: "QA nhà máy test đạt", short: "QA nhà máy", dept: "QA nhà máy", place: "Nhà máy", planType: "lead", lead: 2, preds: ["LAP_RAP"], fallback: [], source: "log_qa", criteria: "Biên bản test nội bộ ĐẠT (lần đạt đầu tiên trong nhật ký test)" },
  { code: "DI_TT", name: "Mang sản phẩm đi trung tâm test", short: "Đi TT test", dept: "CS / Kế hoạch", place: "CS", planType: "lead", lead: 1, preds: ["QA"], fallback: [], source: "log_send", criteria: "Biên bản giao mẫu (ngày gửi lần đầu trong nhật ký test)" },
  { code: "KQ_TT", name: "Có KQ test trung tâm (đạt)", short: "KQ TT đạt", dept: "Trung tâm test → CS", place: "Trung tâm test", planType: "lead", lead: 10, preds: ["DI_TT"], fallback: [], source: "log_result", criteria: "Report KẾT QUẢ ĐẠT" },
  { code: "NHAN_VE", name: "Mang hàng từ trung tâm về", short: "Nhận mẫu về", dept: "CS / QA", place: "CS", planType: "lead", lead: 3, preds: ["KQ_TT"], fallback: [], source: "input", criteria: "Mẫu về kho, dán tem mẫu đối chứng, lưu hồ sơ" },
];

export const ASSEMBLY = "LAP_RAP";
export const SEND = "DI_TT";
export const LAST = "NHAN_VE";
export const WEAVE = "DAN_DAY";
export const WOOD = "SON_GO";
export const IRON = "KHUNG_SAT";

export const DEFAULT_SETTINGS = {
  steps: DEFAULT_STEPS,
  pullEarly: false,          // Kéo lịch các bước sau sớm lên khi 1 bước xong sớm
  warnDays: 3,               // Số ngày cảnh báo "Sắp đến hạn"
  warnDaysOutsourced: 5,     // Nhắc NCC sớm hơn
  weekOff: "0000001",        // T2→CN, 1 = nghỉ (mặc định nghỉ Chủ nhật)
  holidays: [],              // ["2027-01-01", ...]
};

/** Merge saved settings over defaults. Steps are matched by code, so new
    default steps appear automatically and the saved order is respected. */
export function mergeSettings(saved) {
  const s = saved && typeof saved === "object" ? saved : {};
  const savedSteps = Array.isArray(s.steps) ? s.steps : [];
  const byCode = new Map(savedSteps.map((x) => [x.code, x]));
  const steps = DEFAULT_STEPS.map((d) => ({ ...d, ...(byCode.get(d.code) || {}), code: d.code, source: d.source }));
  return {
    ...DEFAULT_SETTINGS,
    ...s,
    steps,
    holidays: Array.isArray(s.holidays) ? s.holidays.filter(Boolean) : [],
  };
}

/* ---------------- date helpers (UTC, no timezone drift) ---------------- */
export function toDate(iso) {
  if (!iso) return null;
  const [y, m, d] = String(iso).slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(Date.UTC(y, m - 1, d));
}
export function toIso(date) {
  return date ? date.toISOString().slice(0, 10) : null;
}
export function addDays(iso, n) {
  const d = toDate(iso);
  if (!d) return null;
  d.setUTCDate(d.getUTCDate() + n);
  return toIso(d);
}
export function diffDays(a, b) {
  const da = toDate(a), db = toDate(b);
  if (!da || !db) return null;
  return Math.round((da - db) / 86400000);
}
export function maxIso(list) {
  const v = (list || []).filter(Boolean).sort();
  return v.length ? v[v.length - 1] : null;
}
export function minIso(list) {
  const v = (list || []).filter(Boolean).sort();
  return v.length ? v[0] : null;
}
export function todayIso() {
  const now = new Date();
  return toIso(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())));
}

/** Same as Excel WORKDAY.INTL(start, n, weekOff, holidays) for n >= 0. */
export function addWorkdays(iso, n, weekOff = "0000001", holidays = []) {
  const start = toDate(iso);
  if (!start) return null;
  const off = String(weekOff || "0000000").padEnd(7, "0");
  const hol = new Set(holidays || []);
  const d = new Date(start);
  let left = Math.max(0, Number(n) || 0);
  while (left > 0) {
    d.setUTCDate(d.getUTCDate() + 1);
    const mon0 = (d.getUTCDay() + 6) % 7; // Monday = 0 … Sunday = 6
    if (off[mon0] === "1") continue;
    if (hol.has(toIso(d))) continue;
    left -= 1;
  }
  return toIso(d);
}

/* ---------------- test log ---------------- */
export function orderedTests(tests) {
  return [...(tests || [])].sort((a, b) => {
    const ka = a.sentDate || a.resultDate || "9999";
    const kb = b.sentDate || b.resultDate || "9999";
    if (ka !== kb) return ka < kb ? -1 : 1;
    return String(a.createdAt || "").localeCompare(String(b.createdAt || ""));
  });
}
export function numberTests(tests) {
  const counters = {};
  return orderedTests(tests).map((t) => {
    counters[t.testType] = (counters[t.testType] || 0) + 1;
    return { ...t, attempt: counters[t.testType] };
  });
}

/* ---------------- core computation ---------------- */
function partsDerived(parts) {
  if (!parts.length) return { actual: null, plan: null, forecast: null, rescheduled: false };
  const allPassed = parts.every((p) => p.iqcResult === "Đạt" && p.receivedDate);
  const actual = allPassed ? maxIso(parts.map((p) => p.receivedDate)) : null;
  const plan = maxIso(parts.map((p) => p.promisedDate));
  const rescheduled = parts.some((p) => p.rescheduledDate && !(p.iqcResult === "Đạt" && p.receivedDate));
  const forecast = maxIso(parts.map((p) => (p.iqcResult === "Đạt" && p.receivedDate) ? p.receivedDate : (p.rescheduledDate || p.promisedDate)));
  return { actual, plan, forecast, rescheduled };
}

function partStatus(p, today, warn) {
  if (p.iqcResult === "Đạt" && p.receivedDate) return "Đã về – IQC đạt";
  if (p.iqcResult === "Không đạt") return "IQC không đạt";
  const due = p.rescheduledDate || p.promisedDate;
  if (!due) return "Chưa có ngày hẹn";
  const left = diffDays(due, today);
  if (left < 0) return "Trễ";
  if (left === 0) return "Đến hạn hôm nay";
  if (left <= warn) return "Sắp đến hạn";
  return "Chưa đến hạn";
}

/**
 * Compute every date and status for one tracking.
 * @param {object} p
 *   tracking: { id, startDate, testDeadline, weaveOn, status }
 *   stepRows: [{ stepCode, planDate, actualDate, notApplicable, rescheduleDate, note }]
 *   parts:    [{ stepCode, itemName, promisedDate, rescheduledDate, receivedDate, iqcResult, ... }]
 *   tests:    [{ testType, sentDate, resultDate, result, createdAt, ... }]
 *   settings: mergeSettings(...)
 *   today:    "YYYY-MM-DD"
 */
export function computeTracking({ tracking, stepRows = [], parts = [], tests = [], settings, today }) {
  const cfg = settings || mergeSettings();
  const t = tracking || {};
  const now = today || todayIso();
  const rowBy = new Map(stepRows.map((r) => [r.stepCode, r]));
  const numbered = numberTests(tests);
  const qaPass = numbered.filter((x) => x.testType === "QA nhà máy" && x.result === "Đạt");
  const ttAll = numbered.filter((x) => x.testType === "Trung tâm");
  const ttPass = ttAll.filter((x) => x.result === "Đạt");

  const S = {}; // code -> computed step
  const steps = [];
  for (const def of cfg.steps) {
    const row = rowBy.get(def.code) || {};
    const myParts = parts.filter((p) => p.stepCode === def.code);
    const pd = partsDerived(myParts);
    const na = Boolean(row.notApplicable) || (def.code === WEAVE && t.weaveOn === "none");

    // Thực tế
    let actual = null;
    if (!na) {
      if (def.source === "log_qa") actual = minIso(qaPass.map((x) => x.resultDate || x.sentDate));
      else if (def.source === "log_send") actual = minIso(ttAll.map((x) => x.sentDate));
      else if (def.source === "log_result") actual = maxIso(ttPass.map((x) => x.resultDate));
      else if (myParts.length) actual = pd.actual;
      else actual = row.actualDate || null;
    }

    // Which predecessors count for this sample
    let usedPreds = [];
    if (def.code === WEAVE && ["iron", "wood", "both"].includes(t.weaveOn)) {
      usedPreds = t.weaveOn === "iron" ? [IRON] : t.weaveOn === "wood" ? [WOOD] : [WOOD, IRON];
    } else {
      const xs = (def.preds || []).filter((c) => S[c]);
      const applicableX = xs.filter((c) => !S[c].na);
      usedPreds = applicableX.length ? xs : (def.fallback || []).filter((c) => S[c]);
    }

    // KH gốc
    let plan = null;
    let planSource = "";
    if (!na) {
      if (row.planDate) { plan = row.planDate; planSource = def.planType === "fixed" ? "fixed" : "manual"; }
      else if (def.planType === "fixed") { plan = pd.plan; planSource = pd.plan ? "parts" : ""; }
      else if (t.startDate) {
        const base = maxIso([t.startDate, ...usedPreds.map((c) => S[c].plan)]);
        plan = addWorkdays(base, def.lead, cfg.weekOff, cfg.holidays);
        planSource = "lead";
      }
    }

    // Hẹn lại
    const reschedule = na ? null : (myParts.length && pd.rescheduled ? pd.forecast : (row.rescheduleDate || null));

    // Dự kiến
    let shift = 0;
    const predLags = usedPreds.map((c) => S[c].lag).filter((v) => typeof v === "number");
    if (predLags.length) shift = Math.max(cfg.pullEarly ? -99999 : 0, Math.max(...predLags));
    let forecast = null;
    if (!na) {
      if (actual) forecast = actual;
      else if (reschedule) forecast = reschedule;
      else if (plan) forecast = addDays(plan, shift);
    }
    const lag = forecast && plan ? diffDays(forecast, plan) : null;

    // Trạng thái bước
    const warn = def.place === "Thuê ngoài" ? cfg.warnDaysOutsourced : cfg.warnDays;
    const partRows = myParts.map((p) => ({ ...p, status: partStatus(p, now, warn), due: p.rescheduledDate || p.promisedDate || "" }));
    const latePart = !na && !actual ? minIso(partRows.filter((p) => p.status === "Trễ").map((p) => p.due)) : null;
    let status = "";
    if (na) status = "N/A";
    else if (actual) status = !plan ? "Xong" : actual < plan ? "Xong sớm" : actual === plan ? "Xong đúng hạn" : "Xong trễ";
    else if (forecast) {
      const left = diffDays(forecast, now);
      status = left < 0 ? "Trễ" : left === 0 ? "Đến hạn hôm nay" : left <= warn ? "Sắp đến hạn" : "Chưa đến hạn";
    }
    // A single late part line makes the whole step late, even if other lines arrive later.
    if (latePart) status = "Trễ";
    const deviation = actual && plan ? diffDays(actual, plan) : (forecast && plan ? diffDays(forecast, plan) : null);
    const daysLeft = latePart ? diffDays(latePart, now) : (!actual && forecast ? diffDays(forecast, now) : null);
    const missingFixed = def.planType === "fixed" && !na && !plan && !actual;

    const out = {
      ...def, na, actual, plan, planSource, reschedule, forecast, lag, shift, status, deviation, daysLeft,
      missingFixed, usedPreds, parts: partRows, latePart,
      hasParts: myParts.length > 0, row,
    };
    S[def.code] = out;
    steps.push(out);
  }

  // ---- tracking-level summary ----
  const open = steps.filter((s) => !s.na && !s.actual && s.forecast);
  const nextDate = minIso(open.map((s) => s.forecast));
  const nextSteps = nextDate ? open.filter((s) => s.forecast === nextDate) : [];
  const daysLeft = nextDate ? diffDays(nextDate, now) : null;
  const overdue = steps.filter((s) => s.status === "Trễ");

  const asm = S[ASSEMBLY];
  let gate = "";
  let gateMissing = [];
  if (asm) {
    if (asm.actual) gate = "Đã lắp ráp";
    else {
      gateMissing = (asm.preds || []).map((c) => S[c]).filter((s) => s && !s.na && !s.actual);
      gate = gateMissing.length ? "Chờ" : "Sẵn sàng";
    }
  }

  const latest = numbered.length ? numbered[numbered.length - 1] : null;
  const failQA = numbered.filter((x) => x.testType === "QA nhà máy" && x.result === "Không đạt").length;
  const failTT = numbered.filter((x) => x.testType === "Trung tâm" && x.result === "Không đạt").length;

  const send = S[SEND];
  let expectedSend = null;
  if (send) {
    if (send.actual) expectedSend = send.actual;
    else if (send.forecast) {
      const sendIdx = steps.indexOf(send);
      const before = steps.slice(0, sendIdx).filter((s) => !s.na && !s.actual && s.forecast);
      const earliest = minIso(before.map((s) => s.forecast));
      const delay = earliest ? Math.max(0, diffDays(now, earliest)) : 0;
      expectedSend = addDays(send.forecast, delay);
    }
  }
  const riskDays = expectedSend && t.testDeadline ? diffDays(expectedSend, t.testDeadline) : null;
  const risk = riskDays === null ? "" : riskDays > 0 ? `Trễ ${riskDays} ngày` : "OK";

  const missingFixedSteps = steps.filter((s) => s.missingFixed);
  const weaveStep = S[WEAVE];
  const weaveUnset = weaveStep && !t.weaveOn && !weaveStep.na && !weaveStep.actual;

  let status;
  if (S[LAST]?.actual) status = "Hoàn tất";
  else if (missingFixedSteps.length) status = "Thiếu ngày ấn định";
  else if (weaveUnset) status = "Chưa chọn đan dây trên";
  else if (latest?.result === "Không đạt") status = "Fail – đang làm lại";
  else if (latest?.result === "Chờ KQ") status = "Đang chờ KQ test";
  else if (overdue.length) status = "Trễ";
  else if (daysLeft === null) status = t.startDate ? "Đúng tiến độ" : "Chưa có ngày bắt đầu";
  else if (daysLeft === 0) status = "Đến hạn hôm nay";
  else if (daysLeft <= cfg.warnDays) status = "Sắp đến hạn";
  else status = "Đúng tiến độ";

  return {
    steps, byCode: S, nextDate, nextSteps, daysLeft, overdueCount: overdue.length, gate, gateMissing,
    tests: numbered, latest, failQA, failTT, expectedSend, risk, riskDays, missingFixedSteps, weaveUnset, status,
  };
}

/* ---------------- filters used by the list view ---------------- */
export const FILTERS = [
  { key: "active", label: "Đang theo dõi", test: (c) => c.status !== "Hoàn tất" },
  { key: "late", label: "Trễ", tone: "red", test: (c) => c.overdueCount > 0 },
  { key: "today", label: "Đến hạn hôm nay", tone: "amber", test: (c) => c.steps.some((s) => s.status === "Đến hạn hôm nay") },
  { key: "soon", label: "Sắp đến hạn", tone: "amber", test: (c) => c.steps.some((s) => s.status === "Sắp đến hạn") },
  { key: "miss:HW", label: "Thiếu Hardware", test: (c) => isMissing(c, "HW") },
  { key: "miss:NEM", label: "Thiếu nệm", test: (c) => isMissing(c, "NEM") },
  { key: "miss:KHUNG_SAT", label: "Thiếu khung sắt", test: (c) => isMissing(c, "KHUNG_SAT") },
  { key: "ready", label: "Sẵn sàng lắp ráp", tone: "green", test: (c) => c.gate === "Sẵn sàng" },
  { key: "waiting", label: "Chờ KQ test", tone: "teal", test: (c) => c.latest?.result === "Chờ KQ" },
  { key: "fail", label: "Fail – làm lại", tone: "red", test: (c) => c.latest?.result === "Không đạt" },
  { key: "fixed", label: "Thiếu ngày ấn định / chưa chọn đan dây", tone: "red", test: (c) => c.missingFixedSteps.length > 0 || c.weaveUnset },
  { key: "risk", label: "Nguy cơ trễ hạn test", tone: "red", test: (c) => c.riskDays > 0 },
  { key: "done", label: "Hoàn tất", tone: "green", test: (c) => c.status === "Hoàn tất" },
  { key: "all", label: "Tất cả", test: () => true },
];
export function isMissing(c, code) {
  const s = c.byCode[code];
  return Boolean(s && !s.na && !s.actual);
}

/** Flattened "Việc hôm nay" list: every step — or, for steps tracked by part
    lines, every part line — that is late / due today / due soon. */
const FOLLOW = ["Trễ", "Đến hạn hôm nay", "Sắp đến hạn"];
export function todayItems(entries, today = todayIso()) {
  const items = [];
  for (const e of entries) {
    for (const s of e.computed.steps) {
      if (s.na || s.actual) continue;
      const open = s.parts.filter((p) => !(p.iqcResult === "Đạt" && p.receivedDate));
      if (open.length) {
        for (const p of open) {
          if (!FOLLOW.includes(p.status) && p.status !== "IQC không đạt") continue;
          const date = p.due || s.forecast;
          items.push({ entry: e, step: s, part: p, date, status: p.status, daysLeft: date ? diffDays(date, today) : null });
        }
      } else if (FOLLOW.includes(s.status)) {
        items.push({ entry: e, step: s, part: null, date: s.forecast, status: s.status, daysLeft: s.daysLeft });
      }
    }
  }
  return items.sort((a, b) => String(a.date || "9999").localeCompare(String(b.date || "9999")));
}

/** Suggest N/A steps and weave option from the product spec in the ERP. */
export function suggestFromProduct(product, materialLists = {}) {
  const p = product || {};
  const mainName = (materialLists.mainMaterials || []).find((m) => m.id === p.mainMaterialId)?.name || "";
  const hasRope = Boolean(p.ropeTypeId);
  const hasMetal = Boolean(String(p.metalName || "").trim()) || /sắt|steel|metal|alu/i.test(mainName);
  const hasStone = Boolean(p.cemboardColorId);
  const hasCushion = Boolean(p.fabricTypeId) || /cushion|nệm/i.test(mainName);
  const hasWood = /acacia|teak|eucalyptus|oak|wood|gỗ|ply|mdf/i.test(mainName) || Boolean(p.woodSurfaceTreatmentId);
  const na = [];
  if (!hasMetal) na.push("KHUNG_SAT");
  if (!hasStone) na.push("MAT_DA", "SON_DA");
  if (!hasCushion) na.push("NEM");
  if (!hasWood) na.push("NHAM", "GIAO_SON", "SON_GO");
  let weaveOn = "";
  if (!hasRope) weaveOn = "none";
  else if (hasMetal && !hasWood) weaveOn = "iron";
  else if (hasWood && !hasMetal) weaveOn = "wood";
  return { na, weaveOn };
}
