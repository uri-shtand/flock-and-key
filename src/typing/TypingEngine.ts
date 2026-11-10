// Pure learning rules: no React, Phaser, storage or browser dependencies.
export function isCorrectAnswer(answer: string, expected: string): boolean {
  return answer.normalize('NFC').trim() === expected.normalize('NFC');
}
