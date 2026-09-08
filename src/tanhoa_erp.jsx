import React, { useState, useEffect, useCallback, useRef } from "react";
import { LayoutDashboard, Users, FileText, ShoppingCart, Boxes, CalendarDays, Palette, Truck, Plus, X, Image as ImageIcon, Search, ListTodo } from "lucide-react";

/* ---------------------------------------------------------
   TÂN HÒA OUTDOOR FURNITURE — SALES ERP
   Customers → Quotes → Orders → Samples → Production → Shipping
   Data persists via window.storage (personal, per-user).
--------------------------------------------------------- */

const COLORS = {
  bg: "#F5F2EC",
  panel: "#FFFFFF",
  ink: "#25211C",
  inkSoft: "#6B6459",
  line: "#E4DDD0",
  sidebar: "#22201B",
  sidebarSoft: "#B9B2A3",
  wood: "#9C5A2E",
  woodDark: "#7A4523",
  teal: "#2F5D57",
  tealSoft: "#DCEBE8",
  amber: "#B8862E",
  amberSoft: "#F5E9D4",
  red: "#B14848",
  redSoft: "#F5DEDE",
  green: "#3E7A4F",
  greenSoft: "#DFEEE2",
};

const FONT_HEAD = "'Fraunces', Georgia, serif";
const FONT_BODY = "'Inter', -apple-system, sans-serif";

/* ---------------- Seed / reference data (from the uploaded spreadsheet) ---------------- */

const SEED_CUSTOMERS = [
  { id: "CS0000", name: "SKLUM", country: "Spain", contact: "", email: "", phone: "" },
];

const SEED_PRODUCT_TYPES = [
  { id: "PDT0001", code: "CH", name: "Chair" },
  { id: "PDT0003", code: "FC", name: "Folding Chair" },
  { id: "PDT0004", code: "OT", name: "Ottoman" },
  { id: "PDT0005", code: "CH", name: "Chaise" },
  { id: "PDT0006", code: "SF", name: "Sofa" },
];

