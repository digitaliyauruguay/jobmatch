/*
 * Archivo: src/components/ui/Badge.tsx
 * Qué hace: Componente reutilizable para mostrar etiquetas pequeñas
 * (badges) con la paleta de JobMatch. Variantes: magenta (acción/marca),
 * cyan (información/pendiente/categoría), green (aprobado), red (rechazado),
 * gray (neutro). Se usa en toda la app para mantener consistencia visual.
 */

type BadgeVariant = "magenta" | "cyan" | "green" | "red" | "gray";

type BadgeProps = {
  children: React.ReactNode;
  variant?: BadgeVariant;
  icon?: React.ReactNode;
};

const variantStyles: Record<BadgeVariant, { bg: string; text: string }> = {
  magenta: { bg: "bg-jm-magenta-bg", text: "text-jm-magenta-light" },
  cyan: { bg: "bg-jm-cyan-bg", text: "text-jm-cyan-light" },
  green: { bg: "bg-jm-green-bg", text: "text-jm-green-light" },
  red: { bg: "bg-jm-red-bg", text: "text-jm-red-light" },
  gray: { bg: "bg-jm-card-hover", text: "text-jm-gray-light" },
};

export default function Badge({ children, variant = "gray", icon }: BadgeProps) {
  const styles = variantStyles[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${styles.bg} ${styles.text} text-xs px-2.5 py-1 rounded-full`}
    >
      {icon}
      {children}
    </span>
  );
}