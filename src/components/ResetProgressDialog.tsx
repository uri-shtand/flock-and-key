import { useEffect, useRef } from "react";

export function ResetProgressDialog({
  onCancel,
  onConfirm,
  error,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  error: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    cancel.current?.focus();
    return () => element?.close();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="reset-dialog"
      aria-labelledby="reset-title"
      aria-describedby="reset-description"
      onCancel={onCancel}
    >
      <span className="eyebrow">התחלה מחדש</span>
      <h2 id="reset-title">לאפס את כל ההתקדמות?</h2>
      <p id="reset-description">
        כל הסשנים, התשובות והסטטיסטיקות, הניקוד והפרסים יימחקו מהמשחק בדפדפן
        הזה. גם המשחק הנוכחי יתחיל מחדש. אי אפשר לבטל את האיפוס.
      </p>
      <p className="muted">
        העדפות המוזיקה וההקראה יישמרו. אפשר לבטל ולייצא את הנתונים לעיון לפני
        האיפוס.
      </p>
      {error && (
        <p className="warning" role="alert">
          {error}
        </p>
      )}
      <div className="actions">
        <button ref={cancel} className="secondary" onClick={onCancel}>
          ביטול, שומרים את ההתקדמות
        </button>
        <button className="danger-button" onClick={onConfirm}>
          כן, לאפס את ההתקדמות
        </button>
      </div>
    </dialog>
  );
}
