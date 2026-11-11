"""Generate the original prototype music using Python's standard library."""
import math
import pathlib
import struct
import wave

ROOT = pathlib.Path(__file__).resolve().parent.parent
RATE = 22050
# Original instrumental arrangements; all voices and percussion synthesized locally.
import random

COMPOSITIONS = [
    dict(file='farm-theme.wav', bpm=108, root=60, instrument='marimba',
         scale=[0, 2, 4, 7, 9], chords=[0, 5, 3, 4, 0, 3, 5, 4],
         melody=[0, 2, 3, 1, 2, 4, 3, 2, 0, 1, 2, 3, 4, 2, 1, 0]),
    dict(file='meadow-walk.wav', bpm=96, root=60, instrument='marimba',
         scale=[0, 2, 4, 7, 9], chords=[0, 3, 4, 0, 5, 3, 4, 0],
         melody=[0, 2, 3, 2, 1, 2, 4, 3, 2, 0, 1, 2, 3, 1, 0, -1]),
    dict(file='curious-trail.wav', bpm=88, root=57, instrument='pizzicato',
         scale=[0, 2, 3, 7, 10], chords=[0, 5, 3, 4, 0, 3, 5, 0],
         melody=[0, 1, 3, 2, 0, -1, 2, 1, 3, 4, 2, 1, 0, 2, 1, 0]),
    dict(file='letters-on-the-way.wav', bpm=104, root=62, instrument='piano',
         scale=[0, 2, 4, 7, 9], chords=[0, 4, 5, 3, 0, 3, 4, 0],
         melody=[2, 3, 4, 2, 1, 0, 1, 3, 4, 3, 1, 2, 0, 1, -1, 0]),
    dict(file='barn-rehearsal.wav', bpm=100, root=60, instrument='bells',
         scale=[0, 2, 4, 7, 9], chords=[0, 3, 0, 4, 5, 3, 4, 0],
         melody=[3, 2, 0, 2, 4, 3, 2, 1, 0, 2, 3, 4, 3, 1, 2, 0]),
    dict(file='evening-farm.wav', bpm=76, root=60, instrument='flute',
         scale=[0, 2, 4, 7, 9], chords=[0, 5, 3, 0, 3, 5, 4, 0],
         melody=[0, 2, 1, 0, -1, 1, 2, 0, 3, 2, 1, 2, 0, -1, 1, 0]),
]


def frequency(midi):
    return 440 * 2 ** ((midi - 69) / 12)


def instrument_sample(kind, phase, seconds, length):
    # Every tone has a release envelope. Ringing tails wrap around the loop.
    attack = min(1, seconds / (0.09 if kind == 'flute' else 0.008))
    release = min(1, max(0, length - seconds) / 0.12)
    if kind == 'marimba':
        return (math.sin(phase) + 0.22 * math.sin(4 * phase) * math.exp(-seconds * 14)) * math.exp(-seconds * 5) * attack * release
    if kind == 'pizzicato':
        return (math.sin(phase) + 0.25 * math.sin(2 * phase) + 0.08 * math.sin(3 * phase)) * math.exp(-seconds * 8) * attack * release
    if kind == 'piano':
        return (math.sin(phase) + 0.2 * math.sin(2 * phase) * math.exp(-seconds * 3) + 0.06 * math.sin(3 * phase)) * math.exp(-seconds * 3.8) * attack * release
    if kind == 'bells':
        return (math.sin(phase) * math.exp(-seconds * 3) + 0.2 * math.sin(2.76 * phase) * math.exp(-seconds * 6)) * attack * release
    return (math.sin(phase) + 0.09 * math.sin(2 * phase)) * attack * release * (0.94 + 0.06 * math.sin(2 * math.pi * 4 * seconds))


