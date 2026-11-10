import Link from 'next/link';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/Card';

export default function ServicoNotFound() {
  return (
    <MainLayout>
      <section className="flex min-h-[60vh] items-center justify-center bg-cream px-4 py-16 dark:bg-navy-dark">
        <Card variant="liquid" padding="lg" className="w-full max-w-xl border border-white/60 text-center shadow-lg dark:border-white/10 sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-wider text-orange-700 dark:text-orange-300">Serviço indisponível</p>
          <h1 className="mt-3 text-2xl font-bold text-ink dark:text-cream sm:text-3xl">Não encontrámos este serviço</h1>
          <p className="mt-4 text-base leading-relaxed text-neutral-700 dark:text-cream-text">
            O serviço pode não existir, ter sido removido ou ainda não estar aprovado para publicação.
          </p>
          <Link
            href="/servicos"
            className="mt-7 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-orange-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
          >
            Explorar serviços
          </Link>
        </Card>
      </section>
    </MainLayout>
  );
}
