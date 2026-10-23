"""Register original ImageGen illustration sheets as offline PNGs.

This only isolates/crops authored RGBA sprites and scales them proportionally;
it does not paint, recolor, synthesize, or replace illustration content.
Raw generated sources and the generation brief remain in design/polish3/art.
"""
from pathlib import Path
import argparse
import hashlib
import json
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'design/polish3/art'
OUT = ROOT / 'assets/generated/polish3'
brief = json.loads((SOURCE / 'brief.json').read_text())
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--only-sheet', action='append', default=[], help='Register only this source, retaining every unrelated asset and registration unchanged.')
args = parser.parse_args()
selected = set(args.only_sheet)
assert not selected or selected <= {sheet['file'] for sheet in brief['sheets']}, 'Unknown source sheet'
manifest = {'generator': brief['generator'], 'style_reference': brief['sourceReference'],
            'registration': 'Alpha component ownership; authored pixels cropped and scaled proportionally, never redrawn.',
            'sources': [], 'icons': {}}
registries = {kind: {} for kind in ('jobs', 'actions', 'finance')}
if selected:
    previous = json.loads((OUT / 'manifest.json').read_text())
    manifest['sources'] = [source for source in previous['sources'] if Path(source['file']).name not in selected]
    manifest['icons'] = {key: icon for key, icon in previous['icons'].items() if icon['source'] not in selected}
    for icon in manifest['icons'].values():
        target = OUT / icon['file']
        assert hashlib.sha256(target.read_bytes()).hexdigest() == icon['sha256'], ('Existing illustration changed', icon['id'])
        registries[icon['kind']][icon['id']] = target
for sheet in brief['sheets']:
    if selected and sheet['file'] not in selected:
        continue
    rows, columns = sheet.get('rows', 4), sheet.get('columns', 4)
    cells = rows * columns
    assert len(sheet['entries']) == cells, (sheet['file'], 'cell count')
    source = SOURCE / sheet['file']
    pixels = np.array(Image.open(source).convert('RGBA'))
    height, width = pixels.shape[:2]
    labels, _ = ndi.label(pixels[:, :, 3] > 32)
    counts = np.bincount(labels.ravel()); counts[0] = 0
    bounds = ndi.find_objects(labels)
    centres = ndi.center_of_mass(np.ones(labels.shape), labels, np.arange(1, len(counts)))
    centres = {i: centres[i - 1] for i in range(1, len(counts)) if counts[i]}
    major = [i for i in centres if counts[i] > 1500]
    # Several icons contain two separated people/props. Group each substantial
    # component into its authored row/column, rather than treating it as an icon.
    assignment = {}
    for label in major:
        y, x = centres[label]
        cell = min(rows - 1, int(y * rows / height)) * columns + min(columns - 1, int(x * columns / width))
        by, bx = bounds[label - 1]
        assert bx.stop - bx.start < width / columns * 1.45 and by.stop - by.start < height / rows * 1.45, (sheet['file'], 'joined illustrations')
        assignment[label] = cell
    assert set(assignment.values()) == set(range(cells)), (sheet['file'], 'missing illustration', assignment)
    anchors = {}
    for cell in range(cells):
        group = [label for label in major if assignment[label] == cell]
        weight = sum(counts[label] for label in group)
        anchors[cell] = tuple(sum(centres[label][axis] * counts[label] for label in group) / weight for axis in range(2))
    owners = np.zeros(len(counts), dtype=np.int16)
    for label, centre in centres.items():
        owners[label] = assignment.get(label, min(anchors, key=lambda cell: sum((a - b) ** 2 for a, b in zip(centre, anchors[cell])))) + 1
    # Assign soft antialias edges/low-alpha glow to their nearest solid authored
    # component. This avoids shared low-alpha noise bridging neighbouring cells.
    nearest = ndi.distance_transform_edt(labels == 0, return_distances=False, return_indices=True)
    ownership = owners[labels[tuple(nearest)]]
    rectangles = []
    for cell, entry in enumerate(sheet['entries']):
        keep = (ownership == cell + 1) & (pixels[:, :, 3] > 0)
        yy, xx = np.where(keep)
        rect = [max(0, int(xx.min()) - 2), max(0, int(yy.min()) - 2), min(width, int(xx.max()) + 3), min(height, int(yy.max()) + 3)]
        x0, y0, x1, y1 = rect
        sprite = pixels[y0:y1, x0:x1].copy(); sprite[~keep[y0:y1, x0:x1]] = 0
        icon = Image.fromarray(sprite)
        icon.thumbnail((244, 244), Image.Resampling.LANCZOS)
        canvas = Image.new('RGBA', (256, 256))
        canvas.paste(icon, ((256 - icon.width) // 2, (256 - icon.height) // 2))
        clean = np.array(canvas); clean[clean[:, :, 3] == 0, :3] = 0
        target = OUT / entry['kind'] / (entry['id'] + '.png')
        target.parent.mkdir(parents=True, exist_ok=True)
        Image.fromarray(clean).save(target, optimize=True)
        assert entry['id'] not in registries[entry['kind']], entry['id']
        registries[entry['kind']][entry['id']] = target
        manifest['icons'][entry['kind'] + ':' + entry['id']] = {
            'id': entry['id'], 'kind': entry['kind'], 'file': str(target.relative_to(OUT)),
            'source': sheet['file'], 'cell': cell, 'source_rect': rect, 'subject': entry['subject'],
            'size': [256, 256], 'bytes': target.stat().st_size, 'sha256': hashlib.sha256(target.read_bytes()).hexdigest(),
        }
        rectangles.append({'id': entry['id'], 'kind': entry['kind'], 'cell': cell, 'rect': rect})
    manifest['sources'].append({'file': str(source.relative_to(ROOT)), 'generated_path': sheet['generated'],
        'sha256': hashlib.sha256(source.read_bytes()).hexdigest(), 'size': [width, height], 'sprites': rectangles})
assert len(registries['jobs']) == 62 and len(registries['actions']) == 36 and len(registries['finance']) == 2
assert len({icon['sha256'] for icon in manifest['icons'].values()}) == 100
(OUT / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
for kind, name in [('jobs', 'job'), ('actions', 'personAction'), ('finance', 'finance')]:
    variable = name + 'Images'
    lines = ['// Generated by tools/build-polish3-art.py. Original bundled offline artwork.', 'export const ' + variable + ' = {']
    for key, target in registries[kind].items():
        lines.append(f"  '{key}': require('../../{target.relative_to(ROOT)}'),")
    lines += ['} as const;', '']
    (ROOT / 'src/assets' / (variable + '.ts')).write_text('\n'.join(lines))
print(json.dumps({'icons': len(manifest['icons']), 'jobs': len(registries['jobs']), 'actions': len(registries['actions']), 'finance': 2, 'runtime_bytes': sum(icon['bytes'] for icon in manifest['icons'].values())}))
