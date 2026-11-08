import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { IMAGENS } from '@/lib/imagens';
import { MainLayout } from '@/components/layout/MainLayout';
import {
  listarProfissionaisPublicos,
  type ProfissionalPublico,
} from '@/lib/actions/profissionais-publicos';
import { ProfissionalCard } from './_components/ProfissionalCard';
import { FiltrosProfissionais } from './_components/FiltrosProfissionais';

export const metadata: Metadata = {
  title: 'Profissionais | NegóMapa',
  description: 'Encontre profissionais qualificados por área, localização e experiência em Angola.',
};

type SearchParams = Promise<{ q?: string | string[]; categoria?: string | string[]; provincia?: string | string[] }>;

function valorParametro(valor: string | string[] | undefined): string {
  const bruto = Array.isArray(valor) ? valor[0] : valor;
  return (bruto ?? '').trim().slice(0, 100);
}

/** Minúsculas e sem acentos, para comparar textos de pesquisa. */
function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function listaUnica(valores: (string | null)[]): string[] {
  return [...new Set(valores.filter((v): v is string => !!v && v.trim().length > 0))].sort((a, b) =>
    a.localeCompare(b, 'pt')
  );
}

function filtrarProfissionais(
  profissionais: ProfissionalPublico[],
  { q, categoria, provincia }: { q: string; categoria: string; provincia: string }
): ProfissionalPublico[] {
  const termo = normalizar(q);

  return profissionais.filter((p) => {
    if (categoria && p.categoria !== categoria) return false;
    if (provincia && p.provincia !== provincia) return false;
    if (termo) {
      const alvo = normalizar([p.nome, p.categoria, p.provincia].filter(Boolean).join(' '));
      if (!alvo.includes(termo)) return false;
    }
    return true;
  });
}

export default async function ProfissionaisPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const filtros = {
    q: valorParametro(params.q),
    categoria: valorParametro(params.categoria),
    provincia: valorParametro(params.provincia),
  };

  // A vista pública já devolve só profissionais aprovados.
  const todos = await listarProfissionaisPublicos();
  const profissionais = filtrarProfissionais(todos, filtros);
  const temFiltros = Boolean(filtros.q || filtros.categoria || filtros.provincia);

  return (
    <MainLayout>
      <section className="py-16 lg:py-24 bg-cream dark:bg-navy-dark" aria-labelledby="profissionais-title">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h1 id="profissionais-title" className="text-4xl sm:text-5xl font-bold tracking-tight text-ink dark:text-cream">
              Profissionais
            </h1>
            <p className="mt-4 text-lg text-neutral-600 dark:text-cream-text">
              Encontre profissionais qualificados por área e localização em Angola.
            </p>
          </div>

          {todos.length > 0 ? (
            <>
              <FiltrosProfissionais
                q={filtros.q}
                categoria={filtros.categoria}
                provincia={filtros.provincia}
                categorias={listaUnica(todos.map((p: ProfissionalPublico) => p.categoria))}
                provincias={listaUnica(todos.map((p: ProfissionalPublico) => p.provincia))}
              />

              <p className="mb-4 text-sm text-neutral-600 dark:text-cream-text" role="status" aria-live="polite">
                {profissionais.length === 1 ? '1 profissional' : `${profissionais.length} profissionais`}
              </p>

              {profissionais.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" role="list" aria-label="Lista de profissionais">
                  {profissionais.map((profissional) => (
                    <div key={profissional.id} role="listitem">
                      <ProfissionalCard profissional={profissional} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16" role="status">
                  <h2 className="text-xl font-semibold text-ink dark:text-cream">{temFiltros ? 'Nenhum profissional encontrado com estes filtros.' : 'Ainda não há profissionais disponíveis nesta área.'}</h2>
                  <p className="mt-2 text-neutral-600 dark:text-cream-text max-w-md mx-auto">
                    Experimente alterar os critérios de pesquisa ou limpar os filtros.
                  </p>
                  <Link href="/profissionais" className="mt-4 inline-block text-sm font-medium text-orange-500 dark:text-orange-400 hover:underline">Limpar filtros</Link>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16" role="status">
              <Image
                src={IMAGENS.estadoVazio.profissionais}
                alt=""
                width={800}
                height={600}
                sizes="200px"
                className="mx-auto mb-5 h-auto w-32 opacity-90"
              />
              <h2 className="text-xl font-semibold text-ink dark:text-cream">Ainda não há profissionais disponíveis nesta área.</h2>
              <p className="mt-2 text-neutral-600 dark:text-cream-text max-w-md mx-auto">
                Explore as categorias disponíveis para encontrar um profissional.
              </p>
            </div>
          )}
        </div>
      </section>
    </MainLayout>
  );
}
