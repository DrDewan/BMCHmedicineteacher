# Next Implementation Plan

## Purpose

This document is the execution plan for the next development phase of BMCH Medicine Education.

It converts the broader roadmap and authoring specification into a strict build sequence. The aim is to prevent feature drift and ensure that each new editor or workflow is usable before the next one is added.

The product remains a **clinical education resource library and teaching workspace**, not a general LMS.

Core loop:

**STORE → FIND → SHOW → TEACH → QUESTION → PRACTISE**

Authoring loop:

**CREATE → EDIT → PREVIEW → PRESENT → PUBLISH → REUSE**

---

# 1. Current baseline — complete

The following are already working and form the baseline for this plan.

## 1.1 Library and authentication

- Supabase authentication and active-profile checks
- admin/editor/viewer roles
- private resource storage
- category-based resource library
- approved starter content restored and verified
- live categories:
  - Clinical Cases — 11
  - Teaching Materials — 12
  - Clinical Images — 9
  - X-Rays — 4
  - ECG — 3
  - Investigations — 12
  - Procedures — 10
  - Question Bank — 3
  - Guidelines — 5
- Practice Round approved question bank — 20

## 1.2 Teaching Material authoring

- `+ Create`
- create Teaching Material
- draft resource creation
- structured slide data
- add/edit/reorder/duplicate/delete slides
- metadata editing
- autosave
- stale-write protection
- preview/present
- edit existing Teaching Materials
- compatibility with the approved prototype slide content

## 1.3 Document upload and processing

- PDF/image/PPTX/DOCX upload foundation
- private originals
- PPTX detection
- document worker
- LibreOffice conversion
- PDF preview
- slide PNGs and thumbnails
- extracted slide text
- fullscreen uploaded PowerPoint viewer
- thumbnail navigation
- retry/failure state
- production worker deployed on Railway
- real `.pptx` upload workflow manually confirmed working

## 1.4 Deployment and performance

- production web application on Railway Singapore (`sin`)
- Supabase in Mumbai (`ap-south-1`)
- document worker deployed separately
- route loading skeleton
- initial latency optimization
- CI checks web and worker independently

This baseline must remain functional during all subsequent work.

---

# 2. Build rules for all remaining increments

Every increment below must follow these rules.

1. **Do not break the simple tile-library homepage.**
2. **Do not introduce LMS/dashboard concepts unless explicitly approved later.**
3. **Native content is structured JSON, schema-versioned, and editable without SQL/code.**
4. **Uploaded PDF/PPTX/DOCX originals remain immutable.**
5. **Autosave never means publish.** Draft and Approved remain separate states.
6. **All server mutations validate with Zod and derive the acting user from the authenticated session.**
7. **RLS remains the final database authorization boundary.**
8. **Editors must use the same renderer as preview/presentation wherever practical.**
9. **Stale saves must not silently overwrite newer content.**
10. **Each increment must pass TypeScript, ESLint and production build before it is considered complete.**
11. **Architecture-changing work updates `/docs`.**
12. **Performance should be checked after each data-heavy feature; avoid serial Supabase requests where one query or parallel requests are sufficient.**

---

# 3. Increment 1 — Shared resource authoring foundation

## Goal

Finish the common functionality that every native editor will otherwise duplicate.

## Deliverables

### Shared metadata editor

Fields:

- title
- description
- category
- topic/system
- subtopic
- tags
- audience
- difficulty
- visibility
- status

### Shared resource actions

- Edit
- Rename
- Duplicate
- Archive
- Restore where applicable
- Soft Delete
- permanent delete for admin only
- Add to Presentation
- Generate Questions placeholder/action entry

### Shared mutation layer

- Zod validation
- role checks
- optimistic/stale-write protection
- consistent API/server-action errors
- audit logging for publish/archive/delete

### Shared save UX

- Saving…
- Saved
- Save failed
- retry
- navigation warning when local changes are not persisted

## Exit criteria

