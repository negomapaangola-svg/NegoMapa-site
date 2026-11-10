import { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'
import { obterContextoUtilizador } from '@/lib/permissoes'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

export const metadata: Metadata = { title: 'O meu perfil | NegóMapa', description: 'Consulte os acessos e as opções da sua conta NegóMapa.' }

export default async function PerfilPage() {
  const user = await getUser()
  if (!user) redirect('/login?redirectTo=/perfil')
  const contexto = await obterContextoUtilizador()
  const acessos = [
    ...(contexto.profissional ? [{ href:'/editar-perfil', label:'Editar perfil profissional' }] : []),
    ...(contexto.profissional ? [{ href:'/profissional/painel', label:'Painel do profissional' }] : []),
    ...(contexto.empresa ? [{ href:'/empresa/painel', label:'Painel da empresa' }] : []),
    { href:'/pedidos', label:'Os meus pedidos' },
    { href:'/candidaturas', label:'As minhas candidaturas' },
    { href:'/mensagens', label:'Mensagens' },
    { href:'/preferencias-notificacoes', label:'Preferências de notificação' },
  ]
  return <MainLayout><section className="min-h-[60vh] bg-cream px-4 py-12 dark:bg-navy-dark"><div className="mx-auto max-w-3xl"><Card variant="liquid" padding="lg"><CardHeader><CardTitle>O meu perfil</CardTitle><p className="text-sm text-neutral-600 dark:text-cream-text">Conta autenticada: {user.email ?? 'Email não disponível'}</p></CardHeader><CardContent><ul className="grid gap-3 sm:grid-cols-2">{acessos.map((item) => <li key={item.href}><Link href={item.href} className="flex min-h-11 items-center rounded-lg border border-card-border bg-white/60 px-4 text-sm font-medium text-ink transition-colors hover:border-orange-500 dark:bg-white/5 dark:text-cream">{item.label}</Link></li>)}</ul></CardContent></Card></div></section></MainLayout>
}
