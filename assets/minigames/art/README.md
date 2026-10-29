# Mini-game scene artwork

Original game art created with **Image Gen** on 22 October 2026 for Dreams. Krea was not used for generation. No external photographs, team marks or agency imagery were sourced. The uploaded brief described the intended reference, but no reference image was attached; its written art direction guided these assets.

The two source atlases remain in the task's `/workspace/generated_images` directory. [manifest.json](manifest.json) records their hashes and the dimensions, bytes and hashes of every bundled derivative. Runtime artwork totals **2,489,398 bytes**. The combined RGBA pixel count is 9,779,152 bytes before platform/GPU overhead; this is not a device-memory measurement.

- `stadium.webp`: stadium/pitch plate, 512×1024.
- `space.webp`: star field sampled from the orbital plate; Earth is a separate layer.
- `safe.webp`: brushed-metal door plate, cropped to 512×768.
- Transparent PNGs: goal/net, standing keeper, diving keeper, ball, station/port, capsule, Earth, thruster plume and safe dial.

All image references are static local `require` calls in `sceneArtwork.ts`. Each game's assets preload before Play becomes available. Reanimated transforms separate sprites; the images are never regenerated during gameplay.

Atlas extraction used ImageMagick. Background crops: stadium `512x1024+0+0`; space `512x420+512+0` resized to 512×768; safe `512x768+1024+96`, WebP quality 85–86. Transparent sprite crop rectangles in the second atlas:

| Sprite | Crop |
| --- | --- |
| goal | `580x280+0+60` |
| keeper | `350x350+620+0` |
| keeper-dive | `550x240+980+80` |
| ball | `275x280+100+375` |
| station | `790x295+380+360` |
| ship | `335x300+1170+360` |
| earth | `710x359+0+665` |
| thruster | `110x340+740+665` |
| dial | `390x369+1100+655` |

After cropping: reset canvas, apply alpha `-level 3%,100%` to remove nearly invisible atlas bleed while retaining soft edges, trim transparent margins, reset canvas and use PNG compression level 9. These are asset extraction/optimization steps; the illustrations themselves came from Image Gen.
