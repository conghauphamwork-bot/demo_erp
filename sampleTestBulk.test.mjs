// node tests/sampleTestBulk.test.mjs
import assert from "node:assert/strict";
import { computeTracking, mergeSettings } from "../sampleTestLogic.js";
import { planBulk } from "../sampleTestBulk.js";

const settings = mergeSettings();
const mk = (id, weaveOn, stepRows = [], parts = []) => {
  const tracking = { id, erpNo: "E-" + id, lsxNo: "LSX-1", startDate: "2026-10-01", weaveOn, status: "Active" };
  return { id, tracking, info: { erpNo: tracking.erpNo }, computed: computeTracking({ tracking, stepRows, parts, tests: [], settings, today: "2026-10-15" }) };
};
const row = (t, code, x) => ({ id: `${t}:${code}`, trackingId: t, stepCode: code, planDate: "", actualDate: "", notApplicable: false, rescheduleDate: "", note: "", ...x });
const E = [
  mk("a", "wood"),
  mk("b", "wood", [row("b", "SON_GO", { actualDate: "2026-10-10" })]),
  mk("c", "none", [row("c", "MAT_DA", { notApplicable: true })]),
  mk("d", "wood", [], [{ id: "p", trackingId: "d", stepCode: "HW", itemName: "Ốc", promisedDate: "2026-10-20", iqcResult: "Chờ" }]),
];
const ids = E.map((e) => e.id);

// 1. "Xong hôm nay" Sơn gỗ: a written, b kept (already has date, no overwrite)
let r = planBulk(E, ids, { stepCode: "SON_GO", field: "actual", value: "2026-10-15" });
assert.deepEqual(r.rows.map((x) => x.trackingId), ["a", "c", "d"]);
assert.ok(r.skipped.find((s) => s.id === "b" && /đã có ngày/.test(s.reason)));
assert.equal(r.prev.find((x) => x.trackingId === "a").actualDate, "", "undo restores blank");
// overwrite
r = planBulk(E, ["b"], { stepCode: "SON_GO", field: "actual", value: "2026-10-15", overwrite: true });
assert.equal(r.rows[0].actualDate, "2026-10-15"); assert.equal(r.prev[0].actualDate, "2026-10-10");

// 2. N/A step, parts step, Không đan, log step, Lắp ráp N/A
r = planBulk(E, ids, { stepCode: "MAT_DA", field: "actual", value: "2026-10-15" });
assert.ok(r.skipped.find((s) => s.id === "c" && s.reason === "đang N/A"));
r = planBulk(E, ["d"], { stepCode: "HW", field: "actual", value: "2026-10-15" });
assert.match(r.skipped[0].reason, /chi tiết vật tư/);
r = planBulk(E, ["c"], { stepCode: "DAN_DAY", field: "actual", value: "2026-10-15" });
assert.match(r.skipped[0].reason, /Không đan/);
r = planBulk(E, ["a"], { stepCode: "QA", field: "actual", value: "2026-10-15" });
assert.match(r.skipped[0].reason, /nhật ký test/);
r = planBulk(E, ["a"], { stepCode: "LAP_RAP", field: "actual", value: "N/A" });
assert.match(r.skipped[0].reason, /Lắp ráp/);

// 3. N/A + clear + plan only on fixed steps + reschedule
r = planBulk(E, ["a", "c"], { stepCode: "MAT_DA", field: "actual", value: "N/A" });
assert.equal(r.rows.length, 1); assert.equal(r.unchanged, 1); assert.equal(r.rows[0].notApplicable, true);
r = planBulk(E, ["c"], { stepCode: "MAT_DA", field: "actual", value: "" });
assert.equal(r.rows[0].notApplicable, false);
r = planBulk(E, ["a"], { stepCode: "SON_GO", field: "plan", value: "2026-10-20" });
assert.match(r.skipped[0].reason, /lead time/);
r = planBulk(E, ["a", "b"], { stepCode: "NHAM", field: "plan", value: "2026-10-05" });
assert.equal(r.rows.length, 2); assert.equal(r.rows[0].planDate, "2026-10-05");
r = planBulk(E, ["a", "b"], { stepCode: "SON_GO", field: "resched", value: "2026-10-22" });
assert.deepEqual(r.rows.map((x) => x.trackingId), ["a"]);
assert.match(r.skipped[0].reason, /đã xong/);

console.log("sampleTestBulk: 3 scenarios passed");
