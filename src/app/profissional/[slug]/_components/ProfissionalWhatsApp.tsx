import { Button } from '@/components/ui/Button';

interface ProfissionalWhatsAppProps {
  whatsapp: string | null | undefined;
}

/** Contacto WhatsApp: só cria ligação quando o número tem formato válido. */
export function ProfissionalWhatsApp({ whatsapp }: ProfissionalWhatsAppProps) {
  const digitos = (whatsapp ?? '').replace(/\D/g, '');
  const numeroValido = digitos.length === 9 || (digitos.length === 12 && digitos.startsWith('244'));

  if (!numeroValido) {
    return (
      <p role="status" className="rounded-xl border border-card-border bg-neutral-50/80 px-4 py-3 text-sm leading-relaxed text-neutral-600 dark:bg-white/5 dark:text-cream-text">
        Este profissional ainda não disponibilizou um número de WhatsApp válido.
      </p>
    );
  }

  const numero = digitos.startsWith('244') ? digitos : `244${digitos}`;

  return (
    <Button variant="whatsapp" size="lg" fullWidth asChild>
      <a
        href={`https://wa.me/${numero}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contactar este profissional pelo WhatsApp (abre numa nova janela)"
        className="flex min-h-[48px] items-center justify-center gap-3"
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20.5 11.8a8.5 8.5 0 0 1-12.6 7.4L3 20l.8-4.7a8.5 8.5 0 1 1 16.7-3.5Z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8.5 8.5c.2-.5.4-.5.7-.5h.5c.2 0 .3.1.4.4l.7 1.6c.1.2.1.4 0 .5l-.5.6c-.2.2-.2.3-.1.5.4.7 1 1.3 1.7 1.7.2.1.3.1.5-.1l.6-.7c.2-.2.3-.2.5-.1l1.6.7c.3.1.4.2.4.4v.5c0 .3 0 .5-.5.7-.5.2-1.2.3-2.2-.1-1-.4-2.2-1.3-3.1-2.2-.9-.9-1.8-2.1-2.2-3.1-.4-1-.3-1.7-.1-2.2Z" />
        </svg>
        <span>Contactar no WhatsApp</span>
      </a>
    </Button>
  );
}
