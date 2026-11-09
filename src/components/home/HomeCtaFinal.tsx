import Image from 'next/image';
import Link from 'next/link';

export function HomeCtaFinal() {
  return (
    <section className="nm-sec" aria-label="Comece no NegóMapa">
      <div className="nm-cta-grid">
        <div className="nm-cta">
          <Image
            src="/images/home/precisa-servico.webp"
            alt="Cliente a conversar com um profissional num ambiente doméstico"
            width={720}
            height={405}
            sizes="(max-width: 640px) 100vw, 50vw"
            className="nm-cta-image"
          />
          <h2>Precisa de um serviço?</h2>
          <p>Encontre um profissional perto de si.</p>
          <Link href="/profissionais" className="nm-btn nm-btn-p">
            Encontrar um profissional <span aria-hidden="true">→</span>
          </Link>
        </div>
        <div className="nm-cta">
          <Image
            src="/images/home/oferece-servico.webp"
            alt="Profissional independente a trabalhar numa oficina"
            width={720}
            height={405}
            sizes="(max-width: 640px) 100vw, 50vw"
            className="nm-cta-image"
          />
          <h2>Oferece um serviço?</h2>
          <p>Crie o seu perfil profissional.</p>
          <Link href="/cadastrar-profissional" className="nm-btn nm-btn-g">
            Criar perfil profissional <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
