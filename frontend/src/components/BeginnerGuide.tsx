// BeginnerGuide
// Generado automáticamente desde code.html y adaptado a JSX + TypeScript.

export function BeginnerGuide() {
  return (
    <>
      {/* Orientación para principiantes */}
      <section
        className="w-full max-w-[1320px] mx-auto px-4 sm:px-6 md:px-8 py-8"
        id="empezar-guia"
      >
        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-10 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 dark:bg-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-2">
                <span className="material-symbols-outlined text-[16px]" data-icon="lightbulb">
                  lightbulb
                </span>
                <span className="">Orientación Sin Estrés</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">
                ¿No sabes con qué deporte empezar?
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 max-w-2xl mt-1">
                Te ayudamos a elegir tu disciplina y la ropa adecuada sin tecnicismos raros.
              </p>
            </div>
            <button className="h-11 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-primary dark:hover:bg-[#E04B16] text-white font-bold text-xs inline-flex items-center gap-2 shadow-sm shrink-0 transition-transform active:scale-95 cursor-pointer">
              <span className="material-symbols-outlined text-[18px]" data-icon="quiz">
                quiz
              </span>
              <span className="">Test rápido de 1 minuto</span>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-primary/20 flex items-center justify-center text-primary">
                  <span
                    className="material-symbols-outlined text-[26px]"
                    data-icon="self_improvement"
                  >
                    self_improvement
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Quiero moverme a mi ritmo
                </h3>
                <p className="text-xs font-semibold text-primary">
                  Caminar, Yoga o Movilidad suave
                </p>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  Prendas holgadas o de compresión ligera con máxima suavidad al tacto. Mallas
                  elásticas que no aprietan.
                </p>
              </div>
              <a
                className="text-secondary dark:text-blue-400 hover:text-primary text-xs font-bold inline-flex items-center gap-1 pt-2 border-t border-slate-100 dark:border-slate-700"
                href="#/athleisure"
              >
                <span className="">Ver prendas suaves recomendadas</span>
                <span className="material-symbols-outlined text-[16px]" data-icon="arrow_forward">
                  arrow_forward
                </span>
              </a>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-secondary/20 flex items-center justify-center text-secondary dark:text-blue-400">
                  <span
                    className="material-symbols-outlined text-[26px]"
                    data-icon="fitness_center"
                  >
                    fitness_center
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Busco quemar energía
                </h3>
                <p className="text-xs font-semibold text-secondary dark:text-blue-400">
                  Fitness, Gimnasio o HIIT dinámico
                </p>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  Prendas con sujeción ergonómica adaptativa y tejidos de evaporación rápida para
                  entrenar fresco.
                </p>
              </div>
              <a
                className="text-secondary dark:text-blue-400 hover:text-primary text-xs font-bold inline-flex items-center gap-1 pt-2 border-t border-slate-100 dark:border-slate-700"
                href="#fitness"
              >
                <span className="">Ver equipamiento para gimnasio</span>
                <span className="material-symbols-outlined text-[16px]" data-icon="arrow_forward">
                  arrow_forward
                </span>
              </a>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-800 dark:text-white">
                  <span
                    className="material-symbols-outlined text-[26px]"
                    data-icon="directions_run"
                  >
                    directions_run
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Al aire libre y desconectar
                </h3>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Running ligero o Senderismo
                </p>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  Capas ligeras cortavientos y protección transpirable con detalles reflectantes
                  para mayor seguridad.
                </p>
              </div>
              <a
                className="text-secondary dark:text-blue-400 hover:text-primary text-xs font-bold inline-flex items-center gap-1 pt-2 border-t border-slate-100 dark:border-slate-700"
                href="#/running"
              >
                <span className="">Ver ropa para aire libre</span>
                <span className="material-symbols-outlined text-[16px]" data-icon="arrow_forward">
                  arrow_forward
                </span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
