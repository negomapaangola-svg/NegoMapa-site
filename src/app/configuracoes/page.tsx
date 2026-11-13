import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
export const metadata: Metadata = { title: 'Configurações | NegóMapa', description: 'Gira as preferências, notificações e privacidade da sua conta NegóMapa.', robots: { index: false, follow: false } }
const itens = [
 {id:'notificacoes',titulo:'Notificações',descricao:'Consulte os avisos recebidos na sua conta.',href:'/notificacoes',acao:'Ver notificações'},
 {id:'preferencias',titulo:'Preferências de notificação',descricao:'Escolha os canais disponíveis para receber avisos.',href:'/preferencias-notificacoes',acao:'Gerir preferências'},
 {id:'localizacao',titulo:'Localização e interesses',descricao:'Actualize a localização privada e as categorias de interesse no seu perfil.',href:'/perfil#localizacao-preferencias',acao:'Abrir perfil'},
 {id:'privacidade',titulo:'Privacidade',descricao:'Consulte a política de privacidade e saiba como os dados são tratados.',href:'/privacidade',acao:'Consultar política'},
]
export default async function ConfiguracoesPage() {
 const user = await getUser()
 if (!user) redirect('/login?redirectTo=/configuracoes')
 return <MainLayout><main id="main-content" className="min-h-[60vh] bg-cream px-4 py-10 dark:bg-navy-dark sm:py-14">
  <div className="mx-auto max-w-4xl space-y-6">
   <header className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-700 dark:text-orange-300">A minha conta</p><h1 className="mt-2 text-3xl font-bold text-ink dark:text-cream">Configurações</h1><p className="mt-2 text-sm text-neutral-600 dark:text-cream-text">Gira as preferências da utilização da NegóMapa. Os dados do perfil público continuam separados desta área.</p></header>
   <section className="grid gap-3 sm:grid-cols-2" aria-label="Áreas de configuração">{itens.map((item)=><Card key={item.id} variant="liquid" padding="md" className="h-full"><CardHeader className="pb-2"><CardTitle as="h2" className="text-lg">{item.titulo}</CardTitle><CardDescription>{item.descricao}</CardDescription></CardHeader><CardContent><Link href={item.href} className="inline-flex min-h-9 items-center rounded-lg border border-card-border px-3 py-1.5 text-sm font-semibold text-ink transition-colors hover:border-orange-500 hover:text-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:text-cream dark:hover:text-orange-300">{item.acao}</Link></CardContent></Card>)}</section>
   <Card id="conta-seguranca" variant="liquid" padding="md"><CardHeader><CardTitle as="h2" className="text-lg">Conta e segurança</CardTitle><CardDescription>Informações sobre o acesso e os limites de gestão disponíveis nesta versão.</CardDescription></CardHeader><CardContent className="space-y-2 text-sm text-neutral-700 dark:text-cream-text"><p>O email e o tipo de conta são protegidos e não são editáveis nesta área.</p><p>A gestão de sessões activas e a alteração de credenciais não têm actualmente uma página própria na aplicação.</p><p>Para consultar os dados pessoais associados à conta, abre o <Link href="/perfil" className="font-semibold text-orange-700 underline underline-offset-2 dark:text-orange-300">perfil</Link>.</p></CardContent></Card>
  </div></main></MainLayout>
}
