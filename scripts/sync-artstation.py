"""Fetch a complete public portfolio before replacing the last good snapshot."""
import json
import re
import time
import urllib.request
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
USER = 'jamescardona'

class Text(HTMLParser):
    def __init__(self):
        super().__init__(); self.parts = []
    def handle_starttag(self, tag, attrs):
        if tag == 'br': self.parts.append('\n')
    def handle_endtag(self, tag):
        if tag in ('p', 'div'): self.parts.append('\n\n')
    def handle_data(self, data): self.parts.append(data)

def plain(value):
    parser = Text(); parser.feed(value or '')
    return re.sub(r'\n{3,}', '\n\n', ''.join(parser.parts)).strip()

class Players(HTMLParser):
    def __init__(self):
        super().__init__(); self.sources = []
    def handle_starttag(self, tag, attrs):
        if tag == 'iframe':
            src = dict(attrs).get('src', '')
            if re.match(r'^https://(?:www\.)?(?:youtube(?:-nocookie)?\.com/embed/[\w-]+|player\.vimeo\.com/video/\d+|sketchfab\.com/models/[a-f0-9]{32}/embed)(?:[?/#]|$)', src):
                self.sources.append({'src': src})

def fetch(url):
    for attempt in range(3):
        try:
            request = urllib.request.Request(url, headers={'User-Agent': 'JPC-Portfolio-Sync/1.0', 'Accept': 'application/json'})
            with urllib.request.urlopen(request, timeout=40) as response:
                return json.load(response)
        except Exception:
            if attempt == 2: raise
            time.sleep(2 ** attempt)

def sync():
    target = ROOT / 'data/artstation-projects.json'
    previous = json.loads(target.read_text())
    old = {p['url'].rstrip('/').split('/')[-1]: p for p in previous}
    summaries = []
    for page in range(1, 101):
        batch = fetch(f'https://www.artstation.com/users/{USER}/projects.json?page={page}')
        if not isinstance(batch.get('data'), list): raise ValueError('Invalid ArtStation listing')
        if not batch['data']: break
        summaries.extend(batch['data'])
        if len(summaries) >= batch.get('total_count', float('inf')): break
    else: raise ValueError('Pagination limit reached')
    if not summaries: raise ValueError('Empty feed; keeping the last good portfolio')
    projects = []
    seen = set()
    for summary in summaries:
        key = summary['hash_id']
        if key in seen: raise ValueError('Repeated project in feed')
        seen.add(key)
        project = fetch(f'https://www.artstation.com/projects/{key}.json')
        if project.get('user', {}).get('username', '').lower() != USER:
            raise ValueError('Unexpected project owner')
        prior = old.get(key, {})
        images, media = [], []
        for asset in sorted(project['assets'], key=lambda a: a.get('position', 0)):
            if asset.get('has_embedded_player'):
                parser = Players(); parser.feed(asset.get('player_embedded') or '')
                if not parser.sources: raise ValueError(f'Unsupported media in {key}; keeping current snapshot')
                media.extend(parser.sources)
            elif asset.get('has_image'):
                caption = plain(asset.get('title', ''))
                images.append({'url': asset['image_url'], 'caption': caption, 'alt': caption})
        if not images:
            raise ValueError(f'No project images in {key}; keeping current snapshot')
        title = project['title']
        filename = prior.get('filename') or ('project-' + re.sub(r'[^a-z0-9]+', '-', prior.get('title', title).lower()).strip('-') + '.html')
        category = prior.get('category') or ('Character Assets' if 'jordan' in title.lower() else 'Architectural Visualization')
        if key in old and previous.index(prior) >= 11: category = prior.get('category', '3D Props')
        projects.append({'id': key, 'filename': filename, 'category': category, 'title': title,
                         'url': f'https://jamescardona.artstation.com/projects/{key}',
                         'thumbnail': summary.get('cover', {}).get('thumb_url', images[0]['url']).replace('/smaller_square/', '/medium/'),
                         'description': plain(project.get('description')), 'images': images, 'media': media})
    filenames = [p['filename'] for p in projects]
    if len(set(filenames)) != len(filenames): raise ValueError('Project filenames collide')
    content = json.dumps(projects, ensure_ascii=False, indent=2) + '\n'
    temporary = target.with_suffix('.tmp')
    temporary.write_text(content); temporary.replace(target)
    print(f'Synced {len(projects)} ArtStation projects')

if __name__ == '__main__': sync()
