/** Conteúdo provisório de uma secção do painel. Sem dados reais. */
export function PlaceholderSecao({ titulo }: { titulo: string }) {
  return (
    <section className="rounded-xl border border-[color:var(--painel-borda)] bg-[var(--painel-superficie)] p-6">
      <h1 className="text-xl font-semibold text-[color:var(--painel-texto)]">{titulo}</h1>
      <p className="mt-2 text-sm text-[color:var(--painel-texto-secundario)]">Em breve. Esta secção ainda não tem conteúdo.</p>
    </section>
  )
}
