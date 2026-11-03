// ReturnsPage
// Devoluciones y cambios (#/cuenta/devoluciones): formulario para pedir una
// devolución o un cambio de talla de un pedido entregado (30 días) y listado
// de solicitudes con su estado. Datos de GET/POST /api/returns.
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ApiRequestError,
  createReturn,
  getReturns,
  type AuthUser,
  type EligibleOrder,
  type ReturnKind,
  type ReturnReason,
  type ReturnView,
} from "../api";
import { formatPrice } from "../utils/format";
import { AccountLayout } from "./AccountLayout";

interface ReturnsPageProps {
  user: AuthUser | null;
  token: string | null;
  restoring: boolean;
  onOpenLogin: () => void;
}

const REASONS: { id: ReturnReason; label: string }[] = [
  { id: "talla", label: "La talla no me queda bien" },
  { id: "defecto", label: "La prenda tiene un defecto" },
  { id: "no_esperado", label: "No es lo que esperaba" },
  { id: "otro", label: "Otro motivo" },
];

const STEPS: ReturnView["status"][] = ["solicitada", "aprobada", "recibida", "completada"];
const STEP_LABEL: Record<ReturnView["status"], string> = {
  solicitada: "Solicitada",
  aprobada: "Aprobada",
  recibida: "Recibida en almacén",
  completada: "Completada",
  rechazada: "Rechazada",
};

/** Selección de cada línea del pedido: unidades y talla nueva (en cambios). */
type Selection = Record<number, { quantity: number; newSize: string }>;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });

const CARD =
  "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800/90 md:p-6";
const SELECT =
  "h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white";

