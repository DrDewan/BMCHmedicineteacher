# Database Schema

Use Supabase PostgreSQL. All tables in exposed schemas require RLS.

## profiles
`id uuid PK -> auth.users`, `full_name`, `role`, `department`, `is_active`, timestamps.
Roles initially: admin, editor, viewer. Authorization data must not rely on user-editable user metadata.

## resource_categories
`id uuid`, `slug unique`, `name`, `description`, `sort_order`, `is_active`.

## resources
`id uuid`, `title`, `description`, `category_id`, `resource_type`, `owner_id`, `visibility`, `status`, `current_version_id`, `structured_content jsonb`, timestamps, `deleted_at`.
Status: draft, approved, archived. Visibility: private, registrars, department, students.

## resource_versions
`id uuid`, `resource_id`, `version_number`, `original_filename`, `mime_type`, `file_size`, `storage_path`, `preview_path`, `processing_status`, `created_by`, `created_at`.
Storage path is immutable. Replacing a file creates a new version.

## resource_pages
`id uuid`, `resource_version_id`, `page_number`, `text_content`, `thumbnail_path`, `image_path`, `metadata jsonb`.
For PPTX, page_number represents slide number.

## tags / resource_tags
Normalized tags with many-to-many resource membership.

## presentations
`id`, `title`, `subtitle`, `description`, `owner_id`, `status`, `visibility`, `theme`, timestamps, `deleted_at`.

## presentation_slides
`id`, `presentation_id`, `sort_order`, `slide_type`, `content jsonb`, optional `source_resource_id`, optional `source_page`, `speaker_notes`, timestamps.

## questions
`id`, `question_type`, `stem`, `options jsonb`, `correct_answer jsonb`, `explanation`, `difficulty`, `topic`, `subtopic`, `status`, `created_by`, `approved_by`, timestamps.
Status: generated, review, approved, rejected, archived.

## question_sources
Links question to resource/version/page/slide and stores source metadata.

## practice_sessions
`id`, optional `user_id`, `mode`, `question_count`, `score`, `settings jsonb`, start/completion timestamps.

## practice_session_questions
Session/question relationship, order, selected answer, correctness and answer time.

## ai_jobs
Tracks type, resource, requester, provider/model, input/output metadata, status/error and timestamps.

## audit_logs
Tracks privileged mutations: upload, rename, delete/restore, approval, publication, role changes.
