// TechBanner
// Generado automáticamente desde code.html y adaptado a JSX + TypeScript.
import { useState } from "react";
export function TechBanner() {
  const [copied, setCopied] = useState(false);

  const handleCopyCoupon = async () => {
    try {
      await navigator.clipboard.writeText("MOVE15");
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.alert("No se pudo copiar el código");
    }
  };
  return (
    <>
      {/* Innovation & Tech Banner */}
      <section className="w-full bg-slate-950 dark:bg-black text-white py-16 md:py-20 relative overflow-hidden my-10 border-y border-slate-800">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-secondary/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 md:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/20 border border-secondary/40 text-blue-300 text-xs font-semibold">
                <span className="material-symbols-outlined text-[16px]" data-icon="eco">
                  eco
                </span>
                <span className="">Innovación Textil Sostenible NEX-Breathe™</span>
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight">
                Ingeniería que responde a cada pulsación de tu cuerpo.
              </h2>
              <p className="text-sm md:text-base text-slate-300 max-w-xl">
                Microfibras hidrófugas de secado rápido con poliéster reciclado post-consumo. Máxima
                transpirabilidad en tus sesiones más exigentes, reduciendo el impacto ambiental en
                un 42%.
              </p>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 max-w-lg backdrop-blur-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-slate-400 block">
                    Cupón de bienvenida exclusivo:
                  </span>
                  <span className="text-sm font-bold text-primary">15% de descuento adicional</span>
                </div>
                <div className="flex items-center gap-2 bg-black/60 border border-primary/60 px-3.5 py-2 rounded-xl">
                  <span className="font-mono font-bold tracking-widest text-white">MOVE15</span>
                  <button
                    type="button"
                    className="text-primary hover:text-white transition-colors p-1 cursor-pointer"
                    title="Copiar código"
                    aria-label="Copiar código MOVE15"
                    onClick={handleCopyCoupon}
                  >
                    <span
                      className="material-symbols-outlined text-[18px]"
                      data-icon={copied ? "check" : "content_copy"}
                    >
                      {copied ? "check" : "content_copy"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-3xl overflow-hidden border border-white/15 shadow-2xl bg-white/5 backdrop-blur-md p-6 space-y-6">
                <div className="aspect-video rounded-2xl overflow-hidden relative">
                  <div
                    className="w-full h-full bg-cover bg-center"
                    style={{
                      backgroundImage:
                        "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCiLVuXoatinfddKhMi_GX-4BDTIz51v1f7JhD18JWHXhXeUHayjAZ7fpaJQJqb3JLrH9PK8RKbhurvmvtBhFOQw4dDAt-wIamb0joTVfGM2V8BnJNMXkq9rNeBmC-tRX-HooW0ehKkQUo3hDxg8X3viREpbsoqSJrCW5mys5F_57RKBDCxCZIo4sO9sMkqsX2wK0JzVuqAd4UvwgL-Uh4LYEwP2lmgSQE8TDChsQFP3Hw5uTg5kWr3')",
                    }}
                  ></div>
                  <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[11px] font-mono text-white">
                    Micro-Ventilated Grid 2.0
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                    <span
                      className="material-symbols-outlined text-blue-400 text-[24px]"
                      data-icon="air"
                    >
                      air
                    </span>
                    <h4 className="text-sm font-bold text-white mt-1">3.2x Flujo de Aire</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">Disipación térmica</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                    <span
                      className="material-symbols-outlined text-primary text-[24px]"
                      data-icon="water_drop"
                    >
                      water_drop
                    </span>
                    <h4 className="text-sm font-bold text-white mt-1">DryTech Pro</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">Evaporación rápida</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
