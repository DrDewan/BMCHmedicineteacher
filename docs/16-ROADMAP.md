# Roadmap

This file defines the product phases. The strict current execution order, dependencies and exit criteria are documented in `20-NEXT-IMPLEMENTATION-PLAN.md` and should be followed unless an explicit product decision changes the sequence.

## Completed foundation

### Phase 0 — Documentation and foundation
Repository contract, Next.js/TypeScript/Tailwind, deployment-ready shell, environment validation.

### Phase 1 — Supabase and Resource Library foundation
Auth/profile roles, categories/resources/version schema, private storage, upload foundation and starter resource library.

### Phase 2 — Viewers and document processing foundation
PDF/image viewers, X-ray/ECG presentation viewers, separate Document Worker, PPTX/DOCX preview conversion, slide/page thumbnails/text. Real PPTX upload/conversion/viewing has been manually verified in production.

### Teaching Material authoring foundation
Native Teaching Material creation/editing, structured slide storage, autosave, stale-write protection, preview/present and editing of existing seeded Teaching Materials.

### Production/performance foundation
Railway production web deployment in Singapore, Supabase in Mumbai, separate Railway document worker, initial performance optimization and route loading states.

---

## Current execution phase — Native structured teaching content

Build in this order:

1. Shared resource authoring foundation
2. Clinical Case Builder
3. Investigation Builder
4. Procedure Builder
5. Clinical Image / X-Ray / ECG editors
6. Question Editor
7. Shared BMCH Library Resource Picker

Detailed requirements and exit criteria: `20-NEXT-IMPLEMENTATION-PLAN.md`.

---

## Next phase — Presentation workflow

8. Native Presentation Builder
9. PPTX export

Presentation remains distinct from reusable Teaching Material. Presentation editing must never silently mutate source resources.

---

## Next phase — AI workflows

10. AI Question Generation
11. AI-assisted native authoring

AI output remains Draft until human review/approval. AI should accelerate structured authoring, not bypass the normal editors.

---

## Completion phase for V1 department use

12. Uploaded-resource management completion
13. Search/library usability pass
14. Admin user management
15. Quality/security/performance hardening
16. BMCH registrar pilot and feedback loop

---

## Later expansion

Additional BMCH departments, OSCE, video, journal club/grand-round archive, student analytics, offline/PWA support and institutional SSO.

## Explicitly deferred

Full PowerPoint clone, complex LMS, attendance/calendar/messaging, collaborative editing and diagnostic DICOM workstation features.
