// AccountDrawer
// Panel lateral de la cuenta: se abre al pulsar el nombre en la cabecera.
// Cabecera con los datos del usuario, ventaja del Club, accesos a las
// secciones del área de cliente (ACCOUNT_SECTIONS) y cierre de sesión.
// Mismo comportamiento que la cesta: entra por la derecha, Esc o un clic en
// el fondo lo cierran y la página no hace scroll mientras está abierto.
import { useEffect } from "react";
import type { AuthUser } from "../api";
import type { Page } from "../hooks/useHashRoute";
import { ACCOUNT_GROUPS, ACCOUNT_SECTIONS } from "./AccountLayout";

interface AccountDrawerProps {
  open: boolean;
  user: AuthUser | null;
  currentPage: Page;
  favoritesCount: number;
  cartCount: number;
  onClose: () => void;
  onOpenCart: () => void;
  onLogout: () => void;
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function AccountDrawer({
  open,
  user,
  currentPage,
  favoritesCount,
  cartCount,
  onClose,
  onOpenCart,
  onLogout,
}: AccountDrawerProps) {
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

  if (!open || !user) return null;

  const memberSince = new Date(user.createdAt).toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="fixed inset-0 z-[70]">
      <button
        aria-label="Cerrar el panel de la cuenta"
        className="cart-overlay-enter absolute inset-0 h-full w-full cursor-default bg-slate-950/50 backdrop-blur-[2px]"
        onClick={onClose}
        type="button"
      />

      <aside
        aria-labelledby="account-drawer-title"
        aria-modal="true"
        className="cart-drawer-enter absolute inset-y-0 right-0 flex w-full max-w-[400px] flex-col bg-white shadow-2xl dark:bg-slate-900"
        role="dialog"
      >
        {/* Usuario */}
        <header className="auth-panel relative shrink-0 px-6 pb-6 pt-5 text-white">
          <button
            aria-label="Cerrar"
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            onClick={onClose}
            type="button"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-black shadow-lg shadow-primary/30">
            {getInitials(user.name)}
          </span>
          <h2
            className="mt-4 truncate pr-10 font-headline text-xl font-extrabold"
            id="account-drawer-title"
          >
            {user.name}
          </h2>
          <p className="truncate text-sm text-slate-300">{user.email}</p>
          <a
            className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/15 px-3 py-1 text-[11px] font-bold text-orange-200 transition-colors hover:bg-primary/25"
            href="#/cuenta/club"
            onClick={onClose}
          >
            <span className="material-symbols-outlined text-[15px]">workspace_premium</span>
            Club NEXFIT · 10% en cada pedido
            <span className="material-symbols-outlined text-[15px]">chevron_right</span>
          </a>
          <p className="mt-2 text-[11px] text-slate-400">Miembro desde {memberSince}</p>
        </header>

        {/* Secciones */}
        <nav aria-label="Mi cuenta" className="flex-1 overflow-y-auto px-4 py-5 custom-scrollbar">
          {ACCOUNT_GROUPS.map((group, groupIndex) => (
            <div className={groupIndex > 0 ? "mt-5" : undefined} key={group}>
              <p className="px-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {group}
              </p>
              <ul className="mt-1.5 space-y-0.5">
                {ACCOUNT_SECTIONS.filter((section) => section.group === group).map((section) => {
                  const active = section.page === currentPage;
                  const badge =
                    section.id === "favoritos" && favoritesCount > 0 ? favoritesCount : null;
                  return (
                    <li key={section.id}>
                      <a
                        aria-current={active ? "page" : undefined}
                        className={`group flex items-center gap-3.5 rounded-xl px-3 py-2.5 transition-colors ${
                          active
                            ? "bg-orange-50 dark:bg-primary/15"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800"
                        }`}
                        href={section.href}
                        onClick={onClose}
                      >
                        <span
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                            active
                              ? "bg-primary text-white"
                              : "bg-slate-100 text-slate-600 group-hover:bg-primary group-hover:text-white dark:bg-slate-800 dark:text-slate-300"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[21px]">
                            {section.icon}
                          </span>
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-bold text-slate-900 dark:text-white">
                            {section.label}
                          </span>
                          <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                            {section.description}
                          </span>
                        </span>
                        {badge !== null && (
                          <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-extrabold text-white">
                            {badge}
                          </span>
                        )}
                        <span className="material-symbols-outlined text-[20px] text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-primary dark:text-slate-600">
                          chevron_right
                        </span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          <p className="mt-6 px-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Accesos rápidos
          </p>
          <ul className="mt-2 space-y-1">
            <li>
              <button
                className="flex w-full items-center gap-3.5 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-primary dark:text-slate-200 dark:hover:bg-slate-800"
                onClick={() => {
                  onClose();
                  onOpenCart();
                }}
                type="button"
              >
                <span className="material-symbols-outlined text-[21px]">shopping_bag</span>
                <span className="flex-1">Mi cesta</span>
                <span className="text-xs text-slate-400">
                  {cartCount} {cartCount === 1 ? "prenda" : "prendas"}
                </span>
              </button>
            </li>
            <li>
              <a
                className="flex items-center gap-3.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-primary dark:text-slate-200 dark:hover:bg-slate-800"
                href="#/catalogo"
                onClick={onClose}
              >
                <span className="material-symbols-outlined text-[21px]">storefront</span>
                Ver todo el catálogo
              </a>
            </li>
          </ul>
        </nav>

        <footer className="shrink-0 border-t border-slate-200 p-4 dark:border-slate-800">
          <button
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-slate-700 dark:text-slate-200 dark:hover:border-red-900/60 dark:hover:bg-red-950/40 dark:hover:text-red-400"
            onClick={() => {
              onClose();
              onLogout();
            }}
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            Cerrar sesión
          </button>
        </footer>
      </aside>
    </div>
  );
}
