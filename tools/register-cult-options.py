"""Register six single-subject cult option icons from their original sheet.

Uses the shared alpha-component crop and contain tooling. No recolouring,
background removal or redraw; the source sheet remains intact.
"""
from pathlib import Path
from hashlib import sha256
import importlib.util
import json
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('simple_icons', ROOT / 'tools/register-simple-icons.py')
registration = importlib.util.module_from_spec(spec)
spec.loader.exec_module(registration)

if __name__ == '__main__':
    directory = ROOT / 'design/cult-options'
    brief = json.loads((directory / 'brief.json').read_text())
    source = directory / brief['file']
    image = Image.open(source).convert('RGBA')
    assert image.getchannel('A').getextrema()[0] == 0, 'Sheet needs transparent gaps'
    placements = list(registration.registered_subjects(image, 3, 2, 6))
    records = []
    for cell, (entry, (rect, sprite)) in enumerate(zip(brief['entries'], placements)):
        target = ROOT / 'assets/generated/cult-options' / (entry['id'] + '.png')
        records.append({**registration.save(sprite, target), **entry,
                        'cell': cell, 'source_rect': rect})
    manifest = {'generator': 'Built-in Image Gen', 'date': brief['date'],
                'source': str(source.relative_to(ROOT)),
                'sourceSha256': sha256(source.read_bytes()).hexdigest(),
                'sourceSize': list(image.size), 'icons': records,
                'runtimeBytes': sum(record['bytes'] for record in records)}
    target = ROOT / 'assets/generated/cult-options/manifest.json'
    target.write_text(json.dumps(manifest, indent=2) + '\n')
    print(json.dumps({'icons': len(records), 'runtimeBytes': manifest['runtimeBytes']}))
