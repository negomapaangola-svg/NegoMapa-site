'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { guardarLocalizacaoPrestador, removerLocalizacaoPrestador } from '@/lib/actions/proximidade'

type Props = { tipo: 'profissional' | 'empresa'; entidadeId: string }

export function LocalizacaoPrestadorForm({ tipo, entidadeId }: Props) {
  const [pendente, setPendente] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [ok, setOk] = useState(false)

  function obterLocalizacao() {
    setMensagem('')
    if (!('geolocation' in navigator)) {
      setMensagem('Este navegador não disponibiliza localização GPS.')
      setOk(false)
      return
    }
    setPendente(true)
    navigator.geolocation.getCurrentPosition(
      async (posicao) => {
        const resultado = await guardarLocalizacaoPrestador(
          tipo,
          entidadeId,
          posicao.coords.latitude,
          posicao.coords.longitude,
        )
        setMensagem(resultado.message)
        setOk(resultado.ok)
        setPendente(false)
      },
      (erro) => {
        setMensagem(erro.code === erro.PERMISSION_DENIED
          ? 'A permissão foi recusada. Pode continuar sem localização.'
          : 'Não foi possível obter a localização. Tente novamente mais tarde.')
        setOk(false)
        setPendente(false)
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 },
    )
  }

  async function remover() {
    setPendente(true)
    const resultado = await removerLocalizacaoPrestador(tipo, entidadeId)
    setMensagem(resultado.message)
    setOk(resultado.ok)
    setPendente(false)
  }

  return (
    <section className="rounded-xl border border-card-border p-4">
      <h3 className="font-semibold text-ink dark:text-cream">Localização aproximada para pesquisa</h3>
      <p className="mt-1 text-sm text-neutral-600 dark:text-cream-text">
        Opcional. Indique apenas a localização do estabelecimento ou do local de atendimento — nunca uma morada residencial. Guardamos apenas uma posição arredondada; as coordenadas não são publicadas.
      </p>
      <div className="mt-3 flex flex-wrap gap-3">
        <Button type="button" disabled={pendente} loading={pendente} onClick={obterLocalizacao}>
          Usar localização aproximada do local de atendimento
        </Button>
        <Button type="button" variant="outline" disabled={pendente} onClick={remover}>
          Remover localização
        </Button>
      </div>
      {mensagem && <p role="status" className={`mt-3 text-sm ${ok ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>{mensagem}</p>}
    </section>
  )
}
