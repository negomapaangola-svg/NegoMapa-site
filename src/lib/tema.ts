/**
 * Tema claro/escuro do NegóMapa.
 * - A classe `dark` no <html> define o tema. O script inline (TEMA_SCRIPT) aplica-a antes da pintura.
 * - Sem escolha guardada, segue a preferência do sistema operativo.
 * - A escolha do utilizador fica em localStorage (CHAVE_TEMA).
 */
export const CHAVE_TEMA = 'negomapa-tema';

/** Executado no <body> antes do conteúdo, para evitar flash de tema errado. */
export const TEMA_SCRIPT = `(function(){try{var g=localStorage.getItem('${CHAVE_TEMA}');var e=g?g==='escuro':window.matchMedia('(prefers-color-scheme: dark)').matches;var r=document.documentElement;r.classList.toggle('dark',e);r.classList.toggle('light',!!g&&!e);r.style.colorScheme=e?'dark':'light';}catch(x){}})();`;

function ler(): string | null {
  try {
    return localStorage.getItem(CHAVE_TEMA);
  } catch {
    return null;
  }
}

/** Alterna o tema, aplica-o de imediato e guarda a escolha. */
export function alternarTema(): void {
  const r = document.documentElement;
  const escuro = !r.classList.contains('dark');
  r.classList.toggle('dark', escuro);
  r.classList.toggle('light', !escuro);
  r.style.colorScheme = escuro ? 'dark' : 'light';
  try {
    localStorage.setItem(CHAVE_TEMA, escuro ? 'escuro' : 'claro');
  } catch {
    /* armazenamento indisponível: o tema aplica-se só nesta visita */
  }
}

/** Sem escolha guardada, acompanha mudanças do sistema operativo. Devolve a função de limpeza. */
export function acompanharSistema(): () => void {
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const aoMudar = (e: MediaQueryListEvent) => {
    if (ler()) return;
    const r = document.documentElement;
    r.classList.toggle('dark', e.matches);
    r.classList.remove('light');
    r.style.colorScheme = e.matches ? 'dark' : 'light';
  };
  media.addEventListener('change', aoMudar);
  return () => media.removeEventListener('change', aoMudar);
}
