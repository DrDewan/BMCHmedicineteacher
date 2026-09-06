# Product Requirements

## Functional requirements

### Resource management
Authorized users can upload PDF, PPTX, DOCX, JPG, PNG and WebP resources; set title/category/topic/tags/description/visibility; rename and edit metadata; soft-delete and restore; download originals; search and filter.

### Viewing
- PDF: page navigation, thumbnails, zoom, fit width/page, fullscreen, teaching mode.
- PPTX: preview-converted slide viewer, thumbnails, navigation, fullscreen, original download.
- Images: zoom/pan/fullscreen/next/previous.
- X-ray: image viewer plus hidden/reveal interpretation; later brightness/contrast/invert.
- ECG: large zoomable image with structured reveal interpretation.
- Structured cases/investigations/procedures: native teaching views.

### Presentation building
Users can create a BMCH-native deck, add predefined medical slide types, insert library resources, reorder/duplicate/delete slides, preview, present fullscreen and export to PPTX.

### AI questions
Users can generate questions from a resource or selected page/slide range; choose number/type/difficulty; receive structured draft questions with source provenance; edit/approve/reject/regenerate. Only approved questions enter the approved bank.

### Practice Round
Users can run mixed rounds (default 10 questions) across cases, X-rays, ECG, images, investigations, procedures and teaching material. Live Teaching Mode reveals answers without requiring student login; Student Mode records answer/score where enabled.

## Non-functional requirements
- Desktop/projector-first, responsive on tablet/mobile.
- Production build deployable to Vercel.
- Private file access through signed/authenticated mechanisms.
- Typical library page should not preload full documents.
- Viewer interactions must remain keyboard accessible.
- Failed preview generation must not destroy the original resource.

## Out of scope for early phases
Attendance, timetable/calendar, messaging, social feed, broad LMS workflows, complex analytics, full PowerPoint clone, real-time collaborative slide editing, DICOM diagnostic workstation features.
