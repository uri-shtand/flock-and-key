const KEY = 'flock-and-key:progress:v1';
export function readCompleted(): number {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(KEY) ?? '0');
    return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : 0;
  } catch { return 0; }
}
export function saveCompleted(count: number): boolean {
  try { localStorage.setItem(KEY, JSON.stringify(count)); return true; }
  catch { return false; }
}
