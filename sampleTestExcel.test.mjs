// node tests/sampleTestExcel.test.mjs
import assert from "node:assert/strict";
import { computeTracking, mergeSettings } from "../sampleTestLogic.js";
import { buildExportTable, diffImport, parseCellDate, allColumns } from "../sampleTestExcel.js";

const settings = mergeSettings();
const today = "2026-10-15";
const mk = (tracking, stepRows = [], parts = []) => ({
  id: tracking.id, tracking,
  info: { erpNo: tracking.erpNo, description: "desc " + tracking.id, customerId: "C1" },
  computed: computeTracking({ tracking, stepRows, parts, tests: [], settings, today }),
});
const t1 = { id: "t1", erpNo: "ERP-1", lsxNo: "LSX-1", owner: "Hậu", startDate: "2026-10-01", testDeadline: "", weaveOn: "none", status: "Active" };
const t2 = { id: "t2", erpNo: "ERP-2", lsxNo: "LSX-1", owner: "Hậu", startDate: "2026-10-01", testDeadline: "", weaveOn: "wood", status: "Active" };
const entries = [
  mk(t1, [{ id: "t1:NHAM", trackingId: "t1", stepCode: "NHAM", planDate: "2026-10-05", actualDate: "", notApplicable: false, rescheduleDate: "" }]),
  mk(t2, [], [{ id: "p1", trackingId: "t2", stepCode: "HW", itemName: "Ốc", promisedDate: "2026-10-20", actualDate: "", iqcResult: "Chờ" }]),
];
const { headers, rows } = buildExportTable(entries, settings, () => "SKLUM");
const letter = (i) => { let s = ""; i++; while (i) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; };
const toSheet = (hdr, data) => [hdr, ...data].map((r, ri) => ({ rowNumber: ri + 1, cells: Object.fromEntries(r.map((v, i) => [letter(i), v])) }));
const col = (name) => headers.indexOf(name);

// 1. untouched export → no changes
let d = diffImport(toSheet(headers, rows), entries, settings);
assert.equal(d.changes.length, 0, JSON.stringify(d.changes.slice(0, 3)));
assert.equal(d.errors.length, 0);
assert.equal(d.skipped.length, 0);
assert.equal(rows[0][col("Đan dây · Thực tế")], "N/A", "Không đan → N/A");

// 2. edits: actual date (dd/mm/yyyy), Excel serial, N/A, plan, owner, weave; reorder columns
const r = rows.map((x) => [...x]);
r[0][col("Nhám nguội · Thực tế")] = "06/10/2026";
r[0][col("Giao lên sơn · Thực tế")] = "46302";            // Excel serial = 2026-10-07
r[0][col("Mặt đá · Thực tế")] = "n/a";
r[0][col("Khung sắt · Ấn định")] = "2026-10-12";
r[0][col("Người phụ trách")] = "Tuấn";
r[1][col("Đan dây trên (Khung sắt / Khung gỗ / Cả hai / Không đan)")] = "Cả hai";
r[1][col("Hardware · Thực tế")] = "21/10/2026";            // HW has part lines → skipped
r[1][col("Sơn gỗ · Thực tế")] = "31/02/2026";              // invalid date
const order = headers.map((_, i) => i).reverse();           // columns shuffled
d = diffImport(toSheet(order.map((i) => headers[i]), r.map((x) => order.map((i) => x[i]))), entries, settings);
const f = (id, field) => d.changes.find((c) => c.trackingId === id && c.field === field);
assert.equal(f("t1", "NHAM:actual").to, "06/10/2026");
assert.equal(f("t1", "GIAO_SON:actual").to, "07/10/2026");
assert.equal(f("t1", "MAT_DA:actual").to, "N/A");
assert.equal(f("t1", "KHUNG_SAT:plan").to, "12/10/2026");
assert.deepEqual(d.trackingPatches.t1, { owner: "Tuấn" });
assert.deepEqual(d.trackingPatches.t2, { weaveOn: "both" });
assert.deepEqual(d.stepPatches.t1.MAT_DA, { notApplicable: true, actualDate: "" });
assert.deepEqual(d.stepPatches.t1.GIAO_SON, { notApplicable: false, actualDate: "2026-10-07" });
assert.ok(d.skipped.some((s) => /Hardware/.test(s.message)), "part-driven step skipped");
assert.ok(d.errors.some((e) => /31\/02\/2026/.test(e.message)), "invalid date reported");
assert.equal(d.changes.length, 6);

// 3. clearing a date + unknown id + missing id column
const r3 = rows.map((x) => [...x]);
r3[0][col("Nhám nguội · Ấn định")] = "";
d = diffImport(toSheet(headers, [...r3, ["ghost", ...r3[0].slice(1)]]), entries, settings);
assert.equal(f("t1", "NHAM:plan").to, "(xoá)");
assert.ok(d.errors.some((e) => /ghost/.test(e.message)));
d = diffImport(toSheet(headers.slice(1), rows.map((x) => x.slice(1))), entries, settings);
assert.ok(d.errors[0].message.includes("ID"));

// 4. date parser
assert.equal(parseCellDate("5/1/26").value, "2026-01-05");
assert.equal(parseCellDate("2026-1-5").value, "2026-01-05");
assert.equal(parseCellDate("abc").kind, "invalid");
assert.equal(allColumns(settings).filter((c) => c.edit).length, 4 + 11 + 4 + 4, "editable columns");

console.log("sampleTestExcel: 4 scenarios passed");
