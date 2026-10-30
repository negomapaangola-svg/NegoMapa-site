import Link from 'next/link';
import { HomeSection, EstadoVazio } from './HomeSection';
import type { Perfil } from './constants';

interface Props {
  perfil: Perfil;
}

/**
 * Não existe tabela nem rota de investimentos na base de dados atual (secção PENDENTE).
 * Mostra estado vazio claro e o aviso de responsabilidade, sem inventar oportunidades.
 */
export function HomeInvestimentos({ perfil }: Props) {
  if (perfil === 'visitante') {
    return (
      <HomeSection id="home-investimentos" titulo="Oportunidades de investimento" descricao="Negócios angolanos que procuram parceiros.">
        <EstadoVazio
          titulo="As oportunidades são para utilizadores registados"
          texto="Entre na sua conta para consultar as oportunidades de investimento."
        >
          <Link href="/login?redirectTo=/" className="nm-btn nm-btn-p">Entrar</Link>
        </EstadoVazio>
      </HomeSection>
    );
  }

  return (
    <HomeSection id="home-investimentos" titulo="Oportunidades de investimento" descricao="Negócios angolanos que procuram parceiros.">
      <EstadoVazio
        titulo="Ainda não há oportunidades publicadas"
        texto={
          perfil === 'empresa'
            ? 'A publicação de investimentos ainda não está disponível nesta plataforma.'
            : 'As oportunidades de investimento aparecerão aqui quando forem publicadas.'
        }
      />
      <p className="nm-notice">
        <strong>Aviso de responsabilidade.</strong> As oportunidades são publicadas por terceiros. A NegóMapa não verifica retornos, não garante lucros e não presta aconselhamento financeiro.
      </p>
    </HomeSection>
  );
}
