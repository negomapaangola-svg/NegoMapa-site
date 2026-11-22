import Link from 'next/link'
import { MainLayout } from '@/components/layout/MainLayout'
import { isAdmin, getUser } from '@/lib/auth'
import { redirect } from 'next/navigation'

const links = [
  { href: '/conta', label: 'Visão geral' },
  { href: '/conta/perfil', label: 'Perfil' },
  { href: '/conta/conteudo', label: 'Conteúdo' },
  { href: '/conta/mensagens', label: 'Mensagens' },
  { href: '/conta/avaliacoes', label: 'Avaliações' },
  { href: '/conta/configuracoes', label: 'Configurações' },
]

export default async function ContaLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser()
  if (!user) redirect('/login?redirectTo=/conta')
  if (await isAdmin()) redirect('/admin')
  return <MainLayout hideGlobalSearch>
    <div className="min-h-[70vh] bg-slate-50 px-4 py-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:py-10">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">A minha conta</p>
          <nav aria-label="Navegação da conta" className="flex gap-1 overflow-x-auto lg:flex-col">
            {links.map(item => <Link key={item.href} href={item.href}
              className="inline-flex min-h-11 shrink-0 items-center rounded-xl px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:text-slate-200 dark:hover:bg-slate-800">
              {item.label}
            </Link>)}
          </nav>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  </MainLayout>
}
