# BMCH Medicine Education

Internal clinical teaching platform for the Department of Medicine, Bangladesh Medical College Hospital (BMCH).

## Product goal

BMCH Medicine Education is a registrar-focused clinical education workspace built around a simple loop:

**STORE → FIND → SHOW → TEACH → QUESTION → PRACTISE**

The application is intentionally not a general-purpose LMS. Its core jobs are to organise department teaching material, display it comfortably during teaching, build reusable clinical presentations, generate reviewable questions from source material, and run mixed practice rounds.

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
- Resource upload and library management
- PDF / slide / image teaching viewers
- Native BMCH presentation builder
- AI-assisted question generation with human approval

## Initial technical stack

- Next.js App Router + TypeScript
- Tailwind CSS
- Supabase PostgreSQL
- Supabase Auth
- Supabase Storage
- Vercel hosting
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
10. Architecture-changing work must update the documentation in `/docs`.

## Repository documentation

The detailed specification lives in [`/docs`](./docs) and is the source of truth for implementation.

Planned documents:

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

`AGENTS.md` contains implementation rules for coding agents.

## Development order

1. Documentation and repository contract
2. Deployable Next.js foundation
3. Supabase schema/auth/storage foundation
4. Resource library and uploads
5. PDF/image viewers
6. PPTX/DOCX document processing and slide previews
7. Structured clinical content
8. Presentation builder
9. AI question generation and approval
10. Practice Round
11. AI presentation assistant

## Status

Documentation-first foundation in progress. No production medical workflow should be assumed complete until its acceptance criteria in `/docs/17-ACCEPTANCE-CRITERIA.md` are satisfied.
