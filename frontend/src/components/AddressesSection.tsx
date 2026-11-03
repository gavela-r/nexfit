// AddressesSection
// Bloque «Mis direcciones» de Editar perfil: lista de direcciones guardadas
// (la predeterminada primero), formulario para añadir o editar, borrar y
// marcar como predeterminada. La predeterminada rellena el pago de Stripe.
import { useEffect, useState, type FormEvent } from "react";
import {
  ApiRequestError,
  createAddress,
  deleteAddress,
  getAddresses,
  setDefaultAddress,
  updateAddress,
  type Address,
  type AddressInput,
} from "../api";

const MAX_ADDRESSES = 5;

const CARD =
  "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/90 md:p-7";
const LABEL = "block text-xs font-bold text-slate-700 dark:text-slate-200";
const INPUT =
  "mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white";

const EMPTY: AddressInput = {
  label: "",
  fullName: "",
  phone: "",
  addressLine: "",
  city: "",
  postalCode: "",
  country: "ES",
  isDefault: false,
};

const COUNTRY_LABEL = { ES: "España", PT: "Portugal" } as const;

interface AddressesSectionProps {
  token: string;
  /** Nombre del usuario para rellenar «Quién lo recibe» en una dirección nueva. */
  defaultName: string;
}

export function AddressesSection({ token, defaultName }: AddressesSectionProps) {
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  // null = formulario cerrado; "new" = dirección nueva; número = id que se edita.
  const [editing, setEditing] = useState<"new" | number | null>(null);
  const [form, setForm] = useState<AddressInput>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    void getAddresses(token)
      .then((list) => {
        if (active) setAddresses(list);
      })
      .catch(() => {
        if (active) setAddresses([]);
      });
    return () => {
      active = false;
    };
  }, [token]);

  const openNew = () => {
    setForm({ ...EMPTY, fullName: defaultName, isDefault: (addresses ?? []).length === 0 });
    setEditing("new");
    setErrors([]);
  };

  const openEdit = (address: Address) => {
    setForm({
      label: address.label ?? "",
      fullName: address.fullName,
      phone: address.phone ?? "",
      addressLine: address.addressLine,
      city: address.city,
      postalCode: address.postalCode,
      country: address.country,
      isDefault: address.isDefault,
    });
    setEditing(address.id);
    setErrors([]);
  };

  /** Ejecuta una acción que devuelve la lista nueva y recoge los errores. */
  const run = async (action: () => Promise<Address[]>): Promise<boolean> => {
    setSaving(true);
    setErrors([]);
    try {
      setAddresses(await action());
      return true;
    } catch (error) {
      setErrors(
        error instanceof ApiRequestError
          ? error.details.length > 0
            ? error.details
            : [error.message]
          : ["No se pudo guardar la dirección."],
      );
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const ok = await run(() =>
      editing === "new" ? createAddress(token, form) : updateAddress(token, Number(editing), form),
    );
    if (ok) setEditing(null);
  };

  const handleDelete = (address: Address) => {
    if (!window.confirm(`¿Borrar la dirección «${address.label || address.addressLine}»?`)) return;
    void run(() => deleteAddress(token, address.id));
  };

  const field = (key: keyof AddressInput) => ({
    value: String(form[key] ?? ""),
    onChange: (event: { target: { value: string } }) =>
      setForm((current) => ({ ...current, [key]: event.target.value })),
  });

  return (
    <section className={CARD}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Mis direcciones</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            La predeterminada aparece ya rellena al pagar. Tras tu primer pedido se guarda sola.
          </p>
        </div>
        {editing === null && (addresses?.length ?? 0) < MAX_ADDRESSES && (
          <button
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 text-sm font-bold text-slate-700 hover:border-primary hover:text-primary dark:border-slate-600 dark:text-slate-200"
            onClick={openNew}
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">add_location_alt</span>
            Añadir dirección
          </button>
        )}
      </div>

      {/* Lista */}
      {!addresses ? (
        <div className="mt-5 h-20 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-700/50" />
      ) : addresses.length === 0 && editing === null ? (
        <p className="mt-5 rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500 dark:border-slate-600 dark:text-slate-400">
          Aún no tienes direcciones guardadas.
        </p>
      ) : (
        <ul className="mt-5 grid gap-3 md:grid-cols-2">
          {addresses.map((address) => (
            <li
              className={`relative rounded-xl border p-4 text-sm ${
                address.isDefault
                  ? "border-primary bg-orange-50/50 dark:bg-primary/10"
                  : "border-slate-200 dark:border-slate-700"
              } ${editing === address.id ? "ring-2 ring-primary/40" : ""}`}
              key={address.id}
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary">
                  {address.isDefault ? "home_pin" : "location_on"}
                </span>
                <span className="font-extrabold text-slate-900 dark:text-white">
                  {address.label || "Dirección"}
                </span>
                {address.isDefault && (
                  <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-extrabold text-white">
                    Predeterminada
                  </span>
                )}
              </div>
              <address className="mt-2 not-italic leading-relaxed text-slate-600 dark:text-slate-300">
                <span className="block font-semibold text-slate-800 dark:text-slate-100">
                  {address.fullName}
                </span>
                <span className="block">{address.addressLine}</span>
                <span className="block">
                  {address.postalCode} {address.city} · {COUNTRY_LABEL[address.country]}
                </span>
                {address.phone && <span className="block">{address.phone}</span>}
              </address>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold">
                <button
                  className="text-secondary hover:text-primary dark:text-blue-400"
                  onClick={() => openEdit(address)}
                  type="button"
                >
                  Editar
                </button>
                {!address.isDefault && (
                  <button
                    className="text-secondary hover:text-primary dark:text-blue-400"
                    disabled={saving}
                    onClick={() => void run(() => setDefaultAddress(token, address.id))}
                    type="button"
                  >
                    Usar como predeterminada
                  </button>
                )}
                <button
                  className="text-slate-500 hover:text-red-600 dark:text-slate-400"
                  disabled={saving}
                  onClick={() => handleDelete(address)}
                  type="button"
                >
                  Borrar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Formulario */}
      {editing !== null && (
        <form
          className="mt-5 rounded-xl border border-slate-200 p-5 dark:border-slate-700"
          noValidate
          onSubmit={handleSubmit}
        >
          <p className="text-sm font-extrabold text-slate-900 dark:text-white">
            {editing === "new" ? "Nueva dirección" : "Editar dirección"}
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className={LABEL}>
              Nombre de la dirección (opcional)
              <input
                className={INPUT}
                maxLength={40}
                placeholder="Casa, Trabajo..."
                {...field("label")}
              />
            </label>
            <label className={LABEL}>
              Quién lo recibe
              <input autoComplete="name" className={INPUT} maxLength={80} {...field("fullName")} />
            </label>
            <label className={`${LABEL} sm:col-span-2`}>
              Dirección
              <input
                autoComplete="street-address"
                className={INPUT}
                maxLength={160}
                placeholder="Calle, número, piso y puerta"
                {...field("addressLine")}
              />
            </label>
            <label className={LABEL}>
              Código postal
              <input
                autoComplete="postal-code"
                className={INPUT}
                maxLength={12}
                placeholder={form.country === "PT" ? "0000-000" : "28001"}
                {...field("postalCode")}
              />
            </label>
            <label className={LABEL}>
              Ciudad
              <input
                autoComplete="address-level2"
                className={INPUT}
                maxLength={80}
                {...field("city")}
              />
            </label>
            <label className={LABEL}>
              País
              <select className={INPUT} {...field("country")}>
                <option value="ES">España</option>
                <option value="PT">Portugal</option>
              </select>
            </label>
            <label className={LABEL}>
              Teléfono (opcional)
              <input
                autoComplete="tel"
                className={INPUT}
                maxLength={20}
                placeholder="+34 600 000 000"
                type="tel"
                {...field("phone")}
              />
            </label>
          </div>
          <label className="mt-4 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
            <input
              checked={Boolean(form.isDefault)}
              className="h-4 w-4 accent-[#FF5A1F]"
              onChange={(event) =>
                setForm((current) => ({ ...current, isDefault: event.target.checked }))
              }
              type="checkbox"
            />
            Usar como dirección predeterminada
          </label>

          {errors.length > 0 && (
            <ul
              className="mt-4 space-y-0.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
              role="alert"
            >
              {errors.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          )}

          <div className="mt-5 flex justify-end gap-2">
            <button
              className="h-11 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
              onClick={() => setEditing(null)}
              type="button"
            >
              Cancelar
            </button>
            <button
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-bold text-white hover:bg-primary disabled:opacity-70 dark:bg-primary dark:hover:bg-[#E04B16]"
              disabled={saving}
              type="submit"
            >
              {saving && (
                <span className="material-symbols-outlined animate-spin text-[18px]">
                  progress_activity
                </span>
              )}
              Guardar dirección
            </button>
          </div>
        </form>
      )}

      {editing === null && errors.length > 0 && (
        <p className="mt-3 text-xs text-red-600 dark:text-red-400" role="alert">
          {errors.join(" ")}
        </p>
      )}
    </section>
  );
}
