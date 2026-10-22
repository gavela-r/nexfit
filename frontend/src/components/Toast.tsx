// components/Toast.tsx
// Aviso flotante de confirmación, anclado a la esquina inferior derecha.
// Se cierra solo a los pocos segundos y también con la ✕.
import { useEffect } from "react";

export interface ToastData {
  /** Cambia en cada aviso para reiniciar la animación y el temporizador. */
  id: number;
  title: string;
  message: string;
}

interface ToastProps {
  toast: ToastData | null;
  onClose: () => void;
  /** Milisegundos que permanece visible. */
  duration?: number;
}

export function Toast({ toast, onClose, duration = 4500 }: ToastProps) {
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(onClose, duration);
    return () => window.clearTimeout(timer);
  }, [toast, duration, onClose]);

  if (!toast) return null;

  return (
    <div
      className="fixed bottom-5 right-5 z-[100] w-[calc(100vw-2.5rem)] max-w-sm sm:bottom-6 sm:right-6"
      // El contenedor no bloquea la página; solo el aviso es interactivo.
      style={{ pointerEvents: "none" }}
    >
      <div
        key={toast.id}
        role="status"
        aria-live="polite"
        className="toast-enter pointer-events-auto relative flex items-start gap-3 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 pr-11 shadow-2xl shadow-slate-900/20 dark:border-slate-700 dark:bg-slate-900"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
          <span className="material-symbols-outlined text-[22px]">check_circle</span>
        </span>

        <div className="min-w-0">
          <p className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">
            {toast.title}
          </p>
          <p className="mt-0.5 text-[13px] leading-snug text-slate-600 dark:text-slate-300">
            {toast.message}
          </p>
        </div>

        <button
          type="button"
          aria-label="Cerrar aviso"
          onClick={onClose}
          className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>

        {/* Barra de tiempo restante */}
        <span
          aria-hidden="true"
          className="toast-progress absolute bottom-0 left-0 h-[3px] bg-primary"
          style={{ animationDuration: `${duration}ms` }}
        />
      </div>
    </div>
  );
}