An editor/admin can manage native-resource metadata and lifecycle consistently without editor-specific duplicated code.

---

# 4. Increment 2 — Clinical Case Builder

## Goal

Make Clinical Cases fully creatable and editable inside BMCH.

## Editor model

Clinical cases use **progressive disclosure**, not a slide canvas.

## Sections

- basic information
- presentation
- structured vitals
- Pause and Ask
- focused history
- examination
- investigations
- differential diagnosis
- diagnosis
- management
- escalation/red flags
- exam traps/teaching pearls
- references

## Operations

- add stage
- remove stage
- reorder stage
- duplicate stage
- hide optional stage
- stage styles:
  - normal
  - key point
  - warning
  - danger

## Viewer requirements

- progressive reveal
- clear teacher controls
- presentation-friendly typography
- linked investigation/media resources render properly

## Data requirement

`structured_content.schema_version = 1`

Stable stage IDs are mandatory.

## Exit criteria

A registrar can create a complete final-year MBBS case, save it as Draft, reopen it, preview it, publish it, and run it progressively during teaching.

---

# 5. Increment 3 — Investigation Builder

## Goal

Make investigation interpretation exercises editable without raw HTML/JSON.

## Fields

- title
- clinical context
- result table
- units
- reference ranges
- abnormal-value emphasis
- student prompt
- interpretation
- differential
- next investigation/step
- management implication
- teaching point
- warning/trap
- optional image/resource

## Table editor

Must support:

- add/remove columns
- add/remove rows
- edit cells
- edit units/reference ranges
- mark abnormal values

## Exit criteria

A registrar can build a usable ABG/CBC/LFT/U&E-style interpretation resource entirely in the UI and present it using the final investigation renderer.

---

# 6. Increment 4 — Procedure Builder

## Goal

Make procedural teaching content fully structured and editable.

## Sections

- overview
- indications
- contraindications/safety checks
- equipment
- preparation
- ordered steps
- complications
- aftercare
- common errors
- viva questions
- references

## Procedure step fields

- title
- instruction
- optional image
- optional safety warning
- optional teaching pearl

## Important requirement

Images must be attachable **per procedure step**, not only once at the top of the resource.

## Exit criteria

A registrar can create or modify procedures such as ABG, lumbar puncture or paracentesis and teach them step-by-step from the site.

---

# 7. Increment 5 — Clinical Image / X-Ray / ECG editors

## Goal

Provide a fast, reusable editor for media-based teaching resources.

## Shared fields

- title
- image
- topic/system
- description
- tags
- source
- attribution
- licence

## Clinical Image fields

- sign/diagnosis
- what to identify
- associations
- clinical significance
- teaching points

## X-Ray fields

- diagnosis
- findings
- systematic interpretation
- teaching questions
- clinical correlation
- red flags

## ECG fields

- diagnosis/rhythm
- rate
- rhythm
- axis
- P waves
- PR
- QRS
- ST/T
- clinical significance
- teaching points

## Viewer rule

Interpretation remains hidden until the teacher selects **Reveal**.

## Exit criteria

Editors can upload, describe, attribute, edit and teach from a media resource without using SQL or modifying prototype HTML.

---

# 8. Increment 6 — Question Editor

## Goal

Create one editor used for both manually written and later AI-generated questions.

## Initial question types

- MCQ
- Viva
- SAQ
- Clinical reasoning
- Clinical image identification
- X-Ray interpretation
- ECG interpretation
- Investigation interpretation
- Procedure question

## MCQ fields

- stem
- options
- correct option
- explanation
- difficulty
- topic/subtopic
- source resource(s)

## Viva/SAQ fields

- prompt
- model answer/key points
- explanation
- difficulty
- source resource(s)

## Workflow

**Draft/Generated → Review → Approved/Rejected**

Only Approved questions enter Practice Round.

## Exit criteria

An editor can create, edit, review and approve questions and immediately see approved questions become eligible for Practice Round.

---

