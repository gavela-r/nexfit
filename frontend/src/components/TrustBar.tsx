// TrustBar
// Generado automáticamente desde code.html y adaptado a JSX + TypeScript.

export function TrustBar() {
  return (
    <>
      {/* Interactive Trust Bar */}
      <section className="w-full bg-slate-50 dark:bg-slate-900/60 border-y border-slate-200 dark:border-slate-800 py-10">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 md:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wide">
              <span className="material-symbols-outlined text-[16px]" data-icon="verified">
                verified
              </span>
              <span className="">Compromiso de Honestidad NEXFIT</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Ropa pensada para que solo te preocupes de empezar.
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Materiales de calidad, corte anatómico y asesoramiento cercano en cada paso.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
            <div className="flex items-center gap-2">
              <span
                className="material-symbols-outlined text-primary text-[20px]"
                data-icon="local_shipping"
              >
                local_shipping
              </span>
              <span className="">Envíos rápidos peninsulares</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="material-symbols-outlined text-emerald-500 text-[20px]"
                data-icon="published_with_changes"
              >
                published_with_changes
              </span>
              <span className="">Cambios sencillos</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="material-symbols-outlined text-secondary dark:text-blue-400 text-[20px]"
                data-icon="favorite"
              >
                favorite
              </span>
              <span className="">Confort garantizado</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
