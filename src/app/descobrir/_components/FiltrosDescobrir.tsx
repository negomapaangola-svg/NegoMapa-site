'use client';

import { useState, useTransition, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { PROVINCIAS } from '@/components/home/constants';
import { OPCOES_AVALIACAO, OPCOES_PRECO, hrefDescobrir, type ParamsDescobrir } from '@/lib/descobrir/params';
import type { CategoriaDescobrir } from '@/lib/descobrir/buscar-servicos';

interface FiltrosDescobrirProps {
  params: ParamsDescobrir;
  categorias: CategoriaDescobrir[];
  municipios: string[];
}

type FiltroAtivo = { chave: string; rotulo: string; valor: string; remover: Partial<ParamsDescobrir> };

const campoClasse =
  'min-h-[44px] w-full rounded-[4px] border border-card-border bg-white px-3 py-2 text-ink shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 disabled:opacity-60 dark:bg-neutral-700 dark:text-cream';

function CampoSelect({
  id,
  rotulo,
  value,
  onChange,
  disabled,
  children,
}: {
  id: string;
  rotulo: string;
  value: string;
  onChange: (valor: string) => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-ink dark:text-cream-text">
        {rotulo}
      </label>
      <select id={id} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} className={campoClasse}>
        {children}
      </select>
    </div>
  );
}

/** Filtros combináveis. Cada alteração actualiza o URL com navegação interna (sem recarregar a página). */
export function FiltrosDescobrir({ params, categorias, municipios }: FiltrosDescobrirProps) {
  const router = useRouter();
  const [pendente, startTransition] = useTransition();
  const [painelAberto, setPainelAberto] = useState(false);
  const [maisAberto, setMaisAberto] = useState(Boolean(params.municipio));

  function aplicar(alteracoes: Partial<ParamsDescobrir>) {
    const href = hrefDescobrir(params, { ...alteracoes, pagina: 1 });
    startTransition(() => router.push(href, { scroll: false }));
  }

  const categoriaAtual = categorias.find((c) => c.slug === params.categoria);
  const ativos: FiltroAtivo[] = [];
  if (params.q) ativos.push({ chave: 'q', rotulo: 'Pesquisa', valor: `“${params.q}”`, remover: { q: '' } });
  if (categoriaAtual) {
    ativos.push({ chave: 'categoria', rotulo: 'Categoria', valor: categoriaAtual.nome, remover: { categoria: '' } });
  }
  if (params.provincia) {
    ativos.push({ chave: 'provincia', rotulo: 'Província', valor: params.provincia, remover: { provincia: '', municipio: '' } });
  }
  if (params.municipio) {
    ativos.push({ chave: 'municipio', rotulo: 'Município', valor: params.municipio, remover: { municipio: '' } });
  }
  if (params.preco) {
    const rotulo = OPCOES_PRECO.find((o) => o.valor === params.preco)?.rotulo ?? params.preco;
    ativos.push({ chave: 'preco', rotulo: 'Preço', valor: rotulo, remover: { preco: '' } });
  }
  if (params.avaliacao) {
    const rotulo = OPCOES_AVALIACAO.find((o) => o.valor === params.avaliacao)?.rotulo ?? params.avaliacao;
    ativos.push({ chave: 'avaliacao', rotulo: 'Avaliação', valor: rotulo, remover: { avaliacao: '' } });
  }

  const limparTudo: Partial<ParamsDescobrir> = { q: '', categoria: '', provincia: '', municipio: '', preco: '', avaliacao: '' };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 md:hidden">
        <button
          type="button"
          onClick={() => setPainelAberto((v) => !v)}
          aria-expanded={painelAberto}
          aria-controls="painel-filtros-descobrir"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-[4px] border border-card-border bg-white px-4 font-semibold text-ink dark:bg-neutral-700 dark:text-cream"
        >
          Filtros{ativos.length > 0 ? ` (${ativos.length})` : ''}
          <span aria-hidden="true">{painelAberto ? '▲' : '▼'}</span>
        </button>
      </div>

      <div
        id="painel-filtros-descobrir"
        className={`${painelAberto ? 'grid' : 'hidden'} gap-3 md:grid md:grid-cols-4`}
      >
        <CampoSelect id="filtro-categoria" rotulo="Categoria" value={params.categoria} onChange={(v) => aplicar({ categoria: v })}>
          <option value="">Todas as categorias</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.nome}
            </option>
          ))}
        </CampoSelect>

        <CampoSelect
          id="filtro-provincia"
          rotulo="Província"
          value={params.provincia}
          onChange={(v) => aplicar({ provincia: v, municipio: '' })}
        >
          <option value="">Todas as províncias</option>
          {PROVINCIAS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </CampoSelect>

        <CampoSelect id="filtro-preco" rotulo="Preço" value={params.preco} onChange={(v) => aplicar({ preco: v })}>
          {OPCOES_PRECO.map((o) => (
            <option key={o.valor || 'todos'} value={o.valor}>
              {o.rotulo}
            </option>
          ))}
        </CampoSelect>

        <CampoSelect
          id="filtro-avaliacao"
          rotulo="Avaliação"
          value={params.avaliacao}
          onChange={(v) => aplicar({ avaliacao: v })}
        >
          {OPCOES_AVALIACAO.map((o) => (
            <option key={o.valor || 'todas'} value={o.valor}>
              {o.rotulo}
            </option>
          ))}
        </CampoSelect>
      </div>

      <div>
        <button
          type="button"
          onClick={() => setMaisAberto((v) => !v)}
          aria-expanded={maisAberto}
          aria-controls="mais-filtros-descobrir"
          className="inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-orange-600 hover:underline dark:text-orange-300"
        >
          Mais filtros <span aria-hidden="true">{maisAberto ? '−' : '+'}</span>
        </button>
        <div id="mais-filtros-descobrir" className={`${maisAberto ? 'grid' : 'hidden'} mt-3 gap-3 md:grid-cols-4`}>
          <CampoSelect
            id="filtro-municipio"
            rotulo="Município"
            value={params.municipio}
            disabled={municipios.length === 0}
            onChange={(v) => aplicar({ municipio: v })}
          >
            <option value="">Todos os municípios</option>
            {municipios.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </CampoSelect>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2" aria-live="polite">
        {pendente && <span className="text-sm text-neutral-600 dark:text-cream-text">A atualizar resultados…</span>}
        {ativos.map((filtro) => (
          <button
            key={filtro.chave}
            type="button"
            onClick={() => aplicar(filtro.remover)}
            aria-label={`Remover filtro ${filtro.rotulo}: ${filtro.valor}`}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-orange-300 bg-orange-50 px-3 text-sm text-ink hover:border-orange-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:border-orange-700 dark:bg-orange-900/30 dark:text-cream"
          >
            <span>{filtro.valor}</span>
            <span aria-hidden="true" className="font-bold">×</span>
          </button>
        ))}
        {ativos.length > 0 && (
          <button
            type="button"
            onClick={() => aplicar(limparTudo)}
            className="inline-flex min-h-[44px] items-center px-2 text-sm font-semibold text-neutral-700 underline underline-offset-4 dark:text-cream-text"
          >
            Limpar tudo
          </button>
        )}
      </div>
    </div>
  );
}
