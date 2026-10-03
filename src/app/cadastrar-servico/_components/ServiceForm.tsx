'use client'

import * as React from 'react'
import { useActionState } from 'react'
import { createService } from '@/lib/actions/servicos'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { useRouter } from 'next/navigation'

interface ServiceFormProps {
  categorias: { id: string; nome: string; slug: string }[]
}

const PRECO_TIPOS = [
  { value: 'fixo', label: 'Preço Fixo' },
  { value: 'a_partir_de', label: 'A Partir De' },
  { value: 'por_hora', label: 'Por Hora' },
  { value: 'sob_consulta', label: 'Sob Consulta' },
]

export function ServiceForm({ categorias }: ServiceFormProps) {
  const router = useRouter()

  const [formData, setFormData] = React.useState({
    titulo: '',
    categoria_id: '',
    descricao: '',
    preco: '',
    preco_tipo: '',
    whatsapp: '',
    provincia: '',
    municipio: '',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setGeneralError(null)

    const errors: Record<string, string> = {}
    if (!formData.titulo.trim()) errors.titulo = 'Título é obrigatório'
    if (!formData.categoria_id) errors.categoria_id = 'Categoria é obrigatória'
    if (!formData.descricao.trim()) errors.descricao = 'Descrição é obrigatória'
    if (!formData.preco_tipo) errors.preco_tipo = 'Tipo de preço é obrigatório'
    if (!formData.whatsapp.trim()) errors.whatsapp = 'WhatsApp é obrigatório'
    if (!formData.provincia.trim()) errors.provincia = 'Província é obrigatória'
    if (!formData.municipio.trim()) errors.municipio = 'Município é obrigatória'
    if (formData.preco && isNaN(Number(formData.preco))) errors.preco = 'Preço deve ser um número válido'

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setStatus('submitting')
    setFieldErrors({})

    try {
      const result = await createService(formData)

      if (result.success) {
        setStatus('success')
        setTimeout(() => {
          router.push('/servicos?cadastro=sucesso')
        }, 1500)
      } else {
        setStatus('idle')
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors)
        }
        setGeneralError(result.error || 'Erro ao criar serviço')
      }
    } catch {
      setStatus('idle')
      setGeneralError('Erro inesperado. Tente novamente.')
    }
  }

  return (
    <Card variant="liquid" padding="lg" className="border-card-border">
      <CardHeader>
        <CardTitle className="text-2xl">Detalhes do Serviço</CardTitle>
        <CardDescription>
          Preencha as informações do serviço. Ele ficará pendente de aprovação antes de ficar visível publicamente.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form id="service-form" onSubmit={handleSubmit} className="space-y-5" noValidate>
          {generalError && (
            <div className="p-4 rounded-[4px] bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
              {generalError}
            </div>
          )}

          <div>
            <label htmlFor="titulo" className="block text-sm font-medium text-ink dark:text-cream mb-2">
              Título do Serviço <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="titulo"
              name="titulo"
              value={formData.titulo}
              onChange={handleChange}
              placeholder="Ex: Instalação de Ar Condicionado, Design de Logótipos, Aulas de Matemática..."
              className={`w-full px-3 py-2 border border-card-border rounded-[4px] shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-neutral-700 dark:text-cream ${fieldErrors.titulo ? 'border-red-500' : ''}`}
              disabled={status === 'submitting'}
              required
              maxLength={100}
            />
            {fieldErrors.titulo && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors.titulo}</p>}
          </div>

          <div>
            <label htmlFor="categoria_id" className="block text-sm font-medium text-ink dark:text-cream mb-2">
              Categoria <span className="text-red-500">*</span>
            </label>
            <select
              id="categoria_id"
              name="categoria_id"
              value={formData.categoria_id}
              onChange={handleChange}
              className={`w-full px-3 py-2 border border-card-border rounded-[4px] shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-neutral-700 dark:text-cream ${fieldErrors.categoria_id ? 'border-red-500' : ''}`}
              disabled={status === 'submitting'}
              required
            >
              <option value="">Selecione a categoria</option>
              {categorias.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nome}</option>
              ))}
            </select>
            {fieldErrors.categoria_id && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors.categoria_id}</p>}
          </div>

          <div>
            <label htmlFor="descricao" className="block text-sm font-medium text-ink dark:text-cream mb-2">
              Descrição <span className="text-red-500">*</span>
            </label>
            <textarea
              id="descricao"
              name="descricao"
              value={formData.descricao}
              onChange={handleChange}
              rows={5}
              placeholder="Descreva o serviço em detalhe: o que inclui, metodologia, materiais, prazos, garantias..."
              className={`w-full px-3 py-2 border border-card-border rounded-[4px] shadow-sm resize-y focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-neutral-700 dark:text-cream ${fieldErrors.descricao ? 'border-red-500' : ''}`}
              disabled={status === 'submitting'}
              required
            />
            {fieldErrors.descricao && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors.descricao}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="preco" className="block text-sm font-medium text-ink dark:text-cream mb-2">
                Preço (opcional)
              </label>
              <input
                type="number"
                id="preco"
                name="preco"
                value={formData.preco}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
                min="0"
                className={`w-full px-3 py-2 border border-card-border rounded-[4px] shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-neutral-700 dark:text-cream ${fieldErrors.preco ? 'border-red-500' : ''}`}
                disabled={status === 'submitting'}
              />
              {fieldErrors.preco && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors.preco}</p>}
            </div>

            <div>
              <label htmlFor="preco_tipo" className="block text-sm font-medium text-ink dark:text-cream mb-2">
                Tipo de Preço <span className="text-red-500">*</span>
              </label>
              <select
                id="preco_tipo"
                name="preco_tipo"
                value={formData.preco_tipo}
                onChange={handleChange}
                className={`w-full px-3 py-2 border border-card-border rounded-[4px] shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-neutral-700 dark:text-cream ${fieldErrors.preco_tipo ? 'border-red-500' : ''}`}
                disabled={status === 'submitting'}
                required
              >
                <option value="">Selecione o tipo</option>
                {PRECO_TIPOS.map(tipo => (
                  <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                ))}
              </select>
              {fieldErrors.preco_tipo && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors.preco_tipo}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="whatsapp" className="block text-sm font-medium text-ink dark:text-cream mb-2">
              WhatsApp para Contacto <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              id="whatsapp"
              name="whatsapp"
              value={formData.whatsapp}
              onChange={handleChange}
              placeholder="(99) 99999-9999"
              className={`w-full px-3 py-2 border border-card-border rounded-[4px] shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-neutral-700 dark:text-cream ${fieldErrors.whatsapp ? 'border-red-500' : ''}`}
              disabled={status === 'submitting'}
              required
            />
            {fieldErrors.whatsapp && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors.whatsapp}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="provincia" className="block text-sm font-medium text-ink dark:text-cream mb-2">
                Província <span className="text-red-500">*</span>
              </label>
              <select
                id="provincia"
                name="provincia"
                value={formData.provincia}
                onChange={handleChange}
                className={`w-full px-3 py-2 border border-card-border rounded-[4px] shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-neutral-700 dark:text-cream ${fieldErrors.provincia ? 'border-red-500' : ''}`}
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
                className={`w-full px-3 py-2 border border-card-border rounded-[4px] shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-neutral-700 dark:text-cream ${fieldErrors.municipio ? 'border-red-500' : ''}`}
                disabled={status === 'submitting'}
                required
              />
              {fieldErrors.municipio && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors.municipio}</p>}
            </div>
          </div>

          <div className="p-4 rounded-[4px] bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
            <p className="text-sm text-orange-700 dark:text-orange-300">
              <strong>Importante:</strong> O serviço será criado com estado <strong>pendente</strong> e passará por revisão
              da equipa do NegóMapa antes de ficar visível publicamente. Não inclua dados sensíveis como passwords ou
              documentos pessoais na descrição.
            </p>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button
          type="submit"
          form="service-form"
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
              A cadastrar serviço...
            </>
          ) : status === 'success' ? (
            'Serviço cadastrado! A redirecionar...'
          ) : (
            'Cadastrar Serviço'
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}