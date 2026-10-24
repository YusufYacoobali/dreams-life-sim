"""Register the selected single-subject Image Gen icons without changing IDs.

Alpha components locate complete subjects, rather than clipping nominal grid
cells (generated spacing is not exact). Registration only crops and scales;
it does not redraw, recolour or remove backgrounds. Original sheets stay intact.
Requires the same Pillow/numpy/scipy tooling as the existing artwork builders.
"""
from pathlib import Path
from hashlib import sha256
import json
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'design/action-icons'
MANIFEST = ROOT / 'assets/generated/action-symbols/manifest.json'
POLISH3 = ROOT / 'assets/generated/polish3/manifest.json'
OVERRIDES = {
    'mug': 'assets/generated/polish/everyday.png',
    'whistle': 'assets/generated/polish/pet-training.png',
    'teddy': 'assets/generated/polish/toys.png',
    'bell': 'assets/generated/cult/ceremony.png',
    'throne': 'assets/generated/cult/rivalry.png',
    'newspaper': 'assets/generated/cult/scandal.png',
}


def save(image, target):
    image = image.copy()
    image.thumbnail((232, 232), Image.Resampling.LANCZOS)
    canvas = Image.new('RGBA', (256, 256))
    canvas.paste(image, ((256 - image.width) // 2, (256 - image.height) // 2))
    pixels = np.array(canvas)
    pixels[pixels[:, :, 3] == 0, :3] = 0
    target.parent.mkdir(parents=True, exist_ok=True)
    temporary = target.with_suffix('.pending.png')
    Image.fromarray(pixels).save(temporary, optimize=True)
    temporary.replace(target)
    bounds = canvas.getchannel('A').getbbox()
    assert bounds and min(bounds[:2]) >= 10 and max(bounds[2:]) <= 246, target
    return {'file': str(target.relative_to(ROOT)), 'size': [256, 256],
            'bytes': target.stat().st_size, 'sha256': sha256(target.read_bytes()).hexdigest(),
            'alphaBounds': list(bounds)}


def registered_subjects(source, columns, rows, expected):
    pixels = np.array(source)
    alpha = pixels[:, :, 3]
    labels, _ = ndi.label(alpha > 32)
    counts = np.bincount(labels.ravel())
    counts[0] = 0
    objects = ndi.find_objects(labels)
    groups = [[] for _ in range(expected)]
    for component in np.flatnonzero(counts >= 40):
        y, x = ndi.center_of_mass(alpha, labels, [int(component)])[0]
        cell = min(rows - 1, int(y * rows / source.height)) * columns + min(columns - 1, int(x * columns / source.width))
        assert cell < expected
        ys, xs = objects[component - 1]
        # A merged subject/neighbor is not safe to register automatically.
        assert xs.stop - xs.start < source.width / columns * 1.5
        assert ys.stop - ys.start < source.height / rows * 1.5
        groups[cell].append((xs.start, ys.start, xs.stop, ys.stop))
    for boxes in groups:
        assert boxes, 'Missing expected subject'
        rect = [max(0, min(box[0] for box in boxes) - 5), max(0, min(box[1] for box in boxes) - 5),
                min(source.width, max(box[2] for box in boxes) + 5), min(source.height, max(box[3] for box in boxes) + 5)]
        yield rect, source.crop(rect)


def refresh_metadata(path, records):
    data = json.loads(path.read_text())

    def visit(value):
        if isinstance(value, list):
            for child in value:
                visit(child)
        elif isinstance(value, dict):
            name = value.get('file', '')
            if isinstance(name, str) and name.endswith('.png'):
                file = ROOT / name if name.startswith(('assets/', 'design/')) else path.parent / name
                record = records.get(str(file.relative_to(ROOT))) if file.is_relative_to(ROOT) else None
                if record:
                    value['bytes'], value['sha256'] = record['bytes'], record['sha256']
                    value['sourceSheet'] = record['source']
                    value['sourceRect'] = record['source_rect']
            for child in list(value.values()):
                visit(child)

    visit(data)
    if 'runtimeBytes' in data and isinstance(data.get('files'), list):
        data['runtimeBytes'] = sum((path.parent / item['file']).stat().st_size for item in data['files'])
    path.write_text(json.dumps(data, indent=2) + '\n')


if __name__ == '__main__':
    brief = json.loads((SOURCE / 'brief.json').read_text())
    catalog = json.loads(POLISH3.read_text())
    records, sources = {}, []
    for sheet in brief['sheets']:
        path = SOURCE / sheet['file']
        image = Image.open(path).convert('RGBA')
        assert image.getchannel('A').getextrema()[0] == 0, 'Sheet must have transparent gaps'
        placements = list(registered_subjects(image, sheet.get('columns', brief['columns']), sheet.get('rows', brief['rows']), len(sheet['entries'])))
        for cell, (entry, (rect, sprite)) in enumerate(zip(sheet['entries'], placements)):
            kind, key = entry['kind'], entry['id']
            target = ROOT / (OVERRIDES.get(key, 'assets/generated/action-symbols/' + key + '.png') if kind == 'symbols' else 'assets/generated/polish3/' + kind + '/' + key + '.png')
            record = {**save(sprite, target), 'id': key, 'kind': kind, 'source': str(path.relative_to(ROOT)),
                      'source_rect': rect, 'cell': cell, 'subject': entry['subject']}
            records[record['file']] = record
            if kind in ('actions', 'jobs'):
                previous = catalog['icons'][kind + ':' + key]
                catalog['icons'][kind + ':' + key] = {**previous, **record, 'file': str(target.relative_to(POLISH3.parent))}
        sources.append({'file': str(path.relative_to(ROOT)), 'generated_path': sheet['generated_path'],
                        'sha256': sha256(path.read_bytes()).hexdigest(), 'size': list(image.size)})
    for entry in brief.get('reusedSources', []):
        path = ROOT / entry['file']
        source = Image.open(path).convert('RGBA').crop(entry['rect'])
        bounds = source.getchannel('A').getbbox()
        assert bounds
        record = {**save(source.crop(bounds), ROOT / 'assets/generated/action-symbols' / (entry['id'] + '.png')),
                  'id': entry['id'], 'kind': 'symbols', 'source': entry['file'], 'source_rect': entry['rect'],
                  'subject': 'Reused existing clear airplane illustration; no redesign.'}
        records[record['file']] = record
    active_sources = {source['file'] for source in sources}
    catalog['sources'] = [source for source in catalog['sources'] if source['file'] not in active_sources] + sources
    assert len(catalog['icons']) == 100 and len({row['sha256'] for row in catalog['icons'].values()}) == 100
    POLISH3.write_text(json.dumps(catalog, indent=2) + '\n')
    for path in [ROOT / 'assets/generated/polish/manifest.json', ROOT / 'assets/generated/cult/manifest.json']:
        refresh_metadata(path, records)
    data = {'generator': 'Built-in Image Gen', 'registration': 'Alpha components, proportional contain, 232px subject in 256px canvas',
            'sources': sources, 'icons': list(records.values())}
    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(json.dumps(data, indent=2) + '\n')
    print(json.dumps({'registered': len(records), 'selectedActions': 24, 'selectedJobs': 18,
                      'runtimeBytes': sum(record['bytes'] for record in records.values())}))
