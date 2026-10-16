// node tests/qcExcel.test.mjs
import assert from "node:assert/strict";
import { buildQcExport, diffQcImport, QC_COLUMNS } from "../qcExcel.js";

const samples = [{ id: "SA00001", erpNo: "ERP-1", name: "Old\nx", customerId: "C1" }, { id: "SA00009", erpNo: "ERP-1", name: "Chair v2", customerId: "C1" }];
const masterProducts = [{ id: "MPSA00009", erpNo: "ERP-1", description: "Dining chair", customerId: "C1", sourceSampleId: "SA00009" }];
const records = [{ id: "q1", erpNo: "ERP-1", source: "Mẫu ship", stageLabel: "Final", inspectionDate: "2026-10-01", result: "Fail", status: "Mở", defectDescription: "Trầy", defectCategory: "Sơn / màu sắc", qtyChecked: 10 }];
const settings = { categories: ["Sơn / màu sắc"], severities: ["Nhẹ", "Nặng"] };
const L = (i) => String.fromCharCode(65 + i);
const sheet = (hdr, data) => [hdr, ...data].map((r, ri) => ({ rowNumber: ri + 1, cells: Object.fromEntries(r.map((v, i) => [L(i), v])) }));
const { headers, rows } = buildQcExport(records);
const ci = (k) => QC_COLUMNS.findIndex((c) => c.key === k);

// 1. round trip unchanged
let d = diffQcImport(sheet(headers, rows), { records, samples, masterProducts, settings });
assert.equal(d.updates.length + d.creates.length + d.errors.length, 0, JSON.stringify(d));

// 2. update existing + new rows (Hàng Final, simple headers, đạt/không đạt, Excel serial date) + duplicate + errors
const r1 = [...rows[0]]; r1[ci("status")] = "Đã xử lý"; r1[ci("completedDate")] = "05/10/2026";
const blank = () => QC_COLUMNS.map(() => "");
const n1 = blank(); n1[ci("erpNo")] = "ERP-1"; n1[ci("source")] = "hàng final"; n1[ci("inspectionDate")] = "46312"; n1[ci("result")] = "Không đạt"; n1[ci("defectCategory")] = "Lỗi lạ"; n1[ci("defectDescription")] = "Nứt chân";
const n2 = blank(); n2[ci("erpNo")] = "ERP-404"; n2[ci("inspectionDate")] = "17/10/2026"; n2[ci("result")] = "đạt";
const dup = blank(); dup[ci("erpNo")] = "ERP-1"; dup[ci("stageLabel")] = "Final"; dup[ci("inspectionDate")] = "01/10/2026"; dup[ci("result")] = "Fail"; dup[ci("defectDescription")] = "Trầy";
const e1 = blank(); e1[ci("erpNo")] = "ERP-1"; e1[ci("inspectionDate")] = "17/10/2026"; e1[ci("result")] = "maybe";
const e2 = blank(); e2[ci("erpNo")] = "ERP-1"; e2[ci("result")] = "Pass";
const simple = QC_COLUMNS.map((c) => c.header.split(" (")[0]);   // user typed short headers
d = diffQcImport(sheet(simple, [r1, n1, n2, dup, e1, e2]), { records, samples, masterProducts, settings }, (i) => "new" + i);
assert.deepEqual(d.updates[0].patch, { completedDate: "2026-10-05", status: "Đã xử lý" });
assert.equal(d.creates.length, 2);
const c1 = d.creates[0];
assert.equal(c1.source, "Hàng Final"); assert.equal(c1.result, "Fail"); assert.equal(c1.status, "Mở"); assert.equal(c1.inspectionDate, "2026-10-17");
assert.equal(c1.sampleId, "SA00009", "latest sample with that ERP"); assert.equal(c1.productName, "Dining chair"); assert.equal(c1.customerId, "C1");
assert.equal(d.creates[1].status, "Đạt"); assert.equal(d.creates[1].source, "Khác"); assert.equal(d.creates[1].sampleId, "");
assert.ok(d.warnings.some((w) => /ERP-404/.test(w.erp) && /chưa có/.test(w.message)));
assert.ok(d.warnings.some((w) => /Lỗi lạ/.test(w.message)));
assert.equal(d.skipped.length, 1);
assert.equal(d.errors.length, 2);

console.log("qcExcel: 2 scenarios passed");
