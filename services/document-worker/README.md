# BMCH Document Worker

Containerised document-processing service for BMCH Medicine Education.

## Purpose

The Next.js application remains deployable to Vercel. Office conversion runs here because LibreOffice and Poppler are heavyweight native binaries and should not live inside ordinary Vercel request handlers.

## Current processing flow

1. The authenticated Next.js API creates a short-lived signed URL for the private original PPT/PPTX/DOC/DOCX file.
2. The app calls the worker `/process` endpoint using `DOCUMENT_WORKER_SECRET`.
3. The worker downloads the original through the signed URL. It does **not** hold a Supabase admin/service-role key.
4. Headless LibreOffice converts the document to PDF.
5. Poppler `pdftoppm` generates full slide/page PNGs and small thumbnails.
6. `pdftotext` extracts page/slide text.
7. The worker calls the Supabase Edge Function `document-worker-bridge` using the same worker secret.
8. The Edge Function verifies the SHA-256 hash of that worker secret in `document_worker_credentials` and creates signed upload tokens for the requested private preview paths.
9. The worker uploads PDF/PNG derivatives to the private `bmch-resources` bucket with those signed tokens.
10. The bridge inserts `resource_pages` and marks the version `ready`.
11. On failure, the bridge marks the version `failed`; the original uploaded document remains intact and can be retried.

This design deliberately keeps Supabase secret/service-role credentials inside Supabase's own Edge Function environment rather than exposing them to Railway.

## Worker environment

Required:

```bash
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_PUBLISHABLE_KEY=<Supabase publishable key>
DOCUMENT_WORKER_SECRET=<long random shared secret>
DOCUMENT_BRIDGE_URL=https://<project-ref>.supabase.co/functions/v1/document-worker-bridge
```

Optional:

```bash
PORT=8080
STORAGE_BUCKET=bmch-resources
```

The publishable key is intentionally low privilege. Private preview writes are authorised with short-lived signed upload tokens created by the bridge.

`DOCUMENT_WORKER_SECRET` must be identical in Railway and the main Next.js application's server-only `DOCUMENT_WORKER_SECRET` variable. Never expose it through `NEXT_PUBLIC_*` variables or browser code.

## Main web application environment

The Next.js application requires:

```bash
DOCUMENT_WORKER_URL=https://your-worker.example.com
DOCUMENT_WORKER_SECRET=<same shared secret>
```

It also needs the normal browser-safe Supabase configuration documented in the repository root `.env.example`.

## Docker

Build:

```bash
docker build -t bmch-document-worker services/document-worker
```

Run:

```bash
docker run --rm -p 8080:8080 \
  -e SUPABASE_URL=... \
  -e SUPABASE_PUBLISHABLE_KEY=... \
  -e DOCUMENT_WORKER_SECRET=... \
  -e DOCUMENT_BRIDGE_URL=... \
  bmch-document-worker
```

Health check:

```bash
curl http://localhost:8080/health
```

Expected response:

```json
{"status":"ok","service":"bmch-document-worker","activeJobs":0}
```

## Hosting

The production worker is intended for a Docker-capable host such as Railway. The main BMCH web application remains suitable for Vercel.

The `/process` endpoint requires the worker secret. `/health` is intentionally unauthenticated for platform health monitoring and does not expose data or credentials.
