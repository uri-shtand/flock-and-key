export const gatesLevels = [
  { title: "פיקניק בלי מפיות", subtitle: "ארבעה שערים מההתחלה. פתחו בזמן כדי לשמור על זרימה.", sheep: 4, speed: 160, gates: 4, hold: 2, theme: "picnic", accent: "#e9bc62", joke: "בלה הביאה סלט. הסלט היה הדשא.", dusk: "הפיקניק נגמר. מי אכלה את המפית?", finish: "כולן חזרו. המפית עדיין בחקירה." },
  { title: "משלוח פרחים", subtitle: "שער המכלאה המערבי נפתח למסלול: כ. עכשיו מפעילים חמישה שערים.", sheep: 4, speed: 175, gates: 5, hold: 2, theme: "flowers", accent: "#ce87ac", joke: "שושנה ביקשה זר. קיבלה ארוחת צהריים.", dusk: "הפרחים נמסרו. נשאר רק הגבעול.", finish: "משלוח הושלם. טעים מאוד, לפי הלקוחות." },
  { title: "תהלוכת הצמר", subtitle: "גם השער המזרחי מצטרף: ח. העדר עובר בשישה שערים.", sheep: 4, speed: 175, gates: 6, hold: 2, theme: "parade", accent: "#77b5c5", joke: "לצמרית יש צעיף. היא טוענת שזה בן דוד.", dusk: "הדוגמניות חוזרות. נא לא לדרוך על הצעיף.", finish: "תצוגת האופנה הסתיימה. כולן לבשו צמר." },
  { title: "הרוח והבלורית", subtitle: "השער הצפוני מצטרף: י. שבעה שערים, ותיבת הילוכים אחת.", sheep: 4, speed: 175, gates: 7, hold: 2, theme: "wind", accent: "#b4a0d1", joke: "הרוח לקחה לבלה את התסרוקת. היא ביקשה החזר.", dusk: "הכובעים הביתה! וגם הכבשים שבתוכם.", finish: "ארבע כבשים, ארבע תסרוקות חדשות." },
  { title: "מסיבת פיג׳מות", subtitle: "נפתחים שני שערי השבילים: ש, ך. תשעה שערים במסלול המלא!", sheep: 4, speed: 175, gates: 9, hold: 2, theme: "party", accent: "#d5ac65", joke: "סופרים כבשים כדי להירדם. הן סופרות אותנו.", dusk: "כולם לפיג׳מות. הדשא כבר מצחצח שיניים.", finish: "כל האורחות בבית. אף אחת לא נרדמה בספירה." },
] as const;
export type GatesConfig = {
  level: number; speed: number; sheepCount: number; openSeconds: number;
  gearboxSeconds: number; hints: boolean; reducedMotion: boolean;
};
export function levelConfig(level = 1): GatesConfig {
  const number = Math.max(1, Math.min(5, Math.round(level)));
  const content = gatesLevels[number - 1];
  return { level: number, speed: content.speed, sheepCount: content.sheep, openSeconds: content.hold,
    gearboxSeconds: 0.45, hints: true, reducedMotion: false };
}
/** Same bounds for the lab, imported settings and saved runs. Never trust storage. */
export function validGatesConfig(value: unknown): value is GatesConfig {
  if (!value || typeof value !== "object") return false;
  const c = value as GatesConfig;
  return Number.isInteger(c.level) && c.level >= 1 && c.level <= 5 &&
    Number.isFinite(c.speed) && c.speed >= 90 && c.speed <= 260 &&
    Number.isInteger(c.sheepCount) && c.sheepCount >= 2 && c.sheepCount <= 10 &&
    Number.isFinite(c.openSeconds) && c.openSeconds >= 1.2 && c.openSeconds <= 5 &&
    Number.isFinite(c.gearboxSeconds) && c.gearboxSeconds >= 0.15 && c.gearboxSeconds <= 1.2 &&
    typeof c.hints === "boolean" && typeof c.reducedMotion === "boolean";
}
