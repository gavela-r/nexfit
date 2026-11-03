// ProfilePage
// Editar perfil (#/cuenta/perfil): nombre y correo (PATCH /api/auth/me), cambio
// de contraseña (POST /api/auth/password), tallas habituales (PATCH /api/auth/sizes)
// y direcciones de envío (AddressesSection), cada bloque con su formulario.
import { useEffect, useState, type FormEvent } from "react";
import {
  ApiRequestError,
  changePassword,
  updateProfile,
  updateSizes,
  type AuthUser,
  type UserSizes,
} from "../api";
import { AccountLayout } from "./AccountLayout";
import { AddressesSection } from "./AddressesSection";
import { SizesFields } from "./SizesFields";

interface ProfilePageProps {
  user: AuthUser | null;
  token: string | null;
  restoring: boolean;
  onUserUpdated: (user: AuthUser) => void;
  onOpenLogin: () => void;
}

type Feedback = { kind: "ok" | "error"; messages: string[] } | null;

const CARD =
  "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/90 md:p-7";
const LABEL = "block text-xs font-bold text-slate-700 dark:text-slate-200";
const INPUT =
  "mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white";
const SUBMIT =
  "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-bold text-white transition-colors hover:bg-primary disabled:cursor-wait disabled:opacity-70 dark:bg-primary dark:hover:bg-[#E04B16]";

function errorMessages(error: unknown, fallback: string): string[] {
  if (error instanceof ApiRequestError) {
    return error.details.length > 0 ? error.details : [error.message];
  }
  return [fallback];
}

function FeedbackBox({ feedback }: { feedback: Feedback }) {
  if (!feedback) return null;
  const ok = feedback.kind === "ok";
  return (
    <div
      className={`mt-4 flex items-start gap-2 rounded-xl border px-3.5 py-2.5 text-xs ${
        ok
          ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300"
          : "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
      }`}
      role={ok ? "status" : "alert"}
    >
      <span className="material-symbols-outlined text-[16px]">{ok ? "check_circle" : "error"}</span>
      <ul className="space-y-0.5">
        {feedback.messages.map((message) => (
          <li key={message}>{message}</li>
        ))}
      </ul>
    </div>
  );
}

