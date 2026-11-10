'use client';

import { Button } from '@/components/ui/Button';

interface ServiceWhatsAppProps {
  telefone: string | null | undefined;
  fallbackTelefone?: string | null;
  label?: string;
}

/** Normaliza apenas números angolanos completos; nunca cria ligações com números incompletos. */
function normalizarNumeroAngolano(valor: string | null | undefined): string | null {
  if (!valor) return null;
  const digitos = valor.replace(/\\D/g, '');
  const local = digitos.startsWith('244') ? digitos.slice(3) : digitos;
  if (!/^9\\d{8}$/.test(local)) return null;
  return `244${local}`;
}

export function ServiceWhatsApp({
  telefone,
  fallbackTelefone,
  label = 'Contactar no WhatsApp',
}: ServiceWhatsAppProps) {
  const numero = normalizarNumeroAngolano(telefone) ?? normalizarNumeroAngolano(fallbackTelefone);

  if (!numero) {
    return (
      <p role="status" className="w-full rounded-xl border border-card-border bg-neutral-50 px-4 py-3 text-sm leading-relaxed text-neutral-700 dark:bg-white/5 dark:text-cream-text">
        Este profissional ainda não disponibilizou um número de WhatsApp válido para contacto.
      </p>
    );
  }

  return (
    <Button variant="primary" size="lg" asChild>
      <a
        href={`https://wa.me/${numero}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        className="flex min-h-[52px] w-full items-center justify-center gap-2 px-5 text-center sm:w-auto"
      >
        <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 16v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h10a2 2 0 012 2v1m-3.678-1.636A16.039 16.039 0 016 12.353 16.083 16.083 0 0112.05 3s10.03 8.347 10.323 9.378a7.97 7.97 0 00-1.677 2.043 7.926 7.926 0 01-3.062.094A11.956 11.956 0 0018 16z" />
        </svg>
        <span>{label}</span>
      </a>
    </Button>
  );
}
