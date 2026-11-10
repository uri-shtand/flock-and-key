// Physical rows run left to right, even inside an RTL page.
const letters = ["/'קראטוןםפ", "שדגכעיחלךף", "זסבהנמצתץ."];
const codes = [
  [
    "KeyQ",
    "KeyW",
    "KeyE",
    "KeyR",
    "KeyT",
    "KeyY",
    "KeyU",
    "KeyI",
    "KeyO",
    "KeyP",
  ],
  [
    "KeyA",
    "KeyS",
    "KeyD",
    "KeyF",
    "KeyG",
    "KeyH",
    "KeyJ",
    "KeyK",
    "KeyL",
    "Semicolon",
  ],
  [
    "KeyZ",
    "KeyX",
    "KeyC",
    "KeyV",
    "KeyB",
    "KeyN",
    "KeyM",
    "Comma",
    "Period",
    "Slash",
  ],
];
const fingers = [
  "זרת שמאל",
  "קמיצה שמאל",
  "אמה שמאל",
  "אצבע שמאל",
  "אצבע שמאל",
  "אצבע ימין",
  "אצבע ימין",
  "אמה ימין",
  "קמיצה ימין",
  "זרת ימין",
];
export const keyboardRows = letters.map((row, r) =>
  [...row].map((letter, c) => ({
    letter,
    code: codes[r][c],
    finger: fingers[c],
  })),
);
export const keyboardKeys = keyboardRows.flat();
export function keyFor(letter: string) {
  return keyboardKeys.find((key) => key.letter === letter);
}
