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
      atualizadoEm="2 de novembro de 2026"
    >
      <Seccao titulo="1. Âmbito">
        <p>
          Estas regras aplicam-se a todos os profissionais independentes que publicam perfis, serviços ou portefólios na
          plataforma, e complementam os Termos de Utilização.
        </p>
      </Seccao>

      <Seccao titulo="2. Informação do perfil">
        <ul className="list-disc pl-6 space-y-2">
          <li>Indicar nome, categoria de atividade, província e município reais onde presta o serviço.</li>
          <li>Descrever com rigor os serviços oferecidos, sem promessas que não possa cumprir.</li>
          <li>Manter os contactos, incluindo WhatsApp, atualizados e acessíveis.</li>
          <li>Utilizar apenas fotografias de trabalhos próprios ou com autorização de quem neles aparece.</li>
        </ul>
      </Seccao>

      <Seccao titulo="3. Verificação e aprovação">
        <p>
          Os perfis profissionais são analisados pela equipa da NegóMapa antes de ficarem visíveis. A equipa pode pedir
          esclarecimentos ou documentos adicionais e pode recusar um perfil que não cumpra estas regras, indicando o
          motivo sempre que possível.
        </p>
      </Seccao>

      <Seccao titulo="4. Conduta">
        <ul className="list-disc pl-6 space-y-2">
          <li>Tratar os clientes com respeito e honestidade, sem discriminação.</li>
          <li>Não publicar avaliações falsas, de si próprio ou de terceiros.</li>
          <li>Não usar a plataforma para captar clientes de forma enganosa ou para difundir spam.</li>
          <li>Não publicar conteúdos ofensivos, ilegais ou que violem direitos de terceiros.</li>
        </ul>
      </Seccao>

      <Seccao titulo="5. Candidaturas a vagas">
        <p>
          A candidatura a uma vaga é feita diretamente com a empresa anunciante, através do canal de contacto indicado
          na vaga. O profissional decide que informação partilha nesse contacto. A NegóMapa não garante a forma como a
          empresa tratará essa informação.
        </p>
      </Seccao>

      <Seccao titulo="6. Suspensão e remoção">
        <p>
          O incumprimento destas regras pode levar à recusa, suspensão ou remoção do perfil, sem prejuízo de outras
          medidas previstas na lei.
        </p>
      </Seccao>
    </PaginaLegal>
  );
}