const SEED_MAIN_MATERIALS = [{"Main_Material_ID": "MAM0001", "Main_Material_Code": "MD", "Main_Material_Name": "MDF"}, {"Main_Material_ID": "MAM0002", "Main_Material_Code": "PL", "Main_Material_Name": "Plastic"}, {"Main_Material_ID": "MAM0003", "Main_Material_Code": "A", "Main_Material_Name": "F1 Acacia"}, {"Main_Material_ID": "MAM0004", "Main_Material_Code": "ST", "Main_Material_Name": "Steel"}, {"Main_Material_ID": "MAM0005", "Main_Material_Code": "TE", "Main_Material_Name": "Teak"}, {"Main_Material_ID": "MAM0006", "Main_Material_Code": "AL", "Main_Material_Name": "Aluminium"}, {"Main_Material_ID": "MAM0007", "Main_Material_Code": "SU", "Main_Material_Name": "Super Stone"}, {"Main_Material_ID": "MAM0008", "Main_Material_Code": "CO", "Main_Material_Name": "Concrete"}, {"Main_Material_ID": "MAM0009", "Main_Material_Code": "PW", "Main_Material_Name": "Ply Wood"}, {"Main_Material_ID": "MAM0010", "Main_Material_Code": "E", "Main_Material_Name": "Eucalyptus Grandis"}, {"Main_Material_ID": "MAM0011", "Main_Material_Code": "O", "Main_Material_Name": "Gỗ sồi trắng ( White Oak)"}, {"Main_Material_ID": "MAM0012", "Main_Material_Code": "CE", "Main_Material_Name": "Cement"}, {"Main_Material_ID": "MAM0013", "Main_Material_Code": "CU", "Main_Material_Name": "Cushion"}, {"Main_Material_ID": "MAM0014", "Main_Material_Code": "FR", "Main_Material_Name": "Khung sắt"}, {"Main_Material_ID": "MAM0015", "Main_Material_Code": "CM", "Main_Material_Name": "Ceramic"}].map((m) => ({ id: m.Main_Material_ID, code: m.Main_Material_Code, name: m.Main_Material_Name }));
const SEED_FINISHES = [{"Main_Materials_Finishes_Color_ID": "MMC0002", "Main_Materials_Finishes_Color_Code": "TH-SD-01", "Main_Materials_Finishes_Color_Name": "Sanding/TH-01"}, {"Main_Materials_Finishes_Color_ID": "MMC0003", "Main_Materials_Finishes_Color_Code": "TH-SD-05", "Main_Materials_Finishes_Color_Name": "Sanding/TH-05"}, {"Main_Materials_Finishes_Color_ID": "MMC0004", "Main_Materials_Finishes_Color_Code": "TH-SD-06", "Main_Materials_Finishes_Color_Name": "Sanding/TH-06"}, {"Main_Materials_Finishes_Color_ID": "MMC0005", "Main_Materials_Finishes_Color_Code": "TH-SD-08", "Main_Materials_Finishes_Color_Name": "Sanding/TH-08"}, {"Main_Materials_Finishes_Color_ID": "MMC0006", "Main_Materials_Finishes_Color_Code": "TH-SD-09", "Main_Materials_Finishes_Color_Name": "Sanding/TH-09"}, {"Main_Materials_Finishes_Color_ID": "MMC0007", "Main_Materials_Finishes_Color_Code": "TH-SD-11", "Main_Materials_Finishes_Color_Name": "Sanding/TH-11 - Black"}, {"Main_Materials_Finishes_Color_ID": "MMC0008", "Main_Materials_Finishes_Color_Code": "TH-SD-11FB", "Main_Materials_Finishes_Color_Name": "Sanding/TH-11FB"}, {"Main_Materials_Finishes_Color_ID": "MMC0009", "Main_Materials_Finishes_Color_Code": "TH-SD-12", "Main_Materials_Finishes_Color_Name": "Sanding/TH-12"}, {"Main_Materials_Finishes_Color_ID": "MMC0010", "Main_Materials_Finishes_Color_Code": "TH-SD-13", "Main_Materials_Finishes_Color_Name": "Sanding /TH-13/Dark"}, {"Main_Materials_Finishes_Color_ID": "MMC0011", "Main_Materials_Finishes_Color_Code": "TH-SD-14", "Main_Materials_Finishes_Color_Name": "Sanding/TH-14"}, {"Main_Materials_Finishes_Color_ID": "MMC0012", "Main_Materials_Finishes_Color_Code": "TH-SD-17", "Main_Materials_Finishes_Color_Name": "Sanding/TH-17"}, {"Main_Materials_Finishes_Color_ID": "MMC0013", "Main_Materials_Finishes_Color_Code": "TH-SD-18", "Main_Materials_Finishes_Color_Name": "Sanding/TH-18"}, {"Main_Materials_Finishes_Color_ID": "MMC0014", "Main_Materials_Finishes_Color_Code": "TH-SD-182", "Main_Materials_Finishes_Color_Name": "Sanding/TH-182"}, {"Main_Materials_Finishes_Color_ID": "MMC0015", "Main_Materials_Finishes_Color_Code": "TH-SD-188", "Main_Materials_Finishes_Color_Name": "Sanding/TH-188"}, {"Main_Materials_Finishes_Color_ID": "MMC0016", "Main_Materials_Finishes_Color_Code": "TH-SD-188B", "Main_Materials_Finishes_Color_Name": "Sanding/TH-188B"}, {"Main_Materials_Finishes_Color_ID": "MMC0017", "Main_Materials_Finishes_Color_Code": "TH-SD-189", "Main_Materials_Finishes_Color_Name": "Sanding/TH-189"}, {"Main_Materials_Finishes_Color_ID": "MMC0018", "Main_Materials_Finishes_Color_Code": "TH-SD-18AB", "Main_Materials_Finishes_Color_Name": "Sanding/TH-18AB"}, {"Main_Materials_Finishes_Color_ID": "MMC0019", "Main_Materials_Finishes_Color_Code": "TH-SD-19", "Main_Materials_Finishes_Color_Name": "Sanding/TH-199"}, {"Main_Materials_Finishes_Color_ID": "MMC0020", "Main_Materials_Finishes_Color_Code": "TH-SD-193J", "Main_Materials_Finishes_Color_Name": "Sanding/TH-193J"}, {"Main_Materials_Finishes_Color_ID": "MMC0021", "Main_Materials_Finishes_Color_Code": "TH-SD-194B", "Main_Materials_Finishes_Color_Name": "Sanding/TH-194B/AF-194B"}, {"Main_Materials_Finishes_Color_ID": "MMC0022", "Main_Materials_Finishes_Color_Code": "TH-SD-199", "Main_Materials_Finishes_Color_Name": "Sanding/TH-199"}, {"Main_Materials_Finishes_Color_ID": "MMC0023", "Main_Materials_Finishes_Color_Code": "TH-SD-19AB", "Main_Materials_Finishes_Color_Name": "Sanding/TH-19AB"}, {"Main_Materials_Finishes_Color_ID": "MMC0024", "Main_Materials_Finishes_Color_Code": "TH-SD-203", "Main_Materials_Finishes_Color_Name": "Sanding/TH-203"}, {"Main_Materials_Finishes_Color_ID": "MMC0025", "Main_Materials_Finishes_Color_Code": "TH-SD-208", "Main_Materials_Finishes_Color_Name": "Sanding/ TH-208 - Black"}, {"Main_Materials_Finishes_Color_ID": "MMC0026", "Main_Materials_Finishes_Color_Code": "TH-SD-209", "Main_Materials_Finishes_Color_Name": "Sanding/ TH-209- Natural"}, {"Main_Materials_Finishes_Color_ID": "MMC0027", "Main_Materials_Finishes_Color_Code": "TH-SD-21", "Main_Materials_Finishes_Color_Name": "Sanding/TH-21"}, {"Main_Materials_Finishes_Color_ID": "MMC0028", "Main_Materials_Finishes_Color_Code": "TH-SD-211", "Main_Materials_Finishes_Color_Name": "Sanding/TH-211"}, {"Main_Materials_Finishes_Color_ID": "MMC0029", "Main_Materials_Finishes_Color_Code": "TH-SD-22A", "Main_Materials_Finishes_Color_Name": "Sanding/TH-22A"}, {"Main_Materials_Finishes_Color_ID": "MMC0030", "Main_Materials_Finishes_Color_Code": "TH-SD-25B", "Main_Materials_Finishes_Color_Name": "Sanding/TH-25B"}, {"Main_Materials_Finishes_Color_ID": "MMC0031", "Main_Materials_Finishes_Color_Code": "TH-SD-26", "Main_Materials_Finishes_Color_Name": "Sanding/TH-26"}, {"Main_Materials_Finishes_Color_ID": "MMC0032", "Main_Materials_Finishes_Color_Code": "TH-SD-298", "Main_Materials_Finishes_Color_Name": "Sanding/TH-298"}, {"Main_Materials_Finishes_Color_ID": "MMC0033", "Main_Materials_Finishes_Color_Code": "TH-SD-33", "Main_Materials_Finishes_Color_Name": "Sanding/TH-33"}, {"Main_Materials_Finishes_Color_ID": "MMC0034", "Main_Materials_Finishes_Color_Code": "TH-SD-34", "Main_Materials_Finishes_Color_Name": "Sanding/TH-34"}, {"Main_Materials_Finishes_Color_ID": "MMC0035", "Main_Materials_Finishes_Color_Code": "TH-SD-3778", "Main_Materials_Finishes_Color_Name": "Sanding/TH-3778"}, {"Main_Materials_Finishes_Color_ID": "MMC0036", "Main_Materials_Finishes_Color_Code": "TH-SD-60", "Main_Materials_Finishes_Color_Name": "Sanding/Walnut Color/TH-60"}, {"Main_Materials_Finishes_Color_ID": "MMC0037", "Main_Materials_Finishes_Color_Code": "TH-SD-84", "Main_Materials_Finishes_Color_Name": "Sanding/TH-84"}, {"Main_Materials_Finishes_Color_ID": "MMC0038", "Main_Materials_Finishes_Color_Code": "TH-SD-85", "Main_Materials_Finishes_Color_Name": "Sanding/TH-85"}, {"Main_Materials_Finishes_Color_ID": "MMC0039", "Main_Materials_Finishes_Color_Code": "TH-SD-90", "Main_Materials_Finishes_Color_Name": "Sanding/TH-90"}, {"Main_Materials_Finishes_Color_ID": "MMC0040", "Main_Materials_Finishes_Color_Code": "TH-SD-91", "Main_Materials_Finishes_Color_Name": "Sanding/TH-91"}, {"Main_Materials_Finishes_Color_ID": "MMC0041", "Main_Materials_Finishes_Color_Code": "TH-SD-95", "Main_Materials_Finishes_Color_Name": "Sanding/TH-95"}, {"Main_Materials_Finishes_Color_ID": "MMC0042", "Main_Materials_Finishes_Color_Code": "TH-SD-97", "Main_Materials_Finishes_Color_Name": "Sanding/TH-97"}, {"Main_Materials_Finishes_Color_ID": "MMC0043", "Main_Materials_Finishes_Color_Code": "TH-SD-98", "Main_Materials_Finishes_Color_Name": "Sanding/TH-98"}, {"Main_Materials_Finishes_Color_ID": "MMC0044", "Main_Materials_Finishes_Color_Code": "TH-SD-99", "Main_Materials_Finishes_Color_Name": "Sanding/TH-99"}, {"Main_Materials_Finishes_Color_ID": "MMC0045", "Main_Materials_Finishes_Color_Code": "TH-SD-PA191AB-1K", "Main_Materials_Finishes_Color_Name": "Sanding/TH-191AB-1K"}, {"Main_Materials_Finishes_Color_ID": "MMC0046", "Main_Materials_Finishes_Color_Code": "TH-SD-PA191AB-2K", "Main_Materials_Finishes_Color_Name": "Sanding/TH-191AB-2K"}, {"Main_Materials_Finishes_Color_ID": "MMC0047", "Main_Materials_Finishes_Color_Code": "TH-WB-07", "Main_Materials_Finishes_Color_Name": "Wire Brusing/TH-07 - Natural"}, {"Main_Materials_Finishes_Color_ID": "MMC0048", "Main_Materials_Finishes_Color_Code": "TH-WB-08", "Main_Materials_Finishes_Color_Name": "Wirebrusing/TH-08"}, {"Main_Materials_Finishes_Color_ID": "MMC0049", "Main_Materials_Finishes_Color_Code": "TH-WB-12", "Main_Materials_Finishes_Color_Name": "Wire Brushing/TH-12"}, {"Main_Materials_Finishes_Color_ID": "MMC0050", "Main_Materials_Finishes_Color_Code": "TH-WB-15-ACA", "Main_Materials_Finishes_Color_Name": "Wire Brushing/TH-15 ACA"}, {"Main_Materials_Finishes_Color_ID": "MMC0051", "Main_Materials_Finishes_Color_Code": "TH-WB-15-EUS", "Main_Materials_Finishes_Color_Name": "Wire Brushing/TH-15 EUS"}, {"Main_Materials_Finishes_Color_ID": "MMC0052", "Main_Materials_Finishes_Color_Code": "TH-WB-15G-2K", "Main_Materials_Finishes_Color_Name": "Wire Brushing/TH-15"}, {"Main_Materials_Finishes_Color_ID": "MMC0053", "Main_Materials_Finishes_Color_Code": "TH-WB-18", "Main_Materials_Finishes_Color_Name": "Wire Brushing/TH-18"}, {"Main_Materials_Finishes_Color_ID": "MMC0054", "Main_Materials_Finishes_Color_Code": "TH-WB-198", "Main_Materials_Finishes_Color_Name": "Wirebrusing/TH-198"}, {"Main_Materials_Finishes_Color_ID": "MMC0055", "Main_Materials_Finishes_Color_Code": "TH-WB-199", "Main_Materials_Finishes_Color_Name": "Wirebrusing/TH-199"}, {"Main_Materials_Finishes_Color_ID": "MMC0056", "Main_Materials_Finishes_Color_Code": "TH-WB-27", "Main_Materials_Finishes_Color_Name": "Wirebrushing/TH-27"}, {"Main_Materials_Finishes_Color_ID": "MMC0057", "Main_Materials_Finishes_Color_Code": "TH-WB-33", "Main_Materials_Finishes_Color_Name": "Wire Brusing/TH-33"}, {"Main_Materials_Finishes_Color_ID": "MMC0058", "Main_Materials_Finishes_Color_Code": "TH-WB-42", "Main_Materials_Finishes_Color_Name": "Wirebrusing/TH-42"}, {"Main_Materials_Finishes_Color_ID": "MMC0059", "Main_Materials_Finishes_Color_Code": "TH-WB-48", "Main_Materials_Finishes_Color_Name": "Wire Brushing/ TH-48"}, {"Main_Materials_Finishes_Color_ID": "MMC0060", "Main_Materials_Finishes_Color_Code": "TH-WB-67G", "Main_Materials_Finishes_Color_Name": "Wire Brushing/TH-67G"}, {"Main_Materials_Finishes_Color_ID": "MMC0061", "Main_Materials_Finishes_Color_Code": "TH-WB-84", "Main_Materials_Finishes_Color_Name": "Wire Brushing/ TH-84"}, {"Main_Materials_Finishes_Color_ID": "MMC0062", "Main_Materials_Finishes_Color_Code": "TH-WC-193B", "Main_Materials_Finishes_Color_Name": "Wire Scratching/TH-193B"}, {"Main_Materials_Finishes_Color_ID": "MMC0063", "Main_Materials_Finishes_Color_Code": "TH-WC-194", "Main_Materials_Finishes_Color_Name": "Wire Scratching/TH-194"}, {"Main_Materials_Finishes_Color_ID": "MMC0064", "Main_Materials_Finishes_Color_Code": "TH-WC-195", "Main_Materials_Finishes_Color_Name": "Wire Scratching/TH-195"}, {"Main_Materials_Finishes_Color_ID": "MMC0065", "Main_Materials_Finishes_Color_Code": "TH-WC-93", "Main_Materials_Finishes_Color_Name": "Wire Scratching/TH-93"}, {"Main_Materials_Finishes_Color_ID": "MMC0066", "Main_Materials_Finishes_Color_Code": "TH-WC-94", "Main_Materials_Finishes_Color_Name": "Wire Scratching/TH-94"}, {"Main_Materials_Finishes_Color_ID": "MMC0067", "Main_Materials_Finishes_Color_Code": "TH-WC-93-1", "Main_Materials_Finishes_Color_Name": "Wire Scratching/TH-PP-93-1"}, {"Main_Materials_Finishes_Color_ID": "MMC0068", "Main_Materials_Finishes_Color_Code": "TH-180G", "Main_Materials_Finishes_Color_Name": "TH-HP-180G"}, {"Main_Materials_Finishes_Color_ID": "MMC0069", "Main_Materials_Finishes_Color_Code": "TH-PP-ASKHOLMEN", "Main_Materials_Finishes_Color_Name": "Sanding/TH-PP-ASKHOLMEN"}, {"Main_Materials_Finishes_Color_ID": "MMC0070", "Main_Materials_Finishes_Color_Code": "TH-WC-194C /AF-194", "Main_Materials_Finishes_Color_Name": "Wire Scratching/TH-HP-194C/AF-194"}, {"Main_Materials_Finishes_Color_ID": "MMC0071", "Main_Materials_Finishes_Color_Code": "SP-TH-0602", "Main_Materials_Finishes_Color_Name": "Sanding/Supper Store/TH-0602"}, {"Main_Materials_Finishes_Color_ID": "MMC0072", "Main_Materials_Finishes_Color_Code": "SP-TH-01", "Main_Materials_Finishes_Color_Name": "Sanding/Supper Store/TH-01 almond milk / bóng thấp"}, {"Main_Materials_Finishes_Color_ID": "MMC0073", "Main_Materials_Finishes_Color_Code": "SP-TH-13-0905", "Main_Materials_Finishes_Color_Name": "Sanding/Supper Store/13-0905 TGP"}, {"Main_Materials_Finishes_Color_ID": "MMC0074", "Main_Materials_Finishes_Color_Code": "SP-TH-17-1140", "Main_Materials_Finishes_Color_Name": "Sanding/Supper Store/17-1140 TGP"}, {"Main_Materials_Finishes_Color_ID": "MMC0075", "Main_Materials_Finishes_Color_Code": "SP-TH-46", "Main_Materials_Finishes_Color_Name": "Sanding/Supper Store/TH-46 Terrazo"}, {"Main_Materials_Finishes_Color_ID": "MMC0076", "Main_Materials_Finishes_Color_Code": "TH-SD-212", "Main_Materials_Finishes_Color_Name": "Sanding/ TH-212"}, {"Main_Materials_Finishes_Color_ID": "MMC0077", "Main_Materials_Finishes_Color_Code": "TH-SD-10", "Main_Materials_Finishes_Color_Name": "Sanding/ TH-10"}, {"Main_Materials_Finishes_Color_ID": "MMC0078", "Main_Materials_Finishes_Color_Code": "SP-TH-16-1450", "Main_Materials_Finishes_Color_Name": "Sanding/Supper Store/TH-16-1450"}, {"Main_Materials_Finishes_Color_ID": "MMC0079", "Main_Materials_Finishes_Color_Code": "TH-SD-213", "Main_Materials_Finishes_Color_Name": "Sanding/ TH-213"}, {"Main_Materials_Finishes_Color_ID": "MMC0080", "Main_Materials_Finishes_Color_Code": "SP-TH-19-1250", "Main_Materials_Finishes_Color_Name": "SanDing/Superstone/ TH-19-1250"}, {"Main_Materials_Finishes_Color_ID": "MMC0081", "Main_Materials_Finishes_Color_Code": "TH-WB-13-1", "Main_Materials_Finishes_Color_Name": "Wirebrushing / TH-13-1 CC"}, {"Main_Materials_Finishes_Color_ID": "MMC0082", "Main_Materials_Finishes_Color_Code": "TH-WB-16", "Main_Materials_Finishes_Color_Name": "Wirebrushing/TH-16"}, {"Main_Materials_Finishes_Color_ID": "MMC0083", "Main_Materials_Finishes_Color_Code": "TH-SD-15", "Main_Materials_Finishes_Color_Name": "Sanding/TH-HP-15G"}, {"Main_Materials_Finishes_Color_ID": "MMC0084", "Main_Materials_Finishes_Color_Code": "RAL8017", "Main_Materials_Finishes_Color_Name": "Dark Brown RAL8017"}, {"Main_Materials_Finishes_Color_ID": "MMC0085", "Main_Materials_Finishes_Color_Code": "TH-SD-57", "Main_Materials_Finishes_Color_Name": "Sanding/TH-57"}, {"Main_Materials_Finishes_Color_ID": "MMC0086", "Main_Materials_Finishes_Color_Code": "TH-193", "Main_Materials_Finishes_Color_Name": "Wire Scratching/ TH-193"}, {"Main_Materials_Finishes_Color_ID": "MMC0087", "Main_Materials_Finishes_Color_Code": "TH-HP-11FB", "Main_Materials_Finishes_Color_Name": "Sanding/Full Black/TH-HP-11FB"}, {"Main_Materials_Finishes_Color_ID": "MMC0088", "Main_Materials_Finishes_Color_Code": "TH-14", "Main_Materials_Finishes_Color_Name": "Sanding/TH-14/ Dark"}, {"Main_Materials_Finishes_Color_ID": "MMC0089", "Main_Materials_Finishes_Color_Code": "TH-07", "Main_Materials_Finishes_Color_Name": "Wirebrusing/TH-07"}, {"Main_Materials_Finishes_Color_ID": "MMC0090", "Main_Materials_Finishes_Color_Code": "TH-84CC", "Main_Materials_Finishes_Color_Name": "Wirebrushing/TH-84CC"}, {"Main_Materials_Finishes_Color_ID": "MMC0091", "Main_Materials_Finishes_Color_Code": "TH-HP-15", "Main_Materials_Finishes_Color_Name": "Wire Brushing/TH-HP-15"}, {"Main_Materials_Finishes_Color_ID": "MMC0092", "Main_Materials_Finishes_Color_Code": "TH-HP-60", "Main_Materials_Finishes_Color_Name": "Sanding/Walnut Color/TH-HP-60"}, {"Main_Materials_Finishes_Color_ID": "MMC0093", "Main_Materials_Finishes_Color_Code": "TH-212", "Main_Materials_Finishes_Color_Name": "Sanding/ TH-212"}, {"Main_Materials_Finishes_Color_ID": "MMC0094", "Main_Materials_Finishes_Color_Code": "TH-12", "Main_Materials_Finishes_Color_Name": "Sanding/ TH-12"}, {"Main_Materials_Finishes_Color_ID": "MMC0095", "Main_Materials_Finishes_Color_Code": "TH-203", "Main_Materials_Finishes_Color_Name": "Sanding/TH-203"}, {"Main_Materials_Finishes_Color_ID": "MMC0096", "Main_Materials_Finishes_Color_Code": "TH-3778", "Main_Materials_Finishes_Color_Name": "Sanding/ TH-3778"}, {"Main_Materials_Finishes_Color_ID": "MMC0097", "Main_Materials_Finishes_Color_Code": "TH-15G", "Main_Materials_Finishes_Color_Name": "Wirebrushing/TH-15G"}, {"Main_Materials_Finishes_Color_ID": "MMC0098", "Main_Materials_Finishes_Color_Code": "TH-HP-67G", "Main_Materials_Finishes_Color_Name": "Wire Brushing/TH-HP-67G/Yellow Old Teak"}, {"Main_Materials_Finishes_Color_ID": "MMC0099", "Main_Materials_Finishes_Color_Code": "TH-18", "Main_Materials_Finishes_Color_Name": "Wirebrushing / TH-18 / Light"}, {"Main_Materials_Finishes_Color_ID": "MMC0100", "Main_Materials_Finishes_Color_Code": "TH-27", "Main_Materials_Finishes_Color_Name": "Wirebrushing/TH-27"}, {"Main_Materials_Finishes_Color_ID": "MMC0101", "Main_Materials_Finishes_Color_Code": "TH-15", "Main_Materials_Finishes_Color_Name": "Wire brushing/ TH-15 ACA KAH"}, {"Main_Materials_Finishes_Color_ID": "MMC0102", "Main_Materials_Finishes_Color_Code": "TH-84", "Main_Materials_Finishes_Color_Name": "Wirebrushing/ TH-84"}, {"Main_Materials_Finishes_Color_ID": "MMC0103", "Main_Materials_Finishes_Color_Code": "TH-PP-84", "Main_Materials_Finishes_Color_Name": "Sanding/Teak Look on Acacia/TH-PP-84"}].map((m) => ({ id: m.Main_Materials_Finishes_Color_ID, code: m.Main_Materials_Finishes_Color_Code, name: m.Main_Materials_Finishes_Color_Name }));
const SEED_WOOD_SURFACE = [{"Wood_Surface_Treatment_ID": "WST0001", "Wood_Surface_Treatment_Code": "S", "Wood_Surface_Treatment_Name": "Sanding"}, {"Wood_Surface_Treatment_ID": "WST0002", "Wood_Surface_Treatment_Code": "W", "Wood_Surface_Treatment_Name": "Wire Brushing"}, {"Wood_Surface_Treatment_ID": "WST0003", "Wood_Surface_Treatment_Code": "C", "Wood_Surface_Treatment_Name": "Wire Scratching"}].map((m) => ({ id: m.Wood_Surface_Treatment_ID, code: m.Wood_Surface_Treatment_Code, name: m.Wood_Surface_Treatment_Name }));
const SEED_FABRIC_TYPES = [{"Fabric_Type_ID": "FAT0001", "Fabric_Type_Code": "O", "Fabric_Type_Name": "Olefin"}, {"Fabric_Type_ID": "FAT0002", "Fabric_Type_Code": "F", "Fabric_Type_Name": "Lông cừu"}, {"Fabric_Type_ID": "FAT0003", "Fabric_Type_Code": "P", "Fabric_Type_Name": "Polyester "}].map((m) => ({ id: m.Fabric_Type_ID, code: m.Fabric_Type_Code, name: m.Fabric_Type_Name }));
const SEED_FABRIC_COLORS = [{"Fabric_Color_ID": "FAC_0001", "Fabric_Color_Code": "1829B", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0002", "Fabric_Color_Code": 2125, "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0003", "Fabric_Color_Code": "2343 xanh", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0004", "Fabric_Color_Code": 2343, "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0005", "Fabric_Color_Code": "2401 vang", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0006", "Fabric_Color_Code": "2402 xám xanh", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0007", "Fabric_Color_Code": 2402, "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0008", "Fabric_Color_Code": 2403, "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0009", "Fabric_Color_Code": 2408, "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0010", "Fabric_Color_Code": 2412, "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0011", "Fabric_Color_Code": 193, "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0012", "Fabric_Color_Code": "202C", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0013", "Fabric_Color_Code": 1550, "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0014", "Fabric_Color_Code": 2000, "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0015", "Fabric_Color_Code": 2124, "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0016", "Fabric_Color_Code": "2205A", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0017", "Fabric_Color_Code": 2322, "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0018", "Fabric_Color_Code": 2404, "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0019", "Fabric_Color_Code": 4045, "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0020", "Fabric_Color_Code": 8003, "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0021", "Fabric_Color_Code": 12048, "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0022", "Fabric_Color_Code": 20226, "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0023", "Fabric_Color_Code": 703809, "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0024", "Fabric_Color_Code": "B-0292", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0025", "Fabric_Color_Code": "B-0506", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0026", "Fabric_Color_Code": "B-202019", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0027", "Fabric_Color_Code": "B-203027", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0028", "Fabric_Color_Code": "B-203028", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0029", "Fabric_Color_Code": "B-203042", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0030", "Fabric_Color_Code": "B-204014", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0031", "Fabric_Color_Code": "B-204015", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0032", "Fabric_Color_Code": "B-204016", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0033", "Fabric_Color_Code": "B-204017", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0034", "Fabric_Color_Code": "B-204018", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0035", "Fabric_Color_Code": "B-205003", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0036", "Fabric_Color_Code": "B-205021", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0037", "Fabric_Color_Code": "B-205023", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0038", "Fabric_Color_Code": "B-206001", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0039", "Fabric_Color_Code": "B-208008", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0040", "Fabric_Color_Code": "B-208010", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0041", "Fabric_Color_Code": "B-501023", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0042", "Fabric_Color_Code": "B-501027", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0043", "Fabric_Color_Code": "B-509009", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0044", "Fabric_Color_Code": "B027", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0045", "Fabric_Color_Code": "B162", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0046", "Fabric_Color_Code": "B208008", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0047", "Fabric_Color_Code": "BK-0003", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0048", "Fabric_Color_Code": "CD1072", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0049", "Fabric_Color_Code": "CD1169", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0050", "Fabric_Color_Code": "D1615", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0051", "Fabric_Color_Code": "GC015", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0052", "Fabric_Color_Code": "GC045", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0053", "Fabric_Color_Code": "HY15112", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0054", "Fabric_Color_Code": "HY15112", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0055", "Fabric_Color_Code": "HY15114", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0056", "Fabric_Color_Code": "HY15114", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0057", "Fabric_Color_Code": "J-0378", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0058", "Fabric_Color_Code": "J-0748", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0059", "Fabric_Color_Code": "K-1190", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0060", "Fabric_Color_Code": "K-1340", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0061", "Fabric_Color_Code": "LN0292", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0062", "Fabric_Color_Code": "LN0301", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0063", "Fabric_Color_Code": "M2100", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0064", "Fabric_Color_Code": "MH-1755", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0065", "Fabric_Color_Code": "NC1636", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0066", "Fabric_Color_Code": "NC1637", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0067", "Fabric_Color_Code": "NC1638", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0068", "Fabric_Color_Code": "NC1641", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0069", "Fabric_Color_Code": "NC1728", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0070", "Fabric_Color_Code": "NC1801", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0071", "Fabric_Color_Code": "NC1802", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0072", "Fabric_Color_Code": "NC1815", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0073", "Fabric_Color_Code": "NC2017", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0074", "Fabric_Color_Code": "NC2018", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0075", "Fabric_Color_Code": "NC2207", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0076", "Fabric_Color_Code": "ND0520", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0077", "Fabric_Color_Code": "ND2115", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0078", "Fabric_Color_Code": "ND2116", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0079", "Fabric_Color_Code": "ND2233", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0080", "Fabric_Color_Code": "ND2545-999", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0081", "Fabric_Color_Code": "ND12048", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0082", "Fabric_Color_Code": "ND14142", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0083", "Fabric_Color_Code": "ND14146", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0084", "Fabric_Color_Code": "ND14146", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0085", "Fabric_Color_Code": "ND14146", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0086", "Fabric_Color_Code": "ND14260", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0087", "Fabric_Color_Code": "ND14662", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0088", "Fabric_Color_Code": "ND15036", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0089", "Fabric_Color_Code": "ND16123", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0090", "Fabric_Color_Code": "ND17639", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0091", "Fabric_Color_Code": "ND19006", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0092", "Fabric_Color_Code": "ND19011", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0093", "Fabric_Color_Code": "ND19027", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0094", "Fabric_Color_Code": "ND19072", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0095", "Fabric_Color_Code": "ND19077", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0096", "Fabric_Color_Code": "ND19082", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0097", "Fabric_Color_Code": "ND19086", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0098", "Fabric_Color_Code": "ND19089", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0099", "Fabric_Color_Code": "ND19091", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0100", "Fabric_Color_Code": "ND19091", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0101", "Fabric_Color_Code": "ND19092", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0102", "Fabric_Color_Code": "ND19093", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0103", "Fabric_Color_Code": "ND19094", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0104", "Fabric_Color_Code": "ND19095", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0105", "Fabric_Color_Code": "ND19096", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0106", "Fabric_Color_Code": "ND20001M", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0107", "Fabric_Color_Code": "ND20001M", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0108", "Fabric_Color_Code": "ND20002", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0109", "Fabric_Color_Code": "ND20004M", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0110", "Fabric_Color_Code": "ND20007", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0111", "Fabric_Color_Code": "ND20008", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0112", "Fabric_Color_Code": "ND20011", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0113", "Fabric_Color_Code": "ND20016", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0114", "Fabric_Color_Code": "ND20018", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0115", "Fabric_Color_Code": "ND20020", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0116", "Fabric_Color_Code": "ND20022", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0117", "Fabric_Color_Code": "ND20026", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0118", "Fabric_Color_Code": "ND20027", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0119", "Fabric_Color_Code": "ND20029", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0120", "Fabric_Color_Code": "ND20030M", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0121", "Fabric_Color_Code": "ND20033M", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0122", "Fabric_Color_Code": "ND20035", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0123", "Fabric_Color_Code": "ND21234", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0124", "Fabric_Color_Code": "ND21235", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0125", "Fabric_Color_Code": "ND21236", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0126", "Fabric_Color_Code": "ND21237", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0127", "Fabric_Color_Code": "ND21238", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0128", "Fabric_Color_Code": "ND21239", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0129", "Fabric_Color_Code": "ND21240", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0130", "Fabric_Color_Code": "ND21371-C6", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0131", "Fabric_Color_Code": "ND21373", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0132", "Fabric_Color_Code": "ND21374", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0133", "Fabric_Color_Code": "ND21382", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0134", "Fabric_Color_Code": "ND21382", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0135", "Fabric_Color_Code": "ND21390", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0136", "Fabric_Color_Code": "ND22200M", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0137", "Fabric_Color_Code": "ND23034", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0138", "Fabric_Color_Code": "ND200401", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0139", "Fabric_Color_Code": "ND200402", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0140", "Fabric_Color_Code": "ND200403", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0141", "Fabric_Color_Code": "ND200405", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0142", "Fabric_Color_Code": "ND200406", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0143", "Fabric_Color_Code": "ND200407", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0144", "Fabric_Color_Code": "ND200408", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0145", "Fabric_Color_Code": "ND200409", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0146", "Fabric_Color_Code": "ND200410", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0147", "Fabric_Color_Code": "ND200411", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0148", "Fabric_Color_Code": "ND200412", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0149", "Fabric_Color_Code": "ND200415", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0150", "Fabric_Color_Code": "ND200422", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0151", "Fabric_Color_Code": "ND200513", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0152", "Fabric_Color_Code": "ND200516", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0153", "Fabric_Color_Code": "ND200517", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0154", "Fabric_Color_Code": "ND200518", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0155", "Fabric_Color_Code": "ND200519", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0156", "Fabric_Color_Code": "ND200520", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0157", "Fabric_Color_Code": "ND200521", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0158", "Fabric_Color_Code": "ND200523", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0159", "Fabric_Color_Code": "ND200524", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0160", "Fabric_Color_Code": "ND200525", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0161", "Fabric_Color_Code": "ND200527", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0162", "Fabric_Color_Code": "ND200528", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0163", "Fabric_Color_Code": "ND200529", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0164", "Fabric_Color_Code": "ND200536", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0165", "Fabric_Color_Code": "ND200637", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0166", "Fabric_Color_Code": "ND200638", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0167", "Fabric_Color_Code": "ND200639", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0168", "Fabric_Color_Code": "ND200641", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0169", "Fabric_Color_Code": "ND201229", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0170", "Fabric_Color_Code": "ND201229", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0171", "Fabric_Color_Code": "ND2012384", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0172", "Fabric_Color_Code": "P201021-11", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0173", "Fabric_Color_Code": "ST2124", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0174", "Fabric_Color_Code": "ST2132", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0175", "Fabric_Color_Code": "ST-2130", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0176", "Fabric_Color_Code": "ST-2325", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0177", "Fabric_Color_Code": "ST-2328", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0178", "Fabric_Color_Code": "ST-2328", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0179", "Fabric_Color_Code": "swatch-fabric", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0180", "Fabric_Color_Code": "T220231", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0181", "Fabric_Color_Code": "T220231", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0182", "Fabric_Color_Code": "VPR-F082", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0183", "Fabric_Color_Code": "W-0294", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0184", "Fabric_Color_Code": "W2131-995", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0185", "Fabric_Color_Code": "w2131-995", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0186", "Fabric_Color_Code": "WW031", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0187", "Fabric_Color_Code": "X12P039A", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0188", "Fabric_Color_Code": "X12P039B", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0189", "Fabric_Color_Code": "XY-341", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0190", "Fabric_Color_Code": "YD7277", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC_0191", "Fabric_Color_Code": "Z-0906", "Fabric_Color_Name": ""}, {"Fabric_Color_ID": "FAC0193", "Fabric_Color_Code": "R4083-013", "Fabric_Color_Name": "Fabric Color Name"}].map((m) => ({ id: m.Fabric_Color_ID, code: m.Fabric_Color_Code, name: m.Fabric_Color_Name }));
const SEED_ROPE_TYPES = [{"Rope_Type_ID": "ROT0001", "Rope_Type_Code": "F", "Rope_Type_Name": "Flat"}, {"Rope_Type_ID": "ROT0002", "Rope_Type_Code": "R", "Rope_Type_Name": "Round"}].map((m) => ({ id: m.Rope_Type_ID, code: m.Rope_Type_Code, name: m.Rope_Type_Name }));
const SEED_ROPE_COLORS = [{"Rope_Color_ID": "ROC0001", "Rope_Color_Code": "HL02ID", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0002", "Rope_Color_Code": "HL-03", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0003", "Rope_Color_Code": "HL-3b", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0004", "Rope_Color_Code": "HL-005", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0005", "Rope_Color_Code": "HL-006", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0006", "Rope_Color_Code": "HL-010", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0007", "Rope_Color_Code": "HL-011", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0008", "Rope_Color_Code": "HL-012", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0009", "Rope_Color_Code": "HL-13", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0010", "Rope_Color_Code": "HL-015", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0011", "Rope_Color_Code": "HL-018", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0012", "Rope_Color_Code": "HL-18-111", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0013", "Rope_Color_Code": "HL-18-0426", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0014", "Rope_Color_Code": "HL-019", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0015", "Rope_Color_Code": "HL-19-1214", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0016", "Rope_Color_Code": "HL-0027", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0017", "Rope_Color_Code": "HL-27", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0018", "Rope_Color_Code": "HL-028", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0019", "Rope_Color_Code": "HL-29", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0020", "Rope_Color_Code": "HL-035", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0021", "Rope_Color_Code": "HL-45", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0022", "Rope_Color_Code": "HL-059", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0023", "Rope_Color_Code": "HL-61", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0024", "Rope_Color_Code": "HL-82", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0025", "Rope_Color_Code": "HL-90", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0026", "Rope_Color_Code": "HL-097ID", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0027", "Rope_Color_Code": "HL-0101", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0028", "Rope_Color_Code": "HL-1014", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0029", "Rope_Color_Code": "HL-106", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0030", "Rope_Color_Code": "HL-133", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0031", "Rope_Color_Code": "HL-135", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0032", "Rope_Color_Code": "HL-137", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0033", "Rope_Color_Code": "HL-151", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0034", "Rope_Color_Code": "HL-153", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0035", "Rope_Color_Code": "HL-168", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0036", "Rope_Color_Code": "HL-201", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0037", "Rope_Color_Code": "HL-201ID", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0038", "Rope_Color_Code": "HL-212", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0039", "Rope_Color_Code": "HL-230", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0040", "Rope_Color_Code": "HL-231", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0041", "Rope_Color_Code": "HL-239", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0042", "Rope_Color_Code": "HL-244", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0043", "Rope_Color_Code": "HL-248", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0044", "Rope_Color_Code": "HL-249ID", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0045", "Rope_Color_Code": "HL-256", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0046", "Rope_Color_Code": "HL-256-DF", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0047", "Rope_Color_Code": "HL-264", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0048", "Rope_Color_Code": "HL-265", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0049", "Rope_Color_Code": "HL-267C", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0050", "Rope_Color_Code": "HL-268", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0051", "Rope_Color_Code": "HL-270", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0052", "Rope_Color_Code": "HL-303", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0053", "Rope_Color_Code": "HL-309", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0054", "Rope_Color_Code": "HL-0316C", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0055", "Rope_Color_Code": "HL-339", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0056", "Rope_Color_Code": "HL-341", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0057", "Rope_Color_Code": "HL-342", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0058", "Rope_Color_Code": "HL-352", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0059", "Rope_Color_Code": "HL-359", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0060", "Rope_Color_Code": "HL-361", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0061", "Rope_Color_Code": "HL-370", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0062", "Rope_Color_Code": "HL-371", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0063", "Rope_Color_Code": "HL-372", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0064", "Rope_Color_Code": "HL-375", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0065", "Rope_Color_Code": "HL-376", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0066", "Rope_Color_Code": "HL-380", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0067", "Rope_Color_Code": "HL-381", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0068", "Rope_Color_Code": "HL-382", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0069", "Rope_Color_Code": "HL-383", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0070", "Rope_Color_Code": "HL-389", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0071", "Rope_Color_Code": "HL-391C", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0072", "Rope_Color_Code": "HL-392", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0073", "Rope_Color_Code": "HL-393", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0074", "Rope_Color_Code": "HL-395", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0075", "Rope_Color_Code": "HL-399", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0076", "Rope_Color_Code": "HL-408", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0077", "Rope_Color_Code": "HL-413", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0078", "Rope_Color_Code": "HL-419", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0079", "Rope_Color_Code": "HL-435", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0080", "Rope_Color_Code": "HL-455", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0081", "Rope_Color_Code": "HL-479", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0082", "Rope_Color_Code": "HL-486", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0083", "Rope_Color_Code": "HL-511", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0084", "Rope_Color_Code": "HL-578", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0085", "Rope_Color_Code": "HL-579", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0086", "Rope_Color_Code": "HL-592", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0087", "Rope_Color_Code": "HL-605", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0088", "Rope_Color_Code": "HL-627", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0089", "Rope_Color_Code": "HL-674C", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0090", "Rope_Color_Code": "HL-675", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0091", "Rope_Color_Code": "HL-707", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0092", "Rope_Color_Code": "HL-709", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0093", "Rope_Color_Code": "HL-745", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0094", "Rope_Color_Code": "HL-802", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0095", "Rope_Color_Code": "HL-912CK", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0096", "Rope_Color_Code": "HL-1088", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0097", "Rope_Color_Code": "HL-1350", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0098", "Rope_Color_Code": "HL-1401", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0099", "Rope_Color_Code": "HL-1649", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0101", "Rope_Color_Code": "HL-R050", "Rope_Color_Name": "HL-R050-BROW CHOCOLATE"}, {"Rope_Color_ID": "ROC0102", "Rope_Color_Code": "H104Mix", "Rope_Color_Name": ""}, {"Rope_Color_ID": "ROC0103", "Rope_Color_Code": "HL-6719C/Green", "Rope_Color_Name": ""}].map((m) => ({ id: m.Rope_Color_ID, code: m.Rope_Color_Code, name: m.Rope_Color_Name }));
const SEED_CEMBOARD_COLORS = [];

const SEED_SAMPLES_RAW = [{"Sample_ID": "SA00002", "Customer_ID": "CS0000", "Sample_Name": "Arm Chair", "Product_Type": "PDT0001", "Sample_Qty": 300, "Overall_Width": 400, "Overall_Depth": 500, "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "MMC0011", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0025", "Rope_Type": "ROT0001", "Rope_Diameter": "", "Rope_Color": "ROC0002", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "", "Construction": "", "Current_Revision": "", "Stage_Group": "Production Preparation", "Current_Stage": "Request Received", "Waiting_For": "ERP Code", "Next_Action": "Follow up ERP No. with ERP Creating Department", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "2026-08-30", "Overall_Status": "", "Image": "SAMPLE_Images/SA00002.Image.041525.png", "Notes": "", "IDP_No": "", "IDC_No": "", "ERP_No": ""}, {"Sample_ID": "SA00004", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "PDT0003", "Sample_Qty": "", "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "", "Main_Material_Finishes_Color": "MMC0003", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0004", "Rope_Type": "ROT0001", "Rope_Diameter": "", "Rope_Color": "ROC0005", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "", "Construction": "", "Current_Revision": "", "Stage_Group": "Sample Production Preparation", "Current_Stage": "Material Preparation", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "2026-08-30", "Overall_Status": "", "Image": "SAMPLE_Images/SA00004.Image.043747.jpg", "Notes": "", "IDP_No": "", "IDC_No": "", "ERP_No": "10DGFL0006ASSKL0134"}, {"Sample_ID": "SA00006", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "PDT0005", "Sample_Qty": "", "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "MMC0004", "Wood_Surface_Treatment": "WST0002", "Fabric_Type": "FAT0003", "Fabric_Color": "FAC_0001", "Rope_Type": "ROT0002", "Rope_Diameter": "", "Rope_Color": "ROC0001", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "", "Construction": "", "Current_Revision": "", "Stage_Group": "Complete", "Current_Stage": "Completed ", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "2026-08-30", "Overall_Status": "", "Image": "SAMPLE_Images/SA00006.Image.044334.jpg", "Notes": "", "IDP_No": "", "IDC_No": "", "ERP_No": "10DGCH0006ASSKL0134"}, {"Sample_ID": "SA00007", "Customer_ID": "CS0000", "Sample_Name": "Left Sofa", "Product_Type": "", "Sample_Qty": 1, "Overall_Width": 870, "Overall_Depth": 870, "Overall_Height": 600, "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "", "Fabric_Type": "", "Fabric_Color": "", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "", "Construction": "", "Current_Revision": "", "Stage_Group": "Production Preparation", "Current_Stage": "Waiting ERP No.", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "2026-08-30", "Overall_Status": "", "Image": "SAMPLE_Images/SA00007.Image.070755.png", "Notes": "", "IDP_No": 243142, "IDC_No": 780791, "ERP_No": "10DGCH0559ASSKL0575"}, {"Sample_ID": "SA00008", "Customer_ID": "CS0000", "Sample_Name": "Right Sofa", "Product_Type": "", "Sample_Qty": 2, "Overall_Width": 870, "Overall_Depth": 870, "Overall_Height": 600, "Arm_Height": "", "Seat_Height": "", "Main_Material": "", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "", "Fabric_Type": "", "Fabric_Color": "", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "", "Construction": "", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 243149, "IDC_No": 780801, "ERP_No": "10DGCH0560ASSKL0576"}, {"Sample_ID": "SA00009", "Customer_ID": "CS0000", "Sample_Name": "Corner Sofa", "Product_Type": "", "Sample_Qty": 5, "Overall_Width": 815, "Overall_Depth": 870, "Overall_Height": 600, "Arm_Height": "", "Seat_Height": "", "Main_Material": "", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "", "Fabric_Type": "", "Fabric_Color": "", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "", "Construction": "", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "Đổi lại thành 2 cái nệm khác", "IDP_No": 243156, "IDC_No": 780819, "ERP_No": "10DGCH0561ASSKL0577"}, {"Sample_ID": "SA00010", "Customer_ID": "CS0000", "Sample_Name": "Center Sofa", "Product_Type": "", "Sample_Qty": 2, "Overall_Width": 815, "Overall_Depth": 815, "Overall_Height": 380, "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "MMC0003", "Wood_Surface_Treatment": "", "Fabric_Type": "", "Fabric_Color": "", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel , Leveler feeders", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "Request", "Current_Stage": "Request Received", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "2026-09-17", "Overall_Status": "", "Image": "SAMPLE_Images/SA00010.Image.071037.png", "Notes": "", "IDP_No": 243161, "IDC_No": 780833, "ERP_No": "10DGCH0562ASSKL0578"}, {"Sample_ID": "SA00011", "Customer_ID": "CS0000", "Sample_Name": "Ottoman", "Product_Type": "", "Sample_Qty": 3, "Overall_Width": 820, "Overall_Depth": 850, "Overall_Height": 780, "Arm_Height": "", "Seat_Height": "", "Main_Material": "", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "", "Fabric_Type": "", "Fabric_Color": "", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "", "Construction": "", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "SAMPLE_Images/SA00011.Image.071058.png", "Notes": "", "IDP_No": 244919, "IDC_No": 790211, "ERP_No": "10DGCH0563ASSKL0579"}, {"Sample_ID": "SA00012", "Customer_ID": "CS0000", "Sample_Name": "Martin Chair 01", "Product_Type": "PDT0001", "Sample_Qty": 1, "Overall_Width": 610, "Overall_Depth": 580, "Overall_Height": 735, "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "MMC0094", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "", "Fabric_Color": "", "Rope_Type": "ROT0002", "Rope_Diameter": 4, "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel , Plastic feeders", "Construction": "Full Assembly", "Current_Revision": "", "Stage_Group": "Sample Production", "Current_Stage": "Material Preparation To Assembly", "Waiting_For": "Purchaser", "Next_Action": "Follow up Materials", "Stage_Start_Date": "2026-08-29", "Stage_Due_Date": "2026-09-10", "Stage_SLA_Days": "2026-08-31", "Stage_Status": "", "Priority": "", "Target_Date": "2026-09-10", "Overall_Status": "", "Image": "SAMPLE_Images/SA00012.Image.080340.png", "Notes": "", "IDP_No": "", "IDC_No": "", "ERP_No": "10DGCH0582AWMAT0189"}, {"Sample_ID": "SA00017", "Customer_ID": "CS0000", "Sample_Name": "Martin Chair 02", "Product_Type": "PDT0001", "Sample_Qty": 1, "Overall_Width": 610, "Overall_Depth": 580, "Overall_Height": 735, "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "MMC0011", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "", "Fabric_Color": "", "Rope_Type": "ROT0002", "Rope_Diameter": 4, "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel , Plastic feeders", "Construction": "Full Assembly", "Current_Revision": "", "Stage_Group": "Sample Production", "Current_Stage": "Material Preparation To Assembly", "Waiting_For": "Purchaser", "Next_Action": "Follow up Materials", "Stage_Start_Date": "2026-08-29", "Stage_Due_Date": "2026-09-10", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "2026-09-10", "Overall_Status": "", "Image": "SAMPLE_Images/SA00017.Image.100136.png", "Notes": "", "IDP_No": "", "IDC_No": "", "ERP_No": "10DGCH0583AWMAT0190"}, {"Sample_ID": "SA00018", "Customer_ID": "CS0000", "Sample_Name": "Left Sofa", "Product_Type": "PDT0006", "Sample_Qty": 1, "Overall_Width": 870, "Overall_Depth": 870, "Overall_Height": 600, "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "MMC0094", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "Full Assembly", "Current_Revision": "", "Stage_Group": "Quality", "Current_Stage": "Customer Correction", "Waiting_For": "Re-painting", "Next_Action": "Follow up correction (In-house)", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "2026-09-04", "Overall_Status": "", "Image": "SAMPLE_Images/SA00018.Image.025755.png", "Notes": "", "IDP_No": 243142, "IDC_No": 780791, "ERP_No": "10DGCH0559SKL0575"}, {"Sample_ID": "SA00019", "Customer_ID": "CS0000", "Sample_Name": "Right Sofa", "Product_Type": "PDT0006", "Sample_Qty": 1, "Overall_Width": 870, "Overall_Depth": 870, "Overall_Height": 600, "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "MMC0094", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "Full Assembly", "Current_Revision": "", "Stage_Group": "Quality", "Current_Stage": "Customer Correction", "Waiting_For": "Re-painting", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "2026-09-04", "Overall_Status": "", "Image": "SAMPLE_Images/SA00019.Image.032359.png", "Notes": "", "IDP_No": 243149, "IDC_No": 780801, "ERP_No": "10DGCH0560SKL0576"}, {"Sample_ID": "SA00020", "Customer_ID": "CS0000", "Sample_Name": "Corner Sofa", "Product_Type": "PDT0006", "Sample_Qty": 2, "Overall_Width": 870, "Overall_Depth": 870, "Overall_Height": 600, "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "MMC0094", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0122", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "Full Assembly", "Current_Revision": "", "Stage_Group": "Quality", "Current_Stage": "Customer Correction", "Waiting_For": "Re-painting", "Next_Action": "Follow up correction (In-house)", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "2026-09-04", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 780819, "IDC_No": 243156, "ERP_No": "10DGCH0561SKL0577"}, {"Sample_ID": "SA00021", "Customer_ID": "CS0000", "Sample_Name": "Center Sofa", "Product_Type": "PDT0006", "Sample_Qty": 5, "Overall_Width": 815, "Overall_Depth": 870, "Overall_Height": 600, "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "MMC0094", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "Full Assembly", "Current_Revision": "", "Stage_Group": "Quality", "Current_Stage": "Customer Correction", "Waiting_For": "Re-painting", "Next_Action": "Follow up correction (In-house)", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "2026-09-04", "Overall_Status": "", "Image": "SAMPLE_Images/SA00021.Image.074943.png", "Notes": "", "IDP_No": 243161, "IDC_No": 780833, "ERP_No": "LSX.S-26.0414"}, {"Sample_ID": "SA00022", "Customer_ID": "CS0000", "Sample_Name": "Ottoman", "Product_Type": "PDT0006", "Sample_Qty": 2, "Overall_Width": 815, "Overall_Depth": 815, "Overall_Height": 380, "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "MMC0094", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "Full Assembly", "Current_Revision": "", "Stage_Group": "Quality", "Current_Stage": "Customer Correction", "Waiting_For": "Re-painting", "Next_Action": "Follow up correction (In-house)", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "2026-09-04", "Overall_Status": "", "Image": "SAMPLE_Images/SA00022.Image.075609.png", "Notes": "", "IDP_No": 244919, "IDC_No": 790211, "ERP_No": "10DGCH0563SKL0579"}, {"Sample_ID": "SA00023", "Customer_ID": "CS0000", "Sample_Name": "Director Chair 23", "Product_Type": "PDT0001", "Sample_Qty": 12, "Overall_Width": 559, "Overall_Depth": 523, "Overall_Height": 857, "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "MMC0088", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0003", "Fabric_Color": "", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "Sample Production", "Current_Stage": "Material Preparation To Assembly", "Waiting_For": "Sampling Team", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "2026-09-06", "Overall_Status": "", "Image": "SAMPLE_Images/SA00023.Image.032058.png", "Notes": "", "IDP_No": 243166, "IDC_No": 780866, "ERP_No": "10DGCH0478SKL0478"}, {"Sample_ID": "SA00024", "Customer_ID": "CS0000", "Sample_Name": "Director Chair 23", "Product_Type": "", "Sample_Qty": 12, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "MMC0074", "Wood_Surface_Treatment": "", "Fabric_Type": "", "Fabric_Color": "", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "Sample Production", "Current_Stage": "Material Preparation To Assembly", "Waiting_For": "Sampling Team", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "2026-09-06", "Overall_Status": "", "Image": "SAMPLE_Images/SA00024.Image.043247.png", "Notes": "", "IDP_No": 243166, "IDC_No": 780871, "ERP_No": "10DGCH0478SKL0512"}, {"Sample_ID": "SA00025", "Customer_ID": "CS0000", "Sample_Name": "Chair Lounger SET 95", "Product_Type": "", "Sample_Qty": 2, "Overall_Width": 700, "Overall_Depth": 2100, "Overall_Height": 250, "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "MMC0088", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "ROT0002", "Rope_Diameter": 6, "Rope_Color": "ROC0093", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "Sample Production", "Current_Stage": "Material Preparation To Assembly", "Waiting_For": "Purchaser", "Next_Action": "Follow up Materials", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "2026-09-07", "Overall_Status": "", "Image": "SAMPLE_Images/SA00025.Image.071900.png", "Notes": "", "IDP_No": 243173, "IDC_No": 780931, "ERP_No": "10DGTA0299SKL0483"}, {"Sample_ID": "SA00026", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 1, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 242046, "IDC_No": 774825, "ERP_No": "10DGRM0004SKL0536"}, {"Sample_ID": "SA00027", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 12, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 129028, "IDC_No": 783920, "ERP_No": "10DGCH0005SKL0600"}, {"Sample_ID": "SA00028", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 1, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 242041, "IDC_No": 774818, "ERP_No": "10DGRM0007SKL0587"}, {"Sample_ID": "SA00029", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 1, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 242034, "IDC_No": 774811, "ERP_No": "10DGRM0008SKL0585"}, {"Sample_ID": "SA00030", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 12, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 133257, "IDC_No": 690261, "ERP_No": "10DGCH0008SKL0567"}, {"Sample_ID": "SA00031", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 12, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 104454, "IDC_No": 690269, "ERP_No": "10DGCH0011SKL0569"}, {"Sample_ID": "SA00032", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 12, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 104454, "IDC_No": 690264, "ERP_No": "10DGCH0011SKL0465"}, {"Sample_ID": "SA00033", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 1, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 109506, "IDC_No": 780910, "ERP_No": "10DGTA0011SKL0626"}, {"Sample_ID": "SA00034", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 1, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 109506, "IDC_No": 780917, "ERP_No": "10DGTA0011SKL0627"}, {"Sample_ID": "SA00035", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 1, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 242032, "IDC_No": 774809, "ERP_No": "10DGRM0012SKL0555"}, {"Sample_ID": "SA00036", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 1, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 242032, "IDC_No": 774802, "ERP_No": "10DGRM0012SKL0557"}, {"Sample_ID": "SA00037", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 1, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 242032, "IDC_No": 774795, "ERP_No": "10DGRM0013SKL0558"}, {"Sample_ID": "SA00038", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 1, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 242032, "IDC_No": 774790, "ERP_No": "10DGRM0013SKL0580"}, {"Sample_ID": "SA00039", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 1, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 241962, "IDC_No": 774571, "ERP_No": "10DGRM0014SKL0564"}, {"Sample_ID": "SA00040", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 1, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 241962, "IDC_No": 774573, "ERP_No": "10DGRM0014SKL0582"}, {"Sample_ID": "SA00041", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 1, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 241962, "IDC_No": 774564, "ERP_No": "10DGRM0014SKL0603"}, {"Sample_ID": "SA00042", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 1, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 139587, "IDC_No": 783955, "ERP_No": "10DGCH0017SKL0635"}, {"Sample_ID": "SA00043", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 2, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 139584, "IDC_No": 783951, "ERP_No": "10DGCH0018SKL0634"}, {"Sample_ID": "SA00044", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 1, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 241962, "IDC_No": 774522, "ERP_No": "10DGRM0020SKL0604"}, {"Sample_ID": "SA00045", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 1, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 241962, "IDC_No": 774524, "ERP_No": "10DGRM0020SKL0583"}, {"Sample_ID": "SA00046", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 1, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 241962, "IDC_No": 774531, "ERP_No": "10DGRM0020SKL0584"}, {"Sample_ID": "SA00047", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 12, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 142069, "IDC_No": 774398, "ERP_No": "10DGCH0021SKL0566"}, {"Sample_ID": "SA00048", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 1, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 242370, "IDC_No": 776624, "ERP_No": "10DGRM0023SKL0548"}, {"Sample_ID": "SA00049", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 1, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 242370, "IDC_No": 776631, "ERP_No": "10DGRM0023SKL0550"}, {"Sample_ID": "SA00050", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 12, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 124266, "IDC_No": 783902, "ERP_No": "10DGCH0029SKL0628"}, {"Sample_ID": "SA00051", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 2, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 142058, "IDC_No": 783958, "ERP_No": "10DGCH0030SKL0636"}, {"Sample_ID": "SA00052", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 1, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 244922, "IDC_No": 790224, "ERP_No": "10DGRC0047SKL0588"}, {"Sample_ID": "SA00053", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 1, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 244923, "IDC_No": 790225, "ERP_No": "10DGRC0048SKL0586"}, {"Sample_ID": "SA00054", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 1, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 244918, "IDC_No": 790209, "ERP_No": "10DGRC0052SKL0556"}, {"Sample_ID": "SA00055", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 1, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 244918, "IDC_No": 790210, "ERP_No": "10DGRC0052SKL0581"}, {"Sample_ID": "SA00056", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 1, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 244918, "IDC_No": 790209, "ERP_No": "10DGRC0052SKL0556"}, {"Sample_ID": "SA00057", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 1, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 244918, "IDC_No": 790210, "ERP_No": "10DGRC0052SKL0581"}, {"Sample_ID": "SA00058", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 1, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 244920, "IDC_No": 790221, "ERP_No": "10DGRC0060SKL0549"}, {"Sample_ID": "SA00059", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 1, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 244920, "IDC_No": 790222, "ERP_No": "10DGRC0060SKL0609"}, {"Sample_ID": "SA00060", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 2, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 241964, "IDC_No": 774580, "ERP_No": "10DGRC0061ASSKL0652"}, {"Sample_ID": "SA00061", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 4, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 241964, "IDC_No": 774587, "ERP_No": "10DGRC0061ASSKL0654"}, {"Sample_ID": "SA00062", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 1, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 242053, "IDC_No": 774830, "ERP_No": "10DGRC0062ASSKL0653"}, {"Sample_ID": "SA00063", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 1, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 176622, "IDC_No": 783946, "ERP_No": "10DGTA0108SKL0633"}, {"Sample_ID": "SA00064", "Customer_ID": "CS0000", "Sample_Name": "Sun Lounger", "Product_Type": "PDT0005", "Sample_Qty": 1, "Overall_Width": 1300, "Overall_Depth": 2000, "Overall_Height": 320, "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "MMC0094", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "", "Fabric_Color": "FAC0193", "Rope_Type": "ROT0002", "Rope_Diameter": 6, "Rope_Color": "ROC0101", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "Sample Production", "Current_Stage": "Assembly", "Waiting_For": "Sampling Team", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "2026-09-08", "Overall_Status": "", "Image": "SAMPLE_Images/SA00064.Image.040747.png", "Notes": "", "IDP_No": 158280, "IDC_No": 783965, "ERP_No": "10DGCH0149SKL0637"}, {"Sample_ID": "SA00065", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 1, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 129049, "IDC_No": 783939, "ERP_No": "10DGTA0229SKL0632"}, {"Sample_ID": "SA00066", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 1, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 243175, "IDC_No": 780938, "ERP_No": "10DGTA0299SKL0483"}, {"Sample_ID": "SA00067", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 12, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 202722, "IDC_No": 774389, "ERP_No": "10DGCH0300SKL0568"}, {"Sample_ID": "SA00068", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 2, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 204573, "IDC_No": 783932, "ERP_No": "10DGCH0317SKL0631"}, {"Sample_ID": "SA00069", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 1, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 241978, "IDC_No": 774627, "ERP_No": "10DGTA0340SKL0559"}, {"Sample_ID": "SA00070", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 1, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 242365, "IDC_No": 776612, "ERP_No": "10DGTA0364SKL0618"}, {"Sample_ID": "SA00071", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 1, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 242365, "IDC_No": 776617, "ERP_No": "10DGTA0364SKL0620"}, {"Sample_ID": "SA00072", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 1, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 208725, "IDC_No": 774375, "ERP_No": "10DGCH0368SKL0596"}, {"Sample_ID": "SA00073", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 1, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": "", "IDC_No": "", "ERP_No": "10DGTA0368ASSKL0656"}, {"Sample_ID": "SA00074", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 1, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 202717, "IDC_No": 774349, "ERP_No": "10DGCH0459SKL0597"}, {"Sample_ID": "SA00075", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 12, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 202720, "IDC_No": 774328, "ERP_No": "10DGCH0460SKL0598"}, {"Sample_ID": "SA00076", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 1, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 202717, "IDC_No": 774354, "ERP_No": "10DGCH0461SKL0599"}, {"Sample_ID": "SA00077", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 2, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 210505, "IDC_No": 774370, "ERP_No": "10DGCH0462SKL0565"}, {"Sample_ID": "SA00078", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 1, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 210510, "IDC_No": 774368, "ERP_No": "10DGCH0463SKL0616"}, {"Sample_ID": "SA00079", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 12, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 243166, "IDC_No": 780866, "ERP_No": "10DGCH0478SKL0478"}, {"Sample_ID": "SA00080", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 12, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 243166, "IDC_No": 780871, "ERP_No": "10DGCH0478SKL0512"}, {"Sample_ID": "SA00081", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 2, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 242006, "IDC_No": 774697, "ERP_No": "10DGCH0479SKL0484"}, {"Sample_ID": "SA00082", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 2, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 243170, "IDC_No": 780878, "ERP_No": "10DGCH0481SKL0481"}, {"Sample_ID": "SA00083", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 2, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 243170, "IDC_No": 780880, "ERP_No": "10DGCH0481SKL0602"}, {"Sample_ID": "SA00084", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 2, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 243170, "IDC_No": 780887, "ERP_No": "10DGCH0481SKL0622"}, {"Sample_ID": "SA00085", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 12, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 242013, "IDC_No": 774706, "ERP_No": "10DGCH0509SKL0574"}, {"Sample_ID": "SA00086", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 1, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 241990, "IDC_No": 774650, "ERP_No": "10DGCH0517SKL0516"}, {"Sample_ID": "SA00087", "Customer_ID": "CS0000", "Sample_Name": "Chair Lounger SET 95", "Product_Type": "", "Sample_Qty": 2, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "MMC0088", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "Sample Production", "Current_Stage": "Material Preparation To Assembly", "Waiting_For": "Purchaser", "Next_Action": "Follow up Materials", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "2026-09-09", "Overall_Status": "", "Image": "SAMPLE_Images/SA00087.Image.091640.png", "Notes": "", "IDP_No": 243173, "IDC_No": 780931, "ERP_No": "10DGCH0522SKL0532"}, {"Sample_ID": "SA00088", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 12, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 242410, "IDC_No": 776734, "ERP_No": "10DGCH0535SKL0560"}, {"Sample_ID": "SA00089", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 12, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 242410, "IDC_No": 776741, "ERP_No": "10DGCH0535SKL0606"}, {"Sample_ID": "SA00090", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 2, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 242405, "IDC_No": 776722, "ERP_No": "10DGCH0536SKL0561"}, {"Sample_ID": "SA00091", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 2, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 242405, "IDC_No": 776729, "ERP_No": "10DGCH0536SKL0610"}, {"Sample_ID": "SA00092", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 2, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 242391, "IDC_No": 776687, "ERP_No": "10DGCH0537SKL0562"}, {"Sample_ID": "SA00093", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 2, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 242391, "IDC_No": 776694, "ERP_No": "10DGCH0537SKL0611"}, {"Sample_ID": "SA00094", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 1, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 243142, "IDC_No": 780791, "ERP_No": "10DGCH0559SKL0575"}, {"Sample_ID": "SA00095", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 1, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 243149, "IDC_No": 780801, "ERP_No": "10DGCH0560SKL0576"}, {"Sample_ID": "SA00096", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 2, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 243156, "IDC_No": 780819, "ERP_No": "10DGCH0561SKL0577"}, {"Sample_ID": "SA00097", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 5, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 243161, "IDC_No": 780833, "ERP_No": "10DGCH0562SKL0578"}, {"Sample_ID": "SA00098", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 2, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 244919, "IDC_No": 790211, "ERP_No": "10DGCH0563SKL0579"}, {"Sample_ID": "SA00099", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 3, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 242396, "IDC_No": 776699, "ERP_No": "10DGCH0564SKL0589"}, {"Sample_ID": "SA00100", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 3, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 242396, "IDC_No": 776706, "ERP_No": "10DGCH0564SKL0607"}, {"Sample_ID": "SA00101", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 2, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 244855, "IDC_No": 789865, "ERP_No": "10DGCH0565SKL0590"}, {"Sample_ID": "SA00102", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 2, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 244855, "IDC_No": 789866, "ERP_No": "10DGCH0565SKL0591"}, {"Sample_ID": "SA00103", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 4, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 129029, "IDC_No": 783930, "ERP_No": "10DGCH0566SKL0608"}, {"Sample_ID": "SA00104", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 1, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 242375, "IDC_No": 776643, "ERP_No": "10DGCH0567SKL0592"}, {"Sample_ID": "SA00105", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 1, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 242375, "IDC_No": 776650, "ERP_No": "10DGCH0567SKL0612"}, {"Sample_ID": "SA00106", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 1, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 242372, "IDC_No": 776633, "ERP_No": "10DGCH0568SKL0593"}, {"Sample_ID": "SA00107", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 1, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 242372, "IDC_No": 776640, "ERP_No": "10DGCH0568SKL0613"}, {"Sample_ID": "SA00108", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 2, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 242403, "IDC_No": 776713, "ERP_No": "10DGCH0569SKL0594"}, {"Sample_ID": "SA00109", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 2, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 242403, "IDC_No": 776720, "ERP_No": "10DGCH0569SKL0614"}, {"Sample_ID": "SA00110", "Customer_ID": "CS0000", "Sample_Name": "Tabuerte Alto de Jardín en Madera Naele \\ BEIGE CREMA", "Product_Type": "PDT0001", "Sample_Qty": 4, "Overall_Width": 520, "Overall_Depth": 410, "Overall_Height": 950, "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "MMC0088", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "", "Fabric_Color": "", "Rope_Type": "ROT0002", "Rope_Diameter": 6, "Rope_Color": "ROC0102", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel , Plastic feeders", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "Sample Production", "Current_Stage": "Material Preparation To Assembly", "Waiting_For": "Purchaser", "Next_Action": "Follow up Materials", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "2026-09-08", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 129009, "IDC_No": 780899, "ERP_No": "10DGCH0573SKL0623"}, {"Sample_ID": "SA00111", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 4, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 129009, "IDC_No": 780906, "ERP_No": "10DGCH0573SKL0624"}, {"Sample_ID": "SA00112", "Customer_ID": "CS0000", "Sample_Name": "Tabuerte Alto de Jardín en Madera Nael", "Product_Type": "", "Sample_Qty": 4, "Overall_Width": 520, "Overall_Depth": 41, "Overall_Height": 950, "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "MMC0094", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "", "Fabric_Color": "", "Rope_Type": "", "Rope_Diameter": 6, "Rope_Color": "ROC0103", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel , Plastic feeders", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "Sample Production", "Current_Stage": "Material Preparation To Assembly", "Waiting_For": "Me", "Next_Action": "Weaving", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "2026-09-07", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 129009, "IDC_No": 780892, "ERP_No": "10DGCH0573SKL0625"}, {"Sample_ID": "SA00113", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 2, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 242384, "IDC_No": 776673, "ERP_No": "10DGCH0574SKL0630"}, {"Sample_ID": "SA00114", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 2, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 242384, "IDC_No": 776680, "ERP_No": "10DGCH0574SKL0629"}, {"Sample_ID": "SA00115", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 1, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": 124455, "IDC_No": 780941, "ERP_No": "10DGCH0576SKL0547"}, {"Sample_ID": "SA00116", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 4, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": "", "IDC_No": "", "ERP_No": "10DGCH0579SKL0648"}, {"Sample_ID": "SA00117", "Customer_ID": "CS0000", "Sample_Name": "Naele counter", "Product_Type": "PDT0001", "Sample_Qty": 4, "Overall_Width": 560, "Overall_Depth": 500, "Overall_Height": 930, "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "MMC0088", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "", "Fabric_Color": "", "Rope_Type": "ROT0002", "Rope_Diameter": 6, "Rope_Color": "ROC0102", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel , Plastic feeders", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "Sample Production", "Current_Stage": "Material Preparation To Assembly", "Waiting_For": "Purchaser", "Next_Action": "Follow up Materials", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "2026-09-08", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": "", "IDC_No": "", "ERP_No": "10DGCH0580SKL0649"}, {"Sample_ID": "SA00118", "Customer_ID": "CS0000", "Sample_Name": "", "Product_Type": "", "Sample_Qty": 4, "Overall_Width": "", "Overall_Depth": "", "Overall_Height": "", "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "FAT0001", "Fabric_Color": "FAC_0121", "Rope_Type": "", "Rope_Diameter": "", "Rope_Color": "", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "", "Current_Stage": "", "Waiting_For": "", "Next_Action": "", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": "", "IDC_No": "", "ERP_No": "10DGCH0580SKL0650"}, {"Sample_ID": "SA00119", "Customer_ID": "CS0000", "Sample_Name": "Naele counter", "Product_Type": "PDT0001", "Sample_Qty": 4, "Overall_Width": 560, "Overall_Depth": 500, "Overall_Height": 930, "Arm_Height": "", "Seat_Height": "", "Main_Material": "MAM0003", "Main_Material_Finishes_Color": "MMC0094", "Wood_Surface_Treatment": "WST0001", "Fabric_Type": "", "Fabric_Color": "", "Rope_Type": "ROT0002", "Rope_Diameter": "", "Rope_Color": "ROC0103", "Metal_Name": "", "Metal_Color": "", "Cemboard_Color": "", "Hardware": "7 color galvanized steel , Plastic feeders", "Construction": "K/D", "Current_Revision": "", "Stage_Group": "Sample Production", "Current_Stage": "Assembly", "Waiting_For": "Sampling Team", "Next_Action": "Weaving", "Stage_Start_Date": "", "Stage_Due_Date": "", "Stage_SLA_Days": "", "Stage_Status": "", "Priority": "", "Target_Date": "2026-09-07", "Overall_Status": "", "Image": "", "Notes": "", "IDP_No": "", "IDC_No": "", "ERP_No": "10DGCH0580SKL0651"}];

const SEED_SAMPLES = SEED_SAMPLES_RAW.map((s) => ({
  id: s.Sample_ID,
  customerId: s.Customer_ID || "CS0000",
  name: s.Sample_Name || "(unnamed sample)",
  productTypeId: s.Product_Type || "",
  qty: s.Sample_Qty === "" ? "" : s.Sample_Qty,
  erpNo: s.ERP_No || "",
  manufacturingOrderNo: s.Manufacturing_Order_No || "",
  idpNo: s.IDP_No || "",
  idcNo: s.IDC_No || "",

  width: s.Overall_Width ?? "",
  depth: s.Overall_Depth ?? "",
  height: s.Overall_Height ?? "",
  armHeight: s.Arm_Height ?? "",
  seatHeight: s.Seat_Height ?? "",

  mainMaterialId: s.Main_Material || "",
  finishesColorId: s.Main_Material_Finishes_Color || "",
  woodSurfaceTreatmentId: s.Wood_Surface_Treatment || "",
  fabricTypeId: s.Fabric_Type || "",
  fabricColorId: s.Fabric_Color || "",
  ropeTypeId: s.Rope_Type || "",
  ropeDiameter: s.Rope_Diameter ?? "",
  ropeColorId: s.Rope_Color || "",
  metalName: s.Metal_Name || "",
  metalColor: s.Metal_Color || "",
  cemboardColorId: s.Cemboard_Color || "",
  hardware: s.Hardware || "",
  construction: s.Construction || "",
  currentRevision: s.Current_Revision || "",

  stageGroup: s.Stage_Group || "",
  stage: (s.Current_Stage || "").trim() || "Request Received",
  waitingFor: s.Waiting_For || "",
  nextAction: s.Next_Action || "",
  stageStartDate: s.Stage_Start_Date || "",
  stageDueDate: s.Stage_Due_Date || "",
  stageSlaDays: s.Stage_SLA_Days || "",
  stageStatus: s.Stage_Status || "",
  priority: s.Priority || "",
  targetDate: s.Target_Date || "",
  completedDate: "",
  overallStatus: s.Overall_Status || "",
  image: s.Image || "",
  notes: s.Notes || "",
  revisions: [],

  orderId: "",
}));

const SEED_MATERIAL_PREPS = [{"id": "SMP0001", "sampleId": "SA00002", "materialName": "Cushion", "startDate": "2026-08-23", "dueDate": "2026-08-26", "status": "Pending", "photo": ""}, {"id": "SMP0003", "sampleId": "SA00012", "materialName": "Rope", "startDate": "", "dueDate": "", "status": "Pending", "photo": ""}, {"id": "SMP0004", "sampleId": "SA00025", "materialName": "Metal Frame", "startDate": "", "dueDate": "2026-09-07", "status": "Waiting", "photo": ""}, {"id": "SMP0005", "sampleId": "SA00012", "materialName": "Wood Frame", "startDate": "2026-09-05", "dueDate": "2026-09-08", "status": "Waiting", "photo": ""}, {"id": "SMP0006", "sampleId": "SA00017", "materialName": "Wood Frame", "startDate": "", "dueDate": "2026-09-08", "status": "Waiting", "photo": ""}, {"id": "SMP0007", "sampleId": "SA00017", "materialName": "Rope", "startDate": "", "dueDate": "", "status": "Pending", "photo": ""}, {"id": "SMP0008", "sampleId": "SA00087", "materialName": "Cushion", "startDate": "", "dueDate": "", "status": "Done", "photo": ""}, {"id": "SMP0009", "sampleId": "SA00087", "materialName": "Metal Frame", "startDate": "", "dueDate": "2026-09-07", "status": "Waiting", "photo": ""}, {"id": "SMP0010", "sampleId": "SA00087", "materialName": "Rope", "startDate": "", "dueDate": "", "status": "Pending", "photo": ""}, {"id": "SMP0011", "sampleId": "SA00110", "materialName": "Wood Frame", "startDate": "", "dueDate": "", "status": "Done", "photo": ""}, {"id": "SMP0012", "sampleId": "SA00110", "materialName": "Rope", "startDate": "", "dueDate": "", "status": "Waiting", "photo": ""}, {"id": "SMP0013", "sampleId": "SA00117", "materialName": "Wood Frame", "startDate": "", "dueDate": "", "status": "Done", "photo": ""}, {"id": "SMP0014", "sampleId": "SA00117", "materialName": "Rope", "startDate": "", "dueDate": "2026-09-08", "status": "Waiting", "photo": ""}, {"id": "SMP0015", "sampleId": "SA00064", "materialName": "Cushion", "startDate": "", "dueDate": "", "status": "Done", "photo": ""}, {"id": "SMP0016", "sampleId": "SA00064", "materialName": "Wood Frame", "startDate": "", "dueDate": "", "status": "Waiting", "photo": ""}];

const SEED_QUOTES = [];
const SEED_ORDERS = [];
const SEED_SHIPMENTS = [];
const SEED_TASKS = [{"id": "TSK0001", "name": "Follow-Up Kế hoạch có hàng mẫu mang đi Test", "description": "", "referencePerson": "Chị Hiền - Planning , Tôi", "deadline": "2026-09-04", "status": "In Progress", "priority": "Medium", "note": "Đã gửi thông tin cho chị Hiền ngày 1/9/2026.", "sampleId": "", "image": ""}, {"id": "TSK0002", "name": "Follow-Up Mẫu sửa QC SKLUM ngày 1/9/2026", "description": "", "referencePerson": "Chú Đức - Sơn Hiệp Phát , Chú Trương , Tôi", "deadline": "2026-09-04", "status": "In Progress", "priority": "High Priority", "note": "Đã gửi thông tin cho chú Đức và chờ chú phản hồi", "sampleId": "", "image": ""}, {"id": "TSK0003", "name": "Follow Check List mẫu mang đi test chị Hiền đã gửi", "description": "", "referencePerson": "", "deadline": "", "status": "In Progress", "priority": "Medium", "note": "", "sampleId": "", "image": ""}, {"id": "TSK0004", "name": "Follow-Up Name and Test của khách SKLUM", "description": "", "referencePerson": "", "deadline": "", "status": "In Progress", "priority": "Medium", "note": "", "sampleId": "", "image": ""}];

const TASK_STATUSES = ["To Do", "In Progress", "Waiting", "Done"];

const ORDER_STAGES = [
  "Confirmed",
  "Sampling",
  "In Production",
  "Quality Control",
  "Ready to Ship",
  "Shipped",
  "Completed",
];

const SAMPLE_STAGE_GROUPS = ["Request", "Production Preparation", "Sample Production Preparation", "Sample Production", "Quality", "Complete"];

const SAMPLE_STAGES = [
  "Request Received",
  "Material Preparation",
  "Material Preparation To Assembly",
  "Assembly",
  "Sample Production",
  "Production Preparation",
  "Quality",
  "Customer Correction",
  "Waiting ERP No.",
  "Completed",
];

const CONSTRUCTION_OPTIONS = ["K/D", "Full Assembly"];
const PRIORITY_OPTIONS = ["Low", "Medium", "High Priority", "Urgent"];
const PREP_STATUS_OPTIONS = ["Pending", "Waiting", "In Progress", "Done"];
const PREP_MATERIAL_SUGGESTIONS = ["Cushion", "Wood Frame", "Metal Frame", "Rope", "Fabric", "Hardware", "Cemboard", "Packaging"];

/* Maps each spec field on a sample to the checklist component it implies,
   so "Generate from specs" can turn what a sample IS MADE OF into a
   trackable list of what needs to ARRIVE. */
const COMPONENT_FIELDS = [
  { field: "mainMaterialId", label: "Frame material", lookupKey: "mainMaterials" },
  { field: "fabricTypeId", label: "Fabric", lookupKey: "fabricTypes" },
  { field: "ropeTypeId", label: "Rope", lookupKey: "ropeTypes" },
  { field: "cemboardColorId", label: "Cemboard", lookupKey: "cemboardColors" },
  { field: "metalName", label: "Metal frame", lookupKey: null },
  { field: "hardware", label: "Hardware", lookupKey: null },
];

const QUOTE_STATUSES = ["Draft", "Sent", "Won", "Lost"];
const SHIPMENT_STATUSES = ["Preparing", "Shipped", "In Transit", "Delivered"];

const STORE_KEYS = {
  customers: "erp:customers",
  samples: "erp:samples",
  quotes: "erp:quotes",
  orders: "erp:orders",
  shipments: "erp:shipments",
  materialPreps: "erp:material_preps",
  tasks: "erp:tasks",
  productTypes: "erp:product_types",
  mainMaterials: "erp:main_materials",
  finishes: "erp:finishes",
  woodSurface: "erp:wood_surface",
  fabricTypes: "erp:fabric_types",
  fabricColors: "erp:fabric_colors",
  ropeTypes: "erp:rope_types",
  ropeColors: "erp:rope_colors",
  cemboardColors: "erp:cemboard_colors",
};

const MATERIAL_LIST_TABS = [
  { key: "productTypes", label: "Product Types", prefix: "PDT", seed: SEED_PRODUCT_TYPES },
  { key: "mainMaterials", label: "Main Materials", prefix: "MAM", seed: SEED_MAIN_MATERIALS },
  { key: "finishes", label: "Finishes / Colors", prefix: "MMC", seed: SEED_FINISHES },
  { key: "woodSurface", label: "Wood Surface Treatment", prefix: "WST", seed: SEED_WOOD_SURFACE },
  { key: "fabricTypes", label: "Fabric Types", prefix: "FAT", seed: SEED_FABRIC_TYPES },
  { key: "fabricColors", label: "Fabric Colors", prefix: "FAC", seed: SEED_FABRIC_COLORS },
  { key: "ropeTypes", label: "Rope Types", prefix: "ROT", seed: SEED_ROPE_TYPES },
  { key: "ropeColors", label: "Rope Colors", prefix: "ROC", seed: SEED_ROPE_COLORS },
  { key: "cemboardColors", label: "Cemboard Colors", prefix: "CBC", seed: SEED_CEMBOARD_COLORS },
];

/* Default shape for a sample — used to backfill older saved records
   that predate newer fields, without losing any data the user already entered. */
const BLANK_SAMPLE = {
  id: "", customerId: "", name: "", productTypeId: "", qty: "",
  erpNo: "", manufacturingOrderNo: "", idpNo: "", idcNo: "",
  width: "", depth: "", height: "", armHeight: "", seatHeight: "",
  mainMaterialId: "", finishesColorId: "", woodSurfaceTreatmentId: "",
  fabricTypeId: "", fabricColorId: "", ropeTypeId: "", ropeDiameter: "",
  ropeColorId: "", metalName: "", metalColor: "", cemboardColorId: "",
  hardware: "", construction: "", currentRevision: "",
  stageGroup: "", stage: "Request Received", waitingFor: "", nextAction: "",
  stageStartDate: "", stageDueDate: "", stageSlaDays: "", stageStatus: "",
  priority: "", targetDate: "", completedDate: "", overallStatus: "", image: "", notes: "",
  revisions: [],
  orderId: "",
};

function normalizeSample(s) {
  return { ...BLANK_SAMPLE, ...s, revisions: s.revisions || [] };
}

const BLANK_TASK = {
  id: "", name: "", description: "", referencePerson: "", deadline: "",
  status: "To Do", priority: "", sampleId: "", note: "", image: "",
};

/* ---------------- Storage helpers ---------------- */

async function loadOrSeed(key, seed) {
  try {
    const res = await window.storage.get(key, false);
    if (res && res.value) return JSON.parse(res.value);
  } catch (e) {
    /* not found — fall through to seed */
  }
  try {
    await window.storage.set(key, JSON.stringify(seed), false);
  } catch (e) {
    console.error("seed save failed", e);
  }
  return seed;
}

async function persist(key, value) {
  try {
    await window.storage.set(key, JSON.stringify(value), false);
  } catch (e) {
    console.error("save failed", key, e);
  }
}

async function imageFileToDataUrl(file, maxDimension = 1600, quality = 0.82) {
  if (!file || !file.type || !file.type.startsWith("image/")) {
    throw new Error("Please choose an image file.");
  }

  return await new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const img = new Image();

      img.onload = () => {
        const scale = Math.min(1, maxDimension / Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height));
        const width = Math.max(1, Math.round((img.naturalWidth || img.width) * scale));
        const height = Math.max(1, Math.round((img.naturalHeight || img.height) * scale));

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Your browser could not process this image."));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };

      img.onerror = () => reject(new Error("The selected image could not be read."));
      img.src = reader.result;
    };

    reader.onerror = () => reject(new Error("The selected image could not be read."));
    reader.readAsDataURL(file);
  });
}

function nextId(list, prefix, pad = 4) {
  let max = 0;
  list.forEach((item) => {
    const m = String(item.id).match(new RegExp(prefix + "(\\d+)"));
    if (m) max = Math.max(max, parseInt(m[1], 10));
  });
  return prefix + String(max + 1).padStart(pad, "0");
}

function money(n) {
  const v = Number(n) || 0;
  return v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function lineTotal(items) {
  return (items || []).reduce((sum, it) => sum + (Number(it.qty) || 0) * (Number(it.unitPrice) || 0), 0);
}

function lookupName(list, id) {
  if (!id) return "";
  const found = list.find((x) => x.id === id);
  return found ? found.name : id;
}

function fmtDate(d) {
  if (!d) return "";
  return d;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

/* on-time status for a completed sample: null = not yet known/completed */
function sampleOnTime(s) {
  if (s.stage !== "Completed" || !s.completedDate) return null;
  if (!s.targetDate) return true;
  return new Date(s.completedDate) <= new Date(s.targetDate);
}

/* ---------------- Small UI atoms ---------------- */

function Badge({ children, tone = "neutral" }) {
  const tones = {
    neutral: { bg: COLORS.line, fg: COLORS.inkSoft },
    wood: { bg: "#EFDFCF", fg: COLORS.woodDark },
    teal: { bg: COLORS.tealSoft, fg: COLORS.teal },
    amber: { bg: COLORS.amberSoft, fg: COLORS.amber },
    red: { bg: COLORS.redSoft, fg: COLORS.red },
    green: { bg: COLORS.greenSoft, fg: COLORS.green },
  };
  const t = tones[tone] || tones.neutral;
  return (
    <span
      style={{
        background: t.bg,
        color: t.fg,
        padding: "3px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: "nowrap",
        display: "inline-block",
      }}
    >
      {children}
    </span>
  );
}

function orderStageTone(stage) {
  return (
    {
      Confirmed: "neutral",
      Sampling: "amber",
      "In Production": "wood",
      "Quality Control": "teal",
      "Ready to Ship": "teal",
      Shipped: "green",
      Completed: "green",
    }[stage] || "neutral"
  );
}

function quoteStatusTone(s) {
  return { Draft: "neutral", Sent: "amber", Won: "green", Lost: "red" }[s] || "neutral";
}

function shipmentStatusTone(s) {
  return { Preparing: "amber", Shipped: "teal", "In Transit": "wood", Delivered: "green" }[s] || "neutral";
}

function priorityTone(p) {
  return { Low: "neutral", Medium: "amber", "High Priority": "red", Urgent: "red" }[p] || "neutral";
}

function prepStatusTone(s) {
  return { Pending: "neutral", Waiting: "amber", "In Progress": "wood", Done: "green" }[s] || "neutral";
}

function taskStatusTone(s) {
  return { "To Do": "neutral", "In Progress": "wood", Waiting: "amber", Done: "green" }[s] || "neutral";
}

function isTaskOverdue(t) {
  return t.deadline && t.status !== "Done" && new Date(t.deadline) < new Date(new Date().toDateString());
}

function Button({ children, onClick, variant = "primary", type = "button", small, disabled }) {
  const base = {
    fontFamily: FONT_BODY,
    fontWeight: 600,
    fontSize: small ? 13 : 14,
    padding: small ? "6px 12px" : "9px 16px",
    borderRadius: 8,
    cursor: disabled ? "not-allowed" : "pointer",
    border: "1px solid transparent",
    transition: "opacity .12s",
    opacity: disabled ? 0.5 : 1,
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
  };
  const variants = {
    primary: { background: COLORS.wood, color: "#fff" },
    ghost: { background: "transparent", color: COLORS.ink, border: `1px solid ${COLORS.line}` },
    subtle: { background: COLORS.bg, color: COLORS.ink, border: `1px solid ${COLORS.line}` },
    danger: { background: "transparent", color: COLORS.red, border: `1px solid ${COLORS.redSoft}` },
  };
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={{ ...base, ...variants[variant] }}
      onMouseEnter={(e) => !disabled && (e.currentTarget.style.opacity = 0.85)}
      onMouseLeave={(e) => !disabled && (e.currentTarget.style.opacity = 1)}
    >
      {children}
    </button>
  );
}

function Field({ label, children, width }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 5, width: width || "100%" }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.inkSoft }}>{label}</span>
      {children}
    </label>
  );
}

