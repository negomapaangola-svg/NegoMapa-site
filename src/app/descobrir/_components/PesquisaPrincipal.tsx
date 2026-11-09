'use client';

import { useState, useTransition, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EXEMPLOS_PESQUISA, hrefDescobrir, type ParamsDescobrir } from '@/lib/descobrir/params';

/** Pesquisa principal de /descobrir. Adaptada de HomeSearch, mas mantém os filtros da URL. */
export function PesquisaPrincipal({ params }: { params: ParamsDescobrir }) {
  const router = useRouter();
  const [termo, setTermo] = useState(params.q);
  const [, startTransition] = useTransition();

  function pesquisar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const href = hrefDescobrir(params, { q: termo.trim(), pagina: 1 });
    startTransition(() => router.push(href, { scroll: false }));
  }

  return (
    <section aria-labelledby="pesquisa-descobrir-titulo">
      <h2 id="pesquisa-descobrir-titulo" className="sr-only">
        Pesquisar serviços
      </h2>

      <form
        role="search"
        onSubmit={pesquisar}
        className="flex flex-col gap-2 rounded-2xl border border-card-border bg-white/80 p-2 shadow-sm backdrop-blur dark:bg-neutral-800/80 sm:flex-row"
      >
        <label htmlFor="pesquisa-descobrir" className="sr-only">
          O que procura hoje?
        </label>
        <input
          id="pesquisa-descobrir"
          type="search"
          value={termo}
          onChange={(event) => setTermo(event.target.value)}
          placeholder="O que procura hoje?"
          maxLength={100}
          className="min-h-[52px] min-w-0 flex-1 rounded-xl bg-transparent px-4 py-3 text-lg text-ink placeholder:text-neutral-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:text-cream dark:placeholder:text-cream-text/70"
        />
        <button
          type="submit"
          className="inline-flex min-h-[52px] items-center justify-center rounded-xl bg-orange-500 px-6 font-bold text-ink shadow-sm hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 sm:w-auto"
        >
          Pesquisar
        </button>
      </form>

      <div className="mt-3 flex flex-wrap gap-2" aria-label="Exemplos de pesquisa">
        {EXEMPLOS_PESQUISA.map((exemplo) => (
          <Link
            key={exemplo}
            href={hrefDescobrir(params, { q: exemplo, pagina: 1 })}
            className="inline-flex min-h-[44px] items-center rounded-full border border-card-border bg-white/70 px-4 text-sm text-ink hover:border-orange-500 hover:text-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:bg-neutral-800/70 dark:text-cream dark:hover:text-orange-300"
          >
            {exemplo}
          </Link>
        ))}
      </div>
    </section>
  );
}
