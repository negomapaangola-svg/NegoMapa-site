/**
 * Tema claro/escuro do NegóMapa.
 * Sem escolha guardada, acompanha a preferência do sistema operativo.
 */
export const CHAVE_TEMA = 'negomapa-tema';

export const TEMA_SCRIPT = `(function(){try{var g=localStorage.getItem('${CHAVE_TEMA}');var e=g?g==='escuro':window.matchMedia('(prefers-color-scheme: dark)').matches;var r=document.documentElement;r.classList.toggle('dark',e);r.classList.toggle('light',!!g&&!e);r.style.colorScheme=e?'dark':'light';}catch(x){}})();`;

function aplicarTema(escuro: boolean) {
  const raiz = document.documentElement;
  raiz.classList.toggle('dark', escuro);
  raiz.classList.toggle('light', !escuro);
  raiz.style.colorScheme = escuro ? 'dark' : 'light';
}

export function definirTema(preferencia: 'claro' | 'escuro' | 'sistema'): void {
  try {
    if (preferencia === 'sistema') localStorage.removeItem(CHAVE_TEMA);
    else localStorage.setItem(CHAVE_TEMA, preferencia);
  } catch { /* O tema continua aplicável nesta visita. */ }
  aplicarTema(preferencia === 'sistema' ? window.matchMedia('(prefers-color-scheme: dark)').matches : preferencia === 'escuro');
}

export function alternarTema(): void {
  definirTema(document.documentElement.classList.contains('dark') ? 'claro' : 'escuro');
}

export function acompanharSistema(): () => void {
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const aoMudar = (evento: MediaQueryListEvent) => {
    try { if (localStorage.getItem(CHAVE_TEMA)) return; } catch { /* Segue o sistema quando o armazenamento não está disponível. */ }
    aplicarTema(evento.matches);
  };
  media.addEventListener('change', aoMudar);
  return () => media.removeEventListener('change', aoMudar);
}
