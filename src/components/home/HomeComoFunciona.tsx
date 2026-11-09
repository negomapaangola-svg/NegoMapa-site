import Image from 'next/image';

const passos = [
  { numero: '01', titulo: 'Pesquise', descricao: 'Escolha o que procura.', imagem: '/images/home/pesquisar.webp' },
  { numero: '02', titulo: 'Compare', descricao: 'Consulte os perfis.', imagem: '/images/home/comparar-perfil.webp' },
  { numero: '03', titulo: 'Contacte', descricao: 'Fale directamente.', imagem: '/images/home/contactar.webp' },
];

export function HomeComoFunciona() {
  return (
    <section className="nm-sec" aria-labelledby="como-funciona-title">
      <div className="nm-sec-head">
        <h2 id="como-funciona-title">Como funciona</h2>
      </div>
      <div className="nm-steps">
        {passos.map((passo) => (
          <div className="nm-step" key={passo.numero}>
            <Image
              src={passo.imagem}
              alt=""
              width={400}
              height={240}
              loading="lazy"
              sizes="(min-width: 901px) 33vw, 100vw"
              className="nm-card-img"
            />
            <div className="nm-card-body">
              <span className="nm-step-number">{passo.numero}</span>
              <h3>{passo.titulo}</h3>
              <p>{passo.descricao}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
