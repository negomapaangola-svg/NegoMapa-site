import Link from 'next/link';
import type { Perfil } from './constants';

interface Props {
  perfil: Perfil;
}

export function HomeCtaFinal({ perfil }: Props) {
  const conteudo =
    perfil === 'visitante'
      ? {
          titulo: 'Comece a usar a NegóMapa',
          texto: 'Crie a sua conta grátis e encontre serviços, profissionais, vagas e oportunidades em Angola.',
          acoes: [
            { href: '/login', label: 'Entrar', primario: false },
            { href: '/cadastrar-empresa', label: 'Criar conta grátis', primario: true },
          ],
        }
      : perfil === 'profissional'
        ? {
            titulo: 'Mantenha o seu perfil atualizado',
            texto: 'Um perfil completo recebe mais pedidos. Atualize os seus dados e a sua disponibilidade.',
            acoes: [
              { href: '/editar-perfil', label: 'Editar perfil', primario: false },
              { href: '/vagas', label: 'Ver vagas', primario: true },
            ],
          }
        : {
            titulo: 'Encontre o talento de que precisa',
            texto: 'Publique vagas e gerencie as suas candidaturas num só lugar.',
            acoes: [
              { href: '/empresa/painel/vagas/nova', label: 'Publicar vaga', primario: true },
              { href: '/empresa/painel/vagas', label: 'Gerir vagas', primario: false },
            ],
          };

  return (
    <section className="nm-sec" aria-labelledby="cta-final-title">
      <div className="nm-cta">
        <div>
          <h2 id="cta-final-title">{conteudo.titulo}</h2>
          <p>{conteudo.texto}</p>
        </div>
        <div className="nm-acoes">
          {conteudo.acoes.map((a) => (
            <Link key={a.href} href={a.href} className={`nm-btn ${a.primario ? 'nm-btn-p' : 'nm-btn-g'}`}>
              {a.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
