# Tân Hòa ERP v44 — Image Upload + Storage/RLS Hardening

## Why this version exists

The app was returning:

`Supabase Storage 400: new row violates row-level security policy`

when an authenticated Sales user uploaded a Sample photo or Material Progress proof photo.

The cause was a mismatch between the new Auth/RBAC setup and the old Storage policies: image writes were still defined for `anon`, while the app correctly sends the logged-in user's JWT.

## What v44 changes

1. `supabaseRest.js`
   - Centralizes all image uploads through one hardened function.
   - Requires an authenticated session for writes.
   - Sends the real JWT, never the public anon key, for Storage writes.
   - Retries once after a 401 by refreshing the session.
   - Has a 15-second upload timeout.
   - Enforces the existing 15 MB image limit centrally.
   - Gives a clear message for Storage 403/RLS failures.

2. `tanhoa_erp.jsx`
   - Keeps all existing Sample / Task / Material Progress image upload paths on the same helper.
   - Color master records (Finishes, Fabric Colors, Rope Colors, Cemboard Colors) can store an image URL.
   - Color-master image uploads are available from the Materials editor.
   - Color-master import templates accept an `Image URL` column.
   - Non-color master tables still write only `id`, `code`, `name`, preventing the previous PGRST204 `image_url` schema-cache error.

3. `tanhoa_v44_image_storage_fix.sql`
   - Adds `image_url` to color master tables.
   - Ensures Sample/Task/Material Progress image columns exist.
   - Removes the old anonymous Storage write policies.
   - Adds authenticated Storage policies based on the existing `public.my_level()` RBAC function.

## One-time Supabase action

Run `tanhoa_v44_image_storage_fix.sql` once in Supabase SQL Editor.

Do this BEFORE testing image upload with a Level 1 account.

Then sign out and sign back in so the browser has a fresh authenticated JWT.

## GitHub action

Replace:

- `tanhoa_erp.jsx`
- `supabaseRest.js`

Keep the existing:

- `api/erp-assistant.js`
- `api/parse-description.js`

Commit and push once.

## Important security behavior

- Public QR/sample images remain readable because the bucket is public.
- Upload/update requires an authenticated user with Level 0–2.
- Delete requires Level 0–1.
- No client-side service-role key is used.
