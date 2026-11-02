import { Metadata } from 'next';
import { PaginaLegal, Seccao } from '@/components/legal/PaginaLegal';

export const metadata: Metadata = {
  title: 'Política de Privacidade | NegóMapa',
  description: 'Como a NegóMapa recolhe, utiliza e protege os dados pessoais.',
};

export default function PrivacidadePage() {
  return (
    <PaginaLegal
      titulo="Política de Privacidade"
      descricao="Esta política explica que dados pessoais tratamos, para que finalidades e com que direitos."
      atualizadoEm="2 de novembro de 2026"
    >
      <Seccao titulo="1. Responsável pelo tratamento">
        <p>
          O responsável pelo tratamento dos dados pessoais recolhidos através da plataforma NegóMapa é a entidade
          identificada na página de contacto.
        </p>
      </Seccao>

      <Seccao titulo="2. Dados que recolhemos">
        <ul className="list-disc pl-6 space-y-2">
          <li>Dados de conta: nome, endereço de correio eletrónico e credenciais de acesso (geridas pelo serviço de autenticação).</li>
          <li>Dados de perfil profissional ou empresarial: nome, categoria, província, município, descrição, contactos, portefólio e, quando aplicável, comprovativos de atividade.</li>
          <li>Dados de contacto enviados pelo formulário: nome, correio eletrónico, telefone (opcional) e mensagem.</li>
          <li>Avaliações e denúncias que submeta na plataforma.</li>
        </ul>
      </Seccao>

      <Seccao titulo="3. Finalidades e fundamento">
        <ul className="list-disc pl-6 space-y-2">
          <li>Criar e gerir a conta e permitir o acesso à plataforma.</li>
          <li>Publicar perfis, serviços e vagas após verificação pela equipa.</li>
          <li>Permitir o contacto entre utilizadores, incluindo através de WhatsApp quando o próprio utilizador o disponibiliza.</li>
          <li>Responder a pedidos de contacto e a denúncias.</li>
          <li>Cumprir obrigações legais e prevenir fraude e abuso.</li>
        </ul>
      </Seccao>

      <Seccao titulo="4. Dados sensíveis e documentos de identificação">
        <p>
          Os documentos de identificação e os comprovativos de atividade são tratados apenas para verificação do registo
          e não são publicados. O acesso a estes documentos é limitado à equipa autorizada.
        </p>
      </Seccao>

      <Seccao titulo="5. Partilha com terceiros">
        <p>
          Os dados são tratados com recurso a prestadores de serviços técnicos (alojamento, base de dados e
          autenticação), que atuam sob instruções da NegóMapa. Não vendemos dados pessoais.
        </p>
      </Seccao>

      <Seccao titulo="6. Conservação">
        <p>
          Os dados são conservados enquanto a conta estiver ativa e, depois, pelo período necessário para cumprir
          obrigações legais ou resolver litígios. Os prazos concretos por categoria de dados serão indicados na versão
          final desta política.
        </p>
      </Seccao>

      <Seccao titulo="7. Direitos do titular">
        <p>
          O titular pode pedir acesso, retificação, atualização ou eliminação dos seus dados, bem como opor-se a certos
          tratamentos, nos termos da lei angolana aplicável. Os pedidos devem ser feitos pela página de contacto.
        </p>
      </Seccao>

      <Seccao titulo="8. Segurança">
        <p>
          Aplicamos medidas técnicas e organizativas para proteger os dados contra acesso não autorizado, perda ou
          alteração, incluindo controlo de acessos por função e comunicações cifradas.
        </p>
      </Seccao>

      <Seccao titulo="9. Cookies">
        <p>
          Para informação sobre cookies, consulte a página de política de cookies.
        </p>
      </Seccao>
    </PaginaLegal>
  );
}
