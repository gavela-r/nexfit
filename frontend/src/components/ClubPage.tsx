// ClubPage
// Club NEXFIT y cupones (#/cuenta/club): puntos (1 por cada euro de pedidos
// pagados), nivel con su progreso, cupones disponibles y de dónde salen los puntos.
// Los puntos se calculan a partir de GET /api/orders: no hay saldo guardado aparte.
import { useEffect, useState } from "react";
import {
  getCoupons,
  getOrders,
  type AuthUser,
  type Coupon,
  type CouponStatus,
  type OrderView,
} from "../api";
import { formatPrice } from "../utils/format";
import { AccountLayout } from "./AccountLayout";

interface ClubPageProps {
  user: AuthUser | null;
  token: string | null;
  restoring: boolean;
  onOpenLogin: () => void;
}

/** Pedidos que suman puntos (los pendientes y cancelados no cuentan). */
const EARNING = new Set<OrderView["status"]>(["pagado", "enviado", "entregado"]);

const LEVELS = [
  { name: "Bronce", from: 0, icon: "military_tech", color: "from-amber-700 to-amber-500" },
  { name: "Plata", from: 250, icon: "workspace_premium", color: "from-slate-500 to-slate-300" },
  { name: "Oro", from: 750, icon: "diamond", color: "from-yellow-500 to-amber-300" },
] as const;

