'use client'

import { useState } from 'react'
import { PROVINCIAS } from '@/lib/listas-selecao'

type Props = {
  latitude: number | null
  longitude: number | null
  onCoordinatesChange: (latitude: number | null, longitude: number | null) => void
  provincia?: string
  municipio?: string
  onProvinciaChange?: (value: string) => void
  onMunicipioChange?: (value: string) => void
  modo?: 'cliente' | 'complemento'
}

export function LocalizacaoPicker({
  latitude, longitude, onCoordinatesChange,
  provincia = '', municipio = '', onProvinciaChange, onMunicipioChange,
  modo = 'complemento',
}: Props) {
  const [opcao, setOpcao] = useState<'automatica' | 'manual'>(
    provincia || municipio ? 'manual' : 'automatica',
  )
  const [pendente, setPendente] = useState(false)
  const [erro, setErro] = useState('')

  function obterLocalizacao() {
    setErro('')
    if (!('geolocation' in navigator)) {
      setErro('Este navegador não disponibiliza geolocalização.')
      return
    }
    setPendente(true)
    navigator.geolocation.getCurrentPosition(
      (posicao) => {
        // Reduz a precisão antes de enviar os dados ao servidor.
        const lat = Math.round(posicao.coords.latitude * 100) / 100
        const lon = Math.round(posicao.coords.longitude * 100) / 100
        onCoordinatesChange(lat, lon)
        setPendente(false)
      },
      (falha) => {
        setErro(falha.code === falha.PERMISSION_DENIED
          ? 'A permissão foi recusada. Pode continuar com a localização manual.'
          : 'Não foi possível obter a localização. Tente novamente.')
        setPendente(false)
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 },
    )
  }

  return (
    <section className="rounded-xl border border-card-border p-4">
      {modo === 'cliente' ? (
        <>
          <h3 className="font-semibold text-ink dark:text-cream">Como pretende indicar a localização?</h3>
          <div className="mt-3 flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input type="radio" name="localizacao-opcao" checked={opcao === 'automatica'} onChange={() => setOpcao('automatica')} />
              Automática (aproximada)
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="localizacao-opcao" checked={opcao === 'manual'} onChange={() => setOpcao('manual')} />
              Manual
            </label>
          </div>
          {opcao === 'manual' && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium">Província
                <select value={provincia} required onChange={(event) => onProvinciaChange?.(event.target.value)} className="mt-1 w-full rounded-xl border border-card-border bg-white px-3 py-3 dark:bg-neutral-900">
                  <option value="">Seleccionar província</option>
                  {PROVINCIAS.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
              <label className="text-sm font-medium">Município
                <input value={municipio} required maxLength={100} onChange={(event) => onMunicipioChange?.(event.target.value)} placeholder="O seu município" className="mt-1 w-full rounded-xl border border-card-border bg-white px-3 py-3 dark:bg-neutral-900" />
              </label>
            </div>
          )}
          {opcao === 'automatica' && (
            <div className="mt-4">
              <p className="text-sm text-neutral-600 dark:text-cream-text">A localização aproximada será arredondada a duas casas decimais antes de ser enviada. Não guardamos coordenadas exactas.</p>
              <button type="button" disabled={pendente} onClick={obterLocalizacao} className="mt-3 min-h-10 rounded-lg border border-card-border px-4 py-2 text-sm font-semibold disabled:opacity-50">
                {pendente ? 'A obter localização...' : 'Obter localização aproximada'}
              </button>
              {latitude !== null && longitude !== null && <p className="mt-2 text-sm text-green-700 dark:text-green-300">Localização aproximada obtida.</p>}
            </div>
          )}
        </>
      ) : (
        <>
          <h3 className="font-semibold text-ink dark:text-cream">Geolocalização aproximada (opcional)</h3>
          <p className="mt-1 text-sm text-neutral-600 dark:text-cream-text">Complementa a província e o município obrigatórios. Só são usadas coordenadas arredondadas a duas casas decimais.</p>
          <button type="button" disabled={pendente} onClick={obterLocalizacao} className="mt-3 min-h-10 rounded-lg border border-card-border px-4 py-2 text-sm font-semibold disabled:opacity-50">
            {pendente ? 'A obter localização...' : 'Adicionar localização aproximada'}
          </button>
          {latitude !== null && longitude !== null && <p className="mt-2 text-sm text-green-700 dark:text-green-300">Localização aproximada adicionada.</p>}
        </>
      )}
      {erro && <p role="status" className="mt-3 text-sm text-red-700 dark:text-red-300">{erro}</p>}
    </section>
  )
}
