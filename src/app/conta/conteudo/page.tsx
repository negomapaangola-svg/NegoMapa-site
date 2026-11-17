import type { Metadata } from 'next'
import Link from 'next/link'
import { getContaConteudo } from '@/lib/actions/conta'

export const metadata: Metadata = { title: 'O meu conteúdo | NegóMapa' }

function Section({ title, items, empty, href }: { title: string; items: any[]; empty: string; href: string }) {
  return <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
    <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold">{title}</h2><Link href={href} className="inline-flex min-h-11 items-center text-sm font-semibold text-orange-700 hover:underline dark:text-orange-300">Abrir área</Link></div>
    {items.length ? <ul className="divide-y divide-slate-100 dark:divide-slate-800">{items.map(item => <li key={item.id} className="flex min-h-14 items-center justify-between gap-3 py-2"><span className="min-w-0 truncate text-sm font-medium">{item.titulo ?? item.nome_candidato ?? 'Registo'}</span><span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">{item.estado ?? item.estado_aprovacao ?? 'Registado'}</span></li>)}</ul> : <p className="text-sm text-slate-500">{empty}</p>}
  </section>
}

export default async function ContaConteudoPage() {
  const data = await getContaConteudo()
  return <section className="space-y-5">
    <header><h1 className="text-2xl font-semibold tracking-tight">Conteúdo</h1><p className="mt-1 text-sm text-slate-500">Consulte os registos associados à sua conta.</p></header>
    {data.type === 'profissional' && <Section title="Serviços" items={data.services} empty="Ainda não tem serviços publicados." href="/servicos" />}
    {data.type === 'empresa' && <><Section title="Produtos" items={data.products} empty="Ainda não tem produtos." href="/produto" /><Section title="Serviços" items={data.services} empty="Ainda não tem serviços." href="/servicos" /><Section title="Vagas" items={data.jobs} empty="Ainda não tem vagas." href="/empresa/painel/vagas" /></>}
    {data.type === 'cliente' && <><Section title="Pedidos de serviço" items={data.orders} empty="Ainda não criou pedidos." href="/pedidos" /><Section title="Candidaturas" items={data.applications} empty="Ainda não tem candidaturas." href="/candidaturas" /><section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><h2 className="font-semibold">Itens guardados</h2><p className="mt-2 text-sm text-slate-500">A lista de favoritos ainda não está disponível na estrutura actual da conta.</p><Link href="/descobrir" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-orange-700 hover:underline dark:text-orange-300">Descobrir serviços e profissionais</Link></section></>}
  </section>
}
