import Link from 'next/link';
import { Button } from '@/components/ui/Button';

const ligacoes = [
  { href: '/servicos', label: 'Clientes' },
  { href: '/profissionais', label: 'Profissionais' },
  { href: '/empresas', label: 'Empresas' },
  { href: '/investimentos', label: 'Investidores' },
];

export function HomeHero() {
  return (
    <section className="relative overflow-hidden py-16 lg:py-24" aria-labelledby="hero-title">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <h1
            id="hero-title"
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-ink dark:text-cream"
          >
            Tudo o que precisa para crescer em Angola
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-neutral-600 dark:text-cream-text max-w-2xl mx-auto">
            A NegóMapa liga clientes, profissionais, empresas e investidores. Encontre serviços, vagas e oportunidades perto de si.
          </p>
          <ul className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto" aria-label="Ligações por perfil">
            {ligacoes.map((item) => (
              <li key={item.href}>
                <Button size="lg" variant="outline" asChild className="w-full">
                  <Link href={item.href}>{item.label}</Link>
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
