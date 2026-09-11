import React, { useState, useEffect, useCallback, useRef } from "react";
import QRCode from "qrcode";
import { LayoutDashboard, Users, FileText, ShoppingCart, Boxes, CalendarDays, Palette, Truck, Plus, X, Image as ImageIcon, Search, ListTodo, Download, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Trash2, CheckSquare, Square, Move, QrCode as QrCodeIcon, Sparkles, Pencil } from "lucide-react";
import { supabaseConfigured, loadWorkspace, upsertRows, deleteRow, deleteWhere, adapters, saveSampleChildren, saveJsonRecord, deleteJsonRecord, uploadStorageImage } from "./supabaseRest";

// Public QR/Passport loader is kept local so this build remains compatible with older
// supabaseRest.js copies that may still be deployed in Vercel.
async function loadPublicSample(sampleId) {
  if (!sampleId) return null;
  const url = (import.meta.env.VITE_SUPABASE_URL || "").replace(/\/$/, "");
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
  if (!url || !key) throw new Error("Supabase is not configured.");
  const res = await fetch(`${url}/rest/v1/rpc/get_public_sample`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ p_sample_id: sampleId }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase ${res.status}: ${text}`);
  }
  return res.json();
}

/* ---------------------------------------------------------
   TÂN HÒA OUTDOOR FURNITURE — SALES ERP
   Customers → Quotes → Orders → Samples → Production → Shipping
   Data persists in Supabase Postgres. Images currently use the existing app image URL/data model.
--------------------------------------------------------- */

const COLORS = {
  bg: "#F6F7F9",
  panel: "#FFFFFF",
  ink: "#111111",
  inkSoft: "#666666",
  line: "#E5E7EB",
  sidebar: "linear-gradient(145deg, #1A1918 0%, #211D1A 58%, #3D2218 100%)",
  sidebarSoft: "#888888",
  wood: "#FF5500",
  woodDark: "#D94700",
  teal: "#5E6B63",
  tealSoft: "#EEF1EF",
  amber: "#FF8A3D",
  amberSoft: "#FFF0E8",
  red: "#D94B4B",
  redSoft: "#FDEBEC",
  green: "#4C9A68",
  greenSoft: "#E8F5EC",
};

// Apple-style system font stack: uses San Francisco on Apple devices and
// the closest native system UI font on Windows/Android. No web-font dependency.
const FONT_HEAD = '"Inter", "Plus Jakarta Sans", "Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif';
const FONT_BODY = '"Inter", "Plus Jakarta Sans", "Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif';

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
const TASK_TYPES = ["Sample", "Sample Test", "Daily"];
const COMPONENT_OPTIONS = ["Wood Frame", "Cushion", "Metal Frame", "Rope", "Fabric", "Hardware", "Cemboard", "Packaging", "Glass", "Other"];

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

// The user-facing sample workflow. Keep this list in process order so the
// Kanban, stage selectors, and filters all use the same production flow.
const SAMPLE_STAGES = [
  "Request Received",
  "Material Preparation",
  "Assembly",
  "Quality Check",
  "Customer Correction",
  "Packaging",
  "Shipping",
];

// Legacy stage values already present in imported ERP data are mapped into
// the new seven-step workflow without requiring a destructive data migration.
const LEGACY_SAMPLE_STAGE_MAP = {
  "Material Preparation To Assembly": "Material Preparation",
  "Sample Production": "Assembly",
  "Production Preparation": "Assembly",
  "Quality": "Quality Check",
  "Waiting ERP No.": "Request Received",
  "Completed": "Shipping",
};

function normalizeSampleWorkflowStage(stage) {
  const value = String(stage || "").trim();
  return LEGACY_SAMPLE_STAGE_MAP[value] || (SAMPLE_STAGES.includes(value) ? value : "Request Received");
}

// Single-hue progression: the board becomes warmer/darker as a sample moves
// closer to completion. Keeping one orange family makes the workflow feel like
// one continuous production pipeline instead of seven unrelated categories.
const SAMPLE_STAGE_THEME = {
  // One visual language: almost-neutral at the start, progressively warmer and
  // stronger toward Shipping so users can read completion level at a glance.
  "Request Received":      { bg: "#F8F9FA", head: "#5B6470", border: "#E5E7EB", accent: "#C9CED4", soft: "#F1F3F5" },
  "Material Preparation":  { bg: "#FCF8F4", head: "#7A624E", border: "#EADFD5", accent: "#D8B99D", soft: "#F7EDE5" },
  "Assembly":              { bg: "#FDF3EB", head: "#92552F", border: "#EBD0BC", accent: "#DFA27B", soft: "#F8E3D4" },
  "Quality Check":         { bg: "#FCECE1", head: "#A94D20", border: "#E8BFA7", accent: "#DF8B5C", soft: "#F7D8C6" },
  "Customer Correction":   { bg: "#FBE2D3", head: "#B64212", border: "#E6AB8B", accent: "#D96F3A", soft: "#F6CDB9" },
  "Packaging":             { bg: "#F9D5BC", head: "#BD410A", border: "#DF9670", accent: "#D95D20", soft: "#F4BFA0" },
  "Shipping":              { bg: "#F7C19D", head: "#A83200", border: "#D97843", accent: "#FF5500", soft: "#F3A878" },
};

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
  stageStartDate: "", stageStatus: "",
  priority: "", targetDate: "", completedDate: "", overallStatus: "", image: "", notes: "",
  requiredComponents: [], noteHistory: [],
  revisions: [],
  orderId: "",
};

function normalizeSample(s) {
  return { ...BLANK_SAMPLE, ...s, requiredComponents: s.requiredComponents || [], noteHistory: s.noteHistory || [], revisions: s.revisions || [] };
}

const BLANK_TASK = {
  id: "", name: "", type: "Daily", description: "", referencePerson: "", deadline: "",
  status: "To Do", priority: "", sampleId: "", note: "", image: "",
};

/* ---------------- Supabase persistence ---------------- */

function exportFullBackup(data) {
  const backup = { backupVersion: 1, app: "Tân Hòa Outdoor Furniture — Sales ERP", exportedAt: new Date().toISOString(), data };
  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  a.href = url; a.download = `tanhoa_erp_backup_${stamp}.json`;
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

async function saveCollection(table, previous, next, adapter) {
  const oldIds = new Set((previous || []).map((x) => x.id));
  const newIds = new Set((next || []).map((x) => x.id));
  for (const id of oldIds) if (!newIds.has(id)) await deleteRow(table, id);
  const rows = (next || []).filter((x) => x?.id).map(adapter);
  await upsertRows(table, rows);
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
    borderRadius: 10,
    cursor: disabled ? "not-allowed" : "pointer",
    border: "1px solid transparent",
    transition: "opacity .12s, transform .12s, box-shadow .12s",
    opacity: disabled ? 0.5 : 1,
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
  };
  const variants = {
    primary: { background: COLORS.wood, color: "#fff", boxShadow: "0 1px 2px rgba(0,0,0,.08)" },
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
  padding: "9px 11px",
  borderRadius: 10,
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
    <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.line}`, borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 2px rgba(0,0,0,.025), 0 8px 24px rgba(35,42,38,.035)" }}>
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
  const [qrSampleId, setQrSampleId] = useState(() => new URLSearchParams(window.location.search).get("sample") || "");
  const [publicSample, setPublicSample] = useState(null);
  const [publicSampleError, setPublicSampleError] = useState("");

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
      if (!supabaseConfigured) { setLoaded(true); return; }
      // QR/public view must NOT load the whole ERP workspace. It uses a dedicated
      // read-only Supabase RPC that returns only fields intended for external viewing.
      if (qrSampleId) {
        try {
          const data = await loadPublicSample(qrSampleId);
          if (!data) setPublicSampleError("Sample not found or no longer available.");
          else setPublicSample(data);
        } catch (err) {
          console.error("Public sample load failed", err);
          setPublicSampleError("Could not load this sample. Please check the QR link or contact Tân Hòa.");
        } finally {
          setLoaded(true);
        }
        return;
      }
      try {
        const data = await loadWorkspace();
        setCustomers(data.customers);
        setSamples(data.samples.map(normalizeSample));
        setQuotes(data.quotes);
        setOrders(data.orders);
        setShipments(data.shipments);
        setMaterialPreps(data.materialPreps);
        setTasks(data.tasks.map((t) => ({ ...BLANK_TASK, ...t })));
        setMaterialLists(data.materialLists);
      } catch (err) {
        console.error("Supabase load failed", err);
        alert("Could not load Supabase data. Check your Vercel environment variables and Supabase RLS policies.\n\n" + err.message);
      } finally {
        setLoaded(true);
      }
    })();
  }, [qrSampleId]);

  const setAndSave = {
    customers: (next) => { setCustomers(next); saveCollection("customers", customers, next, adapters.customers).catch((e) => alert("Customer save failed: " + e.message)); },
    samples: (next) => {
      setSamples(next);
      (async () => {
        try {
          const oldById = new Map(samples.map((x) => [x.id, x]));
          const newById = new Map(next.map((x) => [x.id, x]));
          // Remove child records before deleting a sample so FK constraints cannot block the delete.
          for (const oldSample of samples) {
            if (!newById.has(oldSample.id)) {
              await deleteWhere("sample_components", "sample_id", oldSample.id);
              await deleteWhere("sample_notes", "sample_id", oldSample.id);
              await deleteWhere("sample_revisions", "sample_id", oldSample.id);
              await deleteRow("samples", oldSample.id);
            }
          }
          const touched = next.filter((sample) => {
            const old = oldById.get(sample.id);
            return !old || JSON.stringify(old) !== JSON.stringify(sample);
          });
          if (touched.length) await upsertRows("samples", touched.map(adapters.samples));
          for (const sample of touched) await saveSampleChildren(sample);
        } catch (e) { alert("Sample save failed: " + e.message); }
      })();
    },
    quotes: (next) => { setQuotes(next); Promise.all(next.map((q) => saveJsonRecord("quote", q))).then(() => Promise.all(quotes.filter((q) => !next.some((n) => n.id === q.id)).map((q) => deleteJsonRecord("quote", q.id)))).catch((e) => alert("Quote save failed: " + e.message)); },
    orders: (next) => { setOrders(next); Promise.all(next.map((o) => saveJsonRecord("order", o))).then(() => Promise.all(orders.filter((o) => !next.some((n) => n.id === o.id)).map((o) => deleteJsonRecord("order", o.id)))).catch((e) => alert("Order save failed: " + e.message)); },
    shipments: (next) => { setShipments(next); Promise.all(next.map((s) => saveJsonRecord("shipment", s))).then(() => Promise.all(shipments.filter((s) => !next.some((n) => n.id === s.id)).map((s) => deleteJsonRecord("shipment", s.id)))).catch((e) => alert("Shipment save failed: " + e.message)); },
    materialPreps: (next) => {
      // sample_components is the source of truth for individual material status.
      // Keep the local Sample view synchronized as well, and persist the linked
      // Sample stage status when every material for that Sample is Done.
      setMaterialPreps(next);
      saveCollection("sample_components", materialPreps, next, adapters.components).catch((e) => alert("Material progress save failed: " + e.message));

      setSamples((currentSamples) => {
        const changed = currentSamples.map((sample) => {
          const rows = next.filter((p) => p.sampleId === sample.id);
          if (!rows.length) return sample;
          const existing = sample.requiredComponents || [];
          const merged = rows.map((p) => {
            const old = existing.find((c) => c.id === p.id) || {};
            return {
              ...old,
              id: p.id,
              name: p.materialName || old.name || "Material",
              qty: p.qty ?? old.qty ?? 1,
              targetDate: p.dueDate || old.targetDate || "",
              status: p.status || old.status || "Waiting",
              photo: p.photo || old.photo || "",
            };
          });
          const allDone = merged.length > 0 && merged.every((c) => String(c.status || "").toLowerCase() === "done");
          return {
            ...sample,
            requiredComponents: merged,
            ...(allDone ? { stageStatus: "Materials Done" } : {}),
          };
        });

        // Persist Sample rows whose material-derived state changed. This writes
        // stage_status back to public.samples; requiredComponents is intentionally
        // kept as local UI state because the normalized material rows live in
        // public.sample_components.
        (async () => {
          try {
            const touched = changed.filter((sample, i) => JSON.stringify(sample) !== JSON.stringify(currentSamples[i]));
            if (touched.length) await upsertRows("samples", touched.map(adapters.samples));
          } catch (e) {
            alert("Sample material sync failed: " + e.message);
          }
        })();
        return changed;
      });
    },
    tasks: (next) => { setTasks(next); saveCollection("tasks", tasks, next, adapters.tasks).catch((e) => alert("Task save failed: " + e.message)); },
    materialList: (key, next) => {
      setMaterialLists((prev) => ({ ...prev, [key]: next }));
      const table = { productTypes: "product_types", mainMaterials: "main_materials", finishes: "finishes", woodSurface: "wood_surface_treatments", fabricTypes: "fabric_types", fabricColors: "fabric_colors", ropeTypes: "rope_types", ropeColors: "rope_colors", cemboardColors: "cemboard_colors" }[key];
      if (!table) return;
      saveCollection(table, materialLists[key] || [], next, adapters.masters).catch((e) => alert("Material master save failed: " + e.message));
    },
  };

  const customerName = useCallback((id) => customers.find((c) => c.id === id)?.name || "—", [customers]);
  const productTypes = materialLists.productTypes || [];
  const productTypeName = useCallback((id) => productTypes.find((p) => p.id === id)?.name || "", [productTypes]);

  const handleExportBackup = () => {
    exportFullBackup({
      customers,
      samples,
      quotes,
      orders,
      shipments,
      materialPreps,
      tasks,
      ...Object.fromEntries(
        MATERIAL_LIST_TABS.map((tab) => [tab.key, materialLists[tab.key] || []])
      ),
    });
    alert("Full backup exported successfully.");
  };

  if (!supabaseConfigured) {
    return (
      <div style={{ fontFamily: FONT_BODY, padding: 28, maxWidth: 760, margin: "40px auto", background: COLORS.panel, border: `1px solid ${COLORS.line}`, borderRadius: 14 }}>
        <div style={{ fontFamily: FONT_HEAD, fontSize: 26, fontWeight: 700, marginBottom: 10 }}>Connect Tân Hòa ERP to Supabase</div>
        <div style={{ color: COLORS.inkSoft, lineHeight: 1.6 }}>Add <b>VITE_SUPABASE_URL</b> and <b>VITE_SUPABASE_ANON_KEY</b> to your Vercel Environment Variables, then redeploy. The app no longer uses <code>window.storage</code>.</div>
      </div>
    );
  }

  if (!loaded) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 400, fontFamily: FONT_BODY, color: COLORS.inkSoft }}>
        Loading workspace…
      </div>
    );
  }

  if (qrSampleId) {
    if (!publicSample && !publicSampleError) {
      return <PublicSampleLoading />;
    }
    if (publicSampleError) {
      return <PublicSampleError message={publicSampleError} />;
    }
    return <SampleQuickViewPublic data={publicSample} />;
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
    <div className="erp-shell" style={{ fontFamily: FONT_BODY, background: COLORS.bg, color: COLORS.ink }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        html, body, #root { margin: 0; min-height: 100%; width: 100%; }
        body { background: ${COLORS.bg}; color: ${COLORS.ink}; font-family: ${FONT_BODY}; -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; }
        button, input, select, textarea { font-family: inherit; }
        .erp-shell { min-height: 100vh; width: 100%; display: flex; overflow: hidden; }
        .erp-sidebar { width: 236px; min-height: 100vh; flex: 0 0 236px; background: ${COLORS.sidebar}; color: #fff; padding: 24px 14px; border-right: 1px solid rgba(255,255,255,.06); box-shadow: 10px 0 30px rgba(17,17,17,.06); }
        .erp-content { flex: 1 1 auto; min-width: 0; min-height: 100vh; height: 100vh; overflow: auto; padding: clamp(20px, 2.4vw, 34px); background: ${COLORS.bg}; }
        .erp-page { width: 100%; max-width: 1680px; margin: 0 auto; }
        .sample-kanban-board {
          display: grid !important;
          grid-template-columns: repeat(7, minmax(310px, 330px));
          gap: 12px;
          width: 100%;
          min-width: 0;
          overflow-x: auto !important;
          overflow-y: hidden;
          padding: 2px 4px 16px 2px;
          scroll-snap-type: x proximity;
          scrollbar-width: auto;
          scrollbar-color: #B9BDC3 transparent;
        }
        .sample-kanban-board::-webkit-scrollbar { height: 10px; }
        .sample-kanban-board::-webkit-scrollbar-track { background: #EEF0F2; border-radius: 99px; }
        .sample-kanban-board::-webkit-scrollbar-thumb { background: #B9BDC3; border-radius: 99px; }
        .sample-kanban-column {
          min-width: 310px !important;
          width: 330px !important;
          min-height: 0;
          max-height: calc(100vh - 250px) !important;
          scroll-snap-align: start;
          background: #FAFAFA !important;
          border: 1px solid #E2E5E8 !important;
          box-shadow: 0 2px 8px rgba(17,17,17,.035) !important;
        }
        .sample-kanban-column:hover { box-shadow: 0 5px 16px rgba(17,17,17,.06) !important; }
        .sample-kanban-column > div:last-child { min-height: 0; }
        .sample-kanban-card {
          min-width: 0;
          transition: transform .16s ease, box-shadow .16s ease, border-color .16s ease;
        }
        .sample-kanban-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 20px rgba(17,17,17,.07) !important;
          border-color: #D5D9DE !important;
        }
        .kanban-icon-button {
          width: 30px; height: 30px; padding: 0; border-radius: 8px;
          border: 1px solid #E1E4E8; background: #fff; color: #68707A;
          display: inline-flex; align-items: center; justify-content: center;
          cursor: pointer;
        }
        .kanban-icon-button:hover {
          color: #FF5500; border-color: #FFB88F; background: #FFF8F4;
          box-shadow: none !important;
        }
        .kanban-column-menu {
          width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center;
          border: 1px solid #E2E5E8; border-radius: 8px; background: #fff; color: #737A82;
        }
        .sample-kanban-card select {
          min-height: 31px;
          border-color: #E4E7EB !important;
          background: #F8F9FA !important;
        }
        .sample-kanban-column-body {
          scrollbar-width: thin;
          scrollbar-color: rgba(120,120,120,.22) transparent;
        }
        .sample-kanban-column-body::-webkit-scrollbar { width: 7px; }
        .sample-kanban-column-body::-webkit-scrollbar-thumb { background: rgba(120,120,120,.18); border-radius: 99px; }
        .sample-kanban-card .kanban-card-title {
          font-size: 12.5px;
          font-weight: 750;
          line-height: 1.25;
        }
        .sample-kanban-card .kanban-meta {
          font-size: 10px;
          line-height: 1.35;
          color: #73777D;
        }
        .sample-kanban-card .kanban-erp-code {
          font-size: 10.5px;
          line-height: 1.25;
          letter-spacing: -.05px;
          overflow-wrap: anywhere;
          word-break: break-word;
        }
        .sample-kanban-card .kanban-pill {
          font-size: 9.5px;
          font-weight: 650;
          border-radius: 999px;
          padding: 4px 8px;
          white-space: nowrap;
        }
        @media (min-width: 1281px) {
          .sample-kanban-column-body { padding: 9px !important; gap: 9px !important; }
          .sample-kanban-card { padding: 11px !important; gap: 9px !important; border-radius: 12px !important; }
          .sample-kanban-card > div:nth-child(2) { gap: 10px !important; }
          .sample-kanban-card > div:nth-child(2) > div:first-child { width: 76px !important; height: 76px !important; margin-left: 28px !important; border-radius: 10px !important; }
          .sample-kanban-column > div:first-child { padding: 13px 13px 12px !important; gap: 9px !important; }
          .sample-kanban-column > div:first-child > div:first-child { gap: 8px !important; }
          .sample-kanban-column > div:first-child > div:first-child > div > div:first-child { font-size: 13px !important; white-space: nowrap !important; line-height: 1.2 !important; }
          .sample-kanban-column > div:first-child > div:first-child > span { min-width: 27px !important; height: 27px !important; font-size: 10px !important; }
        }
        @media (max-width: 1280px) {
          .erp-sidebar { width: 216px; flex-basis: 216px; }
          .sample-kanban-board {
            grid-template-columns: repeat(7, minmax(300px, 320px));
            overflow-x: auto !important;
          }
          .sample-kanban-column { min-width: 300px !important; width: 320px !important; }
        }
        @media (max-width: 820px) {
          .erp-shell { display: block; overflow: visible; }
          .erp-sidebar { width: 100%; min-height: auto; height: auto; padding: 14px 14px 10px; position: sticky; top: 0; z-index: 20; }
          .erp-sidebar nav { flex-direction: row !important; overflow-x: auto; gap: 4px !important; padding-bottom: 2px; }
          .erp-sidebar nav button { white-space: nowrap; flex: 0 0 auto; }
          .erp-content { height: auto; min-height: calc(100vh - 130px); overflow: visible; padding: 16px; }
          .sample-kanban-board { grid-template-columns: repeat(7, minmax(300px, 320px)); overflow-x: auto !important; width: 100%; min-width: 0; }
          .sample-kanban-column { min-width: 300px !important; width: 320px !important; max-height: calc(100vh - 210px) !important; }
        }
        /* --- Modern dark/light hybrid UI system --- */
        :root { color-scheme: light; }
        ::selection { background: rgba(255,85,0,.18); }
        .erp-sidebar nav button { transition: background .18s ease, color .18s ease, border-color .18s ease, box-shadow .18s ease, transform .18s ease; }
        .erp-sidebar nav button:hover { color: #fff !important; background: rgba(255,255,255,.055) !important; border-color: rgba(255,255,255,.08) !important; transform: translateX(2px); }
        .erp-sidebar nav button[style*="linear-gradient"] { box-shadow: 0 0 22px rgba(255,85,0,.12), inset 0 1px 0 rgba(255,255,255,.06); }
        .erp-sidebar > div:first-child { letter-spacing: -.35px; }
        button { transition: transform .16s ease, box-shadow .16s ease, background .16s ease, border-color .16s ease, opacity .16s ease; }
        button:not(:disabled):hover { box-shadow: 0 5px 16px rgba(17,17,17,.07); }
        button:not(:disabled):active { transform: translateY(1px); }
        input, select, textarea { border-color: #E5E7EB !important; border-radius: 12px !important; background: #fff !important; }
        input:focus, select:focus, textarea:focus { border-color: #FF6B00 !important; box-shadow: 0 0 0 3px rgba(255,107,0,.10) !important; }
        div[style*="border-radius: 12px"], div[style*="border-radius: 14px"], div[style*="border-radius: 16px"], div[style*="border-radius: 18px"] { border-radius: 14px !important; }
        table { border-color: #E5E7EB; }
        th { font-weight: 650 !important; color: #555 !important; }
        .erp-content h1 { letter-spacing: -.45px; }
        .erp-content h2, .erp-content h3 { letter-spacing: -.2px; }
        @media (max-width: 560px) {
          .erp-content { padding: 12px; }
          .erp-sidebar nav button { padding: 8px 10px !important; font-size: 13px !important; }
        }
      `}</style>

      {/* Sidebar */}
      <div className="erp-sidebar">
        <div style={{ fontFamily: FONT_HEAD, fontSize: 19, fontWeight: 700, marginBottom: 2, color: "#fff" }}>Tân Hòa</div>
        <div style={{ fontSize: 11.5, color: COLORS.sidebarSoft, marginBottom: 7, letterSpacing: 0.2 }}>Outdoor Furniture · Sales ERP</div>
        <div style={{ fontSize: 10.5, color: "#9ED6B0", marginBottom: 20 }}>● Supabase connected</div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV.map((n) => {
            const Icon = n.icon;
            return (
              <button
                key={n.key}
                onClick={() => setView(n.key)}
                style={{
                  textAlign: "left",
                  background: view === n.key ? "linear-gradient(135deg, rgba(255,85,0,.22), rgba(255,107,0,.10))" : "transparent",
                  color: view === n.key ? "#fff" : COLORS.sidebarSoft,
                  border: view === n.key ? "1px solid rgba(255,107,0,.38)" : "1px solid transparent",
                  borderRadius: 12,
                  padding: "9px 12px",
                  fontSize: 14,
                  fontWeight: view === n.key ? 650 : 500,
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

        <button
          onClick={handleExportBackup}
          style={{
            width: "100%",
            marginTop: 18,
            textAlign: "left",
            background: "rgba(255,255,255,0.06)",
            color: COLORS.sidebarSoft,
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 8,
            padding: "9px 12px",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: FONT_BODY,
            display: "flex",
            alignItems: "center",
            gap: 9,
          }}
        >
          <Download size={16} strokeWidth={2} />
          Export Full Backup
        </button>
      </div>

      {/* Content */}
      <div className="erp-content"><div className="erp-page">
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
          <CalendarView samples={samples} materialPreps={materialPreps} tasks={tasks} customerName={customerName} saveSamples={setAndSave.samples} saveMaterialPreps={setAndSave.materialPreps} saveTasks={setAndSave.tasks} />
        )}
        {view === "materials" && (
          <MaterialsView materialLists={materialLists} saveList={setAndSave.materialList} />
        )}
        {view === "shipping" && (
          <ShippingView shipments={shipments} saveShipments={setAndSave.shipments} orders={orders} customerName={customerName} customers={customers} />
        )}
      </div></div>
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

/* ---------------- Sample export ---------------- */

const SAMPLE_EXPORT_FIELDS = [
  { key: "id", label: "Sample ID", get: (s) => s.id },
  { key: "erpNo", label: "ERP Code", get: (s) => s.erpNo },
  { key: "name", label: "Sample Name", get: (s) => s.name },
  { key: "customer", label: "Customer", get: (s, ctx) => ctx.customerName(s.customerId) },
  { key: "productType", label: "Product Type", get: (s, ctx) => ctx.productTypeName(s.productTypeId) },
  { key: "qty", label: "Qty", get: (s) => s.qty },
  { key: "manufacturingOrderNo", label: "Manufacturing Order No.", get: (s) => s.manufacturingOrderNo },
  { key: "idpNo", label: "IDP No.", get: (s) => s.idpNo },
  { key: "idcNo", label: "IDC No.", get: (s) => s.idcNo },
  { key: "width", label: "Width (mm)", get: (s) => s.width },
  { key: "depth", label: "Depth (mm)", get: (s) => s.depth },
  { key: "height", label: "Height (mm)", get: (s) => s.height },
  { key: "armHeight", label: "Arm Height (mm)", get: (s) => s.armHeight },
  { key: "seatHeight", label: "Seat Height (mm)", get: (s) => s.seatHeight },
  { key: "mainMaterial", label: "Main Material", get: (s, ctx) => lookupName(ctx.mainMaterials, s.mainMaterialId) },
  { key: "finishColor", label: "Finish / Color", get: (s, ctx) => lookupName(ctx.finishes, s.finishesColorId) },
  { key: "woodSurface", label: "Wood Surface Treatment", get: (s, ctx) => lookupName(ctx.woodSurface, s.woodSurfaceTreatmentId) },
  { key: "fabricType", label: "Fabric Type", get: (s, ctx) => lookupName(ctx.fabricTypes, s.fabricTypeId) },
  { key: "fabricColor", label: "Fabric Color", get: (s, ctx) => lookupName(ctx.fabricColors, s.fabricColorId) },
  { key: "ropeType", label: "Rope Type", get: (s, ctx) => lookupName(ctx.ropeTypes, s.ropeTypeId) },
  { key: "ropeDiameter", label: "Rope Diameter (mm)", get: (s) => s.ropeDiameter },
  { key: "ropeColor", label: "Rope Color", get: (s, ctx) => lookupName(ctx.ropeColors, s.ropeColorId) },
  { key: "metalName", label: "Metal Name", get: (s) => s.metalName },
  { key: "metalColor", label: "Metal Color", get: (s) => s.metalColor },
  { key: "cemboardColor", label: "Cemboard Color", get: (s, ctx) => lookupName(ctx.cemboardColors, s.cemboardColorId) },
  { key: "hardware", label: "Hardware", get: (s) => s.hardware },
  { key: "construction", label: "Construction", get: (s) => s.construction },
  { key: "currentRevision", label: "Revision", get: (s) => s.currentRevision },
  { key: "stageGroup", label: "Stage Group", get: (s) => s.stageGroup },
  { key: "stage", label: "Current Stage", get: (s) => normalizeSampleWorkflowStage(s.stage) },
  { key: "stageStatus", label: "Stage Status", get: (s) => s.stageStatus },
  { key: "waitingFor", label: "Waiting For", get: (s) => s.waitingFor },
  { key: "nextAction", label: "Next Action", get: (s) => s.nextAction },
  { key: "stageStartDate", label: "Stage Start Date", get: (s) => s.stageStartDate },
  { key: "stageDueDate", label: "Stage Due Date", get: (s) => s.stageDueDate },
  { key: "stageSlaDays", label: "Stage SLA Days", get: (s) => s.stageSlaDays },
  { key: "priority", label: "Priority", get: (s) => s.priority },
  { key: "targetDate", label: "Target Date", get: (s) => s.targetDate },
  { key: "completedDate", label: "Completed Date", get: (s) => s.completedDate },
  { key: "overallStatus", label: "Overall Status", get: (s) => s.overallStatus },
  { key: "orderId", label: "Linked Order", get: (s) => s.orderId },
  { key: "notes", label: "Notes", get: (s) => s.notes },
  { key: "materialProgress", label: "Material Progress", get: (s, ctx) => {
    const rows = ctx.materialPreps.filter((p) => p.sampleId === s.id);
    return rows.map((p) => `${p.materialName || p.displayName || "Material"}: Qty ${p.qty || 1}; Target ${p.dueDate || "—"}; Status ${p.status || "Waiting"}`).join(" | ");
  }},
  { key: "image", label: "Image (embedded)", get: (s) => s.image },
  { key: "qrCode", label: "QR Code", get: (s) => samplePublicUrl(s.id) },
];

function csvEscape(value) {
  const text = value == null ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function downloadCsv(filename, headers, rows) {
  const csv = "\uFEFF" + [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function imageUrlToDataUrl(url) {
  if (!url) return null;
  if (String(url).startsWith("data:image/")) return url;
  const response = await fetch(url, { mode: "cors" });
  if (!response.ok) throw new Error(`Could not load image (${response.status})`);
  const blob = await response.blob();
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error("Could not read image"));
    reader.readAsDataURL(blob);
  });
}

function detectExcelImageExtension(dataUrl) {
  const match = String(dataUrl || "").match(/^data:image\/(png|jpe?g|gif|webp|bmp)/i);
  const type = (match?.[1] || "jpeg").toLowerCase();
  if (type === "jpg" || type === "jpeg") return "jpeg";
  if (type === "webp") return "png";
  if (type === "bmp") return "png";
  return type;
}

function xmlEscape(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function columnLetters(number) {
  let n = number;
  let out = "";
  while (n > 0) {
    const r = (n - 1) % 26;
    out = String.fromCharCode(65 + r) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}

function crc32(bytes) {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc ^= bytes[i];
    for (let j = 0; j < 8; j++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function u16(value) {
  return new Uint8Array([value & 255, (value >>> 8) & 255]);
}
function u32(value) {
  return new Uint8Array([value & 255, (value >>> 8) & 255, (value >>> 16) & 255, (value >>> 24) & 255]);
}
function concatBytes(...parts) {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) { out.set(part, offset); offset += part.length; }
  return out;
}
function utf8(text) { return new TextEncoder().encode(text); }

function makeZip(files) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  const now = new Date();
  const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | Math.floor(now.getSeconds() / 2);
  const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();

  for (const file of files) {
    const name = utf8(file.name);
    const data = file.data instanceof Uint8Array ? file.data : utf8(file.data);
    const crc = crc32(data);
    const local = concatBytes(
      new Uint8Array([0x50,0x4b,0x03,0x04]), u16(20), u16(0x0800), u16(0), u16(dosTime), u16(dosDate),
      u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0), name, data
    );
    localParts.push(local);
    const central = concatBytes(
      new Uint8Array([0x50,0x4b,0x01,0x02]), u16(20), u16(20), u16(0x0800), u16(0), u16(dosTime), u16(dosDate),
      u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset), name
    );
    centralParts.push(central);
    offset += local.length;
  }
  const localBytes = concatBytes(...localParts);
  const centralBytes = concatBytes(...centralParts);
  const end = concatBytes(
    new Uint8Array([0x50,0x4b,0x05,0x06]), u16(0), u16(0), u16(files.length), u16(files.length),
    u32(centralBytes.length), u32(localBytes.length), u16(0)
  );
  return concatBytes(localBytes, centralBytes, end);
}

async function imageUrlToBytes(url) {
  if (!url) return null;
  if (String(url).startsWith("data:image/")) {
    const match = String(url).match(/^data:image\/([^;,]+)[;,](.*)$/i);
    if (!match) return null;
    const mime = match[1].toLowerCase();
    const raw = match[2];
    if (raw.startsWith("base64")) return { bytes: Uint8Array.from(atob(raw.slice(raw.indexOf(",") + 1)), (c) => c.charCodeAt(0)), ext: mime === "jpg" || mime === "jpeg" ? "jpeg" : "png" };
  }
  const response = await fetch(url, { mode: "cors" });
  if (!response.ok) throw new Error(`Could not load image (${response.status})`);
  const blob = await response.blob();
  const arrayBuffer = await blob.arrayBuffer();
  let ext = (blob.type.split("/")[1] || "jpeg").toLowerCase();
  if (ext === "jpg") ext = "jpeg";
  if (!["jpeg", "png", "gif"].includes(ext)) {
    // Convert unsupported formats (for example WebP) to PNG through the browser.
    const objectUrl = URL.createObjectURL(blob);
    try {
      const img = await new Promise((resolve, reject) => { const el = new Image(); el.onload = () => resolve(el); el.onerror = reject; el.src = objectUrl; });
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth || img.width; canvas.height = img.naturalHeight || img.height;
      canvas.getContext("2d").drawImage(img, 0, 0);
      const pngBlob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      return { bytes: new Uint8Array(await pngBlob.arrayBuffer()), ext: "png" };
    } finally { URL.revokeObjectURL(objectUrl); }
  }
  return { bytes: new Uint8Array(arrayBuffer), ext };
}

function xlsxSheetXml(headers, rows, imageColumnIndices = []) {
  const imageCols = new Set(Array.isArray(imageColumnIndices) ? imageColumnIndices : (imageColumnIndices >= 0 ? [imageColumnIndices] : []));
  const maxRow = Math.max(1, rows.length + 1);
  const maxCol = Math.max(1, headers.length);
  const cells = [];
  const addRow = (rowNumber, values) => {
    const rowCells = values.map((value, idx) => {
      const ref = `${columnLetters(idx + 1)}${rowNumber}`;
      const text = value == null ? "" : String(value);
      return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${xmlEscape(text)}</t></is></c>`;
    }).join("");
    cells.push(`<row r="${rowNumber}" ht="${rowNumber === 1 ? 24 : (imageCols.size ? 92 : 22)}" customHeight="1">${rowCells}</row>`);
  };
  addRow(1, headers);
  rows.forEach((row, i) => addRow(i + 2, row.map((v, idx) => imageCols.has(idx) ? "" : v)));
  const cols = headers.map((h, i) => `<col min="${i + 1}" max="${i + 1}" width="${imageCols.has(i) ? 18 : Math.min(34, Math.max(12, String(h).length + 3))}" customWidth="1"/>`).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><dimension ref="A1:${columnLetters(maxCol)}${maxRow}"/><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${cols}</cols><sheetData>${cells.join("")}</sheetData>${headers.length ? `<autoFilter ref="A1:${columnLetters(maxCol)}${maxRow}"/>` : ""}${imageCols.size ? `<drawing r:id="rId1"/>` : ""}</worksheet>`;
}

function xlsxDrawingXml(images) {
  const anchors = images.map((img, index) => {
    const row = img.row;
    const col = img.col;
    const colLetter = columnLetters(col + 1);
    const nextCol = columnLetters(col + 2);
    const rid = `rId${index + 1}`;
    return `<xdr:twoCellAnchor editAs="oneCell"><xdr:from><xdr:col>${col}</xdr:col><xdr:colOff>72000</xdr:colOff><xdr:row>${row}</xdr:row><xdr:rowOff>36000</xdr:rowOff></xdr:from><xdr:to><xdr:col>${col + 1}</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${row + 1}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:to><xdr:pic><xdr:nvPicPr><xdr:cNvPr id="${index + 1}" name="SampleImage${index + 1}"/><xdr:cNvPicPr/></xdr:nvPicPr><xdr:blipFill><a:blip xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:embed="${rid}"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill><xdr:spPr><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr></xdr:pic><xdr:clientData/></xdr:twoCellAnchor>`;
  }).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">${anchors}</xdr:wsDr>`;
}

async function downloadExcelWithEmbeddedImages(filename, headers, rows, embeddedImageColumns = {}) {
  const imageColumnIndices = Object.keys(embeddedImageColumns).map(Number).filter((n) => Number.isInteger(n) && n >= 0);
  const imageCols = new Set(imageColumnIndices);
  const files = [];
  const sheetXml = xlsxSheetXml(headers, rows, imageColumnIndices);
  files.push({ name: "[Content_Types].xml", data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="jpeg" ContentType="image/jpeg"/><Default Extension="png" ContentType="image/png"/><Default Extension="gif" ContentType="image/gif"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>${imageCols.size ? `<Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>` : ""}<Override PartName="/xl/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/></Types>` });
  files.push({ name: "_rels/.rels", data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>` });
  files.push({ name: "xl/workbook.xml", data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView/></bookViews><sheets><sheet name="Samples" sheetId="1" r:id="rId1"/></sheets></workbook>` });
  files.push({ name: "xl/_rels/workbook.xml.rels", data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/></Relationships>` });
  files.push({ name: "xl/theme/theme1.xml", data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Tân Hòa"><a:themeElements><a:clrScheme name="Default"><a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1><a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="31513F"/></a:dk2><a:lt2><a:srgbClr val="F7F7F4"/></a:lt2><a:accent1><a:srgbClr val="A65F2E"/></a:accent1><a:accent2><a:srgbClr val="6D7E74"/></a:accent2><a:accent3><a:srgbClr val="D7C7A6"/></a:accent3><a:accent4><a:srgbClr val="B8C7B8"/></a:accent4><a:accent5><a:srgbClr val="D9B7A7"/></a:accent5><a:accent6><a:srgbClr val="9FB7A8"/></a:accent6><a:hlink><a:srgbClr val="0563C1"/></a:hlink><a:folHlink><a:srgbClr val="954F72"/></a:folHlink></a:clrScheme><a:fontScheme name="Office"><a:majorFont/><a:minorFont/></a:fontScheme><a:fmtScheme name="Office"><a:fillStyleLst/><a:lnStyleLst/><a:effectStyleLst/><a:bgFillStyleLst/></a:fmtScheme></a:themeElements></a:theme>` });
  files.push({ name: "xl/worksheets/sheet1.xml", data: sheetXml });
  if (imageCols.size) files.push({ name: "xl/worksheets/_rels/sheet1.xml.rels", data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing1.xml"/></Relationships>` });

  const drawingImages = [];
  let embeddedCount = 0;
  let failedImages = 0;
  for (const col of imageColumnIndices) {
    const urls = Array.isArray(embeddedImageColumns[col]) ? embeddedImageColumns[col] : [];
    for (let i = 0; i < rows.length; i++) {
      const url = urls[i];
      if (!url) continue;
      try {
        const image = await imageUrlToBytes(url);
        if (!image) continue;
        const mediaName = `xl/media/image${embeddedCount + 1}.${image.ext}`;
        files.push({ name: mediaName, data: image.bytes });
        drawingImages.push({ row: i + 1, col, mediaName });
        embeddedCount++;
      } catch (error) {
        failedImages++;
        console.warn("Excel image embed failed", url, error);
      }
    }
  }
  if (imageCols.size) {
    files.push({ name: "xl/drawings/drawing1.xml", data: xlsxDrawingXml(drawingImages) });
    files.push({ name: "xl/drawings/_rels/drawing1.xml.rels", data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${drawingImages.map((img, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/${img.mediaName.split("/").pop()}"/>`).join("")}</Relationships>` });
  }

  const zipBytes = makeZip(files);
  const blob = new Blob([zipBytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  return { embeddedCount, failedImages };
}


/* ---------------- Sample Excel import ---------------- */

function normalizeImportHeader(value) {
  return String(value ?? "").trim().toLowerCase().replace(/[\s._-]+/g, " ");
}

const SAMPLE_IMPORT_HEADER_MAP = {
  "sample id": "id", "erp code": "erpNo", "sample name": "name", "customer": "customer", "product type": "productType",
  "qty": "qty", "manufacturing order no.": "manufacturingOrderNo", "manufacturing order no": "manufacturingOrderNo", "idp no.": "idpNo", "idp no": "idpNo", "idc no.": "idcNo", "idc no": "idcNo",
  "width (mm)": "width", "width": "width", "depth (mm)": "depth", "depth": "depth", "height (mm)": "height", "height": "height",
  "arm height (mm)": "armHeight", "arm height": "armHeight", "seat height (mm)": "seatHeight", "seat height": "seatHeight",
  "main material": "mainMaterial", "finish / color": "finishColor", "finish/color": "finishColor", "wood surface treatment": "woodSurface",
  "fabric type": "fabricType", "fabric color": "fabricColor", "rope type": "ropeType", "rope diameter (mm)": "ropeDiameter", "rope diameter": "ropeDiameter", "rope color": "ropeColor",
  "metal name": "metalName", "metal color": "metalColor", "cemboard color": "cemboardColor", "hardware": "hardware", "construction": "construction", "revision": "currentRevision",
  "stage group": "stageGroup", "current stage": "stage", "stage status": "stageStatus", "waiting for": "waitingFor", "next action": "nextAction",
  "stage start date": "stageStartDate", "priority": "priority", "target date": "targetDate", "completed date": "completedDate", "overall status": "overallStatus",
  "linked order": "orderId", "notes": "notes", "image (embedded)": "image", "image": "image",
};

const NORMALIZED_SAMPLE_IMPORT_HEADER_MAP = Object.fromEntries(Object.entries(SAMPLE_IMPORT_HEADER_MAP).map(([key, value]) => [normalizeImportHeader(key), value]));

function findByIdCodeName(list, value) {
  const needle = String(value ?? "").trim().toLowerCase();
  if (!needle) return "";
  const found = (list || []).find((item) => [item.id, item.code, item.name].some((v) => String(v ?? "").trim().toLowerCase() === needle));
  return found?.id || "";
}

function excelSerialToDate(serial) {
  const n = Number(serial);
  if (!Number.isFinite(n) || n <= 0) return "";
  const date = new Date(Date.UTC(1899, 11, 30) + Math.round(n * 86400000));
  return date.toISOString().slice(0, 10);
}

function normalizeImportDate(value) {
  if (value == null || value === "") return "";
  if (typeof value === "number" || /^\d+(\.\d+)?$/.test(String(value).trim())) return excelSerialToDate(value);
  const text = String(value).trim();
  const iso = text.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})/);
  if (iso) return `${iso[1]}-${String(iso[2]).padStart(2, "0")}-${String(iso[3]).padStart(2, "0")}`;
  const dmy = text.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})/);
  if (dmy) return `${dmy[3]}-${String(dmy[2]).padStart(2, "0")}-${String(dmy[1]).padStart(2, "0")}`;
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? text : date.toISOString().slice(0, 10);
}

function toImportNumber(value) {
  if (value == null || String(value).trim() === "") return "";
  const n = Number(String(value).replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : value;
}

function zipFindEnd(bytes) {
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65558); i--) {
    if (bytes[i] === 0x50 && bytes[i + 1] === 0x4b && bytes[i + 2] === 0x05 && bytes[i + 3] === 0x06) return i;
  }
  throw new Error("This file is not a valid XLSX/ZIP file.");
}

function readU16(bytes, p) { return bytes[p] | (bytes[p + 1] << 8); }
function readU32(bytes, p) { return (bytes[p] | (bytes[p + 1] << 8) | (bytes[p + 2] << 16) | (bytes[p + 3] << 24)) >>> 0; }

async function unzipXlsx(buffer) {
  const bytes = new Uint8Array(buffer);
  const eocd = zipFindEnd(bytes);
  const count = readU16(bytes, eocd + 10);
  const centralOffset = readU32(bytes, eocd + 16);
  const entries = new Map();
  let p = centralOffset;
  for (let i = 0; i < count; i++) {
    if (readU32(bytes, p) !== 0x02014b50) throw new Error("Unsupported XLSX ZIP structure.");
    const method = readU16(bytes, p + 10);
    const compressedSize = readU32(bytes, p + 20);
    const nameLen = readU16(bytes, p + 28);
    const extraLen = readU16(bytes, p + 30);
    const commentLen = readU16(bytes, p + 32);
    const localOffset = readU32(bytes, p + 42);
    const name = new TextDecoder().decode(bytes.slice(p + 46, p + 46 + nameLen));
    entries.set(name, { method, compressedSize, localOffset });
    p += 46 + nameLen + extraLen + commentLen;
  }
  const getBytes = async (name) => {
    const entry = entries.get(name);
    if (!entry) return null;
    const lp = entry.localOffset;
    if (readU32(bytes, lp) !== 0x04034b50) throw new Error("Invalid XLSX local file header.");
    const nameLen = readU16(bytes, lp + 26);
    const extraLen = readU16(bytes, lp + 28);
    const raw = bytes.slice(lp + 30 + nameLen + extraLen, lp + 30 + nameLen + extraLen + entry.compressedSize);
    if (entry.method === 0) return raw;
    if (entry.method === 8 && typeof DecompressionStream !== "undefined") {
      const stream = new Blob([raw]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
      return new Uint8Array(await new Response(stream).arrayBuffer());
    }
    throw new Error("This browser cannot decompress this Excel file. Please use Chrome/Edge/Safari 16.4+.");
  };
  return { entries, getBytes };
}

function parseXml(bytes) { return new DOMParser().parseFromString(new TextDecoder().decode(bytes), "application/xml"); }
function localChildren(node, name) { return Array.from(node?.children || []).filter((c) => c.localName === name); }
function firstLocal(node, name) { return Array.from(node?.getElementsByTagName?.("*") || []).find((n) => n.localName === name) || null; }

async function parseXlsxWorkbook(file) {
  const zip = await unzipXlsx(await file.arrayBuffer());
  const sheetName = [...zip.entries.keys()].find((n) => /^xl\/worksheets\/sheet\d+\.xml$/i.test(n));
  if (!sheetName) throw new Error("No worksheet was found in this Excel file.");
  const sheetXml = parseXml(await zip.getBytes(sheetName));

  const sharedStrings = [];
  const sharedBytes = await zip.getBytes("xl/sharedStrings.xml");
  if (sharedBytes) {
    const doc = parseXml(sharedBytes);
    for (const si of Array.from(doc.getElementsByTagName("si"))) {
      sharedStrings.push(Array.from(si.getElementsByTagName("t")).map((t) => t.textContent || "").join(""));
    }
  }

  const rows = [];
  for (const rowNode of Array.from(sheetXml.getElementsByTagName("row"))) {
    const rowNumber = Number(rowNode.getAttribute("r") || rows.length + 1);
    const cells = {};
    for (const cell of Array.from(rowNode.children).filter((n) => n.localName === "c")) {
      const ref = cell.getAttribute("r") || "";
      const col = ref.replace(/\d+/g, "");
      const type = cell.getAttribute("t") || "";
      const vNode = Array.from(cell.children).find((n) => n.localName === "v");
      let value = vNode?.textContent ?? "";
      if (type === "inlineStr") value = Array.from(cell.getElementsByTagName("t")).map((t) => t.textContent || "").join("");
      else if (type === "s") value = sharedStrings[Number(value)] ?? "";
      else if (type === "b") value = value === "1";
      cells[col] = value;
    }
    rows.push({ rowNumber, cells });
  }
  rows.sort((a, b) => a.rowNumber - b.rowNumber);

  const imageByRow = {};
  const imageByCell = {};

  // Modern Excel "Place in Cell" pictures are stored as RichData rather than
  // the traditional worksheet <drawing> / twoCellAnchor structure.
  // Support both formats so images imported from current Excel versions are
  // detected correctly.
  const metadataBytes = await zip.getBytes("xl/metadata.xml");
  const richValueBytes = await zip.getBytes("xl/richData/rdrichvalue.xml");
  const richRelBytes = await zip.getBytes("xl/richData/richValueRel.xml");
  const richRelRelsBytes = await zip.getBytes("xl/richData/_rels/richValueRel.xml.rels");
  if (metadataBytes && richValueBytes && richRelBytes && richRelRelsBytes) {
    try {
      const metadataDoc = parseXml(metadataBytes);
      const richValueDoc = parseXml(richValueBytes);
      const richRelDoc = parseXml(richRelBytes);
      const richRelRelsDoc = parseXml(richRelRelsBytes);

      const valueMetadata = Array.from(metadataDoc.getElementsByTagName("*"))
        .filter((n) => n.localName === "rc")
        .map((n) => Number(n.getAttribute("v")))
        .filter((n) => Number.isFinite(n));
      const richValues = Array.from(richValueDoc.getElementsByTagName("*"))
        .filter((n) => n.localName === "rv");
      const richRelIds = Array.from(richRelDoc.getElementsByTagName("*"))
        .filter((n) => n.localName === "rel")
        .map((n) => n.getAttribute("r:id") || n.getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships", "id"))
        .filter(Boolean);
      const richRelTargets = {};
      for (const rel of Array.from(richRelRelsDoc.getElementsByTagName("Relationship"))) {
        richRelTargets[rel.getAttribute("Id")] = rel.getAttribute("Target");
      }

      const richImageByIndex = {};
      for (let i = 0; i < richValues.length; i++) {
        const values = Array.from(richValues[i].children || [])
          .filter((n) => n.localName === "v")
          .map((n) => String(n.textContent || "").trim());
        const relIndex = Number(values[0]);
        if (!Number.isInteger(relIndex) || !richRelIds[relIndex]) continue;
        const target = richRelTargets[richRelIds[relIndex]];
        if (!target) continue;

        const parts = ["xl", "richData"].concat(target.split("/"));
        const normalizedParts = [];
        for (const part of parts) {
          if (!part || part === ".") continue;
          if (part === "..") normalizedParts.pop();
          else normalizedParts.push(part);
        }
        const mediaName = normalizedParts.join("/");
        const media = await zip.getBytes(mediaName);
        if (!media) continue;
        const ext = (mediaName.split(".").pop() || "png").toLowerCase();
        richImageByIndex[i] = { bytes: media, ext };
      }

      for (const rowNode of Array.from(sheetXml.getElementsByTagName("row"))) {
        const rowNumber = Number(rowNode.getAttribute("r") || 0);
        if (!rowNumber) continue;
        for (const cell of Array.from(rowNode.children).filter((n) => n.localName === "c")) {
          const vmRaw = cell.getAttribute("vm");
          if (!vmRaw) continue;
          const vmIndex = Number(vmRaw) - 1;
          const richIndex = valueMetadata[vmIndex];
          const image = Number.isInteger(richIndex) ? richImageByIndex[richIndex] : null;
          if (!image) continue;
          const ref = cell.getAttribute("r") || "";
          imageByCell[ref] = image;
          imageByRow[rowNumber] = image;
        }
      }
    } catch (richError) {
      console.warn("Could not parse modern Excel in-cell images:", richError);
    }
  }

  const drawingNode = firstLocal(sheetXml, "drawing");
  if (drawingNode) {
    const relId = drawingNode.getAttribute("r:id") || drawingNode.getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships", "id");
    const sheetBase = sheetName.split("/").pop();
    const relsName = `xl/worksheets/_rels/${sheetBase}.rels`;
    const relsBytes = await zip.getBytes(relsName);
    if (relsBytes) {
      const relDoc = parseXml(relsBytes);
      const rel = Array.from(relDoc.getElementsByTagName("Relationship")).find((r) => r.getAttribute("Id") === relId);
      const target = rel?.getAttribute("Target");
      if (target) {
        const drawingName = target.startsWith("/") ? target.slice(1) : `xl/worksheets/${target}`.replace("xl/worksheets/../", "xl/");
        const normalizedDrawingName = drawingName.replace("xl/worksheets/../", "xl/");
        const drawingBytes = await zip.getBytes(normalizedDrawingName);
        if (drawingBytes) {
          const drawingDoc = parseXml(drawingBytes);
          const drawingBase = normalizedDrawingName.split("/").pop();
          const drawingRelsBytes = await zip.getBytes(`xl/drawings/_rels/${drawingBase}.rels`);
          const relMap = {};
          if (drawingRelsBytes) {
            const dr = parseXml(drawingRelsBytes);
            for (const r of Array.from(dr.getElementsByTagName("Relationship"))) relMap[r.getAttribute("Id")] = r.getAttribute("Target");
          }
          const anchors = Array.from(drawingDoc.getElementsByTagName("*")).filter((n) => n.localName === "twoCellAnchor" || n.localName === "oneCellAnchor");
          for (const anchor of anchors) {
            const from = firstLocal(anchor, "from");
            const row = Number(firstLocal(from, "row")?.textContent || 0) + 1;
            const blip = firstLocal(anchor, "blip");
            const rid = blip?.getAttribute("r:embed") || blip?.getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships", "embed");
            const targetMedia = relMap[rid];
            if (!targetMedia) continue;
            const mediaName = targetMedia.startsWith("/") ? targetMedia.slice(1) : `xl/drawings/${targetMedia}`.replace("xl/drawings/../", "xl/");
            const normalizedMediaName = mediaName.replace("xl/drawings/../", "xl/");
            const media = await zip.getBytes(normalizedMediaName);
            if (media) {
              const ext = (normalizedMediaName.split(".").pop() || "png").toLowerCase();
              imageByRow[row] = { bytes: media, ext };
            }
          }
        }
      }
    }
  }
  return { rows, imageByRow };
}

async function importImageToStorage(image, sampleId) {
  if (!image?.bytes?.length) return "";
  const mimeMap = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif", webp: "image/webp", bmp: "image/bmp" };
  const ext = image.ext === "jpg" ? "jpeg" : image.ext;
  const file = new File([image.bytes], `sample-import-${Date.now()}.${ext}`, { type: mimeMap[ext] || "image/png" });
  return uploadStorageImage(file, `samples/${sampleId}`, "sample-import");
}

async function buildImportedSamples(file, currentSamples, customers, productTypes, materialLists) {
  const parsed = await parseXlsxWorkbook(file);
  if (!parsed.rows.length) throw new Error("The Excel file is empty.");
  const headerRow = parsed.rows[0];
  const headerEntries = Object.entries(headerRow.cells).filter(([, v]) => String(v).trim() !== "");
  const mappedHeaders = headerEntries.map(([col, label]) => ({ col, label: String(label).trim(), key: NORMALIZED_SAMPLE_IMPORT_HEADER_MAP[normalizeImportHeader(label)] }));
  const unknown = mappedHeaders.filter((h) => !h.key).map((h) => h.label);
  const dataRows = parsed.rows.slice(1).filter((r) => Object.values(r.cells).some((v) => String(v ?? "").trim() !== ""));
  const existingById = new Map(currentSamples.map((s) => [String(s.id).toLowerCase(), s]));
  const results = [];
  const errors = [];
  let createCount = 0;
  let updateCount = 0;
  let imageCount = 0;

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const get = (key) => { const h = mappedHeaders.find((x) => x.key === key); return h ? row.cells[h.col] ?? "" : ""; };
    const rawId = String(get("id") || "").trim();
    const existing = rawId ? existingById.get(rawId.toLowerCase()) : null;
    const id = existing?.id || rawId || nextId([...currentSamples, ...results], "SA", 5);
    const base = existing ? { ...existing } : { ...BLANK_SAMPLE, id, requiredComponents: [], noteHistory: [], revisions: [] };
    const resolve = (list, key, label) => {
      const raw = get(key);
      if (!String(raw).trim()) return "";
      const id = findByIdCodeName(list, raw);
      if (!id) throw new Error(`${label} “${raw}” was not found in the current master list.`);
      return id;
    };
    try {
      const customerId = resolve(customers, "customer", "Customer");
      const productTypeId = resolve(productTypes, "productType", "Product Type");
      const mainMaterialId = resolve(materialLists.mainMaterials, "mainMaterial", "Main Material");
      const finishesColorId = resolve(materialLists.finishes, "finishColor", "Finish / Color");
      const woodSurfaceTreatmentId = resolve(materialLists.woodSurface, "woodSurface", "Wood Surface Treatment");
      const fabricTypeId = resolve(materialLists.fabricTypes, "fabricType", "Fabric Type");
      const fabricColorId = resolve(materialLists.fabricColors, "fabricColor", "Fabric Color");
      const ropeTypeId = resolve(materialLists.ropeTypes, "ropeType", "Rope Type");
      const ropeColorId = resolve(materialLists.ropeColors, "ropeColor", "Rope Color");
      const cemboardColorId = resolve(materialLists.cemboardColors, "cemboardColor", "Cemboard Color");
      const next = {
        ...base,
        id,
        name: String(get("name") || base.name || "(unnamed sample)").trim(),
        customerId: customerId || base.customerId || "",
        productTypeId: productTypeId || base.productTypeId || "",
        qty: toImportNumber(get("qty")) || base.qty || "",
        erpNo: String(get("erpNo") ?? "").trim(), manufacturingOrderNo: String(get("manufacturingOrderNo") ?? "").trim(), idpNo: String(get("idpNo") ?? "").trim(), idcNo: String(get("idcNo") ?? "").trim(),
        width: toImportNumber(get("width")), depth: toImportNumber(get("depth")), height: toImportNumber(get("height")), armHeight: toImportNumber(get("armHeight")), seatHeight: toImportNumber(get("seatHeight")),
        mainMaterialId: mainMaterialId || base.mainMaterialId || "", finishesColorId: finishesColorId || base.finishesColorId || "", woodSurfaceTreatmentId: woodSurfaceTreatmentId || base.woodSurfaceTreatmentId || "",
        fabricTypeId: fabricTypeId || base.fabricTypeId || "", fabricColorId: fabricColorId || base.fabricColorId || "", ropeTypeId: ropeTypeId || base.ropeTypeId || "", ropeDiameter: toImportNumber(get("ropeDiameter")), ropeColorId: ropeColorId || base.ropeColorId || "",
        metalName: String(get("metalName") ?? "").trim(), metalColor: String(get("metalColor") ?? "").trim(), cemboardColorId: cemboardColorId || base.cemboardColorId || "", hardware: String(get("hardware") ?? "").trim(), construction: String(get("construction") ?? "").trim(), currentRevision: String(get("currentRevision") ?? "").trim(),
        stageGroup: String(get("stageGroup") ?? "").trim(), stage: normalizeSampleWorkflowStage(get("stage") || base.stage), stageStatus: String(get("stageStatus") ?? "").trim(), waitingFor: String(get("waitingFor") ?? "").trim(), nextAction: String(get("nextAction") ?? "").trim(),
        stageStartDate: normalizeImportDate(get("stageStartDate")), priority: String(get("priority") ?? "").trim(), targetDate: normalizeImportDate(get("targetDate")), completedDate: normalizeImportDate(get("completedDate")), overallStatus: String(get("overallStatus") ?? "").trim(), orderId: String(get("orderId") ?? "").trim(),
      };
      const notes = String(get("notes") ?? "").trim();
      if (notes) next.noteHistory = [{ id: `import-note-${Date.now()}-${i}`, text: notes, createdAt: new Date().toISOString() }];
      const imageHeader = mappedHeaders.find((h) => h.key === "image");
      const imageCellRef = imageHeader ? `${imageHeader.col}${row.rowNumber}` : "";
      const image = (imageCellRef && parsed.imageByCell?.[imageCellRef]) || parsed.imageByRow[row.rowNumber];
      if (image) { next.__importImage = image; imageCount++; }
      results.push(next);
      if (existing) updateCount++; else createCount++;
    } catch (error) {
      errors.push({ row: row.rowNumber, id: rawId || "(new)", message: error?.message || String(error) });
    }
  }
  return { results, errors, unknown, createCount, updateCount, imageCount, totalRows: dataRows.length };
}

function ImportStatCard({ label, value, tone }) {
  const color = tone === "green" ? COLORS.green : tone === "teal" ? COLORS.teal : tone === "wood" ? COLORS.wood : COLORS.ink;
  return <div style={{ padding: "11px 12px", border: `1px solid ${COLORS.line}`, borderRadius: 10, background: COLORS.bg }}><div style={{ fontSize: 10.5, color: COLORS.inkSoft }}>{label}</div><div style={{ marginTop: 3, fontSize: 20, fontWeight: 750, color }}>{value}</div></div>;
}

function SampleImportModal({ samples, saveSamples, customers, productTypes, materialLists, onClose }) {
  const [file, setFile] = useState(null);
  const [parsed, setParsed] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState([]);

  const chooseFile = async (e) => {
    const selected = e.target.files?.[0]; e.target.value = "";
    if (!selected) return;
    setFile(selected); setParsed(null); setErrors([]); setMessage(""); setParsing(true);
    try {
      const result = await buildImportedSamples(selected, samples, customers, productTypes, materialLists);
      setParsed(result); setErrors(result.errors || []);
    } catch (error) { setMessage(error?.message || "Could not read this Excel file."); }
    finally { setParsing(false); }
  };

  const doImport = async () => {
    if (!parsed?.results?.length) return;
    setImporting(true); setMessage("");
    try {
      const next = samples.map((s) => s);
      const byId = new Map(next.map((s) => [s.id, s]));
      let uploaded = 0;
      for (const item of parsed.results) {
        const image = item.__importImage;
        const clean = { ...item }; delete clean.__importImage;
        if (image) {
          try {
            clean.image = await importImageToStorage(image, clean.id);
            if (clean.image) uploaded++;
          } catch (e) {
            errors.push({ row: parsed.results.indexOf(item) + 2, id: clean.id, message: `Image upload failed: ${e?.message || String(e)}` });
          }
        }
        byId.set(clean.id, clean);
      }
      saveSamples([...byId.values()]);
      setMessage(`Imported ${parsed.results.length} row(s): ${parsed.createCount} new, ${parsed.updateCount} updated${uploaded ? `, ${uploaded} image(s) uploaded` : ""}.`);
    } catch (error) { setMessage(error?.message || "Import failed."); }
    finally { setImporting(false); }
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(20,24,21,.46)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "min(980px, 100%)", maxHeight: "88vh", background: COLORS.panel, borderRadius: 18, border: `1px solid ${COLORS.line}`, boxShadow: "0 28px 90px rgba(0,0,0,.25)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 22px", borderBottom: `1px solid ${COLORS.line}` }}>
          <div><div style={{ fontSize: 19, fontWeight: 750 }}>Import Samples from Excel</div><div style={{ marginTop: 4, fontSize: 12.5, color: COLORS.inkSoft }}>Import new samples or update existing samples. Embedded Excel photos can be uploaded to Supabase Storage automatically.</div></div>
          <Button variant="ghost" small onClick={onClose}><X size={14} /> Close</Button>
        </div>
        <div style={{ padding: 18, overflowY: "auto", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ padding: 14, borderRadius: 12, background: "#F5F1E9", border: `1px solid ${COLORS.line}` }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>How to import</div>
            <div style={{ fontSize: 12, color: COLORS.inkSoft, lineHeight: 1.6 }}>1) Download the template. 2) Keep the header row unchanged. 3) Fill one sample per row. 4) For Customer / Product Type / Materials, use the existing ID, code, or exact name from the ERP. 5) Put the sample photo into the Excel file on the same row in <b>Image (embedded)</b> using <b>Insert → Pictures → Place in Cell</b> (or a normal floating picture). 6) Upload the completed .xlsx here.</div>
          </div>
          <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, minHeight: 110, border: `2px dashed ${COLORS.line}`, borderRadius: 14, cursor: "pointer", background: file ? COLORS.bg : "#fff" }}>
            <input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={chooseFile} style={{ display: "none" }} />
            <FileSpreadsheet size={28} color={COLORS.wood} />
            <div><div style={{ fontWeight: 700 }}>{file ? file.name : "Choose an Excel .xlsx file"}</div><div style={{ fontSize: 12, color: COLORS.inkSoft, marginTop: 3 }}>{parsing ? "Reading workbook…" : "Click to choose / replace file"}</div></div>
          </label>
          {parsed && <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            <ImportStatCard label="Rows" value={parsed.totalRows} /> <ImportStatCard label="New" value={parsed.createCount} tone="green" /> <ImportStatCard label="Updates" value={parsed.updateCount} tone="wood" /> <ImportStatCard label="Embedded photos" value={parsed.imageCount} tone="teal" />
          </div>}
          {parsed?.unknown?.length > 0 && <div style={{ padding: 12, borderRadius: 10, background: COLORS.amberSoft, fontSize: 12 }}><b>Ignored columns:</b> {parsed.unknown.join(", ")}</div>}
          {errors.length > 0 && <div style={{ padding: 12, borderRadius: 10, background: COLORS.redSoft, border: `1px solid #f0caca` }}><div style={{ fontWeight: 700, marginBottom: 6, color: COLORS.red }}><AlertCircle size={14} style={{ verticalAlign: "-2px" }} /> {errors.length} row(s) have errors and will be skipped.</div><div style={{ maxHeight: 150, overflow: "auto", fontSize: 11.5 }}>{errors.slice(0, 30).map((e) => <div key={`${e.row}-${e.id}`} style={{ padding: "4px 0" }}>Row {e.row} · {e.id}: {e.message}</div>)}</div></div>}
          {message && <div style={{ padding: 12, borderRadius: 10, background: COLORS.greenSoft, color: COLORS.green, fontSize: 12.5 }}><CheckCircle2 size={14} style={{ verticalAlign: "-2px" }} /> {message}</div>}
          {parsed?.results?.length > 0 && <div style={{ overflow: "auto", border: `1px solid ${COLORS.line}`, borderRadius: 10 }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5 }}><thead><tr>{["Row", "Sample ID", "Sample Name", "ERP Code", "Customer", "Stage"].map((h) => <th key={h} style={{ textAlign: "left", padding: 8, borderBottom: `1px solid ${COLORS.line}`, whiteSpace: "nowrap" }}>{h}</th>)}</tr></thead><tbody>{parsed.results.slice(0, 20).map((s) => <tr key={s.id}><td style={{ padding: 8, borderBottom: `1px solid ${COLORS.line}` }}>✓</td><td style={{ padding: 8, borderBottom: `1px solid ${COLORS.line}` }}>{s.id}</td><td style={{ padding: 8, borderBottom: `1px solid ${COLORS.line}` }}>{s.name}</td><td style={{ padding: 8, borderBottom: `1px solid ${COLORS.line}` }}>{s.erpNo}</td><td style={{ padding: 8, borderBottom: `1px solid ${COLORS.line}` }}>{customers.find((c) => c.id === s.customerId)?.name || ""}</td><td style={{ padding: 8, borderBottom: `1px solid ${COLORS.line}` }}>{s.stage}</td></tr>)}</tbody></table></div>}
        </div>
        <div style={{ padding: "14px 22px", borderTop: `1px solid ${COLORS.line}`, display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={doImport} disabled={importing || !parsed?.results?.length}><Upload size={14} /> {importing ? "Importing…" : `Import ${parsed?.results?.length || 0} samples`}</Button>
        </div>
      </div>
    </div>
  );
}

function SampleExportModal({ samples, customers, productTypes, materialLists, materialPreps, initialSampleId, onClose }) {
  const [selectedKeys, setSelectedKeys] = useState(() => SAMPLE_EXPORT_FIELDS.map((f) => f.key));
  const [fieldSearch, setFieldSearch] = useState("");
  const [filters, setFilters] = useState({});
  const [scope, setScope] = useState(initialSampleId ? "current" : "all");
  const [exporting, setExporting] = useState(false);

  const { mainMaterials = [], finishes = [], woodSurface = [], fabricTypes = [], fabricColors = [], ropeTypes = [], ropeColors = [], cemboardColors = [] } = materialLists || {};
  const ctx = { customerName: (id) => customers.find((c) => c.id === id)?.name || "", productTypeName: (id) => productTypes.find((p) => p.id === id)?.name || "", mainMaterials, finishes, woodSurface, fabricTypes, fabricColors, ropeTypes, ropeColors, cemboardColors, materialPreps };
  const fieldMap = new Map(SAMPLE_EXPORT_FIELDS.map((f) => [f.key, f]));
  const filteredFields = SAMPLE_EXPORT_FIELDS.filter((f) => f.label.toLowerCase().includes(fieldSearch.trim().toLowerCase()));

  const sourceSamples = scope === "current" && initialSampleId ? samples.filter((s) => s.id === initialSampleId) : samples;
  const visibleSamples = sourceSamples.filter((sample) => SAMPLE_EXPORT_FIELDS.every((field) => {
    const filter = String(filters[field.key] || "").trim().toLowerCase();
    if (!filter) return true;
    return String(field.get(sample, ctx) ?? "").toLowerCase().includes(filter);
  }));

  const toggleField = (key) => setSelectedKeys((current) => current.includes(key) ? current.filter((k) => k !== key) : [...current, key]);
  const selectAll = () => setSelectedKeys(SAMPLE_EXPORT_FIELDS.map((f) => f.key));
  const clearAll = () => setSelectedKeys([]);
  const resetFilters = () => setFilters({});

  const handleExport = async () => {
    const fields = selectedKeys.map((key) => fieldMap.get(key)).filter(Boolean);
    if (!fields.length) { alert("Select at least one field to export."); return; }
    if (!visibleSamples.length) { alert("No samples match the current filters."); return; }
    setExporting(true);
    try {
      const headers = fields.map((f) => f.label);
      const rows = visibleSamples.map((sample) => fields.map((f) => f.get(sample, ctx)));
      const stamp = new Date().toISOString().slice(0, 10);
      const imageColumnIndex = fields.findIndex((f) => f.key === "image");
      const qrColumnIndex = fields.findIndex((f) => f.key === "qrCode");
      const embeddedImageColumns = {};
      if (imageColumnIndex >= 0) embeddedImageColumns[imageColumnIndex] = visibleSamples.map((sample) => sample.image || "");
      if (qrColumnIndex >= 0) {
        embeddedImageColumns[qrColumnIndex] = await Promise.all(visibleSamples.map(async (sample) => {
          try {
            return await QRCode.toDataURL(samplePublicUrl(sample.id), { width: 260, margin: 2, errorCorrectionLevel: "M" });
          } catch (error) {
            console.warn("QR generation failed", sample.id, error);
            return "";
          }
        }));
      }
      const result = await downloadExcelWithEmbeddedImages(`tanhoa-samples-${stamp}.xlsx`, headers, rows, embeddedImageColumns);
      const message = result.failedImages
        ? `Excel exported. ${result.embeddedCount} image/QR item(s) embedded; ${result.failedImages} item(s) could not be embedded.`
        : `Excel exported successfully with ${result.embeddedCount} embedded image/QR item(s).`;
      alert(message);
      onClose();
    } catch (error) {
      console.error(error);
      alert(`Excel export failed: ${error?.message || error}`);
    } finally { setExporting(false); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(20,24,22,.46)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "min(1180px, 96vw)", maxHeight: "92vh", background: COLORS.panel, borderRadius: 18, boxShadow: "0 24px 70px rgba(0,0,0,.18)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "18px 22px", borderBottom: `1px solid ${COLORS.line}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
          <div><h2 style={{ margin: 0, fontFamily: FONT_HEAD, fontSize: 21 }}>Export Sample Data</h2><div style={{ marginTop: 4, color: COLORS.inkSoft, fontSize: 12.5 }}>Choose columns and apply column filters. Export creates an Excel file with images embedded directly in the workbook.</div></div>
          <Button variant="ghost" small onClick={onClose}><X size={14} /> Close</Button>
        </div>

        <div style={{ padding: "14px 22px", borderBottom: `1px solid ${COLORS.line}`, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <Field label="Export scope" width="auto"><Select value={scope} onChange={(e) => setScope(e.target.value)} style={{ width: 220 }}><option value="all">All samples</option>{initialSampleId && <option value="current">Current sample only</option>}</Select></Field>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}><Badge tone="wood">{visibleSamples.length} samples</Badge><Badge tone="green">{selectedKeys.length} fields</Badge><Button small variant="subtle" onClick={resetFilters}>Reset filters</Button></div>
        </div>

        <div style={{ padding: "14px 22px", overflowY: "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(360px, 1.05fr) minmax(420px, 1.35fr)", gap: 18 }}>
            <Panel title="Columns & filters" action={<div style={{ display: "flex", gap: 6 }}><Button small variant="subtle" onClick={selectAll}>Select all</Button><Button small variant="ghost" onClick={clearAll}>Clear</Button></div>}>
              <Input value={fieldSearch} onChange={(e) => setFieldSearch(e.target.value)} placeholder="Search fields…" style={{ marginBottom: 10 }} />
              <div style={{ marginBottom: 10, padding: "8px 10px", borderRadius: 9, background: "#F5F1E9", color: COLORS.inkSoft, fontSize: 11.5 }}>Tip: select <b>Image (embedded)</b> for the sample photo or <b>QR Code</b> to place a scannable QR image directly into the Excel file.</div>
              <div style={{ marginBottom: 8, padding: "9px 10px", borderRadius: 10, background: "#FFF7F0", border: `1px solid ${COLORS.orange || "#FF6B00"}` }}>
                {(() => { const field = fieldMap.get("qrCode"); const checked = selectedKeys.includes("qrCode"); return <div style={{ display: "grid", gridTemplateColumns: "24px 1fr", gap: 8, alignItems: "center" }}>
                  <input type="checkbox" checked={checked} onChange={() => toggleField("qrCode")} />
                  <div><div style={{ fontSize: 12.5, fontWeight: 700 }}>QR Code</div><div style={{ fontSize: 11, color: COLORS.inkSoft }}>Embedded QR image linking to this sample's public passport.</div></div>
                </div>; })()}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {filteredFields.filter((field) => field.key !== "qrCode").map((field) => {
                  const checked = selectedKeys.includes(field.key);
                  return <div key={field.key} style={{ display: "grid", gridTemplateColumns: "24px 1fr", gap: 8, alignItems: "center", padding: "7px 8px", borderRadius: 9, background: checked ? COLORS.bg : "#fff", border: `1px solid ${checked ? COLORS.line : "transparent"}` }}>
                    <input type="checkbox" checked={checked} onChange={() => toggleField(field.key)} />
                    <div><div style={{ fontSize: 12.5, fontWeight: 600 }}>{field.label}</div><Input value={filters[field.key] || ""} onChange={(e) => setFilters((current) => ({ ...current, [field.key]: e.target.value }))} placeholder={`Filter ${field.label.toLowerCase()}…`} style={{ marginTop: 5, padding: "6px 8px", fontSize: 12 }} /></div>
                  </div>;
                })}
              </div>
            </Panel>

            <Panel title="Preview" action={<span style={{ fontSize: 12, color: COLORS.inkSoft }}>Showing first 10 rows</span>}>
              {selectedKeys.length === 0 ? <div style={{ padding: 30, textAlign: "center", color: COLORS.inkSoft }}>Select fields to see the preview.</div> : (
                <div style={{ overflow: "auto", maxHeight: 520 }}><table style={{ borderCollapse: "collapse", width: "100%", fontSize: 11.5 }}><thead><tr>{selectedKeys.map((key) => <th key={key} style={{ position: "sticky", top: 0, background: COLORS.panel, textAlign: "left", padding: "8px", borderBottom: `2px solid ${COLORS.line}`, whiteSpace: "nowrap" }}>{fieldMap.get(key)?.label}</th>)}</tr></thead><tbody>{visibleSamples.slice(0, 10).map((sample) => <tr key={sample.id}>{selectedKeys.map((key) => <td key={key} style={{ padding: "7px 8px", borderBottom: `1px solid ${COLORS.line}`, whiteSpace: "nowrap", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis" }}>{fieldMap.get(key)?.key === "qrCode" ? "QR image" : String(fieldMap.get(key)?.get(sample, ctx) ?? "")}</td>)}</tr>)}</tbody></table></div>
              )}
              {!visibleSamples.length && <div style={{ padding: 18, color: COLORS.red, fontSize: 12.5 }}>No rows match your filters.</div>}
            </Panel>
          </div>
        </div>

        <div style={{ padding: "14px 22px", borderTop: `1px solid ${COLORS.line}`, display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleExport} disabled={exporting || !visibleSamples.length || !selectedKeys.length}><Download size={14} /> {exporting ? "Exporting…" : `Export ${visibleSamples.length} samples`}</Button>
        </div>
      </div>
    </div>
  );
}

function AIDescriptionModal({ materialLists, productTypes, onApply, onClose }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [descriptionText, setDescriptionText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createMissing, setCreateMissing] = useState(false);

  const readFile = (f) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) { setError("Please choose an image file."); return; }
    if (f.size > 12 * 1024 * 1024) { setError("Please choose an image smaller than 12 MB."); return; }
    setError(""); setFile(f); setResult(null);
    const reader = new FileReader();
    reader.onload = () => setPreview(String(reader.result || ""));
    reader.readAsDataURL(f);
  };

  const analyze = async () => {
    if (!file && !descriptionText.trim()) return;
    setLoading(true); setError("");
    try {
      let imageBase64 = "";
      if (preview) imageBase64 = preview.split(",")[1] || "";
      const response = await fetch("/api/parse-description", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          imageBase64,
          mimeType: file?.type || "image/jpeg",
          descriptionText,
          masters: materialLists,
        }),
      });
      const contentType = response.headers.get("content-type") || "";
      const raw = await response.text();
      let data = null;
      if (contentType.includes("application/json")) {
        try { data = JSON.parse(raw); } catch (_) { /* handled below */ }
      }
      if (!response.ok) {
        const serverMessage = data?.error || raw?.replace(/\s+/g, " ").trim();
        throw new Error(serverMessage || `AI analysis failed (HTTP ${response.status}).`);
      }
      if (!data) throw new Error("AI endpoint returned an invalid response. Please check the Vercel Function deployment.");
      if (!data.result) throw new Error(data.error || "AI returned no extraction result.");
      setResult(data.result);
    } catch (e) {
      setError(e?.message || String(e));
    } finally { setLoading(false); }
  };

  const rows = [
    ["Sample name", "sampleName"], ["Product type", "productType"], ["Qty", "qty"],
    ["Width", "width"], ["Depth", "depth"], ["Height", "height"], ["Arm height", "armHeight"], ["Seat height", "seatHeight"],
    ["Main material", "mainMaterial"], ["Finish / color", "finishColor"], ["Wood treatment", "woodSurfaceTreatment"],
    ["Fabric type", "fabricType"], ["Fabric color", "fabricColor"], ["Rope type", "ropeType"], ["Rope diameter", "ropeDiameter"], ["Rope color", "ropeColor"],
    ["Metal name", "metalName"], ["Metal color", "metalColor"], ["Cemboard / stone", "cemboardColor"], ["Hardware", "hardware"], ["Construction", "construction"], ["Revision", "revision"], ["Packing", "packing"], ["Notes", "notes"],
  ];

  const confidence = result?.confidence || {};
  const editResult = (key, value) => setResult((r) => ({ ...r, [key]: value }));
  const tone = (value) => {
    const n = Number(value);
    return n >= 0.9 ? { bg: COLORS.greenSoft, fg: COLORS.green } : n >= 0.75 ? { bg: COLORS.amberSoft, fg: COLORS.wood } : { bg: COLORS.redSoft, fg: COLORS.red };
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(20,24,21,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1600, padding: 18 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "min(1120px, 100%)", maxHeight: "92vh", background: "#fff", borderRadius: 18, overflow: "hidden", boxShadow: "0 30px 100px rgba(0,0,0,.28)", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "18px 22px", borderBottom: `1px solid ${COLORS.line}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div><div style={{ fontSize: 20, fontWeight: 800, display: "flex", alignItems: "center", gap: 8 }}><Sparkles size={19} color={COLORS.wood} /> AI from Description</div><div style={{ fontSize: 12.5, color: COLORS.inkSoft, marginTop: 3 }}>Upload a product-description image. AI extracts fields; nothing is saved until you confirm.</div></div>
          <Button variant="ghost" small onClick={onClose}><X size={14} /> Close</Button>
        </div>
        <div style={{ padding: 18, overflowY: "auto" }}>
          {!result ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={{ display: "flex", minHeight: 280, border: `2px dashed ${COLORS.line}`, borderRadius: 14, alignItems: "center", justifyContent: "center", cursor: "pointer", background: COLORS.bg, overflow: "hidden" }}>
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { readFile(e.target.files?.[0]); e.target.value = ""; }} />
                  {preview ? <img src={preview} alt="Description preview" style={{ width: "100%", height: 280, objectFit: "contain" }} /> : <div style={{ textAlign: "center", color: COLORS.inkSoft }}><ImageIcon size={34} /><div style={{ fontWeight: 700, marginTop: 10 }}>Upload description image</div><div style={{ fontSize: 12, marginTop: 4 }}>PNG / JPG / WebP · max 12 MB</div></div>}
                </label>
                <div style={{ marginTop: 10, fontSize: 11.5, color: COLORS.inkSoft }}>Best results: upload a clear screenshot/photo of the customer's Product Description table or specification sheet.</div>
              </div>
              <div>
                <Field label="Optional description text — useful if the image is low quality">
                  <textarea value={descriptionText} onChange={(e) => setDescriptionText(e.target.value)} placeholder="Paste the product description here…" style={{ ...inputStyle, minHeight: 280, resize: "vertical" }} />
                </Field>
                {error && <div style={{ marginTop: 12, padding: 10, borderRadius: 9, background: COLORS.redSoft, color: COLORS.red, fontSize: 12 }}>{error}</div>}
                <div style={{ marginTop: 14, padding: 12, borderRadius: 10, background: "#F7F7F7", fontSize: 12, lineHeight: 1.6 }}><b>What AI will extract</b><br />Name · Product type · Qty · Dimensions · Materials · Finish / Color · Hardware · Construction · Packing · Revision.</div>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}><div><div style={{ fontWeight: 800, fontSize: 16 }}>Double-check AI extraction</div><div style={{ fontSize: 12, color: COLORS.inkSoft }}>Edit any value before applying it to the Sample form.</div></div><Button small variant="subtle" onClick={() => setResult(null)}>← Analyze again</Button></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {rows.map(([label, key]) => {
                  const value = result[key] ?? "";
                  const groupConfidence = key === "sampleName" || key === "productType" ? confidence[key] : ["width","depth","height","armHeight","seatHeight"].includes(key) ? confidence.dimensions : ["mainMaterial","finishColor","woodSurfaceTreatment","fabricType","fabricColor","ropeType","ropeDiameter","ropeColor","cemboardColor"].includes(key) ? confidence.materials : confidence.hardware;
                  const badge = groupConfidence == null ? null : tone(groupConfidence);
                  return <div key={key} style={{ display: "grid", gridTemplateColumns: "145px 1fr auto", gap: 8, alignItems: "center", padding: "8px 10px", border: `1px solid ${COLORS.line}`, borderRadius: 9 }}><div style={{ fontSize: 12, fontWeight: 650 }}>{label}</div><Input value={value} onChange={(e) => editResult(key, e.target.value)} /><span style={{ minWidth: 48, textAlign: "center", fontSize: 10.5, padding: "4px 6px", borderRadius: 999, background: badge?.bg || COLORS.bg, color: badge?.fg || COLORS.inkSoft }}>{badge ? `${Math.round(Number(groupConfidence) * 100)}%` : "—"}</span></div>;
                })}
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, fontSize: 12.5, padding: 10, background: COLORS.amberSoft, borderRadius: 9 }}><input type="checkbox" checked={createMissing} onChange={(e) => setCreateMissing(e.target.checked)} /> Create missing material/master values automatically when applying. Leave unchecked to keep unknown values for manual review.</label>
              {result.sourceText && <details style={{ marginTop: 12 }}><summary style={{ cursor: "pointer", fontSize: 12, fontWeight: 700 }}>View source text extracted by AI</summary><pre style={{ whiteSpace: "pre-wrap", fontSize: 11.5, background: COLORS.bg, padding: 10, borderRadius: 8 }}>{result.sourceText}</pre></details>}
            </div>
          )}
        </div>
        <div style={{ padding: "14px 22px", borderTop: `1px solid ${COLORS.line}`, display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          {!result ? <Button onClick={analyze} disabled={loading || (!file && !descriptionText.trim())}>{loading ? "Analyzing…" : <><Sparkles size={14} /> Analyze with AI</>}</Button> : <Button onClick={() => onApply(result, createMissing)}><CheckCircle2 size={14} /> Apply to Sample</Button>}
        </div>
      </div>
    </div>
  );
}


function SamplesView({ samples, saveSamples, customers, customerName, productTypes, productTypeName, orders, materialLists, saveMaterialList, materialPreps, saveMaterialPreps, tasks, saveTasks }) {
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [filterStage, setFilterStage] = useState("All");
  const [filterCustomer, setFilterCustomer] = useState("All");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("kanban");
  const [imageUploading, setImageUploading] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [exportSampleId, setExportSampleId] = useState(null);
  const [qrSample, setQrSample] = useState(null);
  const [showAIDescription, setShowAIDescription] = useState(false);
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
      const folder = editing?.id || `draft-${Date.now()}`;
      const publicUrl = await uploadStorageImage(file, `samples/${folder}`, "sample");
      setEditing((current) => current ? { ...current, image: publicUrl } : current);
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

  const bulkDeleteSamples = (ids) => {
    const idSet = new Set(ids || []);
    if (!idSet.size) return;
    const count = idSet.size;
    if (!confirm(`Delete ${count} selected sample${count === 1 ? "" : "s"}? This action cannot be undone.`)) return;
    saveSamples(samples.filter((s) => !idSet.has(s.id)));
    if (viewing && idSet.has(viewing.id)) setViewing(null);
  };

  const bulkMoveStage = (ids, newStage) => {
    const idSet = new Set(ids || []);
    if (!idSet.size) return;
    saveSamples(samples.map((s) => (idSet.has(s.id) ? { ...s, stage: newStage } : s)));
  };

  const startNew = (initialStage = "Request Received") => {
    setEditing({ ...BLANK_SAMPLE, customerId: customers[0]?.id || "", stage: initialStage, requiredComponents: [] , noteHistory: [] });
    setShowForm(true);
    setViewing(null);
  };
  const applyAIDescription = (ai, createMissing) => {
    const resolve = (value, listKey) => {
      const raw = String(value || "").trim();
      if (!raw) return "";
      const list = materialLists[listKey] || [];
      const norm = (x) => String(x || "").trim().toLowerCase().replace(/\s+/g, " ");
      const n = norm(raw);
      const hit = list.find((x) => [x.id, x.code, x.name, x.Main_Material_Name].some(v => norm(v) === n))
        || list.find((x) => [x.code, x.name, x.Main_Material_Name].some(v => norm(v) && (norm(v).includes(n) || n.includes(norm(v)))));
      if (hit) return hit.id;
      if (createMissing) return addMaterialListItem(listKey, raw);
      return "";
    };
    const next = { ...editing };
    if (ai.sampleName) next.name = ai.sampleName;
    if (ai.productType) next.productTypeId = resolve(ai.productType, "productTypes");
    if (ai.qty != null) next.qty = String(ai.qty);
    if (ai.width != null) next.width = String(ai.width);
    if (ai.depth != null) next.depth = String(ai.depth);
    if (ai.height != null) next.height = String(ai.height);
    if (ai.armHeight != null) next.armHeight = String(ai.armHeight);
    if (ai.seatHeight != null) next.seatHeight = String(ai.seatHeight);
    if (ai.ropeDiameter != null) next.ropeDiameter = String(ai.ropeDiameter);
    if (ai.mainMaterial) next.mainMaterialId = resolve(ai.mainMaterial, "mainMaterials");
    if (ai.finishColor) next.finishesColorId = resolve(ai.finishColor, "finishes");
    if (ai.woodSurfaceTreatment) next.woodSurfaceTreatmentId = resolve(ai.woodSurfaceTreatment, "woodSurface");
    if (ai.fabricType) next.fabricTypeId = resolve(ai.fabricType, "fabricTypes");
    if (ai.fabricColor) next.fabricColorId = resolve(ai.fabricColor, "fabricColors");
    if (ai.ropeType) next.ropeTypeId = resolve(ai.ropeType, "ropeTypes");
    if (ai.ropeColor) next.ropeColorId = resolve(ai.ropeColor, "ropeColors");
    if (ai.cemboardColor) next.cemboardColorId = resolve(ai.cemboardColor, "cemboardColors");
    if (ai.metalName) next.metalName = ai.metalName;
    if (ai.metalColor) next.metalColor = ai.metalColor;
    if (ai.hardware) next.hardware = ai.hardware;
    if (ai.construction) next.construction = ai.construction;
    if (ai.revision) next.currentRevision = ai.revision;
    const extra = [ai.packing ? `Packing: ${ai.packing}` : "", ai.notes || ""].filter(Boolean).join("\n");
    if (extra) next.notes = [next.notes, `AI source notes:\n${extra}`].filter(Boolean).join("\n\n");
    if (ai.sourceText) next.notes = [next.notes, `Source description:\n${ai.sourceText}`].filter(Boolean).join("\n\n");
    setEditing(next);
    setShowAIDescription(false);
  };

  const startEdit = (s) => {
    const legacyRows = materialPreps.filter((p) => p.sampleId === s.id);
    const requiredComponents = (s.requiredComponents && s.requiredComponents.length)
      ? s.requiredComponents
      : legacyRows.map((p) => ({ key: p.componentField || `legacy:${p.id}`, name: p.materialName || p.materialName, qty: p.qty || 1, targetDate: p.dueDate || "", status: p.status || "Waiting", photo: p.photo || "" }));
    setEditing({ ...s, stage: normalizeSampleWorkflowStage(s.stage), requiredComponents, noteHistory: s.noteHistory || (s.notes ? [{ id: "legacy-note", text: s.notes, createdAt: new Date().toISOString() }] : []) });
    setShowForm(true); setViewing(null);
  };
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

  const filtered = samples.filter((s) => matchesSearchAndCustomer(s) && (filterStage === "All" || normalizeSampleWorkflowStage(s.stage) === filterStage));
  const kanbanSamples = samples.filter(matchesSearchAndCustomer);

  const {
    mainMaterials = [], finishes = [], woodSurface = [], fabricTypes = [],
    fabricColors = [], ropeTypes = [], ropeColors = [], cemboardColors = [],
  } = materialLists;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <h1 style={{ fontFamily: FONT_HEAD, fontSize: 26, margin: 0 }}>Samples</h1>
        <div style={{ display: "flex", gap: 8 }}><Button small variant="subtle" onClick={() => setShowImport(true)}><Upload size={14} /> Import</Button><Button small variant="subtle" onClick={() => setShowExport(true)}><Download size={14} /> Export</Button><Button onClick={startNew}><Plus size={15} /> New sample</Button></div>
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
          <div style={{ marginBottom: 14, padding: 14, borderRadius: 12, background: "linear-gradient(135deg,#FFF7F0,#FFFDFB)", border: `1px solid #F1D4BF`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div><div style={{ fontWeight: 750, fontSize: 14 }}>AI from Description</div><div style={{ fontSize: 12, color: COLORS.inkSoft, marginTop: 3 }}>Upload a product-description image and let AI pre-fill the Sample fields. You review everything before saving.</div></div>
            <Button type="button" onClick={() => setShowAIDescription(true)}><Sparkles size={15} /> Analyze description</Button>
          </div>
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
                      {imageUploading ? "Uploading…" : editing.image ? "Change photo" : "Upload from computer"}
                    </Button>
                    {editing.image && (
                      <Button type="button" variant="ghost" onClick={clearSampleImage}>
                        <X size={14} /> Remove
                      </Button>
                    )}
                  </div>

                  <div style={{ fontSize: 11.5, color: COLORS.inkSoft }}>
                    JPG, PNG, WebP or other browser-supported image • max 15 MB.
                  </div>
                </div>
              </Field>
              <Field label="Required components">
                <div style={{ display: "flex", flexDirection: "column", gap: 8, background: COLORS.bg, borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 12, color: COLORS.inkSoft }}>Tick only the components this sample actually requires. Quantity is tracked here; target date, status and proof photo are managed in Material progress.</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
                    {COMPONENT_OPTIONS.map((name) => {
                      const selected = (editing.requiredComponents || []).find((c) => c.name === name);
                      return (
                        <label key={name} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "#fff", border: `1px solid ${selected ? COLORS.wood : COLORS.line}`, borderRadius: 8, cursor: "pointer" }}>
                          <input type="checkbox" checked={!!selected} onChange={(e) => {
                            const current = editing.requiredComponents || [];
                            const next = e.target.checked
                              ? [...current, { id: "cmp" + Date.now() + Math.random(), name, qty: 1, targetDate: "", status: "Waiting", photo: "" }]
                              : current.filter((c) => c.name !== name);
                            setEditing({ ...editing, requiredComponents: next });
                          }} />
                          <span style={{ flex: 1, fontSize: 13 }}>{name}</span>
                          {selected && <Input type="number" min="1" value={selected.qty} onChange={(e) => setEditing({ ...editing, requiredComponents: (editing.requiredComponents || []).map((c) => c.name === name ? { ...c, qty: e.target.value } : c) })} style={{ width: 72, fontSize: 12, padding: "5px 7px" }} />}
                        </label>
                      );
                    })}
                  </div>
                </div>
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
          onExport={(sampleId) => { setExportSampleId(sampleId); setShowExport(true); }}
          onShowQR={(sampleId) => { const found = samples.find((x) => x.id === sampleId); if (found) setQrSample(found); }}
          onClose={() => setViewing(null)}
          onDelete={() => remove(viewing.id)}
          onSaveSample={(updated) => {
            saveSamples(samples.map((s) => (s.id === updated.id ? updated : s)));
            setViewing(updated);
          }}
        />
      )}

      {showAIDescription && <AIDescriptionModal
        materialLists={materialLists}
        productTypes={productTypes}
        onApply={applyAIDescription}
        onClose={() => setShowAIDescription(false)}
      />}
      {showImport && <SampleImportModal samples={samples} saveSamples={saveSamples} customers={customers} productTypes={productTypes} materialLists={materialLists} onClose={() => setShowImport(false)} />}
      {showExport && <SampleExportModal samples={samples} customers={customers} productTypes={productTypes} materialLists={materialLists} materialPreps={materialPreps} initialSampleId={exportSampleId} onClose={() => { setShowExport(false); setExportSampleId(null); }} />}
      {qrSample && <SampleQRModal sample={qrSample} customerName={customerName(qrSample.customerId)} onClose={() => setQrSample(null)} />}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 12.5, color: COLORS.inkSoft }}>
          {(viewMode === "kanban" ? kanbanSamples : filtered).length} sample{(viewMode === "kanban" ? kanbanSamples : filtered).length === 1 ? "" : "s"}
        </div>
      </div>

      {viewMode === "kanban" ? (
        <KanbanBoard
          samples={kanbanSamples}
          customerName={customerName}
          materialPreps={materialPreps}
          moveStage={moveStage}
          onBulkMove={bulkMoveStage}
          onBulkDelete={bulkDeleteSamples}
          onAddSample={startNew}
          onCardClick={(s) => { setViewing(s); setShowForm(false); }}
          onShowQR={(s) => setQrSample(s)}
        />
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


function getMaterialReadiness(sample, materialPreps = []) {
  const live = (materialPreps || []).filter((p) => p.sampleId === sample.id);
  const snapshot = (sample.requiredComponents || []).map((c) => ({
    id: c.id || c.name,
    materialName: c.name || "Material",
    status: c.status || "Waiting",
    dueDate: c.targetDate || "",
  }));
  const rows = live.length ? live : snapshot;
  const total = rows.length;
  const done = rows.filter((r) => String(r.status || "").trim().toLowerCase() === "done").length;
  const missing = rows.filter((r) => String(r.status || "").trim().toLowerCase() !== "done");
  const overdue = missing.filter((r) => r.dueDate && r.dueDate < todayStr()).length;
  let status = "No Material Plan";
  if (total > 0 && done === total) status = "Ready";
  else if (total > 0 && done > 0) status = "Partial";
  else if (total > 0) status = "Blocked";
  return { total, done, missing, overdue, status, percent: total ? Math.round((done / total) * 100) : 0 };
}

function materialReadinessTone(readiness) {
  if (readiness.status === "Ready") return { bg: "#EAF7EE", color: "#247A45", border: "#BFE5CB" };
  if (readiness.status === "Partial") return { bg: "#FFF4E5", color: "#B45B08", border: "#F4D09D" };
  if (readiness.status === "Blocked") return { bg: "#FFF0EC", color: "#B83B19", border: "#F2C0B1" };
  return { bg: "#F3F4F6", color: "#73777D", border: "#E0E2E5" };
}

function KanbanBoard({ samples, customerName, materialPreps, moveStage, onBulkMove, onBulkDelete, onAddSample, onCardClick, onShowQR }) {
  const [dragOverStage, setDragOverStage] = useState(null);
  const [draggingIds, setDraggingIds] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [filterMaterialReadiness, setFilterMaterialReadiness] = useState("All");

  const readinessFilteredSamples = samples.filter((s) => {
    const r = getMaterialReadiness(s, materialPreps);
    if (filterMaterialReadiness === "All") return true;
    if (filterMaterialReadiness === "Ready") return r.status === "Ready";
    if (filterMaterialReadiness === "Missing") return r.total > 0 && r.status !== "Ready";
    if (filterMaterialReadiness === "Overdue") return r.overdue > 0;
    if (filterMaterialReadiness === "No Plan") return r.status === "No Material Plan";
    return true;
  });
  const visibleIds = readinessFilteredSamples.map((s) => s.id);
  const selectedVisibleIds = selectedIds.filter((id) => visibleIds.includes(id));
  const allVisibleSelected = visibleIds.length > 0 && selectedVisibleIds.length === visibleIds.length;

  useEffect(() => {
    setSelectedIds((current) => current.filter((id) => visibleIds.includes(id)));
  }, [samples, filterMaterialReadiness]);

  const toggleSelected = (id) => {
    setSelectedIds((current) => current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);
  };

  const toggleSelectAll = () => {
    setSelectedIds(allVisibleSelected ? [] : visibleIds);
  };

  const handleCardDragStart = (e, id) => {
    const idsToMove = selectedIds.includes(id) ? selectedIds : [id];
    setDraggingIds(idsToMove);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/sample-ids", JSON.stringify(idsToMove));
    // Keep the existing single-id payload for compatibility with older drop handlers.
    e.dataTransfer.setData("text/sample-id", id);
  };

  const handleDrop = (e, stage) => {
    e.preventDefault();
    setDragOverStage(null);
    let ids = [];
    try { ids = JSON.parse(e.dataTransfer.getData("text/sample-ids") || "[]"); } catch (_) {}
    if (!ids.length) {
      const id = e.dataTransfer.getData("text/sample-id") || draggingIds[0];
      if (id) ids = [id];
    }
    if (!ids.length) return;
    const idSet = new Set(ids);
    if (stage === "Assembly") {
      const blocked = samples.filter((s) => idSet.has(s.id)).map((s) => ({ sample: s, readiness: getMaterialReadiness(s, materialPreps) })).filter(({ readiness }) => readiness.total > 0 && readiness.status !== "Ready");
      if (blocked.length) {
        const lines = blocked.slice(0, 6).map(({ sample, readiness }) => `• ${sample.name || sample.id}: ${readiness.done}/${readiness.total} ready — missing ${readiness.missing.map((m) => m.materialName || "Material").join(", ")}`).join("\n");
        const extra = blocked.length > 6 ? `\n+ ${blocked.length - 6} more sample(s)` : "";
        const ok = window.confirm(`⚠ Materials not ready for Assembly.\n\n${lines}${extra}\n\nMove anyway?`);
        if (!ok) { setDraggingIds([]); return; }
      }
    }
    const changedIds = samples.filter((s) => idSet.has(s.id) && normalizeSampleWorkflowStage(s.stage) !== stage).map((s) => s.id);
    if (changedIds.length) {
      if (changedIds.length === 1) moveStage(changedIds[0], stage);
      else if (onBulkMove) onBulkMove(changedIds, stage);
      else changedIds.forEach((id) => moveStage(id, stage));
    }
    setSelectedIds((current) => current.filter((id) => !idSet.has(id)));
    setDraggingIds([]);
  };

  const bulkDelete = () => {
    const ids = selectedVisibleIds;
    if (ids.length && onBulkDelete) onBulkDelete(ids);
  };


  const readinessSummary = samples.reduce((acc, sample) => {
    const r = getMaterialReadiness(sample, materialPreps);
    if (r.status === "Ready") acc.ready += 1;
    if (r.status === "Partial" || r.status === "Blocked") acc.missing += 1;
    if (r.overdue > 0) acc.overdue += 1;
    if (r.status === "No Material Plan") acc.noPlan += 1;
    return acc;
  }, { ready: 0, missing: 0, overdue: 0, noPlan: 0 });

  return (
    <div>
      <div style={{ display: "flex", gap: 8, margin: "0 2px 10px", flexWrap: "wrap" }}>
        <div style={{ padding: "7px 11px", borderRadius: 11, background: "#EAF7EE", border: "1px solid #CDEBD6", color: "#247A45", fontSize: 11, fontWeight: 800 }}>✓ {readinessSummary.ready} Ready</div>
        <div style={{ padding: "7px 11px", borderRadius: 11, background: "#FFF4E5", border: "1px solid #F4D09D", color: "#B45B08", fontSize: 11, fontWeight: 800 }}>⚠ {readinessSummary.missing} Missing</div>
        <div style={{ padding: "7px 11px", borderRadius: 11, background: "#FFF0EC", border: "1px solid #F2C0B1", color: "#B83B19", fontSize: 11, fontWeight: 800 }}>🔴 {readinessSummary.overdue} Overdue</div>
        <div style={{ padding: "7px 11px", borderRadius: 11, background: "#F3F4F6", border: "1px solid #E0E2E5", color: "#73777D", fontSize: 11, fontWeight: 800 }}>— {readinessSummary.noPlan} No plan</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, margin: "0 2px 12px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11.5, fontWeight: 800, color: "#555" }}>Material readiness</span>
          {[['All','All'],['Ready','✓ Ready for Assembly'],['Missing','⚠ Missing Materials'],['Overdue','🔴 Overdue'],['No Plan','— No Material Plan']].map(([value,label]) => (
            <button key={value} type="button" onClick={() => setFilterMaterialReadiness(value)} style={{ border: `1px solid ${filterMaterialReadiness === value ? '#FFB28F' : '#E5E7EB'}`, background: filterMaterialReadiness === value ? '#FFF3EC' : '#fff', color: filterMaterialReadiness === value ? '#C94E13' : '#666', borderRadius: 999, padding: '6px 10px', fontSize: 11, fontWeight: 750, cursor: 'pointer' }}>{label}</button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11, color: "#777" }}>
          <span>Showing {readinessFilteredSamples.length} of {samples.length}</span>
        </div>
      </div>
      {selectedVisibleIds.length > 0 && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
          margin: "0 2px 12px", padding: "9px 12px", borderRadius: 13,
          background: "#FFF7F2", border: "1px solid #FFD8C5", boxShadow: "0 4px 14px rgba(255,85,0,.06)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 9, background: "#FF5500", color: "#fff", fontSize: 12, fontWeight: 800 }}>{selectedVisibleIds.length}</span>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: "#222" }}>samples selected</div>
              <div style={{ fontSize: 11, color: "#8A6A5A" }}>Drag any selected card to another column to move them together.</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, flexShrink: 0 }}>
            <button type="button" onClick={toggleSelectAll} style={{ border: "1px solid #E8D8D0", background: "#fff", color: "#5D504A", borderRadius: 10, padding: "7px 10px", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>
              {allVisibleSelected ? "Clear all" : "Select all"}
            </button>
            <button type="button" onClick={() => setSelectedIds([])} style={{ border: "1px solid #E8D8D0", background: "#fff", color: "#5D504A", borderRadius: 10, padding: "7px 10px", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>Clear</button>
            <button type="button" onClick={bulkDelete} style={{ display: "inline-flex", alignItems: "center", gap: 6, border: "1px solid #F1B6A0", background: "#FFF0EB", color: "#B63D0D", borderRadius: 10, padding: "7px 11px", fontSize: 11.5, fontWeight: 800, cursor: "pointer" }}>
              <Trash2 size={14} /> Delete selected
            </button>
          </div>
        </div>
      )}

      <div className="sample-kanban-board">
        {SAMPLE_STAGES.map((stage, stageIndex) => {
          const cards = readinessFilteredSamples.filter((s) => normalizeSampleWorkflowStage(s.stage) === stage);
          const isOver = dragOverStage === stage;
          const theme = SAMPLE_STAGE_THEME[stage] || SAMPLE_STAGE_THEME["Request Received"];
          const completion = stageIndex / (SAMPLE_STAGES.length - 1);
          return (
            <div
              key={stage}
              onDragOver={(e) => { e.preventDefault(); setDragOverStage(stage); e.dataTransfer.dropEffect = "move"; }}
              onDragLeave={() => setDragOverStage((cur) => (cur === stage ? null : cur))}
              onDrop={(e) => handleDrop(e, stage)}
              className="sample-kanban-column"
              style={{
                background: isOver ? "#FFF8F4" : "#FAFAFA",
                border: `1px solid ${isOver ? "#FFB88F" : "#E2E5E8"}`,
                borderRadius: 14, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden",
                boxShadow: isOver ? "0 0 0 2px rgba(255,85,0,.10), 0 10px 28px rgba(17,17,17,.07)" : "0 2px 8px rgba(17,17,17,.035)",
              }}
            >
              <div style={{ padding: "14px 14px 12px", borderBottom: "1px solid #E5E7EA", display: "flex", flexDirection: "column", gap: 10, background: "#FFFFFF" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
                    <span style={{ width: 30, height: 30, display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 9, background: "#F1F3F5", color: "#4D545C", fontSize: 10.5, fontWeight: 800, flexShrink: 0, border: "1px solid #E0E3E7" }}>{String(stageIndex + 1).padStart(2, "0")}</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 800, color: "#20252B", lineHeight: 1.2, whiteSpace: "nowrap" }}>{stage}</div>
                      <div style={{ fontSize: 10.5, color: "#7A8189", marginTop: 3 }}>Step {stageIndex + 1} · {Math.round(completion * 100)}% flow</div>
                    </div>
                  </div>
                  <span style={{ flexShrink: 0, minWidth: 28, height: 28, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#555C64", background: "#F4F5F6", borderRadius: 999, border: "1px solid #E0E3E7", fontWeight: 800 }}>{cards.length}</span>
                </div>
                <div style={{ height: 3, borderRadius: 99, background: "#E7E9EC", overflow: "hidden" }}>
                  <div style={{ width: `${Math.max(8, completion * 100)}%`, height: "100%", borderRadius: 99, background: completion > 0 ? "#FF5500" : "#C9CDD2" }} />
                </div>
              </div>

              <div className="sample-kanban-column-body" style={{ padding: 10, display: "flex", flexDirection: "column", gap: 10, overflowY: "auto", minHeight: 0, flex: 1 }}>
                {cards.map((s) => (
                  <KanbanCard
                    key={s.id}
                    sample={s}
                    customerName={customerName(s.customerId)}
                    onClick={() => onCardClick(s)}
                    onShowQR={() => onShowQR?.(s)}
                    selected={selectedIds.includes(s.id)}
                    onToggleSelect={() => toggleSelected(s.id)}
                    onDragStart={(e) => handleCardDragStart(e, s.id)}
                    onDragEnd={() => setDraggingIds([])}
                    isDragging={draggingIds.includes(s.id)}
                    onMoveStage={(newStage) => moveStage(s.id, newStage)}
                    stageTheme={theme}
                    materialReadiness={getMaterialReadiness(s, materialPreps)}
                  />
                ))}
                {cards.length === 0 && (
                  <div style={{ flex: 1, minHeight: 180, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", color: theme.head, opacity: .58, fontSize: 11.5, padding: 20 }}>
                    <div>
                      <div style={{ width: 38, height: 38, margin: "0 auto 10px", borderRadius: 12, border: `1px dashed ${theme.accent}`, display: "flex", alignItems: "center", justifyContent: "center", opacity: .8 }}><Boxes size={18} /></div>
                      <div style={{ fontWeight: 700 }}>No samples yet</div>
                      <div style={{ marginTop: 3 }}>Samples entering this stage will appear here.</div>
                    </div>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => onAddSample?.(stage)}
                style={{ margin: "0 10px 10px", padding: "10px", borderRadius: 10, border: "1px solid #DDE1E5", background: "#FFFFFF", color: "#50575F", fontWeight: 750, fontSize: 11.5, textAlign: "center", cursor: "pointer", fontFamily: FONT_BODY, width: "calc(100% - 20px)" }}
              >
                <span style={{ fontSize: 16, verticalAlign: -1, marginRight: 5 }}>＋</span> Add sample
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function KanbanCard({ sample: s, customerName, onClick, onShowQR, onToggleSelect, selected, onDragStart, onDragEnd, isDragging, onMoveStage, stageTheme, materialReadiness }) {
  const ot = sampleOnTime(s);
  const theme = stageTheme || SAMPLE_STAGE_THEME[normalizeSampleWorkflowStage(s.stage)] || SAMPLE_STAGE_THEME["Request Received"];
  const stage = normalizeSampleWorkflowStage(s.stage);
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className="sample-kanban-card"
      style={{
        position: "relative",
        background: selected ? "#FFF9F5" : "rgba(255,255,255,.94)",
        border: `1px solid ${selected ? theme.accent : "rgba(17,17,17,.075)"}`,
        borderRadius: 14,
        padding: 11,
        cursor: "grab",
        display: "flex",
        flexDirection: "column",
        gap: 9,
        boxShadow: selected ? `0 0 0 2px ${theme.soft}, 0 8px 22px rgba(255,85,0,.10)` : "0 2px 8px rgba(17,17,17,.035)",
        overflow: "hidden",
        opacity: isDragging ? 0.58 : 1,
      }}
    >
      <div style={{ position: "absolute", left: 0, top: 14, bottom: 14, width: 2, borderRadius: "0 3px 3px 0", background: selected ? "#FF5500" : "#E4E7EA" }} />
      <button
        type="button"
        aria-label={selected ? `Deselect ${s.name || s.id}` : `Select ${s.name || s.id}`}
        onClick={(e) => { e.stopPropagation(); onToggleSelect?.(); }}
        onMouseDown={(e) => e.stopPropagation()}
        draggable={false}
        style={{ position: "absolute", top: 9, left: 9, zIndex: 3, width: 24, height: 24, padding: 0, borderRadius: 7, border: `1px solid ${selected ? theme.accent : "#D9DDE2"}`, background: selected ? theme.accent : "rgba(255,255,255,.92)", color: selected ? "#fff" : "#8B9299", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 7px rgba(17,17,17,.08)" }}
      >
        {selected ? <CheckSquare size={14} /> : <Square size={14} />}
      </button>
      <div style={{ display: "flex", gap: 11, minWidth: 0 }}>
        <div onClick={onClick} style={{ position: "relative", width: 70, height: 70, borderRadius: 11, marginLeft: 26, background: theme.soft, flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: `1px solid ${theme.border}` }}>
          {s.image ? (
            <img src={s.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { e.target.style.display = "none"; }} />
          ) : (
            <ImageIcon size={19} color={theme.head} opacity={0.5} />
          )}
          {ot !== null && <div style={{ position: "absolute", bottom: 4, right: 4, width: 9, height: 9, borderRadius: "50%", background: ot ? COLORS.green : COLORS.red, border: "1.5px solid #fff" }} title={ot ? "On time" : "Late"} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }} onClick={onClick}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 6 }}>
            <div style={{ minWidth: 0 }}>
              <div className="kanban-card-title" style={{ color: COLORS.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", cursor: "pointer" }}>{s.name || "(unnamed sample)"}</div>
              <div
                className="kanban-meta kanban-erp-code"
                style={{ marginTop: 4, overflowWrap: "anywhere", wordBreak: "break-word", whiteSpace: "normal" }}
                title={s.erpNo || "No ERP code"}
              >
                {s.erpNo ? s.erpNo : "No ERP code"}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}><button type="button" className="kanban-icon-button" title="Show sample QR" aria-label="Show sample QR" onClick={(e) => { e.stopPropagation(); onShowQR?.(); }} onMouseDown={(e) => e.stopPropagation()} draggable={false}><QrCodeIcon size={14} /></button><button type="button" className="kanban-icon-button" title="Edit sample" aria-label="Edit sample" onClick={(e) => { e.stopPropagation(); onClick?.(); }} onMouseDown={(e) => e.stopPropagation()} draggable={false}><Pencil size={14} /></button></div>
          </div>
          <div className="kanban-meta" style={{ marginTop: 5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{customerName || "—"}</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <span className="kanban-pill" style={{ color: "#4F565E", background: "#F1F3F5", border: "1px solid #E1E4E8" }}>{s.productTypeName || s.productType || "Sample"}</span>
        <span className="kanban-pill" style={{ color: "#686D73", background: "#F3F4F6" }}>Qty {s.quantity ?? s.qty ?? 1}</span>
        {s.priority && <span className="kanban-pill" style={{ color: s.priority === "Urgent" ? "#A83200" : "#686D73", background: s.priority === "Urgent" ? "#FCE2D7" : "#F3F4F6" }}>{s.priority}</span>}
      </div>

      {materialReadiness && materialReadiness.total > 0 && (() => {
        const tone = materialReadinessTone(materialReadiness);
        return (
          <div style={{ padding: "7px 8px", borderRadius: 10, background: tone.bg, border: `1px solid ${tone.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 5 }}>
              <span style={{ fontSize: 10.5, fontWeight: 800, color: tone.color }}>Material readiness</span>
              <span style={{ fontSize: 10.5, fontWeight: 800, color: tone.color }}>{materialReadiness.done}/{materialReadiness.total}</span>
            </div>
            <div style={{ height: 4, background: "rgba(255,255,255,.8)", borderRadius: 99, overflow: "hidden", marginBottom: 5 }}>
              <div style={{ width: `${materialReadiness.percent}%`, height: "100%", background: tone.color, borderRadius: 99 }} />
            </div>
            <div style={{ fontSize: 10.5, fontWeight: 750, color: tone.color }}>
              {materialReadiness.status === "Ready" ? "✓ Ready for Assembly" : `⚠ Missing ${materialReadiness.missing.length} material${materialReadiness.missing.length === 1 ? "" : "s"}`}
            </div>
            {materialReadiness.missing.length > 0 && (
              <div style={{ marginTop: 3, fontSize: 10, color: "#777", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={materialReadiness.missing.map((m) => m.materialName || "Material").join(", ")}>
                {materialReadiness.missing.slice(0, 2).map((m) => m.materialName || "Material").join(", ")}{materialReadiness.missing.length > 2 ? ` +${materialReadiness.missing.length - 2}` : ""}
              </div>
            )}
          </div>
        );
      })()}

      <div style={{ paddingTop: 1, display: "grid", gap: 4 }}>
        {s.manufacturingOrderNo && <div className="kanban-meta" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}><span style={{ fontWeight: 650, color: "#555" }}>MO</span> · {s.manufacturingOrderNo}</div>}
        <div className="kanban-meta" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}><span style={{ fontWeight: 650, color: "#555" }}>Next</span> · {s.nextAction || "Follow up / update"}</div>
        {s.targetDate && <div className="kanban-meta"><span style={{ fontWeight: 650, color: "#555" }}>Target</span> · {s.targetDate}</div>}
      </div>

      <select
        value={stage}
        onChange={(e) => onMoveStage(e.target.value)}
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", fontSize: 11.5, padding: "8px 10px", borderRadius: 10, border: "1px solid #E1E4E8", background: "#F8F9FA", color: "#3F464D", fontWeight: 700, fontFamily: FONT_BODY, cursor: "pointer" }}
      >
        {SAMPLE_STAGES.map((st) => <option key={st} value={st}>{st}</option>)}
      </select>
    </div>
  );
}


function samplePublicUrl(sampleId) {
  return `${window.location.origin}${window.location.pathname}?sample=${encodeURIComponent(sampleId)}`;
}

function PublicSampleLoading() {
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#F6F7F9", fontFamily: FONT_BODY, color: COLORS.inkSoft, padding: 24 }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontWeight: 800, color: COLORS.wood, marginBottom: 6 }}>TÂN HÒA ERP</div>
        Loading sample information…
      </div>
    </div>
  );
}

function PublicSampleError({ message }) {
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#F6F7F9", fontFamily: FONT_BODY, padding: 24 }}>
      <div style={{ maxWidth: 460, width: "100%", background: "#fff", border: `1px solid ${COLORS.line}`, borderRadius: 18, padding: 26, textAlign: "center", boxShadow: "0 8px 30px rgba(17,17,17,.06)" }}>
        <div style={{ fontSize: 12, color: COLORS.wood, fontWeight: 800, letterSpacing: 1.1 }}>TÂN HÒA ERP</div>
        <h1 style={{ fontSize: 21, margin: "8px 0" }}>Sample unavailable</h1>
        <div style={{ color: COLORS.inkSoft, lineHeight: 1.55 }}>{message}</div>
      </div>
    </div>
  );
}

function SampleQuickViewPublic({ data }) {
  const sample = data || {};
  const materials = Array.isArray(sample.materials) ? sample.materials : [];
  const done = materials.filter((m) => String(m.status || "").toLowerCase() === "done").length;
  const total = materials.length;
  const percent = total ? Math.round((done / total) * 100) : 0;
  const missing = materials.filter((m) => String(m.status || "").toLowerCase() !== "done");
  const stage = sample.stage || "Request Received";
  const stageIndex = Math.max(0, SAMPLE_STAGES.indexOf(stage));
  const url = samplePublicUrl(sample.id);
  const [qrDataUrl, setQrDataUrl] = useState("");
  useEffect(() => {
    QRCode.toDataURL(url, { width: 180, margin: 1, errorCorrectionLevel: "M" }).then(setQrDataUrl).catch(() => {});
  }, [url]);

  const readinessTone = percent === 100 && total > 0
    ? { bg: "#EAF7EE", border: "#BFE5CB", text: "#247A45" }
    : total > 0 ? { bg: "#FFF4E5", border: "#F4D09D", text: "#B45B08" }
    : { bg: "#F3F4F6", border: "#E0E2E5", text: "#73777D" };

  return (
    <div style={{ minHeight: "100vh", background: "#F6F7F9", fontFamily: FONT_BODY, color: COLORS.ink, padding: "18px 14px 44px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: COLORS.wood, fontWeight: 800, letterSpacing: 1.1 }}>TÂN HÒA ERP</div>
          <div style={{ fontSize: 11.5, color: COLORS.inkSoft, marginTop: 2 }}>Digital Sample Passport</div>
        </div>

        <div style={{ background: "#fff", border: `1px solid ${COLORS.line}`, borderRadius: 20, overflow: "hidden", boxShadow: "0 10px 35px rgba(17,17,17,.07)" }}>
          {sample.image ? (
            <img src={sample.image} alt={sample.name || sample.id} style={{ width: "100%", height: "min(42vw, 340px)", minHeight: 210, objectFit: "contain", background: "#F0F1EC" }} />
          ) : (
            <div style={{ height: 240, display: "grid", placeItems: "center", background: "#F0F1EC", color: COLORS.inkSoft }}><ImageIcon size={40}/></div>
          )}

          <div style={{ padding: "22px clamp(18px, 4vw, 30px) 28px" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: COLORS.wood, background: COLORS.amberSoft, padding: "5px 8px", borderRadius: 7 }}>{sample.id}</span>
              {sample.currentRevision && <span style={{ fontSize: 11.5, color: COLORS.inkSoft, background: COLORS.bg, padding: "5px 8px", borderRadius: 7 }}>Rev. {sample.currentRevision}</span>}
            </div>
            <h1 style={{ fontSize: "clamp(25px, 6vw, 34px)", lineHeight: 1.1, margin: "9px 0 5px", letterSpacing: "-.7px" }}>{sample.name || "Unnamed sample"}</h1>
            <div style={{ color: COLORS.inkSoft, fontSize: 13.5 }}>{sample.customer || "—"} · {sample.productType || "Sample"}</div>

            <div style={{ marginTop: 22, padding: 16, borderRadius: 16, background: "#FBFBFC", border: `1px solid ${COLORS.line}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <div><div style={{ fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: .7, fontWeight: 800 }}>Production status</div><div style={{ fontSize: 18, fontWeight: 850, marginTop: 3 }}>{stage}</div></div>
                <div style={{ minWidth: 54, textAlign: "right", fontSize: 12, color: COLORS.inkSoft }}>Step<br/><b style={{ fontSize: 15, color: COLORS.ink }}>{stageIndex + 1}/{SAMPLE_STAGES.length}</b></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${SAMPLE_STAGES.length}, minmax(24px, 1fr))`, gap: 5 }}>
                {SAMPLE_STAGES.map((st, i) => (
                  <div key={st} title={st} style={{ height: 7, borderRadius: 99, background: i <= stageIndex ? COLORS.wood : "#E8EAED", opacity: i <= stageIndex ? 1 : .9 }} />
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${SAMPLE_STAGES.length}, minmax(24px, 1fr))`, gap: 5, marginTop: 6 }}>
                {SAMPLE_STAGES.map((st, i) => <div key={st} style={{ fontSize: 8.5, lineHeight: 1.1, color: i === stageIndex ? COLORS.woodDark : COLORS.inkSoft, fontWeight: i === stageIndex ? 800 : 500, textAlign: "center" }}>{i === stageIndex ? st : i === 0 || i === SAMPLE_STAGES.length - 1 ? st.split(" ")[0] : ""}</div>)}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 10, marginTop: 12 }}>
              <PublicStat label="ERP No." value={sample.erpNo}/>
              <PublicStat label="Target date" value={sample.targetDate}/>
              <PublicStat label="Next action" value={sample.nextAction}/>
              <PublicStat label="Product type" value={sample.productType}/>
            </div>

            <div style={{ marginTop: 18, padding: 16, borderRadius: 16, background: readinessTone.bg, border: `1px solid ${readinessTone.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <div><div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: .7, fontWeight: 800, color: readinessTone.text }}>Material readiness</div><div style={{ fontSize: 19, fontWeight: 850, marginTop: 3, color: readinessTone.text }}>{total ? `${percent}% ready` : "No material plan"}</div></div>
                <div style={{ fontSize: 15, fontWeight: 850, color: readinessTone.text }}>{done}/{total}</div>
              </div>
              <div style={{ height: 8, background: "rgba(255,255,255,.8)", borderRadius: 99, marginTop: 11, overflow: "hidden" }}><div style={{ width: `${percent}%`, height: "100%", background: readinessTone.text, borderRadius: 99 }}/></div>
              {materials.length > 0 && (
                <div style={{ marginTop: 12, display: "grid", gap: 7 }}>
                  {materials.map((m, idx) => {
                    const isDone = String(m.status || "").toLowerCase() === "done";
                    return <div key={`${m.name || "material"}-${idx}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "8px 10px", background: "rgba(255,255,255,.62)", borderRadius: 9 }}><div style={{ minWidth: 0, fontSize: 12.5, fontWeight: 650, overflowWrap: "anywhere" }}>{m.name || "Material"}{m.qty ? <span style={{ color: COLORS.inkSoft, fontWeight: 500 }}> · Qty {m.qty}</span> : null}</div><span style={{ flexShrink: 0, fontSize: 10.5, fontWeight: 800, color: isDone ? "#247A45" : "#B45B08" }}>{isDone ? "DONE" : (m.status || "WAITING").toUpperCase()}</span></div>;
                  })}
                </div>
              )}
              {missing.length > 0 && <div style={{ marginTop: 10, fontSize: 12, color: readinessTone.text }}>Pending: {missing.map((m) => m.name || "Material").join(", ")}</div>}
            </div>

            <div style={{ marginTop: 20 }}>
              <PassportSectionTitle>Product specifications</PassportSectionTitle>
              <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 8 }}>
                <PassportField label="Main material" value={sample.mainMaterial}/>
                <PassportField label="Finish / color" value={sample.finish}/>
                <PassportField label="Wood treatment" value={sample.woodSurfaceTreatment}/>
                <PassportField label="Fabric" value={sample.fabric}/>
                <PassportField label="Rope" value={sample.rope}/>
                <PassportField label="Rope color" value={sample.ropeColor}/>
                <PassportField label="Metal" value={sample.metal}/>
                <PassportField label="Metal color" value={sample.metalColor}/>
                <PassportField label="Cemboard color" value={sample.cemboardColor}/>
                <PassportField label="Hardware" value={sample.hardware}/>
                <PassportField label="Construction" value={sample.construction}/>
                <PassportField label="Dimensions" value={sample.dimensions}/>
              </div>
            </div>

            <div style={{ marginTop: 20, padding: 16, borderRadius: 16, background: COLORS.bg, border: `1px solid ${COLORS.line}` }}>
              <PassportSectionTitle>Sample identification</PassportSectionTitle>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                {sample.manufacturingOrderNo && <PassportChip label="MO" value={sample.manufacturingOrderNo}/>} 
                {sample.idpNo && <PassportChip label="IDP" value={sample.idpNo}/>} 
                {sample.idcNo && <PassportChip label="IDC" value={sample.idcNo}/>} 
                {sample.currentRevision && <PassportChip label="Revision" value={sample.currentRevision}/>} 
                {!sample.manufacturingOrderNo && !sample.idpNo && !sample.idcNo && !sample.currentRevision && <span style={{ fontSize: 12.5, color: COLORS.inkSoft }}>No additional identifiers.</span>}
              </div>
            </div>

            <div style={{ marginTop: 20, paddingTop: 20, borderTop: `1px solid ${COLORS.line}`, display: "flex", alignItems: "center", gap: 18 }}>
              <div style={{ flex: 1, minWidth: 0 }}><PassportSectionTitle>Permanent QR</PassportSectionTitle><div style={{ fontSize: 12, color: COLORS.inkSoft, lineHeight: 1.5, marginTop: 5 }}>This QR stays the same while the sample information is updated in the ERP.</div><div style={{ fontSize: 10.5, color: COLORS.inkSoft, marginTop: 7, overflowWrap: "anywhere" }}>{url}</div></div>
              {qrDataUrl && <img src={qrDataUrl} alt={`QR for ${sample.id}`} style={{ width: 104, height: 104, flexShrink: 0, imageRendering: "pixelated" }}/>} 
            </div>
          </div>
        </div>
        <div style={{ textAlign: "center", marginTop: 14, fontSize: 10.5, color: "#8A8F96" }}>Tân Hòa Outdoor Furniture · Digital Sample Passport · Read-only</div>
      </div>
    </div>
  );
}

function PassportSectionTitle({ children }) {
  return <div style={{ fontSize: 12, fontWeight: 850, color: COLORS.wood, textTransform: "uppercase", letterSpacing: .75 }}>{children}</div>;
}

function PassportField({ label, value }) {
  return <div style={{ padding: "10px 11px", borderRadius: 10, background: "#FBFBFC", border: `1px solid ${COLORS.line}`, minWidth: 0 }}><div style={{ fontSize: 10.5, color: COLORS.inkSoft }}>{label}</div><div style={{ marginTop: 3, fontSize: 12.5, fontWeight: 700, overflowWrap: "anywhere" }}>{value || "—"}</div></div>;
}

function PassportChip({ label, value }) {
  return <div style={{ padding: "7px 9px", borderRadius: 9, background: "#fff", border: `1px solid ${COLORS.line}`, fontSize: 11.5 }}><span style={{ color: COLORS.inkSoft }}>{label}</span><span style={{ fontWeight: 800, marginLeft: 6, overflowWrap: "anywhere" }}>{value}</span></div>;
}

function PublicStat({ label, value }) {
  return <div style={{ background: COLORS.bg, borderRadius: 12, padding: 12 }}><div style={{ fontSize: 11, color: COLORS.inkSoft }}>{label}</div><div style={{ fontWeight: 800, marginTop: 4, overflowWrap: "anywhere" }}>{value || "—"}</div></div>;
}

function SampleQRModal({ sample, customerName, onClose }) {
  const canvasRef = useRef(null);
  const [dataUrl, setDataUrl] = useState("");
  const url = samplePublicUrl(sample.id);

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(url, { width: 300, margin: 2, errorCorrectionLevel: "M", color: { dark: "#111111", light: "#FFFFFF" } })
      .then((value) => { if (active) setDataUrl(value); })
      .catch((err) => console.error("QR generation failed", err));
    return () => { active = false; };
  }, [url]);

  const download = () => {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${sample.id}-QR.png`;
    a.click();
  };
  const print = () => {
    if (!dataUrl) return;
    const w = window.open("", "_blank", "width=520,height=700");
    if (!w) return;
    w.document.write(`<html><head><title>${sample.id} QR</title></head><body style="font-family:Arial,sans-serif;text-align:center;padding:30px"><div style="font-size:18px;font-weight:700">Tân Hòa — ${sample.name || sample.id}</div><div style="color:#666;margin:8px 0 18px">${sample.erpNo || sample.id}</div><img src="${dataUrl}" style="width:300px;height:300px"/><div style="margin-top:14px;font-weight:700">Scan for latest sample information</div></body></html>`);
    w.document.close(); w.focus(); setTimeout(() => w.print(), 150);
  };
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(17,17,17,.48)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "min(460px, 100%)", background: "#fff", borderRadius: 20, border: `1px solid ${COLORS.line}`, boxShadow: "0 24px 70px rgba(17,17,17,.22)", padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}><div><div style={{ fontSize: 18, fontWeight: 800 }}>Sample QR Code</div><div style={{ marginTop: 4, fontSize: 12.5, color: COLORS.inkSoft }}>Permanent QR for the latest sample information.</div></div><button type="button" onClick={onClose} style={{ border: "none", background: "#F4F5F6", borderRadius: 10, width: 34, height: 34, cursor: "pointer" }}><X size={16}/></button></div>
        <div style={{ margin: "20px auto 16px", width: 320, maxWidth: "100%", padding: 10, borderRadius: 16, background: "#fff", border: `1px solid ${COLORS.line}`, display: "flex", justifyContent: "center" }}>{dataUrl ? <img ref={canvasRef} src={dataUrl} alt={`QR for ${sample.id}`} style={{ width: 300, height: 300, imageRendering: "pixelated" }} /> : <div style={{ width: 300, height: 300, display: "grid", placeItems: "center", color: COLORS.inkSoft }}>Generating QR…</div>}</div>
        <div style={{ textAlign: "center" }}><div style={{ fontWeight: 800 }}>{sample.name || "Unnamed sample"}</div><div style={{ fontSize: 12, color: COLORS.inkSoft, marginTop: 3 }}>{sample.id} · {sample.erpNo || "No ERP code"} · {customerName || "—"}</div></div>
        <div style={{ marginTop: 12, padding: 10, background: COLORS.bg, borderRadius: 10, fontSize: 11.5, color: COLORS.inkSoft, overflowWrap: "anywhere" }}>{url}</div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}><Button small variant="subtle" onClick={download} disabled={!dataUrl}><Download size={13}/> Download</Button><Button small variant="subtle" onClick={print} disabled={!dataUrl}>Print</Button><Button small onClick={onClose}>Close</Button></div>
      </div>
    </div>
  );
}


function SampleQRInline({ sample, compact = false }) {
  const [dataUrl, setDataUrl] = useState("");
  const url = samplePublicUrl(sample.id);
  useEffect(() => { QRCode.toDataURL(url, { width: compact ? 120 : 220, margin: 1, errorCorrectionLevel: "M" }).then(setDataUrl).catch(() => {}); }, [url, compact]);
  const download = () => { if (!dataUrl) return; const a = document.createElement("a"); a.href = dataUrl; a.download = `${sample.id}-QR.png`; a.click(); };
  return <div style={{ padding: compact ? 12 : 16, borderRadius: 14, border: `1px solid ${COLORS.line}`, background: "#fff", display: "flex", alignItems: "center", gap: 14 }}>
    <div style={{ width: compact ? 126 : 230, height: compact ? 126 : 230, flexShrink: 0, display: "grid", placeItems: "center", background: "#fff", borderRadius: 10 }}>{dataUrl ? <img src={dataUrl} alt={`QR for ${sample.id}`} style={{ width: compact ? 120 : 220, height: compact ? 120 : 220, imageRendering: "pixelated" }} /> : <span style={{ fontSize: 11, color: COLORS.inkSoft }}>Generating…</span>}</div>
    <div style={{ minWidth: 0 }}><div style={{ fontSize: 12, color: COLORS.wood, fontWeight: 800, letterSpacing: .7, textTransform: "uppercase" }}>Sample QR</div><div style={{ fontWeight: 800, marginTop: 4 }}>{sample.id}</div><div style={{ fontSize: 12, color: COLORS.inkSoft, marginTop: 4 }}>Scan to view the latest sample information.</div><div style={{ display: "flex", gap: 7, marginTop: 12 }}><Button small variant="subtle" onClick={download} disabled={!dataUrl}><Download size={13}/> Download</Button><Button small variant="subtle" onClick={() => window.print()}>Print</Button></div></div>
  </div>;
}

function SampleQuickView({ sample, customerName, productTypeName, materialLists = {}, materialPreps }) {
  const readiness = getMaterialReadiness(sample, materialPreps);
  const missing = readiness.missing || [];
  const [qrDataUrl, setQrDataUrl] = useState("");
  const url = samplePublicUrl(sample.id);
  useEffect(() => { QRCode.toDataURL(url, { width: 160, margin: 1, errorCorrectionLevel: "M" }).then(setQrDataUrl).catch(() => {}); }, [url]);
  const back = () => { window.location.href = window.location.pathname; };
  return (
    <div style={{ minHeight: "100vh", background: "#F6F7F9", fontFamily: FONT_BODY, color: COLORS.ink, padding: "18px 14px 40px" }}>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}><div><div style={{ fontSize: 12, color: COLORS.wood, fontWeight: 800, letterSpacing: 1.1 }}>TÂN HÒA ERP</div><div style={{ fontSize: 11.5, color: COLORS.inkSoft, marginTop: 2 }}>Sample Quick View</div></div><button type="button" onClick={back} style={{ border: `1px solid ${COLORS.line}`, background: "#fff", borderRadius: 10, padding: "8px 11px", cursor: "pointer" }}>Back to ERP</button></div>
        <div style={{ background: "#fff", border: `1px solid ${COLORS.line}`, borderRadius: 18, overflow: "hidden", boxShadow: "0 8px 30px rgba(17,17,17,.06)" }}>
          {sample.image ? <img src={sample.image} alt={sample.name} style={{ width: "100%", maxHeight: 300, objectFit: "contain", background: "#F0F1EC" }} /> : <div style={{ height: 180, display: "grid", placeItems: "center", background: "#F0F1EC", color: COLORS.inkSoft }}><ImageIcon size={34}/></div>}
          <div style={{ padding: 20 }}>
            <div style={{ fontSize: 12, color: COLORS.inkSoft }}>{sample.id}</div><h1 style={{ fontSize: 24, margin: "5px 0 4px", letterSpacing: "-.5px" }}>{sample.name || "Unnamed sample"}</h1><div style={{ color: COLORS.inkSoft, fontSize: 13 }}>{customerName || "—"} · {productTypeName || "Sample"}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 18 }}><div style={{ background: COLORS.bg, borderRadius: 12, padding: 12 }}><div style={{ fontSize: 11, color: COLORS.inkSoft }}>ERP No.</div><div style={{ fontWeight: 800, marginTop: 4, overflowWrap: "anywhere" }}>{sample.erpNo || "—"}</div></div><div style={{ background: COLORS.bg, borderRadius: 12, padding: 12 }}><div style={{ fontSize: 11, color: COLORS.inkSoft }}>Current stage</div><div style={{ fontWeight: 800, marginTop: 4 }}>{normalizeSampleWorkflowStage(sample.stage)}</div></div></div>
            <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}><div style={{ background: COLORS.bg, borderRadius: 12, padding: 12 }}><div style={{ fontSize: 11, color: COLORS.inkSoft }}>Target date</div><div style={{ fontWeight: 800, marginTop: 4 }}>{sample.targetDate || "—"}</div></div><div style={{ background: COLORS.bg, borderRadius: 12, padding: 12 }}><div style={{ fontSize: 11, color: COLORS.inkSoft }}>Next action</div><div style={{ fontWeight: 800, marginTop: 4 }}>{sample.nextAction || "—"}</div></div></div>
            <div style={{ marginTop: 18, padding: 14, borderRadius: 14, background: readiness.status === "Ready" ? "#EAF7EE" : readiness.status === "Blocked" ? "#FFF0EC" : "#FFF4E5", border: `1px solid ${readiness.status === "Ready" ? "#BFE5CB" : readiness.status === "Blocked" ? "#F2C0B1" : "#F4D09D"}` }}><div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800 }}><span>Material readiness</span><span>{readiness.done}/{readiness.total}</span></div><div style={{ height: 7, background: "rgba(255,255,255,.75)", borderRadius: 99, marginTop: 8, overflow: "hidden" }}><div style={{ width: `${readiness.percent}%`, height: "100%", background: readiness.status === "Ready" ? COLORS.green : COLORS.wood, borderRadius: 99 }} /></div>{missing.length > 0 && <div style={{ marginTop: 9, fontSize: 12.5 }}>Missing: {missing.map((m) => m.materialName || "Material").join(", ")}</div>}</div>
            <div style={{ marginTop: 18 }}><div style={{ fontSize: 12, fontWeight: 800, color: COLORS.wood, textTransform: "uppercase", letterSpacing: .7 }}>Key specifications</div><div style={{ marginTop: 6 }}><DetailRow label="Main material" value={lookupName(materialLists.mainMaterials || [], sample.mainMaterialId)}/><DetailRow label="Finish / color" value={lookupName(materialLists.finishes || [], sample.finishesColorId)}/><DetailRow label="Rope" value={lookupName(materialLists.ropeTypes || [], sample.ropeTypeId)}/><DetailRow label="Construction" value={sample.construction || ""}/><DetailRow label="Dimensions" value={[sample.width,sample.depth,sample.height].some(v=>v!==""&&v!=null) ? `${sample.width||"—"} × ${sample.depth||"—"} × ${sample.height||"—"} mm` : ""}/></div></div>
            <div style={{ marginTop: 18, paddingTop: 18, borderTop: `1px solid ${COLORS.line}`, display: "flex", alignItems: "center", gap: 16 }}><div style={{ flex: 1 }}><div style={{ fontWeight: 800 }}>Scan QR anytime</div><div style={{ fontSize: 12, color: COLORS.inkSoft, marginTop: 4 }}>This QR always opens the latest ERP information for this sample.</div></div>{qrDataUrl && <img src={qrDataUrl} alt="Sample QR" style={{ width: 110, height: 110 }} />}</div>
          </div>
        </div>
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

function SampleDetail({ sample: s, customerName, productTypeName, materialLists, materialPreps, saveMaterialPreps, allMaterialPreps, relatedTasks, allTasks, saveTasks, onEdit, onClose, onDelete, onSaveSample, onExport, onShowQR }) {
  const { mainMaterials = [], finishes = [], woodSurface = [], fabricTypes = [], fabricColors = [], ropeTypes = [], ropeColors = [], cemboardColors = [] } = materialLists;
  const dims = [s.width, s.depth, s.height].filter((v) => v !== "" && v != null).length ? `${s.width || "—"} × ${s.depth || "—"} × ${s.height || "—"} mm` : "";
  const ot = sampleOnTime(s);
  const [newNote, setNewNote] = useState("");
  const [newRevision, setNewRevision] = useState({ date: todayStr(), changeReason: "", photo: "", note: "" });
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskDeadline, setNewTaskDeadline] = useState("");
  const [proofUploading, setProofUploading] = useState(null);

  // Individual material status must come from sample_components/materialPreps.
  // requiredComponents can be stale local snapshot data, so overlay it with the
  // latest normalized material rows instead of preferring the snapshot.
  const snapshotComponents = s.requiredComponents || [];
  const liveComponents = materialPreps.map((p) => {
    const old = snapshotComponents.find((c) => c.id === p.id) || {};
    return {
      ...old,
      id: p.id,
      name: p.materialName || old.name || p.displayName || "Material",
      qty: p.qty ?? old.qty ?? 1,
      targetDate: p.dueDate || old.targetDate || "",
      status: p.status || old.status || "Waiting",
      photo: p.photo || old.photo || "",
    };
  });
  const components = liveComponents.length ? liveComponents : snapshotComponents;

  const saveComponent = (component, patch) => {
    const next = components.map((c) => c.id === component.id ? { ...c, ...patch } : c);
    onSaveSample({ ...s, requiredComponents: next });
    const old = allMaterialPreps.find((p) => p.id === component.id);
    if (old) saveMaterialPreps(allMaterialPreps.map((p) => p.id === component.id ? { ...p, ...patch, materialName: component.name, dueDate: patch.targetDate ?? component.targetDate, qty: patch.qty ?? component.qty, status: patch.status ?? component.status, photo: patch.photo ?? component.photo } : p));
    else {
      const id = component.id || nextId(allMaterialPreps, "SMP", 4);
      saveMaterialPreps([...allMaterialPreps.filter((p) => p.id !== id), { id, sampleId: s.id, materialName: component.name, qty: component.qty || 1, startDate: "", dueDate: component.targetDate || "", status: component.status || "Waiting", photo: component.photo || "" }]);
    }
  };

  const deleteComponent = (component) => {
    if (!component?.id) {
      const next = components.filter((c) => c !== component);
      onSaveSample({ ...s, requiredComponents: next });
      return;
    }
    if (!window.confirm(`Delete material "${component.name || "Material"}" from this sample?`)) return;
    const next = components.filter((c) => c.id !== component.id);
    onSaveSample({ ...s, requiredComponents: next });
    saveMaterialPreps(allMaterialPreps.filter((p) => p.id !== component.id));
  };

  const uploadProof = async (component, e) => {
    if (component.status !== "Done") return;
    const file = e.target.files?.[0]; e.target.value = "";
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) { alert("Please choose an image smaller than 15 MB."); return; }
    setProofUploading(component.id);
    try {
      const publicUrl = await uploadStorageImage(file, `material-prep/${s.id}`, `proof-${component.id || "component"}`);
      saveComponent(component, { photo: publicUrl });
    }
    catch (err) { alert(err?.message || "Could not upload proof photo."); }
    finally { setProofUploading(null); }
  };

  const addNote = () => {
    const text = newNote.trim(); if (!text) return;
    const history = [{ id: "note" + Date.now(), text, createdAt: new Date().toISOString() }, ...(s.noteHistory || [])];
    onSaveSample({ ...s, noteHistory: history, notes: text }); setNewNote("");
  };
  const addRelatedTask = () => { if (!newTaskName.trim()) return; const id = nextId(allTasks, "TSK", 4); saveTasks([...allTasks, { ...BLANK_TASK, id, name: newTaskName.trim(), deadline: newTaskDeadline, sampleId: s.id, type: "Sample" }]); setNewTaskName(""); setNewTaskDeadline(""); };
  const cycleTaskStatus = (task) => { const idx = TASK_STATUSES.indexOf(task.status); saveTasks(allTasks.map((t) => t.id === task.id ? { ...t, status: TASK_STATUSES[(idx + 1) % TASK_STATUSES.length] } : t)); };
  const addRevision = () => { if (!newRevision.changeReason.trim()) return; onSaveSample({ ...s, revisions: [{ ...newRevision, id: "rev" + Date.now() }, ...(s.revisions || [])] }); setNewRevision({ date: todayStr(), changeReason: "", photo: "", note: "" }); };

  return (
    <Panel title={`${s.id} — ${s.name}`} action={<div style={{ display: "flex", gap: 8, alignItems: "center" }}>{ot !== null && (ot ? <Badge tone="green">On time</Badge> : <Badge tone="red">Late</Badge>)}<Button small variant="subtle" onClick={onEdit}>Edit</Button><Button small variant="subtle" onClick={() => onShowQR?.(s.id)}><QrCodeIcon size={13} /> QR</Button><Button small variant="subtle" onClick={() => onExport(s.id)}><Download size={13} /> Export</Button><Button small variant="danger" onClick={onDelete}>Delete</Button><Button small variant="ghost" onClick={onClose}><X size={14} /> Close</Button></div>}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24 }}>
        <div>
          <div style={{ width: "100%", aspectRatio: "1 / 1", borderRadius: 10, border: `1px solid ${COLORS.line}`, marginBottom: 14, background: COLORS.bg, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {s.image ? <img src={s.image} alt={s.name} style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} onError={(e) => { e.currentTarget.style.display = "none"; }} /> : <div style={{ color: COLORS.inkSoft, fontSize: 12.5, display: "flex", gap: 6 }}><ImageIcon size={16} /> No photo yet</div>}
          </div>
          <SectionHeading>Basic info</SectionHeading>
          <DetailRow label="Customer" value={customerName(s.customerId)} /><DetailRow label="Product type" value={productTypeName(s.productTypeId)} /><DetailRow label="Qty" value={s.qty} /><DetailRow label="ERP No." value={s.erpNo} /><DetailRow label="Manufacturing Order No." value={s.manufacturingOrderNo} /><DetailRow label="IDP No." value={s.idpNo} /><DetailRow label="IDC No." value={s.idcNo} /><DetailRow label="Dimensions (W×D×H)" value={dims} /><DetailRow label="Arm height" value={s.armHeight} /><DetailRow label="Seat height" value={s.seatHeight} />
        </div>
        <div>
          <SectionHeading>Materials & finishes</SectionHeading>
          <DetailRow label="Main material" value={lookupName(mainMaterials, s.mainMaterialId)} /><DetailRow label="Finish / color" value={lookupName(finishes, s.finishesColorId)} /><DetailRow label="Wood surface" value={lookupName(woodSurface, s.woodSurfaceTreatmentId)} /><DetailRow label="Fabric type" value={lookupName(fabricTypes, s.fabricTypeId)} /><DetailRow label="Fabric color" value={lookupName(fabricColors, s.fabricColorId)} /><DetailRow label="Rope type" value={lookupName(ropeTypes, s.ropeTypeId)} /><DetailRow label="Rope diameter" value={s.ropeDiameter} /><DetailRow label="Rope color" value={lookupName(ropeColors, s.ropeColorId)} /><DetailRow label="Metal name" value={s.metalName} /><DetailRow label="Metal color" value={s.metalColor} /><DetailRow label="Cemboard color" value={lookupName(cemboardColors, s.cemboardColorId)} /><DetailRow label="Hardware" value={s.hardware} /><DetailRow label="Construction" value={s.construction} /><DetailRow label="Revision" value={s.currentRevision} />
          <div style={{ marginTop: 16 }}><SampleQRInline sample={s} compact /></div>
        </div>
        <div>
          <SectionHeading>Production & stage</SectionHeading>
          <DetailRow label="Stage group" value={s.stageGroup} /><DetailRow label="Current stage" value={s.stage} /><DetailRow label="Stage status" value={s.stageStatus} /><DetailRow label="Waiting for" value={s.waitingFor} /><DetailRow label="Next action" value={s.nextAction} /><DetailRow label="Priority" value={s.priority} /><DetailRow label="Stage start" value={s.stageStartDate} /><DetailRow label="Target date" value={s.targetDate} /><DetailRow label="Completed date" value={s.completedDate} /><DetailRow label="Overall status" value={s.overallStatus} /><DetailRow label="Linked order" value={s.orderId} />
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <SectionHeading>Material progress</SectionHeading>
        <div style={{ fontSize: 12.5, color: COLORS.inkSoft, marginTop: 6, marginBottom: 10 }}>Only components selected for this sample are shown. Photo proof is available only after the status is Done.</div>
        {components.length === 0 ? <div style={{ color: COLORS.inkSoft, fontSize: 13.5, background: COLORS.bg, padding: 12, borderRadius: 8 }}>No required components selected. Edit the Sample and tick the components needed.</div> : (
          <div style={{ overflowX: "auto" }}><div style={{ minWidth: 760, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.25fr 80px 150px 150px minmax(170px,1.2fr) 44px", gap: 8, fontSize: 11.5, color: COLORS.inkSoft, padding: "0 10px" }}><div>Component</div><div>Qty</div><div>Target date</div><div>Status</div><div>Photo proof</div><div></div></div>
            {components.map((c) => (
              <div key={c.id || c.name} style={{ display: "grid", gridTemplateColumns: "1.25fr 80px 150px 150px minmax(170px,1.2fr) 44px", gap: 8, alignItems: "center", background: COLORS.bg, padding: "8px 10px", borderRadius: 8 }}>
                <div style={{ fontWeight: 600 }}>{c.name}</div>
                <Input type="number" min="1" value={c.qty || 1} onChange={(e) => saveComponent(c, { qty: e.target.value })} style={{ fontSize: 12.5, padding: "5px 8px" }} />
                <Input type="date" value={c.targetDate || ""} onChange={(e) => saveComponent(c, { targetDate: e.target.value })} style={{ fontSize: 12.5, padding: "5px 8px" }} />
                <Select value={c.status || "Waiting"} onChange={(e) => saveComponent(c, { status: e.target.value, ...(e.target.value !== "Done" ? { photo: "" } : {}) })} style={{ fontSize: 12.5, padding: "5px 8px" }}>{PREP_STATUS_OPTIONS.map((st) => <option key={st} value={st}>{st}</option>)}</Select>
                {c.status === "Done" ? <div style={{ display: "flex", gap: 6, alignItems: "center" }}><input id={`proof-${c.id}`} type="file" accept="image/*" onChange={(e) => uploadProof(c, e)} style={{ display: "none" }} /><Button small variant="subtle" onClick={() => document.getElementById(`proof-${c.id}`)?.click()} disabled={proofUploading === c.id}><ImageIcon size={13} /> {proofUploading === c.id ? "Processing…" : c.photo ? "Change" : "Upload"}</Button>{c.photo && <img src={c.photo} alt="Proof" style={{ width: 38, height: 38, objectFit: "cover", borderRadius: 6, border: `1px solid ${COLORS.line}` }} />}</div> : <span style={{ fontSize: 11.5, color: COLORS.inkSoft }}>Available when Done</span>}
                <button type="button" title="Delete material" aria-label={`Delete ${c.name || "material"}`} onClick={() => deleteComponent(c)} style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${COLORS.redSoft}`, background: "#FFF7F5", color: COLORS.red, display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Trash2 size={15} /></button>
              </div>
            ))}
          </div></div>
        )}
      </div>

      <div style={{ marginTop: 20 }}><SectionHeading>Notes & follow-up history</SectionHeading><div style={{ display: "flex", gap: 8, marginTop: 10 }}><TextArea rows={2} value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Add a follow-up note…" /><Button small onClick={addNote}><Plus size={13} /> Add note</Button></div><div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>{(s.noteHistory || []).length === 0 ? <div style={{ color: COLORS.inkSoft, fontSize: 13.5 }}>No notes yet.</div> : (s.noteHistory || []).map((n) => <div key={n.id} style={{ background: COLORS.bg, borderRadius: 8, padding: "9px 11px" }}><div style={{ fontSize: 11.5, color: COLORS.inkSoft }}>{new Date(n.createdAt).toLocaleString()}</div><div style={{ fontSize: 13.5, marginTop: 3, whiteSpace: "pre-wrap" }}>{n.text}</div></div>)}</div></div>

      <div style={{ marginTop: 20 }}><SectionHeading>Revision history</SectionHeading><div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>{(s.revisions || []).map((r) => <div key={r.id} style={{ display: "flex", gap: 12, borderBottom: `1px solid ${COLORS.line}`, paddingBottom: 10 }}>{r.photo && <img src={r.photo} alt="" style={{ width: 60, height: 60, borderRadius: 8, objectFit: "cover" }} />}<div><div style={{ fontSize: 12.5, color: COLORS.inkSoft }}>{r.date}</div><div style={{ fontWeight: 600, fontSize: 13.5 }}>{r.changeReason}</div>{r.note && <div style={{ fontSize: 13, color: COLORS.inkSoft }}>{r.note}</div>}</div></div>)}{(s.revisions || []).length === 0 && <div style={{ color: COLORS.inkSoft, fontSize: 13.5 }}>No revisions logged yet.</div>}<div style={{ display: "grid", gridTemplateColumns: "120px 1fr 1fr", gap: 8 }}><Input type="date" value={newRevision.date} onChange={(e) => setNewRevision({ ...newRevision, date: e.target.value })} /><Input placeholder="What changed?" value={newRevision.changeReason} onChange={(e) => setNewRevision({ ...newRevision, changeReason: e.target.value })} /><Input placeholder="Photo URL (optional)" value={newRevision.photo} onChange={(e) => setNewRevision({ ...newRevision, photo: e.target.value })} /></div><div style={{ display: "grid", gridTemplateColumns: "1fr 100px", gap: 8 }}><Input placeholder="Note (optional)" value={newRevision.note} onChange={(e) => setNewRevision({ ...newRevision, note: e.target.value })} /><Button small onClick={addRevision}><Plus size={13} /> Add revision</Button></div></div></div>

      <div style={{ marginTop: 20 }}><SectionHeading>Related tasks</SectionHeading><div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>{relatedTasks.length === 0 && <div style={{ color: COLORS.inkSoft, fontSize: 13.5 }}>No tasks linked to this sample yet.</div>}{relatedTasks.map((t) => <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, background: COLORS.bg, padding: "8px 10px", borderRadius: 8, fontSize: 13 }}><div><div style={{ fontWeight: 600 }}>{t.name}</div><div style={{ fontSize: 11.5, color: COLORS.inkSoft }}>{t.type || "Daily"} · {t.referencePerson || "—"}{t.deadline ? ` · ${t.deadline}` : ""}</div></div><button onClick={() => cycleTaskStatus(t)} style={{ border: "none", cursor: "pointer", background: "none", padding: 0 }}><Badge tone={taskStatusTone(t.status)}>{t.status}</Badge></button></div>)}<div style={{ display: "grid", gridTemplateColumns: "1fr 140px auto", gap: 8, marginTop: 4 }}><Input placeholder="Quick add a task for this sample…" value={newTaskName} onChange={(e) => setNewTaskName(e.target.value)} /><Input type="date" value={newTaskDeadline} onChange={(e) => setNewTaskDeadline(e.target.value)} /><Button small onClick={addRelatedTask}><Plus size={13} /> Add</Button></div></div></div>
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

function CalendarView({ samples, materialPreps, tasks, customerName, saveSamples, saveMaterialPreps, saveTasks }) {
  const now = new Date();
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date(now);
    const day = d.getDay();
    d.setDate(d.getDate() - day + 1);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [view, setView] = useState("week");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [filter, setFilter] = useState("all");
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverDate, setDragOverDate] = useState(null);
  const [editing, setEditing] = useState(null);

  const iso = (d) => {
    const x = new Date(d);
    x.setHours(12, 0, 0, 0);
    return x.toISOString().slice(0, 10);
  };
  const startOfWeek = (d) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    const day = x.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    x.setDate(x.getDate() + diff);
    return x;
  };
  const formatDate = (value) => value ? new Date(`${value}T12:00:00`).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";
  const sampleFor = (id) => samples.find((s) => s.id === id);

  const events = [];
  materialPreps.forEach((p) => {
    if (!p.dueDate) return;
    const sample = sampleFor(p.sampleId);
    events.push({
      id: `material-${p.id || `${p.sampleId}-${p.componentField || p.materialName}`}`,
      date: p.dueDate,
      type: "material",
      label: p.materialName || "Material preparation",
      subtitle: sample?.erpNo || p.sampleId || "—",
      sampleName: sample?.name || "",
      sampleId: p.sampleId,
      prepId: p.id || "",
      status: p.status || "Waiting",
      overdue: p.status !== "Done" && p.dueDate < iso(now),
    });
  });
  samples.forEach((s) => {
    if (!s.targetDate) return;
    events.push({
      id: `sample-${s.id}`,
      date: s.targetDate,
      type: "sample",
      label: s.name || "Unnamed sample",
      subtitle: s.erpNo || s.id,
      sampleName: s.name || "",
      sampleId: s.id,
      status: s.stage || "Request Received",
      overdue: s.stage !== "Completed" && s.targetDate < iso(now),
    });
  });
  tasks.forEach((t) => {
    if (!t.deadline) return;
    const sample = sampleFor(t.sampleId);
    events.push({
      id: `task-${t.id}`,
      date: t.deadline,
      type: "task",
      label: t.name || "Untitled task",
      subtitle: sample?.erpNo || t.referencePerson || "Follow-up",
      sampleName: sample?.name || "",
      sampleId: t.sampleId,
      taskId: t.id,
      taskType: t.type || "Daily",
      priority: t.priority || "",
      referencePerson: t.referencePerson || "",
      description: t.description || t.note || "",
      status: t.status || "To Do",
      overdue: isTaskOverdue(t),
    });
  });

  const today = iso(now);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return { date: d, iso: iso(d) };
  });
  const weekEnd = weekDays[6].iso;
  const visibleEvents = events
    .filter((e) => {
      if (filter === "all") return true;
      if (filter === "followup") return e.type === "task" && e.taskType !== "Daily";
      if (filter === "daily") return e.type === "task" && e.taskType === "Daily";
      return e.type === filter;
    })
    .sort((a, b) => a.date.localeCompare(b.date));
  const eventsByDate = {};
  visibleEvents.forEach((e) => { eventsByDate[e.date] = eventsByDate[e.date] || []; eventsByDate[e.date].push(e); });

  const overdue = events.filter((e) => e.overdue).sort((a, b) => a.date.localeCompare(b.date));
  const dueToday = events.filter((e) => e.date === today && !e.overdue && !(e.status === "Done" || e.status === "Completed"));
  const thisWeek = events.filter((e) => e.date >= today && e.date <= weekEnd && !e.overdue && !(e.status === "Done" || e.status === "Completed"));
  const completedKnown = samples.filter((s) => sampleOnTime(s) !== null);
  const onTimeCount = completedKnown.filter((s) => sampleOnTime(s)).length;
  const onTimeRate = completedKnown.length ? Math.round((onTimeCount / completedKnown.length) * 100) : null;

  const moveWeek = (days) => { const d = new Date(weekStart); d.setDate(d.getDate() + days); setWeekStart(d); };
  const goToday = () => setWeekStart(startOfWeek(new Date()));
  const formatWeek = () => {
    const a = weekDays[0].date, b = weekDays[6].date;
    const am = a.toLocaleDateString("en-US", { month: "short" }), bm = b.toLocaleDateString("en-US", { month: "short" });
    return am === bm ? `${am} ${a.getDate()}–${b.getDate()}, ${b.getFullYear()}` : `${am} ${a.getDate()} – ${bm} ${b.getDate()}, ${b.getFullYear()}`;
  };

  const typeStyle = (e) => {
    if (e.overdue) return { bg: "#FFF0EE", border: "#FFB7AE", text: "#B53B2D", accent: "#D94B4B", label: "OVERDUE" };
    if (e.status === "Done" || e.status === "Completed") return { bg: "#EAF6EE", border: "#B8DFC4", text: "#32724A", accent: "#4C9A68", label: "DONE" };
    if (e.type === "material") return { bg: "#FFF6E9", border: "#F4D3A7", text: "#9A5A2F", accent: "#FF8A3D", label: "MATERIAL" };
    if (e.type === "sample") return { bg: "#FFF0E8", border: "#FFC6A6", text: "#C94700", accent: "#FF5500", label: "SAMPLE" };
    if (e.taskType === "Daily") return { bg: "#EEF2FF", border: "#AFC0FF", text: "#3159C7", accent: "#4267E8", label: "DAILY" };
    if (e.taskType === "Sample Test") return { bg: "#F3ECFF", border: "#CBB3FF", text: "#7040B5", accent: "#8B5CF6", label: "SAMPLE TEST" };
    return { bg: "#FFF0E8", border: "#FFB98F", text: "#C94700", accent: "#FF5500", label: "FOLLOW-UP" };
  };

  const persistEventDate = (event, newDate) => {
    if (!event || !newDate || event.date === newDate) return;
    if (event.type === "sample") {
      saveSamples(samples.map((s) => s.id === event.sampleId ? { ...s, targetDate: newDate } : s));
    } else if (event.type === "material") {
      saveMaterialPreps(materialPreps.map((p) => p.id === event.prepId ? { ...p, dueDate: newDate } : p));
    } else if (event.type === "task") {
      saveTasks(tasks.map((t) => t.id === event.taskId ? { ...t, deadline: newDate } : t));
    }
  };

  const handleDrop = (date) => {
    if (!draggingId) return;
    const event = events.find((e) => e.id === draggingId);
    if (event) persistEventDate(event, date);
    setDraggingId(null);
    setDragOverDate(null);
  };

  const openEdit = (event) => {
    if (event.type === "more") return;
    setSelectedEvent(event);
    setEditing({
      date: event.date || "",
      status: event.status || "",
      priority: event.priority || "",
      nextAction: event.type === "sample" ? (sampleFor(event.sampleId)?.nextAction || "") : "",
      waitingFor: event.type === "sample" ? (sampleFor(event.sampleId)?.waitingFor || "") : "",
    });
  };

  // Keep Material Progress on the linked Sample in sync immediately.
  // The source of truth for component/material rows is sample_components; the
  // linked sample.requiredComponents array is updated locally so Sample Detail
  // reflects the change without requiring a page reload. When every material
  // for a sample is Done, we also write a lightweight stage-status signal to
  // the samples table so the Sample record itself shows that materials are ready.
  const syncMaterialToSample = (prepId, patch) => {
    const prep = materialPreps.find((p) => p.id === prepId);
    if (!prep) return;
    const sampleId = prep.sampleId;
    const nextPreps = materialPreps.map((p) => p.id === prepId ? { ...p, ...patch } : p);
    const linkedPreps = nextPreps.filter((p) => p.sampleId === sampleId);
    const allDone = linkedPreps.length > 0 && linkedPreps.every((p) => p.status === "Done");
    const linkedSample = samples.find((s) => s.id === sampleId);
    if (!linkedSample) return;

    const baseComponents = (linkedSample.requiredComponents && linkedSample.requiredComponents.length)
      ? linkedSample.requiredComponents
      : linkedPreps.map((p) => ({
          id: p.id,
          name: p.materialName || "Material",
          qty: p.qty || 1,
          targetDate: p.dueDate || "",
          status: p.status || "Waiting",
          photo: p.photo || "",
        }));
    const nextComponents = baseComponents.map((c) =>
      c.id === prepId
        ? {
            ...c,
            status: patch.status ?? c.status,
            targetDate: patch.dueDate ?? c.targetDate,
            photo: patch.photo ?? c.photo,
            qty: patch.qty ?? c.qty,
          }
        : c
    );

    const samplePatch = { requiredComponents: nextComponents };
    if (allDone) {
      samplePatch.stageStatus = "Materials Done";
    }
    saveSamples(samples.map((s) => s.id === sampleId ? { ...s, ...samplePatch } : s));
    saveMaterialPreps(nextPreps);
  };

  const saveEditing = () => {
    const e = selectedEvent;
    if (!e || !editing) return;
    if (e.type === "sample") {
      saveSamples(samples.map((s) => s.id === e.sampleId ? { ...s, targetDate: editing.date, priority: editing.priority, nextAction: editing.nextAction, waitingFor: editing.waitingFor } : s));
    } else if (e.type === "material") {
      syncMaterialToSample(e.prepId, { dueDate: editing.date, status: editing.status });
    } else if (e.type === "task") {
      saveTasks(tasks.map((t) => t.id === e.taskId ? { ...t, deadline: editing.date, status: editing.status, priority: editing.priority } : t));
    }
    setSelectedEvent(null);
    setEditing(null);
  };

  const markDone = () => {
    const e = selectedEvent;
    if (!e) return;
    if (e.type === "task") saveTasks(tasks.map((t) => t.id === e.taskId ? { ...t, status: "Done" } : t));
    if (e.type === "material") syncMaterialToSample(e.prepId, { status: "Done" });
    if (e.type === "sample") saveSamples(samples.map((s) => s.id === e.sampleId ? { ...s, stage: "Shipping", overallStatus: "Completed", completedDate: today } : s));
    setSelectedEvent(null);
    setEditing(null);
  };

  const EventCard = ({ e, compact = false }) => {
    const ts = typeStyle(e);
    return (
      <button
        draggable
        onDragStart={(ev) => { ev.dataTransfer.effectAllowed = "move"; ev.dataTransfer.setData("text/plain", e.id); setDraggingId(e.id); }}
        onDragEnd={() => { setDraggingId(null); setDragOverDate(null); }}
        onClick={() => openEdit(e)}
        title={`${e.label} — ${e.date}`}
        style={{
          width: "100%", textAlign: "left", border: `1px solid ${ts.border}`, background: ts.bg,
          borderRadius: 10, padding: compact ? "8px 9px" : "10px", cursor: draggingId === e.id ? "grabbing" : "grab",
          opacity: draggingId === e.id ? .55 : 1, boxShadow: "0 2px 7px rgba(0,0,0,.035)", transition: "transform .15s ease, box-shadow .15s ease",
          borderLeft: `4px solid ${ts.accent}`,
        }}
        onMouseEnter={(ev) => { ev.currentTarget.style.transform = "translateY(-1px)"; ev.currentTarget.style.boxShadow = "0 5px 12px rgba(0,0,0,.07)"; }}
        onMouseLeave={(ev) => { ev.currentTarget.style.transform = "none"; ev.currentTarget.style.boxShadow = "0 2px 7px rgba(0,0,0,.035)"; }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 6, alignItems: "flex-start" }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
              <span style={{ fontSize: 9, fontWeight: 850, color: ts.text, letterSpacing: ".05em" }}>{ts.label}</span>
              {e.priority && <span style={{ fontSize: 8.5, color: ts.text, background: "rgba(255,255,255,.72)", borderRadius: 999, padding: "2px 5px", fontWeight: 750 }}>{e.priority}</span>}
            </div>
            <div style={{ fontSize: compact ? 11.5 : 12.5, lineHeight: 1.25, fontWeight: 800, color: COLORS.ink, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: compact ? 2 : 3, WebkitBoxOrient: "vertical" }}>{e.label}</div>
            {e.subtitle && <div style={{ marginTop: 4, fontSize: 10.2, color: COLORS.inkSoft, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.subtitle}</div>}
            {e.type === "task" && e.referencePerson && <div style={{ marginTop: 3, fontSize: 9.8, color: COLORS.inkSoft, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>↳ {e.referencePerson}</div>}
          </div>
          <span style={{ fontSize: 11, color: ts.text, opacity: .75 }}>⠿</span>
        </div>
      </button>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: ".12em", color: COLORS.wood, textTransform: "uppercase" }}>Planning & Follow-up</div>
          <h1 style={{ fontFamily: FONT_HEAD, fontSize: 28, margin: "3px 0 0", letterSpacing: "-.03em" }}>Master Production Calendar</h1>
          <div style={{ color: COLORS.inkSoft, fontSize: 12.5, marginTop: 4 }}>Drag any sample, material or task to reschedule it. The linked record is updated automatically.</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ display: "flex", background: COLORS.panel, border: `1px solid ${COLORS.line}`, borderRadius: 10, padding: 3 }}>
            {[['week','Week'], ['list','Agenda']].map(([k,l]) => <button key={k} onClick={() => setView(k)} style={{ border: "none", background: view === k ? COLORS.wood : "transparent", color: view === k ? "#fff" : COLORS.inkSoft, borderRadius: 8, padding: "7px 11px", fontWeight: 700, cursor: "pointer", fontSize: 12 }}>{l}</button>)}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 10 }}>
        {[["Overdue", overdue.length, COLORS.red, COLORS.redSoft],["Due today", dueToday.length, COLORS.wood, COLORS.amberSoft],["This week", thisWeek.length, COLORS.amber, COLORS.amberSoft],["Sample on-time", onTimeRate === null ? "—" : `${onTimeRate}%`, COLORS.green, COLORS.greenSoft]].map(([label,value,color,bg]) => (
          <div key={label} style={{ background: COLORS.panel, border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: "11px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", minWidth: 0 }}>
            <div><div style={{ fontSize: 10.5, color: COLORS.inkSoft, fontWeight: 700 }}>{label}</div><div style={{ marginTop: 2, fontSize: 20, lineHeight: 1, fontWeight: 850, color }}>{value}</div></div>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: bg, display: "grid", placeItems: "center", color }}><CalendarDays size={15} /></div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}><Button small variant="subtle" onClick={() => moveWeek(-7)}>‹</Button><Button small variant="subtle" onClick={goToday}>Today</Button><Button small variant="subtle" onClick={() => moveWeek(7)}>›</Button><div style={{ fontSize: 16, fontWeight: 800, marginLeft: 4 }}>{formatWeek()}</div></div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {[['all','All'],['followup','Follow-up'],['daily','Daily'],['sample','Samples'],['material','Materials']].map(([k,l]) => <button key={k} onClick={() => setFilter(k)} style={{ border: `1px solid ${filter === k ? COLORS.wood : COLORS.line}`, background: filter === k ? COLORS.amberSoft : COLORS.panel, color: filter === k ? COLORS.woodDark : COLORS.inkSoft, borderRadius: 999, padding: "6px 10px", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>{l}</button>)}
        </div>
      </div>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 10.5, color: COLORS.inkSoft }}>
        {[['#FF5500','Sample'],['#FF8A3D','Material'],['#4267E8','Daily'],['#8B5CF6','Sample Test'],['#D94B4B','Overdue'],['#4C9A68','Done']].map(([c,l]) => <span key={l} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><i style={{ width: 8, height: 8, borderRadius: "50%", background: c, display: "inline-block" }} />{l}</span>)}
      </div>

      {view === "week" ? (
        <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.line}`, borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,.035)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "190px repeat(7, minmax(0, 1fr))", borderBottom: `1px solid ${COLORS.line}` }}>
            <div style={{ padding: "11px 14px", background: "#FAFAFA", borderRight: `1px solid ${COLORS.line}` }}><div style={{ fontSize: 10, fontWeight: 800, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: ".08em" }}>Planning board</div><div style={{ fontSize: 10.5, color: COLORS.inkSoft, marginTop: 3 }}>Drag & drop to reschedule</div></div>
            {weekDays.map((d) => { const isToday = d.iso === today; const count = (eventsByDate[d.iso] || []).length; return <div key={d.iso} onDragOver={(ev) => { ev.preventDefault(); ev.dataTransfer.dropEffect = "move"; setDragOverDate(d.iso); }} onDragLeave={() => setDragOverDate(null)} onDrop={() => handleDrop(d.iso)} style={{ padding: "8px 8px 9px", textAlign: "center", background: isToday ? COLORS.wood : "#FAFAFA", color: isToday ? "#fff" : COLORS.ink, outline: dragOverDate === d.iso ? `3px solid ${COLORS.wood}` : "none", outlineOffset: -3 }}><div style={{ fontSize: 10, fontWeight: 700, opacity: .78 }}>{d.date.toLocaleDateString("en-US", { weekday: "short" })}</div><div style={{ fontSize: 17, fontWeight: 850, lineHeight: 1.15 }}>{d.date.getDate()}</div><div style={{ fontSize: 9.5, opacity: .72 }}>{d.date.toLocaleDateString("en-US", { month: "short" })} · {count}</div></div>; })}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "190px repeat(7, minmax(0, 1fr))", minHeight: 450 }}>
            <div style={{ background: "#FAFAFA", borderRight: `1px solid ${COLORS.line}` }}>
              <div style={{ padding: 12, borderBottom: `1px solid ${COLORS.line}` }}><div style={{ fontSize: 12.5, fontWeight: 800 }}>Follow-up queue</div><div style={{ fontSize: 10.5, color: COLORS.inkSoft, marginTop: 3 }}>Items requiring attention</div><div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 13 }}>{overdue.slice(0, 5).map((e) => <button key={e.id} onClick={() => openEdit(e)} style={{ border: 0, background: "transparent", padding: 0, textAlign: "left", fontSize: 10.5, display: "flex", gap: 6, alignItems: "center", cursor: "pointer" }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: COLORS.red }} /><span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.label}</span></button>)}{!overdue.length && <div style={{ fontSize: 10.5, color: COLORS.green }}>No overdue items.</div>}</div></div>
              <div style={{ padding: 12 }}><div style={{ fontSize: 10.5, fontWeight: 800, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: ".06em" }}>How it works</div><div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 9, fontSize: 10.2, color: COLORS.inkSoft }}><div>↕ Drag a card to another day</div><div>✎ Click a card to edit</div><div>✓ Mark work as Done</div></div></div>
            </div>
            {weekDays.map((d) => { const dayEvents = eventsByDate[d.iso] || []; return <div key={d.iso} onDragOver={(ev) => { ev.preventDefault(); ev.dataTransfer.dropEffect = "move"; setDragOverDate(d.iso); }} onDragLeave={() => setDragOverDate(null)} onDrop={() => handleDrop(d.iso)} style={{ padding: 7, borderRight: `1px solid ${COLORS.line}`, background: dragOverDate === d.iso ? "#FFF4EC" : (d.iso === today ? "#FFF9F5" : "#FFFFFF"), minWidth: 0, transition: "background .15s ease" }}><div style={{ display: "flex", flexDirection: "column", gap: 7, minHeight: 430 }}>{dayEvents.slice(0, 8).map((e) => <EventCard key={e.id} e={e} compact />)}{dayEvents.length > 8 && <button onClick={() => setSelectedEvent({ date: d.iso, label: `${dayEvents.length - 8} more items`, type: "more", more: dayEvents.slice(8) })} style={{ border: "none", background: "transparent", color: COLORS.wood, fontWeight: 800, fontSize: 10.5, cursor: "pointer", padding: 4 }}>+ {dayEvents.length - 8} more</button>}{!dayEvents.length && <div style={{ flex: 1, minHeight: 120, border: dragOverDate === d.iso ? `2px dashed ${COLORS.wood}` : "1px dashed #E9EAED", borderRadius: 10, display: "grid", placeItems: "center", color: dragOverDate === d.iso ? COLORS.wood : "#B8BCC2", fontSize: 10.5 }}>{dragOverDate === d.iso ? "Drop here" : "No plan"}</div>}</div></div>; })}
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1.45fr 1fr", gap: 14 }}>
          <Panel title="Agenda — this week"><div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{visibleEvents.filter((e) => e.date >= weekDays[0].iso && e.date <= weekEnd).map((e) => <div key={e.id} style={{ display: "grid", gridTemplateColumns: "82px 1fr", gap: 10, alignItems: "start" }}><div style={{ fontSize: 10.5, color: COLORS.inkSoft, fontWeight: 700 }}>{formatDate(e.date)}</div><EventCard e={e} /></div>)}{!visibleEvents.some((e) => e.date >= weekDays[0].iso && e.date <= weekEnd) && <div style={{ color: COLORS.inkSoft, fontSize: 13 }}>Nothing scheduled this week.</div>}</div></Panel>
          <Panel title="Follow-up queue"><div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{overdue.slice(0, 8).map((e) => <EventCard key={e.id} e={e} />)}{!overdue.length && <div style={{ color: COLORS.green, fontSize: 13 }}>Nothing overdue — all caught up.</div>}</div></Panel>
        </div>
      )}

      {selectedEvent && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(17,17,17,.28)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => { setSelectedEvent(null); setEditing(null); }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "min(560px, 100%)", background: COLORS.panel, borderRadius: 16, border: `1px solid ${COLORS.line}`, boxShadow: "0 20px 60px rgba(0,0,0,.18)", overflow: "hidden" }}>
            <div style={{ padding: "15px 17px", borderBottom: `1px solid ${COLORS.line}`, display: "flex", justifyContent: "space-between", gap: 12 }}><div><div style={{ fontSize: 10, color: typeStyle(selectedEvent).text, fontWeight: 850, textTransform: "uppercase", letterSpacing: ".08em" }}>{typeStyle(selectedEvent).label}</div><div style={{ fontSize: 18, fontWeight: 850, marginTop: 3 }}>{selectedEvent.label}</div><div style={{ marginTop: 4, fontSize: 11, color: COLORS.inkSoft }}>{selectedEvent.subtitle || selectedEvent.sampleName || ""}</div></div><button onClick={() => { setSelectedEvent(null); setEditing(null); }} style={{ border: "none", background: COLORS.bg, borderRadius: 8, width: 30, height: 30, cursor: "pointer" }}><X size={15} /></button></div>
            <div style={{ padding: 17 }}>
              {selectedEvent.type === "more" ? <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{selectedEvent.more.map((e) => <EventCard key={e.id} e={e} />)}</div> : <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div><div style={{ fontSize: 10, color: COLORS.inkSoft }}>Date</div><Input type="date" value={editing?.date || ""} onChange={(ev) => setEditing((x) => ({ ...x, date: ev.target.value }))} /></div>
                  <div><div style={{ fontSize: 10, color: COLORS.inkSoft }}>Status</div><select value={editing?.status || ""} onChange={(ev) => setEditing((x) => ({ ...x, status: ev.target.value }))} style={{ width: "100%", marginTop: 5, padding: "9px 10px", border: `1px solid ${COLORS.line}`, borderRadius: 9, background: "#fff", fontFamily: FONT_BODY, fontSize: 12.5 }}>{(selectedEvent.type === "task" ? TASK_STATUSES : selectedEvent.type === "material" ? ["Waiting","Pending","Done"] : ["Request Received","Material Preparation","Assembly","Quality Check","Customer Correction","Packaging","Shipping"]).map((v) => <option key={v}>{v}</option>)}</select></div>
                </div>
                {(selectedEvent.type === "task" || selectedEvent.type === "sample") && <div style={{ marginTop: 10 }}><div style={{ fontSize: 10, color: COLORS.inkSoft }}>Priority</div><Input value={editing?.priority || ""} onChange={(ev) => setEditing((x) => ({ ...x, priority: ev.target.value }))} placeholder="e.g. High Priority" /></div>}
                {selectedEvent.type === "sample" && <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}><div><div style={{ fontSize: 10, color: COLORS.inkSoft }}>Waiting For</div><Input value={editing?.waitingFor || ""} onChange={(ev) => setEditing((x) => ({ ...x, waitingFor: ev.target.value }))} /></div><div><div style={{ fontSize: 10, color: COLORS.inkSoft }}>Next Action</div><Input value={editing?.nextAction || ""} onChange={(ev) => setEditing((x) => ({ ...x, nextAction: ev.target.value }))} /></div></div>}
                {selectedEvent.type === "task" && <div style={{ marginTop: 10, background: COLORS.bg, borderRadius: 10, padding: 10 }}><div style={{ fontSize: 10, color: COLORS.inkSoft }}>Details</div><div style={{ marginTop: 4, fontSize: 12.5, lineHeight: 1.45 }}>{selectedEvent.description || "No description / note."}</div>{selectedEvent.referencePerson && <div style={{ marginTop: 6, fontSize: 10.5, color: COLORS.inkSoft }}>Reference: {selectedEvent.referencePerson}</div>}</div>}
                {selectedEvent.sampleName && <div style={{ marginTop: 10, fontSize: 11.5, color: COLORS.inkSoft }}>Linked sample: <strong style={{ color: COLORS.ink }}>{selectedEvent.sampleName}</strong></div>}
                {selectedEvent.overdue && <div style={{ marginTop: 12, background: COLORS.redSoft, color: COLORS.red, borderRadius: 9, padding: "9px 10px", fontSize: 12, fontWeight: 700 }}>This item is overdue and should be followed up.</div>}
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 16, flexWrap: "wrap" }}><Button variant="ghost" onClick={() => { setSelectedEvent(null); setEditing(null); }}>Cancel</Button><div style={{ display: "flex", gap: 8 }}><Button variant="subtle" onClick={markDone}>✓ Mark Done</Button><Button onClick={saveEditing}>Save changes</Button></div></div>
              </>}
            </div>
          </div>
        </div>
      )}
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
  const [showErpPicker, setShowErpPicker] = useState(false);
  const [erpSearch, setErpSearch] = useState("");

  const selectedSample = editing?.sampleId ? samples.find((x) => x.id === editing.sampleId) : null;
  const sampleLabel = (id) => {
    const s = samples.find((x) => x.id === id);
    return s ? `${s.erpNo || s.id} — ${s.name || "(unnamed sample)"}` : "";
  };

  const filteredErpSamples = samples.filter((s) => {
    const q = erpSearch.trim().toLowerCase();
    if (!q) return true;
    const customer = customerName(s.customerId) || "";
    return [s.erpNo, s.id, s.name, customer, s.stage].some((v) => String(v || "").toLowerCase().includes(q));
  });

  const chooseErpSample = (sample) => {
    setEditing({ ...editing, sampleId: sample.id });
    setShowErpPicker(false);
    setErpSearch("");
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
    <div style={{ display: "flex", flexDirection: "column", gap: 18, width: "100%", minWidth: 0 }}>
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

      {showErpPicker && (
        <div
          onClick={() => setShowErpPicker(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(20,24,21,.42)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: "min(900px, 100%)", maxHeight: "80vh", background: COLORS.panel, borderRadius: 16, border: `1px solid ${COLORS.line}`, boxShadow: "0 24px 70px rgba(0,0,0,.22)", overflow: "hidden", display: "flex", flexDirection: "column" }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", borderBottom: `1px solid ${COLORS.line}` }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.ink }}>Search ERP Code</div>
                <div style={{ marginTop: 3, fontSize: 12.5, color: COLORS.inkSoft }}>Find and select a sample to link with this task</div>
              </div>
              <button type="button" onClick={() => setShowErpPicker(false)} style={{ border: "none", background: "transparent", cursor: "pointer", color: COLORS.inkSoft, padding: 6 }}><X size={20} /></button>
            </div>
            <div style={{ padding: 16, borderBottom: `1px solid ${COLORS.line}` }}>
              <div style={{ position: "relative" }}>
                <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: COLORS.inkSoft }} />
                <Input
                  autoFocus
                  value={erpSearch}
                  onChange={(e) => setErpSearch(e.target.value)}
                  placeholder="Search by ERP code, sample name, or customer..."
                  style={{ width: "100%", paddingLeft: 36 }}
                />
              </div>
            </div>
            <div style={{ overflow: "auto", padding: "0 16px 16px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ position: "sticky", top: 0, background: COLORS.panel, zIndex: 1 }}>
                    {['ERP Code', 'Sample Name', 'Customer', 'Stage', ''].map((h, i) => <th key={i} style={{ textAlign: "left", padding: "11px 8px", borderBottom: `1px solid ${COLORS.line}`, color: COLORS.inkSoft, fontWeight: 700 }}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {filteredErpSamples.map((s) => (
                    <tr key={s.id} onClick={() => chooseErpSample(s)} style={{ cursor: "pointer", background: editing?.sampleId === s.id ? COLORS.amberSoft : "transparent" }}>
                      <td style={{ padding: "10px 8px", borderBottom: `1px solid ${COLORS.line}`, fontWeight: 700 }}>{s.erpNo || "—"}</td>
                      <td style={{ padding: "10px 8px", borderBottom: `1px solid ${COLORS.line}` }}>{s.name || "(unnamed sample)"}</td>
                      <td style={{ padding: "10px 8px", borderBottom: `1px solid ${COLORS.line}` }}>{customerName(s.customerId) || "—"}</td>
                      <td style={{ padding: "10px 8px", borderBottom: `1px solid ${COLORS.line}` }}>{s.stage || "—"}</td>
                      <td style={{ padding: "10px 8px", borderBottom: `1px solid ${COLORS.line}`, textAlign: "right" }}><Button type="button" small> Select </Button></td>
                    </tr>
                  ))}
                  {filteredErpSamples.length === 0 && (
                    <tr><td colSpan={5} style={{ padding: 28, textAlign: "center", color: COLORS.inkSoft }}>No matching samples found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderTop: `1px solid ${COLORS.line}`, fontSize: 12, color: COLORS.inkSoft }}>
              <span>{filteredErpSamples.length} sample{filteredErpSamples.length === 1 ? "" : "s"} found</span>
              <Button type="button" variant="ghost" onClick={() => setShowErpPicker(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <Panel title={editing.id ? `Edit ${editing.id}` : "New task"}>
          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Task name" width="100%">
                <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="Required — e.g. Follow-up with SKLUM on QC" />
              </Field>
              <Field label="Task type">
                <Select value={editing.type || "Daily"} onChange={(e) => setEditing({ ...editing, type: e.target.value })}>
                  {TASK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </Select>
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
              <Field label="ERP Code">
                <div style={{ display: "flex", gap: 8 }}>
                  <Input
                    value={selectedSample?.erpNo || ""}
                    readOnly
                    placeholder="Search ERP Code..."
                    style={{ flex: 1, cursor: "pointer", background: "#FAF8F4" }}
                    onClick={() => setShowErpPicker(true)}
                  />
                  <Button type="button" onClick={() => setShowErpPicker(true)} title="Search ERP Code">
                    <Search size={15} />
                  </Button>
                </div>
                {selectedSample && (
                  <div style={{ marginTop: 6, fontSize: 12, color: COLORS.inkSoft }}>
                    {selectedSample.name || "(unnamed sample)"} · {customerName(selectedSample.customerId) || "No customer"}
                  </div>
                )}
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
              { key: "type", label: "Type", render: (t) => <Badge tone={t.type === "Sample" ? "wood" : t.type === "Sample Test" ? "teal" : "neutral"}>{t.type || "Daily"}</Badge> },
              { key: "referencePerson", label: "Reference person" },
              { key: "sample", label: "ERP Code", render: (t) => sampleLabel(t.sampleId) || "—" },
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
    <div className="kanban-board" style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 14, width: "100%", minWidth: 0, alignItems: "stretch", paddingBottom: 8 }}>
      {TASK_STATUSES.map((status) => {
        const cards = byStatus(status);
        const isOver = dragOverStatus === status;
        return (
          <div
            key={status}
            onDragOver={(e) => { e.preventDefault(); setDragOverStatus(status); }}
            onDragLeave={() => setDragOverStatus((cur) => (cur === status ? null : cur))}
            onDrop={(e) => handleDrop(e, status)}
            className="kanban-column"
            style={{
              width: "100%",
              minWidth: 0,
              background: isOver ? COLORS.amberSoft : COLORS.bg,
              border: `1px solid ${isOver ? COLORS.amber : COLORS.line}`,
              borderRadius: 12,
              display: "flex",
              flexDirection: "column",
              minHeight: "calc(100vh - 250px)",
              maxHeight: "calc(100vh - 190px)",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "10px 12px", borderBottom: `1px solid ${COLORS.line}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: COLORS.woodDark }}>{status}</span>
              <span style={{ fontSize: 11.5, color: COLORS.inkSoft, background: "#fff", borderRadius: 999, padding: "1px 8px", border: `1px solid ${COLORS.line}` }}>{cards.length}</span>
            </div>
            <div style={{ padding: 8, display: "flex", flexDirection: "column", gap: 8, overflowY: "auto", minHeight: 0, flex: 1 }}>
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
                      {t.type && <Badge tone={t.type === "Sample" ? "wood" : t.type === "Sample Test" ? "teal" : "neutral"}>{t.type}</Badge>}
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
