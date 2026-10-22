// FooterSection
// Pie de página: marca, enlaces de navegación, newsletter y aviso legal.
import { useState, type FormEvent } from "react";

const NEWSLETTER_URL = import.meta.env.VITE_API_URL + "/api/newsletter/subscribe";

export function FooterSection() {
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");

  const handleSubscribe = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const email = new FormData(form).get("email");
    setStatus("loading");
    try {
      const res = await fetch(NEWSLETTER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("Suscripción rechazada");
      setStatus("ok");
      form.reset();
    } catch {
      setStatus("error");
    }
  };

  return (
    <>
      {/* SiteFooter */}
      <footer className="w-full bg-slate-950 dark:bg-black text-white border-t border-slate-800">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 md:px-8 py-14">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 pb-10 border-b border-slate-800">
            {/* Brand statement */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700">
                  <svg
                    className="w-5 h-5 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M4 19L11.5 5H14L6.5 19H4Z" fill="currentColor"></path>
                    <path d="M12.5 19L20 5H17.5L10 19H12.5Z" fill="#FFFFFF"></path>
                    <path
                      d="M6 14H18"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeWidth="2.5"
                    ></path>
                  </svg>
                </div>
                <span className="text-xl font-black text-white tracking-tight">
                  NEX<span className="text-primary">FIT</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                Ropa deportiva técnica diseñada en España. Materiales de alto rendimiento,
                sostenibilidad e innovación constante para atletas cotidianos.
              </p>
              <div className="flex items-center gap-3 text-slate-400 pt-2">
                <a
                  aria-label="Instagram"
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-white transition-colors"
                  href="#"
                >
                  <span className="material-symbols-outlined text-[18px]" data-icon="photo_camera">
                    photo_camera
                  </span>
                </a>
                <a
                  aria-label="YouTube"
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-white transition-colors"
                  href="#"
                >
                  <span className="material-symbols-outlined text-[18px]" data-icon="play_circle">
                    play_circle
                  </span>
                </a>
                <a
                  aria-label="TikTok"
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-white transition-colors"
                  href="#"
                >
                  <span className="material-symbols-outlined text-[18px]" data-icon="music_note">
                    music_note
                  </span>
                </a>
              </div>
            </div>
            {/* Links */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Colecciones</h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="">
                  <a className="hover:text-primary transition-colors" href="#hombre">
                    Hombre
                  </a>
                </li>
                <li className="">
                  <a className="hover:text-primary transition-colors" href="#mujer">
                    Mujer
                  </a>
                </li>
                <li className="">
                  <a className="hover:text-primary transition-colors" href="#catalogo">
                    SpeedSeries 2026
                  </a>
                </li>
                <li className="">
                  <a className="hover:text-primary transition-colors" href="#catalogo">
                    HyperMotion Seamless
                  </a>
                </li>
                <li className="">
                  <a className="text-primary font-bold" href="#catalogo">
                    Ofertas de Temporada
                  </a>
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Categorías</h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="">
                  <a className="hover:text-primary transition-colors" href="#fitness">
                    Fitness/Gym
                  </a>
                </li>
                <li className="">
                  <a className="hover:text-primary transition-colors" href="#running">
                    Running
                  </a>
                </li>
                <li className="">
                  <a className="hover:text-primary transition-colors" href="#athleisure">
                    Athleisure
                  </a>
                </li>
                <li className="">
                  <a className="hover:text-primary transition-colors" href="#crossfit">
                    CrossFit
                  </a>
                </li>
                <li className="">
                  <a className="hover:text-primary transition-colors" href="#outdoor">
                    Outdoor
                  </a>
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Ayuda</h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="">
                  <a className="hover:text-primary transition-colors" href="#">
                    Guía de Tallas Interactiva
                  </a>
                </li>
                <li className="">
                  <a className="hover:text-primary transition-colors" href="#">
                    Envíos y Entregas (24-48h)
                  </a>
                </li>
                <li className="">
                  <a className="hover:text-primary transition-colors" href="#">
                    Devoluciones Gratuitas
                  </a>
                </li>
                <li className="">
                  <a className="hover:text-primary transition-colors" href="#">
                    Preguntas Frecuentes
                  </a>
                </li>
              </ul>
            </div>
            {/* Newsletter */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Únete al Club
              </h4>
              <p className="text-xs text-slate-400">Recibe lanzamientos y consejos deportivos.</p>
              <form className="space-y-2" onSubmit={handleSubscribe}>
                <input
                  id="newsletter-email"
                  name="email"
                  aria-label="Tu correo electrónico"
                  className="w-full h-10 px-3 bg-slate-900 rounded-xl border border-slate-700 text-white placeholder:text-slate-500 text-xs focus:outline-none focus:border-primary"
                  placeholder="tu@email.com"
                  required
                  type="email"
                />
                <button
                  className="w-full h-10 bg-primary hover:bg-[#E04B16] text-white font-bold text-xs rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-60"
                  type="submit"
                  disabled={status === "loading"}
                >
                  {status === "loading" ? "Enviando…" : "Suscribirme"}
                </button>
                {status === "ok" && (
                  <p className="text-xs text-emerald-400">
                    ¡Gracias por suscribirte al Club NEXFIT!
                  </p>
                )}
                {status === "error" && (
                  <p className="text-xs text-red-400">No hemos podido completar la suscripción.</p>
                )}
              </form>
            </div>
          </div>
          {/* Bottom details */}
          <div className="pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
            <p className="">© 2026 NEXFIT Inc. Tienda oficial. Todos los derechos reservados.</p>
            <div className="flex items-center gap-4">
              <span className="hover:text-white cursor-pointer transition-colors">Aviso Legal</span>
              <span className="hover:text-white cursor-pointer transition-colors">Privacidad</span>
              <span className="hover:text-white cursor-pointer transition-colors">Términos</span>
              <span className="hover:text-white cursor-pointer transition-colors">Cookies</span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