const inputStyle = {
  fontFamily: FONT_BODY,
  fontSize: 14,
  padding: "8px 10px",
  borderRadius: 7,
  border: `1px solid ${COLORS.line}`,
  background: "#fff",
  color: COLORS.ink,
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

function Input(props) {
  return <input {...props} style={{ ...inputStyle, ...(props.style || {}) }} />;
}
function Select(props) {
  return <select {...props} style={{ ...inputStyle, ...(props.style || {}) }} />;
}

/* A <select> that also lets the person type a value that isn't in the
   list yet — picking "+ Add new…" reveals an inline text box, and the
   new value gets added to the underlying list (via onAddNew) and
   selected immediately. Used for spec fields backed by the Materials
   master data, so a missing color/material never blocks data entry. */
function ComboSelect({ value, onChange, options, onAddNew, emptyLabel }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  if (adding) {
    return (
      <div style={{ display: "flex", gap: 6 }}>
        <Input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type the new value…"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (draft.trim()) { onChange(onAddNew(draft.trim())); }
              setAdding(false);
              setDraft("");
            } else if (e.key === "Escape") {
              setAdding(false);
              setDraft("");
            }
          }}
        />
        <Button
          small
          type="button"
          onClick={() => {
            if (draft.trim()) { onChange(onAddNew(draft.trim())); }
            setAdding(false);
            setDraft("");
          }}
        >
          Add
        </Button>
        <Button small type="button" variant="ghost" onClick={() => { setAdding(false); setDraft(""); }}>
          <X size={13} />
        </Button>
      </div>
    );
  }

  return (
    <Select
      value={value}
      onChange={(e) => {
        if (e.target.value === "__add_new__") setAdding(true);
        else onChange(e.target.value);
      }}
    >
      <option value="">{emptyLabel || "—"}</option>
      {options.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
      <option value="__add_new__">+ Add new…</option>
    </Select>
  );
}

