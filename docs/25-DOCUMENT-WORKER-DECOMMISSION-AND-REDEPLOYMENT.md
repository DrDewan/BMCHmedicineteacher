# Document Worker Decommission and Redeployment

**Decision date:** 18 September 2026  
**Status:** Railway document-worker deployment decommissioned / project scheduled for deletion  
**Source code remains:** `services/document-worker/`

## Why this record exists

The standalone Railway deployment for the BMCH document worker was removed to free limited Railway plan capacity for the ClassOS compute-runtime pilot.

This was an infrastructure-capacity decision, not a decision to remove document conversion from the BMCH Medicine Education product. The worker source code, Dockerfile, Supabase bridge, database schema and private storage design remain in this repository and may be redeployed later.

## Railway deployment being removed

Historical deployment details:

- Railway project: `BMCH Medicine Document Worker`
- Railway project ID: `81fdcd06-05be-445c-bd77-48c2451fe6e1`
- Environment: `production`
- Environment ID: `60e53149-7c7b-47a9-b3b3-6098d0d38054`
- Service: `document-worker`
- Service ID: `d7bde0aa-1bc7-4a26-806d-1eb0d469fb43`
- Connected repository: `DrDewan/BMCHmedicineteacher`
- Branch: `main`
- Root directory: `services/document-worker`
- Dockerfile: `services/document-worker/Dockerfile`
- Historical public domain: `document-worker-production-4a6c.up.railway.app`
- Historical target port: `8080`
- Historical region: Railway US East (`iad`)
- Health check: `/health`
- Restart policy: maximum 3 retries
- Watch pattern: `services/document-worker/**`

At decommission time:

- the worker was already offline;
- its latest deployment was failed rather than serving production traffic;
- there were no attached Railway volumes;
- there was no Railway-hosted database;
- no persistent document data was stored inside Railway.

Therefore deleting the Railway project does **not** delete uploaded originals, generated previews already stored in Supabase, resource metadata, the Supabase Edge Function bridge or the worker source code.

## What deletion removes

Deleting the Railway project removes only Railway-side infrastructure, including:

- the `document-worker` service configuration;
- deployment history and logs;
- the Railway-generated public domain;
- Railway environment-variable values;
- region, health-check and restart configuration.

It does not remove:

- `services/document-worker/` from GitHub;
- `supabase/functions/document-worker-bridge`;
- `document_worker_credentials` in Supabase;
- the `bmch-resources` storage bucket;
- original or derived resource files already stored in Supabase;
- `resource_pages` or `resource_versions` records.

## Expected product impact while offline

Until a replacement worker is deployed:

- existing uploaded originals remain available according to normal permissions;
- existing generated previews remain available if their assets already exist;
- new PPT/PPTX/DOC/DOCX files cannot complete server-side LibreOffice/Poppler conversion;
- retrying a failed or pending Office preview will fail until `DOCUMENT_WORKER_URL` points to a healthy replacement worker;
- PDF and image viewing paths that do not require the worker continue to function.

The UI must not claim that Office conversion succeeded when the worker is unavailable.

## Historical Railway environment-variable names

The deleted Railway service had these variable names. Their values were not committed and must not be reconstructed from source control:

Required:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `DOCUMENT_WORKER_SECRET`
- `DOCUMENT_BRIDGE_URL`

Optional:

- `STORAGE_BUCKET` — normally `bmch-resources`
- `PORT` — normally supplied by the host; local/default worker port is `8080`

The main web deployment also requires:

- `DOCUMENT_WORKER_URL`
- `DOCUMENT_WORKER_SECRET`

## Redeployment procedure

The worker is portable and may be redeployed to Railway, Render, Fly.io, Google Cloud Run, ECS, a VPS or any Docker-capable host.

### 1. Create the service

Use:

- repository: `DrDewan/BMCHmedicineteacher`
- branch: `main`
- root directory: `services/document-worker`
- Dockerfile: `Dockerfile` relative to that root
- container port: `8080` unless the host injects `PORT`
- health endpoint: `/health`

No persistent volume is required.

### 2. Configure worker variables

Set the required worker variables listed above. Never place the worker secret or privileged credentials in browser-exposed variables.

### 3. Rotate the shared worker secret

A fresh deployment should preferably use a newly generated high-entropy `DOCUMENT_WORKER_SECRET` rather than attempting to recover the deleted Railway value.

The same plaintext secret must be configured in:

1. the new worker service;
2. the main Next.js application's server-only `DOCUMENT_WORKER_SECRET`;
3. the Supabase credential registry as a SHA-256 hash in `public.document_worker_credentials`.

The table and verifier are defined in:

`supabase/migrations/20260906153000_document_worker_bridge.sql`

Do not commit the plaintext secret or its environment-file value. Deactivate the previous credential row only after the new worker has passed health and end-to-end conversion tests.

### 4. Configure the web application

Set:

- `DOCUMENT_WORKER_URL=https://<new-worker-host>`
- `DOCUMENT_WORKER_SECRET=<same-new-secret>`

Redeploy the web application after changing these server-side variables.

### 5. Validate before declaring the worker restored

Required checks:

1. `GET /health` returns HTTP 200 and `{"status":"ok","service":"bmch-document-worker",...}`.
2. `/process` rejects requests without the correct worker secret.
3. Upload one non-sensitive test PPTX.
4. Confirm status transitions `pending → processing → ready`.
5. Confirm preview PDF, full slide images and thumbnails appear in private storage.
6. Confirm `resource_pages` records are created in correct page order.
7. Confirm extracted text is present where expected.
8. Confirm the BMCH slide viewer loads the generated preview after refresh.
9. Confirm a failed conversion preserves the immutable original and records a bounded error.
10. Remove the test resource after validation if it is not needed.

## Related files

- `services/document-worker/README.md`
- `services/document-worker/Dockerfile`
- `docs/06-DOCUMENT-PROCESSING.md`
- `docs/15-DEPLOYMENT.md`
- `supabase/functions/document-worker-bridge/`
- `supabase/migrations/20260906153000_document_worker_bridge.sql`

## Future decision rule

Do not recreate this worker merely to restore an old architecture. Redeploy it when Office conversion is again needed for active BMCH use, and choose the host based on current cost, region, maintenance burden and reliability requirements.
