import lyrics from "./rehearsalLyrics.json";

export type SongId = keyof typeof lyrics;
export const songGroups = [
  { id: "series", label: "שירי הסדרה" },
  { id: "farm", label: "שירי החווה" },
] as const;
export type SongGroup = typeof songGroups[number]["id"] | "station";
export type SceneAction = "boots" | "hat" | "hats" | "sock" | "drum" | "bell" | "pitsi-chases" | "noga-chases" | "duck-chases" | "drum-beside" | "drum-behind" | "drum-front";
export type QuestionKind = "word" | "listening" | "reading" | "grammar" | "recall";
type Question = {
  part: number;
  kind: QuestionKind;
  prompt: string;
  stimulus?: string;
  solution: string;
  options?: readonly string[];
  alternatives?: readonly string[];
  hint: string;
  explanation: string;
};
type Variation = { choice: string; sentence: string; caption: string; action: SceneAction };
type Song = {
  id: SongId;
  group: SongGroup;
  audio: string;
  title: string;
  subtitle: string;
  accent: string;
  questions: readonly Question[];
  glossary: Partial<Record<number, readonly [string, string][]>>;
  variations: readonly Variation[];
};

export const questionLabels: Record<QuestionKind, string> = {
  word: "משמעות בהקשר",
  listening: "הבנת הנשמע",
  reading: "הבנת הנקרא",
  grammar: "דקדוק",
  recall: "שליפת מילה",
};

type LyricLine = { start: number; english: string; hebrew: string; needsReview?: boolean };
type SongLyrics = { start: number; end: number; parts: readonly { start: number; end: number; lines: readonly LyricLine[] }[] };

export const songAudio = (id: SongId) => `${import.meta.env.BASE_URL}audio/rehearsals/${songFor(id).audio}`;
export const songLyrics = (id: SongId): SongLyrics => lyrics[id];

const barnVariations = {
  boots: [
    { choice: "מגפיים", sentence: "The boots are playing the drum.", caption: "אבא ביקש סולו. המגפיים ביקשו במה משלהם.", action: "boots" },
    { choice: "כובע אחד", sentence: "The duck is wearing one hat.", caption: "כובע אחד וקידה אחת. ברווז מקצוען.", action: "hat" },
    { choice: "שלושה כובעים", sentence: "The duck is wearing three hats.", caption: "הכובע העליון ביקש כיסא משלו.", action: "hats" },
  ],
  sock: [
    { choice: "גרב", sentence: "The duck finds a sock under the table.", caption: "הגרב ביקשה להעיד אחרי הכביסה.", action: "sock" },
    { choice: "תוף", sentence: "The duck finds a drum under the table.", caption: "פיצי ביקש מהעדות להפסיק לתופף.", action: "drum" },
    { choice: "פעמון", sentence: "The duck finds a bell under the table.", caption: "הפעמון מצלצל. נוגה מכריזה שהדיון ננעל.", action: "bell" },
  ],
  cheer: [
    { choice: "פיצי רודף", sentence: "Pitsi is chasing Noga.", caption: "פיצי יצא למרדף, ומקל הניצוח כבר בפיו.", action: "pitsi-chases" },
    { choice: "נוגה רודפת", sentence: "Noga is chasing Pitsi.", caption: "נוגה מחזירה לעצמה את מקל הניצוח. פיצי דורש הפסקת מים.", action: "noga-chases" },
    { choice: "הברווז רודף", sentence: "The duck is chasing Pitsi.", caption: "פיצי מופתע לגלות שברווז יכול לרוץ עם כובע.", action: "duck-chases" },
  ],
} satisfies Record<string, readonly Variation[]>;