def compose(config):
    beat_seconds = 60 / config['bpm']
    length = 128 * beat_seconds
    buffer = [0.0] * round(length * RATE)
    noise = random.Random(config['file'])
    scale = config['scale']

    def scale_note(degree):
        octave, index = divmod(degree, len(scale))
        return config['root'] + 12 + octave * 12 + scale[index]

    def tone(beat, midi, beats, amplitude, kind):
        start = round(beat * beat_seconds * RATE)
        seconds_length = beats * beat_seconds
        angular = 2 * math.pi * frequency(midi)
        for sample in range(round(seconds_length * RATE)):
            seconds = sample / RATE
            value = amplitude * instrument_sample(kind, angular * seconds, seconds, seconds_length)
            buffer[(start + sample) % len(buffer)] += value

    # Harmonies use a diatonic chord palette; the minor trail keeps a softer
    # suspenseful colour rather than a countdown or chase beat.
    chord_roots = [0, 2, 4, 5, 7, 9, 11]
    if config['file'] == 'curious-trail.wav':
        chord_roots = [0, 2, 3, 5, 7, 8, 10]
    for bar in range(32):
        degree = config['chords'][bar % 8]
        base = config['root'] - 12 + chord_roots[degree]
        third = 3 if degree in (1, 2, 5) else 4
        if config['file'] == 'curious-trail.wav':
            third = 3 if degree in (0, 1, 3, 4) else 4
        chord = [base + 12, base + 12 + third, base + 19]
        # Four sections: invitation, full groove, a lighter bridge, and return.
        section = bar // 8
        energy = [0.7, 1.0, 0.5, 0.9][section]
        tone(bar * 4, base, 2.4, 0.035, 'flute')
        if section != 2 and config['instrument'] != 'flute':
            for offset, interval in [(0, 0), (1.5, 7), (2.5, 12), (3.5, 7)]:
                tone(bar * 4 + offset, base + interval, 0.45, 0.06 * energy, 'pizzicato')
        tone(bar * 4 + 2, base + 7, 1.7, 0.025, 'marimba')
        for eighth in range(0, 8, 2 if section == 2 else 1):
            tone(bar * 4 + eighth / 2, chord[[0, 1, 2, 1, 0, 2, 1, 2][eighth]], 0.9, 0.025, 'piano')
        # A motif, its answer, and a small variation in the second eight bars.
        phrase = (bar % 8) * 2
        melody = config['melody']
        for step, offset in enumerate([0, 1.5, 2.5]):
            if config['instrument'] == 'flute' and step == 2:
                continue
            note_degree = melody[(phrase + step) % len(melody)]
            if section in (1, 3) and bar % 4 == 2:
                note_degree += 1
            if bar == 31:
                note_degree = [2, 1, 0][step]
            tone(bar * 4 + offset, scale_note(note_degree), 1.4 if step == 0 else 0.85, 0.075 * energy, config['instrument'])
        # Soft kick, brushed snare and shuffled hats add a light detective groove.
        # The bridge drops the drums, leaving space before the final return.
        if config['instrument'] != 'flute' and section != 2:
            for beat in [0, 2]:
                start = round((bar * 4 + beat) * beat_seconds * RATE)
                for sample in range(round(0.18 * RATE)):
                    t = sample / RATE
                    kick = math.sin(2 * math.pi * (55 * t + 4 * (1 - math.exp(-t * 25))))
                    buffer[(start + sample) % len(buffer)] += kick * math.exp(-t * 24) * 0.055 * energy
            for beat in [1, 3]:
                start = round((bar * 4 + beat) * beat_seconds * RATE)
                for sample in range(round(0.11 * RATE)):
                    t = sample / RATE
                    brush = noise.uniform(-1, 1) * math.exp(-t * 40) * min(1, t / 0.005)
                    buffer[(start + sample) % len(buffer)] += brush * 0.025 * energy
            previous_noise = 0.0
            for eighth in range(8):
                start = round((bar * 4 + eighth / 2 + (0.06 if eighth % 2 else 0)) * beat_seconds * RATE)
                for sample in range(round(0.035 * RATE)):
                    t = sample / RATE
                    current_noise = noise.uniform(-1, 1)
                    hat = (current_noise - previous_noise) * math.exp(-t * 140) * min(1, t / 0.002)
                    previous_noise = current_noise
                    buffer[(start + sample) % len(buffer)] += hat * 0.009 * energy

    # Avoid clipping and keep all six tracks at a comparable comfortable level.
    peak = max(abs(value) for value in buffer)
    gain = min(1, 0.28 / peak)
    destination = ROOT / 'public/audio' / config['file']
    with wave.open(str(destination), 'wb') as output:
        output.setparams((1, 2, RATE, 0, 'NONE', 'not compressed'))
        output.writeframes(b''.join(struct.pack('<h', round(value * gain * 32767)) for value in buffer))
    print(f"Prepared {config['file']} ({length:.1f}s, {config['bpm']} BPM).")


for composition in COMPOSITIONS:
    compose(composition)
