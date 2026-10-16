/* QA/QC — pure helpers (no React, no Supabase) */
import { diffDays, todayIso } from "./sampleTestLogic.js";

export const QC_SOURCES = ["Mẫu test", "Mẫu ship", "Hàng Final", "Khác"];
export const QC_RESULTS = ["Pass", "Fail"];
export const QC_STATUSES = ["Mở", "Đang xử lý", "Đã xử lý", "Đạt"];
export const DEFAULT_QC_SETTINGS = {
  categories: [
    "Kích thước / dung sai", "Kết cấu / mối ghép", "Độ bền / tải trọng", "Bề mặt gỗ / nhám", "Sơn / màu sắc",
    "Đan dây", "Khung sắt / mối hàn", "Mặt đá", "Nệm / vải", "Hardware / phụ kiện", "Đóng gói / nhãn", "Khác",
  ],
  severities: ["Nhẹ", "Nặng", "Nghiêm trọng"],
};

export function mergeQcSettings(saved) {
  const s = saved && typeof saved === "object" ? saved : {};
  return {
    categories: Array.isArray(s.categories) && s.categories.length ? s.categories : DEFAULT_QC_SETTINGS.categories,
    severities: Array.isArray(s.severities) && s.severities.length ? s.severities : DEFAULT_QC_SETTINGS.severities,
  };
}

export const qcIdForTest = (testId) => `qc-test-${testId}`;

/** Fields of a QC record that are owned by the test log (re-synced on every test save).
    QC-only fields (category, severity, photos, inspector, qty, status in progress) are never sent,
    so an upsert with merge-duplicates keeps what QA/QC entered in the QC module. */
export function qcFieldsFromTest(test, info) {
  if (!test || test.result === "Chờ KQ") return null;
  const pass = test.result === "Đạt";
  const fields = {
    id: qcIdForTest(test.id),
    source: "Mẫu test",
    trackingId: info.trackingId,
    sampleId: info.sampleId || "",
    testId: test.id,
    erpNo: info.erpNo || "",
    productName: info.productName || "",
    customerId: info.customerId || "",
    stageCode: test.testType === "QA nhà máy" ? "QA" : "KQ_TT",
    stageLabel: test.testType === "QA nhà máy" ? "QA nhà máy test" : `Trung tâm test${test.center ? ` (${test.center})` : ""}`,
    inspectionDate: test.resultDate || test.sentDate || "",
    result: pass ? "Pass" : "Fail",
    defectDescription: pass ? "" : (test.failedItems || ""),
    rootCause: test.rootCause || "",
    correctiveAction: test.capa || "",
    responsible: test.capaOwner || "",
    dueDate: test.capaDue || "",
    completedDate: test.ncrClosedDate || "",
    ncrNo: test.ncrNo || "",
  };
  if (pass) fields.status = "Đạt";
  else if (test.ncrClosedDate) fields.status = "Đã xử lý";
  return fields;
}

export function isQcOpen(r) {
  return r.result === "Fail" && r.status !== "Đã xử lý";
}
export function qcOverdueDays(r, today = todayIso()) {
  if (!isQcOpen(r) || !r.dueDate) return null;
  const d = diffDays(today, r.dueDate);
  return d > 0 ? d : null;
}

export const QC_FILTERS = [
  { key: "open", label: "Lỗi đang mở", tone: "red", test: (r) => isQcOpen(r) },
  { key: "overdue", label: "Quá hạn xử lý", tone: "red", test: (r) => qcOverdueDays(r) !== null },
  { key: "fail", label: "Tất cả Fail", test: (r) => r.result === "Fail" },
  { key: "fixed", label: "Đã xử lý", tone: "green", test: (r) => r.result === "Fail" && r.status === "Đã xử lý" },
  { key: "pass", label: "Pass", tone: "green", test: (r) => r.result === "Pass" },
  { key: "all", label: "Tất cả", test: () => true },
];

export function qcSummary(records, today = todayIso()) {
  const total = records.length;
  const pass = records.filter((r) => r.result === "Pass").length;
  const fail = total - pass;
  const open = records.filter(isQcOpen).length;
  const overdue = records.filter((r) => qcOverdueDays(r, today) !== null).length;
  const fixedWithDates = records.filter((r) => r.result === "Fail" && r.completedDate && r.inspectionDate);
  const avgFixDays = fixedWithDates.length
    ? Math.round(fixedWithDates.reduce((a, r) => a + Math.max(0, diffDays(r.completedDate, r.inspectionDate)), 0) / fixedWithDates.length * 10) / 10
    : null;
  const byCategory = {};
  for (const r of records) if (r.result === "Fail") { const k = r.defectCategory || "(chưa phân loại)"; byCategory[k] = (byCategory[k] || 0) + 1; }
  const pareto = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  return { total, pass, fail, open, overdue, passRate: total ? pass / total : null, avgFixDays, pareto };
}
