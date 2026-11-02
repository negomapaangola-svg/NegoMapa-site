import { Metadata } from 'next';
import { PaginaLegal, Seccao } from '@/components/legal/PaginaLegal';

export const metadata: Metadata = {
  title: 'Política de Cookies | NegóMapa',
  description: 'Informação sobre os cookies utilizados na plataforma NegóMapa.',
};

export default function CookiesPage() {
  return (
    <PaginaLegal
      titulo="Política de Cookies"
      descricao="Esta página explica que cookies e tecnologias semelhantes são utilizados na plataforma."
      atualizadoEm="2 de novembro de 2026"
    >
      <Seccao titulo="1. O que são cookies">
        <p>
          Os cookies são pequenos ficheiros guardados no dispositivo do utilizador quando visita um site. Permitem
          manter a sessão iniciada e assegurar o funcionamento correto da plataforma.
        </p>
      </Seccao>

      <Seccao titulo="2. Cookies utilizados">
        <p>
          Atualmente, a NegóMapa utiliza apenas cookies técnicos e estritamente necessários, ligados à autenticação e
          à sessão do utilizador. Estes cookies são indispensáveis para aceder às áreas de conta, painéis e formulários
          protegidos e não necessitam de consentimento.
        </p>
      </Seccao>

      <Seccao titulo="3. Cookies de terceiros e de análise">
        <p>
          Neste momento, a plataforma não utiliza cookies de publicidade nem ferramentas de análise de comportamento.
          Se essa situação mudar, esta política será atualizada e, quando exigido, será pedido consentimento antes da
          sua utilização.
        </p>
      </Seccao>

      <Seccao titulo="4. Gestão de cookies">
        <p>
          O utilizador pode bloquear ou apagar cookies através das definições do seu navegador. Sem os cookies técnicos,
          a conta pode deixar de funcionar corretamente e o utilizador poderá ter de voltar a iniciar sessão.
        </p>
      </Seccao>
    </PaginaLegal>
  );
}
