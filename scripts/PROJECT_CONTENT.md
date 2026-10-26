# ArtStation portfolio sync

A ChatGPT automation named **Sync ArtStation portfolio** checks the public `jamescardona` portfolio every six hours and publishes changed content to `main`. GitHub Pages then deploys the site. GitHub-hosted runners receive HTTP 403 from ArtStation, so fetching runs in the ChatGPT task environment instead.

For an immediate refresh, ask ChatGPT to sync the portfolio, or locally run:

```
python scripts/sync-artstation.py
node scripts/build-projects.cjs
```

The importer updates `data/artstation-projects.json` only after fetching and validating the complete portfolio. The builder updates the gallery in `archviz.html` and native `project-*.html` pages. Commit and push changed files to publish. Images stay hosted on ArtStation; supported YouTube, Vimeo, and Sketchfab players appear inside native project pages.

Network errors, empty feeds, incomplete projects, or unsupported embedded media preserve the last good published content. ArtStation public endpoints may change. Existing project filenames and category overrides are retained in the snapshot. New projects default to Architectural Visualization (Jordans to Character Assets); set `category` in the JSON to override. Removed projects disappear from the gallery; old HTML pages are retained for existing links. The standalone Crowley reel at the bottom of the gallery must remain removed.
