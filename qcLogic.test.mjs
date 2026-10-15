// Run: node tests/qcLogic.test.mjs
import assert from "node:assert/strict";
import { qcFieldsFromTest, qcIdForTest, qcSummary, qcOverdueDays, QC_FILTERS, isQcOpen } from "../qcLogic.js";
let n = 0; const test = (name, fn) => { fn(); n += 1; console.log("✓", name); };
const info = { trackingId: "T1", sampleId: "SA1", erpNo: "ERP1", productName: "Table", customerId: "C1" };

test("test 'Chờ KQ' không tạo phiếu QC", () => {
  assert.equal(qcFieldsFromTest({ id: "x", testType: "Trung tâm", result: "Chờ KQ" }, info), null);
});
test("QA fail → phiếu Fail, không gửi status (giữ trạng thái QC đã cập nhật)", () => {
  const f = qcFieldsFromTest({ id: "x1", testType: "QA nhà máy", sentDate: "2026-09-26", resultDate: "2026-09-26", result: "Không đạt", failedItems: "Chân lắc", rootCause: "Mộng lỏng", capa: "Gia cố", capaOwner: "Lắp ráp", capaDue: "2026-09-29" }, info);
  assert.equal(f.id, qcIdForTest("x1"));
  assert.equal(f.result, "Fail");
  assert.equal(f.stageCode, "QA");
  assert.equal(f.defectDescription, "Chân lắc");
  assert.equal("status" in f, false);
  assert.equal("defectCategory" in f, false);
  assert.equal("photos" in f, false);
});
test("NCR đã đóng → Đã xử lý; test đạt → Pass/Đạt", () => {
  assert.equal(qcFieldsFromTest({ id: "x", testType: "QA nhà máy", result: "Không đạt", ncrClosedDate: "2026-09-29" }, info).status, "Đã xử lý");
  const p = qcFieldsFromTest({ id: "y", testType: "Trung tâm", center: "Intertek", sentDate: "2026-10-02", resultDate: "2026-10-12", result: "Đạt" }, info);
  assert.equal(p.result, "Pass"); assert.equal(p.status, "Đạt"); assert.equal(p.stageCode, "KQ_TT"); assert.match(p.stageLabel, /Intertek/);
});
test("quá hạn xử lý & bộ lọc", () => {
  const recs = [
    { id: 1, result: "Fail", status: "Mở", dueDate: "2026-10-10", inspectionDate: "2026-10-05", defectCategory: "Sơn / màu sắc" },
    { id: 2, result: "Fail", status: "Đã xử lý", dueDate: "2026-10-10", inspectionDate: "2026-10-01", completedDate: "2026-10-04", defectCategory: "Sơn / màu sắc" },
    { id: 3, result: "Fail", status: "Đang xử lý", inspectionDate: "2026-10-12", defectCategory: "Hardware / phụ kiện" },
    { id: 4, result: "Pass", status: "Đạt", inspectionDate: "2026-10-12" },
  ];
  assert.equal(qcOverdueDays(recs[0], "2026-10-15"), 5);
  assert.equal(qcOverdueDays(recs[1], "2026-10-15"), null);
  assert.equal(recs.filter(isQcOpen).length, 2);
  const s = qcSummary(recs, "2026-10-15");
  assert.equal(s.total, 4); assert.equal(s.pass, 1); assert.equal(s.open, 2); assert.equal(s.overdue, 1); assert.equal(s.avgFixDays, 3);
  assert.deepEqual(s.pareto[0], ["Sơn / màu sắc", 2]);
  assert.equal(recs.filter(QC_FILTERS.find((f) => f.key === "pass").test).length, 1);
});
console.log(`\n${n} scenarios passed`);
