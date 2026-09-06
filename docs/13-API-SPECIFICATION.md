# API Specification

Use direct authenticated Supabase reads where appropriate; do not create route handlers merely to wrap every query. Server routes/actions handle privileged writes, AI, export and processing orchestration.

## Resource operations
- `POST /api/resources/upload-init` validate metadata and initialize resource/version/upload.
- `POST /api/resources/upload-complete` finalize upload and enqueue processing.
- `PATCH /api/resources/:id` rename/edit metadata/structured content.
- `DELETE /api/resources/:id` soft delete.
- `POST /api/resources/:id/restore` restore.
- `POST /api/resources/:id/reprocess` privileged preview reprocessing.

## Questions
- `POST /api/questions/generate`
- `PATCH /api/questions/:id`
- `POST /api/questions/:id/approve`
- `POST /api/questions/:id/reject`

## Presentations
- `POST /api/presentations`
- `PATCH /api/presentations/:id`
- `POST /api/presentations/:id/slides`
- `PATCH /api/slides/:id`
- `DELETE /api/slides/:id`
- `POST /api/presentations/:id/export/pptx`

## Practice
- `POST /api/practice/start`
- `POST /api/practice/:id/answer`

## Document Worker internal contract
`POST /process` receives resource version ID, storage location and MIME type. Worker returns/stores per-page text, preview path, thumbnails/images and processing outcome. Requests require service authentication.

## Error shape
Return machine-readable code, human-safe message and optional field details. Do not return raw stack traces/secrets in production.

## Validation
All write inputs use Zod schemas shared where practical between UI and server.
