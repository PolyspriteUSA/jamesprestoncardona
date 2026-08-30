# JPC WEBSITE — PROJECT RULES / SOURCE OF TRUTH

Project: JamesPrestonCardona.com
Purpose: Portfolio site for real-time 3D, Unreal Engine, architectural visualization, digital humans, interactive experiences, and related work.

This file is the permanent source of truth for design and development decisions.
Before making major website changes, read this file first.

---

## 1. CORE DESIGN LANGUAGE

The site should feel:

- dark
- minimal
- cinematic
- polished
- editorial
- high-end
- technical
- real-time / digital
- professional rather than "gaming UI"

Avoid:

- generic cyberpunk HUD styling
- excessive neon
- heavy glowing boxes
- blue accents
- random redesigns of working components
- unnecessary page restructuring

---

## 2. COLOR PALETTE

Use only the JPC logo/site palette:

- near-black / black backgrounds
- white
- gray
- violet / purple
- magenta / pink

Current primary variables:

- --bg: #050507
- --bg2: #08080c
- --text: #f5f5f7
- --violet: #9a62ff
- --magenta: #ff38d1

Do not introduce blue as an accent color.

Gradient text should generally move:

white → soft lavender → pink

---

## 3. SHARED FILES

The website currently uses these shared files:

### style.css
Master styling for the site.

Rules:
- Reuse existing classes whenever practical.
- Add reusable styles here instead of duplicating them across pages.
- Do not casually replace the whole stylesheet.
- Preserve existing homepage behavior and appearance unless specifically requested.

### main.js
Homepage-specific JavaScript and Three.js behavior.

Rules:
- Keep homepage Three.js/logo behavior here.
- Do not put unrelated page logic here when it can live elsewhere.
- Do not rewrite working Three.js behavior unless specifically requested.

### audio.js
Shared portfolio background-music controller.

Rules:
- Only one background music instance should exist per page.
- Preserve the singleton guard.
- Normal portfolio pages should use shared persistent audio.
- Music state and playback position should persist between normal pages.
- Videos should pause background music while playing.
- Background music should resume when videos stop/finish.
- Game pages should not play the portfolio background track.
- Game links should be marked with `data-jpc-game-link`.

---

## 4. HOMEPAGE — index.html

Current homepage behavior that should stay intact unless explicitly changed:

- Three.js JPC logo scene
- JPC hero design
- Work section
- About section
- Contact section
- Interactive Experiences popup
- Contact popup
- Music On/Off control
- Resume popup

Navigation:
- Work
- About
- Contact
- Music On/Off

Hero buttons:
- View Work
- Resume
- Contact

Do not replace the existing visual language with a new template.

---

## 5. RESUME SYSTEM

The resume uses:

- `resume.html` as a separate document
- `style.css` for all resume styling
- `index.html` opens `resume.html` inside an iframe popup

Important behavior:

- Resume popup has a simple close X at the top.
- No nested site navigation inside resume.html.
- No Back to Portfolio button inside resume.html.
- No audio.js inside resume.html.
- No Google Drive fetch.
- No Google Apps Script fetch.
- No embedded Google Drive content.
- No resume-specific site navigation.

The iframe should be cache-busted when opened so changes to resume.html appear immediately.

Current iframe pattern:

`resume.html?v=<timestamp>`

Resume design:

- polished editorial layout
- white → lavender → pink gradient on the name
- subtle violet/magenta accents
- professional, restrained visual treatment
- resume styling lives in style.css

---

## 6. 404 PAGE

404.html has its own Three.js / shader scene.

Preserve:

- signal-field shader effect
- mouse interaction
- current JPC visual palette
- full-screen presentation

Navigation should match the current site:

- Work
- About
- Contact
- Music On/Off

Do not restore the old Resume menu item to the 404 navigation unless explicitly requested.

404.html should load the shared audio.js so portfolio music continues through the 404 page.

---

## 7. DIGITAL HUMAN PAGE

digitalhuman.html is a dedicated portfolio page for:

- digital humans
- character development
- clothing
- rigging
- motion capture
- animation
- Unreal Engine character integration

It should visually inherit the JPC system.

Avoid redesigning it away from the homepage aesthetic.

---

## 8. INTERACTIVE EXPERIENCES / GAMES

Current interactive experience pages include:

- neontunnel.html
- groovebox.html
- neonspiders.html
- pinball.html

Rules:

- Portfolio background music should stop when a game launches.
- Game audio can take over.
- Returning to a normal portfolio page should resume the portfolio audio state.
- Use `data-jpc-game-link` on portfolio links that launch games.
- Do not force the portfolio audio controller into game pages.

---

## 9. FILE / REPOSITORY RULES

Repository root currently contains primary HTML files and shared files.

Do not reorganize folders unless there is a clear reason and the user specifically wants it.

Important:
- CNAME must not be deleted or casually edited.
- favicon.ico should be preserved.
- logo.glb should be preserved.
- Working game pages should not be rewritten during unrelated site cleanup.

When editing:
1. Change only the files needed for the request.
2. Avoid rewriting unrelated code.
3. Keep existing working behavior.
4. Test links and paths mentally before moving files.
5. Prefer small, controlled changes over broad replacements.

---

## 10. GITHUB WORKFLOW

The user uses GitHub Desktop.

Normal workflow:

1. Edit files in the local `jamesprestoncardona` repository.
2. Review changed files in GitHub Desktop.
3. Commit to `main`.
4. Push origin.
5. Wait for GitHub Pages deployment.
6. Hard refresh when needed with Ctrl + Shift + R.

Do not assume a local change is live until it has been committed and pushed.

---

## 11. CHANGE POLICY

When the user says something is working and looking good:

- treat that as a locked checkpoint
- preserve it unless a requested change requires touching it
- do not redesign unrelated parts
- do not undo working behavior to solve an unrelated issue

Before a major change, identify:

- what must change
- what must stay the same
- which files should be touched
- which files should not be touched

---

## 12. PROJECT CONTINUITY

When starting a new ChatGPT conversation:

Provide or upload:

- JPC_PROJECT_RULES.md
- JPC_CHECKPOINT.md
- any files currently being edited

These files should be treated as the first reference before making changes.
