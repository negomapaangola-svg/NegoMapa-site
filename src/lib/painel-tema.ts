/**
 * Tema dos painéis (/painel/empresa e /painel/profissional).
 * Preferência guardada neste dispositivo (localStorage). Sem preferência
 * guardada, segue a preferência do sistema (prefers-color-scheme).
 */

export const CHAVE_TEMA = 'negomapa-painel-tema'
export const ATRIBUTO_TEMA = 'data-painel-tema'

export type Tema = 'claro' | 'escuro'

/**
 * Script síncrono colocado no início do painel, para aplicar o tema antes
 * da primeira pintura (evita um flash de ecrã claro em quem usa modo escuro).
 * Constante fixa, sem dados do utilizador.
 */
export const SCRIPT_TEMA_INICIAL = `(function(){try{var t=localStorage.getItem('${CHAVE_TEMA}');if(t!=='claro'&&t!=='escuro'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'escuro':'claro';}document.documentElement.setAttribute('${ATRIBUTO_TEMA}',t);}catch(e){}})();`
