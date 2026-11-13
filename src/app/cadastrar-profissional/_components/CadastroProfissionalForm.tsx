"use client"

import * as React from "react"
import { Card } from "@/components/ui/Card"
import { MultiStepForm } from "@/components/forms/multi-step/MultiStepForm"
import { criarPerfilProfissional } from "@/lib/actions/profissional-painel"
import {
  buildEtapasProfissional,
  dadosVazios,
  type CategoriaOpcao,
  type DadosProfissional,
} from "./etapas"

export function CadastroProfissionalForm({ categorias }: { categorias: ReadonlyArray<CategoriaOpcao> }) {
  const [enviado, setEnviado] = React.useState(false)
  const [erro, setErro] = React.useState<string | null>(null)
  const [submitting, startTransition] = React.useTransition()
  const etapas = React.useMemo(() => buildEtapasProfissional(categorias), [categorias])

  if (enviado) {
    return (
      <Card padding="lg" className="w-full max-w-2xl mx-auto">
        <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
          O seu cadastro foi gravado e enviado para aprovação.
        </p>
      </Card>
    )
  }

  return (
    <>
      <h1 className="mb-6 font-heading text-3xl font-bold text-neutral-900 dark:text-neutral-50">
        Cadastro de Profissional
      </h1>
      {erro && <p role="alert" className="mb-4 rounded-[4px] border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">{erro}</p>}
      <MultiStepForm<DadosProfissional>
        steps={etapas}
        initialData={dadosVazios}
        submitting={submitting}
        onSubmit={(data) => {
          setErro(null)
          startTransition(async () => {
            const resultado = await criarPerfilProfissional({
              nome: data.nome,
              provincia: data.provincia,
              municipio: data.municipio,
              bairro: data.bairro,
              categoriaId: data.categoriaId,
              especialidades: data.especialidades,
              descricao: data.descricao,
              experiencia: data.experiencia,
              precoFaixa: data.precoFaixa,
              disponibilidade: data.disponibilidade,
              telefone: data.telefone,
              whatsapp: data.mesmoNumeroWhatsapp ? data.telefone : data.whatsapp,
            })
            if (resultado.success) setEnviado(true)
            else setErro(resultado.error ?? "Não foi possível guardar o cadastro. Tente novamente.")
          })
        }}
        submitLabel="Enviar para aprovação"
      />
    </>
  )
}
