'use client'

import { useState } from 'react'
import { AdminProdutoDeleteButton } from './AdminProdutoDeleteButton'

type Row = { id: string; title: string; status: string; createdAt: string; detail: string }

type ContentType = 'produtos' | 'candidaturas' | 'pedidos'

export function AdminConteudosClient({
  tipo,
  initialRows,
}: {
  tipo: ContentType
  initialRows: Row[]
}) {
  const [rows, setRows] = useState<Row[]>(initialRows)

  const handleEliminado = (id: string) => {
    setRows((prev) => prev.filter((row) => row.id !== id))
  }

  if (rows.length === 0) {
    return <p className="rounded-lg bg-neutral-50 px-4 py-8 text-center text-sm text-neutral-600 dark:bg-neutral-900 dark:text-neutral-300">Não foram encontrados registos.</p>
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {rows.map((row) => (
        <article key={row.id} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/5 dark:bg-slate-900 dark:ring-white/10">
          <div className="flex items-start justify-between gap-3">
            <h2 className="min-w-0 break-words text-base font-semibold text-slate-950 dark:text-white">{row.title || 'Registo sem título'}</h2>
            <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">{row.status || 'Sem estado'}</span>
          </div>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Criado em {new Date(row.createdAt).toLocaleDateString('pt-PT')}</p>
          <p className="mt-2 break-words text-xs text-slate-500 dark:text-slate-400">{row.detail}</p>
          {tipo === 'produtos' && <AdminProdutoDeleteButton produtoId={row.id} onEliminado={handleEliminado} />}
        </article>
      ))}
    </div>
  )
}
