# Document Processing

## Goal
Keep original files intact while creating browser-friendly teaching previews and searchable page/slide text.

## Pipeline
UPLOAD → VALIDATE → STORE ORIGINAL → QUEUE PROCESSING → EXTRACT TEXT → GENERATE PREVIEW → GENERATE THUMBNAILS/PAGE IMAGES → INDEX → READY.

## By file type
### PDF
Original remains canonical. Extract page text, render thumbnails/page images as required. Browser display uses PDF.js.

### PPTX
Store original; worker converts to PDF preview and/or slide images, extracts per-slide text, creates thumbnails. Day-to-day viewing uses derivative slides. Original remains downloadable.

### DOCX
Store original; worker converts to PDF for visual preview and extracts text. Original remains downloadable.

### Image
Validate, preserve original, generate thumbnail and appropriately sized preview.

## Worker
Separate container service, authenticated from the web app. It may use headless LibreOffice and PDF/image utilities. It reports processing results to server/database. It must be idempotent enough to support reprocessing.

## Failure behavior
Set `processing_status=failed`, preserve the original, retain a technical error for administrators, show users `Preview unavailable`, and offer reprocess/download where authorized.

## Visual AI note
For visually important PPTX/DOCX content, AI analysis should use generated PDF/page imagery rather than text-only extraction because embedded diagrams/images may carry essential medical information.
