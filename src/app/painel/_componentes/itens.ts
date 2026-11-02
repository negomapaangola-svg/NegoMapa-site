import type { TipoPainel } from '@/lib/painel-acesso'

export type IconeNome =
  | 'inicio'
  | 'perfil'
  | 'produtos'
  | 'servicos'
  | 'portfolio'
  | 'disponibilidade'
  | 'vagas'
  | 'investimento'
  | 'avaliacoes'
  | 'configuracoes'
  | 'menu'

export type ItemPainel = { href: string; rotulo: string; icone: IconeNome }

/** Opções de cada painel, pela ordem pedida. href é relativo à base do painel. */
export const ITENS_POR_TIPO: Record<TipoPainel, ItemPainel[]> = {
  empresa: [
    { href: '', rotulo: 'Visão geral', icone: 'inicio' },
    { href: '/perfil', rotulo: 'Perfil', icone: 'perfil' },
    { href: '/produtos-servicos', rotulo: 'Produtos e serviços', icone: 'produtos' },
    { href: '/vagas', rotulo: 'Vagas', icone: 'vagas' },
    { href: '/investimento', rotulo: 'Investimento', icone: 'investimento' },
    { href: '/avaliacoes', rotulo: 'Avaliações', icone: 'avaliacoes' },
    { href: '/configuracoes', rotulo: 'Configurações', icone: 'configuracoes' },
  ],
  profissional: [
    { href: '', rotulo: 'Visão geral', icone: 'inicio' },
    { href: '/perfil', rotulo: 'Meu perfil', icone: 'perfil' },
    { href: '/servicos', rotulo: 'Serviços', icone: 'servicos' },
    { href: '/portfolio', rotulo: 'Portfólio', icone: 'portfolio' },
    { href: '/disponibilidade', rotulo: 'Disponibilidade', icone: 'disponibilidade' },
    { href: '/vagas', rotulo: 'Vagas', icone: 'vagas' },
    { href: '/avaliacoes', rotulo: 'Avaliações', icone: 'avaliacoes' },
    { href: '/configuracoes', rotulo: 'Configurações', icone: 'configuracoes' },
  ],
}

/** Nº de opções que aparecem diretamente no menu inferior do telemóvel (o resto fica em "Menu"). */
export const NUMERO_OPCOES_DIRETAS = 3
