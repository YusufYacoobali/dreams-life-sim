"""Build a local review of the actual bundled illustrations at profile-row sizes."""
from pathlib import Path
import html
import json
from PIL import Image, ImageDraw, ImageFont
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT/'docs/verification/polish3-art'
OUT.mkdir(parents=True,exist_ok=True)
manifest = json.loads((ROOT/'assets/generated/polish3/manifest.json').read_text())
brief = json.loads((ROOT/'design/polish3/art/brief.json').read_text())
font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',12)
for sheet in brief['sheets']:
    rows, columns = sheet.get('rows',4), sheet.get('columns',4)
    canvas = Image.new('RGB',(columns*240,rows*210),'#F8F7F5');draw=ImageDraw.Draw(canvas)
    for i,entry in enumerate(sheet['entries']):
        image=Image.open(ROOT/'assets/generated/polish3'/entry['kind']/(entry['id']+'.png')).convert('RGBA')
        x=(i%columns)*240;y=(i//columns)*210
        big=image.resize((144,144),Image.Resampling.LANCZOS);canvas.paste(big,(x+48,y+4),big)
        draw.rectangle((x+137,y+152,x+197,y+202),fill='#253247')
        for size,dx in [(36,25),(48,83),(48,143)]:
            small=image.resize((size,size),Image.Resampling.LANCZOS);canvas.paste(small,(x+dx,y+153),small)
        draw.text((x+8,y+136),entry['id'],font=font,fill='#0B1545')
    canvas.save(OUT/(Path(sheet['file']).stem+'-preview.png'))
jobs={job['id']:job['title'] for job in brief['jobs']}
cards=[]
for icon in manifest['icons'].values():
    label=jobs.get(icon['id'],icon['id'].replace('-',' ').title())
    src='../../../assets/generated/polish3/'+icon['file']
    cards.append(f'<article data-kind="{icon["kind"]}"><h3>{html.escape(label)}</h3><div class="samples"><div class="light"><img src="{src}" alt=""/></div><div class="dark"><img src="{src}" alt=""/></div></div><code>{html.escape(icon["id"])}</code></article>')
page='''<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Dreams Polish 3 · artwork</title><style>*{box-sizing:border-box}body{font:15px system-ui;background:#e9edf4;color:#0b1545;margin:0}header{position:sticky;top:0;background:#fff;padding:16px 24px;z-index:1;border-bottom:1px solid #cdd4df}h1{font-size:22px;margin:0 0 8px}header p{margin:6px 0;max-width:90ch;color:#5d6d87}label{margin-right:18px}select{font:inherit;padding:5px}main{padding:20px;display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px}article{background:white;border-radius:14px;padding:16px;min-width:0}article h3{font-size:14px;margin:0 0 12px;min-height:34px}.samples{display:flex;gap:10px}.samples>div{height:112px;flex:1;display:grid;place-items:center;border-radius:10px}.light{background:#f8f7f5;border:1px solid #e7e9ee}.dark{background:#253247}img{width:var(--icon-size,48px);height:var(--icon-size,48px);object-fit:contain}code{display:block;font:11px ui-monospace;margin-top:12px;overflow-wrap:anywhere}article[hidden]{display:none}</style><header><h1>Dreams Polish 3 · original artwork</h1><p>__ICON_COUNT__ individual bundled transparent illustrations: __JOB_COUNT__ ordinary jobs, 36 person actions, Net Worth and Finances. Built-in ImageGen only. Existing Bank artwork stays separate. Each card shows the same authored PNG on light and dark UI backgrounds.</p><label>Row size <select id="size"><option>36</option><option>40</option><option selected>48</option><option>88</option><option>140</option></select> px</label><label>Category <select id="category"><option value="all">All</option><option value="jobs">Jobs</option><option value="actions">Person actions</option><option value="finance">Finances</option></select></label><p>Art review only; these are the actual runtime PNGs, not screenshots of native Android/iOS layouts. Raw generated sheets, subject order, bounds and hashes are retained in the repository.</p></header><main>'''+''.join(cards)+'''</main><script>document.querySelector('#size').onchange=e=>document.documentElement.style.setProperty('--icon-size',e.target.value+'px');document.querySelector('#category').onchange=e=>document.querySelectorAll('article').forEach(card=>card.hidden=e.target.value!=='all'&&card.dataset.kind!==e.target.value);</script>'''
page = page.replace('__ICON_COUNT__', str(len(manifest['icons']))).replace('__JOB_COUNT__', str(len(brief['jobs'])))
(OUT/'index.html').write_text(page)
report={'icons':len(manifest['icons']),'unique_sha256':len(set(icon['sha256'] for icon in manifest['icons'].values())),'runtime_bytes':sum(icon['bytes'] for icon in manifest['icons'].values()),'transparent':{},'generator':manifest['generator']}
for icon in manifest['icons'].values():
    image=Image.open(ROOT/'assets/generated/polish3'/icon['file']).convert('RGBA');alpha=image.getchannel('A');bbox=alpha.getbbox()
    assert bbox and all(a>0 for a in bbox[:2]) and bbox[2]<256 and bbox[3]<256
    report['transparent'][icon['kind']+':'+icon['id']]={'alpha_bounds':bbox,'alpha_extrema':alpha.getextrema()}
(OUT/'artwork-report.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'review':str((OUT/'index.html').relative_to(ROOT)),'icons':report['icons'],'unique':report['unique_sha256'],'runtime_bytes':report['runtime_bytes']}))
