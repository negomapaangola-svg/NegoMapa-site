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
              Encontre os melhores <span className="text-orange-500 dark:text-orange-400">serviços</span> e{' '}
              <span className="text-orange-500 dark:text-orange-400">empregos</span> em Angola
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-neutral-600 dark:text-cream-text max-w-2xl mx-auto">
              A plataforma que conecta profissionais qualificados a quem precisa.
              Rápido, seguro e feito para Angola.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/servicos">Procurar Serviços</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/empregos">Ver Vagas de Emprego</Link>
              </Button>
            </div>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6" role="list" aria-label="Principais funcionalidades">
            <Card variant="liquid" padding="lg" hover className="h-full">
              <CardHeader>
                <CardTitle>Para quem procura</CardTitle>
                <CardDescription>Encontre serviços e vagas perto de você</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-2" role="list">
                  <li className="flex items-center gap-2 text-sm text-neutral-600 dark:text-cream-text">
                    <svg className="h-5 w-5 text-orange-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Busca por localização e categoria
                  </li>
                  <li className="flex items-center gap-2 text-sm text-neutral-600 dark:text-cream-text">
                    <svg className="h-5 w-5 text-orange-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Avaliações e portfólios verificados
                  </li>
                  <li className="flex items-center gap-2 text-sm text-neutral-600 dark:text-cream-text">
                    <svg className="h-5 w-5 text-orange-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Contacto direto via WhatsApp
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card variant="liquid" padding="lg" hover className="h-full">
              <CardHeader>
                <CardTitle>Para profissionais</CardTitle>
                <CardDescription>Divulgue seu trabalho e encontre clientes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-2" role="list">
                  <li className="flex items-center gap-2 text-sm text-neutral-600 dark:text-cream-text">
                    <svg className="h-5 w-5 text-orange-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Perfil profissional completo
                  </li>
                  <li className="flex items-center gap-2 text-sm text-neutral-600 dark:text-cream-text">
                    <svg className="h-5 w-5 text-orange-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Receba pedidos na sua área
                  </li>
                  <li className="flex items-center gap-2 text-sm text-neutral-600 dark:text-cream-text">
                    <svg className="h-5 w-5 text-orange-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Construa sua reputação
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card variant="liquid" padding="lg" hover className="h-full">
              <CardHeader>
                <CardTitle>Para empresas</CardTitle>
                <CardDescription>Contrate talentos e anuncie vagas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-2" role="list">
                  <li className="flex items-center gap-2 text-sm text-neutral-600 dark:text-cream-text">
                    <svg className="h-5 w-5 text-orange-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Painel de gestão de vagas
                  </li>
                  <li className="flex items-center gap-2 text-sm text-neutral-600 dark:text-cream-text">
                    <svg className="h-5 w-5 text-orange-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Acesso a base de talentos
                  </li>
                  <li className="flex items-center gap-2 text-sm text-neutral-600 dark:text-cream-text">
                    <svg className="h-5 w-5 text-orange-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Relatórios e métricas
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24 bg-cream dark:bg-navy-dark" aria-labelledby="stats-title">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center" role="list" aria-label="Estatísticas da plataforma">
            <div role="listitem">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-orange-500 dark:text-orange-400" aria-label="Mais de 10 mil profissionais">10K+</div>
              <p className="mt-2 text-sm text-neutral-600 dark:text-cream-text">Profissionais ativos</p>
            </div>
            <div role="listitem">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-orange-500 dark:text-orange-400" aria-label="Mais de 5 mil vagas">5K+</div>
              <p className="mt-2 text-sm text-neutral-600 dark:text-cream-text">Vagas publicadas</p>
            </div>
            <div role="listitem">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-orange-500 dark:text-orange-400" aria-label="Mais de 50 categorias">50+</div>
              <p className="mt-2 text-sm text-neutral-600 dark:text-cream-text">Categorias de serviços</p>
            </div>
            <div role="listitem">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-orange-500 dark:text-orange-400" aria-label="18 províncias cobertas">18</div>
              <p className="mt-2 text-sm text-neutral-600 dark:text-cream-text">Províncias cobertas</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24" aria-labelledby="cta-title">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Card variant="liquid" padding="lg" className="max-w-3xl mx-auto text-center">
            <CardHeader>
              <CardTitle id="cta-title" className="text-2xl sm:text-3xl">
                Pronto para começar?
              </CardTitle>
              <CardDescription>
                Junte-se a milhares de angolanos que já usam a plataforma.
                Cadastre-se grátis em menos de 2 minutos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" asChild>
                  <Link href="/login?redirectTo=/cadastrar-empresa">Criar conta gratuita</Link>
                </Button>
                <Button variant="ghost" size="lg" asChild>
                  <Link href="/sobre">Saiba mais</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </MainLayout>
  );
}