# Shared Resource Authoring Foundation

## Status

Implemented as **Increment 1** of `20-NEXT-IMPLEMENTATION-PLAN.md`.

This document records the concrete contract that all subsequent native clinical editors must reuse.

The foundation is intentionally generic. Clinical Case, Investigation, Procedure, Media and Question editors should add their own structured-content UI on top of this layer rather than duplicating metadata, autosave, concurrency or lifecycle code.

---

## 1. Shared metadata

All native resource editors now use the same metadata model:

- title
- description
- category
- topic / system
- subtopic
- tags
- audience
- difficulty
- visibility
- status display

Database-backed fields remain database-backed:

- `resources.title`
- `resources.description`
- `resources.category_id`
- `resources.visibility`
- `resources.status`

Flexible clinical metadata remains inside versioned `resources.structured_content`:

- `schema_version`
- `topic`
- `system` compatibility alias
- `subtopic`
- `tags`
- `audience`
- `difficulty`

`topic` and `system` are currently written together for compatibility with older starter resources and future clinical editors.

---

## 2. Shared components

### `components/resource-metadata-editor.tsx`

Reusable controlled metadata UI.

It does not own persistence. Each specialized editor supplies its current metadata state and feeds changes into the shared autosave transaction.

This prevents two independent autosave requests from racing against each other.

### `components/use-resource-autosave.ts`

Reusable debounced autosave contract.

States:

- `Saving…`
- `Saved`
- `Save failed`
- conflict / newer version exists

Behavior:

- default debounce: 850 ms
- every save carries `expectedUpdatedAt`
- HTTP `409` represents a stale editor conflict
- save failures expose Retry
- browser unload is blocked while changes are not safely persisted

Editors use ordinary document navigation for Back/Preview actions so the browser unload guard can protect pending changes.

### `components/resource-actions.tsx`

Shared explicit lifecycle actions:

- Publish
- Move to Draft
- Archive
- Duplicate
- Delete
- immediate Restore after soft delete
- permanent delete for admins where safe
- Add to Presentation entry point
- Generate Questions entry point

`Add to Presentation` and `Generate Questions` are intentionally informational entry points until their later planned increments are implemented.

---

## 3. Autosave vs publication

This distinction is mandatory.

**Autosave never publishes.**

Autosave covers:

- title
- description
- category
- topic/system
- subtopic
- tags
- audience
- difficulty
- visibility
- editor-specific structured content

Publication/lifecycle state changes occur only through explicit actions:

- Publish → `approved`
- Move to Draft → `draft`
- Archive → `archived`

This preserves the documented workflow:

**CREATE → EDIT → PREVIEW → PRESENT → PUBLISH → REUSE**

---

## 4. Concurrency contract

All authoring mutations use optimistic stale-write protection.

Client sends:

`expectedUpdatedAt`

Server:

1. reads current `resources.updated_at`,
2. compares it to the expected value,
3. performs the update with an additional `updated_at = expectedUpdatedAt` predicate,
4. returns HTTP `409` if the resource changed elsewhere.

A stale editor must never silently overwrite a newer resource version.

V1 remains a single-primary-editor model; real-time collaborative editing is still deferred.

---

## 5. API contract

### Generic metadata

`PATCH /api/resources/[id]`

Validates shared editable metadata with Zod and merges flexible metadata into existing structured content without replacing the editor-specific content body.

### Teaching Material

`PATCH /api/resources/[id]/teaching-material`

Uses the same metadata schema but saves metadata and Teaching Material slides in **one** stale-protected mutation.

This is important: Teaching Material must not run one metadata autosave and another slide autosave against the same `updated_at` token.

### Lifecycle

`POST /api/resources/[id]/actions`

Supported actions:

- `publish`
- `move_to_draft`
- `archive`
- `duplicate`
- `soft_delete`
- `restore`
- `permanent_delete`

All request payloads are Zod-validated and the acting user is derived from the authenticated session.

---

## 6. Authorization

Server authoring context requires:

- authenticated Supabase user
- active profile
- role `admin` or `editor`

RLS remains the database authorization boundary.

The resource select policy now permits active admins/editors to retrieve soft-deleted resource records for lifecycle management. Ordinary library and resource pages still explicitly filter `deleted_at is null`, so deleted resources remain absent from normal browsing.

---

## 7. Audit logging

Lifecycle audit events use:

`public.record_audit_event(...)`

This is a `SECURITY DEFINER` function that derives `actor_id` from `auth.uid()`.

Clients are not given direct insert access to `audit_logs`, so they cannot provide an arbitrary audit actor.

Current resource lifecycle audit events include:

- publish
- move_to_draft
- archive
- duplicate
- delete
- restore
- permanent_delete

Migration:

`supabase/migrations/20260906183426_shared_resource_authoring_foundation.sql`

---

## 8. Duplicate behavior

Duplicating a native resource:

- creates a new resource ID
- appends `— Copy` to the title
- assigns ownership to the acting editor
- sets status to Draft
- sets visibility to Private
- preserves structured teaching content
- removes starter/prototype identity markers

Uploaded resources with a `current_version_id` are not duplicated yet. File/version duplication belongs to the uploaded-resource management increment.

---

## 9. Delete behavior

### Soft delete

Sets `resources.deleted_at`.

The current page remains mounted long enough to offer an immediate **Restore** action.

A future library/admin view may provide longer-term deleted-resource browsing and restore management.

### Permanent delete

Admin only.

Permanent deletion is currently blocked for resources with uploaded file versions because storage-object cleanup and version deletion must be transactional. That work remains in the uploaded-resource management increment.

Native resources without file versions may be permanently deleted by admins.

---

## 10. Editor coverage after Increment 1

### Teaching Material

Uses the full shared metadata/autosave/lifecycle foundation plus its existing slide editor.

Teaching Material structured content is now explicitly stamped:

`schema_version: 1`

### Other structured resources

The following resource types can now open the shared metadata/lifecycle editor even before their dedicated clinical builders are implemented:

- Clinical Case
- Investigation
- Procedure
- Clinical Image
- X-Ray
- ECG
- starter Question Bank resource sets
- Guidelines/link resources without file versions

Their existing structured clinical body remains unchanged until the relevant specialized editor increment is built.

---

## 11. Deliberately not included in Increment 1

- Clinical Case stage editing
- Investigation table editing
- Procedure step editing
- media interpretation fields
- Question Editor
- actual resource insertion into Presentations
- actual Generate Questions workflow
- uploaded PDF/PPTX/DOCX metadata/version lifecycle completion
- deleted-resource administration screen
- collaborative editing

These remain in their documented later increments.

---

## 12. Verification

Implementation is considered complete only when:

- Supabase migration is applied
- TypeScript passes
- ESLint passes
- Next.js production build passes
- document-worker compile remains unaffected
- document-worker Docker build remains unaffected
- production web deployment is healthy

The next implementation increment is:

**Increment 2 — Clinical Case Builder**
