'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { updateVaga, VagaDetalheEmpresa } from '@/lib/actions/vagas'

type Props = { vaga: VagaDetalheEmpresa; empresaId: string }

const campo = 'w-full rounded-[4px] border border-card-border bg-white px-3 py-2 text-ink shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-neutral-700 dark:text-cream'

export function EditarVagaForm({ vaga, empresaId }: Props) {
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()
  const [feedback, setFeedback] = React.useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null)

  function submeter(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    setFeedback(null)
    startTransition(async () => {
      const result = await updateVaga(vaga.id, empresaId, formData)
      if (!result.success) {
        setFeedback({ tipo: 'erro', texto: result.error ?? 'Não foi possível guardar as alterações.' })
        return
      }
      setFeedback({ tipo: 'sucesso', texto: 'Alterações guardadas com sucesso.' })
      router.push(`/empresa/painel/vagas?empresa=${encodeURIComponent(empresaId)}`)
      router.refresh()
    })
  }

  return (
    <form onSubmit={submeter} className="space-y-5">
      <div>
        <label htmlFor="vaga-titulo" className="mb-1 block text-sm font-medium text-ink dark:text-cream">Título *</label>
        <input id="vaga-titulo" name="titulo" required maxLength={150} defaultValue={vaga.titulo} className={campo} />
      </div>
      <div>
        <label htmlFor="vaga-descricao" className="mb-1 block text-sm font-medium text-ink dark:text-cream">Descrição *</label>
        <textarea id="vaga-descricao" name="descricao" required rows={5} defaultValue={vaga.descricao} className={campo} />
      </div>
      <div>
        <label htmlFor="vaga-requisitos" className="mb-1 block text-sm font-medium text-ink dark:text-cream">Requisitos</label>
        <textarea id="vaga-requisitos" name="requisitos" rows={4} defaultValue={vaga.requisitos ?? ''} className={campo} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="vaga-categoria" className="mb-1 block text-sm font-medium text-ink dark:text-cream">Categoria *</label>
          <input id="vaga-categoria" name="categoria" required maxLength={100} defaultValue={vaga.categoria} className={campo} />
        </div>
        <div>
          <label htmlFor="vaga-provincia" className="mb-1 block text-sm font-medium text-ink dark:text-cream">Província *</label>
          <input id="vaga-provincia" name="provincia" required maxLength={100} defaultValue={vaga.provincia} className={campo} />
        </div>
        <div>
          <label htmlFor="vaga-municipio" className="mb-1 block text-sm font-medium text-ink dark:text-cream">Município</label>
          <input id="vaga-municipio" name="municipio" maxLength={100} defaultValue={vaga.municipio ?? ''} className={campo} />
        </div>
        <div>
          <label htmlFor="vaga-contrato" className="mb-1 block text-sm font-medium text-ink dark:text-cream">Tipo de contrato</label>
          <input id="vaga-contrato" name="tipo_contrato" maxLength={100} defaultValue={vaga.tipo_contrato ?? ''} className={campo} />
        </div>
        <div>
          <label htmlFor="vaga-salario" className="mb-1 block text-sm font-medium text-ink dark:text-cream">Salário</label>
          <input id="vaga-salario" name="salario" maxLength={120} defaultValue={vaga.salario ?? ''} className={campo} />
        </div>
        <div>
          <label htmlFor="vaga-whatsapp" className="mb-1 block text-sm font-medium text-ink dark:text-cream">WhatsApp *</label>
          <input id="vaga-whatsapp" name="whatsapp" required maxLength={30} defaultValue={vaga.whatsapp ?? ''} className={campo} />
        </div>
      </div>
      {feedback && (
        <p role={feedback.tipo === 'erro' ? 'alert' : 'status'} aria-live="polite" className={feedback.tipo === 'erro' ? 'text-sm text-red-700 dark:text-red-300' : 'text-sm text-green-700 dark:text-green-300'}>
          {feedback.texto}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" size="lg" disabled={pending}>{pending ? 'A guardar…' : 'Guardar alterações'}</Button>
        <Button type="button" size="lg" variant="outline" disabled={pending} onClick={() => router.back()}>Cancelar</Button>
      </div>
    </form>
  )
}
