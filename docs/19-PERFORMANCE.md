# Performance and Latency

## Goal

Keep the BMCH Medicine Education site responsive for users in Bangladesh while preserving the existing Supabase/RLS security model and the separate document-processing worker.

## Baseline observed on 2026-09-06

The first production web deployment ran on Railway in US East (`iad`) while Supabase is in Mumbai (`ap-south-1`). Railway HTTP logs from normal Chrome usage in Bangladesh showed that static assets were generally fast, but several authenticated/data-driven routes were slow.

Representative server `totalDuration` values before the optimization pass:

| Route | Observed server duration |
| --- | ---: |
| Static Next.js JS chunks | ~3–17 ms |
| Normal `/login` GET | ~7–34 ms |
| `/upload` | ~18–61 ms |
| `/` authenticated homepage | ~651 ms |
| `/create` | ~515–857 ms |
| `/library/teaching-materials` | ~683–1,438 ms |
| `/library/ecg` | ~1,695 ms |
| One resource detail request | ~1,479 ms |
| Login POST | ~3,593 ms |

These numbers indicated that the application was not primarily suffering from a large frontend bundle. Static files and many dynamic routes were already fast. The dominant problem was server/database latency on routes that needed Supabase.

## Root cause

The initial topology was inefficient for a Bangladesh-based internal application:

`Dhaka user -> Railway US East -> Supabase Mumbai -> Railway US East -> Dhaka user`

Authenticated pages can perform multiple Supabase operations, so cross-region latency compounds when database/auth calls occur sequentially.

## Changes implemented

### 1. Web runtime moved to Singapore

The Railway `web` service was moved from `iad` (US East) to `sin` (Singapore), with:

- one replica preserved,
- the existing public domain preserved,
- all environment variables preserved,
- GitHub `main` source preserved,
- document worker left unchanged.

Current web topology:

`Dhaka user -> Railway Singapore -> Supabase Mumbai`

This is the preferred production placement while the Supabase project remains in Mumbai.

### 2. Login round trip removed

`app/login/actions.ts` previously performed:

1. `signInWithPassword`,
2. `getClaims`,
3. profile activation query.

`signInWithPassword` already returns the verified authenticated user. The redundant `getClaims()` call was removed. The database-backed `profiles.is_active` check remains mandatory.

### 3. Category + resource lookup collapsed

`app/library/[category]/page.tsx` previously performed a category lookup and then a separate resources query.

The route now retrieves the category and its visible resources in one PostgREST request using the existing RLS policies. This reduces one database round trip on every category page.

### 4. Immediate loading state

`app/loading.tsx` now renders the BMCH tile skeleton immediately while a dynamic route is resolving. This does not hide backend problems, but it prevents a blank/frozen-feeling transition and improves perceived responsiveness.

## Security constraints

Performance work must not bypass:

- Supabase RLS,
- account activation checks,
- private storage,
- authenticated server-side resource access.

Do not cache one user's profile/resource permissions into a globally shared cache.

## Performance targets

For ordinary authenticated navigation after the Singapore move:

- simple dynamic routes: target < 250 ms server time,
- category/library routes: target < 400 ms server time,
- homepage: target < 400 ms server time,
- repeated normal login: target materially below the original ~3.6 s baseline,
- static assets: remain in the tens-of-milliseconds server range.

These are engineering targets, not guaranteed Internet round-trip times from every Bangladesh ISP.

## Follow-up measurement

Use Railway HTTP logs after normal authenticated use and compare `totalDuration` by route against the baseline above. Prioritize any route that repeatedly remains above ~400 ms after the region move.

If a route remains slow, inspect in this order:

1. sequential Supabase queries,
2. duplicate auth/profile work,
3. unnecessary signed-URL creation,
4. oversized result sets,
5. large media requested before it is visible,
6. client-side bundle/rendering only after server latency is ruled out.

Do not spend time on micro-optimizing CSS/icons while server/database latency dominates.
