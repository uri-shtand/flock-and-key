import { gateControls } from "../../content/gates";
import { gearSlot, shifterPosition } from "../../content/gatesShifter";
import { gatesLevels } from "../../content/gatesLevels";
import type { Game } from "../../typing/GatesSimulation";

/** Vector accents reuse the farm's warm outlines; visual time never controls the rules. */
export function GatesDecor({ game, still }: { game: Game; still: boolean }) {
  const level = gatesLevels[game.config.level - 1];
  const t = still ? 0 : game.time;
  return <g aria-hidden="true" pointerEvents="none">
    <g opacity=".65" fill="#fff9e7">
      {[0, 1, 2].map((i) => <g key={i} transform={`translate(${240 + i * 390 + Math.sin(t / 12 + i) * 35} ${65 + i % 2 * 35})`}>
        <ellipse rx="67" ry="15" /><ellipse cy="-12" rx="39" ry="24" />
      </g>)}
    </g>
    {Array.from({ length: game.config.level + 2 }, (_, i) => <g key={i} transform={`translate(${170 + i * 175 + Math.sin(t * 1.1 + i) * 18} ${570 + i % 2 * 85 + Math.cos(t + i) * 12})`}>
      <ellipse cx="-7" rx="8" ry={5 + Math.abs(Math.sin(t * 5 + i)) * 5} fill={level.accent} transform="rotate(-25)" />
      <ellipse cx="7" rx="8" ry={5 + Math.abs(Math.sin(t * 5 + i)) * 5} fill={level.accent} transform="rotate(25)" />
      <path d="M0 -7v15" stroke="#68503e" strokeWidth="3" />
    </g>)}
    {game.config.level >= 3 && <g stroke="#876144" strokeWidth="3">
      <path d="M 570 40 Q 800 140 1030 40" fill="none" />
      {Array.from({ length: 9 }, (_, i) => <path key={i} d={`M ${590 + i * 50} ${52 + Math.sin(i / 8 * Math.PI) * 35} l 30 0 l -15 30 Z`} fill={i % 2 ? level.accent : "#fff3be"} />)}
    </g>}
    {game.config.level === 4 && <g stroke="#f7f3cf" strokeWidth="5" fill="none" opacity=".7" transform={`translate(${Math.sin(t) * 20} 0)`}>
      <path d="M 70 200 h 100 q 25 0 25 -20 t -30 -10 M 55 225 h 155 M 1380 810 h 100 q 25 0 25 -20" />
    </g>}
  </g>;
}
export function Gearbox({ game, still }: { game: Game; still: boolean }) {
  const active = game.lever !== null;
  const progress = active ? 1 - game.lever!.remaining / game.config.gearboxSeconds : 1;
  const knob = shifterPosition(game.shiftFrom, game.selectedGate, still ? 1 : progress);
  return <g data-testid="gearbox" data-working={active} data-selected-gate={game.selectedGate ?? "neutral"}>
    <defs>
      <linearGradient id="shift-metal" x2=".8" y2="1"><stop stopColor="#dfd5b7" /><stop offset=".45" stopColor="#a69f88" /><stop offset="1" stopColor="#d6c4a1" /></linearGradient>
      <linearGradient id="shift-leather" x2="1" y2="1"><stop stopColor="#594433" /><stop offset="1" stopColor="#251f1c" /></linearGradient>
    </defs>
    <rect x="-124" y="-88" width="248" height="240" rx="24" fill="#644b34" stroke="#382f28" strokeWidth="5" />
    <rect x="-116" y="-80" width="232" height="159" rx="15" fill="url(#shift-metal)" stroke="#efe0b8" strokeWidth="3" />
    {[-104, 104].flatMap((x) => [-67, 66].map((y) => <g key={`${x}-${y}`}><circle cx={x} cy={y} r="5" fill="#655e4c" /><path d={`M ${x - 3} ${y} h 6`} stroke="#d9cfb1" strokeWidth="2" /></g>))}
    <path d="M -80 0 H 80" fill="none" stroke="#514c40" strokeWidth="11" strokeLinecap="round" />
    {[0, 1, 2, 3, 4].map((column) => <path key={column} d={`M ${-80 + column * 40} -44 V ${column === 4 ? 0 : 44}`} stroke="#514c40" strokeWidth="11" strokeLinecap="round" />)}
    {gateControls.map((control, index) => {
      const point = gearSlot(index);
      const enabled = index < game.gates.length;
      return <g key={control.code} opacity={enabled ? 1 : 0.28}>
        <text x={point.x} y={point.y < 0 ? -57 : 72} textAnchor="middle" fontSize="25" fontWeight="900" fill={game.selectedGate === index ? "#fff6cb" : "#302e27"}
          stroke={game.selectedGate === index ? "#88612a" : "none"} strokeWidth="3" paintOrder="stroke">{control.hebrew}</text>
        {enabled && <circle cx={point.x} cy={point.y} r="4" fill="#d3b777" />}
      </g>;
    })}
    <text x="98" y="9" textAnchor="middle" fontSize="17" fill="#443d31">N</text>
    <ellipse cx="0" cy="135" rx="47" ry="10" fill="#1f1b1899" />
    <path d="M -44 135 L -23 96 Q 0 84 23 96 L 44 135 Z" fill="url(#shift-leather)" stroke="#221d19" strokeWidth="3" />
    {[106, 116, 127].map((y) => <path key={y} d={`M ${-(y - 80) * 0.8} ${y} Q 0 ${y - 11} ${(y - 80) * 0.8} ${y}`} fill="none" stroke="#8a6b4c" strokeWidth="3" />)}
    <path d={`M 0 109 Q ${knob.x * 0.7} 53 ${knob.x} ${knob.y}`} fill="none" stroke="#292824" strokeWidth="12" strokeLinecap="round" />
    <path d={`M -2 107 Q ${knob.x * 0.7 - 2} 53 ${knob.x - 2} ${knob.y}`} fill="none" stroke="#c7c3ae" strokeWidth="6" strokeLinecap="round" />
    <g data-testid="gear-knob" transform={`translate(${knob.x} ${knob.y})`}>
      <circle r="16" fill="#292b28" stroke="#171c19" strokeWidth="3" /><ellipse cx="-5" cy="-6" rx="7" ry="4" fill="#7e867c" />
    </g>
    <circle cx="83" cy="116" r="6" fill={active ? "#e9b45a" : "#b1c18e"} stroke="#312c23" strokeWidth="2" />
  </g>;
}
