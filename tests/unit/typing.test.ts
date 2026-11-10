import { describe, expect, it } from 'vitest';
import { isCorrectAnswer } from '../../src/typing/TypingEngine';
describe('Hebrew answer validation', () => {
  it('accepts the correct word and harmless outside whitespace', () => {
    expect(isCorrectAnswer(' דג ', 'דג')).toBe(true);
  });
  it('rejects another spelling, missing letters and empty input', () => {
    for (const answer of ['דק', 'ד', '', 'ד ג']) expect(isCorrectAnswer(answer, 'דג')).toBe(false);
  });
});
