// SizesFields
// Los tres selectores de la talla habitual (arriba, abajo y calzado). Los usan
// «Editar perfil» y el paso opcional que aparece tras registrarse.
import type { UserSizes } from "../api";
import { CLOTHING_SIZES, SHOE_SIZES } from "../utils/sizes";

const SELECT =
  "mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white";

const FIELDS: {
  key: keyof UserSizes;
  label: string;
  hint: string;
  icon: string;
  options: string[];
}[] = [
  {
    key: "top",
    label: "Parte de arriba",
    hint: "Camisetas, tops, sudaderas",
    icon: "apparel",
    options: CLOTHING_SIZES,
  },
  {
    key: "bottom",
    label: "Parte de abajo",
    hint: "Pantalones, shorts, mallas",
    icon: "styler",
    options: CLOTHING_SIZES,
  },
  { key: "shoe", label: "Calzado", hint: "Botas y zapatillas", icon: "steps", options: SHOE_SIZES },
];

interface SizesFieldsProps {
  value: UserSizes;
  onChange: (value: UserSizes) => void;
}

export function SizesFields({ value, onChange }: SizesFieldsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {FIELDS.map((field) => (
        <label
          className="block text-xs font-bold text-slate-700 dark:text-slate-200"
          key={field.key}
        >
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px] text-primary">{field.icon}</span>
            {field.label}
          </span>
          <select
            className={SELECT}
            onChange={(event) => onChange({ ...value, [field.key]: event.target.value || null })}
            value={value[field.key] ?? ""}
          >
            <option value="">Sin indicar</option>
            {field.options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <span className="mt-1 block font-normal text-slate-500 dark:text-slate-400">
            {field.hint}
          </span>
        </label>
      ))}
    </div>
  );
}
