'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { eliminarContaAdmin, type DeletionAuditEntry, type DeletionCandidate } from '@/lib/actions/admin-account-deletion'

type Props = {
  accounts: DeletionCandidate[]
  audit: DeletionAuditEntry[]
}

const TYPE_LABELS: Record<string, string> = {
  cliente: 'Cliente / utilizador',
  profissional: 'Profissional',
  empresa: 'Empresa',
}

const DEPENDENCY_LABELS: Record<string, string> = {
  servicos: 'Serviços',
  pedidos: 'Pedidos',
  conversas: 'Conversas',
  mensagens: 'Mensagens',
  avaliacoes: 'Avaliações',
  denuncias: 'Denúncias',
  candidaturas: 'Candidaturas',
  vagas: 'Vagas',
  produtos: 'Produtos',
  preferencias: 'Preferências',
  notificacoes: 'Notificações',
  mensagens_administrativas: 'Mensagens administrativas',
  preferencias_notificacao: 'Preferências de notificação',
}

function countDependencies(dependencies: Record<string, number>) {
  return Object.values(dependencies).reduce((total, value) => total + (Number.isFinite(value) ? value : 0), 0)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-AO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function AdminAccountDeletionPanel({ accounts, audit }: Props) {
  const router = useRouter()
  const [selected, setSelected] = React.useState<DeletionCandidate | null>(null)
  const [reason, setReason] = React.useState('')
  const [confirmation, setConfirmation] = React.useState('')
  const [pending, startTransition] = React.useTransition()
  const [feedback, setFeedback] = React.useState<{ success: boolean; text: string } | null>(null)

  function openConfirmation(account: DeletionCandidate) {
    setFeedback(null)
    setSelected(account)
    setReason('')
    setConfirmation('')
  }

  function cancelConfirmation() {
    if (pending) return
    setSelected(null)
    setReason('')
    setConfirmation('')
  }

  function confirmDeletion() {
    if (!selected) return
    if (reason.trim().length < 10) {
      setFeedback({ success: false, text: 'O motivo deve ter pelo menos 10 caracteres.' })
      return
    }
    if (confirmation !== 'ELIMINAR') {
      setFeedback({ success: false, text: 'Escreva ELIMINAR para confirmar explicitamente.' })
      return
    }

    const target = selected
    startTransition(async () => {
      let result: Awaited<ReturnType<typeof eliminarContaAdmin>>
      try {
        result = await eliminarContaAdmin(target.account_id, target.account_type, reason, confirmation)
      } catch {
        setFeedback({ success: false, text: 'O servidor não conseguiu concluir a operação. Verifique o estado da conta e da auditoria antes de repetir.' })
        return
      }
      if (!result.success) {
        setFeedback({ success: false, text: result.error || 'Não foi possível concluir a operação.' })
        return
      }

      setSelected(null)
      setReason('')
      setConfirmation('')
      setFeedback({
        success: true,
        text: result.warning
          ? `${target.display_name}: conta desactivada e auditada. ${result.warning}`
          : `${target.display_name}: conta desactivada, autenticação bloqueada e auditoria criada.`,
      })
      router.refresh()
    })
  }

  return (
    <div className="min-w-0 space-y-8">
      <section className="rounded-xl border border-red-300 bg-red-50 p-4 dark:border-red-900/70 dark:bg-red-950/30 sm:p-5" aria-labelledby="deletion-warning-title">
        <h2 id="deletion-warning-title" className="font-semibold text-red-900 dark:text-red-200">Acção administrativa sensível</h2>
        <p className="mt-2 text-sm leading-6 text-red-800 dark:text-red-200/90">
          A acção desactiva a conta e bloqueia novas autenticações. Não elimina fisicamente o utilizador nem os seus registos relacionados. Cada operação exige motivo, confirmação explícita e registo de auditoria.
        </p>
      </section>

      {feedback ? (
        <div role={feedback.success ? 'status' : 'alert'} aria-live={feedback.success ? 'polite' : 'assertive'}
          className={feedback.success
            ? 'rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-900 dark:border-green-900 dark:bg-green-950/30 dark:text-green-200'
            : 'rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200'}>
          {feedback.text}
        </div>
      ) : null}

      {selected ? (
        <section aria-labelledby="confirm-delete-title" className="space-y-4 rounded-xl border-2 border-red-300 bg-white p-4 shadow-sm dark:border-red-900 dark:bg-slate-900 sm:p-6">
          <div>
            <h2 id="confirm-delete-title" className="text-lg font-bold text-slate-950 dark:text-white">Confirmar desactivação da conta</h2>
            <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
              Conta: <strong>{selected.display_name}</strong> · {TYPE_LABELS[selected.account_type]} · ID <span className="break-all font-mono text-xs">{selected.account_id}</span>
            </p>
            <p className="mt-2 text-sm text-red-800 dark:text-red-300">
              Esta operação retira o perfil da área pública e impede o acesso normal. Os dados relacionados permanecem guardados.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="account-deletion-reason" className="block text-sm font-semibold text-slate-800 dark:text-slate-200">Motivo obrigatório</label>
            <textarea autoFocus id="account-deletion-reason" value={reason} onChange={(event) => setReason(event.target.value)}
              minLength={10} maxLength={1000} rows={4} required
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:border-slate-600 dark:bg-slate-950 dark:text-white"
              placeholder="Registe o motivo administrativo (mínimo 10 caracteres)." />
            <p className="text-xs text-slate-500 dark:text-slate-400">{reason.trim().length}/1000 caracteres · mínimo 10</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="account-deletion-confirmation" className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
              Para confirmar, escreva <span className="font-mono">ELIMINAR</span>
            </label>
            <input id="account-deletion-confirmation" value={confirmation} onChange={(event) => setConfirmation(event.target.value)}
              autoComplete="off" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:border-slate-600 dark:bg-slate-950 dark:text-white" />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button type="button" onClick={confirmDeletion} disabled={pending || reason.trim().length < 10 || confirmation !== 'ELIMINAR'}
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-red-700 bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-600 dark:bg-red-700 dark:hover:bg-red-600 dark:focus-visible:ring-offset-slate-900">
              {pending ? 'A desactivar…' : 'Confirmar desactivação segura'}
            </button>
            <button type="button" onClick={cancelConfirmation} disabled={pending}
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800">
              Cancelar
            </button>
          </div>
        </section>
      ) : null}

      <section className="space-y-3" aria-labelledby="accounts-list-title">
        <div>
          <h2 id="accounts-list-title" className="text-lg font-bold text-slate-950 dark:text-white">Contas registadas</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">As dependências são contagens dos registos relacionados; nenhum deles é removido.</p>
        </div>

        {accounts.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">Não existem contas elegíveis para apresentar.</div>
        ) : (
          <ul className="space-y-3">
            {accounts.map((account) => (
              <li key={account.account_id} className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 sm:p-5">
                <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <h3 className="break-words font-semibold text-slate-950 dark:text-white">{account.display_name}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{TYPE_LABELS[account.account_type] ?? account.account_type} · {account.current_status}</p>
                    <p className="break-all font-mono text-xs text-slate-500 dark:text-slate-500">{account.account_id}</p>
                  </div>
                  <span className={account.is_active
                    ? 'inline-flex w-fit rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800 dark:bg-green-950/50 dark:text-green-300'
                    : 'inline-flex w-fit rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-200'}>
                    {account.is_active ? 'Activa' : 'Eliminada'}
                  </span>
                </div>

                <div className="mt-4 rounded-lg bg-slate-50 p-3 dark:bg-slate-950/60">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Dependências relevantes: {countDependencies(account.dependencies)}</p>
                  <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3 lg:grid-cols-4">
                    {Object.entries(account.dependencies).map(([key, value]) => (
                      <div key={key} className="min-w-0">
                        <dt className="break-words text-xs text-slate-500 dark:text-slate-400">{DEPENDENCY_LABELS[key] ?? key}</dt>
                        <dd className="text-sm font-semibold tabular-nums text-slate-900 dark:text-white">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>

                {account.is_active ? (
                  <button type="button" onClick={() => openConfirmation(account)}
                    className="mt-4 inline-flex min-h-10 items-center justify-center rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-800 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/40">
                    Eliminar conta
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3" aria-labelledby="deletion-audit-title">
        <div>
          <h2 id="deletion-audit-title" className="text-lg font-bold text-slate-950 dark:text-white">Registo de auditoria</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">Últimas 50 operações, incluindo o motivo, administrador, estado anterior e resultado do bloqueio de autenticação.</p>
        </div>
        {audit.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">Ainda não existem operações de desactivação registadas.</div>
        ) : (
          <ol className="space-y-3">
            {audit.map((entry) => (
              <li key={entry.id} className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{TYPE_LABELS[entry.account_type]} · {formatDate(entry.occurred_at)}</p>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {entry.auth_ban_status === 'banned' ? 'Autenticação bloqueada' : entry.auth_ban_status === 'failed' ? 'Bloqueio externo falhou' : 'Bloqueio pendente'}
                  </span>
                </div>
                <p className="mt-2 break-all font-mono text-xs text-slate-500 dark:text-slate-400">Conta: {entry.account_id}</p>
                <p className="mt-1 break-all font-mono text-xs text-slate-500 dark:text-slate-400">Administrador: {entry.admin_id}</p>
                <p className="mt-3 whitespace-pre-wrap break-words text-sm text-slate-700 dark:text-slate-300">{entry.reason}</p>
                <details className="mt-3 text-xs text-slate-600 dark:text-slate-400">
                  <summary className="cursor-pointer font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500">Ver estados e dependências preservadas</summary>
                  <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-50 p-3 text-xs dark:bg-slate-950">{JSON.stringify({
                    estado_anterior: entry.previous_state,
                    estado_novo: entry.new_state,
                    dependencias: entry.dependency_counts,
                  }, null, 2)}</pre>
                </details>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  )
}