# 9. Increment 7 — Shared BMCH Library Resource Picker

## Goal

Allow content to be reused instead of copied.

This is a major enabling component for Teaching Materials, Cases and Presentations.

## UI

**Choose from BMCH Library**

Supports:

- search
- category filtering
- thumbnail/list modes where useful
- quick preview
- current selection
- confirmation

## Supported initial sources

- Teaching Material
- Clinical Case
- Clinical Image
- X-Ray
- ECG
- Investigation
- Procedure
- uploaded PDF/PPTX pages/slides where compatible

## Provenance rule

Prefer storing `source_resource_id` and optional page/slide identifiers rather than copying external URLs or duplicating entire resources.

## Exit criteria

A registrar can insert an existing BMCH resource into another teaching resource without re-uploading or manually copying it.

---

# 10. Increment 8 — Native Presentation Builder

## Goal

Build session-specific teaching decks from reusable BMCH resources.

## Mandatory distinction

**Teaching Material** = reusable subject material.

**Presentation** = custom deck assembled for a particular teaching session.

Example:

`Respiratory Emergencies — Tuesday Final Year Class`

## Editor layout

- left: slide thumbnails
- centre: active slide canvas
- right: properties/library picker
- top: save state, preview, present, publish/more

## Presentation capabilities

- create/rename
- add template slide
- insert existing Teaching Material slide/resource
- insert X-Ray/ECG/image/case/investigation/procedure
- add question
- reorder
- duplicate
- delete
- speaker notes
- autosave
- preview
- fullscreen present
- duplicate/archive/delete

## Source safety

Editing a Presentation must **never silently mutate** the Teaching Material or resource it references.

Modification of source content requires explicit Edit Source or Duplicate/Copy behavior.

## Exit criteria

A registrar can assemble a complete teaching session from existing BMCH content and present it without leaving the application.

---

# 11. Increment 9 — Presentation export

## Goal

Allow native BMCH presentations to leave the platform when needed.

## Initial export

- `.pptx` via PptxGenJS

## Requirements

- title/text/bullets exported cleanly
- media embedded or referenced appropriately
- source attribution retained where possible
- exported deck remains usable in Microsoft PowerPoint

## Explicit limitation

Export is a useful representation of the BMCH deck, not pixel-perfect round-trip PowerPoint editing.

## Exit criteria

A native BMCH presentation can be exported and opened successfully in PowerPoint with its teaching structure intact.

---

# 12. Increment 10 — AI Question Generation

## Goal

Generate reviewable questions from existing BMCH sources.

## Provider architecture

Use provider abstraction rather than embedding one vendor throughout the app.

Example interface concept:

`AIProvider.generateQuestions()`

Initial provider may be OpenAI; architecture must allow Anthropic, Gemini or local providers later.

## Source selection

- whole resource
- selected PDF pages
- selected PPTX slides
- Teaching Material
- Case
- Investigation
- Procedure

## Controls

- question type
- count
- difficulty
- audience
- source range

## Output workflow

**Generate → Draft → Edit → Approve/Reject/Regenerate**

## Provenance

Every generated question should retain its source resource and page/slide where known.

## Exit criteria

AI can produce structured draft questions from selected source material, but no AI output enters the approved question pool without human review.

---

# 13. Increment 11 — AI-assisted native authoring

## Goal

Use AI to accelerate content creation without bypassing faculty review.

## A. Create from prompt

Example:

`Create a 20-minute final-year MBBS teaching material on acute kidney injury.`

AI creates a structured Draft and opens it in the normal Teaching Material editor.

## B. Create from uploaded document

From PDF/PPTX/DOCX:

**Create Teaching Material from this document**

Options:

- whole document
- selected pages/slides
- duration
- audience
- teaching style
- approximate slide count

Original file remains unchanged.

## C. Contextual AI editing

Possible later actions:

- shorten this slide
- turn into bullets
- make more clinical
- generate opening case
- create summary
- generate viva questions
- suggest existing BMCH media/resources

