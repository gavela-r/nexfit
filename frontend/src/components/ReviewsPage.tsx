// ReviewsPage
// Mis reseñas (#/cuenta/resenas): prendas compradas pendientes de valorar y
// reseñas ya escritas (se pueden editar o borrar). Cada reseña recalcula la
// nota pública del producto en el backend.
import { useEffect, useState } from "react";
import {
  ApiRequestError,
  deleteReview,
  getMyReviews,
  saveReview,
  type AuthUser,
  type MyReviews,
} from "../api";
import { AccountLayout } from "./AccountLayout";
import { ReviewEditor, Stars } from "./ReviewWidgets";

interface ReviewsPageProps {
  user: AuthUser | null;
  token: string | null;
  restoring: boolean;
  onOpenLogin: () => void;
}

const CARD =
  "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800/90";

export function ReviewsPage({ user, token, restoring, onOpenLogin }: ReviewsPageProps) {
  const [data, setData] = useState<MyReviews | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  // Producto cuyo formulario está abierto (pendiente o reseña que se edita).
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (!token) return;
    let active = true;
    void getMyReviews(token)
      .then((result) => {
        if (active) setData(result);
      })
      .catch((error: unknown) => {
        if (active) {
          setLoadError(
            error instanceof ApiRequestError ? error.message : "No se pudieron cargar tus reseñas.",
          );
        }
      });
    return () => {
      active = false;
    };
  }, [token]);

  const open = (productId: string) => {
    setEditing(productId);
    setErrors([]);
  };

  const handleSave = async (
    productId: string,
    review: { rating: number; title: string; comment: string },
  ) => {
    if (!token) return;
    setSaving(true);
    setErrors([]);
    try {
      setData(await saveReview(token, { productId, ...review }));
      setEditing(null);
    } catch (error) {
      setErrors([
        error instanceof ApiRequestError ? error.message : "No se pudo guardar la reseña.",
      ]);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!token || !window.confirm("¿Seguro que quieres borrar esta reseña?")) return;
    try {
      setData(await deleteReview(token, productId));
    } catch {
      setLoadError("No se pudo borrar la reseña.");
    }
  };

  return (
    <AccountLayout
      onOpenLogin={onOpenLogin}
      restoring={restoring}
      section="resenas"
      subtitle="Tu opinión ayuda a otros deportistas a elegir mejor y nos ayuda a mejorar."
      title="Mis reseñas"
      user={user}
    >
      {loadError ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          {loadError}
        </p>
      ) : !data ? (
        <div className="h-64 animate-pulse rounded-2xl bg-white dark:bg-slate-800/60" />
      ) : (
        <div className="space-y-8">
          {/* Pendientes */}
          <section data-reveal>
            <h2 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Pendientes de valorar
              {data.pending.length > 0 && (
                <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] text-white">
                  {data.pending.length}
                </span>
              )}
            </h2>
            {data.pending.length === 0 ? (
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                {data.reviews.length > 0
                  ? "¡Has valorado todo lo que has comprado! Gracias por tu ayuda."
                  : "Cuando compres alguna prenda podrás valorarla aquí."}
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {data.pending.map((item) => (
                  <li className={CARD} key={item.productId}>
                    <div className="flex items-center gap-4">
                      <div
                        className="h-16 w-16 shrink-0 rounded-xl bg-slate-100 bg-cover bg-center dark:bg-slate-900"
                        style={{ backgroundImage: `url('${item.image}')` }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold text-slate-900 dark:text-white">
                          {item.productName}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Comprado el {new Date(item.purchasedAt).toLocaleDateString("es-ES")}
                        </p>
                      </div>
                      {editing !== item.productId && (
                        <button
                          className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-slate-900 px-4 text-sm font-bold text-white hover:bg-primary dark:bg-primary dark:hover:bg-[#E04B16]"
                          onClick={() => open(item.productId)}
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[18px]">star</span>
                          Valorar
                        </button>
                      )}
                    </div>
                    {editing === item.productId && (
                      <ReviewEditor
                        errors={errors}
                        initial={{ rating: 0, title: "", comment: "" }}
                        onCancel={() => setEditing(null)}
                        onSave={(review) => void handleSave(item.productId, review)}
                        saving={saving}
                      />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Escritas */}
          <section data-reveal>
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Tus reseñas publicadas
            </h2>
            {data.reviews.length === 0 ? (
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                Todavía no has escrito ninguna reseña.
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {data.reviews.map((review) => (
                  <li className={CARD} key={review.productId}>
                    <div className="flex items-start gap-4">
                      <div
                        className="h-16 w-16 shrink-0 rounded-xl bg-slate-100 bg-cover bg-center dark:bg-slate-900"
                        style={{ backgroundImage: `url('${review.image}')` }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold text-slate-900 dark:text-white">
                          {review.productName}
                        </p>
                        <div className="mt-0.5 flex items-center gap-2">
                          <Stars value={review.rating} />
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {new Date(review.updatedAt).toLocaleDateString("es-ES")}
                          </span>
                        </div>
                        {review.title && (
                          <p className="mt-2 text-sm font-bold text-slate-900 dark:text-white">
                            {review.title}
                          </p>
                        )}
                        {review.comment && (
                          <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                            {review.comment}
                          </p>
                        )}
                      </div>
                      {editing !== review.productId && (
                        <div className="flex shrink-0 gap-1">
                          <button
                            aria-label="Editar reseña"
                            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-primary dark:text-slate-400 dark:hover:bg-slate-700"
                            onClick={() => open(review.productId)}
                            title="Editar"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                          </button>
                          <button
                            aria-label="Borrar reseña"
                            className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-950/40"
                            onClick={() => void handleDelete(review.productId)}
                            title="Borrar"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                    {editing === review.productId && (
                      <ReviewEditor
                        errors={errors}
                        initial={{
                          rating: review.rating,
                          title: review.title ?? "",
                          comment: review.comment ?? "",
                        }}
                        onCancel={() => setEditing(null)}
                        onSave={(next) => void handleSave(review.productId, next)}
                        saving={saving}
                      />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </AccountLayout>
  );
}
