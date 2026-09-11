-- Tân Hòa ERP v21 — Digital Sample Passport public endpoint
-- Run this entire script in Supabase SQL Editor.

CREATE OR REPLACE FUNCTION public.get_public_sample(p_sample_id TEXT)
RETURNS JSONB
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN s.id IS NULL THEN NULL::jsonb
    ELSE jsonb_build_object(
      'id', s.id,
      'name', COALESCE(s.name, ''),
      'customer', COALESCE(c.name, ''),
      'productType', COALESCE(pt.name, ''),
      'erpNo', COALESCE(s.erp_no, ''),
      'manufacturingOrderNo', COALESCE(s.manufacturing_order_no, ''),
      'idpNo', COALESCE(s.idp_no, ''),
      'idcNo', COALESCE(s.idc_no, ''),
      'currentRevision', COALESCE(s.current_revision::text, ''),
      'stage', COALESCE(s.stage, 'Request Received'),
      'targetDate', COALESCE(s.target_date::text, ''),
      'nextAction', COALESCE(s.next_action, ''),
      'image', COALESCE(s.image_url, ''),
      'mainMaterial', COALESCE(mm.name, ''),
      'finish', COALESCE(f.name, ''),
      'woodSurfaceTreatment', COALESCE(wst.name, ''),
      'fabric', TRIM(BOTH ' · ' FROM CONCAT_WS(' · ', NULLIF(ft.name, ''), NULLIF(fc.name, ''))),
      'rope', TRIM(BOTH ' · ' FROM CONCAT_WS(' · ', NULLIF(rt.name, ''), NULLIF(rc.name, ''))),
      'ropeColor', COALESCE(rc.name, ''),
      'metal', COALESCE(s.metal_name, ''),
      'metalColor', COALESCE(s.metal_color, ''),
      'cemboardColor', COALESCE(cc.name, ''),
      'hardware', COALESCE(s.hardware, ''),
      'construction', COALESCE(s.construction, ''),
      'dimensions', CASE
        WHEN s.width IS NULL AND s.depth IS NULL AND s.height IS NULL THEN ''
        ELSE CONCAT(COALESCE(s.width::text, '—'), ' × ', COALESCE(s.depth::text, '—'), ' × ', COALESCE(s.height::text, '—'), ' mm')
      END,
      'materials', COALESCE((
        SELECT jsonb_agg(
          jsonb_build_object(
            'name', COALESCE(sc.component_name, 'Material'),
            'qty', COALESCE(sc.qty::text, ''),
            'status', COALESCE(sc.status, 'Waiting'),
            'dueDate', COALESCE(sc.target_date::text, ''),
            'proofImage', COALESCE(sc.proof_image_url, '')
          ) ORDER BY sc.component_name
        )
        FROM sample_components sc
        WHERE sc.sample_id = s.id
      ), '[]'::jsonb)
    )
  END
  FROM samples s
  LEFT JOIN customers c ON c.id = s.customer_id
  LEFT JOIN product_types pt ON pt.id = s.product_type_id
  LEFT JOIN main_materials mm ON mm.id = s.main_material_id
  LEFT JOIN finishes f ON f.id = s.finishes_color_id
  LEFT JOIN wood_surface_treatments wst ON wst.id = s.wood_surface_treatment_id
  LEFT JOIN fabric_types ft ON ft.id = s.fabric_type_id
  LEFT JOIN fabric_colors fc ON fc.id = s.fabric_color_id
  LEFT JOIN rope_types rt ON rt.id = s.rope_type_id
  LEFT JOIN rope_colors rc ON rc.id = s.rope_color_id
  LEFT JOIN cemboard_colors cc ON cc.id = s.cemboard_color_id
  WHERE s.id = p_sample_id
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_public_sample(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_sample(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_sample(TEXT) TO authenticated;

-- Read-only public endpoint. It intentionally exposes only sample/passport-safe fields.
