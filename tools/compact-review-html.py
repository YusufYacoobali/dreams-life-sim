"""Replace duplicated inline review images with shared lossless image files.

Run after generating review HTML. Decoded RGBA pixels are checked exactly.
The HTML and its relative media remain viewable together, including offline.
"""
import argparse
import base64
from hashlib import sha256
from io import BytesIO
import json
import os
from pathlib import Path
import re
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
MEDIA = ROOT / 'docs/verification/media'
STORED = {}


def compact(path):
    original = path.read_text()
    assets = set()

    def store(encoded, extension='png'):
        data = base64.b64decode(encoded, validate=True)
        digest = sha256(data).hexdigest()
        if digest in STORED:
            target = STORED[digest]
            assets.add(target)
            return Path(os.path.relpath(target, path.parent)).as_posix()
        source = Image.open(BytesIO(data))
        image = source.convert('RGBA')
        output = BytesIO()
        options = {'icc_profile': source.info['icc_profile']} if source.info.get('icc_profile') else {}
        image.save(output, format='WEBP', lossless=True, exact=True, method=6, **options)
        optimized = output.getvalue()
        decoded = Image.open(BytesIO(optimized)).convert('RGBA')
        assert image.size == decoded.size and image.tobytes() == decoded.tobytes()
        # Preserve nonstandard gamma metadata rather than changing its display.
        if len(optimized) < len(data) and source.info.get('gamma') in (None, 0.45455):
            data, extension = optimized, 'webp'
        target = MEDIA / (digest + '.' + extension)
        MEDIA.mkdir(exist_ok=True)
        if target.exists():
            assert target.read_bytes() == data
        else:
            target.write_bytes(data)
        STORED[digest] = target
        assets.add(target)
        return Path(os.path.relpath(target, path.parent)).as_posix()

    text = re.sub(r'data:image/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)',
        lambda m: store(m[2], 'jpg' if m[1] == 'jpeg' else m[1]), original)
    for name in ['encodedAssets', 'encoded']:
        marker = re.search(r'\b' + name + r'=\{', text)
        if not marker:
            continue
        start = marker.end() - 1
        values, length = json.JSONDecoder().raw_decode(text[start:])
        if not values or not all(isinstance(v, str) and v.startswith('iVBOR') for v in values.values()):
            continue
        loop = (r"for\(const\[key,(?:base64|data)\]of Object.entries\(" + name +
                r"\)\)\{const bytes=Uint8Array.from\(atob\((?:base64|data)\),c=>c.charCodeAt\(0\)\);"
                r"urls\[key\]=URL.createObjectURL\(new Blob\(\[bytes\],\{type:'image/png'\}\)\);\}")
        assert re.search(loop, text), 'Unrecognized review asset decoder: ' + str(path)
        text = text[:start] + json.dumps({k: store(v) for k, v in values.items()}, separators=(',', ':')) + text[start + length:]
        text, count = re.subn(loop, 'Object.assign(urls,' + name + ');', text)
        assert count == 1
    # The two earliest portrait reviews contain a separate legacy atlas.
    legacy = re.compile(r"const atlasBytes = Uint8Array.from\(atob\('([A-Za-z0-9+/=]+)'\), character => character.charCodeAt\(0\)\);\s*const atlasURL = URL.createObjectURL\(new Blob\(\[atlasBytes\], \{ type: 'image/png' \}\)\);")
    text = legacy.sub(lambda m: 'const atlasURL = ' + json.dumps(store(m[1])) + ';', text)
    legacy_inline = re.compile(r"URL.createObjectURL\(new Blob\(\[Uint8Array.from\(atob\('([A-Za-z0-9+/=]+)'\),c=>c.charCodeAt\(0\)\)\],\{type:'image/png'\}\)\)")
    text = legacy_inline.sub(lambda m: json.dumps(store(m[1])), text)
    if text != original:
        path.write_text(text)
    return {'file': str(path.relative_to(ROOT)), 'beforeBytes': len(original.encode()),
            'afterBytes': len(text.encode()), 'imageReferences': len(assets)}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('html', nargs='*', type=Path)
    args = parser.parse_args()
    files = args.html or sorted((ROOT / 'docs/verification').rglob('*.html'))
    rows = [compact(p.resolve()) for p in files]
    print(json.dumps({'pages': rows, 'sharedMediaBytes': sum(p.stat().st_size for p in MEDIA.glob('*'))}))
