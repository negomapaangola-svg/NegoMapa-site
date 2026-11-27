import type { Metadata } from 'next'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getUser } from '@/lib/auth'
import { alterarPalavraPasse, guardarNotificacoesConta, terminarTodasSessoes } from '@/lib/actions/conta'
import { desativarContaPropria, reativarContaPropria, suspenderContaPropria, restaurarContaPropria, pedirEliminacaoPropria, confirmarEliminacaoPropria } from '@/lib/actions/conta-estado'
import { converterContaCliente } from '@/lib/actions/conversao-conta'

export const metadata: Metadata = { title: 'Configurações da conta | NegóMapa' }

export default async function ContaConfiguracoesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams
  const user = await getUser()
  if (!user) return null
  const supabase = await createSupabaseServerClient()
  const { data: preferences } = await supabase.from('preferencias_notificacao').select('plataforma,email,whatsapp').eq('user_id', user.id).maybeSingle()
  const { data: profile } = await supabase.from('profiles').select('account_status,account_type').eq('id', user.id).maybeSingle()
  const status = profile?.account_status ?? 'active'
  const accountType = profile?.account_type ?? 'cliente'
  const pref = preferences ?? { plataforma: true, email: false, whatsapp: false }
  const messages: Record<string, string> = {
    nome: 'Verifique o nome introduzido.', contacto: 'Verifique os contactos.', avatar: 'É necessária uma imagem válida do armazenamento NegóMapa.',
    notificacoes: 'Não foi possível guardar as preferências.', password: 'A palavra-passe deve ter pelo menos 10 caracteres e as confirmações devem coincidir.',
    confirmacao: 'Escreva ELIMINAR para confirmar o pedido.', motivo: 'Indique um motivo entre 10 e 1000 caracteres.', pedido: 'Não foi possível enviar o pedido ao administrador.',
    estado: 'Não foi possível alterar o estado da conta.', storage: 'Não foi possível remover todos os ficheiros associados. A conta continua pendente de eliminação; tente novamente.', conversao: 'Não foi possível enviar o pedido de mudança de tipo. Verifique os dados e tente novamente.',
    pedido_tipo: 'Não foi possível enviar o pedido. Verifique se já existe um pedido pendente.',
  }
  const error = typeof params.erro === 'string' ? messages[params.erro] : null
  return <section className="space-y-5">
    <header><h1 className="text-2xl font-semibold tracking-tight">Configurações</h1><p className="mt-1 text-sm text-slate-500">Gerir localização, notificações, segurança e estado da conta.</p></header>
    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">{error}</p>}
    {params.salvo && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">Preferências guardadas.</p>}
    {params.password && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">Palavra-passe actualizada.</p>}
    {params.pedido && <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">Pedido de eliminação criado. Confirme abaixo para eliminar definitivamente.</p>}
    {params.pedido_tipo === 'criado' && <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">Pedido de mudança de tipo enviado. A sua conta continua como cliente até à aprovação do administrador.</p>}

    <section id="localizacao" className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div><h2 className="font-semibold">Localização</h2><p className="text-sm text-slate-500">Actualize a província, município e bairro na secção de conta. A localização GPS é opcional e depende do seu consentimento.</p></div>
      <a href="/conta/perfil#localizacao-preferencias" className="inline-flex min-h-11 items-center text-sm font-semibold text-orange-700 hover:underline dark:text-orange-300">Gerir localização e preferências</a>
    </section>

    <section id="mensagens" className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><div><h2 className="font-semibold">Mensagens</h2><p className="text-sm text-slate-500">As conversas e mensagens são privadas e apenas os participantes podem aceder-lhes.</p></div><a href="/conta/mensagens" className="inline-flex min-h-11 items-center text-sm font-semibold text-orange-700">Abrir mensagens</a></section>

    {accountType === 'cliente' && (
      <section id="conversao-conta" className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div><h2 className="font-semibold">Mudar de conta</h2><p className="text-sm text-slate-500">Como cliente, pode pedir a mudança para profissional ou empresa. A sua conta só muda depois da aprovação administrativa; o perfil profissional ou empresarial continua sujeito à respectiva avaliação.</p></div>
        <form action={converterContaCliente} className="space-y-3">
          <label className="block space-y-1.5 text-sm font-medium">Nome de apresentação<input name="nome" required minLength={2} maxLength={160} className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-950" /></label>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Novo tipo de conta</legend>
            <label className="flex min-h-11 items-center gap-3 text-sm"><input type="radio" name="target_role" value="profissional" required className="h-5 w-5 accent-orange-700" /><span>Profissional</span></label>
            <label className="flex min-h-11 items-center gap-3 text-sm"><input type="radio" name="target_role" value="empresa" required className="h-5 w-5 accent-orange-700" /><span>Empresa</span></label>
          </fieldset>
          <button className="inline-flex min-h-11 items-center rounded-xl bg-orange-700 px-4 text-sm font-semibold text-white hover:bg-orange-800">Enviar pedido de mudança</button>
        </form>
      </section>
    )}

    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div id="notificacoes"><h2 className="font-semibold">Notificações</h2><p className="text-sm text-slate-500">Escolha como pretende receber actualizações.</p></div>
      <form action={guardarNotificacoesConta} className="space-y-3">
        {(['plataforma','email','whatsapp'] as const).map((key) => <label key={key} className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" name={key} defaultChecked={Boolean(pref[key])} className="h-5 w-5 rounded border-slate-300 accent-orange-700" /><span>{key === 'plataforma' ? 'Notificações na plataforma' : key === 'email' ? 'Email' : 'WhatsApp'}</span></label>)}
        <button className="inline-flex min-h-11 items-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900">Guardar notificações</button>
      </form>
    </section>

    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div id="seguranca"><h2 className="font-semibold">Segurança</h2><p className="text-sm text-slate-500">O email de autenticação não pode ser alterado nesta fase.</p></div>
      <form action={alterarPalavraPasse} className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1.5 text-sm font-medium">Nova palavra-passe<input name="password" type="password" autoComplete="new-password" required minLength={10} className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-950" /></label>
        <label className="space-y-1.5 text-sm font-medium">Confirmar palavra-passe<input name="confirmation" type="password" autoComplete="new-password" required minLength={10} className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-950" /></label>
        <div className="sm:col-span-2"><button className="inline-flex min-h-11 items-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900">Actualizar palavra-passe</button></div>
      </form>
      <div className="border-t border-slate-100 pt-4 dark:border-slate-800"><h3 className="font-medium">Sessões</h3><p className="mt-1 text-sm text-slate-500">Pode terminar todas as sessões activas, incluindo esta.</p><form action={terminarTodasSessoes} className="mt-3"><button className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">Terminar todas as sessões</button></form></div>
    </section>

    <section id="estado-conta" className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div><h2 className="font-semibold">Estado da conta</h2><p className="text-sm text-slate-500">Estado actual: <strong>{status === 'active' ? 'Activa' : status === 'deactivated' ? 'Desactivada' : status === 'suspended' ? 'Suspensa' : status === 'pending_deletion' ? 'Eliminação pendente' : 'Eliminada'}</strong>.</p></div>
      {status === 'active' && <form action={desativarContaPropria}><button className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">Desactivar conta</button></form>}
      {status === 'deactivated' && <form action={reativarContaPropria}><button className="inline-flex min-h-11 items-center rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800">Reactivar conta</button></form>}
      {status === 'suspended' && <form action={restaurarContaPropria}><button className="inline-flex min-h-11 items-center rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800">Restaurar conta</button></form>}
      {status === 'active' && <form action={suspenderContaPropria} className="space-y-3 border-t border-slate-100 pt-4 dark:border-slate-800"><label className="block space-y-1.5 text-sm font-medium">Motivo da suspensão<textarea name="motivo" required minLength={10} maxLength={1000} rows={3} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-950" /></label><button className="inline-flex min-h-11 items-center rounded-xl border border-amber-500 px-4 text-sm font-semibold text-amber-700 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-950/30">Suspender conta</button></form>}
    </section>

    <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div id="contactar-administrador"><h2 className="font-semibold">Contactar administrador</h2><p className="text-sm text-slate-500">Para apoio ou dúvidas sobre a conta, envie uma mensagem à equipa NegóMapa.</p></div>
      <a href="/mensagens/administracao" className="inline-flex min-h-11 items-center text-sm font-semibold text-orange-700 hover:underline dark:text-orange-300">Contactar administrador</a>
    </section>

    <section id="apagar-conta" className="space-y-3 rounded-2xl border border-red-300 bg-white p-5 dark:border-red-900 dark:bg-slate-900">
      <div><h2 className="font-semibold text-red-700 dark:text-red-300">Zona de perigo</h2><p className="text-sm text-slate-600 dark:text-slate-300">A eliminação é permanente e não pode ser desfeita. Primeiro peça a eliminação e depois confirme escrevendo exactamente ELIMINAR. Os perfis, conteúdos e ficheiros associados serão removidos; as avaliações serão preservadas, sem referências às entidades ou à conta eliminadas.</p></div>
      {status !== 'pending_deletion' && status !== 'deleted' && <form action={pedirEliminacaoPropria}><button className="inline-flex min-h-11 items-center rounded-xl border border-red-300 px-4 text-sm font-semibold text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/30">Eliminar minha conta</button></form>}
      {status === 'pending_deletion' && <form action={confirmarEliminacaoPropria} className="space-y-3"><label className="block space-y-1.5 text-sm font-medium">Escreva ELIMINAR para confirmar<input name="confirmacao" required autoComplete="off" className="min-h-11 w-full rounded-xl border border-red-300 bg-white px-3 dark:border-red-900 dark:bg-slate-950" /></label><button className="inline-flex min-h-11 items-center rounded-xl bg-red-700 px-4 text-sm font-semibold text-white hover:bg-red-800">Confirmar eliminação permanente</button></form>}
      {status === 'deleted' && <p className="text-sm text-red-700 dark:text-red-300">Esta conta foi eliminada e não pode ser restaurada.</p>}
    </section>
  </section>
}