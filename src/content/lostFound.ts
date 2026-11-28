export const lostCases = [
  { person: "מיה", item: "צעיף", shape: "scarf", request: "My scarf is striped.", correct: "left", need: "לפינת הקריאה קר היום.", outcome: "מיה כורכת את הצעיף ומתיישבת לקרוא." },
  { person: "יואב", item: "תיק", shape: "backpack", request: "My bag is striped.", correct: "right", need: "הספר שלי מחכה בתוך התיק.", outcome: "יואב פותח את התיק ומוציא את הספר." },
  { person: "נטע", item: "תיק בד", shape: "tote", request: "My cloth bag is striped.", correct: "right", need: "אני פותחת שולחן ליד בית הקפה.", outcome: "נטע פורשת מפה משובצת. פיצי קיווה שיש בתיק חטיפים." },
] as const;
