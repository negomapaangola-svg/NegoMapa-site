import Link from 'next/link';

const caminhos = [
  {
    titulo: 'Serviços',
    descricao: 'Encontre quem pode ajudar.',
    href: '/servicos',
    icone: <><path d="M3 7.5h18v12H3z" /><path d="M8 7.5V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2.5M3 12h18M10 12v2h4v-2" /></>,
  },
  {
    titulo: 'Profissionais',
    descricao: 'Descubra quem pode ajudar.',
    href: '/profissionais',
    icone: <><circle cx="9" cy="8" r="3" /><path d="M3 20v-1a6 6 0 0 1 12 0v1M16 5.5a3 3 0 0 1 0 5.8M18 14a5 5 0 0 1 3 5v1" /></>,
  },
  {
    titulo: 'Empresas',
    descricao: 'Conheça empresas.',
    href: '/empresas',
    icone: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M8 20v-4h8v4M8 8h.01M12 8h.01M16 8h.01M8 12h.01M12 12h.01M16 12h.01" /></>,
  },
  {
    titulo: 'Vagas',
    descricao: 'Encontre oportunidades.',
    href: '/vagas',
    icone: <><rect x="3" y="7" width="18" height="14" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2" /></>,
  },
];

export function HomeCaminhos() {
  return (
    <section className="nm-sec" aria-labelledby="caminhos-title">
      <div className="nm-sec-head">
        <h2 id="caminhos-title">O que procura?</h2>
      </div>
      <div className="nm-path-grid">
        {caminhos.map((caminho) => (
          <Link key={caminho.href} href={caminho.href} className="nm-path-card">
            <span className="nm-path-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                {caminho.icone}
              </svg>
            </span>
            <h3>{caminho.titulo}</h3>
            <p>{caminho.descricao}</p>
            <span className="nm-path-link">Explorar <span aria-hidden="true">→</span></span>
          </Link>
        ))}
      </div>
    </section>
  );
}
