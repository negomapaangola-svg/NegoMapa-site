import Image from 'next/image';
import type { ReactNode } from 'react';
import Link from 'next/link';

interface HomeHeroProps {
  children?: ReactNode;
}

export function HomeHero({ children }: HomeHeroProps) {
  return (
    <section className="nm-hero" aria-labelledby="hero-title">
      <div className="nm-hero-content">
        <span className="nm-eyebrow">NegóMapa · Angola</span>
        <h1 id="hero-title">Encontre serviços, profissionais e oportunidades em Angola</h1>
        <p className="nm-lead">
          Pesquise serviços perto de si, descubra profissionais qualificados e encontre vagas de emprego.
        </p>
        {children}
        <Link href="/cadastrar-servico" className="nm-hero-secondary">
          Publicar serviço <span aria-hidden="true">→</span>
        </Link>
      </div>
      <div className="nm-hero-media">
        <Image
          src="/images/hero/hero-plataforma-clientes-profissionais.png"
          alt="Clientes e profissionais a ligarem-se através do NegóMapa"
          width={1200}
          height={900}
          priority
          sizes="(max-width: 640px) 100vw, (max-width: 1100px) 48vw, 560px"
          className="nm-hero-image"
        />
      </div>
    </section>
  );
}
