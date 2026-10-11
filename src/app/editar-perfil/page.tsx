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
          <ProfileForm initialData={{ userId: user.id }} categorias={categorias} defaultData={profile} />
        </div>
      </div>
    </MainLayout>
  )
}