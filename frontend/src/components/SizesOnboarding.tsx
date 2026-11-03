// SizesOnboarding
// Paso opcional justo después de registrarse: «¿Qué talla usas?». Guarda la
// talla habitual en el perfil o se salta con «Ahora no» (se puede indicar
// más tarde en Editar perfil).
import { useEffect, useState } from "react";
import { ApiRequestError, updateSizes, type AuthUser, type UserSizes } from "../api";
import { SizesFields } from "./SizesFields";

interface SizesOnboardingProps {
  open: boolean;
  token: string | null;
  userName: string;
  onSaved: (user: AuthUser) => void;
  onClose: () => void;
}

export function SizesOnboarding({ open, token, userName, onSaved, onClose }: SizesOnboardingProps) {
  const [sizes, setSizes] = useState<UserSizes>({ top: null, bottom: null, shoe: null });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const empty = !sizes.top && !sizes.bottom && !sizes.shoe;

  const save = async () => {
    if (!token || empty) return;
    setSaving(true);
    setError(null);
    try {
      onSaved(await updateSizes(token, sizes));
      onClose();
    } catch (reason) {
      setError(
        reason instanceof ApiRequestError ? reason.message : "No se pudieron guardar las tallas.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button
        aria-label="Ahora no"
        className="cart-overlay-enter absolute inset-0 h-full w-full cursor-default bg-slate-950/50 backdrop-blur-[2px]"
        onClick={onClose}
        type="button"
      />
      <div
        aria-labelledby="sizes-onboarding-title"
        aria-modal="true"
        className="auth-modal-enter relative w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 md:p-8"
        role="dialog"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-primary dark:bg-primary/15">
          <span className="material-symbols-outlined text-[26px]">straighten</span>
        </span>
        <h2
          className="mt-4 font-headline text-2xl font-extrabold text-slate-900 dark:text-white"
          id="sizes-onboarding-title"
        >
          ¿Qué talla usas, {userName.split(" ")[0]}?
        </h2>
        <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
          Así la marcamos por ti en cada prenda. Es opcional: puedes cambiarla cuando quieras en
          Editar perfil.
        </p>

        <div className="mt-6">
          <SizesFields onChange={setSizes} value={sizes} />
        </div>

        {error && (
          <p className="mt-4 text-xs font-semibold text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}

        <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            className="h-11 rounded-xl px-5 text-sm font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            onClick={onClose}
            type="button"
          >
            Ahora no
          </button>
          <button
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-white shadow-lg shadow-primary/25 hover:bg-[#F04A10] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={saving || empty}
            onClick={() => void save()}
            type="button"
          >
            {saving && (
              <span className="material-symbols-outlined animate-spin text-[18px]">
                progress_activity
              </span>
            )}
            Guardar mis tallas
          </button>
        </div>
      </div>
    </div>
  );
}
