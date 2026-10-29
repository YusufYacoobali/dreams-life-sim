# Android icon crop correction — 25 October 2026

The Android launcher was cropping the child and the cap/heart/cash symbols from
the user-selected full-frame icon. The Android-only regeneration retains those
subjects and the same illustrated style, but groups them tightly in the centre.
Outer sky, paths and scenery form expendable crop padding. The source is opaque
RGB, with no baked rounded frame or simulated transparent layer.

`app.json` points **both** `android.icon` and
`android.adaptiveIcon.foregroundImage` at `assets/android-app-icon.png`. The
top-level icon remains `assets/app_icon.png` for iOS, with its original hash
unchanged. The existing navy adaptive background is retained.

## Generation and verification

The built-in Image Gen tool produced an initial composition, then a tighter
central composition after visual review found the first hoodie still too low.
The final generated image was copied unchanged to the Android asset. Both tool
outputs remain at their original generated paths; no duplicate source or preview
PNG pack is added to the repository. [Checks and provenance](checks.json) record
the paths, hashes, dimensions, conservative subject boxes and native sizes.

Android places a **108dp foreground behind a 72dp viewport**. Merely rounding
the whole source would underestimate its crop. The guaranteed central safe
circle has a 66dp diameter, or 61.11% of the source width. Conservative reviewed
subject boxes have a maximum corner radius of 23.50% of source width, within the
30.56% safe radius.

The [interactive comparison](index.html) models the real crop with 150% source
size and −25% placement, then applies representative circle, squircle and
teardrop masks. It also shows full-source legacy icons. Controls offer 48/72/96px
and an optional safe-circle overlay. No embedded image copies are used.

Fresh isolated Android native generation passes. All 15 generated WebPs have
the expected five-density dimensions: 48/72/96/144/192px legacy and round icons;
108/162/216/324/432px adaptive foregrounds. Both adaptive XMLs reference the new
foreground and existing background. Resolved configuration retains the original
iOS icon and enabled production testing capability.

Browser verification loads all eight comparison images and exercises all three
sizes without broken images or JavaScript errors. It also substitutes the actual
generated WebPs for the new icon previews. Visual review and a separate peer
review confirm the entire child, cap, heart and cash remain visible across all
three adaptive masks at 48px and 96px. The notice/inventory check passes.

A new Android build/install is required. These are source, resource-generation
and browser checks; installed launcher/OEM motion and cache behavior remain a
device check. No gameplay, saves, runtime logic or iOS artwork changed.
