# Acceptance Criteria

## Foundation
- Repository builds with supported Node/npm versions.
- TypeScript strict mode passes.
- Production `next build` succeeds.
- Vercel can deploy without document-worker binaries.
- Environment validation fails clearly when required variables are missing.

## Resource Library
Authorized editor can upload supported files, assign category/title/tags/visibility, rename without moving storage object, replace as new version, search, open, download original, soft delete and restore.

## Viewers
PDF: reliable load, thumbnails, navigation, zoom, fit and fullscreen.
PPTX: preview slides, thumbnails, navigation and fullscreen.
Images: zoom/fullscreen.
X-ray: zoom/pan and reveal interpretation.
ECG: zoom and reveal structured interpretation.

## Native Authoring — Common
Authorized editor can create a new BMCH-native teaching resource without code/database access, edit metadata, autosave, preview with the final renderer, reopen and continue editing, duplicate, archive and soft delete.

Draft editing and publication are separate. Autosave must never automatically approve/publish a draft.

Existing uploaded PDF/PPTX/DOCX contents are not edited as arbitrary Office documents inside BMCH; users can edit metadata, upload a replacement version, or convert source material into a native resource.

## Teaching Material Editor
Editor can:
- create a slide-based Teaching Material,
- add predefined medical slide templates,
- edit slide content,
- reorder slides,
- duplicate/delete slides,
- attach or select existing BMCH images/X-rays/ECGs/investigations/cases,
- preserve source-resource provenance where applicable,
- preview the material,
- present it fullscreen,
- reopen it later and continue editing.

Teaching Material remains distinct from a custom Presentation.

## Clinical Case Builder
Editor can create/update a staged case including presentation, vitals, pause-and-ask prompts, examination, investigations, differential, diagnosis, management, escalation/red flags and teaching pearls. Stages can be added, removed and reordered, and the final viewer supports progressive disclosure.

## Investigation Builder
Editor can create/edit clinical context, result table, prompt, interpretation, differential, next steps, management implications and teaching points. Result-table rows/columns can be modified without editing raw JSON.

## Procedure Builder
Editor can create/edit overview, indications, safety checks, equipment, preparation, ordered procedure steps, complications, aftercare, common errors and viva questions. Individual procedure steps can have their own images and warnings.

## Media Editors
Editor can create/edit Clinical Image, X-Ray and ECG resources, including image, title, system/topic, structured interpretation/teaching points and source/licence attribution. Preview uses the presentation-style media viewer and hides the final interpretation until revealed.

## Question Editor
Editor can manually create/edit supported question types, answers, explanations, difficulty, topic/subtopic and source provenance. AI-generated questions open in the same editor as drafts and remain excluded from approved practice until review/approval.

## Presentation Builder
Editor can create/rename deck, add template slides, insert existing resources, reorder/duplicate/delete, save, preview, present fullscreen and export PPTX.

Editing a Presentation must not silently mutate the source Teaching Material/resource it references.

## AI Questions
Editor can choose source/range/type/count/difficulty, generate structured drafts, see provenance, edit, approve/reject/regenerate. Drafts are excluded from approved practice pool.

## AI-Assisted Authoring
Editor can request a new native Teaching Material from an AI prompt or from an uploaded source document/range. AI output opens as an editable Draft, never as automatically approved department content.

## Practice
User can start a mixed round, receive approved diverse question types, answer/reveal, see explanation, finish, see score/breakdown and start another round.

## Security
RLS is enabled on exposed tables, private files are not anonymously reachable, service secrets never appear in client bundles, viewer role cannot perform editor/admin mutations, and identifiable patient data is not included in demo seed content.

## Authoring Concurrency
A stale editor must not silently overwrite a newer server version. V1 may use `updated_at` or a revision token to detect conflicting saves. Real-time collaborative editing is not required for V1.
