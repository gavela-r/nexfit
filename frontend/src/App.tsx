// App
// Composición de la página NEXFIT: anuncio, cabecera, secciones y pie.
import { useEffect, useState } from "react";
import {
  addCartItem,
  addFavorite,
  getCart,
  getFavorites,
  removeFavorite,
  type CartItemInput,
} from "./api";
import { AnnouncementBar } from "./components/AnnouncementBar";
import { AuthModal } from "./components/AuthModal";
import { BeginnerGuide } from "./components/BeginnerGuide";
import { CatalogSection } from "./components/CatalogSection";
import { CategoriesSection } from "./components/CategoriesSection";
import { CollectionBanners } from "./components/CollectionBanners";
import { FooterSection } from "./components/FooterSection";
import { Header } from "./components/Header";
import { HeroSection } from "./components/HeroSection";
import { PillarsSection } from "./components/PillarsSection";
import { SearchOverlay } from "./components/SearchOverlay";
import { SupportBanner } from "./components/SupportBanner";
import { TechBanner } from "./components/TechBanner";
import { TrustBar } from "./components/TrustBar";
import { useAuth } from "./hooks/useAuth";
import { useTheme } from "./hooks/useTheme";

type AuthTab = "login" | "register";

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const { user, token, restoring, login, register, logout } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  // Compartido entre el buscador global y el campo del catálogo.
  const [catalogQuery, setCatalogQuery] = useState("");
  // Panel de acceso: abierto o cerrado y con qué pestaña se muestra.
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<AuthTab>("login");

  // Atajo global ⌘K / Ctrl+K para abrir y cerrar el buscador.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen((current) => !current);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // El contador sale del carrito real: de la cuenta o del invitado (X-Cart-Token).
  useEffect(() => {
    if (restoring) return;
    let active = true;
    void getCart(token ?? undefined)
      .then((cart) => {
        if (active) setCartCount(cart.count);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [token, restoring]);

  // Favoritos del usuario (tabla `favorites`): solo con sesión iniciada.
  useEffect(() => {
    if (!token) {
      setFavoriteIds([]);
      return;
    }
    let active = true;
    void getFavorites(token)
      .then((favorites) => {
        if (active) setFavoriteIds(favorites.productIds);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [token]);

  // Alta optimista: la UI responde al instante y el backend manda después.
  const handleAddToCart = (item: CartItemInput) => {
    setCartCount((current) => current + item.quantity);
    void addCartItem(item, token ?? undefined)
      .then((cart) => setCartCount(cart.count))
      .catch(() => setCartCount((current) => Math.max(0, current - item.quantity)));
  };

  // Marcar/desmarcar favorito (si no hay sesión, abre el panel de acceso).
  const handleToggleFavorite = (productId: string) => {
    if (!token) {
      openAuth("login");
      return;
    }

    const wasFavorite = favoriteIds.includes(productId);
    const optimistic = wasFavorite
      ? favoriteIds.filter((id) => id !== productId)
      : [...favoriteIds, productId];
    setFavoriteIds(optimistic);

    const request = wasFavorite ? removeFavorite(token, productId) : addFavorite(token, productId);

    void request
      .then((favorites) => setFavoriteIds(favorites.productIds))
      .catch(() => setFavoriteIds(favoriteIds));
  };

  // Elegir un resultado: filtra el catálogo con ese producto y lleva hasta él.
  const handleSelectSearch = (query: string) => {
    setCatalogQuery(query);
    setSearchOpen(false);
    window.setTimeout(() => {
      document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  // Abre el panel de acceso con la pestaña pedida (y cierra el buscador).
  function openAuth(tab: AuthTab) {
    setSearchOpen(false);
    setAuthTab(tab);
    setAuthOpen(true);
  }

  // Tras un acceso correcto el panel se cierra: la cabecera ya muestra la cuenta.
  const handleLogin = async (email: string, password: string) => {
    await login(email, password);
    setAuthOpen(false);
  };

  const handleRegister = async (name: string, email: string, password: string) => {
    await register(name, email, password);
    setAuthOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col w-full min-w-full bg-[#FFFFFF] dark:bg-[#0B1220] text-slate-900 dark:text-slate-100 antialiased font-body-md">
      <AnnouncementBar />
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        cartCount={cartCount}
        favoritesCount={favoriteIds.length}
        onOpenSearch={() => setSearchOpen(true)}
        user={user}
        restoring={restoring}
        onOpenLogin={() => openAuth("login")}
        onOpenRegister={() => openAuth("register")}
        onLogout={logout}
      />
      <main className="w-full flex-grow">
        <HeroSection />
        <CollectionBanners />
        <CategoriesSection />
        <BeginnerGuide />
        <CatalogSection
          onAddToCart={handleAddToCart}
          favoriteIds={favoriteIds}
          onToggleFavorite={handleToggleFavorite}
          query={catalogQuery}
          onQueryChange={setCatalogQuery}
        />
        <SupportBanner />
        <TechBanner />
        <PillarsSection />
        <TrustBar />
      </main>
      <FooterSection />
      <SearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectQuery={handleSelectSearch}
      />
      <AuthModal
        open={authOpen}
        initialTab={authTab}
        onClose={() => setAuthOpen(false)}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />
    </div>
  );
}
