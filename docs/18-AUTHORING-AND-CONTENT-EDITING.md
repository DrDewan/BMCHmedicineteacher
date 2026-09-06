# Authoring and Content Editing

## 1. Purpose

BMCH Medicine Education must allow authorised department users to create, edit, organise and reuse teaching content without touching code, SQL or Supabase directly.

The authoring system is a core product feature, not an administrative afterthought.

The intended workflow is:

**CREATE → EDIT → PREVIEW → PRESENT → PUBLISH → REUSE**

The authoring experience must preserve the product principle already established for the rest of BMCH Medicine Education:

- simple at entry,
- structured rather than free-form,
- optimised for clinical teaching,
- fast enough for a registrar preparing shortly before a class,
- reusable across cases, presentations, questions and practice rounds.

---

## 2. Scope

The authoring system covers two different kinds of content.

### 2.1 Native BMCH content

Fully editable inside the application:

- Teaching Materials
- Clinical Cases
- Investigations
- Procedures
- Clinical Images
- X-Rays
- ECGs
- Questions
- Native Presentations

### 2.2 Uploaded documents

Uploaded files remain immutable originals:

- PDF
- PPTX
- DOCX
- images

For uploaded files the user may:

- rename the BMCH resource,
- edit description/category/tags/visibility,
- replace the file as a new version,
- archive/delete/restore,
- generate questions,
- use pages/slides in presentations,
- create native teaching material from the document.

BMCH does **not** attempt to become a full PDF, Word or PowerPoint editor.

A user who needs to modify the original document contents should upload a replacement version or convert selected material into a BMCH-native teaching resource.

---

## 3. Global Create Entry Point

Authorised editors and administrators should see a prominent but unobtrusive:

**+ Create**

The action should be available from the main header and relevant category pages.

Opening it presents:

- Teaching Material
- Clinical Case
- Investigation
- Procedure
- Clinical Image
- X-Ray
- ECG
- Question
- Presentation
- Upload Document

The homepage must remain a simple resource library; the Create menu must not turn it into an admin dashboard.

---

## 4. Common Resource Metadata

Every native resource shares a common metadata editor.

Required:

- Title
- Category

Optional:

- Description
- System/topic
- Subtopic
- Tags
- Audience
- Difficulty
- Visibility
- Status

### Visibility

Initial values:

- Private draft
- Registrars
- Department
- Students

### Status

- Draft
- Approved
- Archived

Only authorised roles may publish/approve according to the permission rules in `11-AUTH-AND-PERMISSIONS.md`.

---

## 5. Common Editor Behaviour

All native editors should share consistent behaviour.

### 5.1 Autosave

Changes autosave after a short debounce.

The UI must show a small state indicator:

- Saving…
- Saved
- Save failed

Autosave must not publish content automatically.

### 5.2 Explicit publication

Editing and publication are separate actions.

Typical workflow:

**Draft → Preview → Publish/Approve**

### 5.3 Unsaved-change protection

If a save is currently failing or local changes have not reached the server, navigation away should warn the editor.

### 5.4 Preview

Every editor must provide a preview using the same renderer students/teachers will see.

### 5.5 Duplicate

Native resources can be duplicated.

Duplication creates a new Draft with a new resource ID and preserves the original unchanged.

### 5.6 Archive and delete

- Archive removes content from ordinary active browsing but retains it.
- Delete performs the platform's standard soft-delete behaviour.
- Permanent deletion remains an administrator action.

---

# 6. Teaching Material Editor

Teaching Materials are reusable structured slide sequences.

They are not uploaded PowerPoint files and they are not the same entity as a Presentation.

Example:

**Teaching Material:** `Approach to Acute Breathlessness`

This may later contribute slides/resources to multiple custom presentations.

---

## 6.1 Editor Layout

Desktop-first three-area layout:

### Left panel

Slide list / thumbnails.

Functions:

- select slide,
- drag to reorder,
- duplicate,
- delete,
- add slide between existing slides.

