import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";

/**
 * Hugeicons with a stroke that holds up at small sizes: 2 at 15px and under
 * (thin strokes break up on low-DPI screens), 1.75 above.
 */
export function Icon({
  icon,
  size = 16,
  className,
}: {
  icon: IconSvgElement;
  size?: number;
  className?: string;
}) {
  return (
    <HugeiconsIcon
      icon={icon}
      size={size}
      strokeWidth={size <= 15 ? 2 : 1.75}
      className={className}
      aria-hidden
    />
  );
}
