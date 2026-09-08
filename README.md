# Tân Hòa Outdoor Furniture — Sales ERP

This repository wraps the supplied `tanhoa_erp.jsx` React component in a Vite project so it can be built and deployed on Vercel.

## Local setup

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
npm run preview
```

## Vercel

Recommended settings:

- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

Do not use `brunch build --production`.

## Note

The original ERP component is kept as supplied. If the component expects a special runtime API such as `window.storage`, that API is not provided by Vite/Vercel and may require a separate persistence implementation.
