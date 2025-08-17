import React from 'react';
import clsx from 'clsx';

export default function SmartImage({
  src,
  alt = '',
  className = '',
  loading = 'lazy',
  decoding = 'async',
  sizes,          // e.g. "(min-width:1024px) 33vw, 100vw"
  srcSet,         // optional responsive set if you pass one
  width,
  height,
  fetchpriority,  // e.g. "high" for LCP image
  ...rest
}) {
  // NOTE: width/height optional; we often rely on CSS aspect-* classes
  return (
    <img
      src={src}
      alt={alt}
      className={clsx(className)}
      loading={loading}
      decoding={decoding}
      sizes={sizes}
      srcSet={srcSet}
      width={width}
      height={height}
      fetchpriority={fetchpriority}
      {...rest}
    />
  );
}
