# Clinical Case Builder

## Status

Implemented as **Increment 2** of `20-NEXT-IMPLEMENTATION-PLAN.md`.

The Clinical Case Builder sits on top of the shared resource-authoring foundation from `21-SHARED-AUTHORING-FOUNDATION.md`.

Its purpose is to let a registrar create, edit and teach a case as a sequence of progressively revealed clinical stages rather than as one long document.

Core teaching flow:

**PRESENTATION → ASK → REVEAL → REASON → MANAGE**

---

## 1. Creation flow

Editors/admins can open:

`+ Create → Clinical Case`

Initial creation asks for:

- title
- opening description
- system/topic

The new resource is created as:

- `resource_type = case`
- `status = draft`
- `visibility = registrars`
- `structured_content.schema_version = 1`
- `structured_content.native_kind = clinical_case`

A new case begins with:

1. Presentation + vitals
2. Pause and ask

The registrar then adds the remaining stages required for that case.

---

## 2. Structured case stages

Supported initial stage types:

- Presentation + vitals
- Pause and ask
- Focused history
- Examination
- Investigations
- Differential diagnosis
- Diagnosis
- Management
- Escalation / red flags
- Exam traps / teaching pearls
- References
- Legacy imported content

Each stage has a stable ID.

Common fields:

- `id`
- `type`
- `title`
- `style`
- `hidden`

Depending on stage type, it can also contain:

- narrative text
- bullet/question items
- structured vitals
- references
- imported HTML

---

## 3. Stage operations

The editor can:

- select a stage
- add a stage after the selected stage
- move up/down
- duplicate
- delete
- hide from presentation
- change heading
- change visual style

Styles:

- Normal
- Key point
- Warning
- Danger / red flag

Suggested defaults are applied automatically: Pause and Ask uses Key Point; Escalation uses Danger; Teaching Pearls uses Warning.

---

## 4. Presentation stage and vitals

Presentation is a structured narrative plus an editable vital-sign list.

Default vital rows:

- Pulse
- BP
- RR
- SpO₂

The registrar may:

- edit labels/values
- add custom vitals such as Temperature or GCS
- remove unnecessary rows

Vitals use stable row IDs.

---

## 5. Teaching stages

### Pause and ask

One question per line. The presentation viewer renders these as an ordered list.

### Focused history / Examination / Differential / Management / Pearls

One teaching point per line. The viewer renders these as structured lists.

### Investigations / Diagnosis / Escalation

Narrative fields for concise structured clinical teaching.

### References

Each reference contains:

- label
- URL

References open externally in a new tab.

---

## 6. Progressive viewer

Native structured cases use `ClinicalCaseViewer`.

Initial behavior:

- first visible stage shown
- Reveal next
- Previous
- Show all
- Reset
- Full screen

Keyboard controls:

- Right arrow / PageDown / Space → reveal next
- Left arrow / PageUp → previous reveal state
- `F` → full screen

Stages marked Hidden are excluded from the teaching sequence.

The same stage renderer is used inside the editor for stage preview and on the final resource page.

---

## 7. Existing starter cases

The 11 approved starter Clinical Cases predate native authoring and are stored as `body_html` from the approved prototype.

They must not be destructively transformed.

When an old case is opened in the builder:

- the original `body_html` is copied into one `legacy` stage in the client editor
- the visible imported content remains editable
- new structured stages can be added before/after it
- nothing is written back merely by opening the editor
- the conversion is saved only after an actual user edit triggers autosave

When saved, the case becomes a native `clinical_case` resource while preserving the imported approved content inside the legacy stage.

This is intentionally conservative. Automatic semantic splitting of old HTML into clinical fields is not required for V1.

---

## 8. Save contract

Case metadata and case stages save in **one** request:

`PATCH /api/resources/[id]/clinical-case`

Payload contains:

- shared editable metadata
- complete structured case content
- `expectedUpdatedAt`

Server behavior:

1. authenticate active editor/admin
2. Zod-validate metadata and clinical-case schema
3. verify resource is `resource_type = case`
4. compare `expectedUpdatedAt`
5. merge shared metadata into structured content
6. update resource using the stale timestamp predicate
7. return the new `updated_at`

HTTP `409` means a newer resource version exists.

Autosave never changes publication status.

---

## 9. Shared lifecycle

The Case Builder reuses `ResourceActions` from Increment 1:

- Publish
- Move to Draft
- Archive
- Duplicate
- Delete
- Restore
- permanent delete for eligible admin/native resources
- Add to Presentation placeholder
- Generate Questions placeholder

Lifecycle actions are disabled while an autosave is unresolved.

---

## 10. Security and compatibility

- role checks occur server-side
- RLS remains the database boundary
- stale editors cannot silently overwrite newer content
- imported legacy HTML is cleaned before presentation to strip script blocks, inline event handlers and `javascript:` URLs
- no identifiable patient demo information should be added

---

## 11. Explicitly deferred

Not part of Increment 2:

- shared BMCH Library resource picker inside case stages
- linked investigation/image/X-Ray/ECG insertion
- per-stage media upload
- AI case generation
- semantic automatic conversion of legacy prototype HTML
- realtime collaborative editing
- student scoring within a case

These should be added only in their planned increments rather than expanding the Case Builder into a general page builder.

---

## 12. Exit criteria

Increment 2 is complete when:

- editor/admin can create a new Clinical Case from `+ Create`
- all documented stage types can be added and edited
- stages can be reordered, duplicated, hidden and deleted
- presentation vitals are editable
- references are editable
- metadata and stages autosave together
- stale-write protection works
- preview/presentation progressively reveals stages
- fullscreen and keyboard teaching controls work
- existing approved starter cases open without losing their original content
- shared lifecycle actions remain available
- TypeScript passes
- ESLint passes
- production Next.js build passes
- production deployment remains healthy
