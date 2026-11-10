import { keyboardRows, keyFor } from "../typing/KeyboardMap";
export function HebrewKeyboard({
  next,
  physical,
}: {
  next?: string;
  physical?: string;
}) {
  const key = next ? keyFor(next) : undefined;
  return (
    <section className="keyboard" aria-label="מקלדת עברית לעזרה">
      <div dir="ltr">
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
      </div>
      <p>
        {key ? (
          <>
            המקש הבא: <b>{next}</b> · אצבע מומלצת: {key.finger}
          </>
        ) : (
          "אפשר להיעזר במקלדת. קחו את הזמן."
        )}
      </p>
    </section>
  );
}
