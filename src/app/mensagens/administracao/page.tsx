import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { MainLayout } from '@/components/layout/MainLayout'
import { getUser } from '@/lib/auth'
import { getMyAdminMessages } from '@/lib/actions/admin-foundation'
import { ContactAdminForm } from './_components/ContactAdminForm'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Contactar a administração | NegóMapa',
  description: 'Envie uma mensagem privada à equipa de administração.',
}

export default async function ContactAdministrationPage() {
  const user = await getUser()
  if (!user) redirect('/login?redirectTo=/mensagens/administracao')

  const messages = await getMyAdminMessages()

  return (
    <MainLayout>
      <main className="min-h-screen bg-cream px-4 py-8 dark:bg-navy-dark sm:px-6">
        <div className="mx-auto max-w-5xl">
          <header className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-600 dark:text-orange-400">Apoio</p>
            <h1 className="mt-2 text-3xl font-bold text-ink dark:text-cream">Contactar a administração</h1>
            <p className="mt-2 text-sm text-neutral-600 dark:text-cream-text/70">As mensagens e respostas ficam visíveis apenas para si e para a equipa administrativa.</p>
          </header>

          <section className="mb-10">
            <h2 className="mb-4 text-lg font-semibold text-ink dark:text-cream">Nova mensagem</h2>
            <ContactAdminForm />
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold text-ink dark:text-cream">Histórico</h2>
            {messages === null || messages.length === 0 ? (
              <p className="rounded-lg bg-neutral-50 px-4 py-6 text-sm text-neutral-600 dark:bg-neutral-900 dark:text-neutral-300">Ainda não existem mensagens.</p>
            ) : (
              <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {messages.map((message) => (
                  <article key={message.id} className="py-4 first:pt-0">
                    <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{message.subject}</h3>
                    <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{new Date(message.created_at).toLocaleString('pt-PT')} · {message.recipient_id ? 'Resposta da administração' : 'Mensagem enviada'}</p>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-neutral-700 dark:text-neutral-300">{message.body}</p>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </MainLayout>
  )
}
