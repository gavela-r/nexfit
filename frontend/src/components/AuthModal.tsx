// AuthModal
// Modal de acceso a dos columnas: a la izquierda el formulario (iniciar sesión
// o crear cuenta) y a la derecha un panel oscuro con las ventajas del club.
// Valida en local, llama a la API y entrega la sesión a App, que es quien la
// persiste con useAuth y muestra el aviso de bienvenida.
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ApiRequestError } from "../api";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MIN_PASSWORD = 8;

type Tab = "login" | "register";

interface AuthModalProps {
  open: boolean;
  /** Formulario con el que se abre el modal. */
  initialTab: Tab;
  onClose: () => void;
  onLogin: (email: string, password: string, remember: boolean) => Promise<void>;
  onRegister: (name: string, email: string, password: string) => Promise<void>;
}

const BENEFITS = [
  {
    icon: "local_shipping",
    title: "Envíos exprés prioritarios",
    text: "Gratis desde 40€ con entrega preferente 24 horas.",
  },
  {
    icon: "bolt",
    title: "Acceso anticipado exclusivo",
    text: "Lanzamientos de colecciones técnicas y drops limitados antes que nadie.",
  },
  {
    icon: "verified_user",
    title: "Garantía Deportiva 30 Días",
    text: "Pruébalo en entrenamientos reales sin ningún tipo de compromiso.",
  },
  {
    icon: "straighten",
    title: "Recomendador biométrico",
    text: "Historial de ajuste y cálculo inteligente de tallas para cada disciplina.",
  },
];

const INPUT =
  "h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3.5 text-[13.5px] text-slate-900 placeholder:text-slate-400 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500";

const LABEL = "block text-xs font-bold text-slate-700 dark:text-slate-300";

const FIELD_ICON =
  "material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[17px] text-slate-400 dark:text-slate-500";

