// SupportBanner
// Generado automáticamente desde code.html y adaptado a JSX + TypeScript.

export function SupportBanner() {
  return (
    <>
      {/* Atención al Cliente & Soporte Banner */}
      <section className="w-full max-w-[1320px] mx-auto px-4 sm:px-6 md:px-8 py-4">
        <div className="bg-gradient-to-r from-white to-slate-50 dark:from-slate-800 dark:to-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 md:p-8 flex flex-col lg:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="flex items-start md:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-orange-100 dark:bg-primary/20 text-primary flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-[32px]" data-icon="support_agent">
                support_agent
              </span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-primary uppercase tracking-widest block">
                Atención al cliente personalizada
              </span>
              <h3 className="text-lg md:text-xl font-extrabold text-slate-900 dark:text-white">
                ¿Dudas con tu talla o qué prenda elegir?
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5">
                Nuestro equipo humano te asesora en minutos. Envíos 24/48h a toda España y cambios
                100% gratuitos.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0 w-full lg:w-auto">
            <button className="flex-1 sm:flex-initial h-11 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-primary dark:hover:bg-[#E04B16] text-white font-bold text-xs inline-flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer">
              <span
                className="material-symbols-outlined text-[18px] text-emerald-400"
                data-icon="chat"
              >
                chat
              </span>
              <span className="">Chat en Vivo</span>
            </button>
            <button className="flex-1 sm:flex-initial h-11 px-5 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-primary text-slate-700 dark:text-slate-200 font-bold text-xs inline-flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer">
              <span
                className="material-symbols-outlined text-[18px] text-secondary dark:text-blue-400"
                data-icon="straighten"
              >
                straighten
              </span>
              <span className="">Guía de Tallas</span>
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
