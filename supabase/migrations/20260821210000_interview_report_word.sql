-- Allow Word analyses (.doc / .docx) alongside PDF for interview partner uploads.
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]::text[]
WHERE id = 'interview-reports';
