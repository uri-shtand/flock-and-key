import { keyboardRows, keyFor } from "../typing/KeyboardMap";
import { HandGuide } from "./HandGuide";

export function HebrewKeyboard({
  next,
  physical,
  showHands = false,
}: {
  next?: string;
  physical?: string;
  showHands?: boolean;
}) {
  const key = next ? keyFor(next) : undefined;
  return (
    <section className={showHands ? "keyboard with-hands" : "keyboard"} aria-label="מקלדת עברית לעזרה">
      {showHands ? <HandGuide next={next} physical={physical} /> : <div dir="ltr">
        {keyboardRows.map((row, i) => (
          <div className="key-row" key={i}>
            {row.map((k) => (
              <span
                className={`key ${k.letter === next ? "target" : ""} ${k.code === physical ? "pressed" : ""}`}
                key={k.code}
                title={k.code}
                dir="rtl"
              >
                {k.letter}
              </span>
            ))}
          </div>
        ))}
      </div>}
      <p>
        {key ? (
          <>
            המקש הבא <b>{next}</b> · {key.finger}
          </>
        ) : showHands ? (
          "אצבעות בשורת הבית, אגודלים על הרווח"
        ) : (
          "אפשר להיעזר במקלדת. קחו את הזמן."
        )}
      </p>
    </section>
  );
}
