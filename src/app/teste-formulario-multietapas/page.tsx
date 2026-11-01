import type { Metadata } from 'next'
import { MainLayout } from '@/components/layout/MainLayout'
import { FormularioTesteClient } from './_components/FormularioTesteClient'

// ECRÃ DE TESTE TEMPORÁRIO: não indexar e remover antes do merge.
export const metadata: Metadata = {
  title: 'Teste de formulário multi-etapas',
  robots: { index: false, follow: false },
}

export default function TesteFormularioMultietapasPage() {
  return (
    <MainLayout>
      <div className="px-4 py-10">
        <p className="mx-auto mb-6 max-w-2xl rounded-[4px] border border-orange-500 bg-orange-50 p-3 text-sm font-semibold text-orange-800 dark:bg-orange-950/30 dark:text-orange-200">
          Ecrã de teste temporário. Não é um cadastro real.
        </p>
        <FormularioTesteClient />
      </div>
    </MainLayout>
  )
}
