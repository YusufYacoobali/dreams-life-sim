"""Gzip old large verification records while preserving their exact bytes.

Only records dated before 22 October 2026 are candidates. Current summaries,
test fixtures, artwork and source are outside this scope. Restore a readable
copy with --restore DIRECTORY; the committed originals remain compressed.
"""
import argparse
import gzip
from hashlib import sha256
import json
from pathlib import Path
import re
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parents[1]
RECORDS = ROOT / 'docs/verification'
INDEX = RECORDS / 'compressed-records.json'
SUFFIXES = {'.json', '.ndjson', '.xml', '.txt', '.out', '.log', '.bin'}


def restore(rows, destination):
    for row in rows:
        data = gzip.decompress((ROOT / row['compressed']).read_bytes())
        assert len(data) == row['bytes'] and sha256(data).hexdigest() == row['sha256']
        path = destination / row['original']
        if path.exists():
            assert path.read_bytes() == data, 'Refusing to overwrite: ' + str(path)
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(data)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--apply', action='store_true')
    parser.add_argument('--restore', type=Path)
    args = parser.parse_args()
    rows = json.loads(INDEX.read_text()) if INDEX.exists() else []
    if args.restore:
        restore(rows, args.restore.resolve())
        print(json.dumps({'restoredFiles': len(rows), 'exactOriginalBytes': sum(row['bytes'] for row in rows)}))
        raise SystemExit
    # These folders are never candidates, but also protect explicit test/tool
    # imports of a historical record rather than breaking a live consumer.
    consumers = '\n'.join(p.read_text() for folder in ['src', 'app', 'tests', 'tools']
                         for p in (ROOT / folder).rglob('*') if p.suffix in {'.ts', '.tsx', '.cjs', '.py'})
    additions = []
    for path in sorted(RECORDS.rglob('*')):
        dates = re.findall(r'202610\d{2}', str(path.relative_to(RECORDS)))
        if not path.is_file() or path.suffix not in SUFFIXES or path.stat().st_size < 65536:
            continue
        if not dates or max(dates) >= '20261022':
            continue
        relative = str(path.relative_to(ROOT))
        if relative in consumers or path.name in consumers:
            continue
        data = path.read_bytes()
        packed = gzip.compress(data, compresslevel=9, mtime=0)
        if len(packed) >= len(data) * .75:
            continue
        assert gzip.decompress(packed) == data
        target = path.with_name(path.name + '.gz')
        assert not target.exists(), target
        row = {'original': relative, 'compressed': str(target.relative_to(ROOT)),
               'bytes': len(data), 'compressedBytes': len(packed), 'sha256': sha256(data).hexdigest()}
        additions.append(row)
        if args.apply:
            target.write_bytes(packed)
            path.unlink()
    if args.apply and additions:
        rows = sorted(rows + additions, key=lambda row: row['original'])
        assert len({row['original'] for row in rows}) == len(rows)
        INDEX.write_text(json.dumps(rows, indent=2) + '\n')
        replaced = {str((ROOT / row['original']).resolve()): row for row in additions}
        for path in (ROOT / 'docs').rglob('*.md'):
            text = path.read_text()

            def link(match):
                url, separator, fragment = match[1].partition('#')
                if re.match(r'[a-z]+:|//', url):
                    return match[0]
                candidate = (path.parent / unquote(url)).resolve()
                return '](' + url + '.gz' + separator + fragment + ')' if str(candidate) in replaced else match[0]

            text = re.sub(r'\]\(([^\s)]+)\)', link, text)
            if text != path.read_text():
                path.write_text(text)
    print(json.dumps({'mode': 'apply' if args.apply else 'preview', 'files': len(additions),
        'beforeBytes': sum(row['bytes'] for row in additions), 'afterBytes': sum(row['compressedBytes'] for row in additions)}))
