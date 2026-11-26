'use client'

import { useState, useTransition, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { LocalizacaoPicker } from '@/components/localizacao/LocalizacaoPicker'
import {
  actualizarLocalizacaoCliente,
  removerLocalizacaoCliente,
  guardarPreferenciasCliente,
  guardarLocalizacaoGpsCliente,
} from '@/lib/actions/perfil-pessoal'

type Categoria = { id: string; nome: string }
type Props = {
  provinciaInicial: string
  municipioInicial: string
  bairroInicial: string
  latitudeInicial?: number | null
  longitudeInicial?: number | null
  consentimento: boolean
  consentimentoActualizadoEm: string | null
  categorias: Categoria[]
  preferenciasIniciais: string[]
  /** Quando true, a província é obrigatória (usado em /cadastrar-cliente). */
  obrigatoria?: boolean
}

export function LocalizacaoPreferenciasForm({
  provinciaInicial, municipioInicial, bairroInicial, latitudeInicial = null, longitudeInicial = null, consentimento,
  consentimentoActualizadoEm, categorias, preferenciasIniciais,
}: Props) {
  const [provincia, setProvincia] = useState(provinciaInicial)
  const [municipio, setMunicipio] = useState(municipioInicial)
  const [bairro, setBairro] = useState(bairroInicial)
  const [consentimentoActual, setConsentimentoActual] = useState(consentimento)
  const [dataConsentimentoEstado, setDataConsentimentoEstado] = useState(consentimentoActualizadoEm)
  const [seleccionadas, setSeleccionadas] = useState<string[]>(preferenciasIniciais)
  const [mensagemLocal, setMensagemLocal] = useState('')
  const [mensagemPreferencias, setMensagemPreferencias] = useState('')
  const [okLocal, setOkLocal] = useState(false)
  const [okPreferencias, setOkPreferencias] = useState(false)
  const [opcaoLocalizacao, setOpcaoLocalizacao] = useState<'automatica' | 'manual'>(provinciaInicial && municipioInicial ? 'manual' : 'automatica')
  const [latitude, setLatitude] = useState<number | null>(latitudeInicial)
  const [longitude, setLongitude] = useState<number | null>(longitudeInicial)
  const [pendenteLocal, iniciarLocal] = useTransition()
  const [pendentePreferencias, iniciarPreferencias] = useTransition()

  function guardarLocal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMensagemLocal('')
    iniciarLocal(async () => {
      const resultado = opcaoLocalizacao === 'automatica'
        ? (latitude !== null && longitude !== null
            ? await guardarLocalizacaoGpsCliente({ latitude, longitude })
            : { ok: false, message: 'Obtenha a localização aproximada antes de guardar.' })
        : await actualizarLocalizacaoCliente({ provincia, municipio, bairro })
      if (resultado.ok && opcaoLocalizacao === 'automatica') {
        setConsentimentoActual(true)
        setDataConsentimentoEstado(new Date().toISOString())
      } else if (resultado.ok) {
        setConsentimentoActual(false)
        setDataConsentimentoEstado(null)
        setLatitude(null)
        setLongitude(null)
      }
      setMensagemLocal(resultado.message)
      setOkLocal(resultado.ok)
    })
  }

  function removerLocal() {
    setMensagemLocal('')
    iniciarLocal(async () => {
      const resultado = await removerLocalizacaoCliente()
      if (resultado.ok) {
        setProvincia('')
        setMunicipio('')
        setBairro('')
        setLatitude(null)
        setLongitude(null)
        setConsentimentoActual(false)
        setDataConsentimentoEstado(null)
      }
      setMensagemLocal(resultado.message)
      setOkLocal(resultado.ok)
    })
  }


  function alternarCategoria(id: string) {
    setSeleccionadas((actual) => actual.includes(id)
      ? actual.filter((item) => item !== id)
      : [...actual, id])
  }

  function guardarCategorias(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMensagemPreferencias('')
    iniciarPreferencias(async () => {
      const resultado = await guardarPreferenciasCliente(seleccionadas)
      setMensagemPreferencias(resultado.message)
      setOkPreferencias(resultado.ok)
    })
  }

  return (
    <div className="space-y-7">
      <section aria-labelledby="localizacao-cliente-titulo">
        <h3 id="localizacao-cliente-titulo" className="font-semibold text-ink dark:text-cream">Localização administrativa</h3>
        <p className="mt-1 text-sm text-neutral-600 dark:text-cream-text">Estes dados são privados e servem apenas para ordenar resultados por província e município.</p>
        <form onSubmit={guardarLocal} className="mt-4 space-y-4">
          <LocalizacaoPicker
            modo="cliente"
            provincia={provincia}
            municipio={municipio}
            onProvinciaChange={setProvincia}
            onMunicipioChange={setMunicipio}
            latitude={latitude}
            longitude={longitude}
            onCoordinatesChange={(lat, lon) => { setLatitude(lat); setLongitude(lon); setOpcaoLocalizacao('automatica') }}
            onOptionChange={setOpcaoLocalizacao}
          />
          {opcaoLocalizacao === 'manual' && (
            <label className="block text-sm font-medium">Bairro (opcional)
              <input value={bairro} onChange={(event) => setBairro(event.target.value)} maxLength={100} placeholder="O seu bairro" className="mt-1 w-full rounded-xl border border-card-border bg-white px-3 py-3 dark:bg-neutral-900" />
            </label>
          )}
          {mensagemLocal && <p role="status" className={okLocal ? 'text-sm text-green-700 dark:text-green-300' : 'text-sm text-red-700 dark:text-red-300'}>{mensagemLocal}</p>}
          <div className="flex flex-wrap gap-3">
            <Button type="submit" loading={pendenteLocal} disabled={pendenteLocal}>Guardar localização</Button>
            <Button type="button" variant="outline" disabled={pendenteLocal} onClick={removerLocal}>Remover localização e consentimento</Button>
          </div>
        </form>
      </section>
      <section className="border-t border-card-border pt-6" aria-labelledby="preferencias-cliente-titulo">
        <h3 id="preferencias-cliente-titulo" className="font-semibold text-ink dark:text-cream">Preferências de categorias</h3>
        <p className="mt-1 text-sm text-neutral-600 dark:text-cream-text">Escolha as áreas de interesse. As suas selecções são privadas e não alteram as preferências de notificações.</p>
        <form onSubmit={guardarCategorias} className="mt-4 space-y-4">
          {categorias.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {categorias.map((categoria) => (
                <label key={categoria.id} className="flex min-h-11 items-center gap-3 rounded-xl border border-card-border bg-white/50 px-3 py-2 text-sm dark:bg-white/5">
                  <input type="checkbox" checked={seleccionadas.includes(categoria.id)} onChange={() => alternarCategoria(categoria.id)} className="h-4 w-4 accent-orange-500" />
                  <span>{categoria.nome}</span>
                </label>
              ))}
            </div>
          ) : <p className="text-sm text-neutral-500">Não existem categorias disponíveis.</p>}
          {mensagemPreferencias && <p role="status" className={okPreferencias ? 'text-sm text-green-700 dark:text-green-300' : 'text-sm text-red-700 dark:text-red-300'}>{mensagemPreferencias}</p>}
          <Button type="submit" loading={pendentePreferencias} disabled={pendentePreferencias}>Guardar preferências</Button>
        </form>
      </section>
    </div>
  )
}
