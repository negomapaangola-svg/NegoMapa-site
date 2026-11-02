import { Metadata } from 'next';
import { MainLayout } from '@/components/layout/MainLayout';
import { listarProfissionaisPublicos } from '@/lib/actions/profissionais-publicos';
import { ProfissionalCard } from './_components/ProfissionalCard';

export const metadata: Metadata = {
  title: 'Profissionais | NegóMapa',
  description: 'Encontre profissionais qualificados por área, localização e experiência em Angola.',
};

export default async function ProfissionaisPage() {
  const profissionais = await listarProfissionaisPublicos();

  return (
    <MainLayout>
      <section className="py-16 lg:py-24 bg-cream dark:bg-navy-dark" aria-labelledby="profissionais-title">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h1 id="profissionais-title" className="text-4xl sm:text-5xl font-bold tracking-tight text-ink dark:text-cream">
              Profissionais
            </h1>
            <p className="mt-4 text-lg text-neutral-600 dark:text-cream-text">
              Encontre profissionais qualificados por área e localização em Angola.
            </p>
          </div>

          {profissionais.length > 0 ? (
            <>
              <p className="mb-4 text-sm text-neutral-600 dark:text-cream-text" role="status" aria-live="polite">
                {`${profissionais.length} profissional${profissionais.length !== 1 ? 'is' : ''}`}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" role="list" aria-label="Lista de profissionais">
                {profissionais.map((profissional) => (
                  <div key={profissional.id} role="listitem">
                    <ProfissionalCard profissional={profissional} />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-16" role="status">
              <h2 className="text-xl font-semibold text-ink dark:text-cream">Nenhum profissional disponível</h2>
              <p className="mt-2 text-neutral-600 dark:text-cream-text max-w-md mx-auto">
                Volte mais tarde para ver novos profissionais.
              </p>
            </div>
          )}
        </div>
      </section>
    </MainLayout>
  );
}
