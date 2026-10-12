'use client'

import * as React from 'react'
import { createProfile, updateProfile } from '@/lib/actions/servicos'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { FileUpload } from '@/components/ui/FileUpload'
import { useRouter } from 'next/navigation'

interface ProfileData {
  nome: string
  telefone: string
  whatsapp: string
  bio: string
  provincia: string
  municipio: string
  avatar_url: string
  bi_numero: string
  anos_experiencia: number
  disponibilidade_dias: string[]
  disponibilidade_horarios: {
    manha: boolean
    tarde: boolean
    noite: boolean
  }
  portfolio: Array<{
    titulo: string
    descricao: string
    url_projeto: string
  }>
}

interface ProfileFormProps {
  initialData: { userId: string }
  categorias: { id: string; nome: string; slug: string }[]
  defaultData?: ProfileData | null
}

export function ProfileForm({ initialData, categorias, defaultData }: ProfileFormProps) {
  const router = useRouter()
  const isEditing = !!defaultData

  const [formData, setFormData] = React.useState<ProfileData>({
    nome: defaultData?.nome || '',
    telefone: defaultData?.telefone || '',
    whatsapp: defaultData?.whatsapp || '',
    bio: defaultData?.bio || '',
    provincia: defaultData?.provincia || '',
    municipio: defaultData?.municipio || '',
    avatar_url: defaultData?.avatar_url || '',
    bi_numero: defaultData?.bi_numero || '',
    anos_experiencia: defaultData?.anos_experiencia || 0,
    disponibilidade_dias: defaultData?.disponibilidade_dias || [],
    disponibilidade_horarios: defaultData?.disponibilidade_horarios || { manha: false, tarde: false, noite: false },
    portfolio: defaultData?.portfolio || [],
  })

  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({})
  const [status, setStatus] = React.useState<'idle' | 'submitting' | 'success'>('idle')
  const [generalError, setGeneralError] = React.useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement
      if (name.startsWith('disponibilidade_dias.')) {
        const day = name.split('.')[1]
        setFormData(prev => ({
          ...prev,
          disponibilidade_dias: checkbox.checked
            ? [...prev.disponibilidade_dias, day]
            : prev.disponibilidade_dias.filter(d => d !== day)
        }))
      } else if (name.startsWith('disponibilidade_horarios.')) {
        const horario = name.split('.')[1] as 'manha' | 'tarde' | 'noite'
        setFormData(prev => ({
          ...prev,
          disponibilidade_horarios: {
            ...prev.disponibilidade_horarios,
            [horario]: checkbox.checked
          }
        }))
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handlePortfolioAdd = () => {
    setFormData(prev => ({
      ...prev,
      portfolio: [...prev.portfolio, { titulo: '', descricao: '', url_projeto: '' }]
    }))
  }

  const handlePortfolioRemove = (index: number) => {
    setFormData(prev => ({
      ...prev,
      portfolio: prev.portfolio.filter((_, i) => i !== index)
    }))
  }

  const handlePortfolioChange = (index: number, field: 'titulo' | 'descricao' | 'url_projeto', value: string) => {
    setFormData(prev => ({
      ...prev,
      portfolio: prev.portfolio.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }))
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
    if (formData.anos_experiencia !== undefined && (formData.anos_experiencia < 0 || formData.anos_experiencia > 50)) {
      errors.anos_experiencia = 'Anos de experiência deve ser entre 0 e 50'
    }
    const validDays = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom']
    if (formData.disponibilidade_dias.some(d => !validDays.includes(d))) {
      errors.disponibilidade_dias = 'Dias de disponibilidade inválidos'
    }
    const horarios = formData.disponibilidade_horarios
    if (typeof horarios !== 'object' || horarios === null ||
        typeof horarios.manha !== 'boolean' || typeof horarios.tarde !== 'boolean' || typeof horarios.noite !== 'boolean') {
      errors.disponibilidade_horarios = 'Horários de disponibilidade inválidos'
    }
    formData.portfolio.forEach((item, index) => {
      if (!item.titulo || !item.titulo.trim()) {
        errors[`portfolio_${index}`] = `Item ${index + 1}: título é obrigatório`
      }
    })

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setStatus('submitting')
    setFieldErrors({})

    try {
      const action = isEditing ? updateProfile : createProfile
      const result = await action(formData)

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
        setGeneralError(result.error || (isEditing ? 'Erro ao actualizar perfil' : 'Erro ao criar perfil'))
      }
    } catch {
      setStatus('idle')
      setGeneralError('Erro inesperado. Tente novamente.')
    }
  }

  return (
    <Card variant="liquid" padding="lg" className="border-card-border">
      <CardHeader>
        <CardTitle className="text-2xl">{isEditing ? 'Editar Perfil Profissional' : 'Dados do Profissional'}</CardTitle>
        <CardDescription>
          {isEditing
            ? 'Actualize os seus dados. As alterações serão visíveis publicamente.'
            : 'Estas informações serão visíveis publicamente no seu perfil.'}
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
              label={isEditing ? 'Actualizar avatar' : 'Carregar avatar'}
              currentUrl={isEditing ? defaultData?.avatar_url || '' : ''}
            />
            {fieldErrors.avatar && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors.avatar}</p>}
            {formData.avatar_url && (
              <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                {isEditing ? 'Novo avatar selecionado. Será guardado ao submeter.' : 'Avatar selecionado. Será guardado ao submeter o formulário.'}
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

            <div>
              <label htmlFor="bi_numero" className="block text-sm font-medium text-ink dark:text-cream mb-2">
                BI (Bilhete de Identidade)
              </label>
              <input
                type="text"
                id="bi_numero"
                name="bi_numero"
                value={formData.bi_numero}
                onChange={handleChange}
                placeholder="Ex: 123456789LA045"
                className={`w-full mt-1 px-3 py-2 border border-card-border rounded-[4px] shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-neutral-700 dark:text-cream ${fieldErrors.bi_numero ? 'border-red-500' : ''}`}
                disabled={status === 'submitting'}
              />
              {fieldErrors.bi_numero && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors.bi_numero}</p>}
            </div>

            <div>
              <label htmlFor="anos_experiencia" className="block text-sm font-medium text-ink dark:text-cream mb-2">
                Anos de Experiência
              </label>
              <input
                type="number"
                id="anos_experiencia"
                name="anos_experiencia"
                value={formData.anos_experiencia}
                onChange={handleChange}
                min={0}
                max={50}
                className={`w-full mt-1 px-3 py-2 border border-card-border rounded-[4px] shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-neutral-700 dark:text-cream ${fieldErrors.anos_experiencia ? 'border-red-500' : ''}`}
                disabled={status === 'submitting'}
              />
              {fieldErrors.anos_experiencia && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors.anos_experiencia}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-ink dark:text-cream mb-2">
                Dias de Disponibilidade
              </label>
              <div className="flex flex-wrap gap-3 mt-1">
                {['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'].map(day => (
                  <label key={day} className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name={`disponibilidade_dias.${day}`}
                      checked={formData.disponibilidade_dias.includes(day)}
                      onChange={handleChange}
                      className="w-4 h-4 rounded border-card-border text-orange-500 focus:ring-orange-500"
                    />
                    <span className="text-sm text-ink dark:text-cream capitalize">{day === 'seg' ? 'Segunda' : day === 'ter' ? 'Terça' : day === 'qua' ? 'Quarta' : day === 'qui' ? 'Quinta' : day === 'sex' ? 'Sexta' : day === 'sab' ? 'Sábado' : 'Domingo'}</span>
                  </label>
                ))}
              </div>
              {fieldErrors.disponibilidade_dias && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors.disponibilidade_dias}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-ink dark:text-cream mb-2">
                Horários de Disponibilidade
              </label>
              <div className="flex flex-wrap gap-3 mt-1">
                {[
                  { key: 'manha', label: 'Manhã' },
                  { key: 'tarde', label: 'Tarde' },
                  { key: 'noite', label: 'Noite' },
                ].map(horario => (
                  <label key={horario.key} className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name={`disponibilidade_horarios.${horario.key}`}
                      checked={formData.disponibilidade_horarios[horario.key as 'manha' | 'tarde' | 'noite']}
                      onChange={handleChange}
                      className="w-4 h-4 rounded border-card-border text-orange-500 focus:ring-orange-500"
                    />
                    <span className="text-sm text-ink dark:text-cream">{horario.label}</span>
                  </label>
                ))}
              </div>
              {fieldErrors.disponibilidade_horarios && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors.disponibilidade_horarios}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-ink dark:text-cream">
                  Portfolio
                </label>
                <button
                  type="button"
                  onClick={handlePortfolioAdd}
                  className="text-sm text-orange-500 hover:underline"
                  disabled={status === 'submitting'}
                >
                  + Adicionar item
                </button>
              </div>
              <div className="space-y-3 mt-1">
                {formData.portfolio.map((item, index) => (
                  <div key={index} className="border border-card-border rounded-[4px] p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-ink dark:text-cream">Item {index + 1}</span>
                      <button
                        type="button"
                        onClick={() => handlePortfolioRemove(index)}
                        className="text-red-500 hover:underline text-sm"
                        disabled={status === 'submitting'}
                      >
                        Remover
                      </button>
                    </div>
                    <div>
                      <label htmlFor={`portfolio_${index}_titulo`} className="block text-xs font-medium text-ink dark:text-cream mb-1">
                        Título *
                      </label>
                      <input
                        type="text"
                        id={`portfolio_${index}_titulo`}
                        name={`portfolio_${index}_titulo`}
                        value={item.titulo}
                        onChange={(e) => handlePortfolioChange(index, 'titulo', e.target.value)}
                        className={`w-full px-2 py-1.5 border border-card-border rounded-[4px] shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-neutral-700 dark:text-cream ${fieldErrors[`portfolio_${index}`] ? 'border-red-500' : ''}`}
                        disabled={status === 'submitting'}
                        required
                      />
                      {fieldErrors[`portfolio_${index}`] && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors[`portfolio_${index}`]}</p>}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div>
                        <label htmlFor={`portfolio_${index}_descricao`} className="block text-xs font-medium text-ink dark:text-cream mb-1">
                          Descrição
                        </label>
                        <textarea
                          id={`portfolio_${index}_descricao`}
                          name={`portfolio_${index}_descricao`}
                          value={item.descricao}
                          onChange={(e) => handlePortfolioChange(index, 'descricao', e.target.value)}
                          rows={2}
                          className="w-full px-2 py-1.5 border border-card-border rounded-[4px] shadow-sm resize-y focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-neutral-700 dark:text-cream"
                          disabled={status === 'submitting'}
                        />
                      </div>
                      <div>
                        <label htmlFor={`portfolio_${index}_url_projeto`} className="block text-xs font-medium text-ink dark:text-cream mb-1">
                          URL do Projeto
                        </label>
                        <input
                          type="url"
                          id={`portfolio_${index}_url_projeto`}
                          name={`portfolio_${index}_url_projeto`}
                          value={item.url_projeto}
                          onChange={(e) => handlePortfolioChange(index, 'url_projeto', e.target.value)}
                          placeholder="https://..."
                          className="w-full px-2 py-1.5 border border-card-border rounded-[4px] shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-neutral-700 dark:text-cream"
                          disabled={status === 'submitting'}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
              {isEditing ? 'A actualizar...' : 'A criar perfil...'}
            </>
          ) : status === 'success' ? (
            isEditing ? 'Perfil actualizado!' : 'Perfil criado! A redirecionar...'
          ) : (
            isEditing ? 'Actualizar Perfil' : 'Criar Perfil e Continuar'
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}