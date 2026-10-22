// Header
// Barra superior + navegación + buscador + acceso y carrito.
// Responsive: por debajo de xl los enlaces se recogen en un menú desplegable y
// los textos de los botones se ocultan por tramos para que nada se salga.
import { useEffect, useState } from "react";
import type { AuthUser } from "../api";

interface HeaderProps {
  theme: "light" | "dark";
  onToggleTheme: () => void;
  cartCount: number;
  favoritesCount: number;
  /** Abre el buscador global (panel superpuesto). */
  onOpenSearch: () => void;
  /** Usuario de la sesión abierta; null mientras no haya nadie registrado. */
  user: AuthUser | null;
  /** Sesión guardada que aún se está validando al cargar la página. */
  restoring: boolean;
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onLogout: () => void;
}

const NAV_LINKS = [
  { href: "#hombre", label: "Hombre" },
  { href: "#mujer", label: "Mujer" },
  { href: "#fitness", label: "Fitness/Gym" },
  { href: "#running", label: "Running" },
  { href: "#athleisure", label: "Athleisure" },
] as const;

const NAV_LINK_CLASS =
  "text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary text-sm font-semibold transition-colors pb-1";

/** Iniciales del usuario para el avatar (máximo dos letras). */
function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function Header({
  theme,
  onToggleTheme,
  cartCount,
  favoritesCount,
  onOpenSearch,
  user,
  restoring,
  onOpenLogin,
  onOpenRegister,
  onLogout,
}: HeaderProps) {
  // El botón muestra la acción disponible: luna (pasar a oscuro) o sol (pasar a claro).
  const themeAction = theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro";
  // Luna (pasar a oscuro) cuando está claro, sol (pasar a claro) cuando está oscuro.
  const themeIcon = theme === "dark" ? "light_mode" : "dark_mode";
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Escape cierra el menú de navegación desplegable.
  useEffect(() => {
    if (!menuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      {/* TopNavBar */}
      <header className="w-full bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-md sticky top-0 z-50 shadow-sm border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-[1320px] mx-auto px-3 sm:px-6 md:px-8 flex items-center justify-between h-20 w-full gap-2 sm:gap-4">
          {/* Brand Logo NEXFIT */}
          <a
            className="flex items-center gap-3 shrink-0 group focus:outline-none focus:ring-2 focus:ring-secondary rounded-lg p-1"
            href="#"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-950 dark:bg-slate-800 flex items-center justify-center shadow-md relative overflow-hidden group-hover:scale-105 transition-transform duration-200">
              <svg
                className="w-6 h-6 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M4 19L11.5 5H14L6.5 19H4Z" fill="currentColor"></path>
                <path d="M12.5 19L20 5H17.5L10 19H12.5Z" fill="#FFFFFF"></path>
                <path
                  d="M6 14H18"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="2.5"
                ></path>
              </svg>
            </div>
            <div className="text-xl sm:text-2xl font-black font-headline-md tracking-tight select-none">
              <span className="text-slate-900 dark:text-white">NEX</span>
              <span className="text-primary">FIT</span>
            </div>
          </a>

          {/* Navigation Links (escritorio ancho) */}
          <nav className="hidden xl:flex items-center gap-4 2xl:gap-6">
            {NAV_LINKS.map((link) => (
              <a className={NAV_LINK_CLASS} href={link.href} key={link.href}>
                {link.label}
              </a>
            ))}
            <a
              className="text-primary font-bold text-sm border-b-2 border-primary pb-1 flex items-center gap-1.5"
              href="#catalogo"
            >
              Ofertas
              <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                SALE
              </span>
            </a>
          </nav>

          {/* Actions & Interactive Checkpoint / Theme Toggle */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Menú de navegación (móvil y tablet) */}
            <button
              aria-controls="mobile-nav"
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
              type="button"
              onClick={() => setMenuOpen((current) => !current)}
              className="xl:hidden p-2 text-slate-700 dark:text-slate-200 hover:text-primary rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
            >
              <span className="material-symbols-outlined text-[24px]" data-icon="menu">
                {menuOpen ? "close" : "menu"}
              </span>
            </button>

            {/* Buscador global (⌘K) */}
            <button
              aria-label="Abrir buscador"
              title="Buscar (⌘K)"
              type="button"
              onClick={onOpenSearch}
              className="p-2 text-slate-700 dark:text-slate-200 hover:text-primary rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
            >
              <span className="material-symbols-outlined text-[24px]" data-icon="search">
                search
              </span>
            </button>

            {/* CHECKPOINT: Theme Toggle (Claro / Oscuro) */}
            <button
              aria-label={themeAction}
              title={themeAction}
              type="button"
              onClick={onToggleTheme}
              className="hidden sm:flex items-center justify-center p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition-all shadow-sm cursor-pointer focus:outline-none"
              id="themeToggleBtn"
            >
              {/* Luna en modo claro · sol en modo oscuro (un solo icono a la vez) */}
              <span
                className={`material-symbols-outlined text-[20px] ${
                  theme === "dark" ? "text-amber-400" : "text-slate-700"
                }`}
                data-icon={themeIcon}
              >
                {themeIcon}
              </span>
            </button>

            {/* Favoritos: solo con sesión iniciada, para no saturar la cabecera */}
            {user && (
              <button
                aria-label="Favoritos"
                className="hidden sm:flex relative p-2 text-slate-700 dark:text-slate-200 hover:text-primary rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
              >
                <span className="material-symbols-outlined text-[24px]" data-icon="favorite">
                  favorite
                </span>
                <span className="absolute top-1 right-1 bg-primary text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
                  {favoritesCount}
                </span>
              </button>
            )}

            {/* Acceso: iniciar sesión y registro (o la cuenta abierta) */}
            {restoring ? (
              <div
                aria-label="Comprobando sesión"
                className="h-9 w-9 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse"
              />
            ) : user ? (
              <div className="flex items-center gap-1 sm:gap-1.5">
                <div
                  className="flex items-center gap-2 py-1.5 pl-1.5 pr-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  title={user.email}
                >
                  <span className="w-6 h-6 rounded-full bg-primary text-white text-[11px] font-black flex items-center justify-center select-none">
                    {getInitials(user.name)}
                  </span>
                  <span className="hidden md:inline text-xs font-bold text-slate-700 dark:text-slate-200 max-w-[110px] truncate">
                    {user.name.split(" ")[0]}
                  </span>
                </div>
                <button
                  aria-label="Cerrar sesión"
                  title="Cerrar sesión"
                  type="button"
                  onClick={onLogout}
                  className="p-2 text-slate-700 dark:text-slate-200 hover:text-primary rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
                >
                  <span className="material-symbols-outlined text-[22px]" data-icon="logout">
                    logout
                  </span>
                </button>
              </div>
            ) : (
              <>
                {/* Iniciar sesión */}
                <button
                  aria-label="Iniciar sesión"
                  type="button"
                  onClick={onOpenLogin}
                  className="hidden sm:flex items-center gap-2 px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-primary hover:text-primary transition-colors font-semibold text-xs focus:outline-none"
                >
                  <span className="material-symbols-outlined text-[20px]" data-icon="person">
                    person
                  </span>
                  <span className="hidden md:inline">Entrar</span>
                </button>
                {/* Registro */}
                <button
                  aria-label="Registro"
                  type="button"
                  onClick={onOpenRegister}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-xl bg-slate-900 dark:bg-primary text-white hover:bg-slate-800 dark:hover:bg-[#E04B16] transition-colors font-bold text-xs shadow-sm focus:outline-none"
                >
                  <span className="material-symbols-outlined text-[20px]" data-icon="person_add">
                    person_add
                  </span>
                  <span className="hidden md:inline">Registro</span>
                </button>
              </>
            )}

            {/* Carrito */}
            <button
              aria-label="Carrito de compras"
              className="relative flex items-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-primary dark:hover:bg-[#E04B16] text-white px-3 sm:px-4 py-2.5 rounded-xl transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-[21px]" data-icon="shopping_cart">
                shopping_cart
              </span>
              <span className="hidden lg:inline text-xs font-bold uppercase tracking-wider">
                Carrito
              </span>
              <span className="bg-primary dark:bg-white dark:text-slate-900 text-white text-[11px] font-extrabold px-1.5 py-0.5 rounded-full">
                {cartCount}
              </span>
            </button>
          </div>
        </div>

        {/* Menú de navegación desplegable (móvil y tablet) */}
        {menuOpen && (
          <div
            className="xl:hidden absolute inset-x-0 top-full bg-white dark:bg-[#0F172A] border-b border-slate-200 dark:border-slate-800 shadow-xl"
            id="mobile-nav"
          >
            <nav className="max-w-[1320px] mx-auto px-4 sm:px-6 md:px-8 py-3 flex flex-col">
              {NAV_LINKS.map((link) => (
                <a
                  className="py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-primary transition-colors border-b border-slate-100 dark:border-slate-800"
                  href={link.href}
                  key={link.href}
                  onClick={closeMenu}
                >
                  {link.label}
                </a>
              ))}
              <a
                className="py-2.5 text-sm font-bold text-primary flex items-center gap-2"
                href="#catalogo"
                onClick={closeMenu}
              >
                Ofertas
                <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  SALE
                </span>
              </a>
            </nav>

            {/* Acceso desde el menú: útil en móviles donde el botón se oculta */}
            <div className="max-w-[1320px] mx-auto px-4 sm:px-6 md:px-8 pb-4">
              {user ? (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-700 p-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-8 h-8 rounded-full bg-primary text-white text-xs font-black flex items-center justify-center shrink-0">
                      {getInitials(user.name)}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                        {user.name}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <button
                    className="text-xs font-bold text-primary hover:underline shrink-0"
                    onClick={() => {
                      closeMenu();
                      onLogout();
                    }}
                    type="button"
                  >
                    Cerrar sesión
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    className="flex-1 h-10 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-primary hover:text-primary transition-colors"
                    onClick={() => {
                      closeMenu();
                      onOpenLogin();
                    }}
                    type="button"
                  >
                    Iniciar sesión
                  </button>
                  <button
                    className="flex-1 h-10 rounded-xl bg-slate-900 dark:bg-primary text-white text-xs font-bold hover:bg-slate-800 dark:hover:bg-[#E04B16] transition-colors"
                    onClick={() => {
                      closeMenu();
                      onOpenRegister();
                    }}
                    type="button"
                  >
                    Registro
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
}
