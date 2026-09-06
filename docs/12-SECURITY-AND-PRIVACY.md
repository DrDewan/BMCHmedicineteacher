# Security and Privacy

## Clinical boundary
V1 is an educational platform, not an EHR. Do not store identifiable patient information as routine product data.

## Clinical media
Internal images/radiology must be de-identified and appropriately authorized/consented for educational use. Store source/ownership, consent/authorization status where required and approver metadata. External assets should retain creator/source/licence attribution.

## Upload security
Validate allowed extension, detected/declared MIME and size. Treat filenames as display input only. Reject or sanitize active formats such as SVG initially. Add malware scanning in the worker as the platform matures.

## Secrets
Never expose `SUPABASE_SERVICE_ROLE_KEY`, OpenAI/provider keys, document-worker shared secret or Vercel tokens to browser bundles. Only intended publishable Supabase values may use `NEXT_PUBLIC_`.

## Database
Enable RLS on exposed tables. Do not use `SECURITY DEFINER` as a shortcut around authorization. Protect views/functions appropriately. UPDATE policies require both row selection and `WITH CHECK` semantics.

## Storage
Private buckets. Immutable ID paths. Avoid overwrite-heavy workflows; create new versions. Permanent deletion removes previews/thumbnails after authorization.

## Auditability
Log privileged mutations and question approvals. Keep AI generation provenance. Avoid logging sensitive file contents or API secrets.

## AI governance
Unreviewed output is labelled as AI generated/unreviewed. Human approval is mandatory for official question-bank publication.
