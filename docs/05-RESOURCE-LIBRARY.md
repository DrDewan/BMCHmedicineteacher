# Resource Library

## Resource concept
A resource can be an uploaded file, native BMCH teaching object or external link. The UI must not assume every resource is downloadable.

## Upload flow
1. Select/drag file.
2. Validate extension/MIME/size.
3. Pre-fill editable display title from filename.
4. Select category, topic/subtopic, tags, description and visibility.
5. Create resource/version record.
6. Upload original to private storage using immutable resource/version path.
7. Mark processing state and invoke Document Worker if required.

## Storage buckets
Suggested private buckets: `resource-originals`, `resource-previews`, `resource-thumbnails`, `presentation-assets`.

## Naming
Display title is metadata. Storage object path uses IDs, e.g. `resources/<resource-id>/<version-id>/original.pdf`. Renaming must never require moving the original object.

## Versioning
Replacement creates another `resource_versions` row and updates `current_version_id`; prior versions remain accessible to authorized users.

## Deletion
Default is soft delete. Admin restore is supported. Permanent deletion is a separate privileged operation and removes derivatives as well as originals.

## Search
V1 searches title, description, tags and extracted document text using Postgres full-text capabilities. Semantic search is later.

## Filters
Category, resource type, topic/subtopic, tags, status, visibility, uploader, updated date.

## Processing states
`uploading`, `processing`, `ready`, `failed`. Preview failure never deletes the original. UI offers original download and admin reprocess.
