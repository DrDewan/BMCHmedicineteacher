# Document Processing

## Goal
Keep original files intact while creating browser-friendly teaching previews and searchable page/slide text.

## Implemented pipeline

UPLOAD → VALIDATE → STORE ORIGINAL → MARK `pending` → TRIGGER WORKER → CONVERT → RENDER SLIDES/PAGES → EXTRACT TEXT → STORE DERIVATIVES → MARK `ready`.

The original upload is never overwritten.

## By file type

### PDF
Original remains canonical and opens directly in the browser teaching viewer. PDF processing is not currently required before viewing.

### PPT / PPTX
Implemented.

1. Original PowerPoint is stored privately in Supabase Storage.
2. The resource version is created with `processing_status = pending`.
3. The resource detail page automatically calls the protected processing trigger for authorised editors.
4. The Next.js route forwards only the resource/version IDs to the document worker using `DOCUMENT_WORKER_SECRET`.
5. The worker downloads the original with its server-only Supabase secret key.
6. Headless LibreOffice converts the file to PDF.
7. Poppler `pdftoppm` renders full slide PNGs and smaller thumbnails.
8. `pdftotext` extracts page/slide text.
9. The private preview PDF, slide images and thumbnails are uploaded under the immutable resource/version path.
10. `resource_pages` stores slide number, text, image path and thumbnail path.
11. `resource_versions.preview_path` points to the generated preview PDF and status becomes `ready`.
12. The BMCH slide viewer serves signed URLs, previous/next navigation, zoom, fullscreen, keyboard controls and a thumbnail strip.

### DOC / DOCX
The same LibreOffice/Poppler pipeline is implemented and produces page previews. The primary immediate use case is PowerPoint, but Word documents use the same worker.

### Image
Original is immediately viewable; no document worker is required.

## Worker implementation

Location:

`services/document-worker/`

Runtime components:

- Node.js 22
- Express
- Supabase server client
- LibreOffice Impress/Common
- Poppler utilities

Docker image:

`services/document-worker/Dockerfile`

The worker is deliberately separate from the Next.js/Vercel application because LibreOffice and Poppler are heavyweight native binaries.

## Security

The worker requires:

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`
- `DOCUMENT_WORKER_SECRET`

The web app requires:

- `DOCUMENT_WORKER_URL`
- `DOCUMENT_WORKER_SECRET`

The shared worker secret is sent only server-to-server. Supabase secret/service-role credentials never enter browser code.

## Idempotency and retry

The worker uses deterministic derivative paths for each resource version. Before reprocessing it removes the previous page records and known preview assets, then rebuilds the derivative set.

The UI supports:

- automatic processing after a new Office upload,
- `processing` status with automatic page refresh,
- `Retry preview` after failure,
- preservation/download of the original regardless of conversion failure.

## Failure behavior

On worker failure:

- `processing_status = failed`
- `processing_error` stores a bounded technical message
- original remains intact
- editor can retry processing
- viewer does not pretend a preview exists

## Deployment

The Next.js app may remain on Vercel.

Deploy the Docker worker to a persistent container platform such as Railway, Render, Fly.io, Cloud Run, ECS or a small VPS, then set `DOCUMENT_WORKER_URL` in the web application.

See `services/document-worker/README.md` for environment variables and Docker commands.

## Visual AI note

For visually important PPTX/DOCX material, future AI analysis should use the generated PDF/page imagery as well as extracted text because embedded diagrams, radiographs and charts may carry essential medical information.
