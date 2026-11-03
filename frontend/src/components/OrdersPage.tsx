// OrdersPage
// Historial de compras (#/cuenta/pedidos): pedidos de GET /api/orders con su
// estado, importe y, al desplegar cada uno, líneas y dirección de envío.
import { useEffect, useState } from "react";
import { ApiRequestError, discountLabel, getOrders, type AuthUser, type OrderView } from "../api";
import { formatPrice } from "../utils/format";
import { AccountLayout } from "./AccountLayout";

interface OrdersPageProps {
  user: AuthUser | null;
  token: string | null;
  restoring: boolean;
  onOpenLogin: () => void;
}

/** Texto, icono y colores de cada estado de orders.status. */
const STATUS: Record<OrderView["status"], { label: string; icon: string; className: string }> = {
  pendiente: {
    label: "Pago pendiente",
    icon: "schedule",
    className: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  },
  pagado: {
    label: "Pagado · Preparando",
    icon: "inventory_2",
    className: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  },
  enviado: {
    label: "Enviado",
    icon: "local_shipping",
    className: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300",
  },
  entregado: {
    label: "Entregado",
    icon: "check_circle",
    className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
  cancelado: {
    label: "Cancelado",
    icon: "cancel",
    className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  },
  devuelto: {
    label: "Devuelto",
    icon: "assignment_return",
    className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  },
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });

