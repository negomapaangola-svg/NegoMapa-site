'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { avaliarProfissional, ProfissionalAdmin } from '@/lib/actions/profissionais-admin'
import { SUSPENSAO_DISPONIVEL } from '@/lib/admin-profissionais-config'

type Props = {
  profissionais: ProfissionalAdmin[]
}

type TipoAcao = 'aprovado' | 'rejeitado' | 'suspenso'

type AcaoPendente = {
  tipo: TipoAcao
  profissional: ProfissionalAdmin
}

type Feedback = { tipo: 'sucesso' | 'erro'; texto: string } | null

const MOTIVO_MINIMO = 10

const ESTADO_ESTILO: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  aprovado: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  rejeitado: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  suspenso: 'bg-neutral-200 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-200',
}

const ESTADO_ROTULO: Record<string, string> = {
  pendente: 'Pendente',
  aprovado: 'Aprovado',
  rejeitado: 'Rejeitado',
  suspenso: 'Suspenso',
}

const TEXTO_CONFIRMACAO: Record<TipoAcao, (nome: string) => string> = {
  aprovado: (nome) => `Aprovar o perfil de ${nome}?`,
  rejeitado: (nome) => `Rejeitar o perfil de ${nome}? O motivo fica registado e visível para o profissional.`,
  suspenso: (nome) => `Suspender o perfil de ${nome}? O perfil deixa de estar disponível publicamente.`,
}

const TITULO_CONFIRMACAO: Record<TipoAcao, string> = {
  aprovado: 'Confirmar aprovação',
  rejeitado: 'Confirmar rejeição',
  suspenso: 'Confirmar suspensão',
}

const MENSAGEM_SUCESSO: Record<TipoAcao, (nome: string) => string> = {
  aprovado: (nome) => `${nome} foi aprovado.`,
  rejeitado: (nome) => `${nome} foi rejeitado.`,
  suspenso: (nome) => `${nome} foi suspenso.`,
}

