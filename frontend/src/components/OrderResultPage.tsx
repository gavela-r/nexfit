// OrderResultPage
// Vuelta desde Stripe Checkout:
//   · #/pedido/confirmado?session_id=… → confirma el pago con el backend y
//     muestra el resumen del pedido (número, líneas, envío y totales).
//   · #/pedido/cancelado               → el cliente salió del pago sin pagar;
//     la cesta sigue intacta y puede volver a intentarlo.
import { useEffect, useState } from "react";
import { ApiRequestError, confirmCheckout, discountLabel, type OrderView } from "../api";
import { formatPrice } from "../utils/format";

interface OrderResultPageProps {
  result: "confirmado" | "cancelado";
  token: string | null;
  /** Mientras se revalida la sesión guardada todavía no se sabe si hay token. */
  restoring: boolean;
  /** Tras confirmar el pago la cesta ya es un pedido: hay que releerla. */
  onConfirmed: () => void;
  onOpenCart: () => void;
  onOpenLogin: () => void;
}

type Status =
  | { kind: "loading" }
  | { kind: "ok"; order: OrderView }
  | { kind: "error"; message: string }
  | { kind: "login" };

/** session_id que añade Stripe en la URL de vuelta (antes del hash). */
function readSessionId(): string | null {
  return new URLSearchParams(window.location.search).get("session_id");
}

const CARD =
  "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-8";
const PRIMARY_BUTTON =
  "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white shadow-lg shadow-primary/25 transition-colors hover:bg-[#F04A10]";
const SECONDARY_BUTTON =
  "inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800";

export function OrderResultPage({
  result,
  token,
  restoring,
  onConfirmed,
  onOpenCart,
  onOpenLogin,
}: OrderResultPageProps) {
  // Se lee una sola vez: después se limpia de la barra de direcciones.
  const [sessionId] = useState(readSessionId);
  const [status, setStatus] = useState<Status>({ kind: "loading" });

  useEffect(() => {
    if (result !== "confirmado" || restoring) return;
    if (!sessionId) {
      setStatus({ kind: "error", message: "No se ha recibido la referencia del pago." });
      return;
    }
    if (!token) {
      setStatus({ kind: "login" });
      return;
    }

    let active = true;
    setStatus({ kind: "loading" });
    void confirmCheckout(token, sessionId)
      .then((order) => {
        if (!active) return;
        setStatus({ kind: "ok", order });
        onConfirmed();
        // Quita ?session_id=… para que recargar o compartir la URL no la arrastre.
        window.history.replaceState(null, "", `${window.location.pathname}${window.location.hash}`);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setStatus({
          kind: "error",
          message:
            error instanceof ApiRequestError
              ? error.message
              : "No se pudo comprobar el pago. Inténtalo de nuevo en unos segundos.",
        });
      });

    return () => {
      active = false;
    };
  }, [result, restoring, sessionId, token, onConfirmed]);

  return (
    <div className="w-full bg-[#F5F7FB] dark:bg-[#0B1220]">
      <div className="mx-auto max-w-[880px] px-4 pb-16 pt-10 sm:px-6 md:px-8 md:pb-24 md:pt-14">
        {result === "cancelado" ? (
          <section className={`${CARD} text-center`}>
            <span className="material-symbols-outlined text-[48px] text-amber-500">
              shopping_cart_off
            </span>
            <h1 className="mt-3 font-headline text-2xl font-extrabold text-slate-900 dark:text-white md:text-3xl">
              Pago cancelado
            </h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-600 dark:text-slate-300">
              No se ha realizado ningún cargo. Tu cesta sigue guardada para cuando quieras terminar
              la compra.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <button className={PRIMARY_BUTTON} onClick={onOpenCart} type="button">
                Volver a la cesta
              </button>
              <a className={SECONDARY_BUTTON} href="#/catalogo">
                Seguir comprando
              </a>
            </div>
          </section>
        ) : status.kind === "loading" ? (
          <section aria-busy="true" className={`${CARD} text-center`}>
            <span className="material-symbols-outlined animate-spin text-[40px] text-primary">
              progress_activity
            </span>
            <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
              Comprobando el pago con Stripe…
            </p>
          </section>
        ) : status.kind === "login" ? (
          <section className={`${CARD} text-center`}>
            <span className="material-symbols-outlined text-[44px] text-primary">lock</span>
            <h1 className="mt-3 font-headline text-2xl font-extrabold text-slate-900 dark:text-white">
              Inicia sesión para ver tu pedido
            </h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-600 dark:text-slate-300">
              El pago se ha recibido en Stripe. Entra con la cuenta con la que compraste para ver la
              confirmación.
            </p>
            <button className={`${PRIMARY_BUTTON} mt-6`} onClick={onOpenLogin} type="button">
              Iniciar sesión
            </button>
          </section>
        ) : status.kind === "error" ? (
          <section className={`${CARD} text-center`}>
            <span className="material-symbols-outlined text-[44px] text-red-500">error</span>
            <h1 className="mt-3 font-headline text-2xl font-extrabold text-slate-900 dark:text-white">
              No hemos podido confirmar el pedido
            </h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-600 dark:text-slate-300">
              {status.message}
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                className={PRIMARY_BUTTON}
                onClick={() => window.location.reload()}
                type="button"
              >
                Reintentar
              </button>
              <a className={SECONDARY_BUTTON} href="#">
                Ir a la portada
              </a>
            </div>
          </section>
        ) : (
          <OrderSummary order={status.order} />
        )}
      </div>
    </div>
  );
}

