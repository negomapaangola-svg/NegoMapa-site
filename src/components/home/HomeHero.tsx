import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { IMAGENS } from '@/lib/imagens';

/** Hero: texto à esquerda, ilustração da marca à direita. Única imagem acima da dobra (priority). */
interface HomeHeroProps {
  /** Pesquisa do protótipo: fica na coluna de texto, abaixo do lead. */
  children?: ReactNode;
}

export function HomeHero({ children }: HomeHeroProps) {
  return (
    <section className="nm-hero" aria-labelledby="hero-title">
      <div>
        <span className="nm-eyebrow">NegóMapa</span>
        <h1 id="hero-title">Tudo o que precisa para crescer em Angola</h1>
        <p className="nm-lead">
          A NegóMapa liga clientes, profissionais, empresas e investidores. Encontre serviços, vagas e oportunidades perto de si.
        </p>
        {children}
        <div className="nm-caminhos" aria-label="Ligações por perfil">
          <Link href="/servicos" className="nm-btn nm-btn-g">Clientes</Link>
          <Link href="/profissionais" className="nm-btn nm-btn-g">Profissionais</Link>
          <Link href="/empresas" className="nm-btn nm-btn-g">Empresas</Link>
          <Link href="/investimentos" className="nm-btn nm-btn-g">Investidores</Link>
        </div>
      </div>
      <div className="nm-hero-art">
        <Image
          src={IMAGENS.hero}
          alt=""
          width={1672}
          height={941}
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className="h-auto w-full"
        />
      </div>
    </section>
  );
}