/** Etiqueta y colores del estado de cada cupón (GET /api/coupons). */
const COUPON_STATUS: Record<CouponStatus, { label: string; className: string }> = {
  activo: {
    label: "Activo · automático",
    className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
  disponible: {
    label: "Disponible · úsalo en la cesta",
    className: "bg-orange-50 text-primary dark:bg-primary/15",
  },
  usado: {
    label: "Ya usado",
    className: "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300",
  },
  no_disponible: {
    label: "Solo en el primer pedido",
    className: "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300",
  },
};

export function ClubPage({ user, token, restoring, onOpenLogin }: ClubPageProps) {
  const [orders, setOrders] = useState<OrderView[] | null>(null);
  const [coupons, setCoupons] = useState<(Coupon & { status: CouponStatus })[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let active = true;
    void getOrders(token)
      .then((data) => {
        if (active) setOrders(data);
      })
      .catch(() => {
        if (active) setOrders([]);
      });
    void getCoupons(token)
      .then((data) => {
        if (active) setCoupons(data);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [token]);

  const earning = (orders ?? []).filter((order) => EARNING.has(order.status));
  const points = earning.reduce((sum, order) => sum + Math.floor(order.total), 0);
  const saved = earning.reduce((sum, order) => sum + order.discount, 0);

  const levelIndex = LEVELS.reduce(
    (found, level, index) => (points >= level.from ? index : found),
    0,
  );
  const level = LEVELS[levelIndex];
  const next = LEVELS[levelIndex + 1];
  const progress = next
    ? Math.round(((points - level.from) / (next.from - level.from)) * 100)
    : 100;

  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      window.setTimeout(() => setCopied(null), 1800);
    } catch {
      setCopied(null);
    }
  };

  return (
    <AccountLayout
      onOpenLogin={onOpenLogin}
      restoring={restoring}
      section="club"
      subtitle="Cada euro que gastas suma un punto. Sube de nivel y aprovecha tus descuentos."
      title="Club NEXFIT y cupones"
      user={user}
    >
      {!orders ? (
        <div className="h-64 animate-pulse rounded-2xl bg-white dark:bg-slate-800/60" />
      ) : (
        <div className="space-y-6">
          {/* Tarjeta de socio */}
          <section
            className="auth-panel relative overflow-hidden rounded-2xl p-6 text-white shadow-lg md:p-8"
            data-reveal="zoom"
          >
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Socio NEXFIT
                </p>
                <p className="mt-1 font-headline text-2xl font-extrabold">{user?.name}</p>
                <span
                  className={`mt-3 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r ${level.color} px-3 py-1 text-xs font-extrabold text-slate-950`}
                >
                  <span className="material-symbols-outlined text-[16px]">{level.icon}</span>
                  Nivel {level.name}
                </span>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Puntos</p>
                <p className="font-headline text-4xl font-black tabular-nums text-primary">
                  {points.toLocaleString("es-ES")}
                </p>
              </div>
            </div>

            <div className="mt-7">
              <div className="flex justify-between text-[11px] font-semibold text-slate-300">
                <span>{level.name}</span>
                <span>{next ? `${next.name} · ${next.from} pts` : "Nivel máximo"}</span>
              </div>
              <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-700"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-300">
                {next
                  ? `Te faltan ${next.from - points} puntos para el nivel ${next.name}.`
                  : "Has alcanzado el nivel más alto del Club. ¡Gracias por confiar en NEXFIT!"}
              </p>
            </div>
          </section>

          {/* Resumen */}
          <dl className="grid grid-cols-3 gap-3" data-reveal-stagger>
            {[
              { label: "Pedidos con puntos", value: String(earning.length), icon: "receipt_long" },
              { label: "Ahorrado en descuentos", value: formatPrice(saved), icon: "savings" },
              { label: "Nivel actual", value: level.name, icon: level.icon },
            ].map((stat) => (
              <div
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/90"
                key={stat.label}
              >
                <dt className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <span className="material-symbols-outlined text-[16px] text-primary">
                    {stat.icon}
                  </span>
                  {stat.label}
                </dt>
                <dd className="mt-1 text-lg font-extrabold tabular-nums text-slate-900 dark:text-white md:text-xl">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>

          {/* Cupones */}
          <section data-reveal>
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Tus cupones
            </h2>
            <ul className="mt-3 space-y-3">
              {coupons.map((coupon) => {
                const status = COUPON_STATUS[coupon.status];
                const usable = coupon.status === "activo" || coupon.status === "disponible";
                return (
                  <li
                    className={`flex flex-wrap items-center gap-4 rounded-2xl border border-dashed bg-white p-5 shadow-sm dark:bg-slate-800/90 ${
                      usable
                        ? "border-primary/50"
                        : "border-slate-300 opacity-70 dark:border-slate-600"
                    }`}
                    key={coupon.code}
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-primary dark:bg-primary/15">
                      <span className="material-symbols-outlined text-[26px]">sell</span>
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-extrabold text-slate-900 dark:text-white">
                        {coupon.title}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {coupon.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${status.className}`}
                      >
                        {status.label}
                      </span>
                      <button
                        aria-label={`Copiar código ${coupon.code}`}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 font-mono text-sm font-bold tracking-widest text-slate-800 transition-colors hover:border-primary hover:text-primary dark:border-slate-600 dark:text-slate-100"
                        onClick={() => void copy(coupon.code)}
                        type="button"
                      >
                        {coupon.code}
                        <span className="material-symbols-outlined text-[16px]">
                          {copied === coupon.code ? "check" : "content_copy"}
                        </span>
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Cómo funciona y niveles */}
          <section className="grid gap-4 md:grid-cols-3" data-reveal-stagger>
            {LEVELS.map((item, index) => {
              const reached = points >= item.from;
              return (
                <div
                  className={`rounded-2xl border p-5 shadow-sm ${
                    index === levelIndex
                      ? "border-primary bg-orange-50/60 dark:bg-primary/10"
                      : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800/90"
                  }`}
                  key={item.name}
                >
                  <span
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${item.color} text-slate-950`}
                  >
                    <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                  </span>
                  <p className="mt-3 font-extrabold text-slate-900 dark:text-white">
                    Nivel {item.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {item.from === 0 ? "Desde tu primer pedido" : `Desde ${item.from} puntos`}
                  </p>
                  <p
                    className={`mt-3 inline-flex items-center gap-1 text-xs font-bold ${
                      reached ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {reached ? "check_circle" : "lock"}
                    </span>
                    {reached ? "Conseguido" : "Por desbloquear"}
                  </p>
                </div>
              );
            })}
          </section>

          {/* Movimientos de puntos */}
          <section
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800/90"
            data-reveal
          >
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              De dónde salen tus puntos
            </h2>
            {earning.length === 0 ? (
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                Todavía no tienes puntos. Con tu primera compra empezarás a sumar: 1 punto por cada
                euro.{" "}
                <a className="font-bold text-primary hover:underline" href="#/catalogo">
                  Ir a la tienda
                </a>
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-700">
                {earning.map((order) => (
                  <li
                    className="flex items-center justify-between gap-4 py-2.5 text-sm"
                    key={order.orderNumber}
                  >
                    <span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        Pedido {order.orderNumber}
                      </span>
                      <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                        {new Date(order.createdAt).toLocaleDateString("es-ES")} ·{" "}
                        {formatPrice(order.total)}
                      </span>
                    </span>
                    <span className="font-extrabold tabular-nums text-emerald-600 dark:text-emerald-400">
                      +{Math.floor(order.total)} pts
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </AccountLayout>
  );
}