function OrderSummary({ order }: { order: OrderView }) {
  const paid = order.status !== "pendiente" && order.status !== "cancelado";
  const { shipping } = order;

  return (
    <section className={CARD}>
      <div className="text-center">
        <span
          className={`material-symbols-outlined text-[52px] ${paid ? "text-emerald-500" : "text-amber-500"}`}
        >
          {paid ? "check_circle" : "schedule"}
        </span>
        <h1 className="mt-2 font-headline text-2xl font-extrabold text-slate-900 dark:text-white md:text-3xl">
          {paid ? "¡Gracias por tu compra!" : "Pago en proceso"}
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          {paid
            ? `Hemos recibido tu pago. Te enviaremos la confirmación a ${order.email ?? "tu correo"}.`
            : "Stripe todavía no ha confirmado el cobro. Recarga la página en unos minutos."}
        </p>
        <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-1.5 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          Pedido <span className="tabular-nums text-primary">{order.orderNumber}</span>
        </p>
      </div>

      <div className="mt-8 grid gap-8 md:grid-cols-[1fr_260px]">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Artículos
          </h2>
          <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
            {order.items.map((item) => (
              <li
                className="flex items-center justify-between gap-4 py-3"
                key={`${item.productId}-${item.size}-${item.color}`}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                    {item.productName}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    Talla {item.size}
                    <span
                      aria-hidden="true"
                      className="inline-block h-3 w-3 rounded-full border border-slate-300 dark:border-slate-600"
                      style={{ backgroundColor: item.color }}
                    />
                    · {item.quantity} {item.quantity === 1 ? "ud." : "uds."}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-bold tabular-nums text-slate-900 dark:text-white">
                  {formatPrice(item.lineTotal)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-4 space-y-1.5 border-t border-slate-100 pt-4 text-sm dark:border-slate-800">
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
                {order.shippingCost === 0 ? "GRATIS" : formatPrice(order.shippingCost)}
              </dd>
            </div>
            <div className="flex justify-between pt-2 text-base font-extrabold text-slate-900 dark:text-white">
              <dt>Total pagado</dt>
              <dd className="tabular-nums">{formatPrice(order.total)}</dd>
            </div>
          </dl>
        </div>

        <aside className="space-y-5 rounded-xl bg-slate-50 p-5 text-sm dark:bg-slate-800/60">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Envío
            </h2>
            {shipping.address ? (
              <address className="mt-2 not-italic leading-relaxed text-slate-700 dark:text-slate-200">
                {shipping.name && <span className="block font-semibold">{shipping.name}</span>}
                <span className="block">{shipping.address}</span>
                <span className="block">
                  {[shipping.postalCode, shipping.city].filter(Boolean).join(" ")} ·{" "}
                  {shipping.country}
                </span>
                {shipping.phone && <span className="block">{shipping.phone}</span>}
              </address>
            ) : (
              <p className="mt-2 text-slate-500 dark:text-slate-400">Pendiente de confirmar.</p>
            )}
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Pago
            </h2>
            <p className="mt-2 flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
              <span className="material-symbols-outlined text-[18px]">credit_card</span>
              Tarjeta · Stripe
            </p>
          </div>
          <a className={`${PRIMARY_BUTTON} w-full`} href="#/catalogo">
            Seguir comprando
          </a>
        </aside>
      </div>
    </section>
  );
}
