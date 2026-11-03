// AccountLayout
// Marco común del área de cliente (#/cuenta/... y #/favoritos): migas, título
// y navegación lateral entre secciones.
// Sin sesión muestra una invitación a entrar en lugar del contenido.
import type { ReactNode } from "react";
import type { AuthUser } from "../api";
import type { Page } from "../hooks/useHashRoute";

export type AccountSection =
  "pedidos" | "devoluciones" | "resenas" | "favoritos" | "vistos" | "club" | "perfil";

export const ACCOUNT_GROUPS = ["Mis compras", "Para ti", "Ajustes"] as const;

/**
 * Secciones de la cuenta, en el orden en que se muestran. Las comparten el
 * panel lateral de la cabecera (agrupadas) y la navegación de estas páginas.
 */
export const ACCOUNT_SECTIONS: {
  id: AccountSection;
  /** Página de la app (para marcar la activa). */
  page: Page;
  group: (typeof ACCOUNT_GROUPS)[number];
  href: string;
  label: string;
  description: string;
  icon: string;
}[] = [
  {
    id: "pedidos",
    page: "cuenta-pedidos",
    group: "Mis compras",
    href: "#/cuenta/pedidos",
    label: "Historial de compras",
    description: "Tus pedidos y su estado",
    icon: "receipt_long",
  },
  {
    id: "devoluciones",
    page: "cuenta-devoluciones",
    group: "Mis compras",
    href: "#/cuenta/devoluciones",
    label: "Devoluciones y cambios",
    description: "Devuelve o cambia de talla en 30 días",
    icon: "assignment_return",
  },
  {
    id: "resenas",
    page: "cuenta-resenas",
    group: "Mis compras",
    href: "#/cuenta/resenas",
    label: "Mis reseñas",
    description: "Valora las prendas que has comprado",
    icon: "reviews",
  },
  {
    id: "favoritos",
    page: "favoritos",
    group: "Para ti",
    href: "#/favoritos",
    label: "Favoritos",
    description: "Las prendas que has guardado",
    icon: "favorite",
  },
  {
    id: "vistos",
    page: "cuenta-vistos",
    group: "Para ti",
    href: "#/cuenta/vistos",
    label: "Vistos recientemente",
    description: "Las últimas prendas que has mirado",
    icon: "history",
  },
  {
    id: "club",
    page: "cuenta-club",
    group: "Para ti",
    href: "#/cuenta/club",
    label: "Club NEXFIT y cupones",
    description: "Tus puntos, tu nivel y tus descuentos",
    icon: "workspace_premium",
  },
  {
    id: "perfil",
    page: "cuenta-perfil",
    group: "Ajustes",
    href: "#/cuenta/perfil",
    label: "Editar perfil",
    description: "Datos, tallas y direcciones",
    icon: "manage_accounts",
  },
];

interface AccountLayoutProps {
  section: AccountSection;
  user: AuthUser | null;
  /** Mientras se revalida la sesión guardada no se sabe aún si hay usuario. */
  restoring: boolean;
  title: string;
  subtitle: string;
  onOpenLogin: () => void;
  children: ReactNode;
}

export function AccountLayout({
  section,
  user,
  restoring,
  title,
  subtitle,
  onOpenLogin,
  children,
}: AccountLayoutProps) {
  const current = ACCOUNT_SECTIONS.find((item) => item.id === section);

  return (
    <div className="w-full bg-[#F5F7FB] dark:bg-[#0B1220]">
      <div className="mx-auto max-w-[1320px] px-4 pb-16 pt-6 sm:px-6 md:px-8 md:pb-24">
        <nav
          aria-label="Migas de pan"
          className="text-xs text-slate-500 dark:text-slate-400"
          data-reveal
        >
          <ol className="flex items-center gap-1.5">
            <li>
              <a className="transition-colors hover:text-primary" href="#">
                Inicio
              </a>
            </li>
            <li aria-hidden="true" className="material-symbols-outlined text-[14px]">
              chevron_right
            </li>
            <li>Mi cuenta</li>
            <li aria-hidden="true" className="material-symbols-outlined text-[14px]">
              chevron_right
            </li>
            <li className="font-semibold text-slate-700 dark:text-slate-200">{current?.label}</li>
          </ol>
        </nav>

        <header className="mt-5" data-reveal>
          <h1 className="font-headline text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-3xl">
            {title}
          </h1>
          <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">{subtitle}</p>
        </header>

        {restoring ? (
          <div
            aria-busy="true"
            className="mt-8 h-64 animate-pulse rounded-2xl bg-white dark:bg-slate-800/60"
          />
        ) : !user ? (
          <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800/90">
            <span className="material-symbols-outlined text-[44px] text-primary">lock</span>
            <h2 className="mt-3 text-xl font-extrabold text-slate-900 dark:text-white">
              Inicia sesión para ver tu cuenta
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-600 dark:text-slate-300">
              Guarda tus prendas favoritas, consulta tus pedidos y gestiona tus datos desde un solo
              sitio.
            </p>
            <button
              className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-white shadow-lg shadow-primary/25 transition-colors hover:bg-[#F04A10]"
              onClick={onOpenLogin}
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">login</span>
              Iniciar sesión
            </button>
          </section>
        ) : (
          <div className="mt-8 grid grid-cols-1 items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-8">
            {/* Navegación entre secciones (en móvil, una fila de pestañas) */}
            <nav
              aria-label="Secciones de la cuenta"
              className="flex gap-2 overflow-x-auto custom-scrollbar pb-1 lg:sticky lg:top-28 lg:flex-col lg:overflow-visible lg:rounded-2xl lg:border lg:border-slate-200 lg:bg-white lg:p-3 lg:shadow-sm lg:dark:border-slate-700 lg:dark:bg-slate-800/90"
              data-reveal="left"
            >
              {ACCOUNT_SECTIONS.map((item) => {
                const active = item.id === section;
                return (
                  <a
                    aria-current={active ? "page" : undefined}
                    className={`flex shrink-0 items-center gap-3 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                      active
                        ? "bg-slate-900 text-white dark:bg-primary"
                        : "bg-white text-slate-700 hover:bg-slate-100 hover:text-primary dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 lg:bg-transparent lg:dark:bg-transparent"
                    }`}
                    href={item.href}
                    key={item.id}
                  >
                    <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                    {item.label}
                  </a>
                );
              })}
            </nav>

            <div className="min-w-0">{children}</div>
          </div>
        )}
      </div>
    </div>
  );
}
