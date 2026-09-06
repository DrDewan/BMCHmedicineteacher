# Technical Architecture

## Stack
- Next.js App Router + React + TypeScript
- Tailwind CSS
- Supabase PostgreSQL
- Supabase Auth
- Supabase Storage
- Vercel for the web application
- PDF.js for browser PDF viewing
- Separate containerised Document Worker for heavy conversion/extraction
- PptxGenJS for `.pptx` export
- AI provider interface; OpenAI first implementation

## Architectural boundaries
### Web application
Owns authentication, library/search, metadata, viewers, presentation builder, question review, practice, normal CRUD and signed URL orchestration.

### Supabase
Owns relational data, authentication and private object storage.

### Document Worker
Owns PPTX/DOCX→PDF conversion, slide/page preview generation, thumbnails, text extraction, image resizing and later malware scanning/OCR.

### AI provider
Receives selected source content and returns schema-validated outputs. It never directly publishes approved department content.

## Deployment
Web app must build cleanly under Vercel's standard Next.js deployment. Heavy worker is deployed separately on a container-capable host. Do not require LibreOffice binaries inside Vercel functions.

## Rendering strategy
Default to Server Components for library/detail shells and data retrieval. Use Client Components for interactive viewers, fullscreen controls, drag-and-drop slide ordering and practice interactions.

## Resource viewer dispatch
`/resources/[id]` loads the resource and selects a reusable viewer by `resource_type` / category: PdfViewer, SlideViewer, ImageViewer, XrayViewer, EcgViewer, CaseViewer, InvestigationViewer, ProcedureViewer.

## AI abstraction
Define server-side `AIProvider` with operations such as `generateQuestions`, `generatePresentationOutline`, `generateSlideContent`, `explainResource`. Provider-specific secrets never reach the browser.
