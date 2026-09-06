# Procedure Builder

## Status

Implemented as **Increment 4** of `20-NEXT-IMPLEMENTATION-PLAN.md`.

The Procedure Builder makes BMCH procedural teaching resources structured, editable and teachable step-by-step without raw HTML or JSON.

---

## 1. Authoring flow

Editors/admins can use:

`+ Create → Procedure`

Creation collects:

- title
- opening description
- system/topic

The resource is created as a private registrar-facing Draft and opens directly in the Procedure Builder.

Existing native/no-file resources with `resource_type = procedure` route to the same builder from **Edit**.

---

## 2. Structured content schema

Native procedures use:

- `schema_version: 1`
- `native_kind: procedure`
- overview
- indications
- contraindications / safety checks
- equipment
- preparation
- ordered technique steps
- complications
- aftercare
- common errors
- viva questions
- references
- optional overview image
- optional preserved legacy HTML

Each technique step has a stable ID and stores:

- title
- instruction
- optional step image URL
- optional safety warning
- optional teaching pearl

Stable step IDs are mandatory so later presentation/resource-linking features can reference individual steps safely.

---

## 3. Step editor

Editors can:

- add steps
- reorder steps
- duplicate steps
- delete steps
- edit step title
- edit instruction
- attach an image URL to each individual step
- add a step-specific safety warning
- add a step-specific teaching pearl

The editor shows the selected step using the final Procedure Viewer renderer rather than a separate approximation.

Maximum steps in V1: 60.

---

## 4. General procedure sections

The following sections use reusable list editors:

- indications
- contraindications / safety checks
- equipment
- preparation
- complications
- aftercare
- common errors
- viva questions

Items can be added, edited and removed independently.

References contain a stable ID, label and optional URL.

---

## 5. Teaching renderer

The final Procedure Viewer provides:

- overview / overview image
- indications
- contraindications / safety checks
- equipment
- preparation
- a dedicated technique-step teaching stage
- Previous / Next step navigation
- step-specific images
- visible safety warnings
- reveal/hide teaching pearls and viva questions
- complications
- aftercare
- common errors
- references
- fullscreen teaching mode

The procedure technique is therefore taught one ordered step at a time instead of displaying a long static page.

---

## 6. Per-step images

Per-step image support is a mandatory part of Increment 4 and is implemented now.

Each procedure step can store its own image URL independently of the resource-level overview image.

Examples:

- lumbar puncture landmark image on the landmark-identification step
- needle direction image on the insertion step
- CSF collection image on the sample-collection step

Direct selection of an existing BMCH Clinical Image / X-Ray / ECG / other library resource is deferred to **Increment 7 — Shared BMCH Library Resource Picker**.

Increment 7 should extend the step image linkage; it should not replace this structured step model.

---

## 7. Starter-content compatibility

The 10 approved starter procedures were originally stored as `body_html` with a top-level optional `image_url`.

Opening an existing starter procedure in the editor does **not** immediately mutate the database record.

`coerceProcedure()` creates an in-memory native representation and preserves:

- the original HTML as `legacy_html`
- the original top-level image as `overview_image_url`
- existing tags/subtitle metadata

Only after the registrar changes a field and autosave occurs is the resource stored as `native_kind = procedure`.

The imported HTML remains visible in the teaching view behind the **Reveal viva/pearls** control until the editor explicitly removes it.

The builder warns that imported HTML should only be removed after its clinical content has been recreated in structured fields.

This prevents silent or lossy conversion of approved starter material.

---

## 8. Save and lifecycle contract

Procedure metadata and procedure content save in one autosave transaction through:

`PATCH /api/resources/[id]/procedure`

The shared authoring contract remains mandatory:

- Zod validation
- active admin/editor check
- RLS authorization
- `expectedUpdatedAt` stale-write protection
- Save / Saving / Save failed / conflict states
- autosave never publishes
- publication remains an explicit lifecycle action

---

## 9. Deliberate V1 limitations

Not included in this increment:

- automatic clinical guideline verification
- automatic contraindication checking
- patient-specific procedural decision support
- direct BMCH Library resource picker
- direct image upload inside an individual step
- AI procedure generation
- AI viva generation
- competency sign-off / procedure logs
- attendance or trainee assessment
- real-time collaborative editing

This remains a supervised educational content system, not a procedural credentialing or patient-care system.

---

## 10. Exit criteria

Increment 4 is complete when an editor/admin can:

- create a new Procedure from the Create screen
- enter overview and safety sections
- add and reorder procedural steps
- attach a different image to individual steps
- add safety warnings and teaching pearls per step
- enter complications, aftercare and common errors
- enter viva questions and references
- autosave and reopen without data loss
- preview using the final renderer
- teach step-by-step with Previous / Next controls
- reveal viva/pearls during teaching
- publish through the shared lifecycle controls
- edit an existing approved starter procedure without silently losing its original content

The next planned increment is **Increment 5 — Clinical Image / X-Ray / ECG editors**.
