# AGENTS.md

These rules apply to all coding agents and contributors working on BMCH Medicine Education.

## Product constraints
- Keep the homepage simple and tile-based. Do not turn it into a dashboard without explicit approval.
- The core workflow is STORE → FIND → SHOW → TEACH → QUESTION → PRACTISE.
- Do not add LMS-style features, attendance, calendars, messaging, analytics, gamification or social feeds unless explicitly requested.
- Treat `resources` as the core abstraction. A resource may be a file or structured BMCH-native content.
- Preserve original uploaded files. Generate previews/thumbnails separately.
- Resource renaming changes metadata only; storage paths remain immutable.
- Heavy Office/PDF conversion belongs in the Document Worker, not ordinary Vercel request handlers.
- Use a structured medical presentation builder; do not attempt to clone Microsoft PowerPoint.
- Uploaded PPTX/DOCX originals remain downloadable. Normal teaching uses preview derivatives.
- AI-generated medical questions are drafts until reviewed and approved by a human.

## Engineering rules
- Use Next.js App Router and TypeScript strict mode.
- Default to React Server Components. Add `use client` only where browser state/events are required.
- Use Node.js runtime unless a feature has a clear Edge requirement.
- Validate write inputs with Zod.
- Keep service-role and AI secrets server-only. Never prefix them with `NEXT_PUBLIC_`.
- Use Supabase RLS on every exposed table. Authorization must not rely on user-editable `user_metadata`.
- Prefer immutable IDs in URLs and storage paths.
- Use soft deletion for resources and presentations before permanent deletion.
- Use reusable viewer/editor components instead of category-specific duplicates.
- Medical content data should not be hard-coded into UI components when it belongs in the database.
- Update relevant `/docs` files when architecture, schema, security or accepted workflow changes.

## Security and clinical governance
- The initial product is not a patient-record system.
- Do not upload or seed identifiable patient information.
- Internal clinical images require de-identification and appropriate educational authorization/consent.
- Store attribution/licence metadata for external educational media.
- AI output must show unreviewed status until human approval.

## Verification
Before considering a feature complete:
1. run type checking;
2. run linting;
3. run the production build;
4. run relevant tests;
5. verify authorization paths where data is protected;
6. verify the Vercel-compatible build path.
