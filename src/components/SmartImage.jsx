// src/components/SmartImage.jsx
import React from 'react';

export default function SmartImage({
  src,
  alt = '',
  className = '',
  width,       // optional intrinsic
  height,      // optional intrinsic
  sizes = '(max-width: 768px) 100vw, 50vw', // card-friendly default
  loading = 'lazy',
  decoding = 'async',
  ...rest
}) {
  // If you want srcset, add simple up/downscales here later.
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      decoding={decoding}
      width={width}
      height={height}
      sizes={sizes}
      {...rest}
    />
  );
}
