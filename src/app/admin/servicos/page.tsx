import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { isAdmin, getUser } from '@/lib/auth';
import { MainLayout } from '@/components/layout/MainLayout';
import { ServiceFilters } from './_components/ServiceFilters';
import { ServiceListClient } from './_components/ServiceListClient';

export const metadata: Metadata = {
  title: 'Administração de Serviços',
  description: 'Gerencie os serviços cadastrados no NegóMapa.',
};

interface ServiceRaw {
  id: string;
  slug: string;
  titulo: string;
  descricao: string | null;
  preco: number | null;
  preco_tipo: string | null;
  whatsapp: string | null;
  provincia: string | null;
  municipio: string | null;
  estado: string;
  created_at: string;
  categoria: {
    id: string;
    nome: string;
    slug: string;
  } | { id: string; nome: string; slug: string }[] | null;
  profissional: {
    id: string;
    nome: string;
    slug: string;
    whatsapp: string | null;
  } | { id: string; nome: string; slug: string; whatsapp: string | null }[] | null;
}

interface Service {
  id: string;
  slug: string;
  titulo: string;
  descricao: string | null;
  preco: number | null;
  preco_tipo: string | null;
  whatsapp: string | null;
  provincia: string | null;
  municipio: string | null;
  estado: string;
  created_at: string;
  categoria: {
    id: string;
    nome: string;
    slug: string;
  } | null;
  profissional: {
    id: string;
    nome: string;
    slug: string;
    whatsapp: string | null;
  } | null;
}

const SERVICES_PER_PAGE = 20;

type EstadoServico = 'pendente' | 'aprovado' | 'rejeitado' | 'suspenso' | '';

async function getServices(params: {
  q?: string;
  estado?: EstadoServico;
  page?: string;
}) {
  const supabase = await createSupabaseServerClient();

  const page = parseInt(params.page || '1', 10);
  const from = (page - 1) * SERVICES_PER_PAGE;
  const to = from + SERVICES_PER_PAGE - 1;

  let query = supabase
    .from('servicos')
    .select(`
      id,
      slug,
      titulo,
      descricao,
      preco,
      preco_tipo,
      whatsapp,
      provincia,
      municipio,
      estado,
      created_at,
      categoria:categoria_id (id, nome, slug),
      profissional:profissional_id (id, nome, slug, whatsapp)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (params.q) {
    query = query.or(`titulo.ilike.%${params.q}%,profissional_id.nome.ilike.%${params.q}%`);
  }

  if (params.estado) {
    query = query.eq('estado', params.estado);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('Erro ao buscar serviços:', error);
    return { services: [], total: 0 };
  }

  const rawData = data as ServiceRaw[];
  const services: Service[] = rawData.map((item) => ({
    ...item,
    categoria: Array.isArray(item.categoria) ? item.categoria[0] : item.categoria,
    profissional: Array.isArray(item.profissional) ? item.profissional[0] : item.profissional,
  }));

  return { services, total: count || 0 };
}

export default async function AdminServicosPage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<{
    q?: string;
    estado?: EstadoServico;
    page?: string;
  }>;
}) {
  const adminCheck = await isAdmin();

  if (!adminCheck) {
    const user = await getUser()
    if (!user) {
      redirect('/login?redirectTo=/admin/servicos')
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
    )
  }

  const searchParams = await searchParamsPromise;
  const page = parseInt(searchParams.page || '1', 10);
  const q = searchParams.q || '';
  const estadoRaw = searchParams.estado || '';
  const estado: EstadoServico = estadoRaw === '' ? '' : estadoRaw as EstadoServico;

  const { services, total } = await getServices({ q, estado, page: page.toString() });
  const totalPages = Math.ceil(total / SERVICES_PER_PAGE);

  const estados: { value: EstadoServico; label: string }[] = [
    { value: '', label: 'Todos os estados' },
    { value: 'pendente', label: 'Pendente' },
    { value: 'aprovado', label: 'Aprovado' },
    { value: 'rejeitado', label: 'Rejeitado' },
    { value: 'suspenso', label: 'Suspenso' },
  ];

  return (
    <MainLayout>
      <div className="min-h-screen bg-cream dark:bg-navy-dark">
        <header className="bg-navy dark:bg-navy-dark border-b border-card-border">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h1 className="text-2xl md:text-3xl font-heading font-bold text-cream">
                Administração de Serviços
              </h1>
              <a
                href="/servicos"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-navy dark:text-cream border border-card-border rounded-[4px] hover:bg-cream dark:hover:bg-navy-dark hover:border-orange-500 dark:hover:border-orange-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-dark"
              >
                Ver serviços públicos
              </a>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-8">
          <ServiceFilters
            initialSearchParams={{ q, estado }}
            estados={estados}
          />

          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-neutral-600 dark:text-cream-text" role="status" aria-live="polite">
              {total === 0
                ? 'Nenhum serviço encontrado'
                : `Exibindo ${services.length} de ${total} serviço${total !== 1 ? 's' : ''}`}
            </p>
          </div>

          <ServiceListClient
            initialServices={services}
            page={page}
            totalPages={totalPages}
            searchParams={{ q, estado, page: page.toString() }}
          />
        </main>
      </div>
    </MainLayout>
  );
}