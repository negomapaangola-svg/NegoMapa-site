import type { Metadata } from 'next'
import Link from 'next/link'
import { getContaMensagens } from '@/lib/actions/conta'

export const metadata: Metadata = { title: 'Mensagens da conta | NegóMapa' }

export default async function ContaMensagensPage() {
  const messages = await getContaMensagens()
  return <section className="space-y-5">
    <header className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-2xl font-semibold tracking-tight">Mensagens</h1><p className="mt-1 text-sm text-slate-500">Mensagens das conversas em que participa.</p></div><Link href="/mensagens" className="inline-flex min-h-11 items-center rounded-xl bg-orange-700 px-4 text-sm font-semibold text-white hover:bg-orange-800">Abrir conversas</Link></header>
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      {messages.length ? <ul className="divide-y divide-slate-100 dark:divide-slate-800">{messages.map((message: any) => <li key={message.id} className="py-4"><div className="flex flex-wrap justify-between gap-2 text-xs text-slate-500"><span>{message.isMine ? 'Sua mensagem' : 'Participante da conversa'}</span><time dateTime={message.criada_em}>{new Date(message.criada_em).toLocaleString('pt-PT')}</time></div><p className="mt-2 whitespace-pre-wrap break-words text-sm">{message.conteudo}</p></li>)}</ul> : <div className="py-10 text-center"><p className="font-medium">Ainda não existem mensagens.</p><p className="mt-1 text-sm text-slate-500">Quando iniciar uma conversa, ela aparecerá aqui.</p></div>}
    </div>
  </section>
}