### Centre

Live slide canvas.

### Right panel

Content/properties editor for the selected slide.

### Top bar

- Back
- Title
- Save status
- Preview
- Present
- Publish
- More actions

---

## 6.2 Slide Types

Initial templates:

- Title
- Learning Objectives
- Teaching Point
- Bullet List
- Two Column
- Clinical Case
- Clinical Image
- X-Ray
- ECG
- Investigation
- Procedure
- Question
- Answer
- Comparison
- Algorithm / Flow
- Summary
- References

The system should prefer constrained medical slide templates over arbitrary drag-anything-anywhere layouts.

---

## 6.3 Slide Editing

A normal teaching slide may expose:

- Heading
- Subheading
- Body text
- Bullet points
- Highlight/callout
- Optional image/resource
- Speaker note

Content should be editable using form fields or lightweight rich text controls.

Do not introduce a complex general-purpose page builder in V1.

---

## 6.4 Resource Picker

Any compatible slide should allow:

**Choose from BMCH Library**

Examples:

- add an existing X-ray,
- add an ECG,
- insert a clinical image,
- use an investigation,
- reference a clinical case.

The resource picker supports:

- search,
- category filter,
- thumbnail preview,
- selected resource confirmation.

Where possible the slide stores the source `resource_id`, not a copied external URL.

This allows attribution and future provenance tracking.

---

## 6.5 Image Upload

A user may also upload a new image directly while editing.

The application should offer:

1. Upload as a new reusable BMCH resource, or
2. Attach only to this draft where permitted.

For clinical material, reusable resource creation is preferred because it preserves metadata and attribution.

---

## 6.6 Teaching Material Data Shape

Use `resources.structured_content` with a versioned schema.

Illustrative shape:

```json
{
  "schema_version": 1,
  "kind": "teaching_material",
  "topic": "Respiratory",
  "audience": "Final Year MBBS",
  "slides": [
    {
      "id": "slide_uuid",
      "type": "teaching_point",
      "heading": "Immediate assessment",
      "body": [
        "Assess oxygenation",
        "Assess work of breathing",
        "Identify haemodynamic instability"
      ],
      "source_resource_id": null,
      "speaker_notes": ""
    }
  ]
}
```

Slide IDs must remain stable during editing/reordering.

---

# 7. Clinical Case Builder

Clinical Cases use staged progressive disclosure rather than a slide canvas.

The case builder should make it easy to reproduce the teaching style already approved in the prototype.

---

## 7.1 Suggested Case Sections

### Basic information

- Title
- System
- Difficulty
- Tags

### Stage 1 — Presentation

Narrative opening.

### Vitals

Structured values:

- Pulse
- BP
- RR
- SpO₂
- Temperature
- GCS
- optional custom vital

### Pause and ask

One or more teaching questions.

### Focused history

Key positive/negative information.

### Examination

Clinical findings.

### Investigations

Tables, images or linked investigation resources.

### Differential diagnosis

Ordered or unordered differential list.

### Diagnosis

Final/working diagnosis.

### Management

Immediate and definitive management.

### Escalation / red flags

Optional warning block.

### Exam traps / teaching pearls

Optional teaching block.

### References

Optional source links.

---

## 7.2 Case Stage Operations

Editor can:

- add stage,
- remove stage,
- reorder stage,
- duplicate stage,
- hide optional stage,
- choose stage style: normal / key point / warning / danger.

Presentation view progressively reveals stages rather than showing the full answer immediately.

---

## 7.3 Case Data Shape

Illustrative:

```json
{
  "schema_version": 1,
  "kind": "clinical_case",
  "system": "Gastroenterology",
  "difficulty": "final_mbbs",
  "stages": [
    {
      "id": "stage_uuid",
      "type": "presentation",
      "title": "Stage 1 — Presentation",
      "text": "A 58-year-old man presents with haematemesis..."
    },
    {
      "id": "stage_uuid_2",
      "type": "vitals",
      "values": [
        {"label": "Pulse", "value": "112/min"},
        {"label": "BP", "value": "92/58"}
      ]
    }
  ]
}
```

