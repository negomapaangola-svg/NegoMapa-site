'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Resultados = {
  empresas: Array<{ id: string; name: string; slug: string; sector: string | null; province: string | null }>
  profissionais: Array<{ id: string; nome: string; profissao: string | null; provincia: string | null }>
  servicos: Array<{ id: string; titulo: string; categoria: string | null; provincia: string | null }>
  vagas: Array<{ id: string; titulo: string; categoria: string | null; provincia: string | null }>
}

const VAZIO: Resultados = { empresas: [], profissionais: [], servicos: [], vagas: [] }

export function PesquisaGlobal() {
  const router = useRouter()
  const [termo, setTermo] = useState('')
  const [resultados, setResultados] = useState<Resultados>(VAZIO)
  const [carregando, setCarregando] = useState(false)
  const [aberto, setAberto] = useState(false)
  const contentor = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function aoClicarFora(evento: MouseEvent) {
      if (!contentor.current?.contains(evento.target as Node)) {
        setAberto(false)
      }
    }

    document.addEventListener('mousedown', aoClicarFora)
    return () => document.removeEventListener('mousedown', aoClicarFora)
  }, [])

  useEffect(() => {
    const consulta = termo.trim()

    if (consulta.length < 2) {
      setResultados(VAZIO)
      setAberto(false)
      return
    }

    const controlador = new AbortController()
    const temporizador = setTimeout(async () => {
      setCarregando(true)
      try {
        const resposta = await fetch(`/api/pesquisa?q=${encodeURIComponent(consulta)}`, {
          signal: controlador.signal,
        })
        const dados = (await resposta.json()) as Resultados
        setResultados(dados)
        setAberto(true)
      } catch {
        if (!controlador.signal.aborted) {
          setResultados(VAZIO)
        }
      } finally {
        if (!controlador.signal.aborted) {
          setCarregando(false)
        }
      }
    }, 300)

    return () => {
      controlador.abort()
      clearTimeout(temporizador)
    }
  }, [termo])

  const total =
    resultados.empresas.length +
    resultados.profissionais.length +
    resultados.servicos.length +
    resultados.vagas.length

  function selecionar(destino: string) {
    setAberto(false)
    setTermo('')
    router.push(destino)
  }

  return (
    <div ref={contentor} className="relative w-full max-w-md">
      <input
        type="search"
        value={termo}
        onChange={(evento) => setTermo(evento.target.value)}
        onFocus={() => termo.trim().length >= 2 && setAberto(true)}
        placeholder="Pesquisar empresas, profissionais, serviços ou vagas"
        aria-label="Pesquisa global"
        className="w-full min-h-11 rounded-md border border-card-border bg-white px-4 text-sm text-navy placeholder:text-neutral-500 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-navy-dark dark:text-cream dark:placeholder:text-cream-text/60"
      />

      {aberto && (
        <div className="absolute inset-x-0 top-full z-300 mt-2 max-h-[70vh] overflow-y-auto rounded-md border border-card-border bg-white p-2 shadow-xl dark:bg-navy-dark">
          {carregando && <p className="px-3 py-2 text-sm text-neutral-500">A pesquisar…</p>}

          {!carregando && total === 0 && (
            <p className="px-3 py-2 text-sm text-neutral-500">Nenhum resultado encontrado.</p>
          )}

          {!carregando && resultados.empresas.length > 0 && (
            <div className="mb-2">
              <p className="px-3 py-1 text-xs font-semibold uppercase text-neutral-500">Empresas</p>
              {resultados.empresas.map((empresa) => (
                <button
                  key={empresa.id}
                  type="button"
                  onClick={() => selecionar(`/empresa/${empresa.slug}`)}
                  className="flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left hover:bg-cream dark:hover:bg-white/5"
                >
                  <span className="text-sm font-medium text-navy dark:text-cream">{empresa.name}</span>
                  <span className="text-xs text-neutral-500">{empresa.sector ?? empresa.province ?? ''}</span>
                </button>
              ))}
            </div>
          )}

          {!carregando && resultados.profissionais.length > 0 && (
            <div className="mb-2">
              <p className="px-3 py-1 text-xs font-semibold uppercase text-neutral-500">Profissionais</p>
              {resultados.profissionais.map((profissional) => (
                <button
                  key={profissional.id}
                  type="button"
                  onClick={() => selecionar(`/profissional/${profissional.id}`)}
                  className="flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left hover:bg-cream dark:hover:bg-white/5"
                >
                  <span className="text-sm font-medium text-navy dark:text-cream">{profissional.nome}</span>
                  <span className="text-xs text-neutral-500">{profissional.profissao ?? profissional.provincia ?? ''}</span>
                </button>
              ))}
            </div>
          )}

          {!carregando && resultados.servicos.length > 0 && (
            <div className="mb-2">
              <p className="px-3 py-1 text-xs font-semibold uppercase text-neutral-500">Serviços</p>
              {resultados.servicos.map((servico) => (
                <button
                  key={servico.id}
                  type="button"
                  onClick={() => selecionar(`/servico/${servico.id}`)}
                  className="flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left hover:bg-cream dark:hover:bg-white/5"
                >
                  <span className="text-sm font-medium text-navy dark:text-cream">{servico.titulo}</span>
                  <span className="text-xs text-neutral-500">{servico.categoria ?? servico.provincia ?? ''}</span>
                </button>
              ))}
            </div>
          )}

          {!carregando && resultados.vagas.length > 0 && (
            <div>
              <p className="px-3 py-1 text-xs font-semibold uppercase text-neutral-500">Vagas</p>
              {resultados.vagas.map((vaga) => (
                <button
                  key={vaga.id}
                  type="button"
                  onClick={() => selecionar(`/vaga/${vaga.id}`)}
                  className="flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left hover:bg-cream dark:hover:bg-white/5"
                >
                  <span className="text-sm font-medium text-navy dark:text-cream">{vaga.titulo}</span>
                  <span className="text-xs text-neutral-500">{vaga.categoria ?? vaga.provincia ?? ''}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
