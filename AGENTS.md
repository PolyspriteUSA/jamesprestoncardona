# AGENTS.md

## Website Development Agent

This repository contains my portfolio, interactive experiences, Three.js scenes, and browser-based games.

The AI agent should behave like a careful senior web developer working inside an existing production project.

## Core Technologies

Primary technologies used in this project:

* HTML5
* CSS3
* JavaScript
* Three.js
* WebGL
* GLSL shaders where appropriate
* GLB / GLTF models
* FBX models when necessary
* GitHub Pages
* GitHub
* Responsive browser-based layouts

Avoid introducing large frameworks unless they are specifically requested or clearly necessary.

## Primary Rule

Preserve the existing website.

Do not redesign, restructure, simplify, replace, or remove working portions of the website unless explicitly instructed.

When asked to change one feature, modify only what is necessary for that feature.

## CSS Rules

The existing CSS is considered intentional.

* Do not rewrite the stylesheet unless specifically instructed.
* Do not reorganize CSS simply for cleanliness.
* Do not rename classes without a strong technical reason.
* Do not change colors, spacing, typography, hover behavior, positioning, or animation unless requested.
* Prefer adding small targeted rules over replacing existing styling.
* Avoid global CSS changes that may affect unrelated pages.
* Check desktop and mobile behavior after CSS changes.

If the user says:

"Don't change the CSS"

then existing CSS must remain untouched.

## Visual Design

Maintain the site's established visual identity.

Preferred characteristics include:

* Dark environments
* Sophisticated futuristic presentation
* Minimal interface clutter
* Cinematic presentation
* Pink, purple, magenta, blue, and related accent lighting where already established
* High-end architectural visualization aesthetic
* High-end gaming presentation
* Clean typography
* Smooth transitions
* Subtle glow effects
* Avoid cheesy or overly cartoonish UI unless requested
* Avoid generic template-style interfaces

Procedural graphics should feel intentional and professionally designed.

## Three.js Development

For Three.js scenes:

* Preserve existing camera behavior unless asked to change it.
* Preserve scene composition when fixing bugs.
* Use physically believable scale where practical.
* Avoid unnecessary geometry.
* Reuse geometry and materials where possible.
* Use instancing for repeated objects when beneficial.
* Dispose unused Three.js resources when appropriate.
* Avoid unnecessary render loops.
* Prefer one animation loop per scene.
* Use delta time for animation when appropriate.
* Optimize lighting and shadow counts.
* Avoid excessive real-time shadow-casting lights.
* Keep mobile GPU performance in mind.
* Use responsive canvas sizing.
* Handle browser resize events correctly.
* Avoid hard-coded viewport dimensions unless required.

Before replacing a Three.js implementation, first determine whether the existing implementation can be repaired.

## 3D Asset Rules

Supported assets may include:

* GLB
* GLTF
* FBX
* Textures
* HDR environments
* Procedural geometry

When working with 3D assets:

* Do not change file paths unnecessarily.
* Assume asset names may be referenced elsewhere.
* Prefer GLB/GLTF for final web delivery.
* Flag oversized assets.
* Recommend Draco or Meshopt compression where appropriate.
* Recommend KTX2 / Basis texture compression when appropriate.
* Avoid unnecessarily high-resolution textures.
* Avoid excessive material counts.
* Reduce draw calls where possible.
* Preserve skeletal animation.
* Preserve morph targets unless explicitly unnecessary.
* Do not alter model proportions unless requested.

For characters, check:

* Skeleton compatibility
* Animation mixer setup
* Scale
* Rotation
* Spawn position
* Material loading
* Texture loading
* Bone assignments
* Animation clips

## Loading 3D Models

When a model does not appear:

Check these before replacing the implementation:

1. File path
2. Filename capitalization
3. Network loading errors
4. Loader imports
5. Scene scale
6. Scene position
7. Model rotation
8. Camera clipping
9. Material opacity
10. Lighting
11. Animation setup
12. Browser console errors

Do not automatically replace a failed model with procedural geometry unless explicitly requested.

## Performance

Performance is a major priority.

When changing or adding features, consider:

* Initial page load
* JavaScript bundle size
* Model size
* Texture size
* GPU load
* Draw calls
* Polygon count
* Shader complexity
* Shadow maps
* Memory usage
* Mobile performance
* Animation frame rate

Target smooth interactive performance whenever possible.

Prefer approximately 60 FPS on capable desktop hardware while maintaining reasonable mobile behavior.

Do not sacrifice the visual presentation unnecessarily for minor optimization gains.

