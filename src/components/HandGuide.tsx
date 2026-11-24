import { keyboardRows } from "../typing/KeyboardMap";

function keyCenter(row: number, column: number) {
  return { x: 29 + row * 10 + column * 40, y: 23 + row * 35 };
}

const keyFaces = keyboardRows.flatMap((row, rowIndex) =>
  row.map((key, column) => ({ ...key, ...keyCenter(rowIndex, column) })),
);

// One model per hand. The right hand mirrors the left around the space bar.
const mirrorX = 438;
const fingers = [
  { home: 39, knuckle: 57, jointY: 93, width: 16 },
  { home: 79, knuckle: 82, jointY: 88, width: 18 },
  { home: 119, knuckle: 109, jointY: 87, width: 19 },
  { home: 159, knuckle: 136, jointY: 93, width: 19 },
];

function TypingHand({
  right,
  target,
}: {
  right: boolean;
  target?: (typeof keyFaces)[number];
}) {
  // The index fingers each cover two columns, including the keys between F and J.
  const columns = right ? [9, 8, 7, 6, 5] : [0, 1, 2, 3, 4];
  return (
    <g transform={right ? `translate(${mirrorX} 0) scale(-1 1)` : undefined}>
      <path
        d="M63 159C62 144 52 133 50 115C49 105 53 98 59 92C78 77 121 77 137 91C146 100 147 112 147 125C151 129 158 126 167 119C176 111 186 112 189 118C193 126 184 135 174 141C160 150 145 160 138 173L63 173Z"
        fill="#edbd98"
        stroke="#93664e"
        strokeWidth="2"
      />
      {fingers.map(({ home, knuckle, jointY, width }, index) => {
        const active = target && (
          target.fingerIndex === columns[index] ||
          (index === 3 && target.fingerIndex === columns[4])
        );
        const x = active ? (right ? mirrorX - target.x : target.x) : home;
        const y = active ? target.y + 8 : 67;
        const jointX = (knuckle + x) / 2;
        const bend = y > 90 ? y + 8 : Math.min(jointY - 7, y + 14);
        const reach = `M${knuckle} ${Math.max(jointY + 12, y + 21)} Q${knuckle} ${bend + 10} ${jointX} ${bend} Q${x} ${bend - 4} ${x} ${y}`;
        return (
          <g key={home}>
            <path d={reach} stroke={active ? "#945b32" : "#93664e"} strokeWidth={width + 2.5} />
            <path d={reach} stroke={active ? "#ffc366" : "#edbd98"} strokeWidth={width} />
            <rect x={x - 4.5} y={y - 6} width="9" height="11" rx="4" fill={active ? "#fff0ba" : "#ffe4ce"} />
          </g>
        );
      })}
      <path d="M62 110Q69 133 80 143M98 110Q104 132 103 143M132 114Q129 137 141 144" stroke="#b78064" opacity=".55" />
      <path d="M178 116Q184 113 186 119L182 126Q178 128 174 123Z" fill="#ffe4ce" />
      <path d="M62 161Q97 168 145 158L139 175H61Z" fill={right ? "#729abb" : "#68b6ad"} stroke="#426b7e" strokeWidth="2" />
    </g>
  );
}

export function HandGuide({ next, physical }: { next?: string; physical?: string }) {
  const target = keyFaces.find((key) => key.letter === next);
  return (
    <svg className="typing-hands" viewBox="0 0 438 178" role="img" aria-label="ידיים בתנוחת הקלדה על המקלדת העברית" focusable="false">
      <rect x="2" y="2" width="432" height="143" rx="14" fill="#a9c6d3" stroke="#668a9c" strokeWidth="2" />
      {keyFaces.map(({ x, y, code }) => (
        <rect
          key={code}
          x={x - 18}
          y={y - 15}
          width="36"
          height="31"
          rx="5"
          fill={code === target?.code ? "#ffd065" : "#fffdf8"}
          stroke={code === physical ? "#287c70" : code === target?.code ? "#9d652e" : "#668a9c"}
          strokeWidth={code === target?.code || code === physical ? 3 : 1.5}
        />
      ))}
      <rect x="146" y="113" width="146" height="23" rx="6" fill="#fffdf8" stroke="#668a9c" strokeWidth="1.5" />
      <g strokeLinecap="round" strokeLinejoin="round" fill="none" opacity=".88">
        <TypingHand right={false} target={target} />
        <TypingHand right target={target} />
      </g>
      {keyFaces.map(({ x, y, letter, code }) => (
        <text
          key={code}
          x={x}
          y={y + (code === target?.code ? 2 : 5)}
          className={code === target?.code ? "typing-target" : undefined}
        >
          {letter}
        </text>
      ))}
      <path d="M154 49h10m110 0h10" stroke="#668a9c" strokeWidth="2" strokeLinecap="round" />
      <path d="M211 125h16" stroke="#668a9c" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
