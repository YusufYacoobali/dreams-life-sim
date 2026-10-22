"""Compile authored, full-colour illustration layers for the offline portrait rig.

No RGB segmentation, palette quantisation, feature replacement or runtime tint.
Alpha components only locate isolated source sprites. Registration, anatomical
colour grading and the cheek/jaw contour adjustments are explicit below.
Six skin grades retain continuous illustration colour/shading. Four contours
share an atlas; eyes, brows, nose, forehead and neck never stretch with the jaw.
Requires Pillow, numpy and scipy. Run from the repository root.
"""
from pathlib import Path
import hashlib
import json
import sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'design/avatar-v2/layers'
OUT = ROOT / 'assets/generated/avatars-v2'
OUT.mkdir(parents=True, exist_ok=True)
SIZE = 320
HEAD_BOX = (24, 44, 296, 292)
DEFAULT_FACE = [0, 2, 3, 3, 1, 2, 2, 3, 0, 2, 2, 1, 3, 1, 2, 3]
DEFAULT_SKIN = [2, 0, 1, 5, 1, 2, 0, 0, 0, 1, 4, 0, 2, 4, 0, 1]
DEFAULT_HAIR = [3, 4, 3, 2, 4, 2, 4, 3, 4, 1, 5, 4, 3, 5, 3, 4]
DEFAULT_COLOR = [0, 1, 1, 0, 0, 1, 0, 3, 4, 0, 1, 3, 0, 0, 4, 0]
SKINS = ['#ffcaab', '#f4b387', '#e79b63', '#c5824e', '#a5673e', '#874827']
HAIRS = ['#29282e', '#67412c', '#a36b3b', '#d9ae69', '#b15331', '#c8c5bf']
HAIR_WIDTH = [220, 284, 224, 224, 282, 224, 284, 224, 292, 220, 294, 292, 226, 298, 224, 284, 220, 224, 224, 284, 300, 226, 292]
HAIR_TOP = [18]*23
HAIR_WIDTH[21] = 192
HAIR_TOP[21] = 4  # bun has its own silhouette and higher crown
entries, sources = {}, []
hair_only = '--hair-only' in sys.argv
if hair_only:
    previous = json.loads((OUT/'manifest.json').read_text())
    entries = {k:v for k,v in previous['layers'].items() if not k.startswith('hair-')}
    sources = [v for v in previous['sources'] if v['file'] not in ['identity-hair.png','hairstyles.png','clean-waves.png','extra-hairstyles.png']]


def extract(file, count, columns=4, barrier=None):
    """Locate sprites by alpha, retaining their original RGBA antialiased edges."""
    image = Image.open(SOURCE / file).convert('RGBA')
    pixels = np.array(image)
    solid = pixels[:, :, 3] > 32
    if barrier:
        x, y0, y1 = barrier
        solid[y0:y1, x] = False
    labels, _ = ndi.label(solid)
    counts = np.bincount(labels.ravel()); counts[0] = 0
    ids = np.argsort(counts)[-count:]
    assert min(counts[ids]) > 500, (file, sorted(counts[ids]))
    objects = ndi.find_objects(labels)
    parts = []
    for component in ids:
        ys, xs = objects[component-1]
        x0, x1 = max(0, xs.start-2), min(image.width, xs.stop+2)
        y0, y1 = max(0, ys.start-2), min(image.height, ys.stop+2)
        keep = ndi.binary_dilation(labels[y0:y1, x0:x1] == component, iterations=2)
        crop = pixels[y0:y1, x0:x1].copy()
        crop[:, :, 3] = np.where(keep, crop[:, :, 3], 0)
        parts.append((y0, x0, Image.fromarray(crop)))
    parts.sort(key=lambda p: p[0])
    ordered = []
    for row in range(0, count, columns):
        ordered.extend(sorted(parts[row:row+columns], key=lambda p: p[1]))
    sources.append({'file': file, 'sha256': hashlib.sha256((SOURCE/file).read_bytes()).hexdigest(), 'sprites': count,
                    'rects': [[x, y, p.width, p.height] for y, x, p in ordered]})
    return [p for _, _, p in ordered]


