import { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'
import { MensagensPainel } from '@/components/mensagens/MensagensPainel'
import { listarConversas } from '@/lib/actions/conversas'

export const metadata: Metadata = {
  title: 'Mensagens | NegóMapa',
  description: 'Leia e responda às suas conversas na NegóMapa.',
}

/** Chat em ecrã completo: ocupa a altura da janela, com lista e conversa em painéis independentes. */
export default async function MensagensPage({
  searchParams,
}: {
  searchParams: Promise<{ conversa?: string }>
}) {
  const user = await getUser()
  if (!user) {
    redirect('/login?redirectTo=/mensagens')
  }

  const { conversa } = await searchParams
  const resultado = await listarConversas()

  return (
    <div className="flex h-dvh flex-col bg-cream dark:bg-navy-dark">
      <header className="flex items-center justify-between gap-3 border-b border-card-border bg-white/80 px-4 py-3 backdrop-blur dark:bg-neutral-900/80">
        <h1 className="text-lg font-bold text-ink dark:text-cream">Mensagens</h1>
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center rounded-[4px] px-3 text-sm font-semibold text-orange-600 hover:underline dark:text-orange-300"
        >
          Início
        </Link>
      </header>

      <main className="flex min-h-0 flex-1 flex-col p-0 md:p-4">
        {resultado.success ? (
          <div className="min-h-0 flex-1">
            <MensagensPainel
              conversas={resultado.data}
              userId={user.id}
              basePath="/mensagens"
              conversaInicial={conversa ?? null}
            />
          </div>
        ) : (
          <p role="alert" className="p-6 text-red-700 dark:text-red-300">{resultado.error}</p>
        )}
      </main>
    </div>
  )
}
