// App
// Composición de la página NEXFIT: anuncio, cabecera, secciones y pie.
import { useEffect, useState } from "react";
import { addCartItem, type CartItemInput } from "./api";
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

// La cesta arranca vacía y crece con cada «Añadir»; los favoritos empiezan en 0
// hasta que se marque el primer producto (tabla `favorites`).
const INITIAL_CART_COUNT = 0;
const FAVORITES_COUNT = 0;

type AuthTab = "login" | "register";

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const { user, restoring, login, register, logout } = useAuth();
  const [cartCount, setCartCount] = useState(INITIAL_CART_COUNT);
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

  // Alta optimista: la UI responde al instante y el backend se sincroniza en segundo plano.
  const handleAddToCart = (item: CartItemInput) => {
    setCartCount((current) => current + item.quantity);
    void addCartItem(item).catch(() => undefined);
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
  const openAuth = (tab: AuthTab) => {
    setSearchOpen(false);
    setAuthTab(tab);
    setAuthOpen(true);
  };

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
        favoritesCount={FAVORITES_COUNT}
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
