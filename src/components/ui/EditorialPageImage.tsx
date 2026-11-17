import Image from 'next/image';

type EditorialPageImageProps = {
  src: string;
  alt: string;
};

export function EditorialPageImage({ src, alt }: EditorialPageImageProps) {
  return (
    <div className="relative mb-6 aspect-[16/6] w-full overflow-hidden rounded-2xl border border-card-border bg-neutral-100 dark:bg-neutral-900 sm:mb-8 sm:aspect-[16/5]">
      <Image
        src={src}
        alt={alt}
        fill
        priority
        sizes="(max-width: 640px) 100vw, (max-width: 1280px) 92vw, 1200px"
        className="object-cover"
        onError={(event) => {
          event.currentTarget.style.visibility = 'hidden';
        }}
      />
    </div>
  );
}
