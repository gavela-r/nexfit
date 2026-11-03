// App
// Composición de la página NEXFIT: anuncio, cabecera, secciones y pie.
import { useCallback, useEffect, useState } from "react";
import {
  addCartItem,
  addFavorite,
  ApiRequestError,
  createCheckoutSession,
  validateCoupon,
  getCart,
  getFavorites,
  removeCartItem,
  removeFavorite,
  updateCartItem,
  type CartItemInput,
  type CartItemView,
  type CartView,
  type Coupon,
} from "./api";
import { AnnouncementBar } from "./components/AnnouncementBar";
import { AccountDrawer } from "./components/AccountDrawer";
import { AuthModal } from "./components/AuthModal";
import { BeginnerGuide } from "./components/BeginnerGuide";
import { CartDrawer, cartLineKey } from "./components/CartDrawer";
import { CatalogSection } from "./components/CatalogSection";
import { ClubPage } from "./components/ClubPage";
import { CategoriesSection } from "./components/CategoriesSection";
import { CollectionBanners } from "./components/CollectionBanners";
import { FavoritesPage } from "./components/FavoritesPage";
import { FooterSection } from "./components/FooterSection";
import { Header } from "./components/Header";
import { HeroSection } from "./components/HeroSection";
import { OrderResultPage } from "./components/OrderResultPage";
import { OrdersPage } from "./components/OrdersPage";
import { ProfilePage } from "./components/ProfilePage";
import { PillarsSection } from "./components/PillarsSection";
import { ProductPage } from "./components/ProductPage";
import { RecentlyViewedPage } from "./components/RecentlyViewedPage";
import { ReturnsPage } from "./components/ReturnsPage";
import { ReviewsPage } from "./components/ReviewsPage";
import { SearchOverlay } from "./components/SearchOverlay";
import { SizesOnboarding } from "./components/SizesOnboarding";
import { SupportBanner } from "./components/SupportBanner";
import { TechBanner } from "./components/TechBanner";
import { Toast, type ToastData } from "./components/Toast";
import { TrustBar } from "./components/TrustBar";
import { CollectionCatalogPage } from "./components/CollectionCatalogPage";
import {
  ALL_CATALOG,
  ATHLEISURE_CATALOG,
  CROSSFIT_CATALOG,
  FITNESS_CATALOG,
  FOOTBALL_CATALOG,
  MEN_CATALOG,
  OUTDOOR_CATALOG,
  RUNNING_CATALOG,
  WOMEN_CATALOG,
  type CatalogConfig,
} from "./data/catalogs";
import { useAuth } from "./hooks/useAuth";
import { useHashRoute, type Page } from "./hooks/useHashRoute";
import { useScrollReveal } from "./hooks/useScrollReveal";
import { useTheme } from "./hooks/useTheme";
import { UserSizesContext } from "./utils/sizes";

type AuthTab = "login" | "register";

/** Páginas de catálogo y la configuración que pinta cada una. */
const CATALOG_PAGES: Partial<Record<Page, CatalogConfig>> = {
  hombre: MEN_CATALOG,
  mujer: WOMEN_CATALOG,
  futbol: FOOTBALL_CATALOG,
  fitness: FITNESS_CATALOG,
  crossfit: CROSSFIT_CATALOG,
  outdoor: OUTDOOR_CATALOG,
  running: RUNNING_CATALOG,
  athleisure: ATHLEISURE_CATALOG,
  catalogo: ALL_CATALOG,
};

