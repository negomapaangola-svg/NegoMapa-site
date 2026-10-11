import { Metadata } from 'next';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Vagas de Emprego | NegóMapa',
  description: 'Descubra vagas publicadas por empresas aprovadas em Angola.',
};

export default function VagasPage() {
  return (
    <MainLayout>
      <section className="py-12 lg:py-20 bg-cream dark:bg-navy-dark" aria-labelledby="vagas-title">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 id="vagas-title" className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-ink dark:text-cream">
            Vagas de Emprego
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-neutral-600 dark:text-cream-text max-w-2xl mx-auto">
            Descubra vagas publicadas por empresas aprovadas em Angola.
          </p>
          <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-sm font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
            </span>
            Em breve
          </div>
          <p className="mt-6 text-neutral-600 dark:text-cream-text">
            Estamos a preparar a área de vagas de emprego da NegóMapa.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/login?redirectTo=/vagas">Criar conta gratuita</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/empresas">Ver empresas aprovadas</Link>
            </Button>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}