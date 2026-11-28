import { useEffect, useRef, useState } from "react";
import { vocabularyConcepts } from "../content/vocabularyConcepts";
import "./concept-gallery.css";

export function ConceptGallery({ onExit }: { onExit: () => void }) {
  const heading = useRef<HTMLHeadingElement>(null);
  const [selected, setSelected] = useState(0);
  const [failedImage, setFailedImage] = useState<string>();
  const concept = vocabularyConcepts[selected];
  const image = `/assets/vocabulary-concepts/${concept.id}.webp`;
  useEffect(() => { heading.current?.focus(); }, []);

  return <section className="panel concept-gallery" aria-labelledby="concept-gallery-title" onKeyDown={event => {
    if (event.key === "Escape" && !event.nativeEvent.isComposing) {
      event.stopPropagation();
      onExit();
    }
  }}>
    <div className="section-title">
      <h1 id="concept-gallery-title" ref={heading} tabIndex={-1}>גלריית קונספט ארט</h1>
      <button className="secondary" onClick={onExit}>חזרה לתחנה</button>
    </div>
    <p className="concept-notice">איורי תכנון בלבד — המיני־משחקים האלה עדיין לא נבנו.</p>
    <div className="concept-detail">
      <div className="concept-image-frame">
        {failedImage === image
          ? <p role="status">האיור לא נטען. אפשר לבחור איור אחר או לחזור לתחנה.</p>
          : <img key={image} className="concept-artwork" src={image} alt={concept.alt} width={1024} height={640} onError={() => setFailedImage(image)} />}
      </div>
      <div className="concept-caption">
        <div aria-live="polite" aria-atomic="true">
          <p className="concept-position">איור {selected + 1} מתוך {vocabularyConcepts.length}</p>
          <h2>{concept.title}</h2>
          <p className="concept-english" lang="en" dir="ltr">{concept.englishTitle}</p>
        </div>
        <p>{concept.description}</p>
        <p className="concept-words" dir="ltr" lang="en">{concept.words}</p>
        <a href={image} target="_blank" rel="noopener noreferrer">פתיחת האיור בגודל מלא</a>
        <div className="concept-navigation">
          <button className="secondary" onClick={() => setSelected(index => (index + vocabularyConcepts.length - 1) % vocabularyConcepts.length)}>האיור הקודם</button>
          <button className="secondary" onClick={() => setSelected(index => (index + 1) % vocabularyConcepts.length)}>האיור הבא</button>
        </div>
      </div>
    </div>
    <div className="concept-choices" role="group" aria-label="בחירת איור">
      {vocabularyConcepts.map((item, index) => <button key={item.id} aria-pressed={selected === index} onClick={() => setSelected(index)}>
        <img src={`/assets/vocabulary-concepts/${item.id}.webp`} alt="" width={96} height={60} />
        <span>{item.title}</span>
      </button>)}
    </div>
  </section>;
}
