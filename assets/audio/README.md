# Original action tap

`action-tap.wav` is an original generated UI cue: mono, 16-bit PCM, 22,050 Hz, 992 frames (about 45 ms), 2,028 bytes. It contains no recording or third-party sample. It is part of this project's source assets.

It uses a 1,100 Hz sine with a quiet 2,200 Hz partial, a 3 ms attack, exponential decay and 4 ms end fade. Generation uses only deterministic math, never gameplay RNG. Playback volume is additionally reduced to 0.35.

Reproduce from the repository root:

```python
import math, struct, wave
with wave.open('assets/audio/action-tap.wav', 'wb') as output:
    output.setnchannels(1)
    output.setsampwidth(2)
    output.setframerate(22050)
    frames = []
    for i in range(992):
        t = i / 22050
        envelope = min(1, t / .003) * math.exp(-t * 110) * min(1, (.045 - t) / .004)
        sample = .12 * envelope * (math.sin(2 * math.pi * 1100 * t) + .2 * math.sin(2 * math.pi * 2200 * t)) / 1.2
        frames.append(struct.pack('<h', round(32767 * sample)))
    output.writeframes(b''.join(frames))
```
