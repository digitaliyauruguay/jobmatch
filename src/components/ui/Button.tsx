/*
 * Archivo: src/components/ui/Button.tsx
 * Qué hace: Botón reutilizable con la paleta de JobMatch. Variantes:
 * primary (magenta, acción principal, con texto blanco y efecto de
 * iluminación al hover), secondary (borde neutro), approve (verde),
 * reject (rojo), disabled (gris, ya ejecutado).
 * Se usa en toda la app para mantener consistencia visual.
 */

type ButtonVariant = "primary" | "secondary" | "approve" | "reject" | "disabled";

type ButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: ButtonVariant;
  icon?: React.ReactNode;
  type?: "button" | "submit";
  disabled?: boolean;
  fullWidth?: boolean;
};

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-jm-magenta text-white shadow-[0_0_0_0_rgba(212,83,126,0)] hover:shadow-[0_0_20px_2px_rgba(212,83,126,0.45)] hover:bg-jm-magenta-light hover:text-jm-magenta-bg hover:scale-[1.02] active:scale-[0.98]",
  secondary: "bg-transparent border border-jm-border-soft text-jm-text-secondary hover:border-jm-gray",
  approve: "bg-transparent border border-jm-green text-jm-green-light hover:bg-jm-green-bg",
  reject: "bg-transparent border border-jm-red text-jm-red-light hover:bg-jm-red-bg",
  disabled: "bg-jm-card-hover border border-jm-border-soft text-jm-text-tertiary cursor-not-allowed",
};

export default function Button({
  children,
  onClick,
  variant = "primary",
  icon,
  type = "button",
  disabled = false,
  fullWidth = false,
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer ${
        variantStyles[disabled ? "disabled" : variant]
      } ${fullWidth ? "w-full" : ""}`}
    >
      {icon}
      {children}
    </button>
  );
}