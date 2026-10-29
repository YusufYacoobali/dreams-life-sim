"""Losslessly optimize runtime PNGs; optional tooling, never part of app startup.

Install tools/requirements-asset-optimization.txt, then run from any directory.
Every output is decoded and checked before replacement. Originals in design/
and the user-selected launcher icon are deliberately outside this scope.
"""
import argparse
from concurrent.futures import ProcessPoolExecutor
from hashlib import sha256
from io import BytesIO
import json
import os
from pathlib import Path

os.environ.setdefault('RAYON_NUM_THREADS', '1')
from PIL import Image
import oxipng

ROOT = Path(__file__).resolve().parents[1]


def optimize(file):
    path = ROOT / file
    old = path.read_bytes()
    new = oxipng.optimize_from_memory(old, level=3, optimize_alpha=False,
        strip=oxipng.StripChunks.none(), color_type_reduction=False,
        bit_depth_reduction=False, grayscale_reduction=False, palette_reduction=False)
    before = Image.open(BytesIO(old)).convert('RGBA')
    after = Image.open(BytesIO(new)).convert('RGBA')
    assert before.size == after.size and before.tobytes() == after.tobytes(), file
    assert old[24:26] == new[24:26], 'PNG depth/colour type changed: ' + file
    if len(new) < len(old):
        path.write_bytes(new)
    return file, len(old), min(len(old), len(new)), sha256(before.tobytes()).hexdigest()


def refresh_manifest(path):
    data = json.loads(path.read_text())
    changed = False

    def visit(value):
        nonlocal changed
        if isinstance(value, list):
            for item in value:
                visit(item)
        elif isinstance(value, dict):
            file = value.get('file', '')
            if isinstance(file, str) and file.endswith('.png'):
                image = ROOT / file if file.startswith(('assets/', 'design/')) else path.parent / file
                if image.is_file():
                    encoded = image.read_bytes()
                    for key, actual in [('bytes', len(encoded)), ('sha256', sha256(encoded).hexdigest())]:
                        if key in value and value[key] != actual:
                            value[key] = actual
                            changed = True
            for child in value.values():
                visit(child)

    visit(data)
    if 'runtimeBytes' in data and isinstance(data.get('files'), list):
        files = [path.parent / item['file'] for item in data['files'] if isinstance(item, dict) and 'file' in item]
        if files and len(files) == len(data['files']) and all(file.is_file() for file in files):
            total = sum(file.stat().st_size for file in files)
            if data['runtimeBytes'] != total:
                data['runtimeBytes'] = total
                changed = True
    if changed:
        if data.get('pngsUnmodified'):
            data['pngsUnmodified'] = False
            data['encoding'] = 'Lossless PNG recompression; decoded pixels, alpha and dimensions unchanged.'
        path.write_text(json.dumps(data, indent=2) + '\n')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('directories', nargs='*', default=['assets/generated', 'assets/minigames'])
    parser.add_argument('--workers', type=int, default=2)
    parser.add_argument('--report', type=Path)
    args = parser.parse_args()
    files = sorted(str(p.relative_to(ROOT)) for folder in args.directories
                   for p in (ROOT / folder).rglob('*.png'))
    with ProcessPoolExecutor(max_workers=args.workers) as pool:
        rows = list(pool.map(optimize, files))
    for path in (ROOT / 'assets').rglob('*.json'):
        refresh_manifest(path)
    summary = {'checkedImages': len(rows), 'changedImages': sum(a != b for _, a, b, _ in rows),
        'beforeBytes': sum(a for _, a, _, _ in rows), 'afterBytes': sum(b for _, _, b, _ in rows),
        'rgbaPixelsUnchanged': True,
        'decodedPixelSha256': sha256('\n'.join(file + ':' + pixels for file, _, _, pixels in rows).encode()).hexdigest()}
    if args.report:
        args.report.write_text(json.dumps(summary, indent=2) + '\n')
    print(json.dumps(summary))
