import type { DialogueLine } from './chapter';

export const caseOpening: DialogueLine[] = [
  { speaker: 'dad', text: 'הצלחות כאן, הלחם כאן… רגע, איפה נוגה? היא אף פעם לא מפספסת פיקניק!' },
  { speaker: 'tom', text: 'העגלה של הדוור בדיוק חזרה. נבדוק אם נשאר בה רמז לאן היא הלכה?' },
  { speaker: 'narrator', text: 'פיצי מכניס את האף לסל. תום: ״תודה, בלש. הסנדוויצ׳ים לא נעלמו. עדיין.״' },
];

export const caseSources = {
  dad: { title: 'אבא', strips: [
    { id: 'stars', text: 'הבוקר קשרתי לנוגה סרט עם כוכבים. לשאר הכבשים יש סרטים חלקים.' },
    { id: 'guess', text: 'הנחתי לחם על שולחן הפיקניק, ונוגה התקרבה אליו. כשחזרתי עם הצלחות, היא כבר לא הייתה שם. אולי הלכה לאסם, כי שם שומרים את האוכל. לא ראיתי אותה הולכת לשם.' },
  ] },
  book: { title: 'פנקס המשלוחים', strips: [
    { id: 'today', text: 'היום: לקחת את השטיח מהחווה אל הגשר. להניח אותו במקום שקבע שומר הגשר ולחזור לחווה בלי עצירות נוספות.' },
    { id: 'tomorrow', text: 'מחר: לקחת את סלי האוכל אל האסם. הסלים יישארו בחווה עד הבוקר. אין צורך להעביר אותם היום.' },
  ] },
  postman: { title: 'הדוור', strips: [
    { id: 'trip', text: 'יצאתי אחרי ארוחת הבוקר עם השטיח שבתוכנית של היום. את הסלים השארתי ליד אבא; הם מיועדים למחר.' },
    { id: 'returned', text: 'כשהגעתי ליעד, פרקתי את השטיח וחזרתי ישר לחווה. לא בדקתי אם מישהו התחבא מאחוריו. עכשיו מצאתי בעגלה את הסרט הזה. קודם חשבתי שהוא קישוט של השטיח.' },
  ] },
  note: { title: 'הפתק של שומר הגשר', strips: [
    { id: 'usual', text: 'לדוור: בדרך כלל מניחים משלוחים מתחת לקשת, אבל היום הרצפה שם רטובה.' },
    { id: 'platform', text: 'את השטיח הנח על הבמה שמעל הקשת, מאחורי המחיצה הנמוכה. הרוח מגיעה לשם, ולכן שים אבן על כל פינה שלו.' },
    { id: 'baskets', text: 'את הסלים של מחר השאר ליד הכניסה; הם לא צריכים להגיע לבמה.' },
  ] },
} as const;
export type SourceId = keyof typeof caseSources;
export const sourceIds = Object.keys(caseSources) as SourceId[];
export const clues = ['ribbon', 'tracks', 'basket', ...sourceIds] as const;
export type Clue = typeof clues[number];
export const decisions = {
  identity: { title: 'מי עלתה לעגלה?', choices: ['נוגה, עם סרט הכוכבים', 'לולה, עם הסרט החלק'], correct: 0, support: ['stars'], sources: ['dad'] as SourceId[], explanation: 'הסרט שנתפס בעגלה מלא כוכבים. אבא קשר סרט כזה רק לנוגה.', hints: ['כדאי לבדוק את הסרט בעגלה ולדבר עם אבא.', 'מה מיוחד בסרט של נוגה לעומת הסרטים האחרים?', 'סרט הכוכבים מחבר את נוגה לעגלה. נבדוק יחד.'] },
  route: { title: 'לאן נוסעים בעקבות העגלה?', choices: ['אל האסם', 'אל הגשר'], correct: 1, support: ['today', 'trip'], sources: ['book', 'postman'] as SourceId[], explanation: 'הדוור ביצע את התוכנית של היום: שטיח לגשר. סלי האוכל נוסעים לאסם רק מחר.', hints: ['בפנקס כתוב מה עושים היום ומה עושים מחר.', 'הדוור אמר שיצא עם השטיח שבתוכנית של היום. לאן נשלח השטיח?', 'הנסיעה של היום הייתה לגשר. האסם מחכה למחר. נבדוק יחד.'] },
  search: { title: 'איפה בודקים בגשר?', choices: ['מתחת לקשת', 'על הבמה שמעל הקשת'], correct: 1, support: ['platform'], sources: ['note'] as SourceId[], explanation: 'בדרך כלל משאירים משלוחים מתחת לקשת, אבל היום רטוב שם. השטיח הועבר לבמה.', hints: ['שומר הגשר השאיר פתק ליד הכניסה.', 'מה כתוב אחרי ״אבל היום״? חפשו את ההוראה על השטיח.', 'השטיח נמצא על הבמה, מאחורי המחיצה. נבדוק יחד.'] },
} as const;
export type DecisionId = keyof typeof decisions;
export const decisionIds = Object.keys(decisions) as DecisionId[];
export type CaseSettings = { guided: boolean; labels: boolean; reducedMotion: boolean };
export const defaultCaseSettings: CaseSettings = { guided: false, labels: true, reducedMotion: false };
export const defaultAdventureSettings: CaseSettings = { ...defaultCaseSettings, labels: false };
export const observations: Partial<Record<Clue, string>> = {
  ribbon: 'סרט קרוע עם כוכבים נתפס בתוך העגלה. תום: ״קישוט עם סיפור. נשאל למי הוא שייך.״',
  tracks: 'עקבות פרסה מקומחות עולות משולחן הפיקניק אל העגלה. פיצי מרחרח. תום: ״כן, קמח. זו לא הזמנה ללקק את הראיות.״',
  basket: 'פיצי מתיישב ליד הסל ומביט בו בחשד עמוק. תום: ״את ארוחת הבוקר כבר חקרת.״ מתוך הסל עולה רק ריח של לחם.',
};

