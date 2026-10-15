// Run: node tests/sampleTestLogic.test.mjs
// Scenarios mirror the ones verified in the Excel tracker (v4.1–v7).
import assert from "node:assert/strict";
import { computeTracking, mergeSettings, addWorkdays, FILTERS, todayItems, suggestFromProduct } from "../sampleTestLogic.js";

const settings = mergeSettings();
let passed = 0;
const test = (name, fn) => { fn(); passed += 1; console.log("✓", name); };

const base = (weaveOn, extraRows = []) => ({
  tracking: { id: "T", startDate: "2026-10-12", testDeadline: "2026-11-30", weaveOn },
  stepRows: [
    { stepCode: "NHAM", planDate: "2026-10-15" },
    { stepCode: "KHUNG_SAT", planDate: "2026-10-22" },
    { stepCode: "HW", planDate: "2026-10-20" },
    { stepCode: "MAT_DA", notApplicable: true },
    { stepCode: "SON_DA", notApplicable: true },
    { stepCode: "NEM", notApplicable: true },
    ...extraRows,
  ],
  settings,
  today: "2026-10-10",
});

test("WORKDAY.INTL equivalent skips Sundays", () => {
  assert.equal(addWorkdays("2026-10-16", 3, "0000001"), "2026-10-20");
  assert.equal(addWorkdays("2026-10-15", 0, "0000001"), "2026-10-15");
});

test("chain nhám → giao lên sơn → sơn gỗ", () => {
  const c = computeTracking(base("wood"));
  assert.equal(c.byCode.GIAO_SON.plan, "2026-10-16");
  assert.equal(c.byCode.SON_GO.plan, "2026-10-20");
});

test("đan trên khung gỗ: đan dây theo sơn gỗ dù có khung sắt", () => {
  const c = computeTracking(base("wood"));
  assert.equal(c.byCode.DAN_DAY.plan, "2026-10-24");
  assert.equal(c.byCode.LAP_RAP.plan, "2026-10-27");
});

test("không đan: bỏ qua đan dây, lắp ráp chỉ chờ gỗ/khung/HW", () => {
  const c = computeTracking(base("none"));
  assert.equal(c.byCode.DAN_DAY.na, true);
  assert.equal(c.byCode.LAP_RAP.plan, "2026-10-24");
});

test("đan trên khung sắt / cả hai", () => {
  for (const w of ["iron", "both"]) {
    const c = computeTracking(base(w));
    assert.equal(c.byCode.DAN_DAY.plan, "2026-10-27");
    assert.equal(c.byCode.LAP_RAP.plan, "2026-10-29");
  }
});

test("chưa chọn đan dây: báo trạng thái và dùng quy tắc x/d", () => {
  const c = computeTracking(base(""));
  assert.equal(c.status, "Chưa chọn đan dây trên");
  assert.equal(c.byCode.DAN_DAY.plan, "2026-10-27");
});

test("không khung sắt + chưa chọn: fallback d = sơn gỗ", () => {
  const c = computeTracking(base("", [{ stepCode: "KHUNG_SAT", notApplicable: true }]));
  assert.equal(c.byCode.DAN_DAY.plan, "2026-10-24");
});

test("sơn gỗ trễ 2 ngày: đan dây và lắp ráp lùi theo", () => {
  const c = computeTracking(base("wood", [{ stepCode: "NHAM", planDate: "2026-10-15", actualDate: "2026-10-15" }, { stepCode: "GIAO_SON", actualDate: "2026-10-16" }, { stepCode: "SON_GO", actualDate: "2026-10-22" }]));
  assert.equal(c.byCode.DAN_DAY.forecast, "2026-10-26");
  assert.equal(c.byCode.DAN_DAY.plan, "2026-10-24");
});

test("xong sớm: mặc định KHÔNG kéo lịch sau sớm lên", () => {
  const c = computeTracking(base("wood", [{ stepCode: "NHAM", planDate: "2026-10-15", actualDate: "2026-10-13" }]));
  assert.equal(c.byCode.NHAM.status, "Xong sớm");
  assert.equal(c.byCode.GIAO_SON.forecast, "2026-10-16");
  const c2 = computeTracking({ ...base("wood", [{ stepCode: "NHAM", planDate: "2026-10-15", actualDate: "2026-10-13" }]), settings: mergeSettings({ pullEarly: true }) });
  assert.equal(c2.byCode.GIAO_SON.forecast, "2026-10-14");
});

