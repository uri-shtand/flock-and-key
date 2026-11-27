import type { Stage } from "./chapter";

export const stationName = "תחנת ראטן";
export const stationGermanName = "Kurort Rathen";
export const stationFormerName = "ראטן";

export const stationArt = (name: string) => `${import.meta.env.BASE_URL}assets/station/${name}.webp`;
export type CourierRoute = "orchard" | "cafe";
export const courierRoutes = { orchard: "שביל הבוסתן", cafe: "דרך בית הקפה" } as const;

export const stationStages: Stage[] = [
  {
    mode: "guided", title: "ארגזים למחסן", place: "דלפק התחנה",
    dialogue: [{ speaker: "dad", text: "הארגזים לתערוכה מגיעים למחסן. תוכלו לכתוב עליהם מה יש בפנים?" }, { speaker: "sister", text: "בטח. פיצי, כובעים הולכים למדף. הראש שלך לא נחשב מדף." }],
    mission: { title: "מסדרים את מדפי התחנה", instruction: "העתיקו את הכיתוב שאבא מציג ולחצו Enter. בסוף נשלוף מהמדף ארגז שהמארגנת ביקשה." },
    clue: "הארגז לתערוכה מוכן", closing: "אבא שולח את הארגז לכיכר. פיצי כבר בודק אם מישהו הזמין כובעים נוספים.",
  },
  {
    mode: "blind", title: "בעקבות פיצי", place: "שביל הבוסתן",
    dialogue: [{ speaker: "tom", text: "סרט הקישוט לכיכר נעלם. פיצי מצא פיסת סרט בשביל!" }, { speaker: "sister", text: "בכל צומת נבדוק לאיזה מקום הרמז מתאים." }],
    mission: { title: "קוראים את שביל הרמזים", instruction: "השוו את הרמז לשני השלטים. בחרו מקום, או הקלידו את שמו ולחצו Enter." },
    clue: "סרט הקישוט חזר לכיכר", closing: "בעלת בית הקפה שמרה את הסרט בצד. פיצי ביקש לשמור גם על הטוסטים.",
  },
  {
    mode: "spelling", title: "גלויות לדוור", place: "עמדת הדואר בתחנה",
    dialogue: [{ speaker: "postman", text: "גשם מחק כמה מילים מהגלויות לתערוכה. מזל שהכנתּי הקלטה!" }, { speaker: "sister", text: "נקשיב ונשלים את המילה. הגלויות יחזרו למתקן." }],
    mission: { title: "משלימים את הגלויות", instruction: "הקשיבו למילה ולמשפט וכתבו את המילה החסרה. כשההקראה כבויה תוכלו להעתיק אותה." },
    clue: "מתקן הגלויות התמלא", closing: "הדוור בודק אם הגלויה עם הציור של התוף תיכנס לתיבה. את התוף עצמו הוא השאיר בכיכר.",
  },
  {
    mode: "speed", title: "שליחות עם פיצי", place: "הדרך לכיכר",
    dialogue: [{ speaker: "dad", text: "יש לי פתק ללהקה בכיכר. תבחרו דרך, ופיצי יראה לכם את השלטים." }, { speaker: "tom", text: "רק רגע, פיצי. הטוסט בלוח של בית הקפה הוא ציור." }],
    mission: { title: "מוסרים פתק ללהקה", instruction: "הקלידו כל מילה שעל השלט. כשתהיה נכונה נתקדם לבד אל התחנה הבאה. אפשר לשחק בקצב רגוע או למדוד זמן אישי." },
    clue: "הפתק הגיע ללהקה", closing: "המנצח קורא את הפתק. פיצי כבר קד קידה." ,
  },
];

export const storageLabels = [
  ["נר", "דף", "סרט", "צבע", "כובע", "כבל"],
  ["מפות", "גלויות", "דגלים", "חוטים", "תצלום", "טושים"],
  ["תצלומים", "מחברות", "מטריות", "מסגרות", "מעטפות", "מדבקות"],
  ["כלי נגינה", "סרטי בד", "דגלי נייר", "תצלומי נוף", "כובעי שמש", "נרות קטנים"],
  ["מפות הבוסתן", "תצלומי התחנה", "כרטיסי הנסיעה", "שלטים לתערוכה", "כבלי התאורה", "גלויות הכפר"],
] as const;

