# Local mini-game effects

`sports.wav`, `crime.wav` and `astronaut.wav` are short synthesized cues authored by `tools/generate-minigame-effects.py`. `success.json` is a small authored Lottie particle burst. There are no sampled recordings, fonts or third-party visual assets in this directory.

All files are bundled for offline playback. Sound obeys the existing sound-effects preference; the decorative Lottie effect is omitted with Reduced Motion. Gameplay artwork is static SVG geometry in `src/minigames/`.

Regenerate with `python tools/generate-minigame-effects.py`; verify exact output with `--check`. Implementation and verification limits are documented in [MINIGAMES.md](../../docs/MINIGAMES.md).
