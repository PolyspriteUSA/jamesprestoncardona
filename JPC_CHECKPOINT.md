# JPC WEBSITE — CHECKPOINT

Checkpoint: WORKING BASELINE
Status: User confirmed everything is currently working and looking good.

Use this file to resume development from the current known-good state.

---

## CURRENT WORKING ARCHITECTURE

### index.html
Status: WORKING

Contains:
- homepage structure
- Three.js hero/logo integration
- Work section
- About section
- Contact section
- Interactive Experiences popup
- Contact popup
- Resume popup shell

Resume behavior:
- Resume opens as an iframe popup.
- iframe source is `resume.html`.
- iframe reloads with a timestamp/cache-buster when opened.
- X closes the popup.

Do not replace the resume system with:
- Google Drive
- Apps Script
- embedded hard-coded resume inside index.html

unless explicitly requested.

---

### style.css
Status: WORKING

Used as master CSS for:
- homepage
- shared components
- resume.html
- resume iframe/modal styling

Current visual system:
- black / near-black
- white / gray
- violet
- magenta / pink
- no blue accents

Resume styling:
- high-end editorial layout
- name fades white → lavender → pink
- subtle magenta/violet dividers
- timeline treatment for experience
- tool panels
- expertise tags

---

### main.js
Status: WORKING

Used for:
- homepage-specific behavior
- Three.js logo scene
- interactive experience logic where applicable

Do not merge resume document content into main.js.

---

### audio.js
Status: WORKING

Expected behavior:
- single shared background audio instance per normal page
- persists playback state between portfolio pages
- video playback pauses background audio
- background audio resumes after video stops
- game launch stops portfolio audio
- game pages should not play portfolio background music

Singleton protection should remain in place.

---

### resume.html
Status: WORKING

Purpose:
Standalone resume document displayed inside the homepage iframe popup.

Important:
- loads `style.css`
- does NOT load audio.js
- does NOT load main.js
- no navigation
- no Back to Portfolio
- no nested website
- no Google Drive fetching
- no Google Apps Script
- no special parent-page behavior

Keep it a clean resume document.

---

### 404.html
Status: WORKING

Preserve:
- Three.js shader signal field
- mouse interaction
- existing visual design

Current navigation:
- Work
- About
- Contact
- Music On/Off

Uses shared audio.js.

Do not restore old Resume navigation item.

---

### digitalhuman.html
Status: CREATED / ACTIVE

Purpose:
Digital-human / character portfolio page.

Direction:
- inherit the JPC visual language
- dark / cinematic / professional
- digital human workflow
- character gallery
- technical pipeline
- video/reel support

---

## CURRENT REPOSITORY FILES OF INTEREST

Core:
- index.html
- style.css
- main.js
- audio.js
- resume.html
- digitalhuman.html
- 404.html

Interactive:
- groovebox.html
- neontunnel.html
- neonspiders.html
- pinball.html

Assets / system:
- logo.glb
- favicon.ico
- CNAME
- AGENTS.md

---

## LOCKED DESIGN DECISIONS

DO NOT CHANGE unless explicitly requested:

1. No blue accent color.
2. Keep JPC violet + magenta + white palette.
3. Preserve homepage Three.js logo behavior.
4. Resume stays a separate resume.html document in an iframe popup.
5. Resume popup closes with X.
6. Resume.html has no site navigation.
7. Resume.html uses shared style.css.
8. Resume name uses white → lavender → pink gradient.
9. 404 keeps its shader scene.
10. 404 navigation matches current site.
11. Shared portfolio audio should persist across normal pages.
12. Games interrupt portfolio audio.
13. Videos interrupt portfolio audio.
14. Do not broadly reorganize repository folders without explicit request.
15. Do not delete CNAME, logo.glb, favicon.ico, or working game pages.

---

## KNOWN GOOD WORKFLOW

Development:
Local repository → GitHub Desktop → Commit to main → Push origin → GitHub Pages

When a new file is supplied by ChatGPT:
- replace only the named file
- check GitHub Desktop Changes
- commit
- push
- test live site

---

## NEXT POSSIBLE TASKS

Not required; these are simply logical continuation points:

- continue refining digitalhuman.html
- create archviz.html
- create Peltier Ford case-study page
- mark all game links with `data-jpc-game-link`
- standardize shared navigation across remaining portfolio pages
- create additional project/case-study templates
- gradually remove duplicated page-specific CSS where safe

---

## CHECKPOINT RULE

If a future change breaks something unrelated:

Return to this checkpoint's architecture before trying a larger rewrite.

Preferred debugging approach:

1. Identify the exact broken feature.
2. Compare only the involved files.
3. Make the smallest possible correction.
4. Preserve all locked design decisions.
