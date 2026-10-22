// App
// Composición de la página NEXFIT: anuncio, cabecera, secciones y pie.
import { useCallback, useEffect, useState } from "react";
import {
  addCartItem,
  addFavorite,
  getCart,
  getFavorites,
  removeCartItem,
  removeFavorite,
  updateCartItem,
  type CartItemInput,
  type CartItemView,
  type CartView,
} from "./api";
import { AnnouncementBar } from "./components/AnnouncementBar";
import { AuthModal } from "./components/AuthModal";
import { BeginnerGuide } from "./components/BeginnerGuide";
import { CartDrawer, cartLineKey } from "./components/CartDrawer";
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
import { Toast, type ToastData } from "./components/Toast";
import { TrustBar } from "./components/TrustBar";
import { useAuth } from "./hooks/useAuth";
import { useTheme } from "./hooks/useTheme";

type AuthTab = "login" | "register";

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const { user, token, restoring, login, register, logout } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  // Panel lateral de la cesta: abierto/cerrado, líneas reales y estado de red.
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<CartView | null>(null);
  const [cartLoading, setCartLoading] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);
  // Línea que está esperando respuesta del backend (bloquea sus botones).
  const [busyLine, setBusyLine] = useState<string | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  // Compartido entre el buscador global y el campo del catálogo.
  const [catalogQuery, setCatalogQuery] = useState("");
  // Panel de acceso: abierto o cerrado y con qué pestaña se muestra.
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<AuthTab>("login");
  // Aviso de bienvenida tras iniciar sesión o registrarse (abajo a la derecha).
  const [toast, setToast] = useState<ToastData | null>(null);
  const closeToast = useCallback(() => setToast(null), []);

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

  // Cesta completa: el panel lateral y el contador comparten esta lectura.
  const loadCart = useCallback(async () => {
    setCartLoading(true);
    try {
      const data = await getCart(token ?? undefined);
      setCart(data);
      setCartCount(data.count);
      setCartError(null);
    } catch {
      setCartError("No se pudo cargar la cesta. Comprueba que la API está en marcha.");
    } finally {
      setCartLoading(false);
    }
  }, [token]);

  // Al cargar la página o cambiar de sesión se refresca la cesta.
  useEffect(() => {
    if (restoring) return;
    void loadCart();
  }, [restoring, loadCart]);

  // Cada vez que se abre el panel se piden las líneas actualizadas.
  useEffect(() => {
    if (!cartOpen) return;
    void loadCart();
  }, [cartOpen, loadCart]);

  // Alta optimista: la UI responde al instante y el backend manda después.
  const handleAddToCart = (item: CartItemInput) => {
    setCartCount((current) => current + item.quantity);
    void addCartItem(item, token ?? undefined)
      .then((data) => {
        setCart(data);
        setCartCount(data.count);
        setCartError(null);
      })
      .catch(() => setCartCount((current) => Math.max(0, current - item.quantity)));
  };

  // Cambiar la cantidad de una línea (el backend la persiste al momento).
  const handleChangeQuantity = (item: CartItemView, quantity: number) => {
    const next = Math.min(99, Math.max(1, quantity));
    if (next === item.quantity) return;

    const key = cartLineKey(item);
    setBusyLine(key);
    setCartError(null);

    void updateCartItem(
      item.productId,
      { size: item.size, color: item.color, quantity: next },
      token ?? undefined,
    )
      .then((data) => {
        setCart(data);
        setCartCount(data.count);
      })
      .catch(() => setCartError("No se pudo actualizar la cantidad. Inténtalo de nuevo."))
      .finally(() => setBusyLine(null));
  };

  // Quitar la línea concreta (talla y color), no todas las del producto.
  const handleRemoveFromCart = (item: CartItemView) => {
    const key = cartLineKey(item);
    setBusyLine(key);
    setCartError(null);

    void removeCartItem(item.productId, token ?? undefined, { size: item.size, color: item.color })
      .then((data) => {
        setCart(data);
        setCartCount(data.count);
      })
      .catch(() => setCartError("No se pudo quitar la prenda de la cesta."))
      .finally(() => setBusyLine(null));
  };

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

  const closeCart = useCallback(() => setCartOpen(false), []);

  // «Explorar catálogo» desde la cesta vacía.
  const handleGoShopping = () => {
    setCartOpen(false);
    window.setTimeout(() => {
      document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  // No hay pasarela de pago: el pedido se simula y se avisa.
  const handleCheckout = (total: number) => {
    setCartOpen(false);
    setToast({
      id: Date.now(),
      title: "Pedido de demostración",
      message: `La pasarela de pago no está conectada. Importe simulado: ${total
        .toFixed(2)
        .replace(".", ",")} €.`,
    });
  };

  const handleViewDetails = () => {
    setToast({
      id: Date.now(),
      title: "Cesta detallada",
      message:
        "La vista detallada llegará con el checkout. De momento puedes gestionar todo desde el panel.",
    });
  };

  // Elegir un resultado: filtra el catálogo con ese producto y lleva hasta él.
  const handleSelectSearch = (query: string) => {
    setCatalogQuery(query);
    setSearchOpen(false);
    window.setTimeout(() => {
      document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  // Abre el panel de acceso con la pestaña pedida (cierra buscador y cesta).
  function openAuth(tab: AuthTab) {
    setSearchOpen(false);
    setCartOpen(false);
    setAuthTab(tab);
    setAuthOpen(true);
  }

  // Tras un acceso correcto el panel se cierra y se confirma con un aviso.
  const handleLogin = async (email: string, password: string, remember: boolean) => {
    const account = await login(email, password, remember);
    setAuthOpen(false);
    setToast({
      id: Date.now(),
      title: "Sesión iniciada correctamente",
      message: `¡Hola de nuevo, ${account.name}! Tu cuenta está conectada.`,
    });
  };

  const handleRegister = async (name: string, email: string, password: string) => {
    const account = await register(name, email, password);
    setAuthOpen(false);
    setToast({
      id: Date.now(),
      title: "¡Registro completado!",
      message: `Bienvenido a NEXFIT, ${account.name}. Tu cuenta ya está activa.`,
    });
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
        onOpenCart={() => setCartOpen(true)}
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
      <CartDrawer
        busyLine={busyLine}
        cart={cart}
        error={cartError}
        favoriteIds={favoriteIds}
        isAuthenticated={Boolean(token)}
        loading={cartLoading}
        onAddUpsell={handleAddToCart}
        onCheckout={handleCheckout}
        onClose={closeCart}
        onGoShopping={handleGoShopping}
        onOpenAuth={() => openAuth("login")}
        onQuantityChange={handleChangeQuantity}
        onRemove={handleRemoveFromCart}
        onRetry={() => void loadCart()}
        onToggleFavorite={handleToggleFavorite}
        onViewDetails={handleViewDetails}
        open={cartOpen}
      />
      <AuthModal
        open={authOpen}
        initialTab={authTab}
        onClose={() => setAuthOpen(false)}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />
      <Toast toast={toast} onClose={closeToast} />
    </div>
  );
}
