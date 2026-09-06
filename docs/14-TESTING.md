# Testing

## Required verification before release
Type check, lint, unit/integration tests, production build, protected-route/authorization checks, and Vercel-compatible build verification.

## Unit tests
Validation schemas, permission helpers, question schema, practice scoring/selection, slide operations, resource-type dispatch.

## Integration tests
Upload lifecycle, metadata rename, version replacement, soft delete/restore, signed access, question generation review workflow, presentation CRUD/export orchestration, practice persistence.

## Browser/E2E tests
Homepage and category navigation; PDF viewer load/fullscreen; slide viewer; image/X-ray/ECG presentation controls; presentation builder reorder/preview; practice answer/reveal/score; auth access boundaries.

## File matrix
PDF: 1 page, 100+ pages, portrait/landscape, selectable text, scanned image.
PPTX: text, images, chart-heavy, complex layout, 50+ slides.
DOCX: text/tables/images.
Images: portrait/landscape/high resolution.

## Failure tests
Preview worker offline, corrupt Office file, failed thumbnail, unauthorized signed URL request, AI timeout/schema failure, empty question pool, deleted source resource.

## Medical content QA
Seed/demo medical content must be clearly non-patient-specific. AI outputs in tests remain drafts and must not be treated as approved clinical guidance.
