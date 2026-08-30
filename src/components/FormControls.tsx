// ---- Shared form primitives for the intake flow ----

export function FormCard({
  title,
  hint,
  children




}: {title: string;hint?: string;children: React.ReactNode;}) {
  return (
    <section className="rounded-2xl border border-ink/10 bg-white p-4 md:p-5">
      <h2 className="text-[11px] font-semibold uppercase tracking-wider text-gold">{title}</h2>
      {hint && <p className="mt-1 text-xs leading-5 text-gray-500">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>);

}

interface BaseFieldProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

function FieldShell({
  label,
  error,
  hint,
  required,
  htmlFor,
  children
}: BaseFieldProps & {htmlFor: string;children: React.ReactNode;}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500">
        
        {label}
        {required && <span className="ml-1 text-danger">*</span>}
      </label>
      <div className="mt-1.5">{children}</div>
      {hint && !error && <p className="mt-1.5 text-[11px] text-gray-400">{hint}</p>}
      {error && <p className="mt-1.5 text-[11px] font-medium text-danger">{error}</p>}
    </div>);

}

const CONTROL_CLASSES =
'w-full rounded-xl border bg-white px-3.5 py-3 text-sm text-ink placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gold/60';

export function TextField({
  id,
  label,
  value,
  onChange,
  placeholder,
  error,
  hint,
  required,
  type = 'text'






}: BaseFieldProps & {id: string;value: string;onChange: (value: string) => void;placeholder?: string;type?: 'text' | 'date';}) {
  return (
    <FieldShell label={label} error={error} hint={hint} required={required} htmlFor={id}>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        className={`${CONTROL_CLASSES} ${error ? 'border-danger-border' : 'border-ink/15'}`} />
      
    </FieldShell>);

}

export function SelectField<T extends string>({
  id,
  label,
  value,
  onChange,
  options,
  error,
  hint,
  required





}: BaseFieldProps & {id: string;value: T;onChange: (value: T) => void;options: {value: T;label: string;}[];}) {
  return (
    <FieldShell label={label} error={error} hint={hint} required={required} htmlFor={id}>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        aria-invalid={Boolean(error)}
        className={`${CONTROL_CLASSES} appearance-none ${
        error ? 'border-danger-border' : 'border-ink/15'}`
        }>
        
        {options.map((o) =>
        <option key={o.value} value={o.value}>
            {o.label}
          </option>
        )}
      </select>
    </FieldShell>);

}

export function ToggleRow({
  label,
  description,
  checked,
  onChange





}: {label: string;description?: string;checked: boolean;onChange: (checked: boolean) => void;}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center gap-3 rounded-xl border border-ink/15 bg-white px-3.5 py-3 text-left transition-colors active:bg-black/[0.03]">
      
      <span
        className={`flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        checked ? 'bg-ink' : 'bg-gray-300'}`
        }>
        
        <span
          className={`h-5 w-5 rounded-full bg-white transition-transform ${
          checked ? 'translate-x-[22px]' : 'translate-x-0.5'}`
          } />
        
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-ink">{label}</span>
        {description && <span className="block text-xs text-gray-500">{description}</span>}
      </span>
    </button>);

}