// src/components/SmartImage.jsx
import React from "react";
import clsx from "clsx";

/**
 * SmartImage
 * - lazy loads by default
 * - async decodes by default
 * - allows passing `sizes` for responsive layout
 * - keeps your classes/props intact
 *
 * Props:
 *  - src (string, required)
 *  - alt (string, required for a11y)
 *  - loading ("lazy" | "eager") default "lazy"
 *  - decoding ("async" | "sync" | "auto") default "async"
 *  - fetchPriority ("high" | "low" | "auto") default "low"
 *  - sizes (string) optional, highly recommended on grids/cards
 *  - className, style, ...rest forwarded
 */
export default function SmartImage({
  src,
  alt = "",
  loading = "lazy",
  decoding = "async",
  fetchPriority = "low",
  sizes,
  className,
  ...rest
}) {
  // Guard: empty source
  if (!src) {
    return (
      <div
        className={clsx(
          "bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-400 dark:text-gray-500",
          className
        )}
        role="img"
        aria-label={alt || "image placeholder"}
      >
        {/* simple placeholder */}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      decoding={decoding}
      fetchpriority={fetchPriority}
      sizes={sizes}
      className={className}
      {...rest}
    />
  );
}
