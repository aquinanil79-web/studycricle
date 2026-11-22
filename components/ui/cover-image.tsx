import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import { cn, isAllowedImageUrl } from "@/lib/utils";

/**
 * Cover picture for a club or event. Without an image it shows a pine
 * gradient with an icon, so cards never look broken.
 * Set the height/aspect ratio with className, e.g. className="aspect-video".
 */
export function CoverImage({
  src,
  alt,
  icon: Icon,
  sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
  preload = false,
  className,
}: {
  src?: string | null;
  alt: string;
  icon: LucideIcon;
  sizes?: string;
  preload?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden bg-linear-to-br from-pine-700 to-pine-950", className)}>
      {src && isAllowedImageUrl(src) ? (
        <Image src={src} alt={alt} fill sizes={sizes} preload={preload} className="object-cover" />
      ) : (
        <div className="bg-dots absolute inset-0 flex items-center justify-center text-pine-200/70">
          <Icon className="size-10" aria-hidden="true" />
        </div>
      )}
    </div>
  );
}
