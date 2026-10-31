import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { ProfileForm } from '@/app/cadastrar-servico/_components/ProfileForm'
import { getUserProfile, getActiveCategories } from '@/lib/actions/servicos'

export const metadata: Metadata = {
  title: 'Editar Perfil Profissional',
  description: 'Actualize os seus dados profissionais no NegóMapa.',
}

async function getCategories() {
  return await getActiveCategories()
}

async function getProfile() {
  return await getUserProfile()
}

export default async function EditarPerfilPage() {
  const supabase = await createSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirectTo=/editar-perfil')
  }

  const [profile, categorias] = await Promise.all([getProfile(), getCategories()])

  if (!profile) {
    redirect('/cadastrar-servico')
  }

  // motivo_rejeicao ainda não é devolvido por get_my_profissional_profile (ver relatório);
  // enquanto não for, o ecrã mostra o estado e um texto de contacto.
  const motivoRejeicao = (profile as { motivo_rejeicao?: string | null }).motivo_rejeicao ?? null

  return (
    <MainLayout>
      <div className="min-h-screen py-12 lg:py-16 bg-cream dark:bg-navy-dark">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-ink dark:text-cream">
              Editar Perfil Profissional
            </h1>
            <p className="mt-4 text-lg text-neutral-600 dark:text-cream-text">
              Actualize os seus dados e avatar.
            </p>
          </div>
          {profile.estado === 'pendente' && (
            <Card variant="default" padding="lg" className="border-card-border mb-6">
              <p className="text-neutral-700 dark:text-cream-text">
                O seu perfil está pendente de aprovação. Só fica visível ao público depois de ser aprovado.
              </p>
            </Card>
          )}
          {profile.estado === 'rejeitado' && (
            <Card variant="default" padding="lg" className="border-card-border mb-6">
              <p role="alert" className="font-semibold text-red-600 dark:text-red-400">
                O seu perfil foi rejeitado.
              </p>
              {motivoRejeicao ? (
                <p className="mt-2 text-neutral-700 dark:text-cream-text">Motivo: {motivoRejeicao}</p>
              ) : (
                <p className="mt-2 text-neutral-700 dark:text-cream-text">
                  Contacte a equipa do NegóMapa para saber o motivo.
                </p>
              )}
            </Card>
          )}
          <ProfileForm initialData={{ userId: user.id }} categorias={categorias} defaultData={profile} />
        </div>
      </div>
    </MainLayout>
  )
}