import Image from 'next/image';
import Link from 'next/link';

const caminhos = [
  {
    titulo: 'Serviços',
    descricao: 'Encontre quem pode ajudar.',
    href: '/servicos',
    imagem: '/images/home/servicos.webp',
    alt: 'Técnico angolano a trabalhar numa instalação eléctrica',
  },
  {
    titulo: 'Profissionais',
    descricao: 'Descubra quem pode ajudar.',
    href: '/profissionais',
    imagem: '/images/home/profissionais.webp',
    alt: 'Profissional de costura no seu espaço de trabalho',
  },
  {
    titulo: 'Empresas',
    descricao: 'Conheça empresas.',
    href: '/empresas',
    imagem: '/images/home/empresas.webp',
    alt: 'Pequeno empresário à entrada da sua loja',
  },
  {
    titulo: 'Vagas',
    descricao: 'Encontre oportunidades.',
    href: '/vagas',
    imagem: '/images/home/vagas.webp',
    alt: 'Candidata numa conversa de entrevista profissional',
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
            <span className="nm-path-media">
              <Image
                src={caminho.imagem}
                alt={caminho.alt}
                width={640}
                height={480}
                sizes="(max-width: 640px) 100vw, (max-width: 900px) 48vw, 25vw"
                className="nm-card-image"
              />
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
