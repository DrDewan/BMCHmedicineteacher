# Investigation Builder

## Status

Implemented as **Increment 3** of `20-NEXT-IMPLEMENTATION-PLAN.md`.

The Investigation Builder makes ABG, CBC, LFT, U&E and similar interpretation resources editable without raw HTML or JSON.

---

## 1. Authoring flow

Editors/admins can use:

`+ Create → Investigation`

Creation collects:

- title
- opening description
- system/topic

The resource is created as a private registrar-facing Draft and opens directly in the Investigation Builder.

Existing native/no-file resources with `resource_type = investigation` route to the same builder from **Edit**.

---

## 2. Structured content schema

Native investigations use:

- `schema_version: 1`
- `native_kind: investigation`
- clinical context
- student prompt
- generic result table
- interpretation
- differential
- next investigation/step
- management implication
- teaching point
- warning/exam trap
- optional image URL
- optional preserved legacy HTML

The result table stores stable column and row IDs.

Each row stores cell values keyed by column ID and an explicit list of abnormal cell IDs.

This keeps abnormal emphasis independent of text formatting.

---

## 3. Table editor

Default columns are:

- Test
- Result
- Unit
- Reference range

These defaults are not hard-coded to the final model. Editors can:

- rename columns
- add columns
- remove columns
- add rows
- remove rows
- edit every cell
- mark/unmark individual cells as abnormal

Limits:

- maximum 12 columns
- maximum 80 rows

This supports conventional vertical laboratory tables as well as custom interpretation layouts.

---

## 4. Teaching renderer

The final Investigation Viewer shows:

1. optional image
2. clinical context
3. result table
4. student prompt

Teacher interpretation content is hidden initially.

**Reveal interpretation** exposes:

- interpretation
- differential
- next investigation/step
- management implication
- teaching point
- warning/exam trap
- preserved imported starter content where applicable

Fullscreen is available for teaching.

The editor uses the same Investigation Viewer in compact mode for live preview.

---

## 5. Starter-content compatibility

The 12 approved starter investigations were originally stored as `body_html`.

Opening an existing starter investigation in the editor does **not** immediately mutate the resource.

`coerceInvestigation()` creates an in-memory native representation and preserves the original HTML as `legacy_html`.

Only after the registrar changes a field and autosave occurs is the resource stored as `native_kind = investigation`.

The imported HTML remains available behind the teacher interpretation reveal until the editor explicitly removes it.

The editor warns that imported HTML should only be removed after its clinical content has been recreated in structured fields.

This avoids silent or lossy migration of approved starter content.

---

## 6. Save and lifecycle contract

Investigation metadata and investigation content save in **one** autosave transaction through:

`PATCH /api/resources/[id]/investigation`

The shared authoring contract remains mandatory:

- Zod validation
- active admin/editor check
- RLS authorization
- `expectedUpdatedAt` stale-write protection
- Save / Saving / Save failed / conflict states
- autosave never publishes
- publication remains an explicit lifecycle action

---

## 7. Images and library reuse

The builder currently accepts an optional image URL.

Direct selection of reusable Clinical Images, X-Rays, ECGs or other BMCH resources is intentionally deferred to **Increment 7 — Shared BMCH Library Resource Picker**.

The Investigation schema is designed so that resource linkage can be added without replacing the table/interpretation model.

---

## 8. Deliberate V1 limitations

Not included in this increment:

- automatic laboratory reference-range lookup
- automatic abnormality calculation
- patient-specific clinical decision support
- unit conversion
- direct BMCH Library resource picker
- AI interpretation generation
- AI question generation
- multi-user real-time editing

The platform remains a registrar-authored educational resource system, not a diagnostic laboratory system.

---

## 9. Exit criteria

Increment 3 is complete when an editor/admin can:

- create a new Investigation from the Create screen
- enter clinical context and student prompt
- construct and reshape a result table
- enter units and reference ranges as ordinary editable cells/columns
- mark abnormal values
- enter interpretation and teaching sections
- save automatically and reopen without data loss
- preview using the final renderer
- reveal answers during teaching
- publish through the shared lifecycle controls
- edit an existing approved starter investigation without silently losing its original content

The next planned increment is **Increment 4 — Procedure Builder**.
