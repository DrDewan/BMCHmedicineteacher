# Deployment

## Current production deployment

The application is currently live on Railway while remaining Vercel-compatible.

### Web application

- Railway project: **BMCH Medicine Education**
- Service: `web`
- Source: `DrDewan/BMCHmedicineteacher`, branch `main`
- Public URL: `https://web-production-ad1ad4.up.railway.app`
- Runtime: Next.js 16.3.3
- Production deployment follows GitHub `main`.

### Document worker

- Railway project: **BMCH Medicine Document Worker**
- Service: `document-worker`
- Source root: `services/document-worker`
- Builder: Dockerfile
- Public URL: `https://document-worker-production-4a6c.up.railway.app`
- Health endpoint: `/health`
- Runtime dependencies: LibreOffice + Poppler
- Production deployment follows GitHub `main`.

### Supabase bridge

The privileged document-processing bridge is deployed as Supabase Edge Function:

`https://krktgoibpaijvgwakqsg.supabase.co/functions/v1/document-worker-bridge`

The Railway worker does **not** receive a Supabase service-role/secret key. The web app creates a temporary signed URL for the original file. The worker downloads it, converts it, obtains short-lived signed upload tokens from the bridge, uploads the derivatives, and asks the bridge to finalize `resource_pages` and `resource_versions`.

The bridge authenticates the worker using a high-entropy shared worker credential whose SHA-256 hash is stored in `document_worker_credentials`. Never commit or display the plaintext credential.

---

## Vercel compatibility

The Next.js repository must remain deployable through ordinary Vercel Git integration. No LibreOffice, Poppler or other worker-only native binaries are required by the web application.

When Vercel is used:

- import `DrDewan/BMCHmedicineteacher`,
- use repository root as the project root,
- `main` is production,
- non-production branches may create preview deployments,
- configure the same browser-safe Supabase values and server-only document-worker values used by the live Railway web service.

The connected Vercel management surface available during the initial deployment could inspect projects but could not create a new Git-linked project or write its environment variables. Railway therefore provides the initial live web deployment without changing the application's Vercel-compatible architecture.

## Build requirements

- `npm ci` or the repository's locked npm install
- `npm run lint`
- `npm run typecheck`
- `npm test` where configured
- `npm run build`

CI also compiles the document worker and builds its Docker image.

Do not require local-only binaries such as LibreOffice in the Vercel/web build.

## Web environment variables

Browser-safe:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Server-only:

- `DOCUMENT_WORKER_URL`
- `DOCUMENT_WORKER_SECRET`
- `SUPABASE_SECRET_KEY` only for future server features that explicitly use `createAdminClient`; it is not required by the current document-processing flow
- `OPENAI_API_KEY` when AI features are enabled

Never expose server-only variables through `NEXT_PUBLIC_*` names.

## Worker environment variables

Required:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `DOCUMENT_WORKER_SECRET`
- `DOCUMENT_BRIDGE_URL`

Optional:

- `STORAGE_BUCKET` (defaults to `bmch-resources`)
- `PORT` (Railway supplies this automatically)

The worker intentionally uses the publishable key only. Privileged database/storage actions stay inside the Supabase Edge Function.

## Supabase

Production schema changes use versioned migrations in `supabase/migrations`. RLS/security is reviewed before deployment. Storage buckets remain private.

The `document_worker_credentials` table intentionally has RLS enabled with no client policies and direct `anon`/`authenticated` access revoked; it is a backend credential registry, not a client-readable table.

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

Railway services track GitHub `main` for automatic production deploys.

## Rollback

Web rollback uses the hosting platform's deployment rollback mechanism. Worker rollback uses Railway deployment history. Database migrations must be designed with safe forward/backward rollout strategy rather than assuming a web rollback reverses schema changes.