## GitHub Pages

All production code must remain compatible with GitHub Pages unless instructed otherwise.

Use:

* Relative paths where appropriate
* Browser-compatible JavaScript
* Static hosting-compatible solutions

Do not introduce server-side requirements without explicitly explaining that they will not run directly on GitHub Pages.

Be careful with filename capitalization because GitHub Pages hosting is case-sensitive.

## Repository Safety

Before major changes:

* Inspect the existing implementation.
* Understand how related files interact.
* Avoid replacing entire files unnecessarily.
* Preserve working functionality.
* Preserve existing asset references.

Never delete files merely because they appear unused without verifying references.

## JavaScript

JavaScript should be:

* Readable
* Modular where practical
* Browser compatible
* Defensive around missing assets
* Free of obvious console errors

Avoid unnecessary dependencies.

Use comments for complex systems but do not excessively comment obvious code.

## Error Handling

Do not silently ignore important failures.

For important assets such as models, textures, audio, and modules:

* Report meaningful console errors.
* Include enough information to identify the failed resource.
* Provide graceful fallback behavior when appropriate.

## Browser Console

After changing JavaScript, look for:

* Syntax errors
* Failed network requests
* Missing modules
* CORS problems
* Undefined variables
* Deprecated APIs
* Shader compilation errors
* WebGL errors

Fix errors caused by the change before considering the task complete.

## Responsive Design

Every interface change should consider:

* Desktop
* Laptop
* Tablet
* Mobile

Avoid layouts that depend entirely on one screen resolution.

Three.js scenes should resize correctly without stretching or changing aspect ratio incorrectly.

## Interactive Experiences

The site may contain several independent interactive experiences and games.

Each experience should remain modular.

Adding a new game should not require rewriting the existing games menu.

Prefer a structure where experiences can be registered using data such as:

* Name
* Description
* Preview image
* HTML page
* Category
* Status

Keep game-specific logic isolated from global website logic.

## Procedural Games

Procedural games should be designed so temporary procedural assets can later be replaced with production assets.

Separate:

* Game logic
* Rendering
* Character definition
* Environment definition
* UI
* Audio
* Asset loading

Do not tightly couple gameplay logic to placeholder geometry.

## Character Systems

Characters may eventually use GLB models instead of procedural placeholders.

Design character systems so a procedural character can be replaced with a loaded model without rewriting the entire game.

Keep these systems separate where practical:

* Movement
* Input
* Animation
* Model rendering
* Collision
* Character stats
* Character selection

## Audio

Web audio should:

* Respect browser autoplay restrictions.
* Begin after appropriate user interaction when required.
* Avoid multiple copies of the same soundtrack playing simultaneously.
* Support looping when intended.
* Avoid restarting unnecessarily when navigating interface states.

## Architecture Portfolio

Architectural visualization pages should prioritize:

* Large imagery
* Clean presentation
* Case-study storytelling
* Minimal interface distraction
* High-quality rendering
* Project information
* Process
* Technical breakdowns
* Before/after or design-development comparisons where useful

Do not make architectural portfolio pages resemble game interfaces unless explicitly requested.

## Testing Before Completion

For each task, verify as much as possible:

* Page loads
* Navigation still works
* No new console errors
* Models load
* Textures load
* Interactions work
* Buttons work
* Layout scales
* Mobile layout has not obviously broken
* Existing functionality remains intact

## Working Method

When given a task:

1. Inspect the relevant files.
2. Identify the smallest reasonable set of changes.
3. Determine whether the issue has a clear root cause.
4. Modify only necessary files.
5. Check for regressions.
6. Report what changed.

Do not immediately rewrite an entire page because one component is broken.

## Communication

When completing development work, provide a concise summary including:

### Changed

Files and systems intentionally modified.

### Fixed

Problems resolved.

### Preserved

Important systems deliberately left unchanged.

### Notes

Any remaining issues, risks, or optional improvements.

Do not provide lengthy explanations unless they are useful.

## User Instruction Priority

Explicit instructions from the user override this document.

Examples:

* "Don't change the CSS."
* "Keep the existing camera."
* "Only change the controller."
* "Don't modify the menu."
* "Use procedural geometry."
* "Do not use procedural geometry."
* "Output the complete HTML."

Treat these as hard constraints.

## Development Philosophy

The goal is not to constantly redesign the website.

The goal is to progressively improve a working production website while protecting previous work.

Prefer:

**inspect → understand → modify → test**

over:

**replace → redesign → hope**
