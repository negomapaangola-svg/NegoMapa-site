import type { ReactNode } from 'react';
import Image from 'next/image';
import { HeroImage } from '@/components/ui/HeroImage';
import { IMAGENS } from '@/lib/imagens';

/**
 * Hero: texto à esquerda, ilustração à direita.
 * Usa imagemUrl (HeroImage) quando existir; caso contrário, a ilustração PNG v4 da marca.
 * Única imagem acima da dobra (priority).
 */
interface HomeHeroProps {
  children?: ReactNode;
  imagemUrl?: string | null;
}

export function HomeHero({ children, imagemUrl }: HomeHeroProps) {
  return (
    <section className="nm-hero" aria-labelledby="hero-title">
      <div className="nm-hero-content">
        <span className="nm-eyebrow">NegóMapa</span>
        <h1 id="hero-title">Encontre serviços e oportunidades em Angola</h1>
        <p className="nm-lead">
          Pesquise serviços, profissionais e empresas perto de si.
        </p>
        {children}
      </div>
      <div className="nm-hero-art" aria-hidden="true">
        {imagemUrl ? (
          <HeroImage
            src={imagemUrl}
            alt="Ilustração do NegóMapa"
            width={800}
            height={600}
            className="nm-hero-imagem"
          />
        ) : (
          <Image
            src={IMAGENS.hero}
            alt=""
            width={1672}
            height={941}
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className="h-auto w-full"
          />
        )}
      </div>
    </section>
  );
}
