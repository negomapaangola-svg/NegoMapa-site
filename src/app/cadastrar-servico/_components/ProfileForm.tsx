'use client'

import * as React from 'react'
import { createProfile } from '@/lib/actions/servicos'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { FileUpload } from '@/components/ui/FileUpload'
import { useRouter } from 'next/navigation'

interface ProfileFormProps {
  initialData: { userId: string }
  categorias: { id: string; nome: string; slug: string }[]
}

export function ProfileForm({ initialData, categorias }: ProfileFormProps) {
  const router = useRouter()

  const [formData, setFormData] = React.useState({
    nome: '',
    telefone: '',
    whatsapp: '',
    bio: '',
    provincia: '',
    municipio: '',
    avatar_url: '',
  })

  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({})
  const [status, setStatus] = React.useState<'idle' | 'submitting' | 'success'>('idle')
  const [generalError, setGeneralError] = React.useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleAvatarUpload = (result: { url?: string; path?: string; error?: string }) => {
    if (result.url) {
      setFormData(prev => ({ ...prev, avatar_url: result.url! }))
    } else if (result.error) {
      setFieldErrors(prev => ({ ...prev, avatar: result.error! }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setGeneralError(null)

    const errors: Record<string, string> = {}
    if (!formData.nome.trim()) errors.nome = 'Nome é obrigatório'
    if (!formData.telefone.trim()) errors.telefone = 'Telefone é obrigatório'
    if (!formData.whatsapp.trim()) errors.whatsapp = 'WhatsApp é obrigatório'
    if (!formData.provincia.trim()) errors.provincia = 'Província é obrigatória'
    if (!formData.municipio.trim()) errors.municipio = 'Município é obrigatório'

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setStatus('submitting')
    setFieldErrors({})

    try {
      const result = await createProfile(formData)

      if (result.success) {
        setStatus('success')
        setTimeout(() => {
          router.refresh()
        }, 1500)
      } else {
        setStatus('idle')
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors)
        }
        setGeneralError(result.error || 'Erro ao criar perfil')
      }
    } catch {
      setStatus('idle')
      setGeneralError('Erro inesperado. Tente novamente.')
    }
  }

  return (
    <Card variant="liquid" padding="lg" className="border-card-border">
      <CardHeader>
        <CardTitle className="text-2xl">Dados do Profissional</CardTitle>
        <CardDescription>
          Estas informações serão visíveis publicamente no seu perfil.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form id="profile-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
          {generalError && (
            <div className="p-4 rounded-[4px] bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
              {generalError}
            </div>
          )}

          <div>
            <label htmlFor="avatar" className="block text-sm font-medium text-ink dark:text-cream mb-2">
              Avatar <span className="text-neutral-500 dark:text-neutral-400 text-normal">(opcional)</span>
            </label>
            <FileUpload
              bucket="profissionais-avatars"
              folder="avatars"
              accept="image/png,image/jpeg,image/webp"
              onUpload={handleAvatarUpload}
              label="Carregar avatar"
            />
            {fieldErrors.avatar && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors.avatar}</p>}
            {formData.avatar_url && (
              <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                Avatar selecionado. Será guardado ao submeter o formulário.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="nome" className="block text-sm font-medium text-ink dark:text-cream mb-2">
              Nome Completo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="nome"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              className={`w-full mt-1 px-3 py-2 border border-card-border rounded-[4px] shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-neutral-700 dark:text-cream ${fieldErrors.nome ? 'border-red-500' : ''}`}
              disabled={status === 'submitting'}
              required
            />
            {fieldErrors.nome && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors.nome}</p>}
          </div>

          <div>
            <label htmlFor="telefone" className="block text-sm font-medium text-ink dark:text-cream mb-2">
              Telefone <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              id="telefone"
              name="telefone"
              value={formData.telefone}
              onChange={handleChange}
              placeholder="(99) 99999-9999"
              className={`w-full mt-1 px-3 py-2 border border-card-border rounded-[4px] shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-neutral-700 dark:text-cream ${fieldErrors.telefone ? 'border-red-500' : ''}`}
              disabled={status === 'submitting'}
              required
            />
            {fieldErrors.telefone && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors.telefone}</p>}
          </div>

          <div>
            <label htmlFor="whatsapp" className="block text-sm font-medium text-ink dark:text-cream mb-2">
              WhatsApp <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              id="whatsapp"
              name="whatsapp"
              value={formData.whatsapp}
              onChange={handleChange}
              placeholder="(99) 99999-9999"
              className={`w-full mt-1 px-3 py-2 border border-card-border rounded-[4px] shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-neutral-700 dark:text-cream ${fieldErrors.whatsapp ? 'border-red-500' : ''}`}
              disabled={status === 'submitting'}
              required
            />
            {fieldErrors.whatsapp && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors.whatsapp}</p>}
          </div>

          <div>
            <label htmlFor="provincia" className="block text-sm font-medium text-ink dark:text-cream mb-2">
              Província <span className="text-red-500">*</span>
            </label>
            <select
              id="provincia"
              name="provincia"
              value={formData.provincia}
              onChange={handleChange}
              className={`w-full mt-1 px-3 py-2 border border-card-border rounded-[4px] shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-neutral-700 dark:text-cream ${fieldErrors.provincia ? 'border-red-500' : ''}`}
              disabled={status === 'submitting'}
              required
            >
              <option value="">Selecione a província</option>
              <option value="Luanda">Luanda</option>
              <option value="Bengo">Bengo</option>
              <option value="Benguela">Benguela</option>
              <option value="Bié">Bié</option>
              <option value="Cabinda">Cabinda</option>
              <option value="Cuando Cubango">Cuando Cubango</option>
              <option value="Cuanza Norte">Cuanza Norte</option>
              <option value="Cuanza Sul">Cuanza Sul</option>
              <option value="Cunene">Cunene</option>
              <option value="Huambo">Huambo</option>
              <option value="Huíla">Huíla</option>
              <option value="Lunda Norte">Lunda Norte</option>
              <option value="Lunda Sul">Lunda Sul</option>
              <option value="Malanje">Malanje</option>
              <option value="Moxico">Moxico</option>
              <option value="Namibe">Namibe</option>
              <option value="Uíge">Uíge</option>
              <option value="Zaire">Zaire</option>
            </select>
            {fieldErrors.provincia && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors.provincia}</p>}
          </div>

          <div>
            <label htmlFor="municipio" className="block text-sm font-medium text-ink dark:text-cream mb-2">
              Município <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="municipio"
              name="municipio"
              value={formData.municipio}
              onChange={handleChange}
              placeholder="Ex: Luanda, Viana, Cacuaco..."
              className={`w-full mt-1 px-3 py-2 border border-card-border rounded-[4px] shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-neutral-700 dark:text-cream ${fieldErrors.municipio ? 'border-red-500' : ''}`}
              disabled={status === 'submitting'}
              required
            />
            {fieldErrors.municipio && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors.municipio}</p>}
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-ink dark:text-cream mb-2">
              Bio / Descrição Profissional
            </label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={4}
              placeholder="Descreva a sua experiência, especialidades, formações..."
              className="w-full mt-1 px-3 py-2 border border-card-border rounded-[4px] shadow-sm resize-y focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-neutral-700 dark:text-cream"
              disabled={status === 'submitting'}
            />
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button
          type="submit"
          form="profile-form"
          disabled={status === 'submitting'}
          className="w-full sm:w-auto"
          size="lg"
        >
          {status === 'submitting' ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              A criar perfil...
            </>
          ) : status === 'success' ? (
            'Perfil criado! A redirecionar...'
          ) : (
            'Criar Perfil e Continuar'
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}