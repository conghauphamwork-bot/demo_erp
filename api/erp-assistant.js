export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { question, context } = req.body || {};
    if (!question || !context) return res.status(400).json({ error: "question and context are required" });
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY is not configured in Vercel." });
    const model = process.env.GEMINI_MODEL || "gemini-3.6-flash";
    const prompt = `Current ERP snapshot:
${JSON.stringify(context)}

User question:
${question}`;

    // Gemini Interactions API is the recommended API for new Gemini projects.
    const url = "https://generativelanguage.googleapis.com/v1/interactions";
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        model,
        system_instruction: "You are the read-only AI assistant for Tân Hòa Outdoor Furniture Sales ERP. Answer ONLY from the supplied ERP snapshot. Do not invent facts. If the snapshot does not contain enough information, say so clearly. The user may ask about sample status, sample stage, material readiness, tasks, deadlines, customers, or orders. Be concise and practical. When listing records, include IDs/codes and dates where useful. Do not claim to change, create, delete, or save anything. This assistant is read-only.",
        input: `${prompt}`,
      }),
    });
    const raw = await response.text();
    let data;
    try { data = JSON.parse(raw); } catch { return res.status(502).json({ error: `Gemini returned a non-JSON response: ${raw.slice(0, 300)}` }); }
    if (!response.ok) {
      const message = data?.error?.message || `Gemini API error (${response.status})`;
      return res.status(response.status).json({ error: message });
    }
    // REST responses expose generated text inside steps[].content[].text.
    // output_text is an SDK convenience property and is not normally present
    // when calling the REST API directly.
    const stepTexts = Array.isArray(data?.steps)
      ? data.steps.flatMap(step =>
          Array.isArray(step?.content)
            ? step.content
                .filter(item => item?.type === "text" && typeof item?.text === "string")
                .map(item => item.text)
            : []
        )
      : [];
    const answer = String(
      data?.output_text || stepTexts.join("\n").trim()
    ).trim();

    if (!answer) {
      const interactionStatus = data?.status ? ` Status: ${data.status}.` : "";
      const interactionError = Array.isArray(data?.errors)
        ? data.errors.map(e => e?.message).filter(Boolean).join("; ")
        : data?.error?.message || "";
      return res.status(502).json({
        error: `Gemini returned no text answer.${interactionStatus}${interactionError ? ` ${interactionError}` : ""}`
      });
    }
    return res.status(200).json({ answer });
  } catch (err) {
    console.error("ERP assistant error", err);
    return res.status(500).json({ error: err?.message || "Unknown server error" });
  }
}
