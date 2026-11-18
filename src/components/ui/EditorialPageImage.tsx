"use client";

import { useState } from 'react';
import Image from 'next/image';

type EditorialPageImageProps = {
  src: string;
  alt: string;
};

export function EditorialPageImage({ src, alt }: EditorialPageImageProps) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div className="relative mb-6 aspect-[4/3] w-full overflow-hidden rounded-2xl border border-card-border bg-gradient-to-br from-orange-100 via-amber-50 to-neutral-100 dark:from-neutral-800 dark:via-neutral-900 dark:to-neutral-950 sm:mb-8 sm:aspect-[4/3]">
      <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center text-sm font-semibold tracking-[0.2em] text-orange-900 dark:text-orange-100">
        NEGÓMAPA
      </span>
      {!imageFailed && (
        <Image
          src={src}
          alt={alt}
          fill
          priority
          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 92vw, 1200px"
          className="object-cover"
          onError={() => setImageFailed(true)}
        />
      )}
    </div>
  );
}
