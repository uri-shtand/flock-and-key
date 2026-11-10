import { afterEach, expect, it, vi } from 'vitest';
import { readCompleted, saveCompleted } from '../../src/progress/ProgressStore';
afterEach(() => vi.unstubAllGlobals());
it('recovers from corrupted or invalid stored progress', () => {
  for (const value of ['{', '-1', 'null', '"9"', '1.5']) {
    vi.stubGlobal('localStorage', { getItem: () => value });
    expect(readCompleted()).toBe(0);
  }
});
it('keeps the game usable when browser storage is blocked', () => {
  vi.stubGlobal('localStorage', { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); } });
  expect(readCompleted()).toBe(0);
  expect(saveCompleted(1)).toBe(false);
});
