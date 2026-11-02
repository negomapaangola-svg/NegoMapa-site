import { ReactNode } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

interface PaginaLegalProps {
  titulo: string;
  descricao: string;
  atualizadoEm: string;
  children: ReactNode;
}

export function PaginaLegal({ titulo, descricao, atualizadoEm, children }: PaginaLegalProps) {
  return (
    <MainLayout>
      <section className="py-12 lg:py-16 bg-cream dark:bg-navy-dark">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Card variant="liquid" padding="lg">
            <CardHeader className="space-y-3">
              <CardTitle as="h1" className="text-3xl md:text-4xl">
                {titulo}
              </CardTitle>
              <p className="text-neutral-600 dark:text-cream-text/80">{descricao}</p>
              <p className="text-sm text-neutral-500 dark:text-cream-text/70">Última atualização: {atualizadoEm}</p>
            </CardHeader>
            <CardContent className="mt-6 space-y-8 text-neutral-700 dark:text-cream-text leading-relaxed">
              <div className="p-4 rounded-[4px] border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20 text-sm text-yellow-800 dark:text-yellow-300">
                Versão preliminar. Este texto está sujeito a revisão final pelo responsável da plataforma antes de ser considerado definitivo.
              </div>
              {children}
            </CardContent>
          </Card>
        </div>
      </section>
    </MainLayout>
  );
}

export function Seccao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold text-ink dark:text-cream">{titulo}</h2>
      {children}
    </section>
  );
}
