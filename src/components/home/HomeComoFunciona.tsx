const passos = [
  { numero: '01', titulo: 'Pesquise', descricao: 'Escolha o que procura.' },
  { numero: '02', titulo: 'Compare', descricao: 'Consulte os perfis.' },
  { numero: '03', titulo: 'Contacte', descricao: 'Fale directamente.' },
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
            <span className="nm-step-number">{passo.numero}</span>
            <div>
              <h3>{passo.titulo}</h3>
              <p>{passo.descricao}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
