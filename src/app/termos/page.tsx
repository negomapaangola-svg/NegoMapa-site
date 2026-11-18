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
      atualizadoEm="18 de novembro de 2026"
    >
      <Seccao titulo="1. Objeto">
        <p>
          A NegóMapa é uma plataforma digital que aproxima clientes, profissionais e empresas em Angola,
          permitindo pesquisar serviços e vagas de emprego, consultar perfis públicos e contactar os
          anunciantes.
        </p>
        <p>
          A NegóMapa atua como intermediário entre utilizadores. Não é empregador, agência de emprego,
          prestador dos serviços anunciados, garantidor da qualidade dos serviços ou parte nos contratos
          celebrados entre utilizadores.
        </p>
      </Seccao>

      <Seccao titulo="2. Responsável pela plataforma">
        <p>
          A plataforma NegóMapa é gerida por Fred Tomás. Para questões relacionadas com estes Termos,
          contacte-nos através do e-mail negomapaangola@gmail.com ou do WhatsApp 926 311 857.
        </p>
      </Seccao>

      <Seccao titulo="3. Aceitação">
        <p>
          Ao aceder, registar-se ou utilizar a plataforma, o utilizador declara ter lido, compreendido e
          aceite estes Termos de Utilização, a Política de Privacidade e a Política de Cookies.
        </p>
        <p>
          Se não concordar com qualquer parte destas condições, deve abster-se de utilizar a plataforma.
        </p>
      </Seccao>

      <Seccao titulo="4. Contas e registo">
        <p>
          Para criar perfis profissionais ou empresariais é necessário criar uma conta. O utilizador
          compromete-se a fornecer informação verdadeira, atual e completa, e a manter a confidencialidade
          das suas credenciais.
        </p>
        <p>
          Os perfis profissionais e empresariais ficam sujeitos a aprovação pela equipa da NegóMapa e só
          ficam publicamente visíveis após essa aprovação.
        </p>
        <p>
          O utilizador é responsável por toda a atividade realizada através da sua conta. Caso suspeite de
          acesso não autorizado, deve alterar imediatamente a palavra-passe e contactar a NegóMapa.
        </p>
      </Seccao>

      <Seccao titulo="5. Login com Google">
        <p>
          A NegóMapa pode permitir o início de sessão através da opção “Continuar com Google”. Ao utilizar
          esta funcionalidade, o utilizador autoriza a NegóMapa a receber informações básicas da sua conta
          Google, como nome, endereço de correio eletrónico, fotografia de perfil e identificador de conta,
          conforme as permissões autorizadas.
        </p>
        <p>
          A NegóMapa não recebe a palavra-passe da conta Google do utilizador. O tratamento dos dados
          recebidos através do Google segue a Política de Privacidade da NegóMapa.
        </p>
      </Seccao>

      <Seccao titulo="6. Conteúdos publicados">
        <p>
          O utilizador é responsável pelos conteúdos que publica, incluindo descrições, fotografias,
          portefólios, avaliações, comentários, vagas e outras informações.
        </p>
        <p>
          É proibido publicar conteúdos ilícitos, enganosos, ofensivos, difamatórios, discriminatórios,
          violentos, sexuais, fraudulentos, que violem direitos de terceiros ou que contenham dados pessoais
          de outras pessoas sem base legal para o fazer.
        </p>
        <p>
          É igualmente proibido publicar spam, conteúdo duplicado, links maliciosos, esquemas de fraude,
          ofertas enganosas, vagas falsas, perfis falsos, conteúdo que promova discriminação ou qualquer
          material que viole a lei angolana aplicável.
        </p>
      </Seccao>

      <Seccao titulo="7. Avaliações e denúncias">
        <p>
          As avaliações devem basear-se em experiências reais. É proibido criar avaliações falsas, comprar ou
          vender avaliações, usar contas falsas, publicar comentários ofensivos, difamatórios, enganosos ou
          que violem direitos de terceiros.
        </p>
        <p>
          Qualquer utilizador pode denunciar conteúdos, perfis, empresas, vagas ou avaliações que considere
          inadequados, fraudulentos, ilegais ou em violação destes Termos.
        </p>
        <p>
          A NegóMapa pode analisar denúncias, remover conteúdos, ocultar perfis, suspender contas ou tomar
          outras medidas necessárias para proteger utilizadores e a integridade da plataforma.
        </p>
      </Seccao>

      <Seccao titulo="8. Relações entre utilizadores">
        <p>
          A NegóMapa facilita o contacto entre utilizadores, mas não é parte nos contratos celebrados entre
          clientes, profissionais e empresas.
        </p>
        <p>
          A NegóMapa não garante a qualidade, segurança, disponibilidade, legalidade, pontualidade ou
          resultado dos serviços, profissionais, empresas ou vagas anunciados.
        </p>
        <p>
          Os utilizadores devem avaliar com cuidado os perfis, serviços, vagas e propostas antes de celebrar
          qualquer acordo, efetuar pagamento ou partilhar informações pessoais.
        </p>
      </Seccao>

      <Seccao titulo="9. Propriedade intelectual">
        <p>
          O nome NegóMapa, logótipo, design, interface, código-fonte, base de dados, textos, imagens e
          demais conteúdos originais da plataforma são protegidos por direitos de propriedade intelectual.
        </p>
        <p>
          É proibido copiar, reproduzir, modificar, distribuir, revender, criar obras derivadas, extrair
          dados em massa, realizar scraping, clonar a plataforma ou utilizar a marca NegóMapa sem
          autorização prévia e escrita do responsável pela plataforma.
        </p>
        <p>
          Os conteúdos publicados pelos utilizadores continuam a pertencer aos respetivos autores. Ao
          publicar conteúdo na plataforma, o utilizador concede à NegóMapa uma licença limitada, não
          exclusiva e gratuita para armazenar, exibir, distribuir e utilizar esse conteúdo dentro da
          plataforma, para os fins necessários ao funcionamento do serviço.
        </p>
      </Seccao>

      <Seccao titulo="10. Denúncias de violação de direitos">
        <p>
          Se considerar que um conteúdo publicado na NegóMapa viola os seus direitos de autor, marca,
          propriedade intelectual, privacidade ou outros direitos, pode enviar uma denúncia para
          negomapaangola@gmail.com.
        </p>
        <p>
          A denúncia deve incluir, pelo menos, identificação do denunciante, descrição do conteúdo alegadamente
          violado, URL ou localização do conteúdo na plataforma, explicação da violação e declaração de boa-fé.
        </p>
        <p>
          A NegóMapa poderá remover ou restringir o acesso ao conteúdo denunciado, suspender a conta
          responsável e solicitar informações adicionais, conforme necessário.
        </p>
      </Seccao>

      <Seccao titulo="11. Suspensão e eliminação de contas">
        <p>
          A NegóMapa pode recusar, suspender, limitar ou eliminar contas, perfis, vagas, serviços,
          avaliações ou outros conteúdos que violem estes Termos, a lei aplicável ou a segurança da
          plataforma.
        </p>
        <p>
          A medida pode ser aplicada sem aviso prévio quando exista risco de fraude, segurança, conteúdo
          ilegal, abuso grave ou violação dos direitos de terceiros.
        </p>
      </Seccao>

      <Seccao titulo="12. Limitação de responsabilidade">
        <p>
          A plataforma é disponibilizada no estado em que se encontra e conforme disponível. Na medida
          permitida pela lei, a NegóMapa não responde por danos indiretos, lucros cessantes, perda de
          oportunidades, perda de dados ou prejuízos resultantes de interrupções do serviço, erros,
          atuação de terceiros, fraudes, conflitos entre utilizadores ou contratos celebrados fora da
          plataforma.
        </p>
        <p>
          A NegóMapa não garante que o site estará disponível de forma contínua, sem erros ou sem
          interrupções.
        </p>
      </Seccao>

      <Seccao titulo="13. Alterações">
        <p>
          A NegóMapa pode alterar estes Termos de Utilização a qualquer momento. As alterações entram em
          vigor na data da sua publicação nesta página.
        </p>
        <p>
          O uso continuado da plataforma após a publicação de alterações relevantes implica aceitação das
          novas condições.
        </p>
      </Seccao>

      <Seccao titulo="14. Lei aplicável e resolução de conflitos">
        <p>
          Estes Termos são regidos pela lei angolana aplicável.
        </p>
        <p>
          Qualquer conflito relacionado com a utilização da plataforma será resolvido, na medida do possível,
          por negociação amigável. Não sendo possível chegar a acordo, a questão será submetida aos tribunais
          competentes em Angola.
        </p>
      </Seccao>

      <Seccao titulo="15. Contacto">
        <p>
          Para questões sobre estes Termos, denúncias, propriedade intelectual, privacidade ou utilização da
          plataforma, contacte-nos através do e-mail negomapaangola@gmail.com ou do WhatsApp 926 311 857.
        </p>
      </Seccao>
    </PaginaLegal>
  );
}
