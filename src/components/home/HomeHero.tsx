import type { ReactNode } from 'react';

interface HomeHeroProps {
  children?: ReactNode;
}

export function HomeHero({ children }: HomeHeroProps) {
  return (
    <section className="nm-hero" aria-labelledby="hero-title">
      <div>
        <span className="nm-eyebrow">NegóMapa</span>
        <h1 id="hero-title">Encontre serviços e oportunidades em Angola</h1>
        <p className="nm-lead">
          Pesquise serviços, profissionais e empresas perto de si.
        </p>
        {children}
      </div>
      <div className="nm-art" aria-hidden="true">
        <div className="nm-art-tile">Serviços<span>Perto de si</span></div>
        <div className="nm-art-tile">Profissionais<span>Avaliações reais</span></div>
        <div className="nm-art-tile">Vagas<span>Todas as províncias</span></div>
        <div className="nm-art-tile">Empresas<span>Verificadas</span></div>
      </div>
    </section>
  );
}
