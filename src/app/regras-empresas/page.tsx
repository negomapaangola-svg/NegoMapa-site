import { Metadata } from 'next';
import { PaginaLegal, Seccao } from '@/components/legal/PaginaLegal';

export const metadata: Metadata = {
  title: 'Regras para Empresas | NegóMapa',
  description: 'Regras de registo, publicação de vagas e conduta para empresas na plataforma NegóMapa.',
};

export default function RegrasEmpresasPage() {
  return (
    <PaginaLegal
      titulo="Regras para Empresas"
      descricao="Condições para registar uma empresa e publicar vagas na NegóMapa."
      atualizadoEm="2 de novembro de 2026"
    >
      <Seccao titulo="1. Âmbito">
        <p>
          Estas regras aplicam-se às empresas que se registam na plataforma para divulgar o seu perfil e publicar vagas
          de emprego, e complementam os Termos de Utilização.
        </p>
      </Seccao>

      <Seccao titulo="2. Registo e aprovação">
        <ul className="list-disc pl-6 space-y-2">
          <li>O registo exige conta de utilizador e dados reais da empresa.</li>
          <li>Podem ser pedidos documentos de comprovação de existência legal da empresa.</li>
          <li>O perfil só fica público após aprovação pela equipa da NegóMapa.</li>
        </ul>
      </Seccao>

      <Seccao titulo="3. Publicação de vagas">
        <ul className="list-disc pl-6 space-y-2">
          <li>As vagas devem corresponder a oportunidades reais e ter descrição clara de funções e requisitos.</li>
          <li>Não se admitem vagas que cobrem taxas aos candidatos, que pedam dados financeiros ou que tenham fins fraudulentos.</li>
          <li>Não se admitem vagas discriminatórias por motivos legalmente protegidos.</li>
          <li>A empresa deve manter a vaga atualizada e encerrá-la quando deixar de estar disponível.</li>
        </ul>
      </Seccao>

      <Seccao titulo="4. Tratamento dos contactos de candidatos">
        <p>
          Os dados dos candidatos recebidos por qualquer canal ligado a uma vaga devem ser usados apenas para avaliar a
          candidatura, não podem ser cedidos a terceiros nem utilizados para outras finalidades, e devem ser eliminados
          quando deixarem de ser necessários.
        </p>
      </Seccao>

      <Seccao titulo="5. Conduta">
        <ul className="list-disc pl-6 space-y-2">
          <li>Não publicar avaliações falsas nem manipular a reputação da empresa.</li>
          <li>Não usar a plataforma para difundir spam ou conteúdos ilegais.</li>
          <li>Respeitar os candidatos e responder com boa-fé aos contactos recebidos.</li>
        </ul>
      </Seccao>

      <Seccao titulo="6. Suspensão e remoção">
        <p>
          O incumprimento destas regras pode levar à recusa, suspensão ou remoção de vagas ou do perfil da empresa, sem
          prejuízo de outras medidas previstas na lei.
        </p>
      </Seccao>
    </PaginaLegal>
  );
}
