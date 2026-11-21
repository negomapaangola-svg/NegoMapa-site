import { Metadata } from 'next';
import { PaginaLegal, Seccao } from '@/components/legal/PaginaLegal';

export const metadata: Metadata = {
  title: 'Política de Privacidade | NegóMapa',
  description:
    'Como a NegóMapa recolhe, utiliza, protege e partilha os dados pessoais dos utilizadores.',
};

export default function PrivacidadePage() {
  return (
    <PaginaLegal
      titulo="Política de Privacidade"
      descricao="Esta política explica que dados pessoais a NegóMapa recolhe, para que finalidades os utiliza, como os protege e quais são os seus direitos."
      atualizadoEm="18 de novembro de 2026"
    >
      <Seccao titulo="1. Responsável pelo tratamento">
        <p>
          A NegóMapa é uma plataforma digital que liga clientes, profissionais e empresas em Angola,
          permitindo a pesquisa de serviços, vagas de emprego, empresas e profissionais.
        </p>
        <p>
          O responsável pelo tratamento dos dados pessoais recolhidos através da plataforma é Fred Tomás.
        </p>
        <p>
          Para questões relacionadas com privacidade, proteção de dados, acesso, correção ou eliminação
          de dados, contacte-nos através do e-mail negomapaangola@gmail.com ou do WhatsApp 926 311 857.
        </p>
      </Seccao>

      <Seccao titulo="2. Dados que recolhemos">
        <ul className="list-disc pl-6 space-y-2">
          <li>Dados de conta: nome, endereço de correio eletrónico, número de telefone, palavra-passe ou credenciais de autenticação.</li>
          <li>Dados de autenticação através do Google: quando utiliza a opção “Continuar com Google”, podemos receber o seu nome, endereço de correio eletrónico, fotografia de perfil e identificador de conta Google, conforme as permissões que autorizar.</li>
          <li>Dados de perfil profissional: nome, fotografia, categoria de atividade, província, município, descrição, contactos, portefólio, experiência, qualificações e disponibilidade.</li>
          <li>Dados de perfil empresarial: nome, setor, província, município, descrição, contactos, logótipo, imagens, redes sociais e informações sobre vagas.</li>
          <li>Dados enviados através de formulários: nome, correio eletrónico, telefone e mensagem.</li>
          <li>Avaliações, comentários, denúncias, pedidos de remoção e comunicações enviadas através da plataforma.</li>
          <li>Dados técnicos e de utilização: endereço IP, tipo de dispositivo, navegador, sistema operativo, páginas visitadas, data e hora de acesso, identificadores de sessão e informações recolhidas pelo Google Analytics.</li>
          <li>Cookies e tecnologias semelhantes, conforme detalhado na Política de Cookies.</li>
        </ul>
      </Seccao>

      <Seccao titulo="3. Dados que não recolhemos">
        <p>
          Nesta fase, a NegóMapa não solicita documentos de identificação, comprovativos de atividade,
          certificados ou currículos para efeitos de registo ou candidatura.
        </p>
        <p>
          Se esta situação mudar, esta Política de Privacidade será atualizada antes de esses dados passarem
          a ser recolhidos.
        </p>
      </Seccao>

      <Seccao titulo="4. Finalidades e fundamentos do tratamento">
        <ul className="list-disc pl-6 space-y-2">
          <li>Criar, gerir e proteger a conta do utilizador, com fundamento na execução do contrato ou na tomada de medidas pré-contratuais.</li>
          <li>Publicar perfis, serviços, empresas e vagas após verificação, com fundamento na execução do contrato e, quando exigido, no consentimento do utilizador.</li>
          <li>Permitir o contacto entre clientes, profissionais e empresas, incluindo através do WhatsApp, quando o utilizador disponibiliza ou escolhe utilizar esse canal.</li>
          <li>Responder a pedidos, denúncias, reclamações e pedidos relacionados com privacidade, com fundamento no cumprimento de obrigações legais ou no interesse legítimo da NegóMapa.</li>
          <li>Prevenir fraudes, contas falsas, spam, abuso, conteúdo ilegal e atividades que possam prejudicar utilizadores ou a plataforma, com fundamento no interesse legítimo e no cumprimento de obrigações legais.</li>
          <li>Analisar a utilização da plataforma através do Google Analytics, corrigir erros, melhorar o funcionamento e desenvolver novas funcionalidades, com fundamento no interesse legítimo da NegóMapa ou no consentimento, quando aplicável.</li>
          <li>Enviar comunicações essenciais sobre segurança, conta, candidaturas, vagas, pedidos e alterações aos termos, com fundamento na execução do contrato.</li>
        </ul>
      </Seccao>

      <Seccao titulo="5. Comunicações comerciais">
        <p>A NegóMapa não envia comunicações comerciais ou de marketing por e-mail nesta fase.</p>
        <p>
          Poderemos enviar comunicações essenciais relacionadas com a segurança da conta, alterações aos
          termos, confirmações, avisos de segurança, moderação, denúncias ou questões técnicas necessárias
          ao funcionamento do serviço.
        </p>
      </Seccao>

      <Seccao titulo="6. Partilha de dados">
        <p>A NegóMapa não vende dados pessoais.</p>
        <p>Os dados podem ser partilhados apenas nas seguintes situações:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Com prestadores de serviços técnicos necessários ao funcionamento da plataforma, incluindo alojamento, base de dados, autenticação, análise de tráfego, segurança e suporte.</li>
          <li>Com o Google, quando o utilizador escolhe iniciar sessão através do Google ou quando são utilizados serviços Google, incluindo o Google Analytics.</li>
          <li>Com outras empresas, profissionais ou clientes, apenas na medida necessária para permitir contacto, pedidos de serviço, avaliações ou resposta a denúncias.</li>
          <li>Com autoridades públicas, tribunais, autoridades de proteção de dados ou outras entidades competentes, quando exista obrigação legal, ordem judicial ou necessidade legítima de proteção de direitos, segurança ou prevenção de fraude.</li>
        </ul>
      </Seccao>

      <Seccao titulo="7. Transferência internacional de dados">
        <p>
          Alguns prestadores de serviços podem estar localizados fora de Angola ou processar dados fora de
          Angola. Nesses casos, a NegóMapa procura utilizar fornecedores que adotem medidas adequadas de
          proteção de dados pessoais e respeitem as obrigações legais aplicáveis.
        </p>
      </Seccao>

      <Seccao titulo="8. Conservação dos dados">
        <p>Os dados da conta são conservados enquanto a conta estiver ativa.</p>
        <p>
          Após eliminação ou encerramento da conta, os dados podem ser conservados pelo período necessário
          para cumprir obrigações legais, responder a pedidos de autoridades competentes, prevenir fraude,
          resolver litígios ou proteger direitos e a segurança da plataforma.
        </p>
        <p>
          Quando os dados já não forem necessários, serão eliminados ou anonimizados, salvo obrigação legal
          ou necessidade de conservação para defesa jurídica.
        </p>
      </Seccao>

      <Seccao titulo="9. Direitos do titular">
        <p>Nos termos da legislação angolana aplicável, o titular dos dados pode solicitar:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Acesso aos dados pessoais tratados pela NegóMapa.</li>
          <li>Retificação, atualização ou correção de dados incompletos ou incorretos.</li>
          <li>Eliminação dos dados, quando aplicável.</li>
          <li>Limitação do tratamento, quando aplicável.</li>
          <li>Oposição a determinados tratamentos.</li>
          <li>Portabilidade dos dados, quando aplicável.</li>
          <li>Retirada do consentimento, quando o tratamento dependa de consentimento.</li>
          <li>Informação sobre a existência de decisões automatizadas, quando aplicável.</li>
        </ul>
        <p>
          Os pedidos devem ser enviados para negomapaangola@gmail.com. A NegóMapa poderá solicitar
          informações adicionais para confirmar a identidade do titular antes de responder.
        </p>
        <p>
          O titular também pode apresentar reclamação à Agência de Proteção de Dados de Angola (APD), quando
          considere que os seus direitos foram violados.
        </p>
      </Seccao>

      <Seccao titulo="10. Segurança">
        <p>
          A NegóMapa adota medidas técnicas e organizativas adequadas para proteger os dados pessoais contra
          acesso não autorizado, perda, destruição, alteração ou divulgação indevida.
        </p>
        <p>
          Estas medidas podem incluir controlo de acessos, encriptação de comunicações, restrição de
          permissões, monitorização de segurança e boas práticas de desenvolvimento.
        </p>
        <p>
          Nenhum sistema é completamente seguro. O utilizador é responsável por manter as suas credenciais
          confidenciais e por utilizar uma palavra-passe forte e única.
        </p>
      </Seccao>

      <Seccao titulo="11. Menores de idade">
        <p>
          A NegóMapa destina-se a utilizadores com idade igual ou superior a 18 anos. Não recolhemos
          intencionalmente dados pessoais de menores de 18 anos.
        </p>
        <p>
          Se tivermos conhecimento de que uma conta foi criada por um menor de idade sem autorização válida,
          poderemos suspender ou eliminar a conta e os respetivos dados.
        </p>
      </Seccao>

      <Seccao titulo="12. Cookies e Google Analytics">
        <p>
          A NegóMapa utiliza cookies e tecnologias semelhantes para funcionamento, segurança, preferências,
          análise de utilização e melhorias da plataforma.
        </p>
        <p>
          O Google Analytics pode recolher informações sobre a utilização do site, como páginas visitadas,
          duração da visita, tipo de dispositivo, navegador, sistema operativo e origem do acesso.
        </p>
        <p>Para mais informações, consulte a nossa Política de Cookies.</p>
      </Seccao>

      <Seccao titulo="13. Alterações a esta política">
        <p>
          A NegóMapa pode atualizar esta Política de Privacidade para refletir alterações legais, técnicas
          ou operacionais. A versão atualizada será publicada nesta página, com a data de atualização
          indicada.
        </p>
        <p>
          Quando as alterações forem relevantes, poderemos informar os utilizadores através da plataforma ou
          por e-mail.
        </p>
      </Seccao>
    </PaginaLegal>
  );
}
