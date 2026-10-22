"""Prepare generated illustration layers; never used by the mobile runtime.

Requires Pillow, numpy and scipy. Run from the repository root:
    python tools/build-portrait-art.py
Source geometry is illustrated by image_gen. This pipeline extracts connected
alpha silhouettes, registers them uniformly, and separates colour masks from
features. It does not draw or stretch faces, or generate portrait combinations.
"""
from pathlib import Path
import hashlib
import json

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "design/avatar-overhaul"
OUT = ROOT / "assets/generated/avatars"
OUT.mkdir(parents=True, exist_ok=True)
SIZE = 512
FACES = ["oval", "round", "long", "broad"]
entries = {}
head_widths = []
provenance = []


def parts(file, count):
    """Keep illustrated alpha components and their antialiasing, not RGB in alpha=0."""
    image = Image.open(SOURCE / file).convert("RGBA")
    pixels = np.array(image)
    labels, _ = ndi.label(pixels[:, :, 3] > 80)
    counts = np.bincount(labels.ravel())
    counts[0] = 0
    objects = ndi.find_objects(labels)
    selected = []
    for component in np.argsort(counts)[-count:]:
        ys, xs = objects[component - 1]
        keep = ndi.binary_dilation(labels[ys, xs] == component, iterations=2)
        crop = pixels[ys, xs].copy()
        crop[:, :, 3] = np.where(keep, crop[:, :, 3], 0)
        selected.append({"image": Image.fromarray(crop), "rect": [xs.start, ys.start, xs.stop-xs.start, ys.stop-ys.start], "row": (ys.start+ys.stop)/2 > image.height/2})
    selected.sort(key=lambda item: (item["row"], item["rect"][0]))
    provenance.append({"source": file, "size": list(image.size), "sha256": hashlib.sha256((SOURCE/file).read_bytes()).hexdigest(), "rects": [item["rect"] for item in selected]})
    return [item["image"] for item in selected]


def register(image, width=None, height=None, top=None, bottom=None):
    ratio = width / image.width if width else height / image.height
    resized = image.resize((round(image.width*ratio), round(image.height*ratio)), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (SIZE, SIZE))
    y = top if top is not None else bottom-resized.height
    canvas.paste(resized, ((SIZE-resized.width)//2, round(y)))
    return canvas, resized.width


def save(key, image):
    # Clear invisible source RGB to keep exported textures clean and compact.
    pixels = np.array(image)
    pixels[pixels[:, :, 3] == 0, :3] = 0
    image = Image.fromarray(pixels)
    file = key + ".png"
    image.save(OUT/file, optimize=True)
    entries[key] = {"file": file, "size": list(image.size), "bytes": (OUT/file).stat().st_size, "sha256": hashlib.sha256((OUT/file).read_bytes()).hexdigest()}


def head_layers(image):
    pixels = np.array(image)
    r, g, b = [pixels[:, :, channel].astype(float) for channel in range(3)]
    alpha = pixels[:, :, 3]
    skin = (r > 130) & (r-g > 24) & (g-b > 18)
    reference = np.percentile(r[skin & (alpha > 240)], 85)
    ratio = r/reference
    shadow = np.select([ratio < .68, ratio < .78, ratio < .88], [.36, .27, .16], default=0)
    mask = np.full_like(pixels, 255)
    mask[:, :, 3] = alpha
    details = pixels.copy()
    details[skin, :3] = 0
    details[:, :, 3] = np.where(skin, np.round(alpha*shadow), alpha).astype(np.uint8)
    return Image.fromarray(mask), Image.fromarray(details)


def hair_layers(image):
    pixels = np.array(image)
    alpha = pixels[:, :, 3]
    # Smooth subpixel source noise before extracting flat illustrated shade
    # regions, retaining the original alpha edge and lock geometry.
    red = ndi.gaussian_filter(pixels[:, :, 0].astype(float), sigma=1.2)
    mask = np.full_like(pixels, 255)
    mask[:, :, 3] = alpha
    details = np.zeros_like(pixels)
    # Preserve the broad authored locks without threshold speckling. A single
    # translucent ink layer supplies dark or light cel accents on any palette.
    shade = np.where(red > 178, np.clip((red-178)/77*.23, 0, .18), np.clip((178-red)/178*1.2, 0, .62))
    details[red > 178, :3] = 255
    details[:, :, 3] = np.round(alpha*shade).astype(np.uint8)
    return Image.fromarray(mask), Image.fromarray(details)


for face, name in enumerate(FACES):
    widths = []
    for stage, illustration in enumerate(parts("heads-" + name + ".png", 8)):
        registered, width = register(illustration, height=344, bottom=432)
        widths.append(width)
        mask, details = head_layers(registered)
        save(f"head-{face}-{stage}-mask", mask)
        save(f"head-{face}-{stage}-detail", details)
    head_widths.append(widths)

# Authored wigs remain full silhouettes behind the face. The top and outer side
# locks form the foreground; long rear hair is occluded by the neck and shirt.
hair_width = [310, 310, 310, 390, 410, 300, 420]
hair_top = [52, 56, 52, 52, 52, 16, 28]
for index, illustration in enumerate(parts("hair.png", 7), start=1):
    if index == 6:
        illustration = parts("hair-bun.png", 1)[0]
    registered, _ = register(illustration, width=hair_width[index-1], top=hair_top[index-1])
    if index in [4, 5, 7]:
        foreground = np.array(registered)
        yy, xx = np.indices((SIZE, SIZE))
        # Keep the original illustrated fringe; hide rear locks behind the face.
        rear = (yy > 224) & (xx > 145) & (xx < 367)
        background = foreground.copy()
        background[~rear, 3] = 0
        mask, details = hair_layers(Image.fromarray(background))
        save(f"hair-{index}-back-mask", mask)
        save(f"hair-{index}-back-detail", details)
        foreground[rear, 3] = 0
        registered = Image.fromarray(foreground)
    mask, details = hair_layers(registered)
    save(f"hair-{index}-front-mask", mask)
    save(f"hair-{index}-front-detail", details)

for index, illustration in enumerate(parts("clothing.png", 4)):
    registered, _ = register(illustration, width=416, bottom=500)
    save(f"clothing-{index}", registered)

manifest = {"version": 1, "generator": "built-in image_gen.imagegen", "styleApproval": "User approved Checkpoint A on 2026-10-22", "canvasSize": SIZE, "headWidths": head_widths, "sources": provenance, "layers": entries, "notes": "Uniform face registration only; four independently illustrated contours at eight ages. Skin/hair masks are tinted independently of facial features. No whole-portrait stretching or full-portrait combination catalogue."}
(OUT/"manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")

registry = "// Generated by tools/build-portrait-art.py; local images only.\nexport const portraitImages = {\n"
for key, item in entries.items():
    registry += f"  '{key}': require('../../assets/generated/avatars/{item['file']}'),\n"
registry += "} as const;\nexport type PortraitAsset = keyof typeof portraitImages;\n"
(ROOT/"src/assets/portraitImages.ts").write_text(registry)
geometry = "// Registered widths of the original illustrated contours, in a 512px rig.\nexport const headWidths = " + json.dumps(head_widths) + " as const;\n"
(ROOT/"src/assets/portraitGeometry.ts").write_text(geometry)
print(f"Prepared {len(entries)} shared illustration layers from {len(provenance)} source sheets.")
