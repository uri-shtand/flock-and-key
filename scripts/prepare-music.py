"""Generate the original prototype music using Python's standard library."""
import math
import pathlib
import struct
import wave

ROOT = pathlib.Path(__file__).resolve().parent.parent
RATE = 22050
DURATION = 24
samples = [0.0] * (RATE * DURATION)
notes = [60, 64, 67, 69, 67, 64, 62, 67, 64, 60, 62, 64, 67, 71, 69, 67]
for beat in range(48):
    note = notes[beat % len(notes)]
    frequency = 440 * 2 ** ((note - 69) / 12)
    start = int(beat * 0.5 * RATE)
    for j in range(int(0.48 * RATE)):
        t = j / RATE
        envelope = min(t / 0.012, 1) * math.exp(-t * 7)
        tone = math.sin(2 * math.pi * frequency * t)
        overtone = 0.18 * math.sin(4 * math.pi * frequency * t)
        samples[start + j] += (tone + overtone) * envelope * 0.16
    if beat % 4 == 0:
        for j in range(int(1.8 * RATE)):
            if start + j >= len(samples):
                break
            t = j / RATE
            samples[start + j] += (
                0.045 * math.sin(2 * math.pi * (frequency / 4) * t)
                * math.sin(math.pi * t / 1.8) ** 2
            )

target = ROOT / 'public/audio/farm-theme.wav'
target.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(target), 'wb') as output:
    output.setparams((1, 2, RATE, 0, 'NONE', 'not compressed'))
    output.writeframes(b''.join(
        struct.pack('<h', int(max(-1, min(1, value)) * 32767))
        for value in samples
    ))
print('Prepared original 24-second music loop.')