export const songs: readonly Song[] = [
  {
    id: "soundcheck", group: "station", audio: "station-soundcheck.wav", title: "The Suitcase Soundcheck", subtitle: "בדיקת קול עם מזוודה וקידה", accent: "#e5af63",
    glossary: { 0: [["beside", "ליד"], ["suitcase", "מזוודה"]], 1: [["behind", "מאחורי"], ["in front", "מלפנים"]], 2: [["can", "יכול"], ["take a bow", "לקוד קידה"]] },
    questions: [
      { part: 0, kind: "listening", prompt: "איזה כלי מבקשים להזיז?", solution: "תוף", options: ["תוף", "פעמון", "גיטרה"], hint: "הקשיבו למילה שאחרי Put the.", explanation: "drum פירושו תוף." },
      { part: 0, kind: "word", prompt: "מה לעשות עם התוף?", stimulus: "Put the drum beside the suitcase.", solution: "לשים אותו ליד המזוודה", options: ["לשים אותו ליד המזוודה", "לשים אותו בתוך המזוודה", "לשים אותו על הכיסא"], hint: "beside מתאר שני דברים שנמצאים זה לצד זה.", explanation: "beside פירושו ליד." },
      { part: 1, kind: "reading", prompt: "איפה התוף נמצא עכשיו?", stimulus: "Now the drum is behind the suitcase.", solution: "מאחורי המזוודה", options: ["לפני המזוודה", "מאחורי המזוודה", "בתוך המזוודה"], hint: "חפשו את המילה שמגיעה לפני the suitcase.", explanation: "behind פירושו מאחורי." },
      { part: 1, kind: "listening", prompt: "מה נמצא ממש מלפנים?", solution: "הפעמון", options: ["התוף", "המזוודה", "הפעמון"], hint: "הקשיבו לשורה השנייה בקטע.", explanation: "The bell is right in front." },
      { part: 2, kind: "grammar", prompt: "מה אבא יכול לעשות?", stimulus: "Dad can play the suitcase.", solution: "לנגן על המזוודה", options: ["לסגור את המזוודה", "לנגן על המזוודה", "לקוד קידה"], hint: "חפשו את הפעולה אחרי can.", explanation: "can מציין יכולת. אבא יכול לנגן על המזוודה." },
      { part: 2, kind: "recall", prompt: "איך כותבים באנגלית ״מזוודה״?", solution: "suitcase", alternatives: ["a suitcase"], hint: "המילה מתחילה ב־suit.", explanation: "מזוודה באנגלית היא suitcase." },
    ],
    variations: [
      { choice: "ליד", sentence: "Put the drum beside the suitcase.", caption: "התוף ליד המזוודה. פיצי מבקש מקום ליד שניהם.", action: "drum-beside" },
      { choice: "מאחורי", sentence: "Put the drum behind the suitcase.", caption: "התוף הציץ מאחורי המזוודה. אבא טוען שזה היה הרעיון שלו.", action: "drum-behind" },
      { choice: "מלפני", sentence: "Put the drum in front of the suitcase.", caption: "התוף תפס את מרכז הבמה. המזוודה תבקש הדרן.", action: "drum-front" },
    ],
  },
  {
    id: "rhythm", group: "series", audio: "rhythm.mp3", title: "Ain’t Got Rhythm", subtitle: "אבא והלהקה של המגפיים", accent: "#f4bf6c",
    glossary: {
      0: [["stamp", "חותמת"], ["to spare", "יותר ממספיק"]],
      3: [["besides", "חוץ מזה"], ["rhythm", "קצב"]],
      5: [["tedious", "מייגע"], ["keep time", "לשמור על הקצב"]],
      6: [["power chord", "אקורד אופייני לרוק"], ["rock star", "כוכב רוק"]],
    },
    questions: [
      { part: 0, kind: "listening", prompt: "אילו שני חפצים שומעים שמזכירים?", solution: "חותמת וספר", options: ["תוף ושער", "חותמת וספר", "כיסא וכובע"], hint: "הקשיבו למילים שאחרי with that.", explanation: "מזכירים חותמת וספר. הדמות שומעת קצב במה שהספרן עושה איתם." },
      { part: 0, kind: "word", prompt: "מה המשמעות של to spare כאן?", stimulus: "rhythm to spare", solution: "יש הרבה יותר ממספיק קצב", options: ["אין בכלל קצב", "יש קצב שאבד", "יש הרבה יותר ממספיק קצב"], hint: "הדמות מנסה לשכנע את הספרן שהוא דווקא טוב בקצב.", explanation: "to spare פירושו שיש עודף או יותר ממה שנחוץ." },
      { part: 3, kind: "grammar", prompt: "איזה משפט תקני מבטא את אותה משמעות כמו הכותרת?", solution: "I don't have rhythm.", options: ["I don't have rhythm.", "I have rhythm.", "I had rhythm yesterday."], hint: "בכותרת הדמות שוללת שיש לה חוש קצב.", explanation: "ain’t got הוא ניסוח לא רשמי. כאן הוא מבטא I don’t have." },
      { part: 3, kind: "reading", prompt: "מה הדמות חוזרת ואומרת על עצמה בפזמון?", solution: "שאין לה חוש קצב", options: ["שהיא רוצה לנגן בגיטרה", "שאין לה חוש קצב", "שהיא הגיעה מאוחר"], hint: "הביטוי שבכותרת חוזר בשיר.", explanation: "הספרן מתעקש שאין לו חוש קצב. שאר הדמויות שומעות משהו אחר." },
      { part: 6, kind: "reading", prompt: "מה הספרן אומר שהוא לא צריך להיות?", solution: "כוכב רוק", options: ["ספרן", "שוטר", "כוכב רוק"], hint: "הקשיבו לסוף הקטע, או פתחו את העמוד המתאים בחוברת.", explanation: "כוכב רוק הוא rock star. הספרן בוחר את השגרה שלו." },
      { part: 6, kind: "recall", prompt: "איך כותבים באנגלית את המילה ״גיטרה״?", solution: "guitar", alternatives: ["a guitar"], hint: "המילה מתחילה ב־g. אפשר להקשיב שוב.", explanation: "את המילה גיטרה כותבים guitar." },
    ],
    variations: barnVariations.boots,
  },
  {
    id: "busted", group: "series", audio: "busted.mp3", title: "Busted", subtitle: "פיצי חוקר גרב מסתורית", accent: "#8dd7ca",
    glossary: {
      0: [["naive", "תמים או תמימה"], ["get the goods on someone", "להשיג ראיות נגד מישהו"]],
      2: [["drop a dime on someone", "לחשוף את מה שמישהו עשה"], ["gonna", "הגייה לא רשמית של going to"]],
      3: [["busted", "נתפס במעשה"], ["get the dirt on someone", "למצוא עליו מידע מפליל"]],
      6: [["six-letter word", "מילה בת שש אותיות"], ["set me free", "לשחרר אותי"]],
    },
    questions: [
      { part: 0, kind: "word", prompt: "מה פירוש naive בהקשר הזה?", stimulus: "you think that I'm naive", solution: "תמימה", options: ["תמימה", "ממהרת", "חשודה"], hint: "האחרים חושבים שקל להטעות אותה.", explanation: "naive פירושו תמים או חסר ניסיון." },
      { part: 0, kind: "listening", prompt: "מה הזמרת אומרת שיקרה כשהיא תשיג הוכחות?", solution: "סוף סוף יאמינו לה", options: ["כולם ילכו הביתה", "מישהו יתחיל לשיר", "סוף סוף יאמינו לה"], hint: "הקשיבו למילה believe בסוף הקטע.", explanation: "הזמרת מאמינה שהראיות יעזרו לה לשכנע." },
      { part: 3, kind: "reading", prompt: "איזו ראיה מהקטע מסבירה את ההכרזה ״נתפסתם״?", solution: "הזמרת אומרת שמצאה מידע מפליל", options: ["מישהו נכנס לבמה", "הזמרת אומרת שמצאה מידע מפליל", "הזמרת רוצה לשמור סוד"], hint: "חפשו בחוברת את הביטוי got the dirt on you.", explanation: "המידע המפליל הוא הסיבה שהיא טוענת שהם נתפסו." },
      { part: 3, kind: "grammar", prompt: "איזה משפט מתאר מה הדמות מתכוונת לעשות בעתיד?", solution: "She is going to tell someone.", options: ["She told someone yesterday.", "She tells someone every day.", "She is going to tell someone."], hint: "חפשו את going to.", explanation: "is going to מציין כאן כוונה. המשפטים האחרים מתארים עבר או הרגל." },
      { part: 6, kind: "listening", prompt: "כמה אותיות יש במילה שמאייתים בקטע?", solution: "שש", options: ["חמש", "שש", "שבע"], hint: "שומעים את המספר לפני letter word.", explanation: "six-letter word היא מילה בת שש אותיות." },
      { part: 6, kind: "recall", prompt: "כתבו את המילה שמאייתים בקטע.", solution: "busted", hint: "המילה מתחילה ב־b. האזינו לאותיות לפי הסדר.", explanation: "כותבים busted. בהקשר של השיר פירושו שנתפסתם במעשה." },
    ],
    variations: barnVariations.sock,
  },
  {
    id: "gitchee", group: "series", audio: "gitchee.mp3", title: "Gitchee Gitchee Goo", subtitle: "נוגה ממציאה קריאת עידוד", accent: "#f1a99e",
    glossary: {
      0: [["means", "פירושו"], ["heart starts pumping", "הלב מתחיל לפעום"]],
      1: [["vocabulary", "אוצר מילים"], ["incomplete", "לא שלם"]],
      2: [["confusing", "מבלבל"], ["translate", "לתרגם"]],
      5: [["dictionary", "מילון"], ["too", "גם"]],
    },
    questions: [
      { part: 0, kind: "listening", prompt: "מה אומרות ההברות שבשם השיר?", solution: "אני אוהב אותך", options: ["אני מחפש אותך", "אני אוהב אותך", "אני ממהר הביתה"], hint: "הקשיבו למה שמגיע אחרי means that.", explanation: "הדמויות נותנות להברות המומצאות משמעות. כאן הכוונה היא ״אני אוהב אותך״." },
      { part: 0, kind: "word", prompt: "מה פירוש המילה means?", stimulus: "means that", solution: "פירושו ש־", options: ["פירושו ש־", "מבקש ש־", "שוכח ש־"], hint: "המילה מחברת את ההברות להסבר שלהן.", explanation: "means מציגה את המשמעות של ביטוי." },
      { part: 2, kind: "reading", prompt: "מה עוזר לדמות להבין את הדברים המבלבלים?", solution: "לקחת זמן לתרגם", options: ["לדבר מהר", "להחליף שיר", "לקחת זמן לתרגם"], hint: "חפשו את translate בסוף הקטע.", explanation: "הדמות מקדישה זמן לתרגום. זה נותן לה דרך להבין." },
      { part: 2, kind: "grammar", prompt: "מה מציין may במשפט על משהו שנשמע מבלבל?", stimulus: "may sound confusing", solution: "אפשרות", options: ["חובה", "אפשרות", "פעולה שכבר קרתה"], hint: "עשוי להישמע מבלבל. אפשר שהמאזין יבין בכל זאת.", explanation: "may מציין אפשרות." },
      { part: 5, kind: "word", prompt: "מה מוסיפה המילה too כשהדמות עונה?", solution: "גם", options: ["מחר", "אולי", "גם"], hint: "הדמות מביעה רגש בתגובה לרגש שכבר נאמר.", explanation: "כאן too פירושו גם." },
      { part: 5, kind: "recall", prompt: "איך כותבים באנגלית ״מילון״?", solution: "dictionary", alternatives: ["a dictionary"], hint: "המילה מתחילה ב־d. אפשר להאזין לסוף הקטע.", explanation: "מילון באנגלית הוא dictionary." },
    ],
    variations: barnVariations.cheer,
  },
  {
    id: "boots", group: "farm", audio: "boots.wav", title: "The Tap-Dancing Boots", subtitle: "אבא והלהקה של המגפיים", accent: "#f4bf6c",
    glossary: {
      0: [["boots", "מגפיים"], ["across", "לרוחב, מצד לצד"]],
      1: [["usually", "בדרך כלל"], ["one by one", "אחד אחרי השני"]],
      2: [["hat", "כובע"], ["bows", "קד קידה"]],
    },
    questions: [
      { part: 0, kind: "listening", prompt: "מה מקיש על הרצפה?", solution: "המגפיים", options: ["התוף", "המגפיים", "השער"], hint: "הקשיבו למילה שבאה לפני go tap.", explanation: "המגפיים עושים את ההקשות על הרצפה." },
      { part: 0, kind: "word", prompt: "מה המשמעות של across במשפט?", stimulus: "My boots go tap across the floor.", solution: "מצד אחד של הרצפה לצד השני", options: ["מתחת לרצפה", "ליד הרצפה", "מצד אחד של הרצפה לצד השני"], hint: "דמיינו שהמגפיים עוברים מצד אחד לצד האחר.", explanation: "כאן across מתאר תנועה לרוחב הרצפה." },
      { part: 1, kind: "grammar", prompt: "איזו שורה מתארת מה שקורה עכשיו?", solution: "My boots are playing.", options: ["I usually play a little drum.", "My boots are playing.", "I played a little drum yesterday."], hint: "בשיר שומעים now, עכשיו.", explanation: "are playing מציין פעולה שמתרחשת עכשיו." },
      { part: 1, kind: "reading", prompt: "מה המספר מנגן בדרך כלל?", stimulus: "I usually play a little drum. But now my boots are playing one by one.", solution: "תוף קטן", options: ["מגפיים", "תוף קטן", "פעמון"], hint: "חפשו את מה שמופיע אחרי usually play.", explanation: "usually מתאר שגרה. בחזרה המגפיים קיבלו את הסולו." },
      { part: 2, kind: "word", prompt: "מה עושה הברווז כשהוא bows?", stimulus: "It bows and says, “I practiced that!”", solution: "קד קידה", options: ["מסתתר", "מוחא כפיים", "קד קידה"], hint: "שחקנים עושים את זה מול הקהל בסוף ההופעה.", explanation: "to bow פירושו לקוד קידה." },
      { part: 2, kind: "recall", prompt: "איך כותבים באנגלית את המילה ״כובע״?", solution: "hat", alternatives: ["a hat"], hint: "יש שלוש אותיות והמילה מתחילה ב־h.", explanation: "הברווז חובש כובע. באנגלית כותבים hat." },
    ],
    variations: barnVariations.boots,
  },
  {
    id: "sock", group: "farm", audio: "sock.wav", title: "The Case of the Singing Sock", subtitle: "פיצי חוקר גרב מסתורית", accent: "#8dd7ca",
    glossary: {
      0: [["map", "מפה"], ["was late", "איחר"]],
      1: [["sock", "גרב"], ["beside", "ליד"]],
      2: [["look inside", "להסתכל בפנים"], ["bell", "פעמון"]],
    },
    questions: [
      { part: 0, kind: "word", prompt: "מה פירוש was late?", stimulus: "Pitsi read the map, but he was late.", solution: "איחר", options: ["איחר", "הגיע מוקדם", "הלך לאיבוד"], hint: "פיצי היה אמור להגיע בשעה מסוימת.", explanation: "was late פירושו איחר או הגיע אחרי הזמן." },
      { part: 0, kind: "listening", prompt: "איפה חיכה המכתב?", solution: "ליד השער", options: ["בתוך האסם", "ליד התוף", "ליד השער"], hint: "הקשיבו למילה שבאה אחרי by the.", explanation: "by the gate פירושו ליד השער." },
      { part: 1, kind: "reading", prompt: "איזו שורה מסבירה איפה נמצאה הגרב?", solution: "He found a sock beside the drum.", options: ["A letter waited by the gate.", "He found a sock beside the drum.", "Where did that come from?"], hint: "beside פירושו ליד.", explanation: "המשפט מציין את הגרב ואת מקום המציאה, ליד התוף." },
      { part: 1, kind: "grammar", prompt: "איך שואלים באנגלית איפה פיצי מצא את הגרב?", solution: "Where did Pitsi find the sock?", options: ["Where does Pitsi find the sock?", "Where did Pitsi found the sock?", "Where did Pitsi find the sock?"], hint: "השאלה על העבר. אחרי did משתמשים בצורה הבסיסית של הפועל.", explanation: "did כבר מציין עבר, ולכן אומרים find." },
      { part: 2, kind: "grammar", prompt: "מה הברווז מתכנן לעשות?", stimulus: "The duck is going to look inside.", solution: "להסתכל בפנים", options: ["להסתכל בחוץ", "להסתכל בפנים", "לחפש שער"], hint: "is going to כאן פותח משפט על תוכנית.", explanation: "look inside פירושו להסתכל בפנים." },
      { part: 2, kind: "recall", prompt: "איך כותבים באנגלית את המילה ״פעמון״?", solution: "bell", alternatives: ["a bell"], hint: "המילה מתחילה ב־b ומסתיימת בשתי אותיות l.", explanation: "bell הוא הפעמון הזעיר שהתחבא." },
    ],
    variations: barnVariations.sock,
  },
  {
    id: "cheer", group: "farm", audio: "cheer.wav", title: "Bim-Ba-Bo at the Barn", subtitle: "נוגה ממציאה קריאת עידוד", accent: "#f1a99e",
    glossary: {
      0: [["cheer", "קריאת עידוד"], ["steal the show", "להיות מסמר המופע"]],
      1: [["share", "להשתמש במשהו יחד"], ["stage", "במה"]],
      2: [["clap", "למחוא כפיים"], ["wing", "כנף"]],
    },
    questions: [
      { part: 0, kind: "listening", prompt: "מה הלהקה צריכה למופע?", solution: "קריאת עידוד", options: ["מפה", "קריאת עידוד", "מעיל"], hint: "הקשיבו למה שאומרים אחרי We need.", explanation: "a cheer היא קריאה שנועדה לעודד." },
      { part: 0, kind: "word", prompt: "מה עושה הקריאה Bim-ba-bo בשיר?", stimulus: "We need a cheer for our new show.", solution: "מעודדת את הלהקה", options: ["מעודדת את הלהקה", "מציינת את השעה", "מורה להפסיק לנגן"], hint: "זו קריאה מומצאת. המשפט הקודם מספר למה היא נועדה.", explanation: "לקריאה אין תרגום מילולי. כאן היא נועדה לעודד את הלהקה." },
      { part: 1, kind: "reading", prompt: "מי רץ ומי שרה?", stimulus: "Noga sings and Pitsi runs.", solution: "פיצי רץ ונוגה שרה", options: ["פיצי שר ונוגה רצה", "שניהם רצים", "פיצי רץ ונוגה שרה"], hint: "התאימו כל שם לפועל שבא אחריו.", explanation: "sings זה שרה ו־runs זה רץ." },
      { part: 1, kind: "word", prompt: "מה פירוש They share the stage?", stimulus: "They share the stage.", solution: "הם משתמשים באותה במה יחד", options: ["הם משתמשים באותה במה יחד", "הם בונים במה", "הם מסתירים במה"], hint: "share כאן מתאר דבר ששייך לשניהם בזמן המופע.", explanation: "כאן share פירושו להשתמש במשהו יחד." },
      { part: 2, kind: "grammar", prompt: "מה הברווז יכול לעשות?", stimulus: "The duck can clap but cannot sing.", solution: "למחוא כפיים", options: ["לשיר", "למחוא כפיים", "לשיר ולמחוא כפיים"], hint: "can זה יכול. cannot זה לא יכול.", explanation: "הברווז יכול למחוא כפיים. הוא ייתן לנוגה לשיר." },
      { part: 2, kind: "recall", prompt: "איך כותבים באנגלית את הפועל ״לשיר״?", solution: "sing", alternatives: ["to sing"], hint: "המילה מתחילה ב־s ומסתיימת ב־ng.", explanation: "לשיר באנגלית זה sing." },
    ],
    variations: barnVariations.cheer,
  },
];

export function songFor(id: SongId) {
  return songs.find((song) => song.id === id)!;
}
