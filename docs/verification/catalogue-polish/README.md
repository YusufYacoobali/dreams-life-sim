# Catalogue illustration and save review

The catalogue now has twenty homes and twenty vehicles, plus the existing seven possessions. The original nineteen offers remain unchanged, including IDs, names, prices, conditions, upkeep and their relative order. New offers are appended so existing callers that select the first home/car keep the same choice. Purchase prices still use the existing country-wage and property-market formulas; no pricing or purchase rules were replaced.

Every home/vehicle has an individually illustrated subject. `CatalogArt` still accepts a catalogue ID and size, so shopping, owned-asset details and rental listings share the same artwork without new save fields. Possessions and the engagement ring keep their previous illustrations. Two shared local atlases replace repeated house/car cells; their combined PNG size is **4,270,037 bytes**. Both atlases together decode to 12,583,632 bytes (12.00MiB) if loaded simultaneously. This is a calculated texture budget, not a device measurement.

The source style was compared with the Properties/Vehicles panels of `design/07-assets-finances-investing-properties-vehicles.png` and the established `ownership-atlas.png`. New original art was produced with the built-in `image_gen.imagegen` workflow only; no Krea, emoji substitutions or geometric placeholders were used. The raw source PNGs are bundled unchanged. Registration reads alpha components and emits native clipping coordinates; it never edits the artwork. All forty subjects are independent, have no opaque crop edge, and include no neighbouring subject inside their crop. `assets/generated/catalogue-art.json` records SHA-256 hashes, original file paths and measured rectangles. An earlier tighter-spaced home sheet remains outside the runtime bundle at `/workspace/generated_images/exec-110c5290-ef3c-4194-a504-4c16c96654ed.png`.

## Visual evidence

Open [the self-contained gallery](index.html). Captures show [all homes](01-homes-light.png), [all vehicles](02-vehicles-light.png), both on [dark](03-homes-dark.png) [backgrounds](04-vehicles-dark.png), and [40/56/128px footprints](05-sizes.png).

These render actual production `CatalogArt` component trees exported by React Native tests through a browser CSS adapter. They are **not native Android/iOS screenshots**. Images decode without browser errors, remote requests or 320px document overflow. Real alpha compositing verifies that hidden vehicle RGB gradients do not become an opaque image background. Native interpolation, GPU performance and final device acceptance remain untested.

## Verification

- The forty-item catalogue/illustration tests cover unique IDs and art regions, legacy offer preservation, affordable/luxury range, valid local quotes, buying and encoding/decoding every home and vehicle, and an actual v4 save with an owned studio and bound sale offer.
- Four focused suites / 32 tests pass across the scoped runs: new catalogue domain/art tests, existing asset/market tests and existing real SQLite purchase-confirmation tests. A raw fixture's encoded BigInt expectation was corrected and its three-test domain suite passed on rerun.
- `npm run typecheck` passes for application and test projects. `npm run check:imports` passes with 400 modules and no cycles. The coordinator records the final combined result after integration.
- `python tools/register-catalogue-art.py` validates both source sheets and reproduces native clipping/provenance. It reads the checked-in source PNGs; generation services are not needed for building or gameplay.

To recreate the browser evidence:

```sh
DREAMS_CATALOGUE_CAPTURE_DIR=/tmp/dreams-catalogue-trees npx jest --runInBand tests/ui/catalogue-art.test.tsx
node tools/build-catalogue-art-review.cjs
PLAYWRIGHT_MODULE=/opt/codex/cua_node/lib/node_modules/playwright CHROMIUM_PATH=/usr/bin/chromium node tools/capture-catalogue-art-review.cjs
```
