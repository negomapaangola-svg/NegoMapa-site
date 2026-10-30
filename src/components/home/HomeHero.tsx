import Link from 'next/link';

/** Hero do protótipo: texto à esquerda, painel visual à direita (sem fotografias, ver relatório). */
export function HomeHero() {
  return (
    <section className="nm-hero" aria-labelledby="hero-title">
      <div>
        <span className="nm-eyebrow">NegóMapa</span>
        <h1 id="hero-title">Tudo o que precisa para crescer em Angola</h1>
        <p className="nm-lead">
          A NegóMapa liga clientes, profissionais, empresas e investidores. Encontre serviços, vagas e oportunidades perto de si.
        </p>
        <div className="nm-caminhos" aria-label="Ligações por perfil">
          <Link href="/servicos" className="nm-btn nm-btn-g">Clientes</Link>
          <Link href="/profissionais" className="nm-btn nm-btn-g">Profissionais</Link>
          <Link href="/empresas" className="nm-btn nm-btn-g">Empresas</Link>
          <Link href="/investimentos" className="nm-btn nm-btn-g">Investidores</Link>
        </div>
      </div>
      <div className="nm-art" aria-hidden="true">
        <div className="nm-art-tile">Serviços<span>Perto de si</span></div>
        <div className="nm-art-tile">Profissionais<span>Avaliações reais</span></div>
        <div className="nm-art-tile">Vagas<span>Todas as províncias</span></div>
        <div className="nm-art-tile">Investimento<span>Parceiros</span></div>
      </div>
    </section>
  );
}
