'use client';

import { Button } from '@/components/ui/Button';

interface ServiceWhatsAppProps {
  telefone: string | null | undefined;
  label?: string;
}

export function ServiceWhatsApp({ telefone, label = 'WhatsApp' }: ServiceWhatsAppProps) {
  if (!telefone) return null;

  const cleanNumber = telefone.replace(/\D/g, '');
  const url = `https://wa.me/244${cleanNumber}`;

  return (
    <Button variant="primary" size="md" asChild>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 w-full justify-center"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 16v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h10a2 2 0 012 2v1m-3.678-1.636A16.039 16.039 0 016 12.353 16.083 16.083 0 0112.05 3s10.03 8.347 10.323 9.378a7.97 7.97 0 00-1.677 2.043 7.926 7.926 0 01-3.062.094A11.956 11.956 0 0018 16z" />
        </svg>
        <span>{label}</span>
      </a>
    </Button>
  );
}