function TextArea(props) {
  return <textarea {...props} style={{ ...inputStyle, resize: "vertical", ...(props.style || {}) }} />;
}

function Panel({ title, action, children }) {
  return (
    <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.line}`, borderRadius: 12, overflow: "hidden" }}>
      {(title || action) && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "14px 18px",
            borderBottom: `1px solid ${COLORS.line}`,
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <h3 style={{ margin: 0, fontFamily: FONT_HEAD, fontSize: 18, fontWeight: 600 }}>{title}</h3>
          {action}
        </div>
      )}
      <div style={{ padding: 18 }}>{children}</div>
    </div>
  );
}

function SectionHeading({ children }) {
  return (
    <div
      style={{
        fontFamily: FONT_HEAD,
        fontSize: 14.5,
        fontWeight: 600,
        color: COLORS.woodDark,
        borderBottom: `1px solid ${COLORS.line}`,
        paddingBottom: 6,
        marginTop: 4,
      }}
    >
      {children}
    </div>
  );
}

function Table({ columns, rows, onRowClick, empty }) {
  if (!rows.length) {
    return <div style={{ padding: "30px 0", textAlign: "center", color: COLORS.inkSoft, fontSize: 14 }}>{empty || "Nothing here yet."}</div>;
  }
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                style={{
                  textAlign: c.align || "left",
                  padding: "8px 10px",
                  borderBottom: `2px solid ${COLORS.line}`,
                  color: COLORS.inkSoft,
                  fontWeight: 600,
                  fontSize: 12,
                }}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.id || i}
              onClick={() => onRowClick && onRowClick(row)}
              style={{ cursor: onRowClick ? "pointer" : "default", borderBottom: `1px solid ${COLORS.line}` }}
              onMouseEnter={(e) => onRowClick && (e.currentTarget.style.background = COLORS.bg)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              {columns.map((c) => (
                <td key={c.key} style={{ padding: "9px 10px", textAlign: c.align || "left", verticalAlign: "middle" }}>
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LineItemsEditor({ items, onChange }) {
  const update = (idx, field, value) => {
    const next = items.map((it, i) => (i === idx ? { ...it, [field]: value } : it));
    onChange(next);
  };
  const remove = (idx) => onChange(items.filter((_, i) => i !== idx));
  const add = () => onChange([...items, { id: "li" + Date.now(), name: "", qty: 1, unitPrice: 0 }]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 110px 110px 32px", gap: 8, fontSize: 12, fontWeight: 600, color: COLORS.inkSoft }}>
        <span>Item</span>
        <span>Qty</span>
        <span>Unit price</span>
        <span>Line total</span>
        <span></span>
      </div>
      {items.map((it, idx) => (
        <div key={it.id} style={{ display: "grid", gridTemplateColumns: "1fr 80px 110px 110px 32px", gap: 8, alignItems: "center" }}>
          <Input value={it.name} placeholder="Product / sample name" onChange={(e) => update(idx, "name", e.target.value)} />
          <Input type="number" value={it.qty} onChange={(e) => update(idx, "qty", e.target.value)} />
          <Input type="number" value={it.unitPrice} onChange={(e) => update(idx, "unitPrice", e.target.value)} />
          <div style={{ fontSize: 13.5 }}>{money((Number(it.qty) || 0) * (Number(it.unitPrice) || 0))}</div>
          <button onClick={() => remove(idx)} title="Remove" style={{ border: "none", background: "none", color: COLORS.red, cursor: "pointer", fontSize: 16 }}>
            ×
          </button>
        </div>
      ))}
      <div>
        <Button variant="subtle" small onClick={add}>
          <Plus size={14} /> Add line
        </Button>
      </div>
      <div style={{ textAlign: "right", fontWeight: 700, fontSize: 15, marginTop: 4 }}>Total: {money(lineTotal(items))}</div>
    </div>
  );
}

/* ---------------- Main App ---------------- */

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error("App crashed:", error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ fontFamily: FONT_BODY, padding: 24, background: "#fff", border: `1px solid ${COLORS.redSoft}`, borderRadius: 12, maxWidth: 640 }}>
          <div style={{ fontWeight: 700, color: COLORS.red, marginBottom: 8, fontSize: 16 }}>Something went wrong while saving or rendering</div>
          <div style={{ fontSize: 13, color: COLORS.inkSoft, marginBottom: 14, whiteSpace: "pre-wrap", fontFamily: "monospace" }}>
            {String((this.state.error && this.state.error.message) || this.state.error)}
          </div>
          <button
            onClick={() => this.setState({ error: null })}
            style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: COLORS.wood, color: "#fff", cursor: "pointer", fontWeight: 600 }}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppInner />
    </ErrorBoundary>
  );
}

function AppInner() {
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState("dashboard");

  const [customers, setCustomers] = useState([]);
  const [samples, setSamples] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [orders, setOrders] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [materialPreps, setMaterialPreps] = useState([]);
  const [tasks, setTasks] = useState([]);

  const [materialLists, setMaterialLists] = useState({});

  useEffect(() => {
    (async () => {
      const [c, s, q, o, sh, mp, tk, ...matLists] = await Promise.all([
        loadOrSeed(STORE_KEYS.customers, SEED_CUSTOMERS),
        loadOrSeed(STORE_KEYS.samples, SEED_SAMPLES),
        loadOrSeed(STORE_KEYS.quotes, SEED_QUOTES),
        loadOrSeed(STORE_KEYS.orders, SEED_ORDERS),
        loadOrSeed(STORE_KEYS.shipments, SEED_SHIPMENTS),
        loadOrSeed(STORE_KEYS.materialPreps, SEED_MATERIAL_PREPS),
        loadOrSeed(STORE_KEYS.tasks, SEED_TASKS),
        ...MATERIAL_LIST_TABS.map((t) => loadOrSeed(STORE_KEYS[t.key], t.seed)),
      ]);
      setCustomers(c);
      setSamples(s.map(normalizeSample));
      setQuotes(q);
      setOrders(o);
      setShipments(sh);
      setMaterialPreps(mp);
      setTasks(tk.map((t) => ({ ...BLANK_TASK, ...t })));
      const ml = {};
      MATERIAL_LIST_TABS.forEach((t, i) => { ml[t.key] = matLists[i]; });
      setMaterialLists(ml);
      setLoaded(true);
    })();
  }, []);

  const setAndSave = {
    customers: (next) => { setCustomers(next); persist(STORE_KEYS.customers, next); },
    samples: (next) => { setSamples(next); persist(STORE_KEYS.samples, next); },
    quotes: (next) => { setQuotes(next); persist(STORE_KEYS.quotes, next); },
    orders: (next) => { setOrders(next); persist(STORE_KEYS.orders, next); },
    shipments: (next) => { setShipments(next); persist(STORE_KEYS.shipments, next); },
    materialPreps: (next) => { setMaterialPreps(next); persist(STORE_KEYS.materialPreps, next); },
    tasks: (next) => { setTasks(next); persist(STORE_KEYS.tasks, next); },
    materialList: (key, next) => {
      setMaterialLists((prev) => ({ ...prev, [key]: next }));
      persist(STORE_KEYS[key], next);
    },
  };

  const customerName = useCallback((id) => customers.find((c) => c.id === id)?.name || "—", [customers]);
  const productTypes = materialLists.productTypes || [];
  const productTypeName = useCallback((id) => productTypes.find((p) => p.id === id)?.name || "", [productTypes]);

  if (!loaded) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 400, fontFamily: FONT_BODY, color: COLORS.inkSoft }}>
        Loading workspace…
      </div>
    );
  }

  const NAV = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "customers", label: "Customers", icon: Users },
    { key: "quotes", label: "Quotes", icon: FileText },
    { key: "orders", label: "Orders", icon: ShoppingCart },
    { key: "samples", label: "Samples", icon: Boxes },
    { key: "tasks", label: "Tasks", icon: ListTodo },
    { key: "calendar", label: "Calendar", icon: CalendarDays },
    { key: "materials", label: "Materials", icon: Palette },
    { key: "shipping", label: "Shipping", icon: Truck },
  ];

  return (
    <div style={{ fontFamily: FONT_BODY, background: COLORS.bg, color: COLORS.ink, minHeight: 600, display: "flex", borderRadius: 14, overflow: "hidden", border: `1px solid ${COLORS.line}` }}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');
      `}</style>

      {/* Sidebar */}
      <div style={{ width: 210, background: COLORS.sidebar, color: "#fff", padding: "22px 14px", flexShrink: 0 }}>
        <div style={{ fontFamily: FONT_HEAD, fontSize: 19, fontWeight: 700, marginBottom: 2, color: "#fff" }}>Tân Hòa</div>
        <div style={{ fontSize: 11.5, color: COLORS.sidebarSoft, marginBottom: 26, letterSpacing: 0.2 }}>Outdoor Furniture · Sales ERP</div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV.map((n) => {
            const Icon = n.icon;
            return (
              <button
                key={n.key}
                onClick={() => setView(n.key)}
                style={{
                  textAlign: "left",
                  background: view === n.key ? "rgba(255,255,255,0.1)" : "transparent",
                  color: view === n.key ? "#fff" : COLORS.sidebarSoft,
                  border: "none",
                  borderRadius: 8,
                  padding: "9px 12px",
                  fontSize: 14,
                  fontWeight: view === n.key ? 700 : 500,
                  cursor: "pointer",
                  fontFamily: FONT_BODY,
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                }}
              >
                <Icon size={16} strokeWidth={2} />
                {n.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: 26, overflow: "auto", maxHeight: 780 }}>
        {view === "dashboard" && (
          <Dashboard customers={customers} quotes={quotes} orders={orders} samples={samples} shipments={shipments} customerName={customerName} materialPreps={materialPreps} tasks={tasks} />
        )}
        {view === "customers" && <CustomersView customers={customers} save={setAndSave.customers} quotes={quotes} orders={orders} />}
        {view === "quotes" && (
          <QuotesView
            quotes={quotes}
            saveQuotes={setAndSave.quotes}
            customers={customers}
            customerName={customerName}
            orders={orders}
            saveOrders={setAndSave.orders}
          />
        )}
        {view === "orders" && (
          <OrdersView
            orders={orders}
            saveOrders={setAndSave.orders}
            customers={customers}
            customerName={customerName}
            samples={samples}
          />
        )}
        {view === "samples" && (
          <SamplesView
            samples={samples}
            saveSamples={setAndSave.samples}
            customers={customers}
            customerName={customerName}
            productTypes={productTypes}
            productTypeName={productTypeName}
            orders={orders}
            materialLists={materialLists}
            saveMaterialList={setAndSave.materialList}
            materialPreps={materialPreps}
            saveMaterialPreps={setAndSave.materialPreps}
            tasks={tasks}
            saveTasks={setAndSave.tasks}
          />
        )}
        {view === "tasks" && (
          <TasksView tasks={tasks} saveTasks={setAndSave.tasks} samples={samples} customers={customers} customerName={customerName} />
        )}
        {view === "calendar" && (
          <CalendarView samples={samples} materialPreps={materialPreps} tasks={tasks} customerName={customerName} />
        )}
        {view === "materials" && (
          <MaterialsView materialLists={materialLists} saveList={setAndSave.materialList} />
        )}
        {view === "shipping" && (
          <ShippingView shipments={shipments} saveShipments={setAndSave.shipments} orders={orders} customerName={customerName} customers={customers} />
        )}
      </div>
    </div>
  );
}

