import { Metadata } from 'next';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/MainLayout';
import { listarProfissionaisPublicos, obterProfissionaisContactoPorIds, type ProfissionalPublico } from '@/lib/actions/profissionais-publicos';
import { FiltrosProfissionais } from './_components/FiltrosProfissionais';
import { obterLocalizacaoCliente } from '@/lib/actions/perfil-pessoal';
import { ordenarPorDistanciaEAdministrativa } from '@/lib/localizacao/ordenar-resultados';
import { obterDistanciasAproximadas } from '@/lib/actions/proximidade';
import { PageHeader, SearchBar, FilterChips, SettingsSheet, ResultsHeader, ProfessionalCard } from '@/components/ui/CatalogComponents';
import { EmptyState } from '@/components/ui/EmptyState';

export const metadata: Metadata = {
  title: 'Profissionais | NegóMapa',
  description: 'Encontre profissionais qualificados por área, localização e experiência em Angola.',
};

type SearchParams = Promise<{ q?: string | string[]; categoria?: string | string[]; provincia?: string | string[] }>;
function valorParametro(valor: string | string[] | undefined): string {
  const bruto = Array.isArray(valor) ? valor[0] : valor;
  return (bruto ?? '').trim().slice(0, 100);
}
function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}
function listaUnica(valores: (string | null)[]): string[] {
  return [...new Set(valores.filter((v): v is string => !!v && v.trim().length > 0))].sort((a,b)=>a.localeCompare(b,'pt'));
}
function filtrarProfissionais(profissionais: ProfissionalPublico[], filtros: {q:string;categoria:string;provincia:string}) {
  const termo=normalizar(filtros.q);
  return profissionais.filter((p)=>{
    if(filtros.categoria && p.categoria!==filtros.categoria) return false;
    if(filtros.provincia && p.provincia!==filtros.provincia) return false;
    return !termo || normalizar([p.nome,p.categoria,p.provincia].filter(Boolean).join(' ')).includes(termo);
  });
}

export default async function ProfissionaisPage({ searchParams }: { searchParams: SearchParams }) {
  const params=await searchParams;
  const filtros={q:valorParametro(params.q),categoria:valorParametro(params.categoria),provincia:valorParametro(params.provincia)};
  const [todos,localizacao]=await Promise.all([listarProfissionaisPublicos(),obterLocalizacaoCliente()]);
  const filtrados=filtrarProfissionais(todos,filtros);
  const [distancias, contactos]=await Promise.all([
    obterDistanciasAproximadas('profissional',filtrados.map(p=>p.id)),
    obterProfissionaisContactoPorIds(filtrados.map(p=>p.id))
  ]);
  const profissionais=ordenarPorDistanciaEAdministrativa(filtrados.map(p=>({...p,distancia_km:distancias[p.id]??null})),localizacao);
  const categorias=listaUnica(todos.map(p=>p.categoria));
  const provincias=listaUnica(todos.map(p=>p.provincia));

  return <MainLayout>
    <section className="bg-cream py-12 dark:bg-navy-dark lg:py-16">
      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
        <PageHeader title="Profissionais" description="Encontre profissionais qualificados por área e localização em Angola." />
        <SearchBar action="/profissionais" defaultValue={filtros.q} placeholder="Nome, serviço ou província" />
        <FilterChips value={filtros.categoria} items={[
          {label:"Todas",value:"",href:`/profissionais?${new URLSearchParams({q:filtros.q,provincia:filtros.provincia})}`},
          ...categorias.map(c=>({label:c,value:c,href:`/profissionais?${new URLSearchParams({q:filtros.q,categoria:c,provincia:filtros.provincia})}`}))
        ]} />
        <SettingsSheet activeCount={[filtros.q, filtros.categoria, filtros.provincia].filter(Boolean).length}>
          <FiltrosProfissionais q={filtros.q} categoria={filtros.categoria} provincia={filtros.provincia} categorias={categorias} provincias={provincias} />
        </SettingsSheet>
        <ResultsHeader count={profissionais.length} label={profissionais.length===1?"profissional":"profissionais"} />
        {profissionais.length ? <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3" role="list" aria-label="Lista de profissionais">
          {profissionais.map((profissional)=>{
            const contacto=contactos.get(profissional.id);
            return <div key={profissional.id} role="listitem">
              <ProfessionalCard professional={{
                name:profissional.nome, service:profissional.categoria || "Serviço não indicado",
                location:[profissional.municipio,profissional.provincia].filter(Boolean).join(", "),
                href:`/profissional/${profissional.slug}`, avatar:contacto?.avatar_url,
                available:Boolean(contacto?.disponibilidade_dias?.length),
                availabilityLabel:contacto?.disponibilidade_dias?.length ? "Agenda disponível" : "Consultar disponibilidade",
                whatsapp:contacto?.whatsapp
              }} />
            </div>
          })}
        </div> : <EmptyState title={todos.length ? "Nenhum profissional encontrado com estes filtros." : "Ainda não há profissionais disponíveis nesta área."} description="Experimente alterar os critérios de pesquisa ou limpar os filtros." action={(filtros.q||filtros.categoria||filtros.provincia) ? <Link href="/profissionais" className="text-sm font-semibold text-orange-600 underline">Limpar filtros</Link> : undefined} />}
      </div>
    </section>
  </MainLayout>;
}
