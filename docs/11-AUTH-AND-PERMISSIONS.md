# Authentication and Permissions

## Authentication
Supabase Auth. Initial login may use email/password; magic link or institutional SSO can be added later.

## Roles
- `admin`: full department/resource/user approval access.
- `editor`: registrar/faculty content creation and teaching workflows.
- `viewer`: student/read-only approved content and allowed practice.

Store authorization role in trusted application data/profile records and/or app metadata, not user-editable auth `user_metadata`.

## RLS rules
Every public/exposed table has RLS enabled. Policies must combine authentication with actual authorization/ownership/visibility predicates; `TO authenticated` alone is not sufficient.

## Example resource access
Viewer: approved resources where visibility permits students.
Editor: department-visible approved resources plus own drafts and permitted edits.
Admin: all non/permanently deleted resources and privileged actions.

## Storage
Buckets are private. Signed URLs or authenticated storage access are issued only after row-level authorization checks. Service-role credentials are server-only.

## Mutations
Privileged write actions must validate inputs server-side. Deletion/approval/role changes should produce audit log entries.
