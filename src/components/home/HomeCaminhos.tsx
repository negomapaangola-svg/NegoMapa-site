import Image from 'next/image';
import Link from 'next/link';

const caminhos = [
  {
    titulo: 'Serviços',
    descricao: 'Encontre profissionais qualificados para o que precisa.',
    href: '/servicos',
    imagem: '/images/home/servicos.webp',
  },
  {
    titulo: 'Produtos',
    descricao: 'Descubra produtos de empresas angolanas.',
    href: '/empresas',
    imagem: '/images/home/profissionais.webp',
  },
  {
    titulo: 'Empresas',
    descricao: 'Encontre empresas e negócios locais.',
    href: '/empresas',
    imagem: '/images/home/empresas.webp',
  },
  {
    titulo: 'Vagas',
    descricao: 'Encontre oportunidades de emprego em Angola.',
    href: '/vagas',
    imagem: '/images/home/vagas.webp',
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
            <Image
              src={caminho.imagem}
              alt=""
              width={640}
              height={480}
              loading="lazy"
              sizes="(min-width: 901px) 25vw, (min-width: 641px) 50vw, 100vw"
              className="nm-card-img"
            />
            <div className="nm-card-body">
              <h3>{caminho.titulo}</h3>
              <p>{caminho.descricao}</p>
              <span className="nm-path-link">Explorar <span aria-hidden="true">→</span></span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
