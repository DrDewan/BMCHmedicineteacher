# BMCH Medicine Education

Internal clinical teaching platform for the Department of Medicine, Bangladesh Medical College Hospital (BMCH).

## Product goal

BMCH Medicine Education is a registrar-focused clinical education workspace built around a simple loop:

**STORE → FIND → SHOW → TEACH → QUESTION → PRACTISE**

The application is intentionally not a general-purpose LMS. Its core jobs are to organise department teaching material, display it comfortably during teaching, build and edit reusable native clinical teaching content, assemble presentations, generate reviewable questions from source material, and run mixed practice rounds.

## Primary modules

- Clinical Cases
- Teaching Materials
- Clinical Images
- X-Rays
- ECG
- Investigations
- Procedures
- Question Bank
- Guidelines
- Practice Round
- Native content authoring and editing
- Resource upload and library management
- PDF / slide / image teaching viewers
- Native BMCH presentation builder
- AI-assisted question generation with human approval
- AI-assisted native teaching-content generation

## Initial technical stack

- Next.js App Router + TypeScript
- Tailwind CSS
- Supabase PostgreSQL
- Supabase Auth
- Supabase Storage
- Vercel-compatible web hosting (currently Railway production)
- PDF.js for PDF viewing
- Containerised document worker for PPTX/DOCX preview generation and extraction
- PptxGenJS for PowerPoint export
- AI provider abstraction with OpenAI as the initial provider

## Architectural principles

1. Keep the homepage simple even when the application becomes extensive.
2. Treat a resource as more than a file: resources may be PDFs, PowerPoints, images, structured cases, investigations, procedures, presentations, question sets or links.
3. Preserve original uploaded files and generate separate previews/thumbnails.
4. Renaming a resource changes database metadata, not its immutable storage path.
5. Heavy document conversion belongs in a separate worker, not in ordinary Vercel request handlers.
6. AI-generated medical questions require human review before becoming approved department content.
7. Use private storage and Row Level Security for protected data.
8. Do not upload identifiable patient information unless an approved future governance workflow explicitly permits it.
9. The native presentation builder should be structured for medical teaching rather than attempt to clone Microsoft PowerPoint.
10. Native BMCH teaching resources must be editable without code or database access.
11. Uploaded PDF/PPTX/DOCX files remain immutable originals; editing their contents is handled through replacement versions or conversion into BMCH-native material rather than building a full Office editor.
12. Architecture-changing work must update the documentation in `/docs`.
13. Keep the interactive web runtime geographically close to both Bangladesh users and Supabase; current production web region is Singapore with Supabase in Mumbai.

## Repository documentation

The detailed specification lives in [`/docs`](./docs) and is the source of truth for implementation.

Documents:

- `00-PRODUCT-OVERVIEW.md`
- `01-PRODUCT-REQUIREMENTS.md`
- `02-INFORMATION-ARCHITECTURE.md`
- `03-TECHNICAL-ARCHITECTURE.md`
- `04-DATABASE-SCHEMA.md`
- `05-RESOURCE-LIBRARY.md`
- `06-DOCUMENT-PROCESSING.md`
- `07-VIEWERS.md`
- `08-PRESENTATION-BUILDER.md`
- `09-AI-QUESTION-GENERATION.md`
- `10-PRACTICE-SYSTEM.md`
- `11-AUTH-AND-PERMISSIONS.md`
- `12-SECURITY-AND-PRIVACY.md`
- `13-API-SPECIFICATION.md`
- `14-TESTING.md`
- `15-DEPLOYMENT.md`
- `16-ROADMAP.md`
- `17-ACCEPTANCE-CRITERIA.md`
- `18-AUTHORING-AND-CONTENT-EDITING.md`
- `19-PERFORMANCE.md`
- `20-NEXT-IMPLEMENTATION-PLAN.md`
- `21-SHARED-AUTHORING-FOUNDATION.md`
- `22-CLINICAL-CASE-BUILDER.md`
- `23-INVESTIGATION-BUILDER.md`
- `PROTOTYPE-MIGRATION.md`

`20-NEXT-IMPLEMENTATION-PLAN.md` is the current execution source of truth for build order, dependencies and increment exit criteria.

`AGENTS.md` contains implementation rules for coding agents.

## Current execution order

Completed baseline includes the resource library, authentication, Teaching Material editor, PPTX/DOCX processing foundation, uploaded PowerPoint viewer, starter dataset, production deployment and initial performance work.

Completed authoring increments:

1. Shared resource authoring foundation
2. Clinical Case Builder
3. Investigation Builder

Next increments:

4. Procedure Builder
5. Clinical Image / X-Ray / ECG editors
6. Question Editor
7. Shared BMCH Library Resource Picker
8. Native Presentation Builder
9. PPTX export
10. AI Question Generation
11. AI-assisted native authoring
12. Uploaded-resource management completion
13. Search/library usability pass
14. Admin user management
15. Quality/security/performance hardening
16. BMCH registrar pilot and feedback loop

Do not jump ahead of this sequence without an explicit product decision. Detailed requirements live in `docs/20-NEXT-IMPLEMENTATION-PLAN.md`.

## Status

Documentation-first architecture is established and implementation is active. No production medical workflow should be assumed complete until its acceptance criteria in `/docs/17-ACCEPTANCE-CRITERIA.md`, the relevant feature specification, and the corresponding increment exit criteria in `/docs/20-NEXT-IMPLEMENTATION-PLAN.md` are satisfied.
