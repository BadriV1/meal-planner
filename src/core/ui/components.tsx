import type { ReactNode } from "react";

export function Chip({
  on,
  onClick,
  children,
  variant,
}: {
  on?: boolean;
  onClick?: () => void;
  children: ReactNode;
  variant?: "add";
}) {
  return (
    <button
      type="button"
      className={`chip ${on ? "on" : ""} ${variant === "add" ? "add" : ""}`}
      aria-pressed={variant === "add" ? undefined : !!on}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function Stepper({
  value,
  min = 0,
  max = 10,
  onChange,
  label,
}: {
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
  label: string;
}) {
  return (
    <div className="stepper">
      <button type="button" aria-label={`Fewer ${label}`} disabled={value <= min} onClick={() => onChange(value - 1)}>
        −
      </button>
      <span>{value}</span>
      <button type="button" aria-label={`More ${label}`} disabled={value >= max} onClick={() => onChange(value + 1)}>
        +
      </button>
    </div>
  );
}
