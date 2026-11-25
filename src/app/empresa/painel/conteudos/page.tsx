import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getUserCompany } from '@/lib/actions/vagas'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { EliminarConteudoButton } from './_components/EliminarConteudoButton'

export const metadata: Metadata = {
  title: 'Serviços e produtos | Painel da Empresa | NegóMapa',
  description: 'Gerencie os serviços e produtos da sua empresa.',
}

export default async function ConteudosEmpresaPage({ searchParams }: { searchParams: Promise<{ empresa?: string }> }) {
  const { empresa } = await searchParams
  const company = await getUserCompany(empresa)

  if (!company) {
    redirect('/login?redirectTo=/empresa/painel/conteudos')
  }

  const supabase = await createSupabaseServerClient()
  const [servicosResult, produtosResult] = await Promise.all([
    supabase
      .from('servicos')
      .select('id, titulo, estado, created_at')
      .eq('company_id', company.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('produtos')
      .select('id, titulo, estado_aprovacao, criado_em')
      .eq('company_id', company.id)
      .order('criado_em', { ascending: false }),
  ])

  const servicos = servicosResult.data ?? []
  const produtos = produtosResult.data ?? []

  return (
    <MainLayout>
      <div className="p-4 md:p-8 bg-cream dark:bg-navy-dark">
        <div className="mx-auto max-w-4xl space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-ink dark:text-cream">Serviços e produtos</h1>
            <p className="mt-1 text-sm text-neutral-600 dark:text-cream-text">Empresa: {company.name}</p>
          </div>

          <Card variant="liquid" padding="lg">
            <CardHeader>
              <CardTitle as="h2">Serviços</CardTitle>
            </CardHeader>
            <CardContent>
              {servicos.length === 0 ? (
                <p className="text-sm text-neutral-600 dark:text-cream-text">Ainda não existem serviços registados.</p>
              ) : (
                <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {servicos.map((servico) => (
                    <li key={servico.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink dark:text-cream">{servico.titulo}</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">Estado: {servico.estado}</p>
                      </div>
                      <EliminarConteudoButton tipo="servico" id={servico.id} empresaId={company.id} />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card variant="liquid" padding="lg">
            <CardHeader>
              <CardTitle as="h2">Produtos</CardTitle>
            </CardHeader>
            <CardContent>
              {produtos.length === 0 ? (
                <p className="text-sm text-neutral-600 dark:text-cream-text">Ainda não existem produtos registados.</p>
              ) : (
                <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {produtos.map((produto) => (
                    <li key={produto.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink dark:text-cream">{produto.titulo}</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">Estado: {produto.estado_aprovacao}</p>
                      </div>
                      <EliminarConteudoButton tipo="produto" id={produto.id} empresaId={company.id} />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}
