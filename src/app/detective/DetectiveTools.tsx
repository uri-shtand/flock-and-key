import type { ItemId } from '../../content/detective';

// Original SVG props, drawn for this farm adventure. No emoji/font dependency.
export function DetectiveProp({ kind }: { kind: 'notebook' | 'bag' | 'ribbon' | 'delivery' | 'spoon' | 'solve' }) {
  return <svg viewBox="0 0 100 90" aria-hidden="true" focusable="false" className={`detective-prop prop-${kind}`}>
    {kind === 'notebook' ? <g stroke="#263e46" strokeWidth="3" strokeLinejoin="round"><path d="M21 10L78 6L86 76L28 84Z" fill="#466b84"/><path d="M30 15L73 12L80 70L36 77Z" fill="#fff4d5"/><path d="M38 30L66 27M40 41L68 38M42 52L65 49"/><path d="M20 23L33 21M22 39L35 37M24 55L37 53M26 71L39 69" stroke="#dfbd70" strokeWidth="5"/><path d="M63 56L81 33L88 39L70 62L61 67Z" fill="#e4aa55"/></g>
    : kind === 'bag' ? <g stroke="#4e392c" strokeWidth="3" strokeLinejoin="round"><path d="M35 26V17Q50 2 65 17V26" fill="none" strokeWidth="7"/><path d="M14 28Q50 17 86 28L90 74Q50 90 10 74Z" fill="#a86c41"/><path d="M14 28Q50 18 86 28L77 53L24 53Z" fill="#ca9460"/><path d="M34 52V76M67 52V76" stroke="#725035" strokeWidth="7"/><rect x="43" y="44" width="16" height="17" rx="3" fill="#e5bd69"/><circle cx="51" cy="51" r="2" fill="#4e392c"/></g>
    : kind === 'ribbon' ? <g stroke="#703c52" strokeWidth="2"><path d="M48 32L24 78L43 70L49 84L59 42L75 77L76 62L91 65L65 29" fill="#b95064"/><path d="M51 35Q9 5 15 31Q18 55 51 39Q90 57 86 23Q83 4 51 35" fill="#d47d8d"/><circle cx="53" cy="36" r="10" fill="#b95064"/><path d="M29 25L32 31L39 32L34 37L35 44L29 41L22 44L24 37L19 32L26 31M69 19L72 25L79 26L74 31L75 38L69 35L62 38L64 31L59 26L66 25" fill="#ffe3a4" stroke="none"/></g>
    : kind === 'delivery' ? <g stroke="#715b44" strokeWidth="2"><path d="M22 10L76 15L72 82L17 75Z" fill="#fff4d5"/><path d="M31 29L63 32M29 42L61 45M27 55L52 57"/><circle cx="57" cy="65" r="10" fill="#b95064"/><path d="M52 65L56 69L63 61" fill="none" stroke="#fff4d5"/></g>
    : kind === 'spoon' ? <g transform="rotate(28 50 45)" stroke="#71503a" strokeWidth="3"><ellipse cx="50" cy="25" rx="16" ry="21" fill="#c79761"/><path d="M46 44L43 83Q50 90 57 83L54 44" fill="#c79761"/><ellipse cx="50" cy="24" rx="10" ry="13" fill="#a87848"/></g>
    : <g stroke="#263e46" strokeWidth="3"><rect x="10" y="17" width="65" height="54" rx="5" fill="#fff4d5"/><path d="M20 31H61M20 43H45M20 55H48"/><circle cx="68" cy="50" r="19" fill="#b6dee0" fillOpacity=".7"/><path d="M80 65L92 80" strokeWidth="9"/></g>}
  </svg>;
}
export function ItemArt({ item }: { item: ItemId }) { return <DetectiveProp kind={item} />; }
