# Cult option subjects

Six missing feature symbols were generated with the built-in Image Gen tool on
25 October 2026. The prior Dreams job sheet supplied the style reference only.
The original six-subject sheet remains here and at the generated path recorded
in `brief.json`; the brief records subject order, style and source hash.

The six subjects are a folding chair, timber cabin, farmhouse, warehouse, human
bed and stone obelisk. Each is one isolated object without scenery. Existing
clear art supplies the other cult features; see [the audit](../../docs/CULT_ICON_AUDIT.md).

Run `python tools/register-cult-options.py` from the repository root. It reuses
the existing alpha-component crop and proportional-contain tooling, locating
whole subjects rather than clipping approximate grid cells. Registration crops
and scales without redrawing, recolouring or removing backgrounds. Each PNG
fits a 232px subject within a transparent 256px canvas. The runtime manifest
records actual crop bounds, source hash, alpha bounds and derivative hashes.

Only the six small runtime PNGs enter the app. The source sheet is retained for
repeatable asset work. An initial Krea generation could not be downloaded from
the environment's blocked external host; it supplies no bundled artwork.
