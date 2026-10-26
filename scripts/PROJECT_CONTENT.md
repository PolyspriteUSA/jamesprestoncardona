# ArtStation portfolio sync

The public `jamescardona` ArtStation portfolio is checked every six hours by
`.github/workflows/sync-artstation.yml`. GitHub schedules can run late.

To refresh immediately: open the repository's **Actions** tab, select
**Sync ArtStation portfolio**, then **Run workflow** on `main`.

The workflow runs `python scripts/sync-artstation.py`, then
`node scripts/build-projects.cjs`. It updates `data/artstation-projects.json`,
`archviz.html`, and native `project-*.html` pages, commits changed content,
and deploys GitHub Pages explicitly (bot commits do not trigger a Pages build).
Images remain hosted on ArtStation. Supported YouTube, Vimeo, and Sketchfab
players are embedded within native project pages.

A complete, validated feed is required before replacing the last good snapshot.
Network errors, empty feeds, incomplete projects, or unsupported embedded media
fail the workflow without publishing partial content. Check Actions for errors.
ArtStation's public JSON endpoints may change or block automated requests.

Existing project filenames and category overrides are retained in the snapshot.
New projects default to Architectural Visualization (Jordans to Character Assets);
set a project's `category` in the JSON to override it. Removed projects disappear
from the gallery; their old HTML files are retained so old links continue to work.
No standalone Crowley video is restored at the bottom of the gallery.