test("2 bước cùng hạn (HW + Nệm 10/10) đều được liệt kê", () => {
  const input = {
    tracking: { id: "T2", startDate: "2026-10-01", weaveOn: "none" },
    stepRows: [
      { stepCode: "NHAM", planDate: "2026-10-05", actualDate: "2026-10-05" },
      { stepCode: "GIAO_SON", actualDate: "2026-10-06" },
      { stepCode: "SON_GO", actualDate: "2026-10-09" },
      { stepCode: "KHUNG_SAT", notApplicable: true },
      { stepCode: "MAT_DA", notApplicable: true }, { stepCode: "SON_DA", notApplicable: true },
      { stepCode: "HW", planDate: "2026-10-10" }, { stepCode: "NEM", planDate: "2026-10-10" },
    ],
    settings, today: "2026-10-10",
  };
  const c = computeTracking(input);
  assert.deepEqual(c.nextSteps.map((s) => s.short), ["Hardware", "Nệm"]);
  assert.equal(c.status, "Đến hạn hôm nay");
  assert.equal(c.gate, "Chờ");
  const items = todayItems([{ computed: c }], "2026-10-10");
  assert.equal(items.filter((i) => i.date === "2026-10-10").length, 2);
});

test("Hardware theo chi tiết: chỉ xong khi mọi dòng IQC đạt", () => {
  const parts = [
    { stepCode: "HW", itemName: "Ốc M6", promisedDate: "2026-10-16", receivedDate: "2026-10-15", iqcResult: "Đạt" },
    { stepCode: "HW", itemName: "Tạ 10kg", promisedDate: "2026-10-18", iqcResult: "Chờ" },
  ];
  const input = base("wood");
  input.stepRows = input.stepRows.filter((r) => r.stepCode !== "HW");
  let c = computeTracking({ ...input, parts });
  assert.equal(c.byCode.HW.actual, null);
  assert.equal(c.byCode.HW.plan, "2026-10-18");
  assert.equal(FILTERS.find((f) => f.key === "miss:HW").test(c), true);
  c = computeTracking({ ...input, parts: [parts[0], { ...parts[1], rescheduledDate: "2026-10-21" }] });
  assert.equal(c.byCode.HW.forecast, "2026-10-21");
  // one line late (promised 18/10, today 20/10, not rescheduled) → step is late, today list shows the line
  const late = computeTracking({ ...input, parts: [parts[0], parts[1], { stepCode: "HW", itemName: "Pas", promisedDate: "2026-10-25", iqcResult: "Chờ" }], today: "2026-10-20" });
  assert.equal(late.byCode.HW.status, "Trễ");
  assert.equal(late.byCode.HW.forecast, "2026-10-25");
  const li = todayItems([{ computed: late }], "2026-10-20").filter((i) => i.step.code === "HW");
  assert.deepEqual(li.map((i) => [i.part.itemName, i.status]), [["Tạ 10kg", "Trễ"], ["Pas", "Sắp đến hạn"]]);
  c = computeTracking({ ...input, parts: [parts[0], { ...parts[1], receivedDate: "2026-10-19", iqcResult: "Đạt" }] });
  assert.equal(c.byCode.HW.actual, "2026-10-19");
  assert.equal(FILTERS.find((f) => f.key === "miss:HW").test(c), false);
});

test("nhật ký test: QA fail rồi đạt, gửi TT đang chờ KQ", () => {
  const tests = [
    { testType: "QA nhà máy", sentDate: "2026-09-26", resultDate: "2026-09-26", result: "Không đạt", createdAt: "1" },
    { testType: "QA nhà máy", sentDate: "2026-09-30", resultDate: "2026-09-30", result: "Đạt", createdAt: "2" },
    { testType: "Trung tâm", sentDate: "2026-10-02", result: "Chờ KQ", createdAt: "3" },
  ];
  const c = computeTracking({ ...base("wood"), tests });
  assert.equal(c.byCode.QA.actual, "2026-09-30");
  assert.equal(c.byCode.DI_TT.actual, "2026-10-02");
  assert.equal(c.failQA, 1);
  assert.equal(c.status, "Đang chờ KQ test");
  assert.equal(c.tests[1].attempt, 2);
});

test("thiếu ngày ấn định", () => {
  const input = base("wood");
  input.stepRows = input.stepRows.filter((r) => r.stepCode !== "NHAM");
  const c = computeTracking(input);
  assert.equal(c.status, "Thiếu ngày ấn định");
  assert.deepEqual(c.missingFixedSteps.map((s) => s.code), ["NHAM"]);
});

test("gợi ý N/A từ thông số sản phẩm", () => {
  const lists = { mainMaterials: [{ id: "MAM0003", name: "F1 Acacia" }] };
  const s = suggestFromProduct({ mainMaterialId: "MAM0003", cemboardColorId: "CBC1" }, lists);
  assert.deepEqual(s.na.sort(), ["KHUNG_SAT", "NEM"]);
  assert.equal(s.weaveOn, "none");
});

console.log(`\n${passed} scenarios passed`);