export function AuthModal({ open, initialTab, onClose, onLogin, onRegister }: AuthModalProps) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [problems, setProblems] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  // Al abrir: formulario limpio, pestaña pedida y foco en el primer campo.
  useEffect(() => {
    if (!open) return;
    setTab(initialTab);
    setProblems([]);
    setNotice(null);
    setName("");
    setPassword("");
    setShowPassword(false);
    setRemember(true);
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
    setNotice(null);
    setShowPassword(false);
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
    if (password.length === 0) {
      checks.push("Escribe tu contraseña.");
    } else if (tab === "register" && password.length < MIN_PASSWORD) {
      checks.push(`La contraseña debe tener al menos ${MIN_PASSWORD} caracteres.`);
    }
    if (checks.length > 0) {
      setProblems(checks);
      return;
    }

    setProblems([]);
    setNotice(null);
    setSubmitting(true);
    try {
      if (tab === "login") {
        await onLogin(email, password, remember);
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

  const isLogin = tab === "login";

  return (
    <div
      aria-labelledby="auth-modal-title"
      aria-modal="true"
      className="fixed inset-0 z-[80] overflow-y-auto"
      role="dialog"
    >
      {/* Fondo: al pulsarlo se cierra el modal */}
      <button
        aria-label="Cerrar"
        className="fixed inset-0 h-full w-full cursor-default bg-slate-950/60 backdrop-blur-sm"
        onClick={onClose}
        type="button"
      />

      <div className="relative flex min-h-full items-center justify-center p-3 sm:p-6">
        <div className="auth-modal-enter relative grid w-full max-w-[1030px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 lg:grid-cols-[minmax(0,1.34fr)_minmax(340px,1fr)]">
          <button
            aria-label="Cerrar"
            className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200 lg:border-white/15 lg:bg-white/10 lg:text-slate-200 lg:hover:bg-white/20"
            onClick={onClose}
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>

          {/* ------------------------------------------------ formulario */}
          <section className="custom-scrollbar p-5 sm:p-7 lg:max-h-[calc(100vh-48px)] lg:overflow-y-auto">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-orange-200 bg-orange-50 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.09em] text-orange-700 dark:border-primary/30 dark:bg-primary/10 dark:text-orange-300">
              <span className="material-symbols-outlined text-[12px]">auto_awesome</span>
              {isLogin ? "Club NEXFIT · Acceso exclusivo" : "Club NEXFIT · 10% en tu primer pedido"}
            </span>

            <h2
              className="mt-3 font-headline-sm text-[26px] font-extrabold leading-[1.1] tracking-tight text-slate-900 dark:text-white sm:text-[30px]"
              id="auth-modal-title"
            >
              {isLogin ? "Bienvenido de nuevo" : "Crea tu cuenta"}
            </h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
              {isLogin
                ? "Accede a tu cuenta para gestionar tus pedidos, prendas guardadas y ventajas del club."
                : "Únete al Club NEXFIT y guarda tus prendas favoritas, tus tallas y tu historial."}
            </p>

            <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <button
                className="flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white text-[12.5px] font-semibold text-slate-900 transition hover:border-slate-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-slate-600"
                onClick={() =>
                  setNotice("El acceso con Google y Apple estará disponible próximamente.")
                }
                title="Disponible próximamente"
                type="button"
              >
                <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 48 48">
                  <path
                    d="M24 9.5c3.54 0 6.7 1.22 9.19 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    fill="#EA4335"
                  />
                  <path
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    fill="#4285F4"
                  />
                  <path
                    d="M10.53 28.59A14.5 14.5 0 0 1 9.77 24c0-1.6.28-3.14.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.88.93 7.54 2.56 10.78l7.97-6.19z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    fill="#34A853"
                  />
                </svg>
                {isLogin ? "Continuar con Google" : "Registrarme con Google"}
              </button>
              <button
                className="flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white text-[12.5px] font-semibold text-slate-900 transition hover:border-slate-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-slate-600"
                onClick={() =>
                  setNotice("El acceso con Google y Apple estará disponible próximamente.")
                }
                title="Disponible próximamente"
                type="button"
              >
                <svg aria-hidden="true" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16.36 1.43c0 1.14-.42 2.2-1.26 3.03-.9.9-1.98 1.4-3.12 1.31-.03-1.14.45-2.2 1.26-3.03.84-.87 2.04-1.41 3.12-1.31zM20.9 17.2c-.6 1.38-.9 2-1.68 3.23-1.08 1.72-2.6 3.86-4.5 3.88-1.68.02-2.1-1.1-4.38-1.09-2.27.01-2.74 1.11-4.41 1.09-1.9-.02-3.35-1.95-4.43-3.67C-1.53 15.77-1.85 10.06.02 7.02c1.33-2.17 3.43-3.44 5.4-3.44 2 0 3.26 1.1 4.92 1.1 1.6 0 2.58-1.1 4.9-1.1 1.76 0 3.62.96 4.95 2.61-4.35 2.38-3.64 8.6 1.11 11.01z" />
                </svg>
                {isLogin ? "Continuar con Apple" : "Registrarme con Apple"}
              </button>
            </div>

            <div className="mt-4 mb-3.5 flex items-center gap-3">
              <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
              <span className="max-w-[140px] text-right text-[8.5px] font-bold uppercase leading-[1.45] tracking-[0.08em] text-slate-400 dark:text-slate-500">
                O continúa con tu correo electrónico
              </span>
            </div>

            <form noValidate onSubmit={(event) => void handleSubmit(event)}>
              {!isLogin && (
                <div className="mb-3.5">
                  <label className={LABEL} htmlFor="auth-name">
                    Nombre completo <span className="text-primary">*</span>
                  </label>
                  <div className="relative mt-1.5">
                    <span className={FIELD_ICON}>person</span>
                    <input
                      autoComplete="name"
                      className={INPUT}
                      id="auth-name"
                      onChange={(event) => {
                        setName(event.target.value);
                        setProblems([]);
                      }}
                      placeholder="Tu nombre"
                      ref={nameRef}
                      type="text"
                      value={name}
                    />
                  </div>
                </div>
              )}

              <div className="mb-3.5">
                <label className={LABEL} htmlFor="auth-email">
                  Correo electrónico <span className="text-primary">*</span>
                </label>
                <div className="relative mt-1.5">
                  <span className={FIELD_ICON}>mail</span>
                  <input
                    autoComplete="email"
                    className={INPUT}
                    id="auth-email"
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setProblems([]);
                    }}
                    placeholder="ejemplo@nexfit.com"
                    ref={emailRef}
                    type="email"
                    value={email}
                  />
                </div>
              </div>

              <div className="mb-3.5">
                <div className="flex items-baseline justify-between gap-3">
                  <label className={LABEL} htmlFor="auth-password">
                    Contraseña <span className="text-primary">*</span>
                  </label>
                  {isLogin && (
                    <button
                      className="text-[11.5px] font-semibold text-secondary hover:underline"
                      onClick={() =>
                        setNotice("La recuperación de contraseña no está disponible en la demo.")
                      }
                      type="button"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  )}
                </div>
                <div className="relative mt-1.5">
                  <span className={FIELD_ICON}>lock</span>
                  <input
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    className={`${INPUT} pr-11`}
                    id="auth-password"
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setProblems([]);
                    }}
                    placeholder={isLogin ? "Tu contraseña" : `Mínimo ${MIN_PASSWORD} caracteres`}
                    type={showPassword ? "text" : "password"}
                    value={password}
                  />
                  <button
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
                    onClick={() => setShowPassword((visible) => !visible)}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
                {!isLogin && (
                  <p className="mt-1.5 text-[10.5px] text-slate-400 dark:text-slate-500">
                    Mínimo {MIN_PASSWORD} caracteres.
                  </p>
                )}
              </div>

              {isLogin ? (
                <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <input
                    checked={remember}
                    className="h-4 w-4 rounded border-slate-300 accent-[#FF5A1F]"
                    onChange={(event) => setRemember(event.target.checked)}
                    type="checkbox"
                  />
                  Recordar mi sesión en este dispositivo
                </label>
              ) : (
                <p className="text-[11px] leading-snug text-slate-500 dark:text-slate-400">
                  Al crear tu cuenta aceptas los términos y la política de privacidad.
                </p>
              )}

              {notice && (
                <p className="mt-3 flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] leading-snug text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
                  <span className="material-symbols-outlined text-[14px] text-slate-400">info</span>
                  {notice}
                </p>
              )}

              {problems.length > 0 && (
                <div
                  aria-live="polite"
                  className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
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
                className="mt-3.5 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-[#FF7C42] via-primary to-[#F04A10] text-sm font-bold text-white shadow-lg shadow-primary/25 transition hover:-translate-y-px hover:shadow-xl hover:shadow-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:translate-y-0 disabled:opacity-60"
                disabled={submitting}
                type="submit"
              >
                {submitting && (
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                )}
                {isLogin ? "Iniciar sesión" : "Crear cuenta"}
                <span className="material-symbols-outlined text-[17px]">arrow_forward</span>
              </button>
            </form>

            <div className="my-4 h-px bg-slate-200 dark:bg-slate-700" />

            <p className="text-center text-[12.5px] leading-relaxed text-slate-600 dark:text-slate-400">
              {isLogin
                ? "¿Aún no tienes cuenta en NEXFIT? Crea tu cuenta gratis y consigue un 10% en tu primer pedido."
                : "¿Ya tienes cuenta en NEXFIT?"}
              <br />
              <button
                className="mt-0.5 inline-flex items-center gap-1 text-[12.5px] font-extrabold text-primary hover:underline"
                onClick={() => switchTab(isLogin ? "register" : "login")}
                type="button"
              >
                {isLogin ? "Registrarme ahora" : "Iniciar sesión"}
                <span className="material-symbols-outlined text-[13px]">north_east</span>
              </button>
            </p>

            <p className="mt-3.5 flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center text-[10px] text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400">
              <span className="material-symbols-outlined text-[13px]">schedule</span>
              Modo Demostración · No se procesan credenciales bancarias ni datos personales reales
            </p>
          </section>

          {/* ------------------------------------------- panel de ventajas */}
          <aside className="auth-panel relative hidden flex-col border-t border-white/10 p-6 text-white sm:flex lg:max-h-[calc(100vh-48px)] lg:overflow-y-auto lg:border-l lg:border-t-0">
            <span className="inline-flex items-center gap-1.5 self-start rounded-md border border-primary/40 bg-primary/10 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.09em] text-[#FF9A6D]">
              <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_0_3px_rgba(255,90,31,0.18)]" />
              Ventajas de ser miembro NEXFIT
            </span>

            <h3 className="mt-4 font-headline-sm text-2xl font-extrabold leading-tight">
              Entrena al siguiente nivel con soporte total.
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              Únete a más de 120.000 atletas en Europa que optimizan su equipamiento de alto
              rendimiento.
            </p>

            <div className="mt-4 space-y-2">
              {BENEFITS.map((benefit) => (
                <div
                  className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-3"
                  key={benefit.title}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/15 text-[#FF8A5B]">
                    <span className="material-symbols-outlined text-[16px]">{benefit.icon}</span>
                  </span>
                  <div>
                    <p className="text-xs font-bold text-white">{benefit.title}</p>
                    <p className="mt-0.5 text-[10.5px] leading-snug text-slate-400">
                      {benefit.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-auto pt-4">
              <div className="flex justify-between gap-2 text-center">
                <div className="flex-1">
                  <strong className="block font-headline-sm text-[15px] font-extrabold">24h</strong>
                  <span className="mt-px block text-[9.5px] text-slate-400">Envío exprés</span>
                </div>
                <div className="flex-1">
                  <strong className="block font-headline-sm text-[15px] font-extrabold">
                    30 d
                  </strong>
                  <span className="mt-px block text-[9.5px] text-slate-400">Devolución gratis</span>
                </div>
                <div className="flex-1">
                  <strong className="block font-headline-sm text-[15px] font-extrabold">
                    4,9/5
                  </strong>
                  <span className="mt-px block text-[9.5px] text-slate-400">Valoración media</span>
                </div>
              </div>

              <div className="my-3.5 h-px w-full bg-white/10" />

              <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-primary">
                Move with intent
              </p>
              <p className="mt-1.5 text-[10.5px] italic leading-relaxed text-slate-400">
                «Diseñado para superar tus límites cada día. Ingeniería textil técnica en cada
                repetición y cada kilómetro.»
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
