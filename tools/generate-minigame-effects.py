#!/usr/bin/env python3
"""Original local PCM cues and a small 60 Hz native particle effect. No dependencies."""
import argparse
import io
import json
import math
from pathlib import Path
import random
import struct
import wave

ROOT = Path(__file__).resolve().parents[1] / 'assets' / 'minigames'

def cue(kind):
    rng = random.Random(2345)
    rate = 22050
    seconds = .26 if kind == 'astronaut' else .20
    frames = []
    for i in range(int(seconds * rate)):
        t = i / rate
        decay = math.exp(-t * (25 if kind == 'sports' else 17 if kind == 'crime' else 11))
        noise = rng.random() * 2 - 1
        frequency = 130 if kind == 'sports' else 1800 if kind == 'crime' else 88
        value = (math.sin(t * 2 * math.pi * frequency) * .45 + noise * (.15 if kind == 'crime' else .4)) * decay
        frames.append(int(max(-1, min(1, value)) * .65 * 32767))
    output = io.BytesIO()
    with wave.open(output, 'wb') as audio:
        audio.setnchannels(1)
        audio.setsampwidth(2)
        audio.setframerate(rate)
        audio.writeframes(b''.join(struct.pack('<h', value) for value in frames))
    return output.getvalue()

def celebration():
    layers = []
    fixed = lambda value: {'a': 0, 'k': value}
    for i in range(16):
        angle = i * math.pi / 8
        position = [200 + math.cos(angle) * 130, 200 + math.sin(angle) * 130, 0]
        layers.append({'ddd': 0, 'ind': i + 1, 'ty': 4, 'nm': f'Spark {i}', 'sr': 1, 'ks': {
            'o': {'a': 1, 'k': [{'t': 0, 's': [100], 'e': [0], 'o': {'x': .33, 'y': 0}, 'i': {'x': .66, 'y': 1}}, {'t': 48, 's': [0]}]},
            'r': fixed(i * 22.5), 'p': {'a': 1, 'k': [{'t': 0, 's': [200, 200, 0], 'e': position, 'o': {'x': .2, 'y': 1}, 'i': {'x': .5, 'y': 1}}, {'t': 48, 's': position}]},
            'a': fixed([0, 0, 0]), 's': fixed([100, 100, 100])},
            'shapes': [{'ty': 'el', 'p': fixed([0, 0]), 's': fixed([4, 10]), 'd': 1}, {'ty': 'fl', 'c': fixed([.96, .8, .51, 1] if i % 2 else [.46, .85, .95, 1]), 'o': fixed(100), 'r': 1}], 'ip': 0, 'op': 49, 'st': 0, 'bm': 0})
    return (json.dumps({'v': '5.12.2', 'fr': 60, 'ip': 0, 'op': 48, 'w': 400, 'h': 400, 'nm': 'Dreams mini-game success', 'ddd': 0, 'assets': [], 'layers': layers}, separators=(',', ':')) + '\n').encode()

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    outputs = {kind + '.wav': cue(kind) for kind in ['sports', 'crime', 'astronaut']}
    outputs['success.json'] = celebration()
    ROOT.mkdir(exist_ok=True, parents=True)
    for name, data in outputs.items():
        target = ROOT / name
        if args.check:
            assert target.read_bytes() == data, f'Regenerate {target}'
        else:
            target.write_bytes(data)
        print(f'{name}: {len(data)} local bytes')
