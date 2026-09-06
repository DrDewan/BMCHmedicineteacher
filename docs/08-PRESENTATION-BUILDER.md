# Presentation Builder

## Principle
Build a constrained medical teaching tool, not a PowerPoint clone.

## Creation modes
- Blank presentation
- Build from selected library resources
- Later: AI-assisted outline/deck

## Slide templates
Title, Learning Objectives, Teaching Point, Bullet List, Two Column, Clinical Case, Clinical Image, X-Ray, ECG, Investigation, Procedure, Question, Answer, Algorithm/Flow, Summary, References.

## Editor layout
Left: slide thumbnails and drag reorder. Centre: slide editor. Right: template/properties/resource selection. Top: Add Slide, Preview, Present, Save, Export.

## Slide data
Persist structured JSON rather than rendered HTML. A slide may optionally reference a source resource/page so updates/provenance can be understood.

## Operations
Add, reorder, duplicate, delete, change template, autosave, rename deck, duplicate deck, soft delete.

## Reuse
Every compatible resource detail page should expose `Add to presentation`. Selecting a deck creates the appropriate slide type pre-populated from the resource.

## Preview/Present
Preview shows student-facing rendering. `/presentations/[id]/present` is the minimal fullscreen teaching view.

## Export
Use PptxGenJS server-side to export native BMCH decks using a department slide master, logo/footer, consistent typography and page numbering.

## Explicit non-goal
No arbitrary pixel-level canvas, animation timeline, collaborative cursor system or full Office editing in early versions.