def register(image, width=None, height=None, top=0):
    ratio = width / image.width if width else height / image.height
    image = image.resize((round(image.width*ratio), round(image.height*ratio)), Image.Resampling.LANCZOS)
    canvas = Image.new('RGBA', (SIZE, SIZE))
    canvas.paste(image, ((SIZE-image.width)//2, round(top)))
    return canvas


def rgb_to_lab(rgb):
    rgb = np.asarray(rgb, dtype=float)/255
    linear = np.where(rgb <= .04045, rgb/12.92, ((rgb+.055)/1.055)**2.4)
    xyz = linear @ np.array([[.4124564,.2126729,.0193339],[.3575761,.7151522,.1191920],[.1804375,.0721750,.9503041]])
    xyz /= np.array([.95047,1,1.08883])
    f = np.where(xyz > .008856, np.cbrt(xyz), 7.787*xyz+16/116)
    return np.stack([116*f[...,1]-16,500*(f[...,0]-f[...,1]),200*(f[...,1]-f[...,2])],axis=-1)


def lab_to_rgb(lab):
    fy = (lab[...,0]+16)/116
    f = np.stack([fy+lab[...,1]/500,fy,fy-lab[...,2]/200],axis=-1)
    xyz = np.where(f**3 > .008856,f**3,(f-16/116)/7.787)*[.95047,1,1.08883]
    linear = xyz @ np.array([[3.2404542,-.969266,.0556434],[-1.5371385,1.8760108,-.2040259],[-.4985314,.041556,1.0572252]])
    rgb = np.where(linear <= .0031308,linear*12.92,1.055*np.maximum(linear,0)**(1/2.4)-.055)
    return np.clip(np.round(rgb*255),0,255).astype(np.uint8)


def hex_rgb(color):
    return np.array([int(color[i:i+2],16) for i in (1,3,5)])


def grade(image, reference, target, skin_grade=True, anchor=None):
    """Continuous perceptual colour grade. Preserve ink, highlights and features."""
    p = np.array(image)
    lab = rgb_to_lab(p[:,:,:3])
    reference_lab, target_lab = rgb_to_lab(reference), rgb_to_lab(target)
    if not skin_grade:
        # Map the source's midtone to the chosen hair colour while preserving
        # continuous lock shadows/highlights. Merely adding a tint delta leaves
        # blond selected on a black wig looking like muddy dark brown.
        midpoint = max(1,reference_lab[0]); lightness = lab[:,:,0]
        below = target_lab[0]*np.maximum(lightness/midpoint,0)**.9
        above = target_lab[0]+(100-target_lab[0])*np.clip((lightness-midpoint)/(100-midpoint),0,1)
        changed = lab.copy(); changed[:,:,0] = np.where(lightness<=midpoint,below,above)
        chroma_scale = np.clip(changed[:,:,0]/max(1,target_lab[0]),0,1)
        changed[:,:,1:] = ((lab[:,:,1:]-reference_lab[1:])*.35+target_lab[1:])*chroma_scale[:,:,None]
        p[:,:,:3] = lab_to_rgb(changed)
        return Image.fromarray(p)
    # Natural preset colours remain untouched. Alternative skin tones move by
    # palette intervals from that natural setting, keeping all six choices in
    # order even when different source paintings have different lighting.
    delta = target_lab-(rgb_to_lab(anchor) if anchor is not None else reference_lab)
    # Ink approaches zero adjustment continuously, rather than being classified.
    weight = np.clip(lab[:,:,0]/35,0,1)
    if skin_grade:
        # A continuous colour grade, not a segmentation/tint mask. Neutral ink
        # and sclera remain neutral; blue/green irises retain their original hue.
        # Avoid broad feature-protection cutouts: they leave pale skin halos.
        chroma = np.hypot(lab[:,:,1],lab[:,:,2])
        hue = np.arctan2(lab[:,:,2],lab[:,:,1])
        reference_lab = rgb_to_lab(reference)
        reference_hue = np.arctan2(reference_lab[2],reference_lab[1])
        hue_distance = np.arctan2(np.sin(hue-reference_hue),np.cos(hue-reference_hue))
        weight *= np.clip((chroma-8)/20,0,1)**2 * np.exp(-(hue_distance/.7)**4)
    changed = lab + delta*weight[:,:,None]
    p[:,:,:3] = lab_to_rgb(changed)
    return Image.fromarray(p)


def contour(image, face, natural):
    """Move outer cheeks/jaw locally; never stretch the complete head or features."""
    if face == natural:
        return image.copy()
    yy, xx = np.indices((SIZE,SIZE),dtype=float)
    # Authored contour targets relative to each identity's original silhouette.
    cheek, jaw, length = [(0,0,0),(7,9,-3),(-5,-5,7),(5,13,1)][face]
    c0,j0,l0 = [(0,0,0),(7,9,-3),(-5,-5,7),(5,13,1)][natural]
    side = np.clip((abs(xx-160)-44)/38,0,1)
    cheeks = np.exp(-((yy-192)/24)**2)
    jaw_region = np.exp(-((yy-226)/23)**2)
    displacement = ((cheek-c0)*cheeks+(jaw-j0)*jaw_region)*side
    source_x = xx - np.sign(xx-160)*displacement
    # Chin extension is confined below the mouth, tapering out before neck.
    source_y = yy-(length-l0)*np.exp(-((yy-245)/12)**2)*np.clip(1-abs(xx-160)/72,0,1)
    p = np.array(image)
    result = np.stack([ndi.map_coordinates(p[:,:,i].astype(float),[source_y,source_x],order=1,mode='constant') for i in range(4)],axis=-1)
    return Image.fromarray(np.clip(np.round(result),0,255).astype(np.uint8))


def save(key, image):
    p = np.array(image); p[p[:,:,3]==0,:3] = 0
    file = key+'.png'; Image.fromarray(p).save(OUT/file,optimize=True)
    entries[key] = {'file': file, 'size': list(image.size), 'bytes': (OUT/file).stat().st_size,
                    'sha256': hashlib.sha256((OUT/file).read_bytes()).hexdigest()}


if not hair_only:
    heads = [extract(f'heads-{stage}.png',16) for stage in range(8)]
    references = []
    registered_heads = []
    for stage in range(8):
        row = []
        for identity, sprite in enumerate(heads[stage]):
            # Infant/child proportions come from their illustrations, not adult scaling.
            height = [226,232,236,236,236,236,236,236][stage]
            top = [56,50,48,48,48,48,48,48][stage]
            row.append(register(sprite,height=height,top=top))
        registered_heads.append(row)
    for identity in range(16):
        p = np.array(registered_heads[3][identity])
        references.append(np.median(p[90:108,148:172,:3],axis=(0,1)))

    for stage in range(8):
        for identity in range(16):
            original = registered_heads[stage][identity]
            for skin in range(6):
                # Approved natural skin is untouched; alternative tones are graded.
                colored = original if skin == DEFAULT_SKIN[identity] else grade(original,references[identity],hex_rgb(SKINS[skin]),anchor=hex_rgb(SKINS[DEFAULT_SKIN[identity]]))
                p = np.array(colored)
                # Hide the straight source neck edge inside the shoulder underlayer.
                p[274:285,:,3] = np.round(p[274:285,:,3]*np.linspace(1,0,11)[:,None]).astype(np.uint8)
                p[285:,:,3] = 0
                colored = Image.fromarray(p)
                atlas = Image.new('RGBA',(272*4,248))
                for face in range(4):
                    atlas.paste(contour(colored,face,DEFAULT_FACE[identity]).crop(HEAD_BOX),(face*272,0))
                save(f'head-{identity}-{stage}-{skin}',atlas)

    outfits = extract('outfits.png',16,barrier=(631,730,900))
    shoulders = extract('shoulders.png',2,columns=2)
    for identity, outfit in enumerate(outfits):
        shirt = register(outfit,width=304,top=250 if identity in [0,2,7,8,9,12] else 261)
        plate = register(shoulders[identity % 2],width=285,top=229)
        save(f'clothing-{identity}',shirt)
        p = np.array(plate); reference = np.median(p[273:279,154:166,:3],axis=(0,1))
        for skin in range(6):
            head = registered_heads[3][identity]
            if skin != DEFAULT_SKIN[identity]:
                head = grade(head,references[identity],hex_rgb(SKINS[skin]),anchor=hex_rgb(SKINS[DEFAULT_SKIN[identity]]))
            # Match the meeting surfaces, not the brighter forehead, to prevent a
            # horizontal colour seam where head-neck meets the clavicle plate.
            target = np.median(np.array(head)[269:274,154:166,:3],axis=(0,1))
            body = grade(plate,reference,target)
            save(f'body-{identity}-{skin}',body)

wigs = extract('identity-hair.png',16,barrier=(946,600,940))+extract('hairstyles.png',7)
waves = extract('clean-waves.png',2,columns=2)
wigs[10], wigs[11] = waves
# Reuse the clean long-curl illustration for the generic choice too. Its open
# cheek/chin silhouette fits all contours without covering the mouth corners.
wigs[20] = waves[0]
extra = extract('extra-hairstyles.png',2,columns=2)
wigs[16], wigs[21] = extra
for wig, illustration in enumerate(wigs):
    registered = register(illustration,width=HAIR_WIDTH[wig],top=HAIR_TOP[wig])
    p = np.array(registered)
    reference = np.median(p[p[:,:,3]>230,:3],axis=0)
    for color in range(6):
        colored = registered if wig < 16 and color == DEFAULT_COLOR[wig] else grade(registered,reference,hex_rgb(HAIRS[color]),skin_grade=False)
        # Hand-authored neckline occlusion curve. Lower locks go behind clothes;
        # the entire forehead/fringe and upper side locks stay in the foreground.
        front = np.array(colored); back = front.copy()
        yy, xx = np.indices((SIZE,SIZE))
        boundary = 248+16*np.exp(-((xx-160)/65)**2)
        # A small overlap prevents transparent resampling fringes at 52/88px.
        # Both parts retain identical RGB here; clothing still occludes rear locks.
        front[yy > boundary+3,3]=0; back[yy < boundary-3,3]=0
        save(f'hair-{wig}-{color}-front',Image.fromarray(front))
        if np.any(back[:,:,3]):
            save(f'hair-{wig}-{color}-back',Image.fromarray(back))

manifest = {'version':2,'generator':'built-in image_gen.imagegen only','canvasSize':SIZE,
 'approvedCast':'design/avatar-v2/candidate-sheet.png','approval':'User approved the V2 cast for phases 3–7',
 'headViewport':{'left':24,'top':44,'width':272,'height':248,'atlasColumns':4},
 'defaults':{'face':DEFAULT_FACE,'skin':DEFAULT_SKIN,'hair':DEFAULT_HAIR,'hairColor':DEFAULT_COLOR,'outfit':list(range(16))},
 'skinTones':SKINS,'hairColors':HAIRS[:5],'sources':sources,'layers':entries,
 'notes':['128 independently illustrated age/identity heads.','Each skin-grade head atlas contains four local cheek/jaw contours, not four stretched faces.',
 'No RGB segmentation or quantised tint masks. Natural head and hair colours preserve source pixels apart from registration resampling.',
 'Six skin grades and five hair grades preserve continuous authored shading and antialiasing; a continuous perceptual colour grade protects neutral ink/sclera and non-skin iris hues.',
 'Sixteen independent illustrated outfits; legacy defaults follow identity and optional outfit metadata stores explicit selections. Only head/hair/shoulder/clothing layers, never complete portrait combinations.']}
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
for obsolete in OUT.glob('*.png'):
    if obsolete.stem not in entries:
        obsolete.unlink()
registry = '// Generated by tools/build-avatar-v2-art.py. Offline static assets.\nexport const portraitImages = {\n'
for key,item in entries.items():
    registry += f"  '{key}': require('../../assets/generated/avatars-v2/{item['file']}'),\n"
registry += '} as const;\nexport type PortraitAsset = keyof typeof portraitImages;\n'
(ROOT/'src/assets/portraitImages.ts').write_text(registry)
(SOURCE/'registration.json').write_text(json.dumps({key:manifest[key] for key in ['canvasSize','headViewport','defaults','skinTones','hairColors','sources','notes']},indent=2)+'\n')
print(json.dumps({'assets':len(entries),'bytes':sum(v['bytes'] for v in entries.values()),'headAtlasDecodedBytes':1088*248*4}))
