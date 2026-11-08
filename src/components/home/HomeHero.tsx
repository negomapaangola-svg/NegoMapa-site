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
    </section>
  );
}
