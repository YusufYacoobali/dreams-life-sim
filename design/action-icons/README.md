# Selected single-subject action artwork

The five sheets here were generated with the built-in Image Gen tool on 24 October 2026. Existing Dreams contact sheets supplied the outline, colour and dimensional-style references. The subject order, style brief, original generated paths and source hashes are recorded in `brief.json`. Original generated files remain separate in `/workspace/generated_images`.

Only the audited busy slots change: 24 relationship actions, 18 ordinary jobs and 19 shared action mappings. The latter reuse 16 new subjects, the new academic-help book and the existing clear plane. Every subject has one large focal object, with paired hands, rings or cups treated as a unified symbol. Clear existing icons, portraits, product/destination previews and gameplay scenes remain intact.

`python tools/register-simple-icons.py` finds complete alpha components, groups them by intended cell and registers contained 256px runtime PNGs with a maximum 232px subject. It preserves separated pieces of unified symbols such as the torn certificate and broken link. It never cuts subjects at an assumed grid edge. Cropping and proportional scaling are the only registration transforms. The existing Polish 3 builder reapplies this registration after rebuilding its original sources.

Current runtime hashes, alpha bounds, actual source rectangles and targets are in `assets/generated/action-symbols/manifest.json`; unchanged asset IDs preserve all existing mappings and saved event illustration IDs. The active registered PNG payload is slightly smaller than the corresponding old selected PNGs despite the new shared symbols. Raw design sheets stay outside EAS build uploads.
