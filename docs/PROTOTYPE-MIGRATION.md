# Approved Prototype Migration

The live Next.js/Supabase application intentionally preserves the UI/UX decisions from `bmch_medicine_education_visual_practice.html`, the last approved pre-GitHub prototype.

## Product decisions carried forward

- Simple tile-based homepage; do not turn the product into a dashboard/LMS.
- Clinical Cases, Teaching Materials, Clinical Images, X-Rays, ECG, Investigations, Procedures, Question Bank and Guidelines remain the core library.
- Clinical Images, X-Rays and ECG use a presentation-first large media viewer with next/previous, fullscreen, thumbnails and hidden/reveal interpretation.
- Teaching Materials open as projector-friendly slide decks rather than long document pages.
- Procedures support appropriate teaching images.
- Clinical Cases, Investigations and Procedures retain detailed teaching content rather than short summaries.
- Practice Round mixes cases, images, X-rays, ECGs, investigations, procedures and teaching material.
- Uploaded files and database-backed resources remain part of the permanent architecture; the prototype UX is being migrated into that architecture rather than replacing it with static HTML.

The original prototype content has been imported into the BMCH Medicine Education Supabase project as starter teaching data. Future content should use the same resource model rather than hard-coded page content.
