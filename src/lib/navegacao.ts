import type { ContextoUtilizador } from '@/lib/permissoes'
export type LocalNavegacao = 'cabecalho' | 'menu_mobile' | 'rodape'
export type ContextoNavegacao = Omit<ContextoUtilizador, 'userId'>
type Regra = 'publico' | 'autenticado' | 'profissional' | 'profissional_aprovado' | 'empresa' | 'empresa_aprovada' | 'administrador' | 'visitante' | 'sem_empresa' | 'sem_profissional' | 'cliente_sem_perfil'
export type ItemNavegacao = { id: string; rotulo: string; rota: string; icone?: string; regras: Regra[]; locais: LocalNavegacao[] }
export const ITENS_NAVEGACAO: ItemNavegacao[] = [
 {id:'inicio',rotulo:'Início',rota:'/',regras:['publico'],locais:['cabecalho','menu_mobile']},
 {id:'descobrir',rotulo:'Descobrir',rota:'/descobrir',regras:['publico'],locais:['cabecalho','menu_mobile','rodape']},
 {id:'servicos',rotulo:'Serviços',rota:'/servicos',regras:['publico'],locais:['cabecalho','menu_mobile','rodape']},
 {id:'profissionais',rotulo:'Profissionais',rota:'/profissionais',regras:['publico'],locais:['cabecalho','menu_mobile','rodape']},
 {id:'empresas',rotulo:'Empresas',rota:'/empresas',regras:['publico'],locais:['cabecalho','menu_mobile','rodape']},
 {id:'produtos',rotulo:'Produtos',rota:'/descobrir?tipo=produtos',regras:['publico'],locais:['cabecalho','menu_mobile','rodape']},
 {id:'vagas',rotulo:'Vagas',rota:'/vagas',regras:['publico'],locais:['cabecalho','menu_mobile','rodape']},
 {id:'pesquisar',rotulo:'Pesquisar',rota:'/descobrir',regras:['publico'],locais:['cabecalho']},
 {id:'publicar-servico',rotulo:'Publicar serviço',rota:'/cadastrar-servico',regras:['profissional_aprovado'],locais:['cabecalho','menu_mobile']},
 {id:'publicar-vaga',rotulo:'Publicar vaga',rota:'/empresa/painel/vagas/nova',regras:['empresa_aprovada'],locais:['cabecalho','menu_mobile']},
 {id:'cadastrar-empresa',rotulo:'Cadastrar empresa',rota:'/cadastrar-empresa',regras:['cliente_sem_perfil'],locais:['menu_mobile']},
 {id:'cadastrar-profissional',rotulo:'Cadastrar profissional',rota:'/cadastrar-profissional',regras:['cliente_sem_perfil'],locais:['menu_mobile']},
 {id:'entrar',rotulo:'Entrar',rota:'/login',regras:['visitante'],locais:['menu_mobile']},
 {id:'registar',rotulo:'Registar',rota:'/registar',regras:['visitante'],locais:['menu_mobile']},
 {id:'perfil',rotulo:'Perfil',rota:'/perfil',regras:['autenticado'],locais:['menu_mobile']},
 {id:'configuracoes',rotulo:'Configurações',rota:'/configuracoes',regras:['autenticado'],locais:['menu_mobile']},
 {id:'candidaturas',rotulo:'Candidaturas',rota:'/candidaturas',regras:['autenticado'],locais:['menu_mobile']},
 {id:'mensagens',rotulo:'Mensagens',rota:'/mensagens',regras:['autenticado'],locais:['menu_mobile']},
 {id:'pedidos',rotulo:'Pedidos',rota:'/pedidos',regras:['autenticado'],locais:['menu_mobile']},
 {id:'notificacoes',rotulo:'Notificações',rota:'/notificacoes',regras:['autenticado'],locais:['menu_mobile']},
 {id:'preferencias',rotulo:'Preferências de notificação',rota:'/preferencias-notificacoes',regras:['autenticado'],locais:['menu_mobile']},
 {id:'painel-profissional',rotulo:'Painel do profissional',rota:'/profissional/painel',regras:['profissional'],locais:['menu_mobile']},
 {id:'painel-empresa',rotulo:'Painel da empresa',rota:'/empresa/painel',regras:['empresa'],locais:['menu_mobile']},
 {id:'administracao',rotulo:'Administração',rota:'/admin',regras:['administrador'],locais:['menu_mobile']},
 {id:'eliminar-conta',rotulo:'Eliminar conta',rota:'/admin/contas',regras:['administrador'],locais:['menu_mobile']},
 {id:'sair',rotulo:'Sair',rota:'#sair',regras:['autenticado'],locais:['menu_mobile']},
 {id:'contacto',rotulo:'Contacto',rota:'/contacto',regras:['publico'],locais:['menu_mobile','rodape']},
 {id:'termos',rotulo:'Termos e condições',rota:'/termos',regras:['publico'],locais:['menu_mobile','rodape']},
 {id:'privacidade',rotulo:'Política de privacidade',rota:'/privacidade',regras:['publico'],locais:['menu_mobile','rodape']},
 {id:'cookies',rotulo:'Cookies',rota:'/cookies',regras:['publico'],locais:['menu_mobile','rodape']},
 {id:'regras-empresas',rotulo:'Regras para empresas',rota:'/regras-empresas',regras:['publico'],locais:['menu_mobile','rodape']},
 {id:'regras-profissionais',rotulo:'Regras para profissionais',rota:'/regras-profissionais',regras:['publico'],locais:['menu_mobile','rodape']},
]
export function podeVerItem(item: ItemNavegacao, c: ContextoNavegacao): boolean {
 return item.regras.some((r) => {
  switch (r) {
   case 'publico': return true
   case 'visitante': return !c.autenticado
   case 'autenticado': return c.autenticado
   case 'profissional': return c.profissional
   case 'profissional_aprovado': return !c.administrador && c.profissional && c.estadoProfissional === 'aprovado'
   case 'empresa': return c.empresa
   case 'empresa_aprovada': return !c.administrador && c.empresa && c.empresaAprovada
   case 'administrador': return c.administrador
   case 'sem_empresa': return c.autenticado && !c.empresa
   case 'sem_profissional': return c.autenticado && !c.profissional
   case 'cliente_sem_perfil': return c.autenticado && c.accountType === 'cliente' && !c.profissional && !c.empresa
  }
 })
}
export const GRUPOS_MENU_MOBILE = [
 {id:'explorar',titulo:'Explorar',itens:['inicio','descobrir','servicos','profissionais','empresas','produtos','vagas']},
 {id:'publicar',titulo:'Publicar',itens:['publicar-servico','publicar-vaga','cadastrar-empresa','cadastrar-profissional']},
 {id:'conta',titulo:'A minha conta',itens:['perfil','candidaturas','mensagens','pedidos','painel-profissional','painel-empresa','administracao','eliminar-conta','entrar','registar','sair']},
 {id:'configuracoes',titulo:'Configurações',itens:['configuracoes','notificacoes','preferencias']},
 {id:'apoio',titulo:'Apoio',itens:['contacto','termos','privacidade','cookies','regras-empresas','regras-profissionais']},
] as const
