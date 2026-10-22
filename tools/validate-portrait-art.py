"""Check exported texture alpha, mask colours and front/back registration."""
from pathlib import Path
import hashlib
import json
import numpy as np
from PIL import Image

root = Path(__file__).resolve().parents[1]
directory = root / 'assets/generated/avatars'
manifest = json.loads((directory/'manifest.json').read_text())
checks = []
for key, layer in manifest['layers'].items():
    data = (directory/layer['file']).read_bytes()
    im = Image.open(directory/layer['file'])
    assert im.mode == 'RGBA' and im.size == (512,512), key
    assert hashlib.sha256(data).hexdigest() == layer['sha256'], key
    pixels = np.array(im)
    a = pixels[:,:,3]
    assert a.max() > 0, key
    assert max(a[0,:].max(), a[-1,:].max(), a[:,0].max(), a[:,-1].max()) == 0, key
    if key.endswith('-mask'):
        assert np.all(pixels[a>0,:3] == 255), key
    checks.append({'asset':key,'size':[512,512],'alphaBorderClear':True,'sha256Matches':True})
for hair in [4,5,7]:
    front = np.array(Image.open(directory/f'hair-{hair}-front-mask.png'))[:,:,3]
    back = np.array(Image.open(directory/f'hair-{hair}-back-mask.png'))[:,:,3]
    assert not np.any((front>0)&(back>0)), f'Overlapping shade in hair {hair}'
result = {'assetCount':len(checks),'pngBytes':sum(layer['bytes'] for layer in manifest['layers'].values()),'frontBackDisjoint':True,'textures':checks}
out = root/'docs/verification/avatar-checkpoint-b/art-checks.json'
out.write_text(json.dumps(result,indent=2)+'\n')
print(f"Validated {len(checks)} RGBA textures and all front/back splits.")
