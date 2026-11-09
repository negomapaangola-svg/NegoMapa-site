import Image from 'next/image';

const passos = [
  {
    numero: '01',
    titulo: 'Pesquise',
    descricao: 'Escolha o que procura.',
    imagem: '/images/home/pesquisar.webp',
    alt: 'Pessoa a pesquisar um serviço no telemóvel',
  },
  {
    numero: '02',
    titulo: 'Compare',
    descricao: 'Consulte os perfis.',
    imagem: '/images/home/comparar-perfil.webp',
    alt: 'Pessoa a consultar um perfil profissional num computador',
  },
  {
    numero: '03',
    titulo: 'Contacte',
    descricao: 'Fale directamente.',
    imagem: '/images/home/contactar.webp',
    alt: 'Mãos a escrever uma mensagem num telemóvel',
  },
];

export function HomeComoFunciona() {
  return (
    <section className="nm-sec" aria-labelledby="como-funciona-title">
      <div className="nm-sec-head">
        <h2 id="como-funciona-title">Como funciona</h2>
      </div>
      <div className="nm-steps">
        {passos.map((passo) => (
          <article className="nm-step" key={passo.numero}>
            <div className="nm-step-media">
              <Image
                src={passo.imagem}
                alt={passo.alt}
                width={400}
                height={240}
                sizes="(max-width: 640px) 100vw, 33vw"
                className="nm-card-image"
              />
            </div>
            <div className="nm-step-copy">
              <span className="nm-step-number">{passo.numero}</span>
              <div>
                <h3>{passo.titulo}</h3>
                <p>{passo.descricao}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
