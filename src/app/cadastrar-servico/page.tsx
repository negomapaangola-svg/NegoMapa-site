import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { ProfileForm } from './_components/ProfileForm'
import { ServiceForm } from './_components/ServiceForm'
import { getUserProfile, getActiveCategories } from '@/lib/actions/servicos'

export const metadata: Metadata = {
  title: 'Cadastrar Serviço',
  description: 'Crie o seu perfil profissional e cadastre os seus serviços no NegóMapa.',
}

async function getCategories() {
  return await getActiveCategories()
}

async function getProfile() {
  return await getUserProfile()
}

export default async function CadastrarServicoPage() {
  const supabase = await createSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const [profile, categorias] = await Promise.all([getProfile(), getCategories()])

  if (!profile) {
    return (
      <MainLayout>
        <ProfileFormPage userId={user.id} categorias={categorias} />
      </MainLayout>
    )
  }

  // Bloquear apenas perfil suspenso; permitir pendente e aprovado
  if (profile.estado === 'suspenso') {
    return (
      <MainLayout>
        <ProfileSuspendedPage profile={profile} />
      </MainLayout>
    )
  }

  // Perfil pendente ou aprovado pode cadastrar serviços
  return (
    <MainLayout>
      <ServiceFormPage categorias={categorias} profileEstado={profile.estado} />
    </MainLayout>
  )
}

function ProfileFormPage({ userId, categorias }: { userId: string; categorias: { id: string; nome: string; slug: string }[] }) {
  return (
    <div className="min-h-screen py-12 lg:py-16 bg-cream dark:bg-navy-dark">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-ink dark:text-cream">
            Criar Perfil Profissional
          </h1>
          <p className="mt-4 text-lg text-neutral-600 dark:text-cream-text">
            Preencha os seus dados para começar a oferecer serviços no NegóMapa.
          </p>
        </div>
        <ProfileForm initialData={{ userId }} categorias={categorias} />
      </div>
    </div>
  )
}

function ProfileSuspendedPage({ profile }: { profile: { estado: string; nome: string } }) {
  return (
    <div className="min-h-screen py-12 lg:py-16 bg-cream dark:bg-navy-dark">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <Card variant="liquid" padding="lg" className="border-card-border">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Perfil Suspenso</CardTitle>
            <CardDescription className="text-center">
              O seu perfil profissional <strong>{profile.nome}</strong> está suspenso.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-neutral-600 dark:text-cream-text mb-6">
              Não é possível cadastrar serviços enquanto o perfil estiver suspenso.
              Contacte o suporte do NegóMapa para mais informações.
            </p>
            <a
              href="/servicos"
              className="inline-flex items-center gap-2 px-4 py-2 border border-card-border rounded-[4px] bg-white text-ink dark:text-cream hover:bg-cream dark:hover:bg-navy-dark transition-colors"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Ver Serviços Disponíveis
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ServiceFormPage({ categorias, profileEstado }: { categorias: { id: string; nome: string; slug: string }[]; profileEstado: string }) {
  return (
    <div className="min-h-screen py-12 lg:py-16 bg-cream dark:bg-navy-dark">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-ink dark:text-cream">
            Cadastrar Novo Serviço
          </h1>
          <p className="mt-4 text-lg text-neutral-600 dark:text-cream-text">
            Preencha os detalhes do seu serviço. Ele ficará pendente de aprovação.
          </p>
          {profileEstado === 'pendente' && (
            <p className="mt-2 text-sm text-orange-600 dark:text-orange-400">
              O seu perfil está pendente de aprovação. O serviço será criado com estado pendente.
            </p>
          )}
        </div>
        <ServiceForm categorias={categorias} />
      </div>
    </div>
  )
}