export const trail = [
  { word: "ספסל", other: "שער", clue: "על פיסת הסרט נדבק צבע כחול. מה עשוי מעץ צבוע?" },
  { word: "עץ", other: "קיר", clue: "הפעם הפיסה הסתבכה בענף. ליד מה נבדוק?" },
  { word: "ברז", other: "דלת", clue: "שומעים טיפה נופלת על מתכת, וליד הרמז יש שלולית קטנה." },
  { word: "גדר", other: "סלע", clue: "קצה הסרט נשאר כרוך סביב אחד מהעמודים בשורה." },
  { word: "אדנית", other: "חלון", clue: "על הרמז נדבקה אדמה ויש לידו שורה של פרחים." },
  { word: "מרפסת", other: "מדרגות", clue: "מעל הכניסה רואים שני כיסאות, וביניהם משהו מתנופף." },
  { word: "קופה", other: "מפה", clue: "כאן בעלת בית הקפה מניחה את העודף ומחכה למי שאיבד סרט." },
  { word: "כיכר", other: "מחסן", clue: "בעלת בית הקפה מצביעה על המקום הפתוח שבו הלהקה מנגנת." },
] as const;

export function courierWords(route: CourierRoute, level: number) {
  const paths = {
    orchard: [["עץ", "שער", "פרי", "צל"], ["שביל", "גדר", "בוסתן", "כיכר"], ["פרדס", "אבנים", "סמטה", "תזמורת"]],
    cafe: [["תה", "דלת", "טוסט", "גג"], ["קפה", "ספסל", "חלון", "כיכר"], ["גלויה", "מגש", "מדרגות", "תזמורת"]],
  };
  return paths[route][level - 1] ?? paths[route][0];
}

export function spellingFromStation(sentence: string, word: string) {
  return sentence.includes(word) ? sentence.replaceAll(word, "___") : "";
}

export const stationShopTabs = ["פיצי והמשפחה", "אולם התחנה", "הכניסה והכיכר"] as const;
export const stationPrizes = [
  { id: "stationScarf", title: "מטפחת לפיצי", price: 30, tab: 0, art: "family-lineup", x: 83, y: 77, width: 7.8 },
  { id: "carriageTag", title: "תג בצורת קרון", price: 55, tab: 0, art: "family-lineup", x: 83.9, y: 79.8, width: 3.2 },
  { id: "trainPin", title: "סיכת רכבת", price: 80, tab: 0, art: "family-lineup", x: 22, y: 42, width: 3.2 },
  { id: "dadBow", title: "עניבת הפפיון של אבא", price: 125, tab: 0, art: "family-lineup", x: 61, y: 26, width: 6.5 },
  { id: "dogCushion", title: "כרית לפיצי", price: 65, tab: 1, art: "station-hall", x: 14.1, y: 74.8, width: 17 },
  { id: "windowHerbs", title: "עציצים לחלון", price: 110, tab: 1, art: "station-hall", x: 7.8, y: 46, width: 6.3 },
  { id: "railPhotos", title: "תמונות מהקו הישן", price: 160, tab: 1, art: "station-hall", x: 38, y: 23, width: 15 },
  { id: "modelTrain", title: "רכבת מיניאטורית", price: 300, tab: 1, art: "station-hall", x: 90, y: 11.7, width: 10 },
  { id: "carriageMosaic", title: "פסיפס קרון", price: 95, tab: 2, art: "forecourt", x: 39, y: 90, width: 21 },
  { id: "orchardPlanters", title: "אדניות מהבוסתן", price: 145, tab: 2, art: "forecourt", x: 55, y: 73.5, width: 14 },
  { id: "squareLights", title: "שרשרת אורות לכיכר", price: 220, tab: 2, art: "square", x: 80.4, y: 36, width: 26 },
  { id: "stationBunting", title: "דגלוני יום התחנה", price: 360, tab: 2, art: "square", x: 80.5, y: 68, width: 26 },
] as const;
export type StationPrizeId = (typeof stationPrizes)[number]["id"];
