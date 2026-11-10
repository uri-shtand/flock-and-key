import { useId } from "react";

type HandSide = "left" | "right";
type Finger = "little" | "ring" | "middle" | "index" | "thumb";
export type FingerId = `${HandSide}-${Finger}`;
const fingerNames: Record<Finger, string> = {
  little: "זרת",
  ring: "קמיצה",
  middle: "אמה",
  index: "אצבע",
  thumb: "אגודל",
};

// One continuous silhouette avoids disconnected, pill-shaped fingers. Optional
// highlight regions are clipped to it and never draw seams across the hand.
const silhouette =
  "M54 230C54 212 47 200 39 185C30 169 27 151 24 135L17 91C15 81 18 75 24 74C31 73 35 78 37 87L44 118L38 60C37 49 41 42 48 42C56 42 60 48 60 58L65 107L65 40C65 29 70 23 77 23C85 23 90 30 90 40L91 105L97 52C99 42 104 38 111 39C119 40 122 47 120 58L113 137C113 143 114 146 118 147C121 148 125 145 128 141L141 122C147 114 154 112 160 116C168 121 169 129 163 138L139 174C130 188 119 199 115 211L113 230Z";
const regions: { name: Finger; path: string }[] = [
  { name: "little", path: "M11 68H37L49 139L28 151Z" },
  { name: "ring", path: "M32 36H63L72 132L49 138Z" },
  { name: "middle", path: "M63 16H94L97 131H72Z" },
  { name: "index", path: "M96 32H128L117 147L96 132Z" },
  { name: "thumb", path: "M133 112L174 110L167 148L136 185L115 172L120 146Z" },
];

export function HandGuide({ activeFinger }: { activeFinger?: FingerId }) {
  const headingId = useId(),
    shapeId = useId(),
    clipId = useId(),
    skinId = useId();
  return (
    <aside className="hand-guide" aria-labelledby={headingId}>
      <span className="eyebrow">עזרת הקלדה</span>
      <h2 id={headingId}>הידיים שלנו</h2>
      <svg
        className="hands-illustration"
        viewBox="0 0 420 255"
        role="img"
        aria-label="איור יד שמאל ויד ימין, עם חמש אצבעות בכל יד, במבט מלמעלה"
      >
        <defs>
          <path id={shapeId} d={silhouette} />
          <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
            <use href={`#${shapeId}`} />
          </clipPath>
          <linearGradient id={skinId} x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#f9dcc0" />
            <stop offset=".55" stopColor="#edbd98" />
            <stop offset="1" stopColor="#dda783" />
          </linearGradient>
        </defs>
        {(["left", "right"] as const).map((side) => {
          const handName = side === "left" ? "יד שמאל" : "יד ימין";
          return (
            <g
              key={side}
              transform={
                side === "left"
                  ? "translate(18 0)"
                  : "translate(402 0) scale(-1 1)"
              }
            >
              <use
                href={`#${shapeId}`}
                transform="translate(0 4)"
                fill="#24364c"
                opacity=".08"
              />
              <use href={`#${shapeId}`} fill={`url(#${skinId})`} />
              <g clipPath={`url(#${clipId})`}>
                <path
                  d="M20 140Q43 182 65 197Q86 214 112 199L122 236H44Z"
                  fill="#ba795b"
                  opacity=".1"
                />
                {regions.map((finger) => {
                  const id: FingerId = `${side}-${finger.name}`;
                  return (
                    <g
                      key={id}
                      data-finger={id}
                      className={`hand-finger${activeFinger === id ? " is-highlighted" : ""}`}
                    >
                      <title>
                        {fingerNames[finger.name]} · {handName}
                      </title>
                      <path className="finger-highlight" d={finger.path} />
                    </g>
                  );
                })}
              </g>
              <g fill="#ffead6" stroke="#d3a489" strokeWidth="1.1">
                <path d="M22 87Q21 81 25 81Q30 80 31 87L33 97Q28 101 24 98Z" />
                <path d="M44 56Q44 49 49 49Q54 49 54 56L55 69Q50 72 45 69Z" />
                <path d="M71 38Q71 31 77 31Q83 31 83 38V52Q77 55 71 52Z" />
                <path d="M103 54Q104 47 110 47Q115 48 114 55L112 68Q106 70 101 66Z" />
                <path d="M146 124Q150 119 154 122Q159 125 155 130L149 137Q144 136 141 132Z" />
              </g>
              <g className="hand-tendons">
                <path d="M46 148Q53 170 65 186M74 143Q76 167 82 185M102 148Q94 170 96 187" />
                <path d="M120 160Q112 166 108 176" />
              </g>
              <use
                href={`#${shapeId}`}
                fill="none"
                stroke="#967664"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <path
                d="M52 221Q81 226 115 221L117 244Q83 251 50 244Z"
                fill={side === "left" ? "#68b6ad" : "#729abb"}
                stroke="#426b7e"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <path
                d="M57 228Q83 232 109 228"
                fill="none"
                stroke="#ffffff66"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </g>
          );
        })}
      </svg>
      <div className="hand-labels" dir="ltr">
        <span dir="rtl">יד שמאל</span>
        <span dir="rtl">יד ימין</span>
      </div>
      <p>כך נראות הידיים כשמניחים אותן מעל המקלדת.</p>
    </aside>
  );
}