/* ---------------- Dashboard ---------------- */

function Dashboard({ customers, quotes, orders, samples, shipments, customerName, materialPreps, tasks }) {
  const openQuotes = quotes.filter((q) => q.status === "Draft" || q.status === "Sent");
  const activeOrders = orders.filter((o) => o.stage !== "Completed");
  const pipelineValue = openQuotes.reduce((s, q) => s + lineTotal(q.items), 0);
  const activeOrderValue = activeOrders.reduce((s, o) => s + lineTotal(o.items), 0);

  const soon = samples
    .filter((s) => s.targetDate)
    .filter((s) => {
      const d = new Date(s.targetDate);
      const diff = (d - new Date()) / 86400000;
      return diff >= -3 && diff <= 10;
    })
    .sort((a, b) => new Date(a.targetDate) - new Date(b.targetDate))
    .slice(0, 8);

  const completedKnown = samples.filter((s) => sampleOnTime(s) !== null);
  const onTimeCount = completedKnown.filter((s) => sampleOnTime(s)).length;
  const onTimeRate = completedKnown.length ? Math.round((onTimeCount / completedKnown.length) * 100) : null;

  const overduePreps = materialPreps.filter((p) => p.dueDate && p.status !== "Done" && new Date(p.dueDate) < new Date());

  const openTasks = tasks.filter((t) => t.status !== "Done");
  const overdueTasks = openTasks.filter(isTaskOverdue);
  const todayIso = todayStr();
  const todayTasks = openTasks.filter((t) => t.deadline === todayIso);

  const stat = (label, value, tone) => (
    <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 18, flex: 1 }}>
      <div style={{ fontSize: 12.5, color: COLORS.inkSoft, fontWeight: 600, marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: FONT_HEAD, fontSize: 26, fontWeight: 700, color: tone || COLORS.ink }}>{value}</div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <h1 style={{ fontFamily: FONT_HEAD, fontSize: 26, margin: 0 }}>Overview</h1>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {stat("Customers", customers.length)}
        {stat("Open quotes", `${openQuotes.length} · ${money(pipelineValue)}`)}
        {stat("Active orders", `${activeOrders.length} · ${money(activeOrderValue)}`, COLORS.wood)}
        {stat("Samples in progress", samples.filter((s) => s.stage && s.stage !== "Completed").length, COLORS.teal)}
        {stat("On-time sample rate", onTimeRate === null ? "—" : `${onTimeRate}%`, onTimeRate === null ? COLORS.ink : onTimeRate >= 80 ? COLORS.green : COLORS.red)}
        {stat("Overdue materials", overduePreps.length, overduePreps.length ? COLORS.red : COLORS.green)}
        {stat("Overdue tasks", overdueTasks.length, overdueTasks.length ? COLORS.red : COLORS.green)}
        {stat("Tasks due today", todayTasks.length, todayTasks.length ? COLORS.amber : COLORS.green)}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 16 }}>
        <Panel title="Orders by stage">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {ORDER_STAGES.map((stg) => {
              const count = orders.filter((o) => o.stage === stg).length;
              const max = Math.max(1, orders.length);
              return (
                <div key={stg} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 130, fontSize: 13 }}>{stg}</div>
                  <div style={{ flex: 1, background: COLORS.bg, borderRadius: 6, height: 10, overflow: "hidden" }}>
                    <div style={{ width: `${(count / max) * 100}%`, background: COLORS.wood, height: "100%" }} />
                  </div>
                  <div style={{ width: 20, textAlign: "right", fontSize: 13, fontWeight: 600 }}>{count}</div>
                </div>
              );
            })}
            {orders.length === 0 && <div style={{ color: COLORS.inkSoft, fontSize: 13.5 }}>No orders yet — convert a won quote to get started.</div>}
          </div>
        </Panel>

        <Panel title="Samples due soon">
          {soon.length === 0 && <div style={{ color: COLORS.inkSoft, fontSize: 13.5 }}>Nothing due in the next 10 days.</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {soon.map((s) => (
              <div key={s.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, borderBottom: `1px solid ${COLORS.line}`, paddingBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{s.name}</div>
                  <div style={{ color: COLORS.inkSoft, fontSize: 12 }}>{customerName(s.customerId)} · {s.stage}</div>
                </div>
                <div style={{ color: COLORS.inkSoft, fontSize: 12, whiteSpace: "nowrap" }}>{s.targetDate}</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {(overdueTasks.length > 0 || todayTasks.length > 0) && (
        <Panel title="Tasks needing attention">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[...overdueTasks, ...todayTasks.filter((t) => !overdueTasks.includes(t))].map((t) => (
              <div key={t.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, borderBottom: `1px solid ${COLORS.line}`, paddingBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{t.name}</div>
                  <div style={{ color: COLORS.inkSoft, fontSize: 12 }}>{t.referencePerson || "—"}</div>
                </div>
                <Badge tone={isTaskOverdue(t) ? "red" : "amber"}>{t.deadline}</Badge>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}

/* ---------------- Customers ---------------- */

function CustomersView({ customers, save, quotes, orders }) {
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const startNew = () => {
    setEditing({ id: "", name: "", country: "", contact: "", email: "", phone: "" });
    setShowForm(true);
  };
  const startEdit = (c) => {
    setEditing({ ...c });
    setShowForm(true);
  };
  const remove = (id) => {
    if (!confirm("Delete this customer?")) return;
    save(customers.filter((c) => c.id !== id));
  };
  const submit = (e) => {
    e.preventDefault();
    try {
      const cleaned = { ...editing, name: (editing.name || "").trim() || "(unnamed customer)" };
      if (cleaned.id) {
        save(customers.map((c) => (c.id === cleaned.id ? cleaned : c)));
      } else {
        const id = nextId(customers, "CS", 4);
        save([...customers, { ...cleaned, id }]);
      }
      setShowForm(false);
      setEditing(null);
    } catch (err) {
      console.error("Customer save failed:", err);
      alert("Couldn't save this customer: " + (err && err.message ? err.message : String(err)));
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontFamily: FONT_HEAD, fontSize: 26, margin: 0 }}>Customers</h1>
        <Button onClick={startNew}><Plus size={15} /> New customer</Button>
      </div>

      {showForm && (
        <Panel title={editing.id ? "Edit customer" : "New customer"}>
          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Company name">
                <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="Required" />
              </Field>
              <Field label="Country">
                <Input value={editing.country} onChange={(e) => setEditing({ ...editing, country: e.target.value })} />
              </Field>
              <Field label="Contact person">
                <Input value={editing.contact} onChange={(e) => setEditing({ ...editing, contact: e.target.value })} />
              </Field>
              <Field label="Email">
                <Input type="email" value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} />
              </Field>
              <Field label="Phone">
                <Input value={editing.phone} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} />
              </Field>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Button type="button" onClick={submit}>Save</Button>
              <Button variant="ghost" onClick={() => { setShowForm(false); setEditing(null); }}>Cancel</Button>
            </div>
          </form>
        </Panel>
      )}

      <Panel>
        <Table
          columns={[
            { key: "id", label: "ID" },
            { key: "name", label: "Company" },
            { key: "country", label: "Country" },
            { key: "contact", label: "Contact" },
            {
              key: "activity",
              label: "Activity",
              render: (c) => {
                const qc = quotes.filter((q) => q.customerId === c.id).length;
                const oc = orders.filter((o) => o.customerId === c.id).length;
                return `${qc} quote${qc === 1 ? "" : "s"} · ${oc} order${oc === 1 ? "" : "s"}`;
              },
            },
            {
              key: "actions",
              label: "",
              align: "right",
              render: (c) => (
                <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                  <Button small variant="subtle" onClick={() => startEdit(c)}>Edit</Button>
                  <Button small variant="danger" onClick={() => remove(c.id)}>Delete</Button>
                </div>
              ),
            },
          ]}
          rows={customers}
        />
      </Panel>
    </div>
  );
}

/* ---------------- Quotes ---------------- */

function QuotesView({ quotes, saveQuotes, customers, customerName, orders, saveOrders }) {
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const startNew = () => {
    setEditing({
      id: "",
      customerId: customers[0]?.id || "",
      date: new Date().toISOString().slice(0, 10),
      validUntil: "",
      status: "Draft",
      items: [{ id: "li" + Date.now(), name: "", qty: 1, unitPrice: 0 }],
      notes: "",
    });
    setShowForm(true);
  };
  const startEdit = (q) => { setEditing({ ...q, items: q.items.map((i) => ({ ...i })) }); setShowForm(true); };
  const remove = (id) => { if (!confirm("Delete this quote?")) return; saveQuotes(quotes.filter((q) => q.id !== id)); };

  const submit = (e) => {
    e.preventDefault();
    if (editing.id) {
      saveQuotes(quotes.map((q) => (q.id === editing.id ? editing : q)));
    } else {
      const id = nextId(quotes, "QT", 4);
      saveQuotes([...quotes, { ...editing, id }]);
    }
    setShowForm(false);
    setEditing(null);
  };

  const convertToOrder = (q) => {
    const id = nextId(orders, "OR", 4);
    const newOrder = {
      id,
      quoteId: q.id,
      customerId: q.customerId,
      orderDate: new Date().toISOString().slice(0, 10),
      items: q.items.map((i) => ({ ...i, id: "li" + Math.random().toString(36).slice(2) })),
      stage: "Confirmed",
      notes: "Converted from quote " + q.id,
    };
    saveOrders([...orders, newOrder]);
    saveQuotes(quotes.map((qq) => (qq.id === q.id ? { ...qq, status: "Won" } : qq)));
    alert(`Order ${id} created from ${q.id}.`);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontFamily: FONT_HEAD, fontSize: 26, margin: 0 }}>Quotes</h1>
        <Button onClick={startNew}><Plus size={15} /> New quote</Button>
      </div>

      {showForm && (
        <Panel title={editing.id ? `Edit ${editing.id}` : "New quote"}>
          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
              <Field label="Customer">
                <Select value={editing.customerId} onChange={(e) => setEditing({ ...editing, customerId: e.target.value })}>
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
              </Field>
              <Field label="Date">
                <Input type="date" value={editing.date} onChange={(e) => setEditing({ ...editing, date: e.target.value })} />
              </Field>
              <Field label="Valid until">
                <Input type="date" value={editing.validUntil} onChange={(e) => setEditing({ ...editing, validUntil: e.target.value })} />
              </Field>
              <Field label="Status">
                <Select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })}>
                  {QUOTE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </Select>
              </Field>
            </div>
            <Field label="Line items">
              <LineItemsEditor items={editing.items} onChange={(items) => setEditing({ ...editing, items })} />
            </Field>
            <Field label="Notes">
              <TextArea rows={2} value={editing.notes} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} />
            </Field>
            <div style={{ display: "flex", gap: 10 }}>
              <Button type="button" onClick={submit}>Save</Button>
              <Button variant="ghost" onClick={() => { setShowForm(false); setEditing(null); }}>Cancel</Button>
            </div>
          </form>
        </Panel>
      )}

      <Panel>
        <Table
          columns={[
            { key: "id", label: "Quote #" },
            { key: "customer", label: "Customer", render: (q) => customerName(q.customerId) },
            { key: "date", label: "Date" },
            { key: "total", label: "Total", render: (q) => money(lineTotal(q.items)) },
            { key: "status", label: "Status", render: (q) => <Badge tone={quoteStatusTone(q.status)}>{q.status}</Badge> },
            {
              key: "actions",
              label: "",
              align: "right",
              render: (q) => (
                <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                  {q.status === "Won" && !orders.some((o) => o.quoteId === q.id) && (
                    <Button small onClick={() => convertToOrder(q)}>Convert to order</Button>
                  )}
                  <Button small variant="subtle" onClick={() => startEdit(q)}>Edit</Button>
                  <Button small variant="danger" onClick={() => remove(q.id)}>Delete</Button>
                </div>
              ),
            },
          ]}
          rows={quotes}
          empty="No quotes yet. Create one to start the sales pipeline."
        />
      </Panel>
    </div>
  );
}

/* ---------------- Orders ---------------- */

function OrdersView({ orders, saveOrders, customers, customerName, samples }) {
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const startNew = () => {
    setEditing({
      id: "",
      quoteId: "",
      customerId: customers[0]?.id || "",
      orderDate: new Date().toISOString().slice(0, 10),
      stage: "Confirmed",
      items: [{ id: "li" + Date.now(), name: "", qty: 1, unitPrice: 0 }],
      notes: "",
    });
    setShowForm(true);
  };
  const startEdit = (o) => { setEditing({ ...o, items: o.items.map((i) => ({ ...i })) }); setShowForm(true); };
  const remove = (id) => { if (!confirm("Delete this order?")) return; saveOrders(orders.filter((o) => o.id !== id)); };

  const submit = (e) => {
    e.preventDefault();
    if (editing.id) {
      saveOrders(orders.map((o) => (o.id === editing.id ? editing : o)));
    } else {
      const id = nextId(orders, "OR", 4);
      saveOrders([...orders, { ...editing, id }]);
    }
    setShowForm(false);
    setEditing(null);
  };

  const setStage = (order, stage) => saveOrders(orders.map((o) => (o.id === order.id ? { ...o, stage } : o)));

  const linkedSamples = (orderId) => samples.filter((s) => s.orderId === orderId);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontFamily: FONT_HEAD, fontSize: 26, margin: 0 }}>Orders</h1>
        <Button onClick={startNew}><Plus size={15} /> New order</Button>
      </div>

      {showForm && (
        <Panel title={editing.id ? `Edit ${editing.id}` : "New order"}>
          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <Field label="Customer">
                <Select value={editing.customerId} onChange={(e) => setEditing({ ...editing, customerId: e.target.value })}>
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
              </Field>
              <Field label="Order date">
                <Input type="date" value={editing.orderDate} onChange={(e) => setEditing({ ...editing, orderDate: e.target.value })} />
              </Field>
              <Field label="Stage">
                <Select value={editing.stage} onChange={(e) => setEditing({ ...editing, stage: e.target.value })}>
                  {ORDER_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                </Select>
              </Field>
            </div>
            <Field label="Line items">
              <LineItemsEditor items={editing.items} onChange={(items) => setEditing({ ...editing, items })} />
            </Field>
            <Field label="Notes">
              <TextArea rows={2} value={editing.notes} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} />
            </Field>
            <div style={{ display: "flex", gap: 10 }}>
              <Button type="button" onClick={submit}>Save</Button>
              <Button variant="ghost" onClick={() => { setShowForm(false); setEditing(null); }}>Cancel</Button>
            </div>
          </form>
        </Panel>
      )}

      <Panel>
        <Table
          columns={[
            { key: "id", label: "Order #" },
            { key: "customer", label: "Customer", render: (o) => customerName(o.customerId) },
            { key: "orderDate", label: "Date" },
            { key: "total", label: "Total", render: (o) => money(lineTotal(o.items)) },
            {
              key: "samples",
              label: "Samples",
              render: (o) => {
                const ls = linkedSamples(o.id);
                return ls.length ? `${ls.length} linked` : "—";
              },
            },
            {
              key: "stage",
              label: "Stage",
              render: (o) => (
                <Select value={o.stage} onChange={(e) => setStage(o, e.target.value)} style={{ padding: "5px 8px", fontSize: 12.5 }}>
                  {ORDER_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                </Select>
              ),
            },
            {
              key: "actions",
              label: "",
              align: "right",
              render: (o) => (
                <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                  <Button small variant="subtle" onClick={() => startEdit(o)}>Edit</Button>
                  <Button small variant="danger" onClick={() => remove(o.id)}>Delete</Button>
                </div>
              ),
            },
          ]}
          rows={orders}
          empty="No orders yet. Convert a won quote, or add one directly."
        />
      </Panel>
    </div>
  );
}

