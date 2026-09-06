# Acceptance Criteria

## Foundation
- Repository builds with supported Node/npm versions.
- TypeScript strict mode passes.
- Production `next build` succeeds.
- Vercel can deploy without document-worker binaries.
- Environment validation fails clearly when required variables are missing.

## Resource Library
Authorized editor can upload supported files, assign category/title/tags/visibility, rename without moving storage object, replace as new version, search, open, download original, soft delete and restore.

## Viewers
PDF: reliable load, thumbnails, navigation, zoom, fit and fullscreen.
PPTX: preview slides, thumbnails, navigation and fullscreen.
Images: zoom/fullscreen.
X-ray: zoom/pan and reveal interpretation.
ECG: zoom and reveal structured interpretation.

## Structured content
Editor can create/update a staged case, worked investigation and illustrated procedure; viewer renders them in teaching-friendly form.

## Presentation Builder
Editor can create/rename deck, add template slides, insert existing resources, reorder/duplicate/delete, save, preview, present fullscreen and export PPTX.

## AI Questions
Editor can choose source/range/type/count/difficulty, generate structured drafts, see provenance, edit, approve/reject/regenerate. Drafts are excluded from approved practice pool.

## Practice
User can start a mixed round, receive approved diverse question types, answer/reveal, see explanation, finish, see score/breakdown and start another round.

## Security
RLS is enabled on exposed tables, private files are not anonymously reachable, service secrets never appear in client bundles, viewer role cannot perform editor/admin mutations, and identifiable patient data is not included in demo seed content.
