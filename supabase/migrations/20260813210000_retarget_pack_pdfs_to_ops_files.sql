-- PDFs de packs estáticos ya ingeridos en ops-files: apuntar documents al storage autenticado.
-- Idempotente: solo toca filas que aún apuntan a client-packs.

WITH map(old_path, new_path, sha, org_id) AS (
  VALUES
    ('client-packs/kaucho/contrato-firmado.pdf', 'projects/9a478cdb-6fed-431c-a842-5fdf1c2e3a07/documents/contrato-firmado.pdf', '143d1a4bab2ce75c6f5cb9a6ce725691c1dd03bf63ce40e79b31ebf939d362bb', NULL::uuid),
    ('client-packs/kaucho/nda-firmado.pdf', 'organizations/d8f9a9a6-132c-4eb5-8b30-868060b7216b/nda/nda-firmado.pdf', 'fac3baebfb9cf505ec91106d42f04add3d13b99ba56abd0823e49e29dd825ca0', 'd8f9a9a6-132c-4eb5-8b30-868060b7216b'::uuid),
    ('client-packs/riser/contrato.pdf', 'projects/b11c82f4-38d2-418d-9c19-f99742c293e6/documents/contrato.pdf', 'b988275456c0b7118b6951260ff72b3a0fa1f6abcaf3be615b81d9abc9c97d55', NULL::uuid),
    ('client-packs/riser/nda.pdf', 'organizations/8a9c77cb-d1d2-4e0a-bfad-873e83b7b8f5/nda/nda.pdf', '7e8a259810ad9c36c9a90f253da9bbc2f280be3159f57425e840874984e966ce', '8a9c77cb-d1d2-4e0a-bfad-873e83b7b8f5'::uuid),
    ('client-packs/riser/cotizacion.pdf', 'projects/b11c82f4-38d2-418d-9c19-f99742c293e6/documents/cotizacion.pdf', '9099dff3efe65ca82931e8c364042025d461f3dd4893b8c6494ff563d8d895ae', NULL::uuid),
    ('client-packs/kaucho/cotizacion-web.pdf', 'projects/9a478cdb-6fed-431c-a842-5fdf1c2e3a07/documents/cotizacion-web.pdf', 'a93e4695367a32592abf06d08073d00a6c299d3cabe01adbb16e7bba23710df4', NULL::uuid),
    ('client-packs/kaucho/cotizacion-catalogo-eshop.pdf', 'projects/9a478cdb-6fed-431c-a842-5fdf1c2e3a07/documents/cotizacion-catalogo-eshop.pdf', '32f474933f10a98aabb650e526083b02d44f507c2b7ed272817fa6aa60b7e566', NULL::uuid),
    ('client-packs/fes/cotizacion-eshop.pdf', 'projects/836bffdd-5615-4b74-bf95-d32a19d53794/documents/cotizacion-eshop.pdf', '6c60e5f0e07735a1f8d751fb347b09c21490a950cf15cefb4703030fa48b88c6', NULL::uuid)
)
UPDATE public.documents d
SET
  file_path = m.new_path,
  file_url = '/api/ops/file?path=' || replace(m.new_path, '/', '%2F'),
  content_sha256 = m.sha,
  organization_id = COALESCE(m.org_id, d.organization_id)
FROM map m
WHERE d.file_path = m.old_path
   OR d.file_url = '/' || m.old_path
   OR d.file_url = m.old_path;
