import type { CharacterId, DialogueLine } from "../content/chapter";
const names: Record<CharacterId, string> = {
  dad: "אבא",
  tom: "תום",
  postman: "הדוור",
  narrator: "בינתיים בחווה",
};

// Original vector portraits: UI illustrations, no learning state or external assets.
export function CharacterPortrait({
  character,
}: {
  character: Exclude<CharacterId, "narrator">;
}) {
  const dad = character === "dad",
    postman = character === "postman";
  return (
    <svg viewBox="0 0 88 96" aria-hidden="true" focusable="false">
      <path
        d="M9 96V82Q10 66 34 64H54Q78 66 79 82V96"
        fill={dad ? "#369c91" : postman ? "#4b75bf" : "#e87450"}
        stroke="#24334b"
        strokeWidth="3"
      />
      <path
        d="M35 58V70Q44 79 53 70V58"
        fill="#df9c6b"
        stroke="#24334b"
        strokeWidth="2.5"
      />
      <ellipse
        cx="18"
        cy="40"
        rx="6"
        ry="9"
        fill="#efba87"
        stroke="#24334b"
        strokeWidth="2.5"
      />
      <ellipse
        cx="70"
        cy="40"
        rx="6"
        ry="9"
        fill="#efba87"
        stroke="#24334b"
        strokeWidth="2.5"
      />
      <path
        d="M19 27Q20 8 44 9Q69 9 69 29V46Q67 67 44 69Q21 66 19 46Z"
        fill="#f4c796"
        stroke="#24334b"
        strokeWidth="3"
      />
      {!dad && !postman && (
        <path
          d="M18 34L16 16L29 18L30 6L44 13L57 4L62 16L74 16L69 37L60 25L42 28L30 22Z"
          fill="#61423b"
          stroke="#24334b"
          strokeWidth="3"
          strokeLinejoin="round"
        />
      )}
      {dad && (
        <>
          <path d="M20 33V22Q44 8 68 22V33L61 26L27 27Z" fill="#5e453a" />
          <path
            d="M8 22Q44 13 80 22L77 29H11Z"
            fill="#e6b55f"
            stroke="#24334b"
            strokeWidth="3"
          />
          <path
            d="M23 19L28 3H59L65 19"
            fill="#e6b55f"
            stroke="#24334b"
            strokeWidth="3"
          />
        </>
      )}
      {postman && (
        <>
          <path
            d="M16 25Q18 4 44 4Q71 4 73 25Z"
            fill="#557ac1"
            stroke="#24334b"
            strokeWidth="3"
          />
          <path
            d="M16 25H74L64 33H23Z"
            fill="#304b79"
            stroke="#24334b"
            strokeWidth="3"
          />
          <rect x="37" y="12" width="15" height="9" rx="2" fill="#ffd46c" />
        </>
      )}
      <path
        d="M28 37L36 36M53 36L61 37"
        stroke="#61423b"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <ellipse cx="32" cy="43" rx="2.7" ry="3.5" fill="#24334b" />
      <ellipse cx="57" cy="43" rx="2.7" ry="3.5" fill="#24334b" />
      <path
        d="M44 43L41 51H46"
        fill="none"
        stroke="#c18360"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {dad ? (
        <path
          d="M44 52Q35 47 29 56Q38 61 44 56Q51 61 60 56Q54 47 44 52"
          fill="#67473d"
        />
      ) : (
        <path
          d="M35 56Q44 63 54 55"
          fill="none"
          stroke="#673e3b"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      )}
      {postman && (
        <path
          d="M26 39H38V48H26ZM50 39H62V48H50ZM38 42H50"
          fill="none"
          stroke="#24334b"
          strokeWidth="2"
        />
      )}
      {!dad && !postman && (
        <path d="M29 72L39 83L44 75L50 83L59 72" fill="#fff2d5" />
      )}
      {dad && <path d="M26 73V96M62 73V96" stroke="#f3c966" strokeWidth="5" />}
    </svg>
  );
}
export function DialoguePanel({ lines }: { lines: DialogueLine[] }) {
  return (
    <ol className="dialogue-thread" aria-label="שיחת הדמויות">
      {lines.map((line, index) =>
        line.speaker === "narrator" ? (
          <li className="narration" key={index}>
            <span aria-hidden="true">✦</span>
            <p>{line.text}</p>
          </li>
        ) : (
          <li className={`dialogue-turn character-${line.speaker}`} key={index}>
            <div className="character-portrait">
              <CharacterPortrait character={line.speaker} />
            </div>
            <div className="speech-bubble">
              <b className="character-name">{names[line.speaker]}</b>
              <p>{line.text}</p>
            </div>
          </li>
        ),
      )}
    </ol>
  );
}
