/**
 * Caminhos das imagens base do NegóMapa (pasta public/images).
 * Usar sempre estas constantes; não escrever caminhos à mão nos componentes.
 */
export const IMAGENS = {
  hero: '/images/hero/hero-negomapa.png',
  og: '/images/og/og-negomapa.png',
  avatarPadrao: '/images/avatares/avatar-padrao.png',
  servicoPadrao: '/images/servicos/servico-padrao.png',
  vagaPadrao: '/images/vagas/vaga-padrao.png',
  empresaCapaPadrao: '/images/empresas/empresa-capa-padrao.png',
  profissionalCapaPadrao: '/images/profissionais/profissional-capa-padrao.png',
  portfolioPadrao: '/images/portfolio/portfolio-padrao.png',
  fundoPadrao: '/images/fundos/fundo-padrao.png',
  /** Logótipo atual do site, usado quando a empresa não tem logótipo próprio. */
  logoSite: '/identidade/logo-negomapa-fundo-claro.svg',
  estadoVazio: {
    servicos: '/images/empty-states/sem-servicos.png',
    profissionais: '/images/empty-states/sem-profissionais.png',
    empresas: '/images/empty-states/sem-empresas.png',
    vagas: '/images/empty-states/sem-vagas.png',
  },
} as const

/**
 * Ícone de categoria por slug da base de dados. Ligação por correspondência clara;
 * categorias sem ícone específico usam o ícone "outros".
 */
const ICONE_POR_SLUG: Record<string, string> = {
  'construcao-civil': 'construcao',
  carpinteiro: 'construcao',
  serralheiro: 'construcao',
  encanador: 'canalizacao',
  eletricista: 'electricidade',
  'ar-condicionado-refrigeracao': 'electricidade',
  'electronica-reparacao-eletrodomesticos': 'electricidade',
  pintor: 'pintura',
  limpeza: 'limpeza',
  costureira: 'moda',
  cabeleireiro: 'beleza',
  'manicure-pedicure': 'beleza',
  'aulas-particulares': 'educacao',
  fotografo: 'eventos',
  'organizacao-eventos-catering': 'eventos',
  mecanico: 'automovel',
  motorista: 'transporte',
  'mudancas-transporte-mercadorias': 'transporte',
  'moto-taxi': 'transporte',
  'informatica-reparacao': 'tecnologia',
  'desenvolvimento-web-aplicacoes': 'tecnologia',
  'telemoveis-reparacoes': 'tecnologia',
  'saude-enfermagem-domicilio': 'saude',
  'cuidados-idosos': 'saude',
  'cuidados-criancas': 'saude',
  jardinagem: 'agricultura',
  contabilidade: 'juridico',
  'consultoria-empresarial': 'juridico',
  'marketing-digital': 'vendas',
}

export function iconeCategoria(slug: string): string {
  const nome = ICONE_POR_SLUG[slug] ?? 'outros'
  return `/images/categorias/${nome}.svg`
}
