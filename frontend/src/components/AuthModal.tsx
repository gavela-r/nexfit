// AuthModal
// Panel de acceso con dos pestañas: «Iniciar sesión» y «Crear cuenta».
// Valida el formulario, llama a la API de autenticación y entrega la
// sesión a App, que es quien la persiste con useAuth.
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ApiRequestError } from "../api";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MIN_PASSWORD = 8;

type Tab = "login" | "register";

const TABS: { id: Tab; label: string }[] = [
  { id: "login", label: "Iniciar sesión" },
  { id: "register", label: "Crear cuenta" },
];

const INPUT =
  "w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all";

const LABEL = "block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5";

interface AuthModalProps {
  open: boolean;
  /** Pestaña con la que se abre el panel. */
  initialTab: Tab;
  onClose: () => void;
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (name: string, email: string, password: string) => Promise<void>;
}

export function AuthModal({ open, initialTab, onClose, onLogin, onRegister }: AuthModalProps) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [problems, setProblems] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  // Al abrir: pestaña pedida, formulario limpio y foco en el primer campo.
  useEffect(() => {
    if (!open) return;
    setTab(initialTab);
    setProblems([]);
    setName("");
    setPassword("");
    setSubmitting(false);

    const timer = window.setTimeout(() => {
      (initialTab === "register" ? nameRef.current : emailRef.current)?.focus();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [open, initialTab]);

  // Bloquea el desplazamiento de la página y cierra con Escape.
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

  const switchTab = (next: Tab) => {
    setTab(next);
    setProblems([]);
    window.setTimeout(() => {
      (next === "register" ? nameRef.current : emailRef.current)?.focus();
    }, 0);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    // Validación local: la API también valida, así no se hace la petición inútil.
    const checks: string[] = [];
    if (tab === "register" && name.trim().length < 2) {
      checks.push("Escribe tu nombre (mínimo 2 caracteres).");
    }
    if (!EMAIL_PATTERN.test(email.trim())) {
      checks.push("Escribe un correo electrónico válido.");
    }
    if (tab === "register" && password.length < MIN_PASSWORD) {
      checks.push(`La contraseña debe tener al menos ${MIN_PASSWORD} caracteres.`);
    }
    if (checks.length > 0) {
      setProblems(checks);
      return;
    }

    setProblems([]);
    setSubmitting(true);
    try {
      if (tab === "login") {
        await onLogin(email, password);
      } else {
        await onRegister(name, email, password);
      }
    } catch (error) {
      const message =
        error instanceof ApiRequestError
          ? error.message
          : "No se pudo contactar con el servidor. ¿Está la API en marcha?";
      const details = error instanceof ApiRequestError ? error.details : [];
      setProblems([message, ...details]);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      aria-label={tab === "login" ? "Iniciar sesión" : "Crear cuenta"}
      aria-modal="true"
      className="fixed inset-0 z-[80] flex items-center justify-center px-4 py-8"
      role="dialog"
    >
      {/* Fondo: al pulsarlo se cierra el panel */}
      <button
        aria-label="Cerrar"
        className="absolute inset-0 h-full w-full cursor-default bg-slate-950/60 backdrop-blur-sm"
        onClick={onClose}
        type="button"
      />

      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-primary">Cuenta NEXFIT</p>
            <h2 className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white font-headline-sm">
              {tab === "login" ? "Bienvenido de nuevo" : "Crea tu cuenta"}
            </h2>
          </div>
          <button
            aria-label="Cerrar"
            className="rounded-lg p-1 text-slate-400 transition-colors hover:text-primary"
            onClick={onClose}
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Pestañas Iniciar sesión / Crear cuenta */}
        <div className="mt-4 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-900/60">
          {TABS.map((option) => (
            <button
              aria-pressed={tab === option.id}
              className={`h-9 rounded-lg text-xs font-bold transition-colors ${
                tab === option.id
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
              key={option.id}
              onClick={() => switchTab(option.id)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>

        <form className="mt-5 space-y-4" noValidate onSubmit={(event) => void handleSubmit(event)}>
          {tab === "register" && (
            <div>
              <label className={LABEL} htmlFor="auth-name">
                Nombre
              </label>
              <input
                autoComplete="name"
                className={INPUT}
                id="auth-name"
                onChange={(event) => setName(event.target.value)}
                placeholder="Tu nombre"
                ref={nameRef}
                type="text"
                value={name}
              />
            </div>
          )}

          <div>
            <label className={LABEL} htmlFor="auth-email">
              Correo electrónico
            </label>
            <input
              autoComplete="email"
              className={INPUT}
              id="auth-email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="tu@correo.com"
              ref={emailRef}
              type="email"
              value={email}
            />
          </div>

          <div>
            <label className={LABEL} htmlFor="auth-password">
              Contraseña
            </label>
            <input
              autoComplete={tab === "login" ? "current-password" : "new-password"}
              className={INPUT}
              id="auth-password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder={
                tab === "register" ? `Mínimo ${MIN_PASSWORD} caracteres` : "Tu contraseña"
              }
              type="password"
              value={password}
            />
          </div>

          {problems.length > 0 && (
            <div
              aria-live="polite"
              className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
            >
              <p className="font-bold">{problems[0]}</p>
              {problems.length > 1 && (
                <ul className="mt-1 list-disc space-y-0.5 pl-4">
                  {problems.slice(1).map((problem) => (
                    <li key={problem}>{problem}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <button
            className="w-full h-11 rounded-xl bg-slate-900 dark:bg-primary text-white text-sm font-bold uppercase tracking-wide hover:bg-slate-800 dark:hover:bg-[#E04B16] transition-colors disabled:opacity-60 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
            disabled={submitting}
            type="submit"
          >
            {submitting && (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            )}
            {tab === "login" ? "Iniciar sesión" : "Crear cuenta"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
          {tab === "login" ? "¿Aún no tienes cuenta? " : "¿Ya tienes cuenta? "}
          <button
            className="font-bold text-primary hover:underline"
            onClick={() => switchTab(tab === "login" ? "register" : "login")}
            type="button"
          >
            {tab === "login" ? "Regístrate gratis" : "Inicia sesión"}
          </button>
        </p>
      </div>
    </div>
  );
}
