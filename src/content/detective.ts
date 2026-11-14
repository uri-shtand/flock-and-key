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
export const observations: Partial<Record<Clue, string>> = {
  ribbon: 'סרט קרוע עם כוכבים נתפס בתוך העגלה. תום: ״קישוט עם סיפור. נשאל למי הוא שייך.״',
  tracks: 'עקבות פרסה מקומחות עולות משולחן הפיקניק אל העגלה. פיצי מרחרח. תום: ״כן, קמח. זו לא הזמנה ללקק את הראיות.״',
  basket: 'פיצי מתיישב ליד הסל ומביט בו בחשד עמוק. תום: ״את ארוחת הבוקר כבר חקרת.״ מתוך הסל עולה רק ריח של לחם.',
};
