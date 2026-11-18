import { Metadata } from 'next';
import { PaginaLegal, Seccao } from '@/components/legal/PaginaLegal';

export const metadata: Metadata = {
  title: 'Política de Cookies | NegóMapa',
  description: 'Informação sobre os cookies e tecnologias semelhantes utilizados na plataforma NegóMapa.',
};

export default function CookiesPage() {
  return (
    <PaginaLegal
      titulo="Política de Cookies"
      descricao="Esta página explica que cookies e tecnologias semelhantes são utilizados na plataforma NegóMapa."
      atualizadoEm="18 de novembro de 2026"
    >
      <Seccao titulo="1. O que são cookies">
        <p>
          Os cookies são pequenos ficheiros ou tecnologias semelhantes guardados no dispositivo do utilizador
          quando visita um site. Permitem manter a sessão iniciada, garantir o funcionamento da plataforma,
          guardar preferências e recolher informações sobre a utilização do site.
        </p>
      </Seccao>

      <Seccao titulo="2. Responsável e contacto">
        <p>
          O responsável pelo tratamento dos dados recolhidos através de cookies é Fred Tomás, responsável pela
          plataforma NegóMapa.
        </p>
        <p>
          Para questões relacionadas com cookies, privacidade ou proteção de dados, contacte-nos através do
          e-mail negomapaangola@gmail.com ou do WhatsApp 926 311 857.
        </p>
      </Seccao>

      <Seccao titulo="3. Cookies técnicos e estritamente necessários">
        <p>
          A NegóMapa utiliza cookies técnicos e estritamente necessários para manter a sessão do utilizador,
          proteger a autenticação, permitir o acesso às áreas de conta, painéis e formulários protegidos e
          garantir o funcionamento seguro da plataforma.
        </p>
        <p>
          Estes cookies são indispensáveis ao funcionamento do serviço e não são utilizados para fins
          publicitários.
        </p>
      </Seccao>

      <Seccao titulo="4. Cookies de análise — Google Analytics">
        <p>
          A NegóMapa utiliza o Google Analytics para recolher informações agregadas e anónimas sobre a
          utilização do site, tais como páginas visitadas, duração da visita, tipo de dispositivo, navegador,
          sistema operativo, origem do acesso e interações com o site.
        </p>
        <p>
          Estes dados são utilizados para compreender como os utilizadores utilizam a plataforma, corrigir
          problemas, melhorar o funcionamento e desenvolver novas funcionalidades.
        </p>
        <p>
          O Google Analytics pode utilizar cookies e tecnologias semelhantes para recolher estas informações.
        </p>
      </Seccao>

      <Seccao titulo="5. Cookies relacionados com o login com Google">
        <p>
          Quando o utilizador escolhe utilizar a opção “Continuar com Google”, podem ser utilizados cookies ou
          tecnologias semelhantes para permitir a autenticação, manter a sessão iniciada e garantir a segurança
          do processo de login.
        </p>
        <p>
          Esta funcionalidade poderá recolher ou partilhar informações como nome, endereço de correio eletrónico,
          fotografia de perfil e identificador de conta Google, conforme as permissões autorizadas pelo
          utilizador.
        </p>
      </Seccao>

      <Seccao titulo="6. Cookies que não utilizamos">
        <p>
          Nesta fase, a NegóMapa não utiliza cookies de publicidade, remarketing ou perfilização publicitária.
        </p>
        <p>
          Se esta situação mudar, esta Política de Cookies será atualizada e, quando exigido, será solicitado
          consentimento antes da utilização.
        </p>
      </Seccao>

      <Seccao titulo="7. Gestão de cookies">
        <p>
          O utilizador pode bloquear, limitar ou apagar cookies através das definições do seu navegador.
        </p>
        <p>
          A bloqueação dos cookies técnicos pode impedir o funcionamento correto de áreas que exigem início de
          sessão, como a conta, painéis, formulários protegidos e outras funcionalidades reservadas.
        </p>
      </Seccao>

      <Seccao titulo="8. Alterações a esta política">
        <p>
          A NegóMapa pode atualizar esta Política de Cookies para refletir alterações técnicas, legais ou
          operacionais. A versão atualizada será publicada nesta página, com a data de atualização indicada.
        </p>
      </Seccao>
    </PaginaLegal>
  );
}
