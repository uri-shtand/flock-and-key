import { adventureInteractions, adventureItems, caseOpening, deductionBoards, evidenceSentences, type BoardId, type InteractionId, type ItemId } from "./detective";
import type { CharacterId, DialogueLine } from "./chapter";

export type AdventureEdition = 2 | 3 | 4;
export type CasePlace = "yard" | "cafe" | "bridge";
type Interaction = { title: string; kind: "talk" | "look" | "try"; speaker: Exclude<CharacterId, "narrator">; prompt: string; lines: readonly { id: string; text: string }[] };
type Board = { title: string; groups: readonly (readonly string[])[]; conclusion: string; hints: readonly string[] };
type Spot = { id: InteractionId; place: CasePlace; x: number; y: number };
type CaseContent = {
  title: string; opening: DialogueLine[]; interactions: Partial<Record<InteractionId, Interaction>>;
  items: Partial<Record<ItemId, { title: string; description: string; source: InteractionId }>>;
  boards: Record<BoardId, Board>; spots: readonly Spot[];
  places: Partial<Record<CasePlace, { label: string; art: string }>>;
  ending: [string, string, string]; objective: string; guided: string;
};

function source(title: string, speaker: Interaction["speaker"], prompt: string, lines: [string, string][], kind: Interaction["kind"] = "look"): Interaction {
  return { title, kind, speaker, prompt, lines: lines.map(([id, text]) => ({ id, text })) };
}

const legacy: CaseContent = {
  title: "הטרמפ של נוגה", opening: caseOpening, interactions: adventureInteractions, items: adventureItems, boards: deductionBoards,
  spots: [
    { id: "dad", place: "yard", x: 81, y: 42 }, { id: "postman", place: "yard", x: 28, y: 47 },
    { id: "ribbon", place: "yard", x: 63, y: 54 }, { id: "book", place: "yard", x: 50, y: 46 },
    { id: "sheep", place: "yard", x: 15, y: 74 }, { id: "tracks", place: "yard", x: 76, y: 77 },
    { id: "basket", place: "yard", x: 45, y: 87 }, { id: "note", place: "bridge", x: 9, y: 53 },
    { id: "lower", place: "bridge", x: 49, y: 73 }, { id: "curtain", place: "bridge", x: 58, y: 30 },
  ],
  places: { yard: { label: "חצר החווה", art: "" }, bridge: { label: "הגשר הישן", art: "" } },
  ending: ["נוגה על המסלול.", "״פיקניק? קודם תצוגת אופנה. לצמר הזה יש עתיד!״", "פיצי מנסה לדגמן. הסיבוב שלו מסתיים בישיבה מרשימה."],
  objective: "מישהו לקח טרמפ. מה הוא השאיר מאחוריו?", guided: "אפשר להתחיל בעגלה, לשאול את אבא ולחפש עקבות.",
};

