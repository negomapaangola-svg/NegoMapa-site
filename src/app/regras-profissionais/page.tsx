import { Metadata } from 'next';
import { PaginaLegal, Seccao } from '@/components/legal/PaginaLegal';

export const metadata: Metadata = {
  title: 'Regras para Profissionais | NegóMapa',
  description: 'Regras de publicação e conduta para profissionais na plataforma NegóMapa.',
};

export default function RegrasProfissionaisPage() {
  return (
    <PaginaLegal
      titulo="Regras para Profissionais"
      descricao="Condições para criar e manter um perfil profissional na NegóMapa."
      atualizadoEm="18 de novembro de 2026"
    >
      <Seccao titulo="1. Âmbito">
        <p>
          Estas regras aplicam-se a todos os profissionais independentes que publicam perfis, serviços ou portefólios na
          plataforma, e complementam os Termos de Utilização, a Política de Privacidade e a Política de Cookies.
        </p>
      </Seccao>

      <Seccao titulo="2. Informação do perfil">
        <ul className="list-disc pl-6 space-y-2">
          <li>Indicar nome, categoria de atividade, província e município reais onde presta o serviço.</li>
          <li>Descrever com rigor os serviços oferecidos, sem promessas que não possa cumprir.</li>
          <li>Manter os contactos, incluindo WhatsApp, atualizados e acessíveis.</li>
          <li>Utilizar apenas fotografias de trabalhos próprios ou com autorização de quem neles aparece.</li>
          <li>É proibido criar perfis falsos, duplicados, fraudulentos ou que representem pessoas inexistentes.</li>
        </ul>
      </Seccao>

      <Seccao titulo="3. Verificação e aprovação">
        <p>
          Os perfis profissionais são analisados pela equipa da NegóMapa antes de ficarem visíveis. A equipa pode pedir
          esclarecimentos adicionais e pode recusar um perfil que não cumpra estas regras, indicando o motivo sempre que
          possível.
        </p>
      </Seccao>

      <Seccao titulo="4. Conduta">
        <ul className="list-disc pl-6 space-y-2">
          <li>Tratar os clientes com respeito e honestidade, sem discriminação.</li>
          <li>Não publicar avaliações falsas, de si próprio ou de terceiros.</li>
          <li>Não usar a plataforma para captar clientes de forma enganosa ou para difundir spam.</li>
          <li>Não publicar conteúdos ofensivos, ilegais, difamatórios, discriminatórios ou que violem direitos de terceiros.</li>
          <li>Não praticar assédio, ameaças, fraude, engano ou qualquer conduta abusiva contra outros utilizadores.</li>
        </ul>
      </Seccao>

      <Seccao titulo="5. Candidaturas a vagas">
        <p>
          A candidatura a uma vaga é feita diretamente com a empresa anunciante, através do canal de contacto indicado
          na vaga. O profissional decide que informação partilha nesse contacto. A NegóMapa não garante a forma como a
          empresa tratará essa informação.
        </p>
      </Seccao>

      <Seccao titulo="6. Propriedade intelectual e marca">
        <p>
          É proibido copiar, clonar, modificar, distribuir, revender, extrair dados em massa, realizar scraping ou
          utilizar o nome, logótipo, design, código ou conteúdos originais da NegóMapa sem autorização prévia e escrita.
        </p>
      </Seccao>

      <Seccao titulo="7. Suspensão e remoção">
        <p>
          O incumprimento destas regras pode levar à recusa, suspensão ou remoção do perfil, sem prejuízo de outras
          medidas previstas na lei.
        </p>
        <p>
          Em casos de fraude, risco de segurança, conteúdo ilegal ou violação grave dos direitos de terceiros, a medida
          pode ser aplicada sem aviso prévio.
        </p>
      </Seccao>

      <Seccao titulo="8. Denúncias e contacto">
        <p>
          Para denunciar perfis falsos, fraudes, spam, assédio, conteúdo ilegal, violação de direitos autorais, marca ou
          propriedade intelectual, contacte negomapaangola@gmail.com ou o WhatsApp 926 311 857.
        </p>
      </Seccao>
    </PaginaLegal>
  );
}