export function ReturnsPage({ user, token, restoring, onOpenLogin }: ReturnsPageProps) {
  const [data, setData] = useState<{
    returns: ReturnView[];
    eligibleOrders: EligibleOrder[];
  } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [orderNumber, setOrderNumber] = useState("");
  const [kind, setKind] = useState<ReturnKind>("devolucion");
  const [reason, setReason] = useState<ReturnReason>("talla");
  const [comments, setComments] = useState("");
  const [selection, setSelection] = useState<Selection>({});
  const [sending, setSending] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [created, setCreated] = useState<ReturnView | null>(null);

  const load = async (authToken: string) => {
    try {
      const result = await getReturns(authToken);
      setData(result);
      setLoadError(null);
      setOrderNumber((current) =>
        result.eligibleOrders.some((order) => order.orderNumber === current)
          ? current
          : (result.eligibleOrders[0]?.orderNumber ?? ""),
      );
    } catch (error) {
      setLoadError(
        error instanceof ApiRequestError
          ? error.message
          : "No se pudieron cargar tus devoluciones.",
      );
    }
  };

  useEffect(() => {
    if (token) void load(token);
  }, [token]);

  const order = data?.eligibleOrders.find((item) => item.orderNumber === orderNumber) ?? null;

  // Al cambiar de pedido, la selección empieza de cero.
  useEffect(() => {
    setSelection({});
    setFormErrors([]);
  }, [orderNumber]);

  const chosen = useMemo(
    () => (order?.items ?? []).filter((item) => (selection[item.orderItemId]?.quantity ?? 0) > 0),
    [order, selection],
  );
  const estimate = chosen.reduce(
    (sum, item) => sum + item.unitPrice * (selection[item.orderItemId]?.quantity ?? 0),
    0,
  );

  const toggle = (orderItemId: number, max: number) =>
    setSelection((current) => {
      const next = { ...current };
      if (next[orderItemId]?.quantity) delete next[orderItemId];
      else next[orderItemId] = { quantity: Math.min(1, max), newSize: "" };
      return next;
    });

  const update = (orderItemId: number, patch: Partial<{ quantity: number; newSize: string }>) =>
    setSelection((current) => ({
      ...current,
      [orderItemId]: { ...(current[orderItemId] ?? { quantity: 1, newSize: "" }), ...patch },
    }));

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !order) return;
    setSending(true);
    setFormErrors([]);
    try {
      const result = await createReturn(token, {
        orderNumber: order.orderNumber,
        type: kind,
        reason,
        ...(comments.trim() ? { comments: comments.trim() } : {}),
        items: chosen.map((item) => ({
          orderItemId: item.orderItemId,
          quantity: selection[item.orderItemId].quantity,
          ...(kind === "cambio" ? { newSize: selection[item.orderItemId].newSize } : {}),
        })),
      });
      setCreated(result);
      setSelection({});
      setComments("");
      await load(token);
    } catch (error) {
      setFormErrors(
        error instanceof ApiRequestError
          ? error.details.length > 0
            ? error.details
            : [error.message]
          : ["No se pudo enviar la solicitud. Inténtalo de nuevo."],
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <AccountLayout
      onOpenLogin={onOpenLogin}
      restoring={restoring}
      section="devoluciones"
      subtitle="Tienes 30 días desde tu pedido para devolverlo gratis o cambiar de talla."
      title="Devoluciones y cambios"
      user={user}
    >
      {loadError ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          {loadError}
        </p>
      ) : !data ? (
        <div className="h-64 animate-pulse rounded-2xl bg-white dark:bg-slate-800/60" />
      ) : (
        <div className="space-y-6">
          {created && (
            <div
              className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300"
              role="status"
            >
              <span className="material-symbols-outlined text-[22px]">check_circle</span>
              <div className="flex-1">
                <p className="font-bold">Solicitud {created.returnNumber} registrada</p>
                <p className="mt-0.5 text-xs">
                  Te enviaremos la etiqueta de envío gratuita por correo. Puedes seguir su estado
                  aquí abajo.
                </p>
              </div>
              <button
                aria-label="Cerrar aviso"
                className="text-emerald-700 hover:text-emerald-900 dark:text-emerald-300"
                onClick={() => setCreated(null)}
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          )}

          {/* Nueva solicitud */}
          {data.eligibleOrders.length === 0 ? (
            <section className={`${CARD} flex items-start gap-4`} data-reveal>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                <span className="material-symbols-outlined text-[24px]">assignment_return</span>
              </span>
              <div>
                <h2 className="font-extrabold text-slate-900 dark:text-white">
                  No tienes pedidos para devolver ahora mismo
                </h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Podrás pedir una devolución o un cambio de talla cuando un pedido esté entregado,
                  durante los 30 días siguientes a la compra.
                </p>
              </div>
            </section>
          ) : (
            <form className={CARD} noValidate onSubmit={handleSubmit} data-reveal>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Nueva solicitud
              </h2>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                  Pedido
                  <select
                    className={`${SELECT} mt-1.5 w-full`}
                    onChange={(event) => setOrderNumber(event.target.value)}
                    value={orderNumber}
                  >
                    {data.eligibleOrders.map((item) => (
                      <option key={item.orderNumber} value={item.orderNumber}>
                        {item.orderNumber} · {formatDate(item.createdAt)}
                      </option>
                    ))}
                  </select>
                  {order && (
                    <span className="mt-1 block font-normal text-slate-500 dark:text-slate-400">
                      Plazo hasta el {formatDate(order.deadline)}
                    </span>
                  )}
                </label>

                <fieldset>
                  <legend className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    ¿Qué necesitas?
                  </legend>
                  <div className="mt-1.5 grid grid-cols-2 gap-2">
                    {(
                      [
                        { id: "devolucion", label: "Devolución", icon: "payments" },
                        { id: "cambio", label: "Cambio de talla", icon: "swap_horiz" },
                      ] as const
                    ).map((option) => (
                      <label
                        className={`flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-xl border text-sm font-bold transition-colors ${
                          kind === option.id
                            ? "border-slate-900 bg-slate-900 text-white dark:border-primary dark:bg-primary"
                            : "border-slate-200 text-slate-700 hover:border-primary dark:border-slate-600 dark:text-slate-200"
                        }`}
                        key={option.id}
                      >
                        <input
                          checked={kind === option.id}
                          className="sr-only"
                          name="kind"
                          onChange={() => setKind(option.id)}
                          type="radio"
                        />
                        <span className="material-symbols-outlined text-[18px]">{option.icon}</span>
                        {option.label}
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>

              {/* Prendas del pedido */}
              <p className="mt-6 text-xs font-bold text-slate-700 dark:text-slate-200">
                Elige las prendas
              </p>
              <ul className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-200 dark:divide-slate-700 dark:border-slate-700">
                {order?.items.map((item) => {
                  const picked = selection[item.orderItemId];
                  const disabled = item.returnable === 0;
                  return (
                    <li
                      className={`flex flex-wrap items-center gap-3 p-3.5 ${disabled ? "opacity-50" : ""}`}
                      key={item.orderItemId}
                    >
                      <input
                        aria-label={`Incluir ${item.productName}`}
                        checked={Boolean(picked?.quantity)}
                        className="h-4 w-4 cursor-pointer accent-[#FF5A1F]"
                        disabled={disabled}
                        onChange={() => toggle(item.orderItemId, item.returnable)}
                        type="checkbox"
                      />
                      <div className="min-w-0 flex-1">
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
                          · {formatPrice(item.unitPrice)}
                          {disabled
                            ? " · ya solicitada"
                            : item.returnable < item.purchased
                              ? ` · quedan ${item.returnable}`
                              : ""}
                        </p>
                      </div>
                      {picked?.quantity ? (
                        <div className="flex items-center gap-2">
                          {item.returnable > 1 && (
                            <select
                              aria-label="Unidades"
                              className={SELECT}
                              onChange={(event) =>
                                update(item.orderItemId, { quantity: Number(event.target.value) })
                              }
                              value={picked.quantity}
                            >
                              {Array.from({ length: item.returnable }, (_, index) => index + 1).map(
                                (units) => (
                                  <option key={units} value={units}>
                                    {units} ud.
                                  </option>
                                ),
                              )}
                            </select>
                          )}
                          {kind === "cambio" && (
                            <select
                              aria-label="Talla nueva"
                              className={SELECT}
                              onChange={(event) =>
                                update(item.orderItemId, { newSize: event.target.value })
                              }
                              value={picked.newSize}
                            >
                              <option value="">Talla nueva…</option>
                              {item.sizes
                                .filter((size) => size !== item.size)
                                .map((size) => (
                                  <option key={size} value={size}>
                                    {size}
                                  </option>
                                ))}
                            </select>
                          )}
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                  Motivo
                  <select
                    className={`${SELECT} mt-1.5 w-full`}
                    onChange={(event) => setReason(event.target.value as ReturnReason)}
                    value={reason}
                  >
                    {REASONS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                  Comentarios (opcional)
                  <input
                    className={`${SELECT} mt-1.5 w-full`}
                    maxLength={500}
                    onChange={(event) => setComments(event.target.value)}
                    placeholder="Cuéntanos algo más si quieres"
                    value={comments}
                  />
                </label>
              </div>

              {formErrors.length > 0 && (
                <ul
                  className="mt-4 space-y-0.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
                  role="alert"
                >
                  {formErrors.map((message) => (
                    <li key={message}>{message}</li>
                  ))}
                </ul>
              )}

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5 dark:border-slate-700">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {kind === "devolucion" ? (
                    <>
                      Reembolso aproximado:{" "}
                      <span className="font-extrabold tabular-nums text-slate-900 dark:text-white">
                        {formatPrice(estimate)}
                      </span>
                      <span className="block text-[11px] text-slate-400">
                        Se descuenta la parte proporcional del descuento Club del pedido.
                      </span>
                    </>
                  ) : (
                    "El cambio de talla es gratuito: recogemos la prenda y te enviamos la nueva."
                  )}
                </p>
                <button
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white shadow-lg shadow-primary/25 transition-colors hover:bg-[#F04A10] disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={sending || chosen.length === 0}
                  type="submit"
                >
                  {sending && (
                    <span className="material-symbols-outlined animate-spin text-[18px]">
                      progress_activity
                    </span>
                  )}
                  Enviar solicitud
                </button>
              </div>
            </form>
          )}

          {/* Solicitudes */}
          <section data-reveal>
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Tus solicitudes
            </h2>
            {data.returns.length === 0 ? (
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                Aún no has hecho ninguna devolución ni cambio.
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {data.returns.map((request) => {
                  const stepIndex = STEPS.indexOf(request.status);
                  return (
                    <li className={CARD} key={request.returnNumber}>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                        <p className="font-extrabold tabular-nums text-slate-900 dark:text-white">
                          {request.returnNumber}
                        </p>
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-200">
                          {request.type === "devolucion" ? "Devolución" : "Cambio de talla"}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          Pedido {request.orderNumber} · {formatDate(request.createdAt)}
                        </span>
                        {request.type === "devolucion" && (
                          <span className="ml-auto text-sm font-extrabold tabular-nums text-slate-900 dark:text-white">
                            {formatPrice(request.refundAmount)}
                          </span>
                        )}
                      </div>

                      <ul className="mt-3 space-y-1 text-sm text-slate-700 dark:text-slate-200">
                        {request.items.map((item, index) => (
                          <li className="flex items-center gap-1.5" key={index}>
                            <span className="material-symbols-outlined text-[16px] text-slate-400">
                              checkroom
                            </span>
                            {item.quantity} × {item.productName} · talla {item.size}
                            {item.newSize && (
                              <span className="font-bold text-primary"> → {item.newSize}</span>
                            )}
                          </li>
                        ))}
                      </ul>

                      {/* Estado */}
                      {request.status === "rechazada" ? (
                        <p className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-red-600 dark:text-red-400">
                          <span className="material-symbols-outlined text-[16px]">cancel</span>
                          Solicitud rechazada
                        </p>
                      ) : (
                        <ol className="mt-4 grid grid-cols-4 gap-1">
                          {STEPS.map((step, index) => (
                            <li key={step}>
                              <div
                                className={`h-1.5 rounded-full ${
                                  index <= stepIndex
                                    ? "bg-primary"
                                    : "bg-slate-200 dark:bg-slate-700"
                                }`}
                              />
                              <p
                                className={`mt-1.5 text-[11px] ${
                                  index <= stepIndex
                                    ? "font-bold text-slate-900 dark:text-white"
                                    : "text-slate-400"
                                }`}
                              >
                                {STEP_LABEL[step]}
                              </p>
                            </li>
                          ))}
                        </ol>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      )}
    </AccountLayout>
  );
}