export function OrdersPage({ user, token, restoring, onOpenLogin }: OrdersPageProps) {
  const [orders, setOrders] = useState<OrderView[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let active = true;
    setError(null);
    void getOrders(token)
      .then((data) => {
        if (active) setOrders(data);
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setError(
          reason instanceof ApiRequestError ? reason.message : "No se pudo cargar el historial.",
        );
      });
    return () => {
      active = false;
    };
  }, [token]);

  const spent = (orders ?? [])
    .filter((order) => order.status !== "pendiente")
    .reduce((sum, order) => sum + order.total, 0);
  const items = (orders ?? []).reduce(
    (sum, order) => sum + order.items.reduce((count, line) => count + line.quantity, 0),
    0,
  );

  return (
    <AccountLayout
      onOpenLogin={onOpenLogin}
      restoring={restoring}
      section="pedidos"
      subtitle="Consulta el estado de tus compras y el detalle de cada pedido."
      title="Historial de compras"
      user={user}
    >
      {error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      ) : !orders ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }, (_, index) => (
            <div
              className="h-24 animate-pulse rounded-2xl bg-white dark:bg-slate-800/60"
              key={index}
            />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <section
          className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-800/60"
          data-reveal="zoom"
        >
          <span className="material-symbols-outlined text-[44px] text-slate-300 dark:text-slate-600">
            receipt_long
          </span>
          <h2 className="mt-3 text-lg font-extrabold text-slate-900 dark:text-white">
            Aún no has hecho ningún pedido
          </h2>
          <p className="mx-auto mt-1.5 max-w-sm text-sm text-slate-600 dark:text-slate-300">
            Cuando completes una compra aparecerá aquí con su estado y el detalle de las prendas.
          </p>
          <a
            className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-white shadow-lg shadow-primary/25 transition-colors hover:bg-[#F04A10]"
            href="#/catalogo"
          >
            Ir a la tienda
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </a>
        </section>
      ) : (
        <>
          {/* Resumen */}
          <dl className="grid grid-cols-3 gap-3" data-reveal-stagger>
            {[
              { label: "Pedidos", value: String(orders.length), icon: "receipt_long" },
              { label: "Prendas", value: String(items), icon: "checkroom" },
              { label: "Total invertido", value: formatPrice(spent), icon: "payments" },
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

          {/* Pedidos (desplegables) */}
          <ul className="mt-5 space-y-3" data-reveal-stagger>
            {orders.map((order) => {
              const status = STATUS[order.status] ?? STATUS.pendiente;
              const units = order.items.reduce((count, line) => count + line.quantity, 0);
              return (
                <li key={order.orderNumber}>
                  <details className="group rounded-2xl border border-slate-200 bg-white shadow-sm open:shadow-md dark:border-slate-700 dark:bg-slate-800/90">
                    <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-5 gap-y-2 p-5 [&::-webkit-details-marker]:hidden">
                      <div className="min-w-[140px]">
                        <p className="text-sm font-extrabold tabular-nums text-slate-900 dark:text-white">
                          {order.orderNumber}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${status.className}`}
                      >
                        <span className="material-symbols-outlined text-[14px]">{status.icon}</span>
                        {status.label}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {units} {units === 1 ? "prenda" : "prendas"}
                      </span>
                      <span className="ml-auto text-base font-extrabold tabular-nums text-slate-900 dark:text-white">
                        {formatPrice(order.total)}
                      </span>
                      <span className="material-symbols-outlined text-[22px] text-slate-400 transition-transform group-open:rotate-180">
                        expand_more
                      </span>
                    </summary>

                    <div className="grid gap-6 border-t border-slate-100 p-5 dark:border-slate-700 md:grid-cols-[1fr_240px]">
                      <div>
                        <ul className="divide-y divide-slate-100 dark:divide-slate-700">
                          {order.items.map((line) => (
                            <li
                              className="flex items-center justify-between gap-4 py-2.5"
                              key={`${line.productId}-${line.size}-${line.color}`}
                            >
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                                  {line.productName}
                                </p>
                                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                                  Talla {line.size}
                                  <span
                                    aria-hidden="true"
                                    className="inline-block h-3 w-3 rounded-full border border-slate-300 dark:border-slate-600"
                                    style={{ backgroundColor: line.color }}
                                  />
                                  · {line.quantity} × {formatPrice(line.unitPrice)}
                                </p>
                              </div>
                              <span className="shrink-0 text-sm font-bold tabular-nums">
                                {formatPrice(line.lineTotal)}
                              </span>
                            </li>
                          ))}
                        </ul>
                        <dl className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-xs dark:border-slate-700">
                          <div className="flex justify-between">
                            <dt className="text-slate-500 dark:text-slate-400">Subtotal</dt>
                            <dd className="tabular-nums">{formatPrice(order.subtotal)}</dd>
                          </div>
                          {order.discount > 0 && (
                            <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                              <dt>{discountLabel(order.couponCode)}</dt>
                              <dd className="tabular-nums">−{formatPrice(order.discount)}</dd>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <dt className="text-slate-500 dark:text-slate-400">Envío</dt>
                            <dd className="tabular-nums">
                              {order.shippingCost === 0
                                ? "GRATIS"
                                : formatPrice(order.shippingCost)}
                            </dd>
                          </div>
                        </dl>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-4 text-xs leading-relaxed text-slate-600 dark:bg-slate-900/60 dark:text-slate-300">
                        <p className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Envío
                        </p>
                        {order.shipping.address ? (
                          <address className="mt-1.5 not-italic">
                            {order.shipping.name && (
                              <span className="block font-semibold text-slate-800 dark:text-slate-100">
                                {order.shipping.name}
                              </span>
                            )}
                            <span className="block">{order.shipping.address}</span>
                            <span className="block">
                              {[order.shipping.postalCode, order.shipping.city]
                                .filter(Boolean)
                                .join(" ")}{" "}
                              · {order.shipping.country}
                            </span>
                          </address>
                        ) : (
                          <p className="mt-1.5">Pendiente de confirmar.</p>
                        )}
                        <p className="mt-3 font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Pago
                        </p>
                        <p className="mt-1.5 capitalize">{order.paymentMethod ?? "—"}</p>
                        {/* Postventa: valorar lo comprado y devolver lo entregado */}
                        {order.status !== "pendiente" && order.status !== "cancelado" && (
                          <div className="mt-4 space-y-2">
                            {order.status === "entregado" && (
                              <a
                                className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700 transition-colors hover:border-primary hover:text-primary dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                                href="#/cuenta/devoluciones"
                              >
                                <span className="material-symbols-outlined text-[16px]">
                                  assignment_return
                                </span>
                                Devolver o cambiar
                              </a>
                            )}
                            <a
                              className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700 transition-colors hover:border-primary hover:text-primary dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                              href="#/cuenta/resenas"
                            >
                              <span className="material-symbols-outlined text-[16px]">star</span>
                              Valorar prendas
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </details>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </AccountLayout>
  );
}
