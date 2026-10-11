import { Metadata } from 'next';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Investimentos | NegóMapa',
  description: 'Explore oportunidades de investimento e crescimento em Angola.',
};

export default function InvestimentosPage() {
  return (
    <MainLayout>
      <section className="py-12 lg:py-20 bg-cream dark:bg-navy-dark" aria-labelledby="investimentos-title">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 id="investimentos-title" className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-ink dark:text-cream">
            Oportunidades de Investimento
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-neutral-600 dark:text-cream-text max-w-2xl mx-auto">
            Explore oportunidades de investimento e crescimento em Angola.
          </p>
          <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-sm font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
            </span>
            Em breve
          </div>
          <p className="mt-6 text-neutral-600 dark:text-cream-text">
            Estamos a preparar a área de investimentos da NegóMapa.
          </p>
          <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-left">
            <p className="text-sm text-yellow-800 dark:text-yellow-300 font-medium">
              Aviso de responsabilidade:
            </p>
            <p className="mt-2 text-sm text-yellow-700 dark:text-yellow-400">
              A NegóMapa não presta consultoria financeira, não garante rentabilidade e não é responsável por decisões de investimento. Avalie sempre os riscos e procure aconselhamento profissional.
            </p>
          </div>
          <div className="mt-10">
            <Button size="lg" asChild>
              <Link href="/login?redirectTo=/investimentos">Criar conta gratuita</Link>
            </Button>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}