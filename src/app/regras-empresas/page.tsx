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
      atualizadoEm="18 de novembro de 2026"
    >
      <Seccao titulo="1. Âmbito">
        <p>
          Estas regras aplicam-se às empresas que se registam na plataforma para divulgar o seu perfil e publicar vagas
          de emprego, e complementam os Termos de Utilização, a Política de Privacidade e a Política de Cookies.
        </p>
      </Seccao>

      <Seccao titulo="2. Registo e aprovação">
        <ul className="list-disc pl-6 space-y-2">
          <li>O registo exige uma conta de utilizador e informações reais da empresa.</li>
          <li>A empresa deve fornecer informações verdadeiras, atualizadas e completas.</li>
          <li>É proibido criar perfis falsos, duplicados, fraudulentos ou que representem empresas inexistentes.</li>
          <li>O perfil só fica público após aprovação pela equipa da NegóMapa.</li>
        </ul>
      </Seccao>

      <Seccao titulo="3. Publicação de vagas">
        <ul className="list-disc pl-6 space-y-2">
          <li>As vagas devem corresponder a oportunidades reais e ter descrição clara das funções, requisitos e condições.</li>
          <li>Não se admitem vagas que cobrem taxas aos candidatos, que solicitem dados financeiros sensíveis ou que tenham fins fraudulentos.</li>
          <li>Não se admitem vagas discriminatórias por motivos legalmente protegidos.</li>
          <li>A empresa deve manter a vaga atualizada e encerrá-la quando deixar de estar disponível.</li>
          <li>É proibido publicar vagas falsas, spam, esquemas de fraude, ofertas enganosas ou conteúdo ilegal.</li>
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
          <li>Não usar a plataforma para difundir spam, conteúdos ilegais, difamatórios, discriminatórios ou enganosos.</li>
          <li>Respeitar os candidatos e responder com boa-fé aos contactos recebidos.</li>
          <li>Não recolher, publicar ou utilizar dados pessoais de terceiros sem base legal ou autorização válida.</li>
        </ul>
      </Seccao>

      <Seccao titulo="6. Propriedade intelectual e marca">
        <p>
          É proibido copiar, clonar, modificar, distribuir, revender, extrair dados em massa, realizar scraping ou
          utilizar o nome, logótipo, design, código ou conteúdos originais da NegóMapa sem autorização prévia e escrita.
        </p>
      </Seccao>

      <Seccao titulo="7. Suspensão e remoção">
        <p>
          O incumprimento destas regras pode levar à recusa, suspensão ou remoção de vagas ou do perfil da empresa, sem
          prejuízo de outras medidas previstas na lei.
        </p>
        <p>
          Em casos de fraude, risco de segurança, conteúdo ilegal ou violação grave dos direitos de terceiros, a medida
          pode ser aplicada sem aviso prévio.
        </p>
      </Seccao>

      <Seccao titulo="8. Denúncias e contacto">
        <p>
          Para denunciar vagas fraudulentas, perfis falsos, spam, conteúdo ilegal, violação de direitos autorais, marca
          ou propriedade intelectual, contacte negomapaangola@gmail.com ou o WhatsApp 926 311 857.
        </p>
      </Seccao>
    </PaginaLegal>
  );
}
