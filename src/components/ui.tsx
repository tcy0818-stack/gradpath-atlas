import type { ReactNode } from "react";

export const primaryButton =
  "inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-accent px-4 py-2.5 text-base font-semibold text-white " +
  "transition-colors hover:bg-accent-strong disabled:cursor-wait disabled:opacity-70";
export const quietButton =
  "inline-flex min-h-11 items-center justify-center rounded-lg border border-control bg-surface px-3.5 py-2 text-sm font-semibold text-ink " +
  "transition-colors hover:bg-accent-tint";
export const textLink = "font-medium text-accent underline underline-offset-4 hover:text-accent-strong"; // links inside a sentence
// A link standing on its own line gets a real 44px target (no overlap with the next one).
export const standaloneLink = `inline-flex min-h-11 items-center ${textLink}`;

type FieldProps = {
  id: string;
  name: string;
  label: string;
  type?: "text" | "email" | "password" | "number" | "date";
  autoComplete?: string;
  defaultValue?: string;
  hint?: string;
  error?: string;
  /** Defaults to true. Optional fields say so in their label instead of relying on the browser's marker. */
  required?: boolean;
  disabled?: boolean;
  inputMode?: "numeric" | "decimal";
  min?: number | string;
  max?: number | string;
  step?: number | string;
  maxLength?: number;
  list?: string;
  /** Renders a <select> with these options instead of an input. */
  options?: readonly { value: string; label: string }[];
  /** Renders a <textarea> with this many rows. */
  rows?: number;
  onChange?: (value: string) => void;
};

const control = (error?: string) =>
  "mt-1.5 block min-h-11 w-full rounded-lg border bg-surface px-3 py-2 text-base text-ink disabled:bg-bg disabled:text-muted " +
  (error ? "border-danger" : "border-control");

/** Labelled input, select or textarea; hint and error are linked with aria-describedby so they are read with the field. */
export function Field({ id, name, label, type = "text", autoComplete, defaultValue, hint, error, required = true, disabled, inputMode, min, max, step, maxLength, list, options, rows, onChange }: FieldProps) {
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  const shared = {
    id,
    name,
    disabled,
    required,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy,
    className: control(error),
  } as const;
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-ink">
        {label}
        {!required && <span className="font-normal text-muted"> (optional)</span>}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="mt-0.5 text-sm text-muted">
          {hint}
        </p>
      )}
      {options ? (
        <select {...shared} defaultValue={defaultValue} onChange={onChange && ((e) => onChange(e.target.value))}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : rows ? (
        <textarea {...shared} rows={rows} maxLength={maxLength} defaultValue={defaultValue} />
      ) : (
        <input
          {...shared}
          type={type}
          autoComplete={autoComplete}
          defaultValue={defaultValue}
          inputMode={inputMode}
          min={min}
          max={max}
          step={step}
          maxLength={maxLength}
          list={list}
          spellCheck={type === "text" ? undefined : false}
          autoCapitalize={type === "text" ? undefined : "none"}
        />
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 flex items-start gap-1.5 text-sm text-danger">
          <StatusIcon tone="error" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

type Tone = "error" | "success" | "info";

export function StatusIcon({ tone }: { tone: Tone }) {
  const common = { width: 16, height: 16, viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 1.75, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true, className: "mt-0.5 shrink-0" };
  if (tone === "success") return (<svg {...common}><circle cx="8" cy="8" r="6.25" /><path d="M5.2 8.2l2 2 3.6-4" /></svg>);
  if (tone === "info") return (<svg {...common}><circle cx="8" cy="8" r="6.25" /><path d="M8 7.2v3.6M8 5.2v.1" /></svg>);
  return (<svg {...common}><circle cx="8" cy="8" r="6.25" /><path d="M8 4.8v3.6M8 10.9v.1" /></svg>);
}

const toneClass: Record<Tone, string> = {
  error: "border-danger bg-danger-tint text-danger",
  success: "border-ok bg-ok-tint text-ok",
  info: "border-line bg-info-tint text-ink-2",
};

/** Status message: icon + text, never colour alone. Errors use role=alert; the rest role=status. */
export function Alert({ tone, children, id }: { tone: Tone; children: ReactNode; id?: string }) {
  return (
    <div
      id={id}
      tabIndex={-1}
      role={tone === "error" ? "alert" : "status"}
      className={`flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-sm ${toneClass[tone]}`}
    >
      <StatusIcon tone={tone} />
      <div>{children}</div>
    </div>
  );
}
