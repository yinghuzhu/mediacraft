import { useState } from 'react';
import Image from 'next/image';

export default function ImageWithFallback({
  src,
  fallbackSrc = '/images/placeholder.jpg',
  alt,
  ...props
}) {
  const [imgSrc, setImgSrc] = useState(src);
  
  return (
    <Image
      {...props}
      src={imgSrc}
      alt={alt}
      onError={() => {
        setImgSrc(fallbackSrc);
      }}
    />
  );
}