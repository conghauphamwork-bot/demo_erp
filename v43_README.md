# Tân Hòa ERP v43 — Supabase Schema-Mismatch Fix

## Root cause fixed
The Material page was using a special `colorMasters` adapter for `finishes`, `fabricColors`, and `ropeColors` that sent an `image_url` field to Supabase. The current master tables do not have an `image_url` column, so PostgREST returned PGRST204 / Supabase 400:

> Could not find the 'image_url' column of 'finishes' in the schema cache

## Fixes
1. All material-master writes now use the strict `masters` adapter: `id`, `code`, `name` only.
2. Removed the unused `colorMasters` write path so the same mismatch cannot recur for finishes/fabric colors/rope colors.
3. Changed generic `saveCollection()` to UPSERT first and delete obsolete rows second. A failed write can no longer delete old rows before the replacement write succeeds.
4. Audited every current `saveCollection()`/`upsertRows()` write path in the v42 source. The remaining image fields are only on tables where the existing app schema already uses them: `samples.image_url`, `tasks.image_url`, and `sample_components.proof_image_url`.

## Deployment
Replace the v42 files with:
- `tanhoa_erp.jsx`
- `supabaseRest.js`

Do not run a new SQL migration for this fix.

Keep these existing backend files unchanged:
- `api/erp-assistant.js`
- `api/parse-description.js`

## Validation performed
- `supabaseRest.js` passes Node syntax check.
- Source inspection confirms there is no remaining `colorMasters` write path.
- Full Vite build was not run because the environment does not contain the project's installed frontend dependencies.
