'use client'

import { useState, useTransition, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { PROVINCIAS } from '@/components/home/constants'
import {
  actualizarLocalizacaoCliente,
  removerLocalizacaoCliente,
  guardarPreferenciasCliente,
} from '@/lib/actions/perfil-pessoal'

type Categoria = { id: string; nome: string }
type Props = {
  provinciaInicial: string
  municipioInicial: string
  bairroInicial: string
  consentimento: boolean
  consentimentoActualizadoEm: string | null
  categorias: Categoria[]
  preferenciasIniciais: string[]
}

export function LocalizacaoPreferenciasForm({
  provinciaInicial, municipioInicial, bairroInicial, consentimento,
  consentimentoActualizadoEm, categorias, preferenciasIniciais,
}: Props) {
  const [provincia, setProvincia] = useState(provinciaInicial)
  const [municipio, setMunicipio] = useState(municipioInicial)
  const [bairro, setBairro] = useState(bairroInicial)
  const [seleccionadas, setSeleccionadas] = useState<string[]>(preferenciasIniciais)
  const [mensagemLocal, setMensagemLocal] = useState('')
  const [mensagemPreferencias, setMensagemPreferencias] = useState('')
  const [okLocal, setOkLocal] = useState(false)
  const [okPreferencias, setOkPreferencias] = useState(false)
  const [pendenteLocal, iniciarLocal] = useTransition()
  const [pendentePreferencias, iniciarPreferencias] = useTransition()

  function guardarLocal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMensagemLocal('')
    iniciarLocal(async () => {
      const resultado = await actualizarLocalizacaoCliente({ provincia, municipio, bairro })
      setMensagemLocal(resultado.message)
      setOkLocal(resultado.ok)
    })
  }

  function removerLocal() {
    setMensagemLocal('')
    iniciarLocal(async () => {
      const resultado = await removerLocalizacaoCliente()
      if (resultado.ok) { setProvincia(''); setMunicipio(''); setBairro('') }
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
        <form onSubmit={guardarLocal} className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium">Província
            <select value={provincia} onChange={(event) => setProvincia(event.target.value)} className="mt-1 w-full rounded-xl border border-card-border bg-white px-3 py-3 dark:bg-neutral-900">
              <option value="">Seleccionar província</option>
              {PROVINCIAS.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium">Município
            <input value={municipio} onChange={(event) => setMunicipio(event.target.value)} maxLength={100} placeholder="O seu município" className="mt-1 w-full rounded-xl border border-card-border bg-white px-3 py-3 dark:bg-neutral-900" />
          </label>
          <label className="text-sm font-medium sm:col-span-2">Bairro (opcional)
            <input value={bairro} onChange={(event) => setBairro(event.target.value)} maxLength={100} placeholder="O seu bairro" className="mt-1 w-full rounded-xl border border-card-border bg-white px-3 py-3 dark:bg-neutral-900" />
          </label>
          {mensagemLocal && <p role="status" className={okLocal ? 'text-sm text-green-700 dark:text-green-300 sm:col-span-2' : 'text-sm text-red-700 dark:text-red-300 sm:col-span-2'}>{mensagemLocal}</p>}
          <div className="flex flex-wrap gap-3 sm:col-span-2">
            <Button type="submit" loading={pendenteLocal} disabled={pendenteLocal}>Guardar localização</Button>
            <Button type="button" variant="outline" disabled={pendenteLocal} onClick={removerLocal}>Remover localização e consentimento</Button>
          </div>
        </form>
        <div className="mt-4 rounded-xl border border-card-border bg-white/50 p-4 text-sm dark:bg-white/5">
          <p><strong>Consentimento de localização:</strong> {consentimento ? 'Concedido' : 'Não concedido'}</p>
          {consentimentoActualizadoEm && <p className="mt-1 text-neutral-500">Actualizado em {new Date(consentimentoActualizadoEm).toLocaleDateString('pt-PT')}</p>}
          <p className="mt-2 text-neutral-600 dark:text-cream-text">O GPS não é solicitado nem utilizado nesta fase. Não são apresentadas coordenadas.</p>
        </div>
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