/* ---------------- Samples ---------------- */

function SamplesView({ samples, saveSamples, customers, customerName, productTypes, productTypeName, orders, materialLists, saveMaterialList, materialPreps, saveMaterialPreps, tasks, saveTasks }) {
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [filterStage, setFilterStage] = useState("All");
  const [filterCustomer, setFilterCustomer] = useState("All");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("kanban");
  const [imageUploading, setImageUploading] = useState(false);
  const imageInputRef = useRef(null);

  const handleSampleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert("Please choose an image smaller than 15 MB.");
      return;
    }

    setImageUploading(true);
    try {
      const dataUrl = await imageFileToDataUrl(file);
      setEditing((current) => current ? { ...current, image: dataUrl } : current);
    } catch (err) {
      console.error("Image upload failed:", err);
      alert(err?.message || "Could not upload this image.");
    } finally {
      setImageUploading(false);
    }
  };

  const clearSampleImage = () => {
    setEditing((current) => current ? { ...current, image: "" } : current);
  };

  const moveStage = (sampleId, newStage) => {
    saveSamples(samples.map((s) => (s.id === sampleId ? { ...s, stage: newStage } : s)));
  };

  const startNew = () => {
    setEditing({ ...BLANK_SAMPLE, customerId: customers[0]?.id || "" });
    setShowForm(true);
    setViewing(null);
  };
  const startEdit = (s) => { setEditing({ ...s }); setShowForm(true); setViewing(null); };
  const remove = (id) => { if (!confirm("Delete this sample?")) return; saveSamples(samples.filter((s) => s.id !== id)); setViewing(null); };

  const submit = (e) => {
    e.preventDefault();
    try {
      const cleaned = { ...editing, name: (editing.name || "").trim() || "(unnamed sample)" };
      if (cleaned.id) {
        saveSamples(samples.map((s) => (s.id === cleaned.id ? cleaned : s)));
        if (viewing && viewing.id === cleaned.id) setViewing(cleaned);
      } else {
        const id = nextId(samples, "SA", 5);
        saveSamples([...samples, { ...cleaned, id }]);
      }
      setShowForm(false);
      setEditing(null);
    } catch (err) {
      console.error("Sample save failed:", err);
      alert("Couldn't save this sample: " + (err && err.message ? err.message : String(err)));
    }
  };

  const set = (field) => (e) => setEditing({ ...editing, [field]: e.target.value });

  /* Adds a brand-new item to a Materials master list (e.g. a fabric color
     that doesn't exist yet) and returns its new id, so a ComboSelect can
     select it immediately without leaving the Sample form. */
  const addMaterialListItem = (listKey, name) => {
    const tab = MATERIAL_LIST_TABS.find((t) => t.key === listKey);
    const list = materialLists[listKey] || [];
    const id = nextId(list, tab.prefix, 4);
    saveMaterialList(listKey, [...list, { id, code: "", name }]);
    return id;
  };

  const matchesSearchAndCustomer = (s) => {
    if (filterCustomer !== "All" && s.customerId !== filterCustomer) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const haystack = [s.id, s.name, s.erpNo, s.manufacturingOrderNo, s.idpNo, s.idcNo, customerName(s.customerId)].join(" ").toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  };

  const filtered = samples.filter((s) => matchesSearchAndCustomer(s) && (filterStage === "All" || s.stage === filterStage));
  const kanbanSamples = samples.filter(matchesSearchAndCustomer);

  const {
    mainMaterials = [], finishes = [], woodSurface = [], fabricTypes = [],
    fabricColors = [], ropeTypes = [], ropeColors = [], cemboardColors = [],
  } = materialLists;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontFamily: FONT_HEAD, fontSize: 26, margin: 0 }}>Samples</h1>
        <Button onClick={startNew}><Plus size={15} /> New sample</Button>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
          <Search size={15} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: COLORS.inkSoft }} />
          <Input
            placeholder="Search by name, sample #, ERP/IDP/IDC no., or customer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 32 }}
          />
        </div>
        <Select value={filterCustomer} onChange={(e) => setFilterCustomer(e.target.value)} style={{ width: 200 }}>
          <option value="All">All customers</option>
          {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
        {viewMode === "grid" && (
          <Select value={filterStage} onChange={(e) => setFilterStage(e.target.value)} style={{ width: 240 }}>
            <option value="All">All stages</option>
            {SAMPLE_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        )}
        <div style={{ display: "flex", border: `1px solid ${COLORS.line}`, borderRadius: 8, overflow: "hidden" }}>
          <button
            onClick={() => setViewMode("kanban")}
            style={{ padding: "8px 14px", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: FONT_BODY, background: viewMode === "kanban" ? COLORS.wood : "#fff", color: viewMode === "kanban" ? "#fff" : COLORS.ink }}
          >
            Kanban
          </button>
          <button
            onClick={() => setViewMode("grid")}
            style={{ padding: "8px 14px", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: FONT_BODY, background: viewMode === "grid" ? COLORS.wood : "#fff", color: viewMode === "grid" ? "#fff" : COLORS.ink }}
          >
            Grid
          </button>
        </div>
      </div>

      {showForm && (
        <Panel title={editing.id ? `Edit ${editing.id}` : "New sample"}>
          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            <SectionHeading>Basic info</SectionHeading>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
              <Field label="Sample name">
                <Input value={editing.name} onChange={set("name")} placeholder="Required — e.g. Dubai Chair" />
              </Field>
              <Field label="Customer">
                <Select value={editing.customerId} onChange={set("customerId")}>
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
              </Field>
              <Field label="Product type">
                <ComboSelect
                  value={editing.productTypeId}
                  onChange={(v) => setEditing({ ...editing, productTypeId: v })}
                  options={productTypes}
                  onAddNew={(name) => addMaterialListItem("productTypes", name)}
                />
              </Field>
              <Field label="Qty">
                <Input type="number" value={editing.qty} onChange={set("qty")} />
              </Field>
              <Field label="ERP No.">
                <Input value={editing.erpNo} onChange={set("erpNo")} placeholder="Company ERP code" />
              </Field>
              <Field label="Manufacturing Order No.">
                <Input value={editing.manufacturingOrderNo} onChange={set("manufacturingOrderNo")} placeholder="Manufacturing order number" />
              </Field>
              <Field label="IDP No.">
                <Input value={editing.idpNo} onChange={set("idpNo")} placeholder="Internal product ID" />
              </Field>
              <Field label="IDC No.">
                <Input value={editing.idcNo} onChange={set("idcNo")} placeholder="Customer's ID" />
              </Field>
            </div>

            <SectionHeading>Dimensions (mm)</SectionHeading>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: 12 }}>
              <Field label="Width"><Input type="number" value={editing.width} onChange={set("width")} /></Field>
              <Field label="Depth"><Input type="number" value={editing.depth} onChange={set("depth")} /></Field>
              <Field label="Height"><Input type="number" value={editing.height} onChange={set("height")} /></Field>
              <Field label="Arm height"><Input type="number" value={editing.armHeight} onChange={set("armHeight")} /></Field>
              <Field label="Seat height"><Input type="number" value={editing.seatHeight} onChange={set("seatHeight")} /></Field>
            </div>

            <SectionHeading>Materials & finishes</SectionHeading>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <Field label="Main material">
                <ComboSelect
                  value={editing.mainMaterialId}
                  onChange={(v) => setEditing({ ...editing, mainMaterialId: v })}
                  options={mainMaterials}
                  onAddNew={(name) => addMaterialListItem("mainMaterials", name)}
                />
              </Field>
              <Field label="Finish / color">
                <ComboSelect
                  value={editing.finishesColorId}
                  onChange={(v) => setEditing({ ...editing, finishesColorId: v })}
                  options={finishes}
                  onAddNew={(name) => addMaterialListItem("finishes", name)}
                />
              </Field>
              <Field label="Wood surface treatment">
                <ComboSelect
                  value={editing.woodSurfaceTreatmentId}
                  onChange={(v) => setEditing({ ...editing, woodSurfaceTreatmentId: v })}
                  options={woodSurface}
                  onAddNew={(name) => addMaterialListItem("woodSurface", name)}
                />
              </Field>
              <Field label="Fabric type">
                <ComboSelect
                  value={editing.fabricTypeId}
                  onChange={(v) => setEditing({ ...editing, fabricTypeId: v })}
                  options={fabricTypes}
                  onAddNew={(name) => addMaterialListItem("fabricTypes", name)}
                />
              </Field>
              <Field label="Fabric color">
                <ComboSelect
                  value={editing.fabricColorId}
                  onChange={(v) => setEditing({ ...editing, fabricColorId: v })}
                  options={fabricColors}
                  onAddNew={(name) => addMaterialListItem("fabricColors", name)}
                />
              </Field>
              <Field label="Rope type">
                <ComboSelect
                  value={editing.ropeTypeId}
                  onChange={(v) => setEditing({ ...editing, ropeTypeId: v })}
                  options={ropeTypes}
                  onAddNew={(name) => addMaterialListItem("ropeTypes", name)}
                />
              </Field>
              <Field label="Rope diameter (mm)">
                <Input type="number" value={editing.ropeDiameter} onChange={set("ropeDiameter")} />
              </Field>
              <Field label="Rope color">
                <ComboSelect
                  value={editing.ropeColorId}
                  onChange={(v) => setEditing({ ...editing, ropeColorId: v })}
                  options={ropeColors}
                  onAddNew={(name) => addMaterialListItem("ropeColors", name)}
                />
              </Field>
              <Field label="Metal name">
                <Input value={editing.metalName} onChange={set("metalName")} />
              </Field>
              <Field label="Metal color">
                <Input value={editing.metalColor} onChange={set("metalColor")} />
              </Field>
              <Field label="Cemboard color">
                <ComboSelect
                  value={editing.cemboardColorId}
                  onChange={(v) => setEditing({ ...editing, cemboardColorId: v })}
                  options={cemboardColors}
                  onAddNew={(name) => addMaterialListItem("cemboardColors", name)}
                />
              </Field>
              <Field label="Hardware">
                <Input value={editing.hardware} onChange={set("hardware")} />
              </Field>
              <Field label="Construction">
                <Input list="construction-options" value={editing.construction} onChange={set("construction")} />
                <datalist id="construction-options">
                  {CONSTRUCTION_OPTIONS.map((c) => <option key={c} value={c} />)}
                </datalist>
              </Field>
              <Field label="Current revision">
                <Input value={editing.currentRevision} onChange={set("currentRevision")} />
              </Field>
            </div>

            <SectionHeading>Production & stage tracking</SectionHeading>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <Field label="Stage group">
                <Input list="stage-group-options" value={editing.stageGroup} onChange={set("stageGroup")} />
                <datalist id="stage-group-options">
                  {SAMPLE_STAGE_GROUPS.map((s) => <option key={s} value={s} />)}
                </datalist>
              </Field>
              <Field label="Current stage">
                <Select value={editing.stage} onChange={set("stage")}>
                  {SAMPLE_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                </Select>
              </Field>
              <Field label="Stage status">
                <Input value={editing.stageStatus} onChange={set("stageStatus")} />
              </Field>
              <Field label="Waiting for">
                <Input value={editing.waitingFor} onChange={set("waitingFor")} />
              </Field>
              <Field label="Next action">
                <Input value={editing.nextAction} onChange={set("nextAction")} />
              </Field>
              <Field label="Priority">
                <Select value={editing.priority} onChange={set("priority")}>
                  <option value="">—</option>
                  {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                </Select>
              </Field>
              <Field label="Stage start date">
                <Input type="date" value={editing.stageStartDate} onChange={set("stageStartDate")} />
              </Field>
              <Field label="Stage due date">
                <Input type="date" value={editing.stageDueDate} onChange={set("stageDueDate")} />
              </Field>
              <Field label="Stage SLA (days)">
                <Input value={editing.stageSlaDays} onChange={set("stageSlaDays")} />
              </Field>
              <Field label="Target date">
                <Input type="date" value={editing.targetDate} onChange={set("targetDate")} />
              </Field>
              <Field label="Completed date">
                <Input type="date" value={editing.completedDate} onChange={set("completedDate")} />
              </Field>
              <Field label="Overall status">
                <Input value={editing.overallStatus} onChange={set("overallStatus")} />
              </Field>
              <Field label="Linked order">
                <Select value={editing.orderId} onChange={set("orderId")}>
                  <option value="">—</option>
                  {orders.map((o) => <option key={o.id} value={o.id}>{o.id}</option>)}
                </Select>
              </Field>
            </div>

            <SectionHeading>Reference & notes</SectionHeading>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
              <Field label="Sample photo">
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {editing.image ? (
                    <div style={{ position: "relative", width: "100%", maxWidth: 420 }}>
                      <img
                        src={editing.image}
                        alt={editing.name || "Sample preview"}
                        style={{ width: "100%", maxHeight: 240, objectFit: "contain", borderRadius: 10, border: `1px solid ${COLORS.line}`, background: COLORS.bg }}
                        onError={(e) => { e.currentTarget.style.display = "none"; }}
                      />
                    </div>
                  ) : (
                    <div style={{ padding: 16, border: `1px dashed ${COLORS.line}`, borderRadius: 10, color: COLORS.inkSoft, fontSize: 13 }}>
                      No sample photo selected.
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleSampleImageUpload}
                      style={{ display: "none" }}
                    />
                    <Button type="button" variant="subtle" onClick={() => imageInputRef.current?.click()} disabled={imageUploading}>
                      <ImageIcon size={15} />
                      {imageUploading ? "Processing…" : editing.image ? "Change photo" : "Upload from computer"}
                    </Button>
                    {editing.image && (
                      <Button type="button" variant="ghost" onClick={clearSampleImage}>
                        <X size={14} /> Remove
                      </Button>
                    )}
                  </div>

                  <div style={{ fontSize: 11.5, color: COLORS.inkSoft }}>
                    JPG, PNG, WebP or other browser-supported image • max 15 MB before compression.
                  </div>
                </div>
              </Field>
              <Field label="Notes">
                <TextArea rows={2} value={editing.notes} onChange={set("notes")} />
              </Field>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <Button type="button" onClick={submit}>Save</Button>
              <Button variant="ghost" onClick={() => { setShowForm(false); setEditing(null); }}>Cancel</Button>
            </div>
          </form>
        </Panel>
      )}

      {viewing && !showForm && (
        <SampleDetail
          sample={viewing}
          customerName={customerName}
          productTypeName={productTypeName}
          materialLists={materialLists}
          materialPreps={materialPreps.filter((p) => p.sampleId === viewing.id)}
          saveMaterialPreps={saveMaterialPreps}
          allMaterialPreps={materialPreps}
          relatedTasks={tasks.filter((t) => t.sampleId === viewing.id)}
          allTasks={tasks}
          saveTasks={saveTasks}
          onEdit={() => startEdit(viewing)}
          onClose={() => setViewing(null)}
          onDelete={() => remove(viewing.id)}
          onSaveSample={(updated) => {
            saveSamples(samples.map((s) => (s.id === updated.id ? updated : s)));
            setViewing(updated);
          }}
        />
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 12.5, color: COLORS.inkSoft }}>
          {(viewMode === "kanban" ? kanbanSamples : filtered).length} sample{(viewMode === "kanban" ? kanbanSamples : filtered).length === 1 ? "" : "s"}
        </div>
      </div>

      {viewMode === "kanban" ? (
        <KanbanBoard samples={kanbanSamples} customerName={customerName} moveStage={moveStage} onCardClick={(s) => { setViewing(s); setShowForm(false); }} />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
          {filtered.map((s) => (
            <SampleCard
              key={s.id}
              sample={s}
              customerName={customerName(s.customerId)}
              onClick={() => { setViewing(s); setShowForm(false); }}
            />
          ))}
          {filtered.length === 0 && (
            <div style={{ gridColumn: "1 / -1", padding: "40px 0", textAlign: "center", color: COLORS.inkSoft, fontSize: 14 }}>
              No samples match your search/filters.
            </div>
          )}
        </div>
      )}
    </div>

  );
}

function SampleCard({ sample: s, customerName, onClick }) {
  const ot = sampleOnTime(s);
  return (
    <div
      onClick={onClick}
      style={{
        background: COLORS.panel,
        border: `1px solid ${COLORS.line}`,
        borderRadius: 12,
        overflow: "hidden",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        transition: "transform .12s, box-shadow .12s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 16px rgba(37,33,28,0.08)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
    >
      <div style={{ position: "relative", width: "100%", paddingTop: "75%", background: COLORS.bg }}>
        {s.image ? (
          <img
            src={s.image}
            alt={s.name}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
            onError={(e) => { e.target.style.display = "none"; }}
          />
        ) : (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.inkSoft }}>
            <ImageIcon size={28} strokeWidth={1.5} />
          </div>
        )}
        <div style={{ position: "absolute", top: 8, left: 8 }}>
          {ot !== null && (ot ? <Badge tone="green">On time</Badge> : <Badge tone="red">Late</Badge>)}
        </div>
        {s.priority && (
          <div style={{ position: "absolute", top: 8, right: 8 }}>
            <Badge tone={priorityTone(s.priority)}>{s.priority}</Badge>
          </div>
        )}
      </div>
      <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{ fontSize: 11.5, color: COLORS.inkSoft, fontWeight: 600 }}>{s.id}</div>
        <div style={{ fontFamily: FONT_HEAD, fontSize: 15, fontWeight: 600, lineHeight: 1.25 }}>{s.name}</div>
        <div style={{ fontSize: 12.5, color: COLORS.inkSoft }}>{customerName}</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
          <Badge tone="wood">{s.stage}</Badge>
          {s.targetDate && <span style={{ fontSize: 11.5, color: COLORS.inkSoft }}>{s.targetDate}</span>}
        </div>
      </div>
    </div>
  );
}

