import { Metadata } from 'next';
import { PaginaLegal, Seccao } from '@/components/legal/PaginaLegal';

export const metadata: Metadata = {
  title: 'Termos de Utilização | NegóMapa',
  description: 'Condições de utilização da plataforma NegóMapa.',
};

export default function TermosPage() {
  return (
    <PaginaLegal
      titulo="Termos de Utilização"
      descricao="Estas condições regulam o acesso e a utilização da plataforma NegóMapa."
      atualizadoEm="2 de novembro de 2026"
    >
      <Seccao titulo="1. Objeto">
        <p>
          A NegóMapa é uma plataforma digital que aproxima clientes, profissionais e empresas em Angola, permitindo
          pesquisar serviços e vagas de emprego, consultar perfis públicos e contactar os anunciantes.
        </p>
      </Seccao>

      <Seccao titulo="2. Aceitação">
        <p>
          Ao aceder ou utilizar a plataforma, o utilizador declara ter lido e aceite estes termos. Se não concordar com
          qualquer parte deles, deve abster-se de utilizar a plataforma.
        </p>
      </Seccao>

      <Seccao titulo="3. Contas e registo">
        <p>
          Para criar perfis profissionais ou empresariais é necessário uma conta. O utilizador compromete-se a fornecer
          informação verdadeira, atual e completa, e a manter a confidencialidade das suas credenciais.
        </p>
        <p>
          Os perfis profissionais e empresariais ficam sujeitos a aprovação pela equipa da NegóMapa e só ficam
          publicamente visíveis após essa aprovação.
        </p>
      </Seccao>

      <Seccao titulo="4. Conteúdos publicados">
        <p>
          O utilizador é responsável pelos conteúdos que publica, incluindo descrições, fotografias, portefólios,
          avaliações e vagas. Não deve publicar conteúdos ilícitos, enganosos, ofensivos, que violem direitos de terceiros
          ou que contenham dados pessoais de outras pessoas sem base legal para o fazer.
        </p>
      </Seccao>

      <Seccao titulo="5. Relações entre utilizadores">
        <p>
          A NegóMapa facilita o contacto entre utilizadores, mas não é parte nos contratos celebrados entre clientes,
          profissionais e empresas, nem garante a qualidade, a disponibilidade ou o resultado dos serviços e vagas
          anunciados.
        </p>
      </Seccao>

      <Seccao titulo="6. Denúncias e moderação">
        <p>
          Qualquer utilizador pode denunciar conteúdos ou perfis que considere inadequados. A NegóMapa pode recusar,
          suspender ou remover conteúdos e contas que violem estes termos, sem prejuízo de outras medidas legais.
        </p>
      </Seccao>

      <Seccao titulo="7. Propriedade intelectual">
        <p>
          A marca, o logótipo, o design e o código da plataforma pertencem à NegóMapa ou aos seus licenciantes. Os
          conteúdos publicados pelos utilizadores continuam a pertencer aos respetivos autores, que concedem à NegóMapa
          a licença necessária para os apresentar na plataforma.
        </p>
      </Seccao>

      <Seccao titulo="8. Limitação de responsabilidade">
        <p>
          A plataforma é disponibilizada no estado em que se encontra. Na medida permitida pela lei, a NegóMapa não
          responde por danos indiretos, perda de oportunidades ou prejuízos resultantes de interrupções do serviço ou da
          atuação de terceiros.
        </p>
      </Seccao>

      <Seccao titulo="9. Alterações">
        <p>
          A NegóMapa pode alterar estes termos. As alterações entram em vigor na data da sua publicação nesta página.
        </p>
      </Seccao>

      <Seccao titulo="10. Lei aplicável">
        <p>
          Estes termos são regidos pela lei angolana. Para questões sobre estes termos, utilize a página de contacto.
        </p>
      </Seccao>
    </PaginaLegal>
  );
}
