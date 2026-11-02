"use client"

import * as React from "react"
import { Card } from "@/components/ui/Card"
import { MultiStepForm } from "@/components/forms/multi-step/MultiStepForm"
import {
  buildEtapasProfissional,
  dadosVazios,
  type CategoriaOpcao,
  type DadosProfissional,
} from "./etapas"

export function CadastroProfissionalForm({ categorias }: { categorias: ReadonlyArray<CategoriaOpcao> }) {
  const [enviado, setEnviado] = React.useState(false)
  const etapas = React.useMemo(() => buildEtapasProfissional(categorias), [categorias])

  if (enviado) {
    return (
      <Card padding="lg" className="w-full max-w-2xl mx-auto">
        <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
          O seu cadastro foi enviado. Aguarde aprovação.
        </p>
      </Card>
    )
  }

  return (
    <>
      <h1 className="mb-6 font-heading text-3xl font-bold text-neutral-900 dark:text-neutral-50">
        Cadastro de Profissional
      </h1>
      <MultiStepForm<DadosProfissional>
        steps={etapas}
        initialData={dadosVazios}
        onSubmit={() => {
          // Só interface: não envia nem guarda dados nesta versão.
          setEnviado(true)
        }}
        submitLabel="Enviar para aprovação"
      />
    </>
  )
}