## Exit criteria

AI output always appears as editable Draft content in an existing native editor and requires human publication.

---

# 14. Increment 12 — Uploaded-resource management completion

## Goal

Finish lifecycle management for uploaded PDF/PPTX/DOCX/images.

## Capabilities

- edit metadata
- rename resource without changing storage object path
- tags/topic/category/visibility
- replace original as a new version
- version list
- archive
- soft delete
- restore
- edit image attribution where applicable
- create native Teaching Material from source
- generate questions from source

## Exit criteria

Uploaded files have the same clean resource-lifecycle controls as native content while the original file history remains immutable.

---

# 15. Increment 13 — Search and library usability pass

## Goal

Ensure the resource library remains usable as content grows.

## Capabilities

- global search
- category search/filter
- topic/system filter
- tags
- resource type
- status filter for editors
- recently updated sorting
- useful empty states

## Performance requirement

Search/filtering must not reintroduce multiple serial Supabase round trips.

## Exit criteria

A registrar can locate a known resource quickly even after the library grows substantially beyond the starter dataset.

---

# 16. Increment 14 — Admin user management

## Goal

Remove dependence on Supabase console/SQL for ordinary staff access management.

## Admin capabilities

- list users
- username/full name
- role: viewer/editor/admin
- active/inactive
- create/invite account workflow
- activate/deactivate
- reset password workflow where supported securely

## Security

- admin-only
- no password visibility
- audit important role/status changes

## Exit criteria

BMCH can onboard and manage teaching users without database-console intervention.

---

# 17. Increment 15 — Quality, security and performance hardening

This is not a one-time final cleanup; checks happen throughout development, but this increment is the dedicated release-readiness pass.

## Functional QA

- create/edit/reopen every native resource type
- duplicate/archive/delete/restore
- preview/present
- PPTX upload conversion
- native presentation assembly
- practice questions

## Security

- RLS review
- role mutation tests
- private storage checks
- signed URL expiry
- secret/client-bundle review
- no identifiable patient demo data

## Performance

Measure server duration and user-perceived loading for:

- homepage
- category pages
- resource pages
- editors
- login
- search
- presentation viewer

Investigate routes consistently above ~300–400 ms server processing.

## Reliability

- failed autosave recovery
- stale-editor conflicts
- failed document processing retry
- invalid/missing media handling
- empty states

## Accessibility / classroom use

- keyboard navigation
- readable projector typography
- fullscreen controls
- adequate touch targets
- basic semantic labels

## Exit criteria

No high-severity functional/security issues and normal classroom workflows are reliable enough for routine registrar use.

---

# 18. Increment 16 — BMCH registrar pilot and feedback loop

## Goal

Test the product in real teaching rather than continuing to design only from developer assumptions.

## Pilot workflow

- select a small number of registrars
- have them create/edit resources themselves
- have them assemble a real class
- use presentation mode during final-year teaching
- gather friction points immediately after use

## Feedback categories

- authoring speed
- discoverability
- presentation usability
- missing clinical content fields
- unnecessary fields
- resource reuse
- image/X-ray/ECG handling
- question workflow

## Decision rule

Fix repeated workflow friction before adding broad new modules.

---

# 19. Deferred until the core workflow is proven

Do not build these merely because they are technically possible.

- general LMS dashboard
- attendance
- class calendar
- messaging/forum
- student analytics suite
- real-time collaborative editing
- arbitrary PowerPoint-style freeform canvas
- DICOM workstation/PACS functionality
- complex institutional SSO
- offline/PWA mode
- video library platform
- expansion to other departments

These may be revisited after the Medicine Department authoring/presentation workflow is stable and regularly used.

---

# 20. Immediate execution order

The exact next sequence is:

1. Shared resource authoring foundation
2. Clinical Case Builder
3. Investigation Builder
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
16. Registrar pilot and feedback loop

No feature coding after the current baseline should jump ahead of this order without an explicit product decision.