---

# 8. Investigation Builder

Investigation resources should be structured interpretation exercises.

## Fields

### Title

### Clinical context

Short patient scenario.

### Results

Editable result table:

- columns,
- rows,
- units,
- optional reference ranges,
- abnormal-value emphasis.

### Student prompt

Example:

`Interpret these results.`

### Interpretation

### Differential

### Next investigation / next step

### Management implication

### Teaching point

### Warning / trap

### Optional image

Example: blood film, ABG screenshot, fluid appearance.

---

## 8.1 Investigation Data Shape

```json
{
  "schema_version": 1,
  "kind": "investigation",
  "context": "70-year-old with diarrhoea taking ramipril and spironolactone.",
  "table": {
    "columns": ["Na+", "K+", "Creatinine", "HCO3-"],
    "rows": [["136", "7.1", "310 µmol/L", "17 mmol/L"]]
  },
  "prompt": "Interpret the results.",
  "interpretation": "Severe hyperkalaemia associated with AKI.",
  "next_steps": ["Obtain ECG immediately"],
  "teaching_points": ["A normal-looking ECG does not make severe hyperkalaemia safe."]
}
```

---

# 9. Procedure Builder

Procedures require a structured step-based editor with images attachable to individual steps.

## Sections

- Overview
- Indications
- Contraindications / safety checks
- Equipment
- Preparation
- Steps
- Complications
- Aftercare
- Common errors
- Viva questions
- References

---

## 9.1 Procedure Step

Each procedural step may include:

- Step title
- Instruction text
- Optional image
- Optional safety warning
- Optional teaching pearl

Images should be attachable per step rather than only at the top of the procedure.

---

## 9.2 Procedure Data Shape

```json
{
  "schema_version": 1,
  "kind": "procedure",
  "overview": "Diagnostic lumbar puncture and CSF collection.",
  "indications": ["Suspected CNS infection"],
  "safety_checks": ["Review coagulation", "Assess neurological red flags"],
  "steps": [
    {
      "id": "step_uuid",
      "title": "Position the patient",
      "text": "Use lateral decubitus or seated positioning with lumbar flexion.",
      "image_resource_id": null,
      "warning": null
    }
  ],
  "complications": ["Post-dural puncture headache"]
}
```

---

# 10. Clinical Image / X-Ray / ECG Editor

These media resources use a simpler editor.

## Common fields

- Title
- Category
- Topic/system
- Image
- Tags
- Source/attribution
- Licence where external
- Description

## Clinical Image fields

- Sign / diagnosis
- What to identify
- Associations
- Clinical significance
- Teaching points

## X-Ray fields

- Diagnosis
- Description/findings
- Systematic interpretation
- Teaching questions
- Clinical correlation
- Red flags

## ECG fields

- Diagnosis/rhythm
- Rate
- Rhythm
- Axis
- P waves
- PR
- QRS
- ST/T
- Clinical significance
- Teaching points

Media viewers should hide the final interpretation until the teacher chooses to reveal it.

---

# 11. Question Editor

Approved or draft questions must be manually editable.

Supported types initially:

- MCQ
- Viva
- SAQ
- Clinical reasoning
- Image identification
- X-Ray interpretation
- ECG interpretation
- Investigation interpretation
- Procedure question

## MCQ fields

- Stem
- Options
- Correct option
- Explanation
- Difficulty
- Topic/subtopic
- Source resource(s)

## Viva / SAQ fields

- Prompt
- Model answer / key points
- Explanation
- Difficulty
- Source resource(s)

AI-generated questions open in this same editor as drafts.

---

# 12. Teaching Material vs Presentation

This distinction is mandatory.

## Teaching Material

A reusable subject resource.

Examples:

- Approach to Acute Breathlessness
- Acute Kidney Injury
- Electrolyte Emergencies

