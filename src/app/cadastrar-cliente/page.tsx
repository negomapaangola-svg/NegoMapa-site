import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card } from '@/components/ui/Card'
import { LocalizacaoPreferenciasForm } from '@/components/perfil/LocalizacaoPreferenciasForm'
import { getUser, isAdmin } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export const metadata: Metadata = {
  title: 'Completar perfil de cliente | NegóMapa',
  description: 'Indique a sua localização e preferências de serviços.',
  robots: { index: false, follow: false },
}

/**
 * Conclusão do perfil de cliente. Não substitui /registar: a conta de cliente já existe e está activa.
 * Não altera profiles.account_type nem exige aprovação.
 */
export default async function CadastrarClientePage() {
  if (await isAdmin()) redirect('/admin')

  const user = await getUser()
  if (!user) redirect('/login?redirectTo=/cadastrar-cliente')

  const supabase = await createSupabaseServerClient()
  const { data: perfil, error } = await supabase
    .from('profiles')
    .select('account_type,is_active,localizacao_provincia,localizacao_municipio,localizacao_bairro,latitude_aproximada,longitude_aproximada,consentimento_localizacao,consentimento_actualizado_em')
    .eq('id', user.id)
    .maybeSingle()

  if (error) throw new Error('Não foi possível carregar o perfil de cliente.')
  // Só contas de cliente usam esta página; outros tipos seguem para o seu perfil.
  if (!perfil || perfil.account_type !== 'cliente') redirect('/conta/perfil')
  if (perfil.is_active !== true) redirect('/conta')

  const [{ data: categorias }, { data: preferencias }] = await Promise.all([
    supabase.from('categorias').select('id,nome').eq('ativo', true).order('nome'),
    supabase.from('preferencias_cliente').select('categoria_id').eq('user_id', user.id),
  ])

  return (
    <MainLayout>
      <section className="bg-cream py-12 dark:bg-navy-dark lg:py-16">
        <div className="mx-auto max-w-3xl space-y-6 px-4 sm:px-6 lg:px-8">
          <header>
            <h1 className="text-3xl font-bold text-ink dark:text-cream">Complete o seu perfil de cliente</h1>
            <p className="mt-3 text-neutral-600 dark:text-cream-text">
              A sua conta de cliente já está activa e não precisa de aprovação. Indique a sua província para encontrar serviços e vagas perto de si.
              As preferências de serviços são opcionais.
            </p>
          </header>
          <Card variant="liquid" padding="lg">
            <LocalizacaoPreferenciasForm
              provinciaInicial={perfil.localizacao_provincia ?? ''}
              municipioInicial={perfil.localizacao_municipio ?? ''}
              bairroInicial={perfil.localizacao_bairro ?? ''}
              latitudeInicial={perfil.latitude_aproximada ?? null}
              longitudeInicial={perfil.longitude_aproximada ?? null}
              consentimento={perfil.consentimento_localizacao === true}
              consentimentoActualizadoEm={perfil.consentimento_actualizado_em ?? null}
              categorias={categorias ?? []}
              preferenciasIniciais={(preferencias ?? []).map((p) => p.categoria_id)}
              obrigatoria
            />
          </Card>
        </div>
      </section>
    </MainLayout>
  )
}
