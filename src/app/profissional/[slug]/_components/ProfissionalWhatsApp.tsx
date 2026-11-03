import { Button } from '@/components/ui/Button';

interface ProfissionalWhatsAppProps {
  whatsapp: string | null | undefined;
}

/** Botão público de WhatsApp. Não aparece se o profissional não tiver número válido. */
export function ProfissionalWhatsApp({ whatsapp }: ProfissionalWhatsAppProps) {
  if (!whatsapp) return null;

  const digitos = whatsapp.replace(/\D/g, '');
  if (digitos.length < 9) return null;

  // Os números angolanos têm 9 dígitos; só acrescenta o indicativo 244 se ainda não existir.
  const numero = digitos.startsWith('244') ? digitos : `244${digitos}`;

  return (
    <Button variant="primary" size="lg" asChild>
      <a
        href={`https://wa.me/${numero}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 w-full justify-center sm:w-auto"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 16v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h10a2 2 0 012 2v1m-3.678-1.636A16.039 16.039 0 016 12.353 16.083 16.083 0 0112.05 3s10.03 8.347 10.323 9.378a7.97 7.97 0 00-1.677 2.043 7.926 7.926 0 01-3.062.094A11.956 11.956 0 0018 16z" />
        </svg>
        <span>Contactar pelo WhatsApp</span>
      </a>
    </Button>
  );
}