// Authored adventure interactions: every selectable sentence keeps its source.
export const adventureInteractions = {
  dad: { title: 'שיחה עם אבא', kind: 'talk', speaker: 'dad', prompt: 'אבא, מתי ראית את נוגה בפעם האחרונה?', lines: [
    { id: 'stars', text: 'הבוקר קשרתי לנוגה סרט עם כוכבים. לשאר הכבשים יש סרטים חלקים.' },
    { id: 'guess', text: 'היא עמדה ליד הלחם. אולי הלכה לאסם? זו רק השערה; לא ראיתי אותה הולכת.' },
    { id: 'dadSnack', text: 'אם פיצי שואל, הסנדוויצ׳ים אינם חלק מצוות החקירה.' },
  ] },
  postman: { title: 'שיחה עם הדוור', kind: 'talk', speaker: 'postman', prompt: 'מישהו נסע איתך בעגלה היום?', lines: [
    { id: 'trip', text: 'יצאתי עם השטיח שבתוכנית של היום, פרקתי אותו וחזרתי ישר. לא הסתכלתי מאחוריו.' },
    { id: 'returned', text: 'בעגלה נשאר סרט עם כוכבים. השטיח שלי דווקא לא לובש סרטים.' },
    { id: 'postmanTea', text: 'התה שלי התקרר בדרך. אני חושד ברוח, אבל אין לי הוכחות.' },
  ] },
  ribbon: { title: 'הסרט בעגלה', kind: 'look', speaker: 'tom', prompt: 'תום מציץ בין לוחות העגלה.', lines: [
    { id: 'snag', text: 'סרט קרוע עם כוכבים נתפס בתוך העגלה, ממש ליד המקום שבו היה השטיח.' },
    { id: 'cartSqueak', text: 'הגלגל חורק כשנוגעים בעגלה. פיצי נובח בחזרה. השיחה לא מתקדמת.' },
  ] },
  book: { title: 'פנקס המשלוחים', kind: 'look', speaker: 'tom', prompt: 'תום פותח את הפנקס. יש כאן שתי נסיעות שונות.', lines: [
    { id: 'today', text: 'היום: לקחת את השטיח מהחווה אל הגשר. לפרוק ולחזור בלי עצירות נוספות.' },
    { id: 'tomorrow', text: 'מחר: לקחת את סלי האוכל אל האסם. הסלים נשארים בחווה עד הבוקר.' },
  ] },
  tracks: { title: 'עקבות הקמח', kind: 'look', speaker: 'tom', prompt: 'תום מתכופף ליד העקבות. פיצי מצטרף עם האף.', lines: [
    { id: 'tracks', text: 'עקבות פרסה מקומחות מובילות משולחן הפיקניק ישר אל העגלה, ועולות לתוכה.' },
    { id: 'flourTaste', text: 'פיצי בדק: זה קמח. עכשיו יש לו שפם של אופה.' },
  ] },
  sheep: { title: 'הכבשה בחצר', kind: 'look', speaker: 'tom', prompt: 'תום מתקרב לכבשה ומסתכל עליה.', lines: [
    { id: 'notNoga', text: 'זאת לא נוגה' },
  ] },
  basket: { title: 'הסל של פיצי', kind: 'look', speaker: 'tom', prompt: 'תום מרים את המכסה. פיצי עוצר את הנשימה.', lines: [
    { id: 'basketBread', text: 'בסל יש לחם וכף עץ. אין בו כבשה, אפילו לא כבשה קטנה במיוחד.' },
    { id: 'pitsiJob', text: 'פיצי התנדב לשמור על הלחם. תום ממנה אותו לשומר המכסה.' },
  ] },
  note: { title: 'הפתק של שומר הגשר', kind: 'look', speaker: 'tom', prompt: 'תום קורא את הפתק שתלוי בכניסה לגשר.', lines: [
    { id: 'usual', text: 'בדרך כלל מניחים משלוחים מתחת לקשת, אבל היום הרצפה שם רטובה.' },
    { id: 'platform', text: 'את השטיח הנח על הבמה שמעל הקשת, מאחורי המחיצה הנמוכה.' },
    { id: 'baskets', text: 'את הסלים של מחר השאר ליד הכניסה. הם לא צריכים להגיע לבמה.' },
  ] },
  lower: { title: 'מתחת לקשת', kind: 'try', speaker: 'tom', prompt: 'תום מציץ מתחת לקשת. פיצי נשאר במקום היבש.', lines: [
    { id: 'wet', text: 'האבנים מתחת לקשת רטובות. אין כאן שטיח, רק שלולית שמאוד מרוצה מעצמה.' },
  ] },
  curtain: { title: 'המחיצה על הבמה', kind: 'try', speaker: 'tom', prompt: 'תום מקשיב מעבר למחיצה.', lines: [
    { id: 'rustle', text: 'מאחורי המחיצה נשמעים רשרוש וביעת התרגשות. מישהו מתכונן שם למשהו.' },
  ] },
} as const;
export type InteractionId = keyof typeof adventureInteractions;
export const interactionIds = Object.keys(adventureInteractions) as InteractionId[];
export const adventureItems = {
  ribbon: { title: 'סרט הכוכבים', description: 'הסרט הקרוע שנתפס בתוך העגלה.', source: 'ribbon' },
  delivery: { title: 'פתק המשלוח', description: 'עותק מהפנקס: היום מעבירים את השטיח אל הגשר.', source: 'book' },
  spoon: { title: 'כף העץ', description: 'נמצאה בסל הפיקניק. פיצי טוען שהיא כלי חפירה ללחם.', source: 'basket' },
} as const;
export type ItemId = keyof typeof adventureItems;
export const itemIds = Object.keys(adventureItems) as ItemId[];
export const evidenceSentences = interactionIds.flatMap(source => adventureInteractions[source].lines.map(line => ({ ...line, source })));
export function evidenceText(id: string): string {
  return evidenceSentences.find(line => line.id === id)?.text ?? adventureItems[id as ItemId]?.description ?? id;
}
export const deductionBoards = {
  happened: { title: 'מה קרה לנוגה?', groups: [['stars'], ['ribbon', 'snag'], ['tracks']], conclusion: 'נוגה עלתה לעגלת הדוור והתחבאה ליד השטיח.', hints: ['מי הייתה ליד העגלה? בדקו את הסרט, את העקבות ושאלו את אבא.', 'חפשו שלושה חיבורים: של מי הסרט, איפה הוא נמצא ולאן מובילות העקבות.', 'נחבר יחד את הסרט של נוגה, הסרט בעגלה והעקבות שעולות אליה.'] },
  where: { title: 'איפה נוגה עכשיו?', groups: [['today', 'delivery'], ['trip'], ['platform']], conclusion: 'נוגה נסעה עם השטיח אל הבמה שמעל הקשת, מאחורי המחיצה.', hints: ['בדקו את הנסיעה של היום ואת הפתק בגשר. אפשר ללכת לגשר ולחזור בכל רגע.', 'צריך לחבר את היעד בפנקס, את הנסיעה שבוצעה ואת המקום שבו הונח השטיח.', 'נחבר יחד: השטיח נוסע היום לגשר, הדוור פרק אותו, והשומר ביקש להניחו על הבמה.'] },
} as const;
export type BoardId = keyof typeof deductionBoards;
export const boardIds = Object.keys(deductionBoards) as BoardId[];
