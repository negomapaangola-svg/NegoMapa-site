import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface HomeHeroProps {
  children?: ReactNode;
}

export function HomeHero({ children }: HomeHeroProps) {
  return (
    <section className="nm-hero" aria-labelledby="hero-title">
      <div className="nm-hero-art">
        <Image
          src="/images/hero/hero-plataforma-clientes-profissionais.png"
          alt="Clientes e profissionais a usar o NegóMapa"
          width={1536}
          height={864}
          priority
          sizes="(min-width: 1024px) 860px, 100vw"
          className="nm-hero-img"
        />
      </div>
      <div className="nm-hero-content">
        <span className="nm-eyebrow">NegóMapa · Angola</span>
        <h1 id="hero-title">Encontre serviços, produtos e oportunidades em Angola.</h1>
        <p className="nm-lead">
          Pesquise serviços e produtos perto de si, descubra profissionais qualificados, empresas e vagas de emprego.
        </p>
        {children}
        <Link href="/cadastrar-servico" className="nm-hero-secondary">
          Publicar serviço <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}