It may itself contain a slide sequence and can be taught directly.

## Presentation

A custom deck assembled for a particular teaching session.

Example:

**Respiratory Emergencies — Tuesday Final Year Class**

The presentation may contain:

- selected slides from Teaching Materials,
- an X-ray,
- an ECG,
- a Clinical Case,
- a new question,
- custom title/summary slides.

A Presentation can reference existing resources rather than copying all underlying content.

Editing a Presentation must not silently modify the source Teaching Material.

If a user wants a modified copy, provide an explicit duplicate/copy action.

---

# 13. Native Presentation Builder

The Presentation Builder uses the existing `presentations` and `presentation_slides` tables.

Editor layout should closely resemble the Teaching Material slide editor:

- thumbnails left,
- active slide centre,
- properties/resource selection right,
- preview/present actions top.

Slides support:

- add,
- reorder,
- duplicate,
- delete,
- speaker notes,
- library resource insertion.

Presentations support:

- autosave,
- Preview,
- Present fullscreen,
- duplicate,
- archive/delete,
- PPTX export when export functionality is implemented.

---

# 14. AI-Assisted Authoring

AI should accelerate authoring but never bypass the editor.

## 14.1 Generate a new Teaching Material

Example input:

`Create a 20-minute final-year MBBS session on acute kidney injury.`

AI returns a structured draft containing slide types and content.

The result opens in the Teaching Material editor.

It remains Draft until human review/publication.

---

## 14.2 Create from uploaded document

From a PDF/PPTX/DOCX resource:

**Create Teaching Material from this document**

Options may include:

- entire document,
- selected pages,
- selected slides,
- duration,
- audience,
- teaching style,
- approximate slide count.

AI creates a native draft.

The uploaded original remains unchanged.

---

## 14.3 AI edit assistance

Future contextual actions:

- shorten this slide,
- turn into bullet points,
- make this more clinical,
- create an opening case,
- generate a summary slide,
- generate viva questions,
- suggest an appropriate existing BMCH image/resource.

All AI changes must be reviewable before save/publish.

---

# 15. Editing Existing Content

Every native resource should expose an editor action menu:

**Edit**

**Rename**

**Duplicate**

**Add to Presentation**

**Generate Questions**

**Archive**

**Delete**

For media/files, additional relevant actions may include:

**Replace File**

**Edit Attribution**

Opening Edit routes the user to the editor appropriate to `resource_type` / structured-content kind.

---

# 16. Routes

Recommended routes:

```text
/create
/create/teaching-material
/create/case
/create/investigation
/create/procedure
/create/media
/create/question

/resources/[id]/edit

/presentations/new
/presentations/[id]/edit
/presentations/[id]/present
```

The exact route grouping may change during implementation, but URLs should remain predictable and bookmarkable.

---

# 17. Server-Side Mutation Rules

Privileged content mutations should occur through server actions or server route handlers with validated input.

Requirements:

- authenticated active profile,
- role check,
- Zod validation,
- RLS remains active,
- audit relevant publish/archive/delete operations,
- never trust client-supplied owner IDs.

The server derives the acting user from the authenticated session.

---

# 18. Structured Content Versioning

Every structured-content document must contain:

`schema_version`

Initial:

`1`

Renderers and editors must tolerate older supported schema versions or migrate them deliberately.

Do not make silent breaking changes to existing JSON structures.

Schema changes must update this documentation.

---

# 19. History and Undo

## V1

Required:

- autosave,
- duplicate before major rework,
- audit publication/archive/delete actions.

## Later

Potential:

- resource revision history,
- restore previous content revision,
- per-session undo/redo.

Do not delay the core authoring MVP for a full collaborative revision system.

---

# 20. Concurrency

V1 assumes one primary editor at a time per native resource.

If the resource was updated after the editor loaded it, the server should avoid silently overwriting newer work.

Recommended approach:

- send `updated_at` or revision token with save,
- reject stale save,
- inform user that the resource changed elsewhere.

