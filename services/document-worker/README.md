# BMCH Document Worker

Containerised document-processing service for BMCH Medicine Education.

## Purpose

The Next.js application remains deployable to Vercel. Office conversion runs here because LibreOffice and Poppler are heavyweight native binaries and should not live inside ordinary Vercel request handlers.

Current processing flow:

1. Receive an authenticated `/process` request containing a resource ID and version ID.
2. Download the private original file from Supabase Storage using the server-only secret key.
3. Convert PPT/PPTX/DOC/DOCX to PDF with headless LibreOffice.
4. Render full page/slide PNGs and small thumbnails with Poppler `pdftoppm`.
5. Extract page text with `pdftotext`.
6. Upload the generated private preview assets to Supabase Storage.
7. Populate `resource_pages` and mark the resource version `ready`.
8. On failure, preserve the original and mark the version `failed` with a retryable error.

## Environment

Required:

```bash
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SECRET_KEY=<server-only Supabase secret/service role key>
DOCUMENT_WORKER_SECRET=<long random shared secret>
```

Optional:

```bash
PORT=8080
STORAGE_BUCKET=bmch-resources
```

`DOCUMENT_WORKER_SECRET` must be identical in the worker and the main Next.js application's `DOCUMENT_WORKER_SECRET` environment variable.

The Next.js application also needs:

```bash
DOCUMENT_WORKER_URL=https://your-worker.example.com
DOCUMENT_WORKER_SECRET=<same shared secret>
```

## Docker

Build:

```bash
docker build -t bmch-document-worker services/document-worker
```

Run:

```bash
docker run --rm -p 8080:8080 \
  -e SUPABASE_URL=... \
  -e SUPABASE_SECRET_KEY=... \
  -e DOCUMENT_WORKER_SECRET=... \
  bmch-document-worker
```

Health check:

```bash
curl http://localhost:8080/health
```

## Hosting

Deploy the Docker image to a container host such as Railway, Render, Fly.io, Cloud Run, ECS or a small VPS. The main BMCH web application may remain on Vercel.

The worker endpoint must not be exposed without `DOCUMENT_WORKER_SECRET`. Supabase secret/service-role credentials are worker-only and must never be sent to the browser.
