// ReviewWidgets
// Piezas compartidas de las reseñas: estrellas de solo lectura y formulario de
// valoración (estrellas, título y comentario). Las usan «Mis reseñas» y la
// ficha de producto.
import { useState, type FormEvent } from "react";

export const RATING_TEXT = ["", "Muy mala", "Mejorable", "Correcta", "Muy buena", "¡Excelente!"];

const INPUT =
  "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white";

/** Estrellas de solo lectura; admite medias (4,6 → cuatro y media). */
export function Stars({ value, size = 18 }: { value: number; size?: number }) {
  return (
    <span
      aria-label={`${value.toLocaleString("es-ES")} de 5 estrellas`}
      className="inline-flex text-amber-400"
      role="img"
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const full = value >= star - 0.25;
        const half = !full && value >= star - 0.75;
        return (
          <span
            aria-hidden="true"
            className="material-symbols-outlined"
            key={star}
            style={{
              fontSize: size,
              fontVariationSettings: `'FILL' ${full || half ? 1 : 0}`,
            }}
          >
            {half ? "star_half" : "star"}
          </span>
        );
      })}
    </span>
  );
}

export interface ReviewDraft {
  rating: number;
  title: string;
  comment: string;
}

export interface EditorProps {
  initial: ReviewDraft;
  saving: boolean;
  errors: string[];
  onCancel: () => void;
  onSave: (review: ReviewDraft) => void;
}

/** Formulario de valoración: estrellas, título y comentario. */
export function ReviewEditor({ initial, saving, errors, onCancel, onSave }: EditorProps) {
  const [rating, setRating] = useState(initial.rating);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState(initial.title);
  const [comment, setComment] = useState(initial.comment);
  const shown = hover || rating;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (rating > 0) onSave({ rating, title, comment });
  };

  return (
    <form className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-700" onSubmit={submit}>
      <div className="flex items-center gap-3">
        <div
          className="flex"
          onMouseLeave={() => setHover(0)}
          role="radiogroup"
          aria-label="Valoración"
        >
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              aria-checked={rating === star}
              aria-label={`${star} ${star === 1 ? "estrella" : "estrellas"}`}
              className="p-0.5 text-amber-400 transition-transform hover:scale-110"
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHover(star)}
              role="radio"
              type="button"
            >
              <span
                className="material-symbols-outlined text-[30px]"
                style={{ fontVariationSettings: `'FILL' ${star <= shown ? 1 : 0}` }}
              >
                star
              </span>
            </button>
          ))}
        </div>
        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
          {shown ? RATING_TEXT[shown] : "Elige de 1 a 5 estrellas"}
        </span>
      </div>

      <label className="mt-4 block text-xs font-bold text-slate-700 dark:text-slate-200">
        Título (opcional)
        <input
          className={INPUT}
          maxLength={80}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Resume tu opinión en una frase"
          value={title}
        />
      </label>
      <label className="mt-3 block text-xs font-bold text-slate-700 dark:text-slate-200">
        Tu opinión (opcional)
        <textarea
          className={`${INPUT} min-h-[96px] resize-y`}
          maxLength={1000}
          onChange={(event) => setComment(event.target.value)}
          placeholder="¿Qué tal el tejido, la talla, la comodidad...?"
          value={comment}
        />
      </label>

      {errors.length > 0 && (
        <ul className="mt-3 text-xs text-red-600 dark:text-red-400" role="alert">
          {errors.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex justify-end gap-2">
        <button
          className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
          onClick={onCancel}
          type="button"
        >
          Cancelar
        </button>
        <button
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white hover:bg-[#F04A10] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={saving || rating === 0}
          type="submit"
        >
          {saving && (
            <span className="material-symbols-outlined animate-spin text-[18px]">
              progress_activity
            </span>
          )}
          Publicar reseña
        </button>
      </div>
    </form>
  );
}
