import Image from 'next/image';
import Link from 'next/link';

const caminhos = [
  {
    titulo: 'Serviços',
    descricao: 'Encontre profissionais qualificados para o que precisa.',
    href: '/servicos',
    imagem: '/images/home/servicos.webp',
    alt: 'Técnico angolano a trabalhar numa instalação eléctrica',
  },
  {
    titulo: 'Produtos',
    descricao: 'Descubra produtos de empresas angolanas.',
    href: '/empresas',
    imagem: '/images/home/produtos.webp',
    alt: 'Produtos disponíveis numa empresa angolana',
  },
  {
    titulo: 'Profissionais',
    descricao: 'Encontre profissionais qualificados perto de si.',
    href: '/profissionais',
    imagem: '/images/home/profissionais.webp',
    alt: 'Profissional de costura no seu espaço de trabalho',
  },
  {
    titulo: 'Empresas',
    descricao: 'Encontre empresas e negócios locais.',
    href: '/empresas',
    imagem: '/images/home/empresas.webp',
    alt: 'Pequeno empresário à entrada da sua loja',
  },
  {
    titulo: 'Vagas',
    descricao: 'Encontre oportunidades de emprego em Angola.',
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
          <Link key={caminho.titulo} href={caminho.href} className="nm-path-card">
            <span className="nm-path-media">
              <Image
                src={caminho.imagem}
                alt={caminho.alt}
                width={640}
                height={480}
                sizes="(max-width: 640px) 100vw, (max-width: 800px) 48vw, (max-width: 1100px) 31vw, 19vw"
                loading="lazy"
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
