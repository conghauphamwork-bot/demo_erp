const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export default async function handler(req) {
  if (req.method !== "POST") return jsonResponse(405, { error: "Method not allowed" });
  const key = process.env.GEMINI_API_KEY;
  if (!key) return jsonResponse(500, { error: "GEMINI_API_KEY is not configured in Vercel." });

  try {
    const body = await req.json();
    const { imageBase64, mimeType = "image/jpeg", descriptionText = "", masters = {} } = body || {};
    if (!imageBase64 && !descriptionText.trim()) return jsonResponse(400, { error: "Provide an image or description text." });

    const compactMasters = Object.fromEntries(Object.entries(masters).map(([k, list]) => [
      k,
      (Array.isArray(list) ? list : []).slice(0, 300).map(x => ({ id: x.id, code: x.code || "", name: x.name || x.Main_Material_Name || x.Main_Material_Name || "" }))
    ]));

    const prompt = `You are a furniture product-description extraction assistant for Tân Hòa Outdoor Furniture ERP.
Read the supplied product-description image/text and return ONLY valid JSON. Do not invent values.
Separate combined phrases into the ERP fields below. Preserve codes such as TH-14, TH-17-1112 exactly.
If a value is not present, use null. If uncertain, still provide the best literal extraction and set confidence below 0.75.

Required JSON shape:
{
  "sampleName": string|null,
  "productType": string|null,
  "qty": number|null,
  "width": number|null,
  "depth": number|null,
  "height": number|null,
  "armHeight": number|null,
  "seatHeight": number|null,
  "mainMaterial": string|null,
  "finishColor": string|null,
  "woodSurfaceTreatment": string|null,
  "fabricType": string|null,
  "fabricColor": string|null,
  "ropeType": string|null,
  "ropeDiameter": number|null,
  "ropeColor": string|null,
  "metalName": string|null,
  "metalColor": string|null,
  "cemboardColor": string|null,
  "hardware": string|null,
  "construction": string|null,
  "revision": string|null,
  "packing": string|null,
  "notes": string|null,
  "sourceText": string,
  "confidence": { "sampleName":0, "productType":0, "dimensions":0, "materials":0, "hardware":0, "construction":0 }
}

Parsing rules:
- "W1200xD1200xH760mm" -> width 1200, depth 1200, height 760.
- "Acacia (sanding / TH-14)" -> mainMaterial Acacia, woodSurfaceTreatment sanding, finishColor TH-14.
- "superstone (tiles TH-17-1112, brown color glossy)" -> cemboardColor TH-17-1112 when appropriate, and notes should retain brown/glossy if there is no dedicated field.
- "1pcs/carton" -> packing "1 pcs/carton".
- Do not map master IDs yourself; return literal names/codes and let the ERP match them.

Available ERP master values for matching context:
${JSON.stringify(compactMasters)}

Description text, if supplied:
${descriptionText.trim()}`;

    const parts = [{ text: prompt }];
    if (imageBase64) parts.push({ inline_data: { mime_type: mimeType, data: imageBase64 } });

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL)}:generateContent?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: { temperature: 0.1, responseMimeType: "application/json" },
      }),
    });

    const data = await response.json();
    if (!response.ok) return jsonResponse(response.status, { error: data?.error?.message || "Gemini request failed." });
    const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("") || "";
    if (!text) return jsonResponse(502, { error: "AI returned an empty response." });
    let parsed;
    try { parsed = JSON.parse(text); } catch (_) {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("AI returned invalid JSON.");
      parsed = JSON.parse(match[0]);
    }
    return jsonResponse(200, { result: parsed, model: MODEL });
  } catch (error) {
    return jsonResponse(500, { error: error?.message || String(error) });
  }
}
