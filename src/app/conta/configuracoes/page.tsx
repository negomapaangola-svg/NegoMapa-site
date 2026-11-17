import type { Metadata } from 'next'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getUser } from '@/lib/auth'
import { alterarPalavraPasse, guardarNotificacoesConta, solicitarEliminacaoConta, terminarTodasSessoes } from '@/lib/actions/conta'

export const metadata: Metadata = { title: 'Configurações da conta | NegóMapa' }

export default async function ContaConfiguracoesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams
  const user = await getUser()
  if (!user) return null
  const supabase = await createSupabaseServerClient()
  const { data: preferences } = await supabase.from('preferencias_notificacao').select('plataforma,email,whatsapp').eq('user_id', user.id).maybeSingle()
  const pref = preferences ?? { plataforma: true, email: false, whatsapp: false }
  const messages: Record<string, string> = {
    nome: 'Verifique o nome introduzido.', contacto: 'Verifique os contactos.', avatar: 'É necessária uma imagem válida do armazenamento NegóMapa.',
    notificacoes: 'Não foi possível guardar as preferências.', password: 'A palavra-passe deve ter pelo menos 10 caracteres e as confirmações devem coincidir.',
    confirmacao: 'Escreva ELIMINAR para confirmar o pedido.', motivo: 'Indique um motivo entre 10 e 1000 caracteres.', pedido: 'Não foi possível enviar o pedido ao administrador.',
  }
  const error = typeof params.erro === 'string' ? messages[params.erro] : null
  return <section className="space-y-5">
    <header><h1 className="text-2xl font-semibold tracking-tight">Configurações</h1><p className="mt-1 text-sm text-slate-500">Gerir localização, notificações e segurança.</p></header>
    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">{error}</p>}
    {params.salvo && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">Preferências guardadas.</p>}
    {params.password && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">Palavra-passe actualizada.</p>}
    {params.pedido && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">Pedido de eliminação enviado ao administrador.</p>}

    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div><h2 className="font-semibold">Notificações</h2><p className="text-sm text-slate-500">Escolha como pretende receber actualizações.</p></div>
      <form action={guardarNotificacoesConta} className="space-y-3">
        {(['plataforma','email','whatsapp'] as const).map((key) => <label key={key} className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" name={key} defaultChecked={Boolean(pref[key])} className="h-5 w-5 rounded border-slate-300 accent-orange-700" /><span>{key === 'plataforma' ? 'Notificações na plataforma' : key === 'email' ? 'Email' : 'WhatsApp'}</span></label>)}
        <button className="inline-flex min-h-11 items-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900">Guardar notificações</button>
      </form>
    </section>

    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div><h2 className="font-semibold">Segurança</h2><p className="text-sm text-slate-500">O email de autenticação não pode ser alterado nesta fase.</p></div>
      <form action={alterarPalavraPasse} className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1.5 text-sm font-medium">Nova palavra-passe<input name="password" type="password" autoComplete="new-password" required minLength={10} className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-950" /></label>
        <label className="space-y-1.5 text-sm font-medium">Confirmar palavra-passe<input name="confirmation" type="password" autoComplete="new-password" required minLength={10} className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-950" /></label>
        <div className="sm:col-span-2"><button className="inline-flex min-h-11 items-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900">Actualizar palavra-passe</button></div>
      </form>
      <div className="border-t border-slate-100 pt-4 dark:border-slate-800"><h3 className="font-medium">Sessões</h3><p className="mt-1 text-sm text-slate-500">Pode terminar todas as sessões activas, incluindo esta.</p><form action={terminarTodasSessoes} className="mt-3"><button className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">Terminar todas as sessões</button></form></div>
    </section>

    <section className="space-y-3 rounded-2xl border border-red-300 bg-white p-5 dark:border-red-900 dark:bg-slate-900">
      <div><h2 className="font-semibold text-red-700 dark:text-red-300">Zona de perigo</h2><p className="text-sm text-slate-600 dark:text-slate-300">Solicitar a eliminação da conta. O pedido será analisado pelo administrador; esta acção não apaga automaticamente os dados nem a autenticação.</p></div>
      <form action={solicitarEliminacaoConta} className="space-y-3">
        <label className="block space-y-1.5 text-sm font-medium">Motivo do pedido<textarea name="motivo" required minLength={10} maxLength={1000} rows={3} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-950" /></label>
        <label className="block space-y-1.5 text-sm font-medium">Escreva ELIMINAR para confirmar<input name="confirmacao" required autoComplete="off" className="min-h-11 w-full rounded-xl border border-red-300 bg-white px-3 dark:border-red-900 dark:bg-slate-950" /></label>
        <button className="inline-flex min-h-11 items-center rounded-xl bg-red-700 px-4 text-sm font-semibold text-white hover:bg-red-800">Enviar pedido de eliminação</button>
      </form>
    </section>
  </section>
}
