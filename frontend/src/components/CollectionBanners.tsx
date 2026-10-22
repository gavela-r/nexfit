// CollectionBanners
// Generado automáticamente desde code.html y adaptado a JSX + TypeScript.

export function CollectionBanners() {
  return (
    <>
      {/* Twin Collection Banners (Hombre y Mujer) */}
      <section className="w-full max-w-[1320px] mx-auto px-4 sm:px-6 md:px-8 py-10 md:py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {/* Hombre Banner */}
          <div
            className="group relative rounded-2xl overflow-hidden min-h-[360px] lg:min-h-[400px] flex flex-col justify-end p-8 border border-slate-200 dark:border-slate-800 shadow-sm"
            id="hombre"
          >
            <div
              className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-500 ease-out"
              style={{
                backgroundImage: "url('/assets/images/banner-hombre.jpg')",
              }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent"></div>
            <div className="relative z-10 space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-primary">
                Colección Técnica
              </span>
              <h2 className="text-2xl lg:text-3xl font-extrabold text-white font-headline-lg">
                Colección Hombre
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-sm">
                Diseño ergonómico y máxima movilidad para entrenamientos de fuerza, running y HIIT.
              </p>
              <div className="pt-2">
                <a
                  className="h-10 px-5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs inline-flex items-center gap-2 shadow-sm transition-all"
                  href="#catalogo"
                >
                  <span className="">Ver Colección</span>
                  <span className="material-symbols-outlined text-[16px]" data-icon="north_east">
                    north_east
                  </span>
                </a>
              </div>
            </div>
          </div>
          {/* Mujer Banner */}
          <div
            className="group relative rounded-2xl overflow-hidden min-h-[360px] lg:min-h-[400px] flex flex-col justify-end p-8 border border-slate-200 dark:border-slate-800 shadow-sm"
            id="mujer"
          >
            <div
              className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-500 ease-out"
              style={{
                backgroundImage: "url('/assets/images/banner-mujer.jpg')",
              }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent"></div>
            <div className="relative z-10 space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-primary">
                Ajuste HyperMotion
              </span>
              <h2 className="text-2xl lg:text-3xl font-extrabold text-white font-headline-lg">
                Colección Mujer
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-sm">
                Sujeción de precisión sin rozaduras, mallas sin costuras y tops de soporte
                adaptativo.
              </p>
              <div className="pt-2">
                <a
                  className="h-10 px-5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs inline-flex items-center gap-2 shadow-sm transition-all"
                  href="#catalogo"
                >
                  <span className="">Ver Colección</span>
                  <span className="material-symbols-outlined text-[16px]" data-icon="north_east">
                    north_east
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
