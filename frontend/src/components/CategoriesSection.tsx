// CategoriesSection
// Generado automáticamente desde code.html y adaptado a JSX + TypeScript.

export function CategoriesSection() {
  return (
    <>
      {/* 3. MANTENER SECCIÓN DE CATEGORÍAS DEPORTIVAS: 6 DISCIPLINAS */}
      <section
        className="w-full max-w-[1320px] mx-auto px-4 sm:px-6 md:px-8 py-10 md:py-14"
        id="categorias"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-bold text-primary uppercase tracking-wider">
              Explora por disciplina
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1 font-headline-lg">
              Categorías Deportivas
            </h2>
          </div>
          <a
            className="text-secondary dark:text-blue-400 hover:text-primary font-semibold text-sm inline-flex items-center gap-1 group"
            href="#catalogo"
          >
            <span className="">Ver todas las disciplinas</span>
            <span
              className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform"
              data-icon="arrow_forward"
            >
              arrow_forward
            </span>
          </a>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* 1. Fitness / Gimnasio */}
          <a
            className="group relative rounded-2xl overflow-hidden aspect-[4/5] bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-end p-4 hover:shadow-lg transition-all"
            href="#fitness"
          >
            <div
              className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-500 ease-out opacity-85"
              style={{
                backgroundImage: "url('/assets/images/cat-fitness.jpg')",
              }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
            <div className="relative z-10 text-white">
              <h3 className="font-bold text-sm md:text-base group-hover:text-primary transition-colors">
                Fitness / Gimnasio
              </h3>
              <p className="text-[11px] text-slate-300">142 artículos</p>
            </div>
          </a>
          {/* 2. Running */}
          <a
            className="group relative rounded-2xl overflow-hidden aspect-[4/5] bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-end p-4 hover:shadow-lg transition-all"
            href="#running"
          >
            <div
              className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-500 ease-out opacity-85"
              style={{
                backgroundImage: "url('/assets/images/cat-running.jpg')",
              }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
            <div className="relative z-10 text-white">
              <h3 className="font-bold text-sm md:text-base group-hover:text-primary transition-colors">
                Running
              </h3>
              <p className="text-[11px] text-slate-300">89 artículos</p>
            </div>
          </a>
          {/* 3. Athleisure / Casual */}
          <a
            className="group relative rounded-2xl overflow-hidden aspect-[4/5] bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-end p-4 hover:shadow-lg transition-all"
            href="#athleisure"
          >
            <div
              className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-500 ease-out opacity-85"
              style={{
                backgroundImage: "url('/assets/images/cat-athleisure.jpg')",
              }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
            <div className="relative z-10 text-white">
              <h3 className="font-bold text-sm md:text-base group-hover:text-primary transition-colors">
                Athleisure / Casual
              </h3>
              <p className="text-[11px] text-slate-300">115 artículos</p>
            </div>
          </a>
          {/* 4. Fútbol */}
          <a
            className="group relative rounded-2xl overflow-hidden aspect-[4/5] bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-end p-4 hover:shadow-lg transition-all"
            href="#futbol"
          >
            <div
              className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-500 ease-out opacity-85"
              style={{
                backgroundImage: "url('/assets/images/cat-futbol.jpg')",
              }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
            <div className="relative z-10 text-white">
              <h3 className="font-bold text-sm md:text-base group-hover:text-primary transition-colors">
                Fútbol
              </h3>
              <p className="text-[11px] text-slate-300">64 artículos</p>
            </div>
          </a>
          {/* 5. CrossFit / Entrenamiento */}
          <a
            className="group relative rounded-2xl overflow-hidden aspect-[4/5] bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-end p-4 hover:shadow-lg transition-all"
            href="#crossfit"
          >
            <div
              className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-500 ease-out opacity-85"
              style={{
                backgroundImage: "url('/assets/images/cat-crossfit.jpg')",
              }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
            <div className="relative z-10 text-white">
              <h3 className="font-bold text-sm md:text-base group-hover:text-primary transition-colors">
                CrossFit / Entreno
              </h3>
              <p className="text-[11px] text-slate-300">78 artículos</p>
            </div>
          </a>
          {/* 6. Outdoor */}
          <a
            className="group relative rounded-2xl overflow-hidden aspect-[4/5] bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-end p-4 hover:shadow-lg transition-all"
            href="#outdoor"
          >
            <div
              className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-500 ease-out opacity-85"
              style={{
                backgroundImage: "url('/assets/images/cat-outdoor.jpg')",
              }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
            <div className="relative z-10 text-white">
              <h3 className="font-bold text-sm md:text-base group-hover:text-primary transition-colors">
                Outdoor
              </h3>
              <p className="text-[11px] text-slate-300">93 artículos</p>
            </div>
          </a>
        </div>
      </section>
    </>
  );
}
