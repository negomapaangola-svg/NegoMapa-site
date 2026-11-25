import type { Metadata } from 'next'
import Link from 'next/link'
import { getContaSnapshot } from '@/lib/actions/conta'

export const metadata: Metadata = { title: 'A minha conta | NegóMapa' }

const shortcuts = [
  ['Conta', '/conta/perfil', 'Dados pessoais e profissionais'],
  ['Conteúdo', '/conta/conteudo', 'Serviços, produtos, pedidos e vagas'],
  ['Mensagens', '/conta/mensagens', 'Conversas da plataforma'],
  ['Candidaturas', '/candidaturas', 'Acompanhe as suas candidaturas'],
  ['Pedidos', '/pedidos', 'Consulte pedidos de serviço'],
  ['Avaliações', '/conta/avaliacoes', 'Reputação e avaliações'],
  ['Configurações', '/conta/configuracoes', 'Privacidade e segurança'],
] as const

export default async function ContaPage() {
  const data = await getContaSnapshot()
  if (!data) return null
  const typeLabel = data.accountType === 'profissional' ? 'Profissional' : data.accountType === 'empresa' ? 'Empresa' : 'Cliente'
  const name = data.accountType === 'profissional' ? data.professional?.nome : data.accountType === 'empresa' ? data.company?.name : data.profile.nome
  const avatar = data.accountType === 'profissional' ? data.professional?.avatar_url : data.accountType === 'empresa' ? data.company?.logo_url : data.profile.avatar_url
  const status = !data.profile.is_active ? 'Conta suspensa' : data.accountType === 'profissional' ? (data.professional?.estado ?? 'Conta por completar') : data.accountType === 'empresa' ? (data.company?.is_approved ? 'Aprovada' : data.company?.estado ?? 'Em análise') : 'Activa'
  const statusLabel = status === 'aprovado' ? 'Aprovada' : status === 'pendente' ? 'Pendente' : status === 'rejeitado' ? 'Rejeitada' : status === 'suspenso' ? 'Suspensa' : status
  const missingFields = data.accountType === 'profissional' ? [
    !data.professional?.nome?.trim(),
    !data.professional?.categoria_id,
    !data.professional?.provincia?.trim(),
    !data.professional?.municipio?.trim(),
    !data.professional?.experiencia_faixa?.trim(),
    !data.professional?.bio?.trim(),
    !(data.professional?.telefone?.trim() || data.professional?.whatsapp?.trim()),
  ] : data.accountType === 'empresa' ? [
    !data.company?.name?.trim(),
    !data.company?.sector?.trim(),
    !data.company?.province?.trim(),
    !data.company?.city?.trim(),
    !data.company?.description?.trim(),
    !data.company?.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.company?.email ?? ''),
    !(data.company?.phone?.trim() || data.company?.whatsapp?.trim()),
  ] : []
  const profileCompletedAt = data.accountType === 'profissional' ? data.professional?.profile_completed_at : data.accountType === 'empresa' ? data.company?.profile_completed_at : null
  const profileIncomplete = (data.accountType === 'profissional' || data.accountType === 'empresa') && (!profileCompletedAt || missingFields.some(Boolean))
  return <section className="space-y-6">
    <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center">
      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-xl font-semibold text-slate-500 dark:bg-slate-800">
        {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : (name?.[0] ?? 'N').toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-slate-500">Bem-vindo à sua conta</p>
        <h1 className="truncate text-2xl font-semibold tracking-tight">{name || 'Complete a sua conta'}</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{data.user.email}</p>
      </div>
      <Link href="/conta/perfil" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:bg-white dark:text-slate-900">Editar conta</Link>
    </header>

    {profileIncomplete&&<section className="flex flex-col gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-5 dark:border-amber-700 dark:bg-amber-950/30"><div><h2 className="font-semibold text-amber-950 dark:text-amber-100">Perfil incompleto</h2><p className="mt-1 text-sm text-amber-900 dark:text-amber-200">Conclua os campos obrigatórios para enviar o seu perfil para análise. A publicação continua dependente da aprovação da administração.</p></div><Link href="/conta/perfil" className="inline-flex min-h-11 w-fit items-center justify-center rounded-xl bg-orange-700 px-4 text-sm font-semibold text-white hover:bg-orange-800">Concluir perfil</Link></section>}
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <article className="flex min-h-36 flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm font-medium text-slate-500">Tipo de conta</p>
        <div><p className="text-2xl font-semibold">{typeLabel}</p><p className="mt-1 text-sm text-slate-500">Tipo associado ao seu registo NegóMapa</p></div>
      </article>
      <article className="flex min-h-36 flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm font-medium text-slate-500">Estado da conta</p>
        <div><p className="text-2xl font-semibold">{statusLabel}</p><p className="mt-1 text-sm text-slate-500">Estado actual da sua conta na plataforma</p></div>
      </article>
    </div>

    <section aria-labelledby="atalhos-title" className="space-y-3">
      <div><h2 id="atalhos-title" className="text-lg font-semibold">Acesso rápido</h2><p className="text-sm text-slate-500">Encontre as áreas principais da sua conta.</p></div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {shortcuts.map(([label, href, description]) => <Link key={href} href={href} className="group flex min-h-24 flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-orange-400 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:border-slate-800 dark:bg-slate-900">
          <span className="font-semibold group-hover:text-orange-700 dark:group-hover:text-orange-300">{label}</span>
          <span className="text-sm text-slate-500">{description}</span>
        </Link>)}
      </div>
    </section>
  </section>
}