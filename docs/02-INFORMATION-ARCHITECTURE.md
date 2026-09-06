# Information Architecture

## Main navigation
Homepage tiles:
1. Clinical Cases
2. Teaching Materials
3. Clinical Images
4. X-Rays
5. ECG
6. Investigations
7. Procedures
8. Question Bank
9. Guidelines
10. Practice Round

Header actions: Search, Upload Resource, Build Presentation, account/profile.

## Route map
- `/` homepage
- `/library` all resources
- `/library/[category]` category library
- `/resources/[id]` resource viewer
- `/resources/[id]/edit` metadata/structured-content editor
- `/upload` upload flow
- `/presentations` presentation library
- `/presentations/new` create presentation
- `/presentations/[id]/edit` builder
- `/presentations/[id]/present` teaching mode
- `/questions` question bank/review
- `/practice` practice setup
- `/practice/[sessionId]` active practice
- `/admin` administrative area

## Resource taxonomy
`category` describes educational grouping; `resource_type` describes rendering/storage behavior. They are independent.

Categories initially: clinical_case, teaching_material, clinical_image, xray, ecg, investigation, procedure, question_bank, guideline.

Types initially: pdf, pptx, docx, image, structured_case, structured_investigation, structured_procedure, native_presentation, question_set, external_link.

## Library card
Thumbnail, title, type, description, tags, updated date. Authorized overflow actions: Open, Present, Rename, Edit details, Generate questions, Add to presentation, Download original, Delete.

## Teaching-mode principle
Administrative actions disappear in teaching/presenter modes. Content occupies the screen; controls are minimal and projector-friendly.
