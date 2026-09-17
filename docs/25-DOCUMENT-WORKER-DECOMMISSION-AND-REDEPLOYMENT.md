# Document Worker Decommission and Redeployment

**Decision date:** 18 September 2026  
**Deletion completed by user:** 18 September 2026  
**Status:** Railway document-worker project decommissioned; source and recovery instructions preserved  
**Source code remains:** `services/document-worker/`

## Why this record exists

The standalone Railway deployment for the BMCH document worker was removed to free limited Railway plan capacity for the ClassOS compute-runtime pilot.

This was an infrastructure-capacity decision, not a decision to remove Office-document conversion from BMCH Medicine Education. The worker source code, Dockerfile, Supabase bridge, database schema and private storage design remain in this repository and may be redeployed later.

After the deletion was completed, Railway allowed creation of the separate ClassOS project. This confirms that sufficient provisioning capacity was released. Railway APIs may continue to show the deleted project temporarily; do not interpret a stale listing as an active worker deployment.

## Deleted Railway deployment

Historical details:

- Railway project: `BMCH Medicine Document Worker`
- Railway project ID: `81fdcd06-05be-445c-bd77-48c2451fe6e1`
- Environment: `production`
- Environment ID: `60e53149-7c7b-47a9-b3b3-6098d0d38054`
- Service: `document-worker`
- Service ID: `d7bde0aa-1bc7-4a26-806d-1eb0d469fb43`
- Connected repository: `DrDewan/BMCHmedicineteacher`
- Branch: `main`
- Source root: `services/document-worker`
- Dockerfile: `services/document-worker/Dockerfile`
- Historical public domain: `document-worker-production-4a6c.up.railway.app`
- Historical port: `8080`
- Historical region: Railway US East (`iad`)
- Health check: `/health`
- Restart policy: maximum 3 retries
- Watch pattern: `services/document-worker/**`

At deletion time:

- the worker was already offline;
- its latest deployment was failed rather than serving production traffic;
- there were no Railway volumes;
- there was no Railway-hosted database;
- no persistent document data was stored inside Railway.

Therefore the project deletion did **not** delete uploaded originals, existing generated previews in Supabase, resource metadata, the Supabase Edge Function bridge or the worker source code.

## What was removed

Deletion removed Railway-side infrastructure, including:

- the `document-worker` service configuration;
- Railway deployment history/logs;
- Railway-generated domain;
- Railway environment-variable values;
- Railway region, health-check and restart configuration.

Deletion did not remove:

- `services/document-worker/` from GitHub;
- `supabase/functions/document-worker-bridge/`;
- `document_worker_credentials` in Supabase;
- the `bmch-resources` private storage bucket;
- original or derivative resource files already stored in Supabase;
- `resource_pages` or `resource_versions` records.

## Product impact while the worker is offline

Until a replacement worker is deployed:

- existing uploaded originals remain available according to normal permissions;
- already-generated previews remain available when their Supabase assets exist;
- new PPT/PPTX/DOC/DOCX uploads cannot complete LibreOffice/Poppler conversion;
- retrying pending/failed Office preview generation will fail until `DOCUMENT_WORKER_URL` points to a healthy replacement;
- PDF/image paths that do not require the worker continue to function;
- the UI must not claim conversion succeeded while the worker is unavailable.

## Historical environment-variable names

The deleted Railway service used these names. Values were not committed and should not be recovered from repository history.

Required worker variables:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `DOCUMENT_WORKER_SECRET`
- `DOCUMENT_BRIDGE_URL`

Optional:

- `STORAGE_BUCKET` — normally `bmch-resources`
- `PORT` — normally host-supplied; local/default port `8080`

The main web application also requires:

- `DOCUMENT_WORKER_URL`
- `DOCUMENT_WORKER_SECRET`

## Redeployment procedure

The worker remains portable to Railway, Render, Fly.io, Cloud Run, ECS, a VPS or another Docker-capable host.

### 1. Create the service

Use:

- repository: `DrDewan/BMCHmedicineteacher`
- branch: `main`
- source root: `services/document-worker`
- Dockerfile: `Dockerfile` relative to that root
- container port: `8080` unless the host injects `PORT`
- health endpoint: `/health`

No persistent volume is required.

### 2. Configure variables

Set the required worker variables above. Never place the worker secret or privileged credentials in browser-exposed variables.

### 3. Rotate the shared worker secret

A future deployment should generate a new high-entropy `DOCUMENT_WORKER_SECRET` rather than attempting to recover the deleted Railway value.

Configure the same plaintext secret in:

1. the replacement worker;
2. the main Next.js application's server-only `DOCUMENT_WORKER_SECRET`;
3. Supabase's credential registry as a SHA-256 hash in `public.document_worker_credentials`.

The credential table and verifier are defined in:

`supabase/migrations/20260906153000_document_worker_bridge.sql`

Never commit the plaintext secret. Deactivate the previous credential row only after the replacement worker passes health and end-to-end conversion tests.

### 4. Configure the web application

Set:

- `DOCUMENT_WORKER_URL=https://<replacement-host>`
- `DOCUMENT_WORKER_SECRET=<same-new-secret>`

Redeploy the web application after updating these server-side values.

### 5. Validate before declaring restoration

Required checks:

1. `GET /health` returns HTTP 200 and identifies `bmch-document-worker`.
2. `/process` rejects missing/incorrect worker credentials.
3. Upload one non-sensitive test PPTX.
4. Confirm `pending → processing → ready`.
5. Confirm preview PDF, slide images and thumbnails are stored privately.
6. Confirm ordered `resource_pages` records are created.
7. Confirm expected extracted text exists.
8. Confirm the BMCH viewer loads the generated preview.
9. Confirm failure preserves the immutable original and records a bounded error.
10. Remove the test resource if it is no longer needed.

## Related files

- `services/document-worker/README.md`
- `services/document-worker/Dockerfile`
- `docs/06-DOCUMENT-PROCESSING.md`
- `docs/15-DEPLOYMENT.md`
- `supabase/functions/document-worker-bridge/`
- `supabase/migrations/20260906153000_document_worker_bridge.sql`

## Future decision rule

Do not recreate this worker simply to restore the previous hosting diagram. Redeploy it when Office conversion is again needed for active BMCH use, and choose the host based on current cost, region, maintenance burden and reliability requirements.