// Regenerate the native gallery and project pages from verified ArtStation URLs.
// Run from the repository root: node scripts/build-projects.cjs
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
const write = (file, content) => fs.writeFileSync(path.join(root, file), content);
const projects = JSON.parse(read('data/artstation-projects.json'));
const escape = text => String(text).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const slug = project => 'project-' + project.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.html';
const category = index => index === 0 ? 'Character Assets' : index >= 11 ? '3D Props' : 'Architectural Visualization';
const image = (project, asset, index, hero = false) => `<figure class="native-project-figure${hero ? ' native-project-hero' : ''}">
  <img src="${escape(asset.url)}" alt="${escape(asset.alt || asset.caption || `${project.title} — view ${index + 1}`)}" ${hero ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">
  ${asset.caption ? `<figcaption>${escape(asset.caption)}</figcaption>` : ''}
</figure>`;
for (const project of projects) {
  if (!project.title || !project.images.length) throw new Error('Missing project title or images');
  for (const asset of project.images) {
    const url = new URL(asset.url);
    if (url.protocol !== 'https:' || !/^cdn[a-z0-9]*\.artstation\.com$/.test(url.hostname)) throw new Error('Unexpected image host');
  }
}
let archviz = read('archviz.html');
const header = archviz.match(/  <header class="site-header">[\s\S]*?<\/header>/)[0];
const sharedEnd = archviz.slice(archviz.indexOf('  <div\n    id="contact-modal"'));
const cards = projects.map((project, index) => `<a class="native-project-card" href="./${slug(project)}">
  <div class="native-project-thumbnail"><img src="${escape(project.thumbnail || project.images[0].url)}" alt="${escape(project.title)}" loading="lazy" decoding="async"></div>
  <div class="native-project-card-copy"><div class="section-kicker">${category(index)}</div><h3>${escape(project.title)}</h3><span class="project-link-label">View Project →</span></div>
</a>`).join('\n');
const gallery = `    <section id="projects" class="archviz-projects" aria-labelledby="projects-title">
      <div class="section-inner">
        <div class="section-kicker">Selected Work</div>
        <h2 class="section-title" id="projects-title">Project gallery.</h2>
        <p class="section-intro">Architecture, characters, and real-time 3D. Select a project to explore its images and breakdown.</p>
      </div>
      <div class="native-project-grid">\n${cards}\n      </div>
    </section>`;
archviz = archviz.replace(/    <section id="projects"[\s\S]*?<\/section>/, gallery).replace(/style\.css\?v=[^"]+/, 'style.css?v=20261018-native-projects');
write('archviz.html', archviz);
projects.forEach((project, index) => {
  const previous = projects[(index + projects.length - 1) % projects.length];
  const next = projects[(index + 1) % projects.length];
  const modelEmbeds = project.media.filter(media => /^https:\/\/sketchfab\.com\/models\/[a-f0-9]{32}\/embed$/.test(media.src)).map(media => `<section class="section-inner" aria-label="Interactive 3D model" style="padding-block: 28px;">
      <iframe src="${escape(media.src)}" title="${escape(project.title)} — interactive 3D model" loading="lazy" allow="autoplay; fullscreen; xr-spatial-tracking" allowfullscreen style="display: block; width: 100%; aspect-ratio: 16 / 9; min-height: 300px; border: 0;"></iframe>
    </section>`).join('\n');
  const description = project.description.split(/\n\s*\n/).filter(Boolean).map(paragraph=>`<p>${escape(paragraph)}</p>`).join('\n');
  const content = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="#050507">
  <title>${escape(project.title)} | James Preston Cardona</title>
  <meta name="description" content="${escape(project.description || project.title + ' — project images by James Preston Cardona.')}">
  <link rel="canonical" href="https://jamesprestoncardona.com/${slug(project)}">
  <link rel="stylesheet" href="./style.css?v=20261018-native-projects">
  <link rel="icon" href="./favicon.ico">
</head>
<body class="native-project-page">
${header}
  <main>
    <section class="native-project-heading section-inner" aria-labelledby="project-title">
      <a class="native-back-link" href="./archviz.html#projects">← All Projects</a>
      <div class="section-kicker">${category(index)}</div>
      <h1 class="section-title" id="project-title">${escape(project.title)}</h1>
    </section>
    ${image(project, project.images[0], 0, true)}
    ${description ? `<section class="native-project-description section-inner" aria-label="Project overview">${description}</section>` : ''}
    ${project.images.length > 1 ? `<section class="native-supporting-images" aria-label="Project image gallery">${project.images.slice(1).map((asset, i) => image(project, asset, i + 1)).join('\n')}</section>` : ''}
    ${modelEmbeds ? modelEmbeds + '\n    ' : ''}<div class="native-project-source section-inner">
      
      <a href="${escape(project.url)}" target="_blank" rel="noopener noreferrer">Original project on ArtStation ↗</a>
    </div>
    <nav class="native-project-pagination section-inner" aria-label="Project navigation">
      <a href="./${slug(previous)}"><span>← Previous Project</span>${escape(previous.title)}</a>
      <a href="./archviz.html#projects">All Projects</a>
      <a href="./${slug(next)}"><span>Next Project →</span>${escape(next.title)}</a>
    </nav>
  </main>
${sharedEnd}`;
  write(slug(project), content);
});
console.log(`Built ${projects.length} native project pages with ${projects.reduce((total,p)=>total+p.images.length,0)} ArtStation-hosted image references.`);
