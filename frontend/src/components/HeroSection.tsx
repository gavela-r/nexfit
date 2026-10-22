// HeroSection
// Hero de campaña con vídeo HD: capa nítida en el centro y capa desenfocada
// de fondo que se mantiene sincronizada con la principal.
import { useEffect, useRef } from "react";

const BASE = import.meta.env.BASE_URL;
const VIDEO_DESKTOP = `${BASE}assets/hero-desktop.mp4`;
const VIDEO_MOBILE = `${BASE}assets/hero-mobile.mp4`;
const POSTER = `${BASE}assets/hero-poster.jpg`;
const MOBILE_QUERY = "(max-width: 767px)";

export function HeroSection() {
  const mainRef = useRef<HTMLVideoElement>(null);
  const blurRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const main = mainRef.current;
    const blur = blurRef.current;
    if (!main) return;

    const isMobile = window.matchMedia(MOBILE_QUERY).matches;

    // En vertical se usa el vídeo vertical y se omite el fondo desenfocado
    if (isMobile) {
      main.src = VIDEO_MOBILE;
      main.load();
    }

    const videos: HTMLVideoElement[] = [main, blur].filter((v): v is HTMLVideoElement =>
      Boolean(v),
    );

    const tryPlay = (video: HTMLVideoElement) => void video.play().catch(() => undefined);

    videos.forEach((video) => {
      video.muted = true;
      video.playsInline = true;
      tryPlay(video);
      video.addEventListener("loadeddata", () => tryPlay(video));
    });

    // Sincroniza el fondo desenfocado con el vídeo nítido
    const syncBlur = () => {
      if (blur && Math.abs(blur.currentTime - main.currentTime) > 0.25) {
        blur.currentTime = main.currentTime;
      }
    };
    main.addEventListener("timeupdate", syncBlur);

    // Si el navegador bloquea el autoplay, arranca con la primera interacción
    const EVENTS: string[] = ["scroll", "mousemove", "click", "touchstart"];
    const startOnFirstAction = () => {
      videos.forEach((video) => {
        if (video.paused) video.play().catch(() => undefined);
      });
      EVENTS.forEach((event) => window.removeEventListener(event, startOnFirstAction));
    };
    EVENTS.forEach((event) =>
      window.addEventListener(event, startOnFirstAction, { passive: true }),
    );

    return () => {
      main.removeEventListener("timeupdate", syncBlur);
      EVENTS.forEach((event) => window.removeEventListener(event, startOnFirstAction));
    };
  }, []);

  return (
    <>
      {/* 1. Hero Campaign Section with High-Definition Background Video */}
      <section className="relative w-full min-h-[580px] lg:min-h-[660px] flex items-center justify-center py-16 lg:py-24 border-b border-slate-800 overflow-hidden bg-slate-950 text-white">
        {/* Capa 1: el mismo vídeo ampliado y desenfocado, solo se nota fuera del ancho del contenido */}
        <div
          className="hidden md:block absolute inset-0 overflow-hidden z-0 pointer-events-none"
          id="hero-blur-layer"
        >
          <video
            ref={blurRef}
            autoPlay
            className="hero-video absolute inset-0 w-full h-full object-cover scale-125 blur-2xl"
            id="hero-blur-video"
            loop
            muted
            playsInline
            preload="auto"
            poster={POSTER}
          >
            <source src={VIDEO_DESKTOP} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-black/45"></div>
        </div>
        {/* Capa 2: vídeo nítido con el ancho del contenido (1365 px máx.) y toda la altura de la sección; en móvil ocupa toda la pantalla */}
        <div
          className="absolute inset-0 md:inset-x-auto md:inset-y-0 md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-[1365px] z-[5] overflow-hidden pointer-events-none"
          style={{
            WebkitMaskImage:
              "linear-gradient(to right, transparent, #000 2%, #000 98%, transparent)",
            maskImage: "linear-gradient(to right, transparent, #000 2%, #000 98%, transparent)",
          }}
        >
          <video
            ref={mainRef}
            autoPlay
            className="hero-video w-full h-full object-cover"
            id="hero-main-video"
            loop
            muted
            playsInline
            preload="auto"
            poster={POSTER}
          >
            <source src={VIDEO_DESKTOP} type="video/mp4" />
          </video>
        </div>
        {/* Capas oscuras: lado del texto y, en móvil, toda la pantalla */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/35 to-transparent z-10 pointer-events-none"></div>
        <div className="md:hidden absolute inset-0 bg-black/45 z-10 pointer-events-none"></div>
        {/* Content Container directly over the video */}
        <div className="relative z-20 max-w-[1320px] mx-auto px-4 sm:px-6 md:px-8 w-full">
          <div className="max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/20 border border-primary/40 text-primary text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              <span className="">Ropa técnica y cómoda para todos los niveles</span>
            </div>
            <h1 className="font-display-hero text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-extrabold tracking-tight uppercase leading-[1.1] text-white drop-shadow-sm">
              AQUÍ ENCUENTRAS LA ROPA{" "}
              <span className="text-primary underline decoration-primary/30 underline-offset-4">
                MÁS CÓMODA
              </span>{" "}
              Y DE MÁS CALIDAD.
            </h1>
            <p className="text-base sm:text-lg text-slate-200 max-w-xl leading-relaxed drop-shadow-sm">
              El deporte es para todos. Diseñamos prendas ultra cómodas y técnicas para que dar el
              primer paso sea lo más fácil de tu día. Sin tecnicismos raros, sin presiones y con
              tacto insuperable.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                className="h-12 px-7 rounded-xl bg-primary hover:bg-[#E04B16] text-white font-bold text-sm inline-flex items-center justify-center gap-2 shadow-lg shadow-primary/25 transition-all hover:scale-[1.02] active:scale-95"
                href="#catalogo"
              >
                <span className="">Explorar Tienda</span>
                <span className="material-symbols-outlined text-[20px]" data-icon="arrow_forward">
                  arrow_forward
                </span>
              </a>
              <a
                className="h-12 px-6 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold text-sm inline-flex items-center justify-center gap-2 backdrop-blur-md transition-all hover:scale-[1.02] active:scale-95 shadow-sm"
                href="#empezar-guia"
              >
                <span
                  className="material-symbols-outlined text-[20px] text-primary"
                  data-icon="assistant_direction"
                >
                  assistant_direction
                </span>
                <span className="">Guía para principiantes</span>
              </a>
            </div>
            {/* Feature Badges */}
            <div className="pt-6 border-t border-white/15 grid grid-cols-3 gap-4 max-w-md">
              <div>
                <p className="text-lg font-extrabold text-white">Ultra Suave</p>
                <p className="text-xs text-slate-300">Tacto segunda piel</p>
              </div>
              <div>
                <p className="text-lg font-extrabold text-white">Cero</p>
                <p className="text-xs text-slate-300">Rozaduras molestas</p>
              </div>
              <div>
                <p className="text-lg font-extrabold text-primary">100%</p>
                <p className="text-xs text-slate-300">Calidad probada</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
