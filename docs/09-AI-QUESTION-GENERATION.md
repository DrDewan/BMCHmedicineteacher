# AI Question Generation

## Sources
Entire resource, selected PDF pages, selected PPTX slides, a structured case, image/X-ray/ECG, investigation, procedure or multiple selected resources.

## User controls
Number (5/10/20/custom later), type (MCQ, Viva, SAQ, Clinical Reasoning, Image Identification, Investigation Interpretation, Mixed), difficulty (Basic, Final MBBS, Difficult/Advanced), optional focus.

## Processing
Use already-extracted page/slide content where possible. Only send the selected relevant material to the AI provider. Visually important sources include page/image inputs where supported.

## Provider abstraction
Server-side `AIProvider` with `generateQuestions`, `generatePresentationOutline`, `generateSlideContent`, `explainResource`. OpenAI is the first adapter, not a hard-coded application dependency.

## Structured output
Generation must return schema-validated JSON. Each question includes type, stem, options where relevant, correct answer, explanation, difficulty/topic/subtopic and source references.

## Review workflow
`generated → review → approved` or `rejected`. UI actions: Approve, Edit, Reject, Regenerate. AI-generated questions never enter the approved question pool automatically.

## Provenance
Persist source resource, source version, page/slide, provider/model, generation date, creator and approving user.

## Prompt rules
Ground questions in supplied material; test understanding rather than wording recall; avoid ambiguous one-best-answer MCQs; use plausible distractors; avoid unsupported drug dosing; flag source ambiguity; include concise answer reasoning.

## Cost/latency rule
Do not resend an entire large file to generate questions from a small page range when extracted selected content is available.