function formatarData(valor: string): string {
  return new Intl.DateTimeFormat('pt-AO', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(
    new Date(valor)
  )
}

export function ProfissionaisAdminList({ profissionais }: Props) {
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()
  const [acao, setAcao] = React.useState<AcaoPendente | null>(null)
  const [motivo, setMotivo] = React.useState('')
  const [feedback, setFeedback] = React.useState<Feedback>(null)

  function abrirConfirmacao(tipo: TipoAcao, profissional: ProfissionalAdmin) {
    setFeedback(null)
    setMotivo('')
    setAcao({ tipo, profissional })
  }

  function cancelar() {
    setAcao(null)
    setMotivo('')
  }

  function confirmar() {
    if (!acao) return
    const motivoLimpo = motivo.trim()

    if (acao.tipo === 'rejeitado' && motivoLimpo.length < MOTIVO_MINIMO) {
      setFeedback({ tipo: 'erro', texto: `Indique o motivo da rejeição (mínimo ${MOTIVO_MINIMO} caracteres).` })
      return
    }

    const alvo = acao
    startTransition(async () => {
      try {
        const resultado = await avaliarProfissional(
          alvo.profissional.id,
          alvo.tipo,
          alvo.tipo === 'rejeitado' ? motivoLimpo : undefined
        )

        if (resultado.success) {
          setFeedback({ tipo: 'sucesso', texto: MENSAGEM_SUCESSO[alvo.tipo](alvo.profissional.nome) })
          setAcao(null)
          setMotivo('')
          router.refresh()
        } else {
          setFeedback({ tipo: 'erro', texto: resultado.error ?? 'Não foi possível concluir a operação.' })
        }
      } catch {
        setFeedback({
          tipo: 'erro',
          texto: 'Não foi possível comunicar com o servidor. Verifique a ligação e tente novamente.',
        })
      }
    })
  }

  const pendentes = profissionais.filter((p) => p.estado === 'pendente').length

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 text-sm text-neutral-600 dark:text-cream-text/80">
        <span>Total: {profissionais.length}</span>
        <span>·</span>
        <span>Pendentes: {pendentes}</span>
      </div>

      {!SUSPENSAO_DISPONIVEL && (
        <p className="text-sm text-neutral-500 dark:text-cream-text/70">
          A suspensão ainda não está disponível neste ambiente.
        </p>
      )}

      {feedback && (
        <div
          role={feedback.tipo === 'erro' ? 'alert' : 'status'}
          aria-live={feedback.tipo === 'erro' ? 'assertive' : 'polite'}
          className={
            feedback.tipo === 'sucesso'
              ? 'px-4 py-3 rounded-[4px] border border-green-300 bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800'
              : 'px-4 py-3 rounded-[4px] border border-red-300 bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
          }
        >
          {feedback.texto}
        </div>
      )}

      {acao && (
        <Card variant="default" padding="lg" className="border-card-border space-y-4">
          <h2 className="text-lg font-bold text-ink dark:text-cream">
            {TITULO_CONFIRMACAO[acao.tipo]}
          </h2>
          <p className="text-neutral-700 dark:text-cream-text">
            {TEXTO_CONFIRMACAO[acao.tipo](acao.profissional.nome)}
          </p>

          {acao.tipo === 'rejeitado' && (
            <div className="space-y-1">
              <label htmlFor="motivo-rejeicao" className="block text-sm font-medium text-ink dark:text-cream">
                Motivo da rejeição
              </label>
              <textarea
                id="motivo-rejeicao"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-card-border rounded-[4px] shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-ink placeholder:text-neutral-400 dark:bg-neutral-800 dark:text-cream dark:placeholder:text-neutral-400"
                placeholder="Descreva o motivo (mínimo 10 caracteres)"
              />
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant={acao.tipo === 'aprovado' ? 'primary' : 'destructive'}
              aria-label={`${TITULO_CONFIRMACAO[acao.tipo]} de ${acao.profissional.nome}`}
              size="sm"
              disabled={pending}
              onClick={confirmar}
            >
              {pending ? 'A guardar…' : 'Confirmar'}
            </Button>
            <Button variant="outline" size="sm" disabled={pending} onClick={cancelar}>
              Cancelar
            </Button>
          </div>
        </Card>
      )}

      {profissionais.length === 0 ? (
        <Card variant="default" padding="lg" className="border-card-border text-center">
          <p className="text-neutral-500 dark:text-cream-text/70">Ainda não há profissionais registados.</p>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-[4px] border border-card-border">
          <table className="min-w-full text-sm">
            <thead className="bg-navy dark:bg-navy-dark text-cream">
              <tr>
                <th scope="col" className="px-4 py-3 text-left font-semibold">Nome</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold">Categoria</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold">Província</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold">Estado</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold">Criado em</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border bg-white/50 dark:bg-neutral-800/50">
              {profissionais.map((profissional) => (
                <tr key={profissional.id}>
                  <td className="px-4 py-3 font-medium text-ink dark:text-cream">{profissional.nome}</td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-cream-text/80">
                    {profissional.categoria || '—'}
                  </td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-cream-text/80">
                    {profissional.provincia || '—'}
                    {profissional.municipio && `, ${profissional.municipio}`}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ESTADO_ESTILO[profissional.estado] ?? ''}`}
                    >
                      {ESTADO_ROTULO[profissional.estado] ?? profissional.estado}
                    </span>
                    {profissional.estado === 'rejeitado' && profissional.motivo_rejeicao && (
                      <p className="mt-1 text-xs text-neutral-500 dark:text-cream-text/70">
                        Motivo: {profissional.motivo_rejeicao}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-cream-text/80 whitespace-nowrap">
                    {formatarData(profissional.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {profissional.estado !== 'aprovado' && (
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={pending}
                          onClick={() => abrirConfirmacao('aprovado', profissional)}
                        >
                          Aprovar
                        </Button>
                      )}
                      {profissional.estado !== 'rejeitado' && (
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={pending}
                          onClick={() => abrirConfirmacao('rejeitado', profissional)}
                        >
                          Rejeitar
                        </Button>
                      )}
                      {profissional.estado !== 'suspenso' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={!SUSPENSAO_DISPONIVEL || pending}
                          title={
                            SUSPENSAO_DISPONIVEL
                              ? undefined
                              : 'Indisponível até a migração de suspensão ser aplicada.'
                          }
                          onClick={() => abrirConfirmacao('suspenso', profissional)}
                        >
                          Suspender
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
