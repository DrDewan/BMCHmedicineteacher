# Deployment

## Current hosting status — 18 September 2026

The repository remains deployable, but the former Railway workloads are not currently serving production traffic.

### Web application

The Railway project **BMCH Medicine Education** still exists, but its `web` service had no active deployment or running replicas when the document-worker decommission was recorded.

Historical configuration:

- Railway project: **BMCH Medicine Education**
- Service: `web`
- Source: `DrDewan/BMCHmedicineteacher`, branch `main`
- Historical public URL: `https://web-production-ad1ad4.up.railway.app`
- Runtime: Next.js 16.3.3
- Historical production region: Singapore (`sin`)
- Supabase region: Mumbai (`ap-south-1`)

The web application remains Vercel-compatible. Before describing BMCH Medicine Education as live again, deploy the current `main` branch, verify its environment variables and test protected flows.

### Document worker — decommissioned

The standalone Railway project **BMCH Medicine Document Worker** was decommissioned to free limited Railway plan capacity for another active project.

Historical configuration:

- Railway project: `BMCH Medicine Document Worker`
- Service: `document-worker`
- Source repository: `DrDewan/BMCHmedicineteacher`
- Source root: `services/document-worker`
- Builder: `Dockerfile`
- Historical public URL: `https://document-worker-production-4a6c.up.railway.app`
- Health endpoint: `/health`
- Historical region: US East (`iad`)
- Runtime dependencies: LibreOffice + Poppler
- Attached volumes: none

At decommission time the worker was already offline and its latest deployment had failed. Deleting the Railway project removes only Railway configuration, variables, domain and deployment history. It does not delete originals, generated previews already stored in Supabase, database records, the Supabase bridge or worker source code.

Full deletion context and a redeployment runbook are in:

`docs/25-DOCUMENT-WORKER-DECOMMISSION-AND-REDEPLOYMENT.md`

Until a replacement worker is deployed, new PPT/PPTX/DOC/DOCX preview conversion and retry processing will not complete. Existing originals and previously generated derivatives remain available according to normal permissions.

### Supabase bridge

The privileged document-processing bridge remains implemented as a Supabase Edge Function:

`https://krktgoibpaijvgwakqsg.supabase.co/functions/v1/document-worker-bridge`

The document worker does **not** need a Supabase service-role/secret key. The web app creates a temporary signed URL for the original file. The worker downloads it, converts it, obtains short-lived signed upload tokens from the bridge, uploads derivatives, and asks the bridge to finalize `resource_pages` and `resource_versions`.

The bridge authenticates the worker using a high-entropy shared credential whose SHA-256 hash is stored in `document_worker_credentials`. Never commit or display the plaintext credential.

---

## Vercel compatibility

The Next.js repository must remain deployable through ordinary Vercel Git integration. No LibreOffice, Poppler or worker-only native binaries are required by the web application.

When Vercel is used:

- import `DrDewan/BMCHmedicineteacher`;
- use repository root as the project root;
- use `main` for production;
- allow non-production branches to create preview deployments where appropriate;
- configure browser-safe Supabase values and required server-only variables;
- choose a runtime region appropriate for Bangladesh and Supabase Mumbai when region choice is available.

## Build requirements

- `npm ci` or the repository's locked npm install
- `npm run lint`
- `npm run typecheck`
- `npm test` where configured
- `npm run build`

CI should continue compiling the document worker and building its Docker image even while no production worker is deployed. This preserves redeployability.

Do not require LibreOffice or Poppler in the web/Vercel build.

## Web environment variables

Browser-safe:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Server-only:

- `DOCUMENT_WORKER_URL`
- `DOCUMENT_WORKER_SECRET`
- `SUPABASE_SECRET_KEY` only for server features that explicitly use `createAdminClient`; it is not required by the document-processing bridge flow
- `OPENAI_API_KEY` when AI features are enabled

Never expose server-only variables through `NEXT_PUBLIC_*` names.

While no worker is deployed, `DOCUMENT_WORKER_URL` must not be treated as proof that conversion is available. The target must pass `/health` before Office processing is enabled or announced as restored.

## Worker environment variables

Required for a replacement worker:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `DOCUMENT_WORKER_SECRET`
- `DOCUMENT_BRIDGE_URL`

Optional:

- `STORAGE_BUCKET` — defaults to `bmch-resources`
- `PORT` — normally supplied by the host

The worker intentionally uses the publishable key only. Privileged database/storage actions remain inside the Supabase Edge Function.

A fresh worker deployment should preferably rotate `DOCUMENT_WORKER_SECRET`. Configure the same new plaintext value in the worker and web server, and register its SHA-256 hash in `document_worker_credentials`. Do not commit the plaintext secret.

## Supabase

Production schema changes use versioned migrations in `supabase/migrations`. RLS/security is reviewed before deployment. Storage buckets remain private.

The `document_worker_credentials` table intentionally has RLS enabled with no client policies and direct `anon`/`authenticated` access revoked; it is a backend credential registry, not a client-readable table.

Deleting Railway infrastructure does not delete this table, the bridge function, private storage objects or document metadata.

## CI/CD

GitHub Actions verifies:

### Web

- dependency install
- TypeScript
- ESLint
- production Next.js build

### Worker

- dependency install
- TypeScript compile
- Docker image build with LibreOffice/Poppler

No automatic Railway production deployment should be assumed while the old projects/services are offline or deleted. A future deployment must explicitly connect the repository/root directory, configure secrets, set health checks and validate the resulting deployment SHA.

## Rollback and restoration

Web rollback uses the chosen hosting platform's deployment rollback mechanism.

The deleted Railway worker's deployment history will no longer be available after project deletion. Restoration should therefore use:

- the Git history in this repository;
- `services/document-worker/Dockerfile`;
- `services/document-worker/README.md`;
- `docs/25-DOCUMENT-WORKER-DECOMMISSION-AND-REDEPLOYMENT.md`.

Database migrations must use safe forward/backward rollout strategy; a web or worker rollback does not reverse schema changes.
