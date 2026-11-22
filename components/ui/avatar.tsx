import Image from "next/image";
import { cn, initials, isAllowedImageUrl } from "@/lib/utils";

type Size = "sm" | "md" | "lg" | "xl";

const sizes: Record<Size, { box: string; pixels: number }> = {
  sm: { box: "size-8 text-xs", pixels: 32 },
  md: { box: "size-10 text-sm", pixels: 40 },
  lg: { box: "size-14 text-lg", pixels: 56 },
  xl: { box: "size-24 text-3xl", pixels: 96 },
};

/** Profile picture, or the person's initials when they have not uploaded one. */
export function Avatar({
  name,
  src,
  size = "md",
  className,
}: {
  name: string;
  src?: string | null;
  size?: Size;
  className?: string;
}) {
  const { box, pixels } = sizes[size];
  // Anything that is not one of our own image URLs falls back to the initials.
  const image = src && isAllowedImageUrl(src) ? src : null;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-pine-200 font-semibold text-pine-900",
        box,
        className,
      )}
    >
      {image ? (
        <Image src={image} alt={name} width={pixels} height={pixels} className="size-full object-cover" />
      ) : (
        <span aria-hidden="true">{initials(name)}</span>
      )}
      {!image && <span className="sr-only">{name}</span>}
    </span>
  );
}