function KanbanBoard({ samples, customerName, moveStage, onCardClick }) {
  const [dragOverStage, setDragOverStage] = useState(null);
  const [draggingId, setDraggingId] = useState(null);

  const byStage = (stage) => samples.filter((s) => s.stage === stage);

  const handleDrop = (e, stage) => {
    e.preventDefault();
    setDragOverStage(null);
    const id = e.dataTransfer.getData("text/sample-id") || draggingId;
    if (id) moveStage(id, stage);
    setDraggingId(null);
  };

  return (
    <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 8 }}>
      {SAMPLE_STAGES.map((stage) => {
        const cards = byStage(stage);
        const isOver = dragOverStage === stage;
        return (
          <div
            key={stage}
            onDragOver={(e) => { e.preventDefault(); setDragOverStage(stage); }}
            onDragLeave={() => setDragOverStage((cur) => (cur === stage ? null : cur))}
            onDrop={(e) => handleDrop(e, stage)}
            style={{
              flex: "0 0 250px",
              width: 250,
              background: isOver ? COLORS.amberSoft : COLORS.bg,
              border: `1px solid ${isOver ? COLORS.amber : COLORS.line}`,
              borderRadius: 12,
              display: "flex",
              flexDirection: "column",
              maxHeight: 700,
            }}
          >
            <div style={{ padding: "10px 12px", borderBottom: `1px solid ${COLORS.line}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: COLORS.woodDark }}>{stage}</span>
              <span style={{ fontSize: 11.5, color: COLORS.inkSoft, background: "#fff", borderRadius: 999, padding: "1px 8px", border: `1px solid ${COLORS.line}` }}>{cards.length}</span>
            </div>
            <div style={{ padding: 8, display: "flex", flexDirection: "column", gap: 8, overflowY: "auto" }}>
              {cards.map((s) => (
                <KanbanCard
                  key={s.id}
                  sample={s}
                  customerName={customerName(s.customerId)}
                  onClick={() => onCardClick(s)}
                  onDragStart={(e) => { e.dataTransfer.setData("text/sample-id", s.id); setDraggingId(s.id); }}
                  onDragEnd={() => setDraggingId(null)}
                  onMoveStage={(newStage) => moveStage(s.id, newStage)}
                />
              ))}
              {cards.length === 0 && (
                <div style={{ fontSize: 12, color: COLORS.inkSoft, textAlign: "center", padding: "16px 4px" }}>No samples</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function KanbanCard({ sample: s, customerName, onClick, onDragStart, onDragEnd, onMoveStage }) {
  const ot = sampleOnTime(s);
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      style={{
        background: "#fff",
        border: `1px solid ${COLORS.line}`,
        borderRadius: 9,
        padding: 9,
        cursor: "grab",
        display: "flex",
        gap: 8,
      }}
    >
      <div onClick={onClick} style={{ position: "relative", width: 44, height: 44, borderRadius: 7, background: COLORS.bg, flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
        {s.image ? (
          <img src={s.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { e.target.style.display = "none"; }} />
        ) : (
          <ImageIcon size={16} color={COLORS.inkSoft} />
        )}
        {ot !== null && (
          <div style={{ position: "absolute", bottom: -2, right: -2, width: 9, height: 9, borderRadius: "50%", background: ot ? COLORS.green : COLORS.red, border: "1.5px solid #fff" }} title={ot ? "On time" : "Late"} />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }} onClick={onClick}>
        <div style={{ fontSize: 11, color: COLORS.inkSoft, cursor: "pointer" }}>{s.erpNo ? `ERP: ${s.erpNo}` : "No ERP code"}</div>
        {s.manufacturingOrderNo && (
          <div style={{ fontSize: 11, color: COLORS.inkSoft, cursor: "pointer" }}>MO: {s.manufacturingOrderNo}</div>
        )}
        <div style={{ fontSize: 13, fontWeight: 600, cursor: "pointer", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</div>
        <div style={{ fontSize: 11.5, color: COLORS.inkSoft, cursor: "pointer", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {s.nextAction ? `Next: ${s.nextAction}` : "No next action set"}
        </div>
        <select
          value={s.stage}
          onChange={(e) => onMoveStage(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          style={{ marginTop: 6, width: "100%", fontSize: 11, padding: "4px 6px", borderRadius: 6, border: `1px solid ${COLORS.line}`, background: COLORS.bg, color: COLORS.ink, fontFamily: FONT_BODY }}
        >
          {SAMPLE_STAGES.map((st) => <option key={st} value={st}>{st}</option>)}

        </select>
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  if (value === "" || value === null || value === undefined) return null;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "6px 0", borderBottom: `1px solid ${COLORS.line}`, fontSize: 13.5 }}>
      <span style={{ color: COLORS.inkSoft }}>{label}</span>
      <span style={{ fontWeight: 600, textAlign: "right" }}>{value}</span>
    </div>
  );
}

function SampleDetail({ sample: s, customerName, productTypeName, materialLists, materialPreps, saveMaterialPreps, allMaterialPreps, relatedTasks, allTasks, saveTasks, onEdit, onClose, onDelete, onSaveSample }) {
  const { mainMaterials = [], finishes = [], woodSurface = [], fabricTypes = [], fabricColors = [], ropeTypes = [], ropeColors = [], cemboardColors = [] } = materialLists;

  const dims = [s.width, s.depth, s.height].filter((v) => v !== "" && v != null).length
    ? `${s.width || "—"} × ${s.depth || "—"} × ${s.height || "—"} mm`
    : "";

  const ot = sampleOnTime(s);

  const [newPrep, setNewPrep] = useState({ materialName: "", startDate: "", dueDate: "", status: "Pending", photo: "" });
  const [newRevision, setNewRevision] = useState({ date: todayStr(), changeReason: "", photo: "", note: "" });
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskDeadline, setNewTaskDeadline] = useState("");

  const addRelatedTask = () => {
    if (!newTaskName.trim()) return;
    const id = nextId(allTasks, "TSK", 4);
    saveTasks([...allTasks, { ...BLANK_TASK, id, name: newTaskName.trim(), deadline: newTaskDeadline, sampleId: s.id }]);
    setNewTaskName("");
    setNewTaskDeadline("");
  };
  const cycleTaskStatus = (task) => {
    const idx = TASK_STATUSES.indexOf(task.status);
    const next = TASK_STATUSES[(idx + 1) % TASK_STATUSES.length];
    saveTasks(allTasks.map((t) => (t.id === task.id ? { ...t, status: next } : t)));
  };

  const lookupLists = { mainMaterials, fabricTypes, ropeTypes, cemboardColors };

  /* One progress-tracking row per material actually specified on this
     sample (Main material, Fabric, Rope, Metal, Cemboard, Hardware).
     The label is always read live from the spec above, so if the spec
     changes the row relabels itself automatically — only the progress
     (dates / status / photo) is what gets saved and followed up on. */
  const autoRows = COMPONENT_FIELDS
    .filter((cf) => !!s[cf.field])
    .map((cf) => {
      const label = cf.lookupKey ? lookupName(lookupLists[cf.lookupKey] || [], s[cf.field]) : s[cf.field];
      const existing = materialPreps.find((p) => p.componentField === cf.field);
      return existing
        ? { ...existing, displayName: `${cf.label}: ${label}` }
        : { id: null, sampleId: s.id, componentField: cf.field, displayName: `${cf.label}: ${label}`, startDate: "", dueDate: "", status: "Pending", photo: "" };
    });

  const manualRows = materialPreps.filter((p) => !p.componentField);

  const updateAutoRow = (cf, row, field, value) => {
    if (row.id) {
      saveMaterialPreps(allMaterialPreps.map((p) => (p.id === row.id ? { ...p, [field]: value } : p)));
    } else {
      const id = nextId(allMaterialPreps, "SMP", 4);
      saveMaterialPreps([...allMaterialPreps, { id, sampleId: s.id, componentField: cf.field, materialName: row.displayName, startDate: "", dueDate: "", status: "Pending", photo: "", [field]: value }]);
    }
  };

  const addPrep = () => {
    if (!newPrep.materialName.trim()) return;
    const id = nextId(allMaterialPreps, "SMP", 4);
    saveMaterialPreps([...allMaterialPreps, { ...newPrep, id, sampleId: s.id }]);
    setNewPrep({ materialName: "", startDate: "", dueDate: "", status: "Pending", photo: "" });
  };
  const updatePrep = (id, field, value) => {
    saveMaterialPreps(allMaterialPreps.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };
  const removePrep = (id) => saveMaterialPreps(allMaterialPreps.filter((p) => p.id !== id));

  const addRevision = () => {
    if (!newRevision.changeReason.trim()) return;
    const rev = { ...newRevision, id: "rev" + Date.now() };
    const updated = { ...s, revisions: [rev, ...(s.revisions || [])] };
    onSaveSample(updated);
    setNewRevision({ date: todayStr(), changeReason: "", photo: "", note: "" });
  };

  return (
    <Panel
      title={`${s.id} — ${s.name}`}
      action={
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {ot !== null && (ot ? <Badge tone="green">On time</Badge> : <Badge tone="red">Late</Badge>)}
          <Button small variant="subtle" onClick={onEdit}>Edit</Button>
          <Button small variant="danger" onClick={onDelete}>Delete</Button>
          <Button small variant="ghost" onClick={onClose}><X size={14} /> Close</Button>
        </div>
      }
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24 }}>
        <div>
          {s.image ? (
            <img   src={s.image}   alt={s.name}   style={{     width: "100%",     aspectRatio: "1 / 1",     borderRadius: 10,     border: `1px solid ${COLORS.line}`,     marginBottom: 14,     objectFit: "contain",     background: COLORS.bg,     display: "block",   }}   onError={(e) => { e.target.style.display = "none"; }} />
          ) : (
            <div style={{ width: "100%", height: 100, borderRadius: 10, border: `1px dashed ${COLORS.line}`, marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.inkSoft, fontSize: 12.5, gap: 6 }}>
              <ImageIcon size={16} /> No photo yet
            </div>
          )}
          <SectionHeading>Basic info</SectionHeading>
          <DetailRow label="Customer" value={customerName(s.customerId)} />
          <DetailRow label="Product type" value={productTypeName(s.productTypeId)} />
          <DetailRow label="Qty" value={s.qty} />
          <DetailRow label="ERP No." value={s.erpNo} />
          <DetailRow label="Manufacturing Order No." value={s.manufacturingOrderNo} />
          <DetailRow label="IDP No." value={s.idpNo} />
          <DetailRow label="IDC No." value={s.idcNo} />
          <DetailRow label="Dimensions (W×D×H)" value={dims} />
          <DetailRow label="Arm height" value={s.armHeight} />
          <DetailRow label="Seat height" value={s.seatHeight} />
        </div>
        <div>
          <SectionHeading>Materials & finishes</SectionHeading>
          <DetailRow label="Main material" value={lookupName(mainMaterials, s.mainMaterialId)} />
          <DetailRow label="Finish / color" value={lookupName(finishes, s.finishesColorId)} />
          <DetailRow label="Wood surface" value={lookupName(woodSurface, s.woodSurfaceTreatmentId)} />
          <DetailRow label="Fabric type" value={lookupName(fabricTypes, s.fabricTypeId)} />
          <DetailRow label="Fabric color" value={lookupName(fabricColors, s.fabricColorId)} />
          <DetailRow label="Rope type" value={lookupName(ropeTypes, s.ropeTypeId)} />
          <DetailRow label="Rope diameter" value={s.ropeDiameter} />
          <DetailRow label="Rope color" value={lookupName(ropeColors, s.ropeColorId)} />
          <DetailRow label="Metal name" value={s.metalName} />
          <DetailRow label="Metal color" value={s.metalColor} />
          <DetailRow label="Cemboard color" value={lookupName(cemboardColors, s.cemboardColorId)} />
          <DetailRow label="Hardware" value={s.hardware} />
          <DetailRow label="Construction" value={s.construction} />
          <DetailRow label="Revision" value={s.currentRevision} />
        </div>
        <div>
          <SectionHeading>Production & stage</SectionHeading>
          <DetailRow label="Stage group" value={s.stageGroup} />
          <DetailRow label="Current stage" value={s.stage} />
          <DetailRow label="Stage status" value={s.stageStatus} />
          <DetailRow label="Waiting for" value={s.waitingFor} />
          <DetailRow label="Next action" value={s.nextAction} />
          <DetailRow label="Priority" value={s.priority} />
          <DetailRow label="Stage start" value={s.stageStartDate} />
          <DetailRow label="Stage due" value={s.stageDueDate} />
          <DetailRow label="Stage SLA" value={s.stageSlaDays} />
          <DetailRow label="Target date" value={s.targetDate} />
          <DetailRow label="Completed date" value={s.completedDate} />
          <DetailRow label="Overall status" value={s.overallStatus} />
          <DetailRow label="Linked order" value={s.orderId} />
        </div>
      </div>

      {s.notes && (
        <div style={{ marginTop: 16 }}>
          <SectionHeading>Notes</SectionHeading>
          <div style={{ fontSize: 13.5, marginTop: 8, whiteSpace: "pre-wrap" }}>{s.notes}</div>
        </div>
      )}

      {/* Material progress — tracks WHEN each material in the spec above actually arrives */}
      <div style={{ marginTop: 20 }}>
        <SectionHeading>Material progress</SectionHeading>
        <div style={{ fontSize: 12.5, color: COLORS.inkSoft, marginTop: 6, marginBottom: 10 }}>
          One row per material selected above (Frame, Fabric, Rope, Metal, Cemboard, Hardware). Set the dates, mark status, and drop a photo in once it's confirmed arrived.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {autoRows.length === 0 && (
            <div style={{ color: COLORS.inkSoft, fontSize: 13.5 }}>No materials selected yet in "Materials & finishes" above — fill those in first.</div>
          )}
          {autoRows.map((row) => {
            const cf = COMPONENT_FIELDS.find((c) => c.field === row.componentField);
            return (
              <div key={row.componentField} style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr 1.4fr", gap: 8, alignItems: "center", fontSize: 13, background: COLORS.bg, padding: "8px 10px", borderRadius: 8 }}>
                <div style={{ fontWeight: 600 }}>{row.displayName}</div>
                <Input type="date" value={row.startDate} onChange={(e) => updateAutoRow(cf, row, "startDate", e.target.value)} style={{ fontSize: 12.5, padding: "5px 8px" }} />
                <Input type="date" value={row.dueDate} onChange={(e) => updateAutoRow(cf, row, "dueDate", e.target.value)} style={{ fontSize: 12.5, padding: "5px 8px" }} />
                <Select value={row.status} onChange={(e) => updateAutoRow(cf, row, "status", e.target.value)} style={{ fontSize: 12.5, padding: "5px 8px" }}>
                  {PREP_STATUS_OPTIONS.map((st) => <option key={st} value={st}>{st}</option>)}
                </Select>
                <Input placeholder="Photo proof URL" value={row.photo} onChange={(e) => updateAutoRow(cf, row, "photo", e.target.value)} style={{ fontSize: 12.5, padding: "5px 8px" }} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Additional materials — anything not covered by the fixed spec fields (e.g. Cushion, Packaging) */}
      <div style={{ marginTop: 20 }}>
        <SectionHeading>Additional materials</SectionHeading>
        <div style={{ fontSize: 12.5, color: COLORS.inkSoft, marginTop: 6, marginBottom: 10 }}>
          For components that aren't one of the fixed spec fields above.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {manualRows.map((p) => (
            <div key={p.id} style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr 1.4fr 28px", gap: 8, alignItems: "center", fontSize: 13, background: COLORS.bg, padding: "8px 10px", borderRadius: 8 }}>
              <div style={{ fontWeight: 600 }}>{p.materialName}</div>
              <Input type="date" value={p.startDate} onChange={(e) => updatePrep(p.id, "startDate", e.target.value)} style={{ fontSize: 12.5, padding: "5px 8px" }} />
              <Input type="date" value={p.dueDate} onChange={(e) => updatePrep(p.id, "dueDate", e.target.value)} style={{ fontSize: 12.5, padding: "5px 8px" }} />
              <Select value={p.status} onChange={(e) => updatePrep(p.id, "status", e.target.value)} style={{ fontSize: 12.5, padding: "5px 8px" }}>
                {PREP_STATUS_OPTIONS.map((st) => <option key={st} value={st}>{st}</option>)}
              </Select>
              <Input placeholder="Photo proof URL" value={p.photo} onChange={(e) => updatePrep(p.id, "photo", e.target.value)} style={{ fontSize: 12.5, padding: "5px 8px" }} />
              <button onClick={() => removePrep(p.id)} title="Remove" style={{ border: "none", background: "none", color: COLORS.red, cursor: "pointer", fontSize: 16 }}>×</button>
            </div>
          ))}

          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr 1.4fr 28px", gap: 8, alignItems: "center", marginTop: 6 }}>
            <Input list="prep-material-options" placeholder="e.g. Cushion" value={newPrep.materialName} onChange={(e) => setNewPrep({ ...newPrep, materialName: e.target.value })} style={{ fontSize: 12.5, padding: "5px 8px" }} />
            <datalist id="prep-material-options">
              {PREP_MATERIAL_SUGGESTIONS.map((m) => <option key={m} value={m} />)}
            </datalist>
            <Input type="date" value={newPrep.startDate} onChange={(e) => setNewPrep({ ...newPrep, startDate: e.target.value })} style={{ fontSize: 12.5, padding: "5px 8px" }} />
            <Input type="date" value={newPrep.dueDate} onChange={(e) => setNewPrep({ ...newPrep, dueDate: e.target.value })} style={{ fontSize: 12.5, padding: "5px 8px" }} />
            <Select value={newPrep.status} onChange={(e) => setNewPrep({ ...newPrep, status: e.target.value })} style={{ fontSize: 12.5, padding: "5px 8px" }}>
              {PREP_STATUS_OPTIONS.map((st) => <option key={st} value={st}>{st}</option>)}
            </Select>
            <Input placeholder="Photo proof URL" value={newPrep.photo} onChange={(e) => setNewPrep({ ...newPrep, photo: e.target.value })} style={{ fontSize: 12.5, padding: "5px 8px" }} />
            <button onClick={addPrep} title="Add" style={{ border: "none", background: "none", color: COLORS.green, cursor: "pointer", fontSize: 20, fontWeight: 700 }}>+</button>
          </div>
        </div>
      </div>

      {/* Revision history — "hình ảnh và các revise để follow" */}
      <div style={{ marginTop: 20 }}>
        <SectionHeading>Revision history</SectionHeading>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
          {(s.revisions || []).length === 0 && <div style={{ color: COLORS.inkSoft, fontSize: 13.5 }}>No revisions logged yet.</div>}
          {(s.revisions || []).map((r) => (
            <div key={r.id} style={{ display: "flex", gap: 12, borderBottom: `1px solid ${COLORS.line}`, paddingBottom: 10 }}>
              {r.photo && <img src={r.photo} alt="" style={{ width: 60, height: 60, borderRadius: 8, objectFit: "cover", border: `1px solid ${COLORS.line}` }} onError={(e) => { e.target.style.display = "none"; }} />}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12.5, color: COLORS.inkSoft }}>{r.date}</div>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{r.changeReason}</div>
                {r.note && <div style={{ fontSize: 13, color: COLORS.inkSoft, marginTop: 2 }}>{r.note}</div>}
              </div>
            </div>
          ))}

          <div style={{ display: "grid", gridTemplateColumns: "120px 1fr 1fr", gap: 8 }}>
            <Input type="date" value={newRevision.date} onChange={(e) => setNewRevision({ ...newRevision, date: e.target.value })} style={{ fontSize: 12.5, padding: "5px 8px" }} />
            <Input placeholder="What changed?" value={newRevision.changeReason} onChange={(e) => setNewRevision({ ...newRevision, changeReason: e.target.value })} style={{ fontSize: 12.5, padding: "5px 8px" }} />
            <Input placeholder="Photo URL (optional)" value={newRevision.photo} onChange={(e) => setNewRevision({ ...newRevision, photo: e.target.value })} style={{ fontSize: 12.5, padding: "5px 8px" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 100px", gap: 8 }}>
            <Input placeholder="Note (optional)" value={newRevision.note} onChange={(e) => setNewRevision({ ...newRevision, note: e.target.value })} style={{ fontSize: 12.5, padding: "5px 8px" }} />
            <Button small onClick={addRevision}><Plus size={13} /> Add revision</Button>
          </div>
        </div>
      </div>

      {/* Related tasks — day-to-day follow-ups tied to this sample */}
      <div style={{ marginTop: 20 }}>
        <SectionHeading>Related tasks</SectionHeading>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
          {relatedTasks.length === 0 && <div style={{ color: COLORS.inkSoft, fontSize: 13.5 }}>No tasks linked to this sample yet.</div>}
          {relatedTasks.map((t) => (
            <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, background: COLORS.bg, padding: "8px 10px", borderRadius: 8, fontSize: 13 }}>
              <div>
                <div style={{ fontWeight: 600 }}>{t.name}</div>
                <div style={{ fontSize: 11.5, color: COLORS.inkSoft }}>{t.referencePerson || "—"}{t.deadline ? ` · ${t.deadline}` : ""}</div>
              </div>
              <button onClick={() => cycleTaskStatus(t)} title="Click to advance status" style={{ border: "none", cursor: "pointer", background: "none", padding: 0 }}>
                <Badge tone={taskStatusTone(t.status)}>{t.status}</Badge>
              </button>
            </div>
          ))}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 140px auto", gap: 8, marginTop: 4 }}>
            <Input placeholder="Quick add a task for this sample…" value={newTaskName} onChange={(e) => setNewTaskName(e.target.value)} style={{ fontSize: 12.5, padding: "6px 9px" }} />
            <Input type="date" value={newTaskDeadline} onChange={(e) => setNewTaskDeadline(e.target.value)} style={{ fontSize: 12.5, padding: "6px 9px" }} />
            <Button small onClick={addRelatedTask}><Plus size={13} /> Add</Button>
          </div>
        </div>
      </div>
    </Panel>
  );
}

/* ---------------- Calendar / Production Dashboard ---------------- */

function buildMonthGrid(year, month) {
  const first = new Date(year, month, 1);
  const startWeekday = first.getDay();
  const daysInMon = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMon; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function CalendarView({ samples, materialPreps, tasks, customerName }) {
  const now = new Date();
  const [cursor, setCursor] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(null);

  const events = [];
  materialPreps.forEach((p) => {
    if (p.dueDate) {
      const sample = samples.find((s) => s.id === p.sampleId);
      events.push({
        date: p.dueDate,
        type: "material",
        label: `${p.materialName} — ${sample ? sample.name : p.sampleId}`,
        sampleId: p.sampleId,
        status: p.status,
        overdue: p.status !== "Done" && new Date(p.dueDate) < new Date(new Date().toDateString()),
      });
    }
  });
  samples.forEach((s) => {
    if (s.targetDate) {
      events.push({
        date: s.targetDate,
        type: "sample",
        label: `${s.name} (target)`,
        sampleId: s.id,
        status: s.stage,
        overdue: s.stage !== "Completed" && new Date(s.targetDate) < new Date(new Date().toDateString()),
      });
    }
  });
  tasks.forEach((t) => {
    if (t.deadline) {
      events.push({
        date: t.deadline,
        type: "task",
        label: t.name,
        sampleId: t.sampleId,
        status: t.status,
        overdue: isTaskOverdue(t),
      });
    }
  });

  const eventsByDate = {};
  events.forEach((ev) => {
    eventsByDate[ev.date] = eventsByDate[ev.date] || [];
    eventsByDate[ev.date].push(ev);
  });

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const grid = buildMonthGrid(year, month);
  const monthLabel = cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const todayIso = new Date().toISOString().slice(0, 10);

  const overdue = events.filter((e) => e.overdue).sort((a, b) => new Date(a.date) - new Date(b.date));
  const upcoming = events
    .filter((e) => !e.overdue && e.date >= todayIso && (new Date(e.date) - new Date(todayIso)) / 86400000 <= 14)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const completedKnown = samples.filter((s) => sampleOnTime(s) !== null);
  const onTimeCount = completedKnown.filter((s) => sampleOnTime(s)).length;
  const onTimeRate = completedKnown.length ? Math.round((onTimeCount / completedKnown.length) * 100) : null;

  const dotColor = (ev) => {
    if (ev.overdue) return COLORS.red;
    if (ev.status === "Done" || ev.status === "Completed") return COLORS.green;
    if (ev.type === "material") return COLORS.amber;
    if (ev.type === "task") return COLORS.teal;
    return COLORS.wood;
  };

  const eventTypeLabel = (ev) => ({ material: "Material", sample: "Sample target", task: "Task" }[ev.type] || ev.type);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontFamily: FONT_HEAD, fontSize: 26, margin: 0 }}>Production Calendar</h1>
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 18, flex: 1, minWidth: 160 }}>
          <div style={{ fontSize: 12.5, color: COLORS.inkSoft, fontWeight: 600, marginBottom: 6 }}>Goal: on-time or early</div>
          <div style={{ fontFamily: FONT_HEAD, fontSize: 26, fontWeight: 700, color: onTimeRate === null ? COLORS.ink : onTimeRate >= 80 ? COLORS.green : COLORS.red }}>
            {onTimeRate === null ? "No data yet" : `${onTimeRate}% on time`}
          </div>
          <div style={{ fontSize: 12, color: COLORS.inkSoft, marginTop: 4 }}>{onTimeCount}/{completedKnown.length} completed samples hit target</div>
        </div>
        <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 18, flex: 1, minWidth: 160 }}>
          <div style={{ fontSize: 12.5, color: COLORS.inkSoft, fontWeight: 600, marginBottom: 6 }}>Overdue right now</div>
          <div style={{ fontFamily: FONT_HEAD, fontSize: 26, fontWeight: 700, color: overdue.length ? COLORS.red : COLORS.green }}>{overdue.length}</div>
        </div>
        <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 18, flex: 1, minWidth: 160 }}>
          <div style={{ fontSize: 12.5, color: COLORS.inkSoft, fontWeight: 600, marginBottom: 6 }}>Due in next 14 days</div>
          <div style={{ fontFamily: FONT_HEAD, fontSize: 26, fontWeight: 700 }}>{upcoming.length}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16 }}>
        <Panel
          title={monthLabel}
          action={
            <div style={{ display: "flex", gap: 6 }}>
              <Button small variant="subtle" onClick={() => setCursor(new Date(year, month - 1, 1))}>‹ Prev</Button>
              <Button small variant="subtle" onClick={() => setCursor(new Date(now.getFullYear(), now.getMonth(), 1))}>Today</Button>
              <Button small variant="subtle" onClick={() => setCursor(new Date(year, month + 1, 1))}>Next ›</Button>
            </div>
          }
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 6 }}>
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <div key={d} style={{ textAlign: "center", fontSize: 11.5, fontWeight: 700, color: COLORS.inkSoft }}>{d}</div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
            {grid.map((d, i) => {
              if (!d) return <div key={i} />;
              const iso = d.toISOString().slice(0, 10);
              const dayEvents = eventsByDate[iso] || [];
              const isToday = iso === todayIso;
              const isSelected = iso === selectedDate;
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(iso)}
                  style={{
                    aspectRatio: "1",
                    border: isSelected ? `2px solid ${COLORS.wood}` : `1px solid ${COLORS.line}`,
                    background: isToday ? COLORS.amberSoft : "#fff",
                    borderRadius: 8,
                    padding: 4,
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 3,
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: isToday ? 700 : 500 }}>{d.getDate()}</span>
                  <div style={{ display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "center" }}>
                    {dayEvents.slice(0, 4).map((ev, j) => (
                      <span key={j} style={{ width: 6, height: 6, borderRadius: "50%", background: dotColor(ev) }} />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </Panel>

        <Panel title={selectedDate ? `Events on ${selectedDate}` : "Select a day"}>
          {selectedDate ? (
            (eventsByDate[selectedDate] || []).length ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {eventsByDate[selectedDate].map((ev, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, borderBottom: `1px solid ${COLORS.line}`, paddingBottom: 8 }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{ev.label}</div>
                      <div style={{ color: COLORS.inkSoft, fontSize: 12 }}>{eventTypeLabel(ev)}</div>
                    </div>
                    <Badge tone={ev.overdue ? "red" : ev.status === "Done" || ev.status === "Completed" ? "green" : "amber"}>{ev.status}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: COLORS.inkSoft, fontSize: 13.5 }}>Nothing due this day.</div>
            )
          ) : (
            <div style={{ color: COLORS.inkSoft, fontSize: 13.5 }}>Click a date on the calendar to see what's due.</div>
          )}
        </Panel>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Panel title="Overdue">
          {overdue.length === 0 && <div style={{ color: COLORS.green, fontSize: 13.5 }}>Nothing overdue — all caught up.</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {overdue.map((ev, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, borderBottom: `1px solid ${COLORS.line}`, paddingBottom: 7 }}>
                <span>{ev.label}</span>
                <span style={{ color: COLORS.red, fontWeight: 600, whiteSpace: "nowrap" }}>{ev.date}</span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Coming up (14 days)">
          {upcoming.length === 0 && <div style={{ color: COLORS.inkSoft, fontSize: 13.5 }}>Nothing due soon.</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {upcoming.map((ev, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, borderBottom: `1px solid ${COLORS.line}`, paddingBottom: 7 }}>
                <span>{ev.label}</span>
                <span style={{ color: COLORS.inkSoft, whiteSpace: "nowrap" }}>{ev.date}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* ---------------- Materials master data ---------------- */

function MaterialsView({ materialLists, saveList }) {
  const [activeTab, setActiveTab] = useState(MATERIAL_LIST_TABS[0].key);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const tab = MATERIAL_LIST_TABS.find((t) => t.key === activeTab);
  const list = materialLists[activeTab] || [];

  const startNew = () => { setEditing({ id: "", code: "", name: "" }); setShowForm(true); };
  const startEdit = (m) => { setEditing({ ...m }); setShowForm(true); };
  const remove = (id) => { if (!confirm("Delete this item?")) return; saveList(activeTab, list.filter((m) => m.id !== id)); };

  const submit = (e) => {
    e.preventDefault();
    try {
      const cleaned = { ...editing, name: (editing.name || "").trim() || "(unnamed)" };
      if (cleaned.id) {
        saveList(activeTab, list.map((m) => (m.id === cleaned.id ? cleaned : m)));
      } else {
        const id = nextId(list, tab.prefix, 4);
        saveList(activeTab, [...list, { ...cleaned, id }]);
      }
      setShowForm(false);
      setEditing(null);
    } catch (err) {
      console.error("Material save failed:", err);
      alert("Couldn't save this item: " + (err && err.message ? err.message : String(err)));
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontFamily: FONT_HEAD, fontSize: 26, margin: 0 }}>Materials</h1>
        <Button onClick={startNew}><Plus size={15} /> New {tab.label.toLowerCase()}</Button>
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", borderBottom: `1px solid ${COLORS.line}`, paddingBottom: 10 }}>
        {MATERIAL_LIST_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => { setActiveTab(t.key); setShowForm(false); setEditing(null); }}
            style={{
              padding: "7px 13px",
              borderRadius: 999,
              border: `1px solid ${activeTab === t.key ? COLORS.wood : COLORS.line}`,
              background: activeTab === t.key ? COLORS.wood : "#fff",
              color: activeTab === t.key ? "#fff" : COLORS.ink,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: FONT_BODY,
            }}
          >
            {t.label} <span style={{ opacity: 0.75 }}>({(materialLists[t.key] || []).length})</span>
          </button>
        ))}
      </div>

      {showForm && (
        <Panel title={editing.id ? `Edit ${editing.id}` : `New ${tab.label.toLowerCase()}`}>
          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12 }}>
              <Field label="Code">
                <Input value={editing.code} onChange={(e) => setEditing({ ...editing, code: e.target.value })} />
              </Field>
              <Field label="Name">
                <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="Required" />
              </Field>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Button type="button" onClick={submit}>Save</Button>
              <Button variant="ghost" onClick={() => { setShowForm(false); setEditing(null); }}>Cancel</Button>
            </div>
          </form>
        </Panel>
      )}

      <Panel>
        <Table
          columns={[
            { key: "id", label: "ID" },
            { key: "code", label: "Code" },
            { key: "name", label: "Name" },
            {
              key: "actions",
              label: "",
              align: "right",
              render: (m) => (
                <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                  <Button small variant="subtle" onClick={() => startEdit(m)}>Edit</Button>
                  <Button small variant="danger" onClick={() => remove(m.id)}>Delete</Button>
                </div>
              ),
            },
          ]}
          rows={list}
          empty="Nothing added yet — use the button above to add one."
        />
      </Panel>
    </div>
  );
}

/* ---------------- Shipping ---------------- */

/* ---------------- Tasks (Master Task) ---------------- */

function TasksView({ tasks, saveTasks, samples, customers, customerName }) {
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState("kanban");

  const sampleLabel = (id) => {
    const s = samples.find((x) => x.id === id);
    return s ? `${s.id} — ${s.name}` : "";
  };

  const startNew = () => { setEditing({ ...BLANK_TASK }); setShowForm(true); };
  const startEdit = (t) => { setEditing({ ...t }); setShowForm(true); };
  const remove = (id) => { if (!confirm("Delete this task?")) return; saveTasks(tasks.filter((t) => t.id !== id)); };
  const moveStatus = (id, status) => saveTasks(tasks.map((t) => (t.id === id ? { ...t, status } : t)));

  const submit = (e) => {
    e.preventDefault();
    try {
      const cleaned = { ...editing, name: (editing.name || "").trim() || "(unnamed task)" };
      if (cleaned.id) {
        saveTasks(tasks.map((t) => (t.id === cleaned.id ? cleaned : t)));
      } else {
        const id = nextId(tasks, "TSK", 4);
        saveTasks([...tasks, { ...cleaned, id }]);
      }
      setShowForm(false);
      setEditing(null);
    } catch (err) {
      console.error("Task save failed:", err);
      alert("Couldn't save this task: " + (err && err.message ? err.message : String(err)));
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <h1 style={{ fontFamily: FONT_HEAD, fontSize: 26, margin: 0 }}>Tasks</h1>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ display: "flex", border: `1px solid ${COLORS.line}`, borderRadius: 8, overflow: "hidden" }}>
            <button onClick={() => setViewMode("kanban")} style={{ padding: "8px 14px", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: FONT_BODY, background: viewMode === "kanban" ? COLORS.wood : "#fff", color: viewMode === "kanban" ? "#fff" : COLORS.ink }}>Kanban</button>
            <button onClick={() => setViewMode("list")} style={{ padding: "8px 14px", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: FONT_BODY, background: viewMode === "list" ? COLORS.wood : "#fff", color: viewMode === "list" ? "#fff" : COLORS.ink }}>List</button>
          </div>
          <Button onClick={startNew}><Plus size={15} /> New task</Button>
        </div>
      </div>

      {showForm && (
        <Panel title={editing.id ? `Edit ${editing.id}` : "New task"}>
          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Task name" width="100%">
                <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="Required — e.g. Follow-up with SKLUM on QC" />
              </Field>
              <Field label="Reference person(s)">
                <Input value={editing.referencePerson} onChange={(e) => setEditing({ ...editing, referencePerson: e.target.value })} placeholder="e.g. Chị Hiền, Tôi" />
              </Field>
              <Field label="Deadline">
                <Input type="date" value={editing.deadline} onChange={(e) => setEditing({ ...editing, deadline: e.target.value })} />
              </Field>
              <Field label="Status">
                <Select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })}>
                  {TASK_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </Select>
              </Field>
              <Field label="Priority">
                <Select value={editing.priority} onChange={(e) => setEditing({ ...editing, priority: e.target.value })}>
                  <option value="">—</option>
                  {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                </Select>
              </Field>
              <Field label="Linked sample (optional)">
                <Select value={editing.sampleId} onChange={(e) => setEditing({ ...editing, sampleId: e.target.value })}>
                  <option value="">— None —</option>
                  {samples.map((s) => <option key={s.id} value={s.id}>{s.id} — {s.name}</option>)}
                </Select>
              </Field>
            </div>
            <Field label="Description">
              <TextArea rows={2} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
            </Field>
            <Field label="Note">
              <TextArea rows={2} value={editing.note} onChange={(e) => setEditing({ ...editing, note: e.target.value })} />
            </Field>
            <Field label="Photo / attachment (URL)">
              <Input value={editing.image} onChange={(e) => setEditing({ ...editing, image: e.target.value })} placeholder="https://…" />
            </Field>
            <div style={{ display: "flex", gap: 10 }}>
              <Button type="submit">Save</Button>
              <Button variant="ghost" onClick={() => { setShowForm(false); setEditing(null); }}>Cancel</Button>
            </div>
          </form>
        </Panel>
      )}

      {viewMode === "kanban" ? (
        <TaskKanbanBoard tasks={tasks} sampleLabel={sampleLabel} moveStatus={moveStatus} onCardClick={startEdit} />
      ) : (
        <Panel>
          <Table
            columns={[
              { key: "name", label: "Task" },
              { key: "referencePerson", label: "Reference person" },
              { key: "sample", label: "Linked sample", render: (t) => sampleLabel(t.sampleId) || "—" },
              { key: "deadline", label: "Deadline", render: (t) => <span style={{ color: isTaskOverdue(t) ? COLORS.red : COLORS.ink, fontWeight: isTaskOverdue(t) ? 700 : 400 }}>{t.deadline || "—"}</span> },
              { key: "priority", label: "Priority", render: (t) => t.priority ? <Badge tone={priorityTone(t.priority)}>{t.priority}</Badge> : "—" },
              { key: "status", label: "Status", render: (t) => <Badge tone={taskStatusTone(t.status)}>{t.status}</Badge> },
              {
                key: "actions",
                label: "",
                align: "right",
                render: (t) => (
                  <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                    <Button small variant="subtle" onClick={() => startEdit(t)}>Edit</Button>
                    <Button small variant="danger" onClick={() => remove(t.id)}>Delete</Button>
                  </div>
                ),
              },
            ]}
            rows={tasks}
            empty="No tasks yet — add one to start tracking your day-to-day follow-ups."
          />
        </Panel>
      )}
    </div>
  );
}

function TaskKanbanBoard({ tasks, sampleLabel, moveStatus, onCardClick }) {
  const [dragOverStatus, setDragOverStatus] = useState(null);
  const [draggingId, setDraggingId] = useState(null);

  const byStatus = (status) => tasks.filter((t) => t.status === status);

  const handleDrop = (e, status) => {
    e.preventDefault();
    setDragOverStatus(null);
    const id = e.dataTransfer.getData("text/task-id") || draggingId;
    if (id) moveStatus(id, status);
    setDraggingId(null);
  };

  return (
    <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 8 }}>
      {TASK_STATUSES.map((status) => {
        const cards = byStatus(status);
        const isOver = dragOverStatus === status;
        return (
          <div
            key={status}
            onDragOver={(e) => { e.preventDefault(); setDragOverStatus(status); }}
            onDragLeave={() => setDragOverStatus((cur) => (cur === status ? null : cur))}
            onDrop={(e) => handleDrop(e, status)}
            style={{
              flex: "0 0 260px",
              width: 260,
              background: isOver ? COLORS.amberSoft : COLORS.bg,
              border: `1px solid ${isOver ? COLORS.amber : COLORS.line}`,
              borderRadius: 12,
              display: "flex",
              flexDirection: "column",
              maxHeight: 700,
            }}
          >
            <div style={{ padding: "10px 12px", borderBottom: `1px solid ${COLORS.line}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: COLORS.woodDark }}>{status}</span>
              <span style={{ fontSize: 11.5, color: COLORS.inkSoft, background: "#fff", borderRadius: 999, padding: "1px 8px", border: `1px solid ${COLORS.line}` }}>{cards.length}</span>
            </div>
            <div style={{ padding: 8, display: "flex", flexDirection: "column", gap: 8, overflowY: "auto" }}>
              {cards.map((t) => (
                <div
                  key={t.id}
                  draggable
                  onDragStart={(e) => { e.dataTransfer.setData("text/task-id", t.id); setDraggingId(t.id); }}
                  onDragEnd={() => setDraggingId(null)}
                  style={{ background: "#fff", border: `1px solid ${COLORS.line}`, borderRadius: 9, padding: 10, cursor: "grab" }}
                >
                  <div onClick={() => onCardClick(t)} style={{ cursor: "pointer" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{t.name}</div>
                    {t.referencePerson && <div style={{ fontSize: 11.5, color: COLORS.inkSoft }}>{t.referencePerson}</div>}
                    {sampleLabel(t.sampleId) && <div style={{ fontSize: 11, color: COLORS.teal, marginTop: 2 }}>🔗 {sampleLabel(t.sampleId)}</div>}
                    <div style={{ display: "flex", gap: 5, marginTop: 6, flexWrap: "wrap", alignItems: "center" }}>
                      {t.priority && <Badge tone={priorityTone(t.priority)}>{t.priority}</Badge>}
                      {t.deadline && <Badge tone={isTaskOverdue(t) ? "red" : "neutral"}>{t.deadline}</Badge>}
                    </div>
                  </div>
                  <select
                    value={t.status}
                    onChange={(e) => moveStatus(t.id, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    style={{ marginTop: 8, width: "100%", fontSize: 11, padding: "4px 6px", borderRadius: 6, border: `1px solid ${COLORS.line}`, background: COLORS.bg, color: COLORS.ink, fontFamily: FONT_BODY }}
                  >
                    {TASK_STATUSES.map((st) => <option key={st} value={st}>{st}</option>)}
                  </select>
                </div>
              ))}
              {cards.length === 0 && <div style={{ fontSize: 12, color: COLORS.inkSoft, textAlign: "center", padding: "16px 4px" }}>No tasks</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ShippingView({ shipments, saveShipments, orders, customerName, customers }) {
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const orderCustomer = (orderId) => {
    const o = orders.find((o) => o.id === orderId);
    return o ? customerName(o.customerId) : "—";
  };

  const startNew = () => {
    setEditing({
      id: "",
      orderId: orders[0]?.id || "",
      carrier: "",
      trackingNo: "",
      shipDate: "",
      eta: "",
      status: "Preparing",
      notes: "",
    });
    setShowForm(true);
  };
  const startEdit = (s) => { setEditing({ ...s }); setShowForm(true); };
  const remove = (id) => { if (!confirm("Delete this shipment?")) return; saveShipments(shipments.filter((s) => s.id !== id)); };

  const submit = (e) => {
    e.preventDefault();
    if (editing.id) {
      saveShipments(shipments.map((s) => (s.id === editing.id ? editing : s)));
    } else {
      const id = nextId(shipments, "SH", 4);
      saveShipments([...shipments, { ...editing, id }]);
    }
    setShowForm(false);
    setEditing(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontFamily: FONT_HEAD, fontSize: 26, margin: 0 }}>Shipping</h1>
        <Button onClick={startNew} disabled={!orders.length}><Plus size={15} /> New shipment</Button>
      </div>

      {!orders.length && (
        <Panel>
          <div style={{ color: COLORS.inkSoft, fontSize: 14 }}>Create an order first — shipments are linked to orders.</div>
        </Panel>
      )}

      {showForm && (
        <Panel title={editing.id ? `Edit ${editing.id}` : "New shipment"}>
          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <Field label="Order">
                <Select value={editing.orderId} onChange={(e) => setEditing({ ...editing, orderId: e.target.value })}>
                  {orders.map((o) => <option key={o.id} value={o.id}>{o.id} — {customerName(o.customerId)}</option>)}
                </Select>
              </Field>
              <Field label="Carrier">
                <Input value={editing.carrier} onChange={(e) => setEditing({ ...editing, carrier: e.target.value })} />
              </Field>
              <Field label="Tracking no.">
                <Input value={editing.trackingNo} onChange={(e) => setEditing({ ...editing, trackingNo: e.target.value })} />
              </Field>
              <Field label="Ship date">
                <Input type="date" value={editing.shipDate} onChange={(e) => setEditing({ ...editing, shipDate: e.target.value })} />
              </Field>
              <Field label="ETA">
                <Input type="date" value={editing.eta} onChange={(e) => setEditing({ ...editing, eta: e.target.value })} />
              </Field>
              <Field label="Status">
                <Select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })}>
                  {SHIPMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </Select>
              </Field>
            </div>
            <Field label="Notes">
              <TextArea rows={2} value={editing.notes} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} />
            </Field>
            <div style={{ display: "flex", gap: 10 }}>
              <Button type="button" onClick={submit}>Save</Button>
              <Button variant="ghost" onClick={() => { setShowForm(false); setEditing(null); }}>Cancel</Button>
            </div>
          </form>
        </Panel>
      )}

      <Panel>
        <Table
          columns={[
            { key: "id", label: "Shipment #" },
            { key: "orderId", label: "Order" },
            { key: "customer", label: "Customer", render: (s) => orderCustomer(s.orderId) },
            { key: "carrier", label: "Carrier" },
            { key: "trackingNo", label: "Tracking #" },
            { key: "shipDate", label: "Ship date" },
            { key: "eta", label: "ETA" },
            { key: "status", label: "Status", render: (s) => <Badge tone={shipmentStatusTone(s.status)}>{s.status}</Badge> },
            {
              key: "actions",
              label: "",
              align: "right",
              render: (s) => (
                <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                  <Button small variant="subtle" onClick={() => startEdit(s)}>Edit</Button>
                  <Button small variant="danger" onClick={() => remove(s.id)}>Delete</Button>
                </div>
              ),
            },
          ]}
          rows={shipments}
          empty="No shipments yet."
        />
      </Panel>
    </div>
  );
}
