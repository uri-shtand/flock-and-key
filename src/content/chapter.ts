import vocabulary from "./words.json";
export type Mode = "guided" | "blind" | "spelling" | "speed";
export type CharacterId = "dad" | "tom" | "postman" | "pitsi" | "narrator";
export type DialogueLine = { speaker: CharacterId; text: string };
export type Word = (typeof vocabulary)[number];
export const words: Word[] = vocabulary;
export const stages: {
  mode: Mode;
  hiddenReason?: string;
  title: string;
  place: string;
  dialogue: DialogueLine[];
  mission: { title: string; instruction: string };
  clue: string;
  closing: string;
}[] = [
  {
    mode: "guided",
    title: "צובעים ארגזים",
    place: "החצר",
    dialogue: [
      { speaker: "dad", text: "תום, תראה מה קרה לארגזים! כל הכיתובים נמרחו." },
      { speaker: "tom", text: "וגם יש כאן נצנצים. מישהו הסתובב בחצר בלילה?" },
      {
        speaker: "dad",
        text: "בוא נצבע מחדש את המילים על הארגזים. אולי נמצא רמז מאחורי אחד מהם.",
      },
    ],
    mission: {
      title: "המשימה: כותבים על הארגזים",
      instruction:
        "אבא יציג מילה בבועה בצד ימין. כתבו אותה על הארגז בצד שמאל ולחצו Enter. המקלדת תראה לכם איפה נמצאת כל אות.",
    },
    clue: "נייר מנצנץ עם ציור של תו מוזיקלי",
    closing: "תום: תו מוזיקלי ונצנצים... נראה שמישהו תכנן כאן הופעה.",
  },
  {
    mode: "blind",
    hiddenReason: "קל מדי ולא מעניין מספיק — ממתין לתכנון מחדש (TASK-003)",
    title: "עקבות בחשיכה",
    place: "השביל המוצל",
    dialogue: [
      {
        speaker: "narrator",
        text: "פיצי מרחרח את השביל. ליד האסם הוא מוצא עקבות קטנים.",
      },
      { speaker: "tom", text: "מצאת משהו, פיצי? בוא נראה לאן העקבות מובילים." },
    ],
    mission: {
      title: "המשימה: מתקדמים בעקבות פיצי",
      instruction:
        "הקלידו את המילה שמופיעה על המסך ולחצו Enter. כל מילה תקדם את פיצי; אפשר לפתוח מקלדת עזר בכל רגע.",
    },
    clue: "טביעת פרסה בתוך נצנצים",
    closing: "תום: חשוד מספר אחת — מישהו עם פרסות וחיבה מוגזמת לנצנצים.",
  },
  {
    mode: "spelling",
    title: "הדואר המבולבל",
    place: "סניף הדואר",
    dialogue: [
      {
        speaker: "postman",
        text: "מצאתי הזמנה ליד האסם! אבל נשפך עליה תה וחלק מהמילים נמרחו.",
      },
      {
        speaker: "tom",
        text: "אולי כתוב בה מי היה כאן בלילה. ננסה לשחזר את המילים?",
      },
    ],
    mission: {
      title: "המשימה: משחזרים את המילים",
      instruction:
        "כתבו את המילה מההקראה ולחצו Enter. כשההקראה כבויה, המעטפה תציג את המילה להעתקה.",
    },
    clue: "הזמנה: ״חזרה חגיגית באסם. הביאו פעמון.״",
    closing: "הדוור: ואני חשבתי שמדובר בחתונה של אופניים.",
  },
  {
    mode: "speed",
    hiddenReason: "קל מדי ולא מעניין מספיק — ממתין לתכנון מחדש (TASK-003)",
    title: "פיצי במרדף",
    place: "בדרך לאסם",
    dialogue: [
      {
        speaker: "tom",
        text: "ההזמנה מזכירה את האסם, והעקבות מובילים ישר אליו. פיצי, קדימה!",
      },
      { speaker: "pitsi", text: "הב! הב!" },
      {
        speaker: "narrator",
        text: "מהאסם נשמע צלצול חלש. פיצי זוקף אוזניים ויוצא לדרך.",
      },
    ],
    mission: {
      title: "המשימה: מגיעים לאסם",
      instruction:
        "הקלידו את המילים כדי לקדם את פיצי. הפעם הוא יתקדם אוטומטית כשמילה נכונה. אפשר לבחור קצב רגוע; אין ספירה לאחור.",
    },
    clue: "פעמון קטן עטוף בחוט צמר",
    closing: "מהאסם נשמע צלצול… ועוד צלצול. מישהו מתאמן שם!",
  },
];
export const availableStages = stages.filter((stage) => !stage.hiddenReason);
export function nextAvailableStage(index: number): number {
  return stages.findIndex((stage, i) => i > index && !stage.hiddenReason);
}
export const prizes = [
  { id: "hat", title: "כובע בלשי לפיצי", price: 30, icon: "🎩" },
  { id: "mustache", title: "שפמים לכבשים", price: 65, icon: "🥸" },
  { id: "rainbow", title: "גדר בצבעי קשת", price: 100, icon: "🌈" },
  { id: "duck", title: "ברווז ענק בחצר", price: 160, icon: "🦆" },
  { id: "dance", title: "כבשים רוקדות", price: 240, icon: "🎵" },
  { id: "boots", title: "מגפיים לכבשים. ביי, שלולית!", price: 80, icon: "🥾" },
  { id: "bowtie", title: "עניבה לפיצי, מנהל החטיפים", price: 45, icon: "🎀" },
  { id: "sunglasses", title: "משקפי שמש לשמש", price: 110, icon: "🕶️" },
  { id: "crown", title: "הוד ברווזותו הראשון", price: 200, icon: "👑" },
  { id: "carrotFlag", title: "דגל גזר. יחי המרק!", price: 130, icon: "🥕" },
  { id: "mailbox", title: "תיבת דואר אדומה", price: 140, icon: "📮" },
  { id: "sunflowers", title: "ערוגת חמניות", price: 180, icon: "🌻" },
  { id: "scarves", title: "צעיפים לצמר", price: 260, icon: "🧣" },
  { id: "pond", title: "בריכת ברווזים", price: 320, icon: "🪷" },
  { id: "bunting", title: "דגלוני מסיבה לאסם", price: 420, icon: "🎊" },
] as const;
export type PrizeId = (typeof prizes)[number]["id"];
export function wordById(id: string): Word | undefined {
  return words.find((word) => word.id === id);
}