export function ProfilePage({
  user,
  token,
  restoring,
  onUserUpdated,
  onOpenLogin,
}: ProfilePageProps) {
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<Feedback>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<Feedback>(null);

  const [sizes, setSizes] = useState<UserSizes>(
    user?.sizes ?? { top: null, bottom: null, shoe: null },
  );
  const [savingSizes, setSavingSizes] = useState(false);
  const [sizesFeedback, setSizesFeedback] = useState<Feedback>(null);

  // Las tallas guardadas llegan al restaurar la sesión.
  useEffect(() => {
    if (user) setSizes(user.sizes);
  }, [user?.sizes.top, user?.sizes.bottom, user?.sizes.shoe]);

  const sizesChanged =
    user !== null &&
    (sizes.top !== user.sizes.top ||
      sizes.bottom !== user.sizes.bottom ||
      sizes.shoe !== user.sizes.shoe);

  const handleSizes = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !sizesChanged) return;
    setSavingSizes(true);
    setSizesFeedback(null);
    try {
      onUserUpdated(await updateSizes(token, sizes));
      setSizesFeedback({
        kind: "ok",
        messages: ["Tallas guardadas. Las marcaremos solas en cada prenda."],
      });
    } catch (error) {
      setSizesFeedback({
        kind: "error",
        messages: errorMessages(error, "No se pudieron guardar las tallas."),
      });
    } finally {
      setSavingSizes(false);
    }
  };

  // Cuando la sesión termina de restaurarse llegan los datos reales.
  useEffect(() => {
    setName(user?.name ?? "");
    setEmail(user?.email ?? "");
  }, [user?.name, user?.email]);

  const profileChanged =
    user !== null && (name.trim() !== user.name || email.trim().toLowerCase() !== user.email);

  const handleProfile = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !profileChanged) return;
    setSavingProfile(true);
    setProfileFeedback(null);
    try {
      const updated = await updateProfile(token, name, email);
      onUserUpdated(updated);
      setProfileFeedback({ kind: "ok", messages: ["Datos guardados correctamente."] });
    } catch (error) {
      setProfileFeedback({
        kind: "error",
        messages: errorMessages(error, "No se pudieron guardar los cambios."),
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePassword = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;
    if (newPassword !== repeatPassword) {
      setPasswordFeedback({ kind: "error", messages: ["Las contraseñas nuevas no coinciden."] });
      return;
    }
    setSavingPassword(true);
    setPasswordFeedback(null);
    try {
      await changePassword(token, currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setRepeatPassword("");
      setPasswordFeedback({
        kind: "ok",
        messages: ["Contraseña actualizada. Se han cerrado las sesiones de otros dispositivos."],
      });
    } catch (error) {
      setPasswordFeedback({
        kind: "error",
        messages: errorMessages(error, "No se pudo cambiar la contraseña."),
      });
    } finally {
      setSavingPassword(false);
    }
  };

  const memberSince = user
    ? new Date(user.createdAt).toLocaleDateString("es-ES", { month: "long", year: "numeric" })
    : "";

  return (
    <AccountLayout
      onOpenLogin={onOpenLogin}
      restoring={restoring}
      section="perfil"
      subtitle="Mantén tus datos al día y protege tu cuenta."
      title="Editar perfil"
      user={user}
    >
      <div className="space-y-6" data-reveal-stagger>
        {/* Datos personales */}
        <form className={CARD} noValidate onSubmit={handleProfile}>
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-lg font-black text-white">
              {(user?.name ?? "")
                .trim()
                .split(/\s+/)
                .slice(0, 2)
                .map((part) => part[0]?.toUpperCase())
                .join("")}
            </span>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Datos personales
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Miembro del Club NEXFIT desde {memberSince}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className={LABEL}>
              Nombre y apellidos
              <input
                autoComplete="name"
                className={INPUT}
                maxLength={80}
                onChange={(event) => setName(event.target.value)}
                required
                value={name}
              />
            </label>
            <label className={LABEL}>
              Correo electrónico
              <input
                autoComplete="email"
                className={INPUT}
                maxLength={160}
                onChange={(event) => setEmail(event.target.value)}
                required
                type="email"
                value={email}
              />
            </label>
          </div>

          <FeedbackBox feedback={profileFeedback} />

          <div className="mt-6 flex justify-end">
            <button className={SUBMIT} disabled={savingProfile || !profileChanged} type="submit">
              {savingProfile && (
                <span className="material-symbols-outlined animate-spin text-[18px]">
                  progress_activity
                </span>
              )}
              Guardar cambios
            </button>
          </div>
        </form>

        {/* Contraseña */}
        <form className={CARD} noValidate onSubmit={handlePassword}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Contraseña</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Mínimo 8 caracteres. Al cambiarla se cierra la sesión en tus otros dispositivos.
              </p>
            </div>
            <button
              className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-slate-500 hover:text-primary dark:text-slate-400"
              onClick={() => setShowPasswords((current) => !current)}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">
                {showPasswords ? "visibility_off" : "visibility"}
              </span>
              {showPasswords ? "Ocultar" : "Mostrar"}
            </button>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <label className={LABEL}>
              Contraseña actual
              <input
                autoComplete="current-password"
                className={INPUT}
                onChange={(event) => setCurrentPassword(event.target.value)}
                type={showPasswords ? "text" : "password"}
                value={currentPassword}
              />
            </label>
            <label className={LABEL}>
              Nueva contraseña
              <input
                autoComplete="new-password"
                className={INPUT}
                minLength={8}
                onChange={(event) => setNewPassword(event.target.value)}
                type={showPasswords ? "text" : "password"}
                value={newPassword}
              />
            </label>
            <label className={LABEL}>
              Repite la nueva
              <input
                autoComplete="new-password"
                className={INPUT}
                onChange={(event) => setRepeatPassword(event.target.value)}
                type={showPasswords ? "text" : "password"}
                value={repeatPassword}
              />
            </label>
          </div>

          <FeedbackBox feedback={passwordFeedback} />

          <div className="mt-6 flex justify-end">
            <button
              className={SUBMIT}
              disabled={savingPassword || !currentPassword || !newPassword || !repeatPassword}
              type="submit"
            >
              {savingPassword && (
                <span className="material-symbols-outlined animate-spin text-[18px]">
                  progress_activity
                </span>
              )}
              Cambiar contraseña
            </button>
          </div>
        </form>

        {/* Tallas */}
        <form className={CARD} noValidate onSubmit={handleSizes}>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Mis tallas</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Las marcamos solas en cada prenda según su tipo (si está disponible en esa talla).
          </p>
          <div className="mt-6">
            <SizesFields onChange={setSizes} value={sizes} />
          </div>
          <FeedbackBox feedback={sizesFeedback} />
          <div className="mt-6 flex justify-end">
            <button className={SUBMIT} disabled={savingSizes || !sizesChanged} type="submit">
              {savingSizes && (
                <span className="material-symbols-outlined animate-spin text-[18px]">
                  progress_activity
                </span>
              )}
              Guardar tallas
            </button>
          </div>
        </form>

        {/* Direcciones */}
        {token && user && <AddressesSection defaultName={user.name} token={token} />}
      </div>
    </AccountLayout>
  );
}
