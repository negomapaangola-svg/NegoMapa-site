import { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { obterPerfilProfissionalDoUtilizador } from '@/lib/actions/profissional-painel'
import { listarPedidosDoProfissional } from '@/lib/actions/pedidos-profissional'
import { getMediaAvaliacoes } from '@/lib/actions/avaliacoes'

export const metadata: Metadata = {
  title: 'Painel do Profissional | NegóMapa',
  description: 'Resumo do seu perfil, pedidos, contactos e avaliações.',
}

export default async function ProfissionalPainelPage() {
  const user = await getUser()
  if (!user) {
    redirect('/login?redirectTo=/profissional/painel')
  }

  const perfil = await obterPerfilProfissionalDoUtilizador()

  if (!perfil) {
    return (
      <MainLayout>
        <section className="py-12 lg:py-16 bg-cream dark:bg-navy-dark">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <Card variant="liquid" padding="lg">
              <CardHeader className="space-y-2">
                <CardTitle as="h1" className="text-3xl md:text-4xl">Painel do Profissional</CardTitle>
                <p className="text-neutral-600 dark:text-cream-text/80">Ainda não tem um perfil de profissional. Conclua o registo para apresentar os seus serviços na NegóMapa.</p>
              </CardHeader>
              <CardContent className="mt-6">
                <Link href="/cadastrar-profissional" className="text-orange-500 dark:text-orange-400 underline">
                  Concluir registo do perfil
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>
      </MainLayout>
    )
  }

  if (perfil.estado !== 'aprovado') {
    return (
      <MainLayout>
        <section className="py-12 lg:py-16 bg-cream dark:bg-navy-dark">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <Card variant="liquid" padding="lg">
              <CardHeader className="space-y-2">
                <CardTitle as="h1" className="text-3xl md:text-4xl">Painel do Profissional</CardTitle>
                <p className="text-neutral-600 dark:text-cream-text/80">O seu perfil ainda não foi aprovado.</p>
              </CardHeader>
            </Card>
          </div>
        </section>
      </MainLayout>
    )
  }

  const [pedidos, avaliacoes] = await Promise.all([
    listarPedidosDoProfissional(),
    getMediaAvaliacoes({ tipo: 'profissional', id: perfil.id }),
  ])

  const totalPedidos = pedidos.success ? pedidos.data.length : 0
  const metricas = [
    { label: 'Visitas ao perfil', valor: 0, pendente: true },
    { label: 'Contactos recebidos', valor: 0, pendente: true },
    { label: 'Pedidos de serviço', valor: totalPedidos, pendente: false },
    { label: 'Avaliações recebidas', valor: avaliacoes.total, pendente: false },
  ]

  const atalhos = [
    { href: '/profissionais', label: 'Ver profissionais' },
    { href: '/editar-perfil', label: 'Perfil e portfólio' },
    { href: '/profissional/painel/pedidos', label: 'Pedidos' },
    { href: '/profissional/painel/mensagens', label: 'Mensagens' },
  ]

  return (
    <MainLayout>
      <section className="py-12 lg:py-16 bg-cream dark:bg-navy-dark">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <Card variant="liquid" padding="lg">
            <CardHeader className="space-y-2">
              <CardTitle as="h1" className="text-3xl md:text-4xl">Painel do Profissional</CardTitle>
              <p className="text-neutral-600 dark:text-cream-text/80">Resumo da sua atividade na NegóMapa.</p>
            </CardHeader>
            <CardContent className="mt-6 space-y-8">
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {metricas.map((metrica) => (
                  <div key={metrica.label} className="rounded-[4px] border border-neutral-200 dark:border-white/10 p-4">
                    <p className="text-2xl font-semibold text-neutral-900 dark:text-cream">{metrica.valor}</p>
                    <p className="mt-1 text-sm text-neutral-600 dark:text-cream-text/80">{metrica.label}</p>
                    {metrica.pendente && <p className="mt-1 text-xs text-neutral-500">Métrica pendente</p>}
                  </div>
                ))}
              </div>

              <div>
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-cream">Acesso rápido</h2>
                <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                  {atalhos.map((atalho) => (
                    <li key={atalho.href}>
                      <Link href={atalho.href} className="block rounded-[4px] border border-neutral-200 dark:border-white/10 p-4 text-neutral-800 dark:text-cream-text hover:border-orange-400">
                        {atalho.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </MainLayout>
  )
}