/** Lleva hasta una sección de la portada (cambiando de página si hace falta). */
function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const { user, token, restoring, login, register, logout, updateUser } = useAuth();
  const { page, anchor, productId } = useHashRoute();
  const catalogConfig = CATALOG_PAGES[page];
  // Secciones y rejillas aparecen con animación al entrar en pantalla.
  useScrollReveal();

  // Al cambiar de página: arriba del todo, o a la sección pedida por el ancla.
  useEffect(() => {
    if (page === "home" && anchor) {
      window.setTimeout(() => scrollToSection(anchor), 0);
    } else {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
    // Solo al cambiar de página (o de producto): los anclas de la portada los resuelve el navegador.
  }, [page, productId]);

  const [cartCount, setCartCount] = useState(0);
  // Panel lateral de la cesta: abierto/cerrado, líneas reales y estado de red.
  const [cartOpen, setCartOpen] = useState(false);
  // Panel lateral de la cuenta (se abre al pulsar el nombre en la cabecera).
  const [accountOpen, setAccountOpen] = useState(false);
  // Paso opcional «¿Qué talla usas?» justo después de registrarse.
  const [sizesPromptOpen, setSizesPromptOpen] = useState(false);
  const closeSizesPrompt = useCallback(() => setSizesPromptOpen(false), []);
  const [cart, setCart] = useState<CartView | null>(null);
  const [cartLoading, setCartLoading] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);
  // Línea que está esperando respuesta del backend (bloquea sus botones).
  const [busyLine, setBusyLine] = useState<string | null>(null);
  // Mientras se crea la sesión de Stripe el botón de pago queda bloqueado.
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  // Cupón escrito en la cesta (MOVE15). Sin él, con sesión se aplica CLUB10.
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  // Compartido entre el buscador global y el campo del catálogo.
  const [catalogQuery, setCatalogQuery] = useState("");
  // Panel de acceso: abierto o cerrado y con qué pestaña se muestra.
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<AuthTab>("login");
  // Si se intenta tramitar sin sesión, tras entrar se vuelve a abrir la cesta.
  const [resumeCartAfterAuth, setResumeCartAfterAuth] = useState(false);
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
  // Si el backend la rechaza (p. ej. sin stock) se deshace y se explica el motivo.
  // Devuelve si se añadió, para que el botón solo diga «¡Añadido!» cuando es verdad.
  const handleAddToCart = async (item: CartItemInput): Promise<boolean> => {
    setCartCount((current) => current + item.quantity);
    try {
      const data = await addCartItem(item, token ?? undefined);
      setCart(data);
      setCartCount(data.count);
      setCartError(null);
      return true;
    } catch (error) {
      setCartCount((current) => Math.max(0, current - item.quantity));
      setToast({
        id: Date.now(),
        title: "No se pudo añadir a la cesta",
        tone: "error",
        message:
          error instanceof ApiRequestError
            ? error.message
            : "Comprueba tu conexión e inténtalo de nuevo.",
      });
      return false;
    }
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
      .catch((error: unknown) =>
        setCartError(
          error instanceof ApiRequestError
            ? error.message
            : "No se pudo actualizar la cantidad. Inténtalo de nuevo.",
        ),
      )
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
  const closeAccount = useCallback(() => setAccountOpen(false), []);

  // «Explorar catálogo» desde la cesta vacía.
  // En una página de colección se queda allí; en la portada baja al catálogo.
  const handleGoShopping = () => {
    setCartOpen(false);
    if (page === "home") window.setTimeout(() => scrollToSection("catalogo"), 100);
  };

  // Pago con Stripe Checkout: el backend crea el pedido y devuelve la URL de la
  // página de pago; Stripe vuelve después a #/pedido/confirmado o #/pedido/cancelado.
  // Sin sesión no se puede tramitar: se pide acceso primero.
  const handleCheckout = async () => {
    if (!token) {
      setResumeCartAfterAuth(true);
      openAuth("login");
      return;
    }

    setCheckoutLoading(true);
    try {
      const { url } = await createCheckoutSession(token, coupon?.code);
      window.location.assign(url);
    } catch (error) {
      setCheckoutLoading(false);
      setToast({
        id: Date.now(),
        title: "No se pudo iniciar el pago",
        tone: "error",
        message:
          error instanceof ApiRequestError
            ? [error.message, ...error.details].join(". ")
            : "Comprueba tu conexión e inténtalo de nuevo.",
      });
    }
  };

  // Si se vuelve atrás desde Stripe, el navegador puede restaurar la página
  // tal cual (bfcache) con el botón aún bloqueado.
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) setCheckoutLoading(false);
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  // El cupón se valida contra la cuenta (p. ej. MOVE15 solo en el primer pedido).
  const handleApplyCoupon = async (code: string): Promise<string | null> => {
    if (!token) return "Inicia sesión para usar un código";
    try {
      setCoupon(await validateCoupon(token, code));
      return null;
    } catch (error) {
      return error instanceof ApiRequestError ? error.message : "No se pudo comprobar el código";
    }
  };

  // Al cambiar de cuenta (o cerrar sesión) el cupón deja de valer.
  useEffect(() => {
    setCoupon(null);
  }, [token]);

  const handleOrderConfirmed = useCallback(() => {
    setCoupon(null);
    setCheckoutLoading(false);
    void loadCart();
  }, [loadCart]);

  const handleViewDetails = () => {
    setToast({
      id: Date.now(),
      title: "Cesta detallada",
      message:
        "La vista detallada llegará con el checkout. De momento puedes gestionar todo desde el panel.",
    });
  };

  // Elegir un resultado del buscador abre la ficha de ese producto.
  const handleSelectSearch = (productId: string) => {
    setSearchOpen(false);
    window.location.hash = `#/producto/${productId}`;
  };

  // Abre el panel de acceso con la pestaña pedida (cierra buscador y cesta).
  function openAuth(tab: AuthTab) {
    setSearchOpen(false);
    setCartOpen(false);
    setAccountOpen(false);
    setAuthTab(tab);
    setAuthOpen(true);
  }

  // Tras un acceso correcto el panel se cierra y se confirma con un aviso.
  const handleLogin = async (email: string, password: string, remember: boolean) => {
    const account = await login(email, password, remember);
    setAuthOpen(false);
    if (resumeCartAfterAuth) {
      setResumeCartAfterAuth(false);
      setCartOpen(true);
    }
    setToast({
      id: Date.now(),
      title: "Sesión iniciada correctamente",
      message: `¡Hola de nuevo, ${account.name}! Tu cuenta está conectada.`,
    });
  };

  const handleRegister = async (name: string, email: string, password: string) => {
    const account = await register(name, email, password);
    setAuthOpen(false);
    if (resumeCartAfterAuth) {
      // Venía de tramitar el pedido: vuelve a la cesta (las tallas, otro día).
      setResumeCartAfterAuth(false);
      setCartOpen(true);
    } else {
      setSizesPromptOpen(true);
    }
    setToast({
      id: Date.now(),
      title: "¡Registro completado!",
      message: `Bienvenido a NEXFIT, ${account.name}. Tu cuenta ya está activa.`,
    });
  };

  return (
    // Las tarjetas y la ficha leen de aquí la talla habitual del usuario.
    <UserSizesContext.Provider value={user?.sizes ?? null}>
      <div className="min-h-screen flex flex-col w-full min-w-full bg-[#FFFFFF] dark:bg-[#0B1220] text-slate-900 dark:text-slate-100 antialiased font-body-md">
        <AnnouncementBar />
        <Header
          currentPage={page}
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
          onOpenAccount={() => setAccountOpen(true)}
          onLogout={logout}
        />
        <main className="w-full flex-grow">
          {catalogConfig ? (
            // La key reinicia filtros y página al pasar de una colección a otra.
            <CollectionCatalogPage
              key={page}
              config={catalogConfig}
              onAddToCart={handleAddToCart}
              favoriteIds={favoriteIds}
              onToggleFavorite={handleToggleFavorite}
            />
          ) : page === "favoritos" ? (
            <FavoritesPage
              favoriteIds={favoriteIds}
              onAddToCart={handleAddToCart}
              onOpenLogin={() => openAuth("login")}
              onToggleFavorite={handleToggleFavorite}
              restoring={restoring}
              user={user}
            />
          ) : page === "cuenta-perfil" ? (
            <ProfilePage
              onOpenLogin={() => openAuth("login")}
              onUserUpdated={updateUser}
              restoring={restoring}
              token={token}
              user={user}
            />
          ) : page === "cuenta-pedidos" ? (
            <OrdersPage
              onOpenLogin={() => openAuth("login")}
              restoring={restoring}
              token={token}
              user={user}
            />
          ) : page === "producto" ? (
            <ProductPage
              favoriteIds={favoriteIds}
              onAddToCart={handleAddToCart}
              onOpenCart={() => setCartOpen(true)}
              onOpenLogin={() => openAuth("login")}
              onToggleFavorite={handleToggleFavorite}
              productId={productId}
              token={token}
              user={user}
            />
          ) : page === "cuenta-devoluciones" ? (
            <ReturnsPage
              onOpenLogin={() => openAuth("login")}
              restoring={restoring}
              token={token}
              user={user}
            />
          ) : page === "cuenta-resenas" ? (
            <ReviewsPage
              onOpenLogin={() => openAuth("login")}
              restoring={restoring}
              token={token}
              user={user}
            />
          ) : page === "cuenta-vistos" ? (
            <RecentlyViewedPage
              favoriteIds={favoriteIds}
              onAddToCart={handleAddToCart}
              onOpenLogin={() => openAuth("login")}
              onToggleFavorite={handleToggleFavorite}
              restoring={restoring}
              user={user}
            />
          ) : page === "cuenta-club" ? (
            <ClubPage
              onOpenLogin={() => openAuth("login")}
              restoring={restoring}
              token={token}
              user={user}
            />
          ) : page === "pedido-confirmado" || page === "pedido-cancelado" ? (
            <OrderResultPage
              result={page === "pedido-confirmado" ? "confirmado" : "cancelado"}
              token={token}
              restoring={restoring}
              onConfirmed={handleOrderConfirmed}
              onOpenCart={() => setCartOpen(true)}
              onOpenLogin={() => openAuth("login")}
            />
          ) : (
            <>
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
            </>
          )}
        </main>
        <FooterSection />
        <SearchOverlay
          open={searchOpen}
          onClose={() => setSearchOpen(false)}
          onSelectProduct={handleSelectSearch}
        />
        <AccountDrawer
          cartCount={cartCount}
          currentPage={page}
          favoritesCount={favoriteIds.length}
          onClose={closeAccount}
          onLogout={logout}
          onOpenCart={() => setCartOpen(true)}
          open={accountOpen}
          user={user}
        />
        <CartDrawer
          busyLine={busyLine}
          cart={cart}
          error={cartError}
          favoriteIds={favoriteIds}
          isAuthenticated={Boolean(token)}
          loading={cartLoading}
          onAddUpsell={handleAddToCart}
          onCheckout={() => void handleCheckout()}
          checkoutLoading={checkoutLoading}
          coupon={coupon}
          onApplyCoupon={handleApplyCoupon}
          onRemoveCoupon={() => setCoupon(null)}
          onClose={closeCart}
          onGoShopping={handleGoShopping}
          onOpenAuth={() => {
            setResumeCartAfterAuth(true);
            openAuth("login");
          }}
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
          onClose={() => {
            setAuthOpen(false);
            setResumeCartAfterAuth(false);
          }}
          onLogin={handleLogin}
          onRegister={handleRegister}
        />
        <SizesOnboarding
          onClose={closeSizesPrompt}
          onSaved={updateUser}
          open={sizesPromptOpen && Boolean(user)}
          token={token}
          userName={user?.name ?? ""}
        />
        <Toast toast={toast} onClose={closeToast} />
      </div>
    </UserSizesContext.Provider>
  );
}
