'use client'

import { useState } from 'react'
import { MultiStepForm } from '@/components/forms/multi-step/MultiStepForm'
import { TextField, CheckboxField } from '@/components/forms/multi-step/FormFields'
import type { StepDefinition } from '@/components/forms/multi-step/types'

/**
 * ECRÃ DE TESTE TEMPORÁRIO. Remover antes de qualquer merge.
 * Campos genéricos de demonstração; não são os cadastros reais.
 */
type DadosTeste = {
  nome: string
  email: string
  telefone: string
  whatsapp: string
  provincia: string
  municipio: string
  descricao: string
  aceitaTermos: boolean
}

const dadosIniciais: DadosTeste = {
  nome: '',
  email: '',
  telefone: '',
  whatsapp: '',
  provincia: '',
  municipio: '',
  descricao: '',
  aceitaTermos: false,
}

const etapas: ReadonlyArray<StepDefinition<DadosTeste>> = [
  {
    id: 'dados-basicos',
    title: 'Dados básicos',
    description: 'Demonstração: identificação.',
    requiredFields: ['nome', 'email'],
    render: ({ data, errors, setField }) => (
      <>
        <TextField id="nome" label="Nome" value={data.nome} onChange={(v) => setField('nome', v)} required error={errors.nome} />
        <TextField id="email" label="Email" type="email" value={data.email} onChange={(v) => setField('email', v)} required error={errors.email} />
      </>
    ),
  },
  {
    id: 'contacto',
    title: 'Contacto',
    description: 'Demonstração: telefone obrigatório, WhatsApp opcional.',
    requiredFields: ['telefone'],
    render: ({ data, errors, setField }) => (
      <>
        <TextField id="telefone" label="Telefone" type="tel" value={data.telefone} onChange={(v) => setField('telefone', v)} required error={errors.telefone} />
        <TextField id="whatsapp" label="WhatsApp" type="tel" value={data.whatsapp} onChange={(v) => setField('whatsapp', v)} hint="Opcional." />
      </>
    ),
  },
  {
    id: 'localizacao',
    title: 'Localização',
    description: 'Demonstração: província obrigatória, município opcional.',
    requiredFields: ['provincia'],
    render: ({ data, errors, setField }) => (
      <>
        <TextField id="provincia" label="Província" value={data.provincia} onChange={(v) => setField('provincia', v)} required error={errors.provincia} />
        <TextField id="municipio" label="Município" value={data.municipio} onChange={(v) => setField('municipio', v)} />
      </>
    ),
  },
  {
    id: 'descricao',
    title: 'Descrição',
    description: 'Demonstração: texto livre obrigatório.',
    requiredFields: ['descricao'],
    render: ({ data, errors, setField }) => (
      <TextField id="descricao" label="Descrição" value={data.descricao} onChange={(v) => setField('descricao', v)} required error={errors.descricao} />
    ),
  },
  {
    id: 'termos',
    title: 'Termos',
    description: 'Demonstração: caixa obrigatória.',
    requiredFields: ['aceitaTermos'],
    render: ({ data, errors, setField }) => (
      <CheckboxField id="aceitaTermos" label="Aceito os termos de demonstração" checked={data.aceitaTermos} onChange={(v) => setField('aceitaTermos', v)} required error={errors.aceitaTermos} />
    ),
  },
  {
    id: 'revisao',
    title: 'Revisão',
    description: 'Confirme os dados. Use "Voltar" para editar qualquer etapa; os dados mantêm-se.',
    requiredFields: [],
    render: ({ data }) => (
      <dl className="grid grid-cols-1 gap-3 text-base sm:grid-cols-2">
        {(
          [
            ['Nome', data.nome],
            ['Email', data.email],
            ['Telefone', data.telefone],
            ['WhatsApp', data.whatsapp],
            ['Província', data.provincia],
            ['Município', data.municipio],
            ['Descrição', data.descricao],
            ['Termos aceites', data.aceitaTermos ? 'Sim' : 'Não'],
          ] as const
        ).map(([rotulo, valor]) => (
          <div key={rotulo} className="flex flex-col">
            <dt className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">{rotulo}</dt>
            <dd className="text-neutral-900 dark:text-neutral-50">{valor || '—'}</dd>
          </div>
        ))}
      </dl>
    ),
  },
]

export function FormularioTesteClient() {
  const [resultado, setResultado] = useState<DadosTeste | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function handleSubmit(dados: DadosTeste) {
    setEnviando(true)
    // Sem gravação: apenas demonstra que os dados chegam completos ao fim.
    await new Promise((r) => setTimeout(r, 300))
    setResultado(dados)
    setEnviando(false)
  }

  if (resultado) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <p className="rounded-[4px] border border-green-600 bg-green-50 p-4 font-semibold text-green-800">
          Demonstração concluída. Nenhum dado foi gravado.
        </p>
        <button type="button" onClick={() => setResultado(null)} className="mt-4 underline">
          Reiniciar
        </button>
      </div>
    )
  }

  return (
    <MultiStepForm<DadosTeste>
      steps={etapas}
      initialData={dadosIniciais}
      onSubmit={handleSubmit}
      submitLabel="Concluir demonstração"
      submitting={enviando}
    />
  )
}
