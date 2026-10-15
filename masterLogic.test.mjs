// node tests/masterLogic.test.mjs
import assert from "node:assert/strict";
import { lsxForMaster, pisForMaster, piTotals, firstLine } from "../masterLogic.js";

const master = { id: "MPSA00003", erpNo: "ERP-1", sourceSampleId: "SA00003" };
const samples = [
  { id: "SA00002", erpNo: "ERP-1", manufacturingOrderNo: "LSX-M-01", stageStartDate: "2026-05-01" }, // older sample, same ERP
  { id: "SA00003", erpNo: " ERP-1 ", manufacturingOrderNo: "LSX-M-02", stageStartDate: "2026-06-01" },
  { id: "SA00009", erpNo: "ERP-9", manufacturingOrderNo: "LSX-X" },
];
const mos = [
  { id: "mo1", moNo: "LSX-DT-01", moType: "Đại trà", issueDate: "2026-08-01", piId: "pi1", poReference: "PO-1" },
  { id: "mo2", moNo: "LSX-DC-01", moType: "Điều chỉnh", issueDate: "2026-09-10", description: "Đổi màu" },
  { id: "mo3", moNo: "LSX-OTHER", moType: "Đại trà", issueDate: "2026-09-20" },
];
const moLines = [
  { id: "l1", moId: "mo1", productId: "SA00003", masterProductId: "MPSA00003", qtyOrdered: 100 },
  { id: "l2", moId: "mo1", productId: "SA00003", masterProductId: "MPSA00003", qtyOrdered: 20 },
  { id: "l3", moId: "mo2", productId: "SA00002", masterProductId: "", qtyOrdered: 5 }, // legacy line, matched by ERP sample
  { id: "l4", moId: "mo3", productId: "SA00009", masterProductId: "MPSA00009", qtyOrdered: 7 },
];

// 1. all LSX of the product: 2 LSX mẫu + 2 MOs, newest first, qty summed per MO
const lsx = lsxForMaster(master, { samples, mos, moLines });
assert.deepEqual(lsx.map((x) => x.moNo), ["LSX-DC-01", "LSX-DT-01", "LSX-M-02", "LSX-M-01"]);
assert.equal(lsx.find((x) => x.moNo === "LSX-DT-01").qty, 120);
assert.equal(lsx.find((x) => x.moNo === "LSX-DT-01").piId, "pi1");
assert.equal(lsx.find((x) => x.moNo === "LSX-M-02").type, "Mẫu");
assert.ok(!lsx.some((x) => x.moNo === "LSX-OTHER"), "other product's MO must not appear");

// 2. PI lines of the product with header, newest PI first; cancelled PI line of other product ignored
const pis = [{ id: "pi1", piNo: "PI-1", piDate: "2026-07-01", poNo: "PO-1" }, { id: "pi2", piNo: "PI-2", piDate: "2026-09-01" }];
const piLines = [
  { id: "a", piId: "pi1", masterProductId: "MPSA00003", qty: 120, unitPrice: 50 },
  { id: "b", piId: "pi2", masterProductId: "MPSA00003", qty: 30, unitPrice: 52 },
  { id: "c", piId: "pi2", masterProductId: "MPSA00009", qty: 1, unitPrice: 1 },
  { id: "d", piId: "ghost", masterProductId: "MPSA00003", qty: 1 },
];
const pi = pisForMaster(master, { pis, piLines });
assert.deepEqual(pi.map((x) => x.pi.piNo), ["PI-2", "PI-1"]);

// 3. totals, blanks count as 0
assert.deepEqual(piTotals([{ qty: "120", unitPrice: "50" }, { qty: "", unitPrice: 9 }, { qty: 3, unitPrice: "" }]), { qty: 123, amount: 6000 });

// 4. first line of a multi-line name
assert.equal(firstLine("Table SET 8\nW1200"), "Table SET 8");

console.log("masterLogic: 4 scenarios passed");