Real-time collaborative editing is out of scope for V1.

---

# 21. Media Attribution and Clinical Governance

External media requires:

- source URL,
- creator where known,
- licence,
- attribution text.

Internal clinical images require governance fields as defined in the security/privacy documentation.

The editor should not allow attribution metadata to be accidentally lost when an existing image is reused.

Identifiable patient information must not be introduced through authoring workflows without an approved future governance mechanism.

---

# 22. Mobile Behaviour

Reading, preview and small edits should work on mobile/tablet.

Complex slide authoring is desktop-first.

Do not compromise the desktop teaching/editor experience in order to make full presentation authoring comfortable on a phone.

---

# 23. Keyboard and Efficiency Features

Teaching Material and Presentation editors should support common productivity shortcuts where safe:

- `Ctrl/Cmd + S` — save now
- `Ctrl/Cmd + D` — duplicate selected slide where context allows
- Delete/Backspace with confirmation — remove selected slide
- Arrow keys — navigate slide list when focus is in slide navigation

Presentation/viewer shortcuts remain documented in `07-VIEWERS.md` and `08-PRESENTATION-BUILDER.md`.

---

# 24. Empty-State Behaviour

A newly created resource should never present a confusing blank canvas.

Examples:

### Teaching Material

Starts with:

1. Title slide
2. `+ Add slide`

### Clinical Case

Starts with:

- Presentation
- Vitals
- `+ Add stage`

### Investigation

Starts with:

- Clinical context
- Results table
- Student prompt

### Procedure

Starts with:

- Overview
- Indications
- Safety checks
- `+ Add procedure step`

Templates reduce authoring friction.

---

# 25. Acceptance Criteria

The authoring MVP is complete when an authorised editor can perform the following without code/database access.

## Common

- Create native resource.
- Rename it.
- Edit metadata.
- Autosave content.
- Preview using the final renderer.
- Publish/approve according to permissions.
- Reopen and edit existing content.
- Duplicate.
- Archive.
- Soft delete.

## Teaching Material

- Add slide.
- Choose slide template.
- Edit slide content.
- Reorder slides.
- Duplicate/delete slides.
- Add existing BMCH media/resource.
- Preview.
- Present fullscreen.

## Clinical Case

- Create progressive stages.
- Add vitals.
- Add questions.
- Add investigation results.
- Reorder stages.
- Preview progressive teaching view.

## Investigation

- Add/edit result table.
- Add context/prompt.
- Add interpretation/differential/next steps/teaching points.

## Procedure

- Add indications/safety/equipment.
- Add ordered steps.
- Attach image per step.
- Add complications/aftercare/viva questions.

## Media

- Upload/select image.
- Add structured interpretation.
- Add source/licence attribution.
- Preview in presentation-style media viewer.

## Questions

- Create/edit supported question types.
- Set answer/explanation/source.
- Save as draft or submit/approve based on role.

---

# 26. Implementation Order

Recommended coding order after this document is approved:

1. Shared metadata editor and resource mutation layer.
2. Shared structured-content autosave mechanism.
3. Teaching Material slide editor.
4. Clinical Case builder.
5. Investigation builder.
6. Procedure builder.
7. Clinical Image / X-Ray / ECG editor.
8. Question editor.
9. Presentation resource picker/reuse workflow.
10. AI-assisted native content generation.
11. AI create-from-document flow.

The Teaching Material editor should be implemented first because its slide/resource picker primitives can be reused by the Presentation Builder and parts of the other authoring tools.

---

# 27. Product Rule

The editor must make **structured clinical teaching faster than building the same material manually in PowerPoint or a generic CMS**.

If authoring becomes a complicated configuration workflow, the feature has failed even if it is technically flexible.

The target user experience is:

> A registrar opens BMCH Medicine Education, creates or modifies a teaching resource, previews it, puts it fullscreen, teaches from it, and later reuses the same material in another presentation or practice round—without leaving the platform.
