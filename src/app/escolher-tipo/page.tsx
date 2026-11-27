import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getUser, isAdmin } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EscolhaTipoConta } from '@/components/perfil/EscolhaTipoConta'

export const metadata: Metadata = {
  title: 'Tipo de conta | NegóMapa',
  description: 'Veja os tipos de conta da NegóMapa e como mudar de cliente para profissional ou empresa.',
  robots: { index: false, follow: false },
}

const opcoes = [
  {
    tipo: 'cliente' as const,
    sigla: 'CL',
    titulo: 'Cliente',
    descricao: 'Cria conta directamente.',
    detalhe: 'Sem aprovação. Encontre serviços, profissionais, empresas e vagas.',
    cor: 'border-sky-200 bg-sky-50/60 dark:border-sky-900 dark:bg-sky-950/20',
  },
  {
    tipo: 'profissional' as const,
    sigla: 'PR',
    titulo: 'Profissional',
    descricao: 'Cadastro + aprovação administrativa.',
    detalhe: 'Apresente o seu trabalho, publique serviços e receba pedidos depois de aprovado.',
    cor: 'border-teal-200 bg-teal-50/60 dark:border-teal-900 dark:bg-teal-950/20',
  },
  {
    tipo: 'empresa' as const,
    sigla: 'EM',
    titulo: 'Empresa',
    descricao: 'Cadastro + aprovação administrativa.',
    detalhe: 'Crie o perfil público da empresa, publique vagas e produtos depois de aprovada.',
    cor: 'border-amber-200 bg-amber-50/60 dark:border-amber-900 dark:bg-amber-950/20',
  },
]

export default async function EscolherTipoPage() {
  if (await isAdmin()) redirect('/admin')
  const user = await getUser()
  if (!user) redirect('/login?redirectTo=/escolher-tipo')

  const supabase = await createSupabaseServerClient()
  const { data: perfil, error } = await supabase
    .from('profiles')
    .select('account_type')
    .eq('id', user.id)
    .maybeSingle()
  if (error) throw new Error('Não foi possível verificar o tipo de conta.')

  // Profissional e empresa já escolhidos: a página não se aplica.
  if (perfil?.account_type && perfil.account_type !== 'cliente') redirect('/perfil')

  const eCliente = perfil?.account_type === 'cliente'

  return (
    <MainLayout>
      <main id="main-content" className="min-h-[70vh] bg-cream px-4 py-12 dark:bg-navy-dark sm:py-16">
        <div className="mx-auto max-w-5xl">
          <header className="mx-auto mb-9 max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-600 dark:text-orange-300">Tipos de conta</p>
            <h1 className="mt-3 text-3xl font-bold text-ink dark:text-cream sm:text-4xl">
              {eCliente ? 'A sua conta é de cliente' : 'Escolha o tipo de conta'}
            </h1>
            <p className="mt-3 text-neutral-600 dark:text-cream-text">
              {eCliente
                ? 'A conta de cliente está activa. Se quer oferecer serviços ou uma empresa, pode pedir a mudança de tipo.'
                : 'A conta de cliente é criada directamente. Profissional e empresa passam por aprovação administrativa.'}
            </p>
          </header>

          <div className="grid gap-5 md:grid-cols-3">
            {opcoes.map((o) => (
              <Card key={o.tipo} variant="liquid" padding="md" className={'flex h-full flex-col border ' + o.cor}>
                <CardHeader>
                  <CardTitle as="h2" className="text-xl">{o.titulo}</CardTitle>
                  <CardDescription className="mt-1">{o.descricao}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto">
                  <p className="mb-5 text-sm text-neutral-700 dark:text-cream-text">{o.detalhe}</p>
                  {o.tipo === 'cliente' && !eCliente && (
                    <EscolhaTipoConta tipo="cliente" sigla={o.sigla} />
                  )}
                  {o.tipo === 'cliente' && eCliente && (
                    <p className="text-sm font-medium text-sky-800 dark:text-sky-200">A sua conta atual.</p>
                  )}
                  {o.tipo !== 'cliente' && eCliente && (
                    <Button asChild size="sm" fullWidth variant="outline">
                      <Link href={o.tipo === 'profissional' ? '/cadastrar-profissional' : '/cadastrar-empresa'}>
                        {o.tipo === 'profissional' ? 'Tornar-me profissional' : 'Tornar-me empresa'}
                      </Link>
                    </Button>
                  )}
                  {o.tipo !== 'cliente' && !eCliente && (
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Disponível para contas de cliente.</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="mt-7 text-center text-xs text-neutral-500 dark:text-neutral-400">
            Até à aprovação, a sua conta continua como cliente.
          </p>
        </div>
      </main>
    </MainLayout>
  )
}
