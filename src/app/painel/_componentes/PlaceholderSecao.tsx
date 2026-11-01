/** Conteúdo provisório de uma secção do painel. Sem dados reais. */
export function PlaceholderSecao({ titulo }: { titulo: string }) {
  return (
    <section className="rounded-xl bg-neutral-100 p-6">
      <h1 className="text-xl font-semibold text-neutral-900">{titulo}</h1>
      <p className="mt-2 text-sm text-neutral-600">Em breve. Esta secção ainda não tem conteúdo.</p>
    </section>
  )
}
