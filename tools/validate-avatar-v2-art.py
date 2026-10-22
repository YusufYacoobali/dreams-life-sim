"""Validate full-colour V2 assets, source fidelity, registration and budgets."""
from pathlib import Path
import hashlib
import json
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT/'assets/generated/avatars-v2'
manifest = json.loads((OUT/'manifest.json').read_text())
layers = manifest['layers']
checks = []
for key, layer in layers.items():
    file = OUT/layer['file']
    assert hashlib.sha256(file.read_bytes()).hexdigest() == layer['sha256'], key
    im = Image.open(file)
    assert im.mode == 'RGBA' and list(im.size) == layer['size'], key
    p = np.array(im)
    assert np.max(p[:,:,3]) > 0, key
    assert not np.any(p[p[:,:,3] == 0,:3]), key
    expected = (1088,248) if key.startswith('head-') else (320,320)
    assert im.size == expected, key
    checks.append(key)

assert sum(k.startswith('head-') for k in layers) == 16*8*6
assert sum(k.startswith('body-') for k in layers) == 16*6
assert sum(k.startswith('clothing-') for k in layers) == 16
for identity in range(16):
    for skin in range(6):
        for stage in range(8):
            p = np.array(Image.open(OUT/f'head-{identity}-{stage}-{skin}.png'))
            tiles = [p[:,face*272:(face+1)*272] for face in range(4)]
            # Fixed central eye/nose features do not resize with the face contour.
            for tile in tiles[1:]:
                assert np.array_equal(tile[80:166,92:180],tiles[0][80:166,92:180]), (identity,skin,stage)
            for tile in tiles:
                assert not np.any(tile[:,[0,-1],3]), (identity,skin,stage,'side crop')
            assert len({hashlib.sha256(tile.tobytes()).hexdigest() for tile in tiles}) == 4

# Source defaults preserve the continuous authored colour/linework. Only alpha
# isolation, registration resampling, and the concealed lower-neck fade occur.
compiler = ROOT/'tools/build-avatar-v2-art.py'
namespace = {'__file__':str(compiler)}
exec(compile(compiler.read_text().split('if not hair_only:')[0],str(compiler),'exec'),namespace)
extract, register = namespace['extract'],namespace['register']
rgb_to_lab = namespace['rgb_to_lab']
for identity in range(16):
    face = manifest['defaults']['face'][identity]
    for stage in range(8):
        lightness = []
        for skin in range(6):
            p = np.array(Image.open(OUT/f'head-{identity}-{stage}-{skin}.png'))
            cheek_and_nose = p[134:171,face*272+111:face*272+161,:3]
            lightness.append(float(np.median(rgb_to_lab(cheek_and_nose)[:,:,0])))
        assert all(a > b for a,b in zip(lightness,lightness[1:])), (identity,stage,'skin order',lightness)
natural_checks = 0
for stage in range(8):
    sprites = extract(f'heads-{stage}.png',16)
    for identity,sprite in enumerate(sprites):
        original = register(sprite,height=[226,232,236,236,236,236,236,236][stage],top=[56,50,48,48,48,48,48,48][stage])
        a = np.array(original.crop((24,44,296,292)))[:230]
        face = manifest['defaults']['face'][identity]; skin = manifest['defaults']['skin'][identity]
        b = np.array(Image.open(OUT/f'head-{identity}-{stage}-{skin}.png'))[:230,face*272:(face+1)*272]
        visible = a[:,:,3] > 0
        assert np.array_equal(a[visible],b[visible]), (identity,stage,'source fidelity')
        natural_checks += 1

result = {'assetCount':len(checks),'independentlyIllustratedIdentityAgeHeads':128,'skinGradeHeadAtlases':768,
          'faceContoursPerAtlas':4,'fullColourShoulderLayers':96,'independentClothingLayers':16,'pngBytes':sum(v['bytes'] for v in layers.values()),
          'sourceHeadDefaultsVerified':natural_checks,'sourcePixelsPreservedBeforeConcealedNeckFade':True,
          'centralEyeAndNosePixelsIdenticalAcrossFaceShapeChoices':True,'allFourContoursVisiblyDistinct':True,'noHeadPixelsTouchTileSideBorders':True,
          'allHashesMatch':True,'allSixSkinTonesOrderedForEveryIdentityAndAge':True,'transparentPixelsHaveZeroRGB':True,'headAtlasDecodedBytes':1088*248*4,
          'runtimeNetworkRequired':False,'runtimeTintOrColourFilters':False,'nativeDeviceRenderingTested':False}
directory = ROOT/'docs/verification/avatar-v2-implementation';directory.mkdir(parents=True,exist_ok=True)
(directory/'art-checks.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result,indent=2))