const noga: CaseContent = {
  title: "איפה נוגה?",
  opening: [{ speaker: "dad", text: "נוגה הגיעה ברכבת לחזרה. למה הכיסא שלה בכיכר ריק?" }, { speaker: "sister", text: "התיק עם דפי השירים אצלי. בוא נמצא אותה ונביא לה אותם." }, { speaker: "tom", text: "פיצי מצא פירור טוסט. רשמנו, בלש. מה עוד?" }],
  places: { yard: { label: "כיכר הכפר", art: "square" }, cafe: { label: "בית הקפה", art: "station-cafe" }, bridge: { label: "המחסה ליד התחנה", art: "forecourt" } },
  spots: [
    { id: "dad", place: "yard", x: 28, y: 56 }, { id: "book", place: "yard", x: 69, y: 62 },
    { id: "postman", place: "cafe", x: 27, y: 53 }, { id: "ribbon", place: "cafe", x: 66, y: 71 }, { id: "basket", place: "cafe", x: 35, y: 77 },
    { id: "note", place: "bridge", x: 64, y: 41 }, { id: "curtain", place: "bridge", x: 44, y: 57 },
  ],
  interactions: {
    dad: source("מארגנת החזרה", "organizer", "מתי נוגה קמה מהכיסא?", [["rainStarted", "הגשם התחיל באמצע בדיקת הקול. נוגה קמה מיד והחזרה בכיכר נעצרה."], ["nogaFolder", "נוגה לקחה את תיק התווים שלה. יש עליו מדבקה גדולה בצורת כוכב."]], "talk"),
    book: source("כרטיס הבמה הרטוב", "tom", "בדקנו את הכיסא ואת כרטיס הבמה.", [["wetCard", "כרטיס הבמה של בדיקת הקול רטוב ויש עליו כתמי טיפות טריים."]]),
    postman: source("בעלת בית הקפה", "cafeOwner", "ראית מי יצאה מהכיכר?", [["blueGuess", "ראיתי צעיף כחול ליד הדלת וחשבתי שזאת נוגה. ראיתי רק את הצעיף וסינר של בית הקפה."]], "talk"),
    ribbon: source("הצעיף על הספסל", "sister", "אולי הניחוש על הצעיף היה מהיר מדי.", [["scarfOnBench", "הצעיף הכחול של נוגה עדיין מקופל על הספסל ליד החלון."]]),
    basket: source("פירור הטוסט", "tom", "פיצי ביקש שנבדוק גם כאן.", [["toastCrumb", "פיצי סיים לבדוק את הפירור. הראיה כבר אינה זמינה."]]),
    note: source("הודעת מזג האוויר", "sister", "זו הודעה של מארגנת החזרה.", [["rainRule", "אם יורד גשם בזמן בדיקת הקול, עוברים למחסה ליד התחנה."], ["shelterName", "מקום בדיקת הקול בגשם: המחסה המקורה ברחבת התחנה."]]),
    curtain: source("מעמד התווים", "tom", "אפשר לראות את המעמד מהשביל המקורה.", [["starOnStand", "על המעמד בתוך המחסה מונח תיק תווים עם מדבקת כוכב גדולה."]]),
  },
  items: {
    ribbon: { title: "כרטיס הבמה הרטוב", description: "בכרטיס יש כתמי טיפות מבדיקת הקול.", source: "book" },
    delivery: { title: "עותק מהודעת הגשם", description: "ההודעה מפנה את הלהקה למחסה ליד התחנה.", source: "note" },
  },
  boards: {
    happened: { title: "למה נוגה עזבה את הכיכר?", groups: [["wetCard", "ribbon"], ["rainStarted"], ["rainRule", "delivery"]], conclusion: "הגשם עצר את בדיקת הקול. נוגה המשיכה לפי הודעת הגשם.", hints: ["בדקו מה נשאר על הבמה ושאלו את המארגנת.", "השוו את מצב הכרטיס ואת מועד הגשם להודעת החזרה.", "הכרטיס רטוב, הגשם התחיל באמצע החזרה, ובהודעה כתוב לעבור למחסה."] },
    where: { title: "איפה נוגה עכשיו?", groups: [["shelterName", "rainRule", "delivery"], ["nogaFolder"], ["starOnStand"]], conclusion: "נוגה במחסה ליד התחנה. תיק הכוכב שלה נמצא על מעמד התווים.", hints: ["אפשר לבדוק את המחסה עוד לפני שפותרים את השאלה הראשונה.", "מה נוגה לקחה? השוו את התיאור למה שרואים במחסה.", "ההודעה מפנה למחסה. נוגה לקחה תיק כוכב, והוא מונח שם על המעמד."] },
  },
  ending: ["מצאנו את נוגה!", "נוגה מקבלת את דפי השירים ומזמינה את האחים לבדוק את הפזמון.", "פיצי מנסה להיכנס בדיוק בזמן. הנביחה שלו מגיעה פעימה אחת מאוחר מדי."],
  objective: "הכיסא ריק. למה נוגה קמה, ואיפה נביא לה את דפי השירים?", guided: "אפשר להתחיל בכרטיס הבמה הרטוב ולדבר עם המארגנת.",
};

