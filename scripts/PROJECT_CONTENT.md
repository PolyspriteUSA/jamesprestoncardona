# ArtStation project content

`data/artstation-projects.json` contains the public project titles, descriptions, captions, image URLs, and model links verified on 2026-10-18. Images remain hosted on ArtStation; no project images are stored in this repository.

Run `node scripts/build-projects.cjs` from the repository root after updating the data. It regenerates the gallery in `archviz.html` and all 13 `project-*.html` pages. The first image in each project is its hero; remaining images retain source order and captions. Existing descriptions and credits are preserved. Blank source descriptions stay blank.

This is a static content snapshot, not an automatic ArtStation sync. Changes to project lists, descriptions, captions, or image URLs require updating the JSON and rebuilding. An image changed in place at the same URL follows ArtStation's cache behavior. Deleted or replaced ArtStation URLs may stop loading.

The Denon and gas-pump Sketchfab models are available via explicit external links; their images and descriptions are native HTML. No ArtStation page iframe, proxy, or API is needed at runtime.
