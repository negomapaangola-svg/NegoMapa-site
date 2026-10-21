import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { isAdmin, getUser } from '@/lib/auth';
import { getAllVagasAdmin, type VagaAdminItem } from '@/lib/actions/vagas';
import { MainLayout } from '@/components/layout/MainLayout';
import { VagasListClient } from './_components/VagasListClient';

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Administração de Vagas',
  description: 'Gerencie as vagas de emprego no NegóMapa.',
};

type EstadoVaga = 'pendente' | 'aprovado' | 'rejeitado' | '';

async function getVagas(params: { estado?: EstadoVaga }) {
  const allVagas = await getAllVagasAdmin();

  let filtered = allVagas;
  if (params.estado) {
    filtered = allVagas.filter(v => v.estado === params.estado);
  }

  return filtered;
}

export default async function AdminVagasPage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<{
    estado?: EstadoVaga;
  }>;
}) {
  const adminCheck = await isAdmin();

  if (!adminCheck) {
    const user = await getUser();
    if (!user) {
      redirect('/login?redirectTo=/admin/vagas');
    }
    return (
      <MainLayout>
        <div className="min-h-screen p-8 bg-cream dark:bg-navy-dark flex items-center justify-center">
          <div className="max-w-md w-full bg-white rounded-[4px] p-8 shadow dark:bg-neutral-800 border border-card-border text-center">
            <h2 className="text-2xl font-bold text-center mb-4 text-ink dark:text-cream">
              Acesso Negado
            </h2>
            <p className="text-neutral-600 dark:text-cream-text mb-6">
              Você não tem privilégios de administrador para aceder a esta página.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 border border-card-border rounded-[4px] bg-white text-ink dark:text-cream hover:bg-cream dark:hover:bg-navy-dark transition-colors"
            >
              Voltar ao início
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  const searchParams = await searchParamsPromise;
  const estadoRaw = searchParams.estado || '';
  const estado: EstadoVaga = estadoRaw === '' ? '' : estadoRaw as EstadoVaga;

  const vagas = await getVagas({ estado });

  const estados: { value: EstadoVaga; label: string }[] = [
    { value: '', label: 'Todos os estados' },
    { value: 'pendente', label: 'Pendentes' },
    { value: 'aprovado', label: 'Aprovadas' },
    { value: 'rejeitado', label: 'Rejeitadas' },
  ];

  return (
    <MainLayout>
      <div className="min-h-screen bg-cream dark:bg-navy-dark">
        <header className="bg-navy dark:bg-navy-dark border-b border-card-border">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h1 className="text-2xl md:text-3xl font-heading font-bold text-cream">
                Administração de Vagas
              </h1>
              <a
                href="/vagas"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-navy dark:text-cream border border-card-border rounded-[4px] hover:bg-cream dark:hover:bg-navy-dark hover:border-orange-500 dark:hover:border-orange-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-dark"
              >
                Ver vagas públicas
              </a>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-ink dark:text-cream mb-3">Filtrar por estado</h2>
            <div className="flex flex-wrap gap-2">
              {estados.map((e) => (
                <Link
                  key={e.value}
                  href={`/admin/vagas${e.value ? `?estado=${e.value}` : ''}`}
                  className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-[4px] transition-colors ${
                    estado === e.value
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-white dark:bg-neutral-800 text-ink dark:text-cream border border-card-border hover:bg-cream dark:hover:bg-navy-dark'
                  }`}
                >
                  {e.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-neutral-600 dark:text-cream-text" role="status" aria-live="polite">
              {vagas.length === 0
                ? 'Nenhuma vaga encontrada'
                : `Total de ${vagas.length} vaga${vagas.length !== 1 ? 's' : ''}`}
            </p>
          </div>

          <VagasListClient
            initialVagas={vagas}
            currentEstadoFilter={estado}
          />
        </main>
      </div>
    </MainLayout>
  );
}