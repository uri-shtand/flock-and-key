import { useId } from "react";
import { CharacterPortrait } from "./DialoguePanel";

export function DadCratePrompt({ word }: { word: string }) {
  return (
    <section className="crate-prompt" aria-label="אבא מציג את המילה">
      <div className="dialogue-turn character-dad">
        <div className="character-portrait">
          <CharacterPortrait character="dad" />
        </div>
        <div className="speech-bubble">
          <b className="character-name">אבא</b>
          <p>על הארגז הזה נכתוב:</p>
          <strong className="crate-prompt-word" data-testid="target-word">
            {word}
          </strong>
        </div>
      </div>
    </section>
  );
}

// Only the illustration is SVG. The editable lettering is the existing HTML
// input laid over the front, retaining focus, composition and correction support.
export function CrateBackdrop() {
  const woodId = useId();
  return (
    <svg
      className="crate-art"
      viewBox="0 0 600 290"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={woodId} x2="0" y2="1">
          <stop stopColor="#f1c589" />
          <stop offset="1" stopColor="#daa05e" />
        </linearGradient>
      </defs>
      <ellipse
        cx="305"
        cy="270"
        rx="265"
        ry="14"
        fill="#533e2c"
        opacity=".14"
      />
      <path
        d="M30 57L91 18H576L520 57Z"
        fill="#f5d8a5"
        stroke="#704c32"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M520 57L576 18V219L520 261Z"
        fill="#bc824d"
        stroke="#704c32"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M30 57H520V261H30Z"
        fill={`url(#${woodId})`}
        stroke="#704c32"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <g fill="none" stroke="#ac753f" strokeWidth="2" opacity=".65">
        <path d="M31 107H519M31 159H519M31 211H519M521 107L575 68M521 159L575 120M521 211L575 171" />
        <path
          d="M63 86Q147 76 211 85M323 85Q393 94 466 82M66 185Q122 176 166 185M340 235Q408 225 476 236M115 37H514"
          opacity=".4"
        />
      </g>
      <g fill="#e7b476" stroke="#956439" strokeWidth="2">
        <path d="M40 63H65V255H40Z" />
        <path d="M485 63H510V255H485Z" />
      </g>
      <g fill="#815c3f">
        <circle cx="52" cy="76" r="3" />
        <circle cx="52" cy="242" r="3" />
        <circle cx="497" cy="76" r="3" />
        <circle cx="497" cy="242" r="3" />
      </g>
      <path d="M71 64H477" stroke="#fff0d0" strokeWidth="3" opacity=".5" />
    </svg>
  );
}
