import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import Link from 'next/link';

export default function Home() {
  return (
    <MainLayout>
      <section className="relative py-20 lg:py-32 overflow-hidden" aria-labelledby="hero-title">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1
              id="hero-title"
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-ink dark:text-cream"
            >
              Tudo o que precisa para crescer em Angola
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-neutral-600 dark:text-cream-text max-w-2xl mx-auto">
              Encontre produtos e serviços, profissionais qualificados, vagas de emprego e oportunidades de investimento em Angola.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4 w-full max-w-5xl mx-auto">
              <Button size="lg" asChild className="flex-1 sm:flex-none min-w-[160px]">
                <Link href="/servicos">Produtos e Serviços</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="flex-1 sm:flex-none min-w-[160px]">
                <Link href="/profissionais">Profissionais</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="flex-1 sm:flex-none min-w-[160px]">
                <Link href="/vagas">Vagas de Emprego</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="flex-1 sm:flex-none min-w-[160px]">
                <Link href="/investimentos">Investimento</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-16" aria-labelledby="objectives-title">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 id="objectives-title" className="sr-only">Objectivos da NegóMapa</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" role="list" aria-label="Objectivos da plataforma">
            <Link href="/servicos" role="listitem">
              <Card variant="liquid" padding="lg" hover className="h-full">
                <CardHeader>
                  <CardTitle>Produtos e Serviços</CardTitle>
                  <CardDescription>Encontre empresas, produtos e serviços perto de si.</CardDescription>
                </CardHeader>
                <CardContent />
              </Card>
            </Link>
            <Link href="/profissionais" role="listitem">
              <Card variant="liquid" padding="lg" hover className="h-full">
                <CardHeader>
                  <CardTitle>Profissionais</CardTitle>
                  <CardDescription>Encontre profissionais qualificados para o que precisa.</CardDescription>
                </CardHeader>
                <CardContent />
              </Card>
            </Link>
            <Link href="/vagas" role="listitem">
              <Card variant="liquid" padding="lg" hover className="h-full">
                <CardHeader>
                  <CardTitle>Vagas de Emprego</CardTitle>
                  <CardDescription>Descubra vagas de emprego em todas as províncias de Angola.</CardDescription>
                </CardHeader>
                <CardContent />
              </Card>
            </Link>
            <Link href="/investimentos" role="listitem">
              <Card variant="liquid" padding="lg" hover className="h-full">
                <CardHeader>
                  <CardTitle>Investimento</CardTitle>
                  <CardDescription>Explore oportunidades de investimento e crescimento.</CardDescription>
                </CardHeader>
                <CardContent />
              </Card>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24" aria-labelledby="cta-title">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Card variant="liquid" padding="lg" className="max-w-3xl mx-auto text-center">
            <CardHeader>
              <CardTitle id="cta-title" className="text-2xl sm:text-3xl">
                Comece a usar a NegóMapa
              </CardTitle>
              <CardDescription>
                Encontre serviços, profissionais, vagas e oportunidades de investimento em Angola.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button size="lg" asChild>
                <Link href="/cadastrar-empresa">Começar grátis</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </MainLayout>
  );
}