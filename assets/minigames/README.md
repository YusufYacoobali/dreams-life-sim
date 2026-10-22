# Local mini-game assets

`art/` contains the new layered scene artwork created with Image Gen. Its [provenance and optimization record](art/README.md) and [binary manifest](art/manifest.json) cover all twelve bundled images.

`sports.wav`, `crime.wav` and `astronaut.wav` are short synthesized cues authored by `tools/generate-minigame-effects.py`. They respect the saved sound-effects preference. `success.json` is the earlier authored Lottie burst, retained for generator compatibility; the compact result panel no longer plays it.

All active artwork and audio are bundled locally. No generation or external asset request occurs during play. SVG is used for targets, guides, progress and small effects; Reanimated moves the separate sprites.

Regenerate the original effects with `python tools/generate-minigame-effects.py`; verify with `--check`. See [MINIGAMES.md](../../docs/MINIGAMES.md) for controls, integration and verification limits.
