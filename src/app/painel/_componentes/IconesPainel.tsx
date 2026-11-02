import type { IconeNome } from './itens'

/** Ícones SVG simples (traço), decorativos: o rótulo de texto é sempre mostrado ao lado. */
export function IconePainel({ nome, className = 'h-5 w-5' }: { nome: IconeNome; className?: string }) {
  const comum = {
    'aria-hidden': true,
    focusable: 'false' as const,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
  }
  switch (nome) {
    case 'inicio':
      return <svg {...comum}><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></svg>
    case 'perfil':
      return <svg {...comum}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg>
    case 'produtos':
      return <svg {...comum}><path d="M3 7l9-4 9 4-9 4-9-4z" /><path d="M3 7v10l9 4 9-4V7" /><path d="M12 11v10" /></svg>
    case 'servicos':
      return <svg {...comum}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5h8v2" /></svg>
    case 'portfolio':
      return <svg {...comum}><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="2" /><path d="M21 16l-5-5-8 8" /></svg>
    case 'disponibilidade':
      return <svg {...comum}><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" /></svg>
    case 'vagas':
      return <svg {...comum}><circle cx="9" cy="7" r="4" /><path d="M2 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2" /><path d="M16 3.1a4 4 0 0 1 0 7.8" /></svg>
    case 'investimento':
      return <svg {...comum}><path d="M3 17l6-6 4 4 8-8" /><path d="M14 7h7v7" /></svg>
    case 'avaliacoes':
      return <svg {...comum}><path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2-4.5-4.4 6.2-.9z" /></svg>
    case 'configuracoes':
      return <svg {...comum}><path d="M4 6h16M4 12h16M4 18h16" /><circle cx="9" cy="6" r="2" fill="currentColor" /><circle cx="15" cy="12" r="2" fill="currentColor" /><circle cx="8" cy="18" r="2" fill="currentColor" /></svg>
    case 'menu':
      return <svg {...comum}><path d="M4 6h16M4 12h16M4 18h16" /></svg>
  }
}
