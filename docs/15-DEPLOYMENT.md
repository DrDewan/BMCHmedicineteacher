# Deployment

## Vercel web application
The Next.js repository must remain deployable through ordinary Vercel Git integration. `main` is production; non-production branches can produce preview deployments.

## Build requirements
- `npm ci`
- `npm run lint`
- `npm run typecheck`
- `npm test` where configured
- `npm run build`

Do not require local-only binaries such as LibreOffice in the Vercel web build.

## Environment variables
Browser-safe:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Server-only:
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY` (when enabled)
- `DOCUMENT_WORKER_URL`
- `DOCUMENT_WORKER_SECRET`

Never commit values. Maintain `.env.example` with blank placeholders.

## Supabase
Production schema changes use versioned migrations in `supabase/migrations`. RLS/security is reviewed before deployment. Storage buckets remain private.

## Document Worker
Deploy separately to a container-capable platform with LibreOffice/PDF tooling. The Vercel app invokes it using authenticated server-side requests.

## CI/CD
Vercel Git integration is the simplest default. If explicit CI is later added, build/test a preview artifact before promotion. Vercel CLI tokens and project IDs belong in CI secrets, never source control.

## Rollback
Web rollback uses Vercel deployment rollback/promotion. Database migrations must be designed with safe forward/backward rollout strategy rather than assuming web rollback reverses schema changes.
