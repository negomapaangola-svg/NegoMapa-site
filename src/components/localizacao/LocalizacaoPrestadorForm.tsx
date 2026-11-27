'use client'

import { useState } from 'react'
import { LocalizacaoPicker } from '@/components/localizacao/LocalizacaoPicker'
import { Button } from '@/components/ui/Button'
import { guardarLocalizacaoPrestador, removerLocalizacaoPrestador } from '@/lib/actions/proximidade'

type Props = { tipo: 'profissional' | 'empresa'; entidadeId: string }

export function LocalizacaoPrestadorForm({ tipo, entidadeId }: Props) {
  const [pendente, setPendente] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [ok, setOk] = useState(false)
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)

  async function guardarCoordenadas(lat: number | null, lon: number | null) {
    setLatitude(lat)
    setLongitude(lon)
    if (lat === null || lon === null) return
    setPendente(true)
    const resultado = await guardarLocalizacaoPrestador(tipo, entidadeId, lat, lon)
    setMensagem(resultado.message)
    setOk(resultado.ok)
    setPendente(false)
  }

  async function remover() {
    setPendente(true)
    const resultado = await removerLocalizacaoPrestador(tipo, entidadeId)
    setMensagem(resultado.message)
    setOk(resultado.ok)
    setPendente(false)
    if (resultado.ok) {
      setLatitude(null)
      setLongitude(null)
    }
  }

  return (
    <section className="rounded-xl border border-card-border p-4">
      <h3 className="font-semibold text-ink dark:text-cream">Localização aproximada para pesquisa</h3>
      <p className="mt-1 text-sm text-neutral-600 dark:text-cream-text">
        Opcional. Indique apenas a localização do estabelecimento ou do local de atendimento — nunca uma morada residencial. Guardamos apenas uma posição arredondada; as coordenadas não são publicadas.
      </p>
      <div className="mt-3">
        <LocalizacaoPicker
          latitude={latitude}
          longitude={longitude}
          onCoordinatesChange={guardarCoordenadas}
          modo="complemento"
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-3">
        <Button type="button" variant="outline" disabled={pendente} onClick={remover}>
          Remover localização
        </Button>
      </div>
      {mensagem && <p role="status" className={`mt-3 text-sm ${ok ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>{mensagem}</p>}
    </section>
  )
}