const parcel: CaseContent = {
  title: "החבילה לתחנה הישנה",
  opening: [{ speaker: "dad", text: "תחנת הגבעה? ככה קראו לתחנה פעם. אולי העתיקו כתובת ישנה." }, { speaker: "sister", text: "אז למה השלט הישן מופיע בתצלום מיום שלישי?" }, { speaker: "tom", text: "אולי יש עוד תחנה. רגע, גם בה האריח ליד הדלת עקום?" }],
  places: { yard: { label: "אולם התחנה", art: "station-hall" }, cafe: { label: "בית הקפה", art: "station-cafe" }, bridge: { label: "כיכר הכפר", art: "square" } },
  spots: [
    { id: "dad", place: "yard", x: 87, y: 37 }, { id: "ribbon", place: "yard", x: 76, y: 53 }, { id: "tracks", place: "yard", x: 23, y: 65 },
    { id: "postman", place: "cafe", x: 27, y: 54 }, { id: "basket", place: "cafe", x: 46, y: 32 },
    { id: "note", place: "bridge", x: 70, y: 48 }, { id: "lower", place: "bridge", x: 37, y: 57 },
  ],
  interactions: {
    dad: source("רשומת המסירה של אבא", "dad", "אבא, מתי חבילה 27 נכנסה לתחנה?", [["fridayArrival", "מסירה 27: מפת שבילים מקורית. הגיעה ברכבת ביום שישי בשעה 14:20."], ["todayTimetable", "לוח הזמנים הציבורי מציג הגעה ביום שישי בשעה 14:20."]], "talk"),
    ribbon: source("תגי חבילה 27", "sister", "שתי תוויות, שתי כתובות.", [["familyTag", "על תג התערוכה כתוב: ״כתבנו תחנת הגבעה, השם הישן, לכבוד התערוכה.״"], ["currentSlip", "על פתק האיסוף מופיעים כתובת התחנה הנוכחית, תחנת הגבעות, ומספר החבילה 27."]]),
    tracks: source("האריח העקום", "tom", "האריח ליד הכניסה בולט גם מקרוב.", [["tileMatch", "האריח העקום ליד הדלת מופיע באותו מקום בתצלום. זו התחנה שלנו."]]),
    postman: source("בעלת בית הקפה והתצלומים", "cafeOwner", "מה צילמת ביום שלישי?", [["tuesdaySign", "צילמתי את המארגנת מרימה את השלט הישן ואז תולה אותו לפני תצוגת יום שלישי."], ["witnessBundle", "ראיתי חבילה עם עטיפה מפוספסת יוצאת מהתחנה. חשבתי שהגיעה ברכבת."]], "talk"),
    basket: source("פרס הכריך", "tom", "פיצי ביקש בדיקה מקצועית.", [["sandwichAward", "תמונה קטנה מציגה את הכריך לפני שהשתפר. הייתה לו נטייה להתפרק."]]),
    note: source("רשימת התצוגה", "organizer", "איזו מפה הוצגה ביום שלישי?", [["previewCopy", "ברשימת המסירה של יום שלישי כתוב: העתק בעטיפה מפוספסת, הועבר מהאולם לכיכר."], ["previewTime", "תצוגה מקדימה בכיכר: יום שלישי ב־16:00."]], "talk"),
    lower: source("כיתוב התערוכה", "sister", "המארגנת השאירה לנו שתי טיוטות.", [["captionDraft", "טיוטה א: המפה המקורית הוצגה ביום שלישי. טיוטה ב: ביום שלישי הוצג העתק. המקור הגיע ביום שישי."]]),
  },
  items: {
    ribbon: { title: "תג התערוכה", description: "כתוב עליו שהמשפחה השתמשה בשם הישן לכבוד התערוכה.", source: "ribbon" },
    delivery: { title: "עותק מרשומת 27", description: "מפת שבילים מקורית, נמסרה בשישי ב־14:20.", source: "dad" },
  },
  boards: {
    happened: { title: "למה השם הישן מופיע פעמיים?", groups: [["familyTag", "ribbon"], ["tileMatch"], ["tuesdaySign"]], conclusion: "זו התחנה שלנו. השלט הוחזר לצילום, והמשפחה כתבה את השם הישן לכבוד התערוכה.", hints: ["בדקו את הכניסה, את תג החבילה ואת התצלומים.", "האריח קושר את התצלום לתחנה. מי כתב את תג החבילה ומי החזיר את השלט?", "התצלום מראה את תליית השלט, והתג מסביר את הכתובת הישנה."] },
    where: { title: "איזו מפה הוצגה ביום שלישי?", groups: [["previewCopy"], ["fridayArrival", "delivery"], ["witnessBundle"]], conclusion: "ביום שלישי הוצג העתק בעטיפה מפוספסת. המקור הגיע רק ביום שישי.", hints: ["שאלו על העטיפה ובדקו את רשומות יום שלישי ושישי.", "חפשו מתי המקור הגיע ומה כתוב על העטיפה של ההעתק.", "העדות על העטיפה שייכת להעתק מרשימת יום שלישי. חבילה 27 הגיעה בשישי."] },
  },
  ending: ["הכיתוב תוקן", "המארגנת מניחה את המקור ליד ההעתק ומחליפה את הכיתוב בתערוכה.", "האחות מצביעה על שביל עם שם ישן. היא שמעה את השם פעם מהשכנים…"],
  objective: "למה השם הישן מופיע בתצלום חדש, ומה הגיע בחבילה 27?", guided: "אפשר להשוות את האריח בכניסה לתצלום, או לבדוק את תג החבילה.",
};

export function adventureContent(edition: AdventureEdition) {
  return edition === 3 ? noga : edition === 4 ? parcel : legacy;
}

export function adventureLines(edition: AdventureEdition) {
  if (edition === 2) return evidenceSentences;
  const content = adventureContent(edition);
  return (Object.keys(content.interactions) as InteractionId[]).flatMap(id => content.interactions[id]!.lines.map(line => ({ ...line, source: id })));
}
