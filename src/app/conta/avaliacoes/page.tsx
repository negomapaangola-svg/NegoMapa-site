import type { Metadata } from 'next'
import { getContaAvaliacoes } from '@/lib/actions/conta'

export const metadata: Metadata = { title: 'Avaliações | NegóMapa' }

function Reviews({ title, items, empty }: { title: string; items: any[]; empty: string }) {
  return <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
    <h2 className="font-semibold">{title}</h2>
    {items.length ? <ul className="divide-y divide-slate-100 dark:divide-slate-800">{items.map(item => <li key={item.id} className="py-4"><div className="flex items-center justify-between gap-3"><span className="font-semibold">{'★'.repeat(Number(item.nota))}{'☆'.repeat(5 - Number(item.nota))}</span><time className="text-xs text-slate-500" dateTime={item.created_at}>{new Date(item.created_at).toLocaleDateString('pt-PT')}</time></div><p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{item.comentario || 'Sem comentário escrito.'}</p></li>)}</ul> : <p className="text-sm text-slate-500">{empty}</p>}
  </section>
}

export default async function ContaAvaliacoesPage() {
  const data = await getContaAvaliacoes()
  const canReceive = data.type === 'profissional' || data.type === 'empresa'
  return <section className="space-y-5">
    <header><h1 className="text-2xl font-semibold tracking-tight">Avaliações</h1><p className="mt-1 text-sm text-slate-500">Acompanhe a reputação e o feedback na NegóMapa.</p></header>
    {canReceive && <Reviews title="Avaliações recebidas" items={data.received} empty="Ainda não recebeu avaliações." />}
    <Reviews title="Avaliações feitas" items={data.given} empty="Ainda não fez avaliações." />
  </section>
}
