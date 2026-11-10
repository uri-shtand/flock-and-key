import { expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { musicTracks, pickBackgroundTrack } from "../../src/audio/Music";

it("includes six distinct playable PCM tracks with non-silent audio", () => {
  expect(musicTracks).toHaveLength(6);
  expect(new Set(musicTracks.map((t) => t.path)).size).toBe(6);
  for (const track of musicTracks) {
    const wav = readFileSync(resolve("public", track.path.slice(1)));
    expect(wav.toString("ascii", 0, 4)).toBe("RIFF");
    expect(wav.toString("ascii", 8, 12)).toBe("WAVE");
    expect(wav.readUInt16LE(20)).toBe(1);
    expect(wav.readUInt32LE(24)).toBe(22050);
    expect(wav.length).toBeGreaterThan(22050 * 2 * 20);
    let peak = 0;
    for (let offset = 44; offset + 1 < wav.length; offset += 2)
      peak = Math.max(peak, Math.abs(wav.readInt16LE(offset)));
    expect(peak).toBeGreaterThan(1000);
    expect(peak).toBeLessThan(32767);
  }
});
it("makes each alternative reachable and avoids the track from the previous stage", () => {
  for (const previous of musicTracks) {
    const selected = new Set(
      Array.from(
        { length: 5 },
        (_, i) => pickBackgroundTrack(previous.path, () => (i + 0.5) / 5).path,
      ),
    );
    expect(selected.size).toBe(5);
    expect(selected.has(previous.path)).toBe(false);
  }
});
