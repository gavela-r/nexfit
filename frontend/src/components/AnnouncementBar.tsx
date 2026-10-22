// AnnouncementBar
// Generado automáticamente desde code.html y adaptado a JSX + TypeScript.

export function AnnouncementBar() {
  return (
    <>
      {/* Top Announcement Bar */}
      <aside className="w-full bg-slate-900 dark:bg-black text-white text-xs font-medium py-2 px-4 sm:px-6 md:px-8 tracking-wide z-50 border-b border-slate-800">
        <div className="max-w-[1320px] mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            <span className="truncate">
              ENVÍO GRATUITO EN PEDIDOS SUPERIORES A 50€ | TIENDA NEXFIT OFICIAL
            </span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-slate-400 text-xs">
            <span className="hover:text-white transition-colors cursor-pointer">
              Localizador de Tiendas
            </span>
            <span className="hover:text-white transition-colors cursor-pointer">Ayuda / FAQ</span>
            <span className="text-primary font-semibold">ES | EUR (€)</span>
          </div>
        </div>
      </aside>
    </>
  );
}
