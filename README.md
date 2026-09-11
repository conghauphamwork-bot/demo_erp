# Tân Hòa ERP — Digital Sample Passport v21.5

Update: Sample Kanban is now fit-to-frame on desktop widths above 1280px. The 7 stages use equal fluid columns with compact headers/cards. At <=1280px the board intentionally switches to horizontal scrolling to preserve readability; mobile uses horizontal scrolling as well.

Other v21.4 functionality is retained.

Build verification: not run in this environment.

## AI Description Parser

The Sample form includes **AI from Description**. It sends an uploaded product-description image to the Vercel serverless endpoint `/api/parse-description`, which calls Gemini Vision and returns structured JSON for review before the user applies it to the Sample form.

Set this Vercel environment variable:
- `GEMINI_API_KEY` = Google AI Studio Gemini API key

Optional:
- `GEMINI_MODEL` (defaults to `gemini-2.5-flash`)

The API key is server-side only and is not exposed to the browser. Gemini 2.5 Flash currently has a free tier for text/image input and output, subject to Google rate limits.
