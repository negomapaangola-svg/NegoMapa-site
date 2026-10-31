import { MainLayout } from '@/components/layout/MainLayout';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getVagasPublicas } from '@/lib/actions/vagas-public';
import { HomeHero } from '@/components/home/HomeHero';
import { HomeSearch } from '@/components/home/HomeSearch';
import { HomeCategorias, type CategoriaHome, type ServicoHome } from '@/components/home/HomeCategorias';
import { HomeProfissionais, type ProfissionalHome } from '@/components/home/HomeProfissionais';
import { HomeEmpresas, type EmpresaHome } from '@/components/home/HomeEmpresas';
import { HomeVagas, type VagaHome } from '@/components/home/HomeVagas';
import { HomeInvestimentos } from '@/components/home/HomeInvestimentos';
import { HomeCtaFinal } from '@/components/home/HomeCtaFinal';
import { HomeStyles } from '@/components/home/HomeStyles';
import type { Perfil } from '@/components/home/constants';

export const dynamic = 'force-dynamic';

type Erros = { categorias: boolean; servicos: boolean; profissionais: boolean; empresas: boolean; vagas: boolean };

/**
 * Carrega apenas dados já existentes e permitidos por RLS para o perfil atual.
 * Colunas escolhidas respeitam os GRANTs de coluna de `anon`/`authenticated`
 * (ex.: `companies` não expõe `created_at` nem `logo_url` ao anon).
 */
async function carregarHome() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  let perfil: Perfil = 'visitante';
  if (user) {
    const [prof, emp] = await Promise.all([
      supabase.from('profissionais').select('id').eq('user_id', user.id).maybeSingle(),
      supabase.from('companies').select('id').eq('user_id', user.id).maybeSingle(),
    ]);
    if (prof.data) perfil = 'profissional';
    else if (emp.data) perfil = 'empresa';
  }

  const [categorias, servicos, profissionais, empresas] = await Promise.all([
    supabase.from('categorias').select('id, nome, slug').eq('ativo', true).order('nome').limit(12),
    supabase
      .from('servicos')
      .select('id, titulo, slug, preco, preco_tipo, provincia, municipio')
      .eq('estado', 'aprovado')
      .order('created_at', { ascending: false })
      .limit(6),
    supabase
      .from('profissionais')
      .select('id, nome, slug, provincia, municipio, anos_experiencia, avatar_url')
      .eq('estado', 'aprovado')
      .order('created_at', { ascending: false })
      .limit(6),
    supabase
      .from('companies')
      .select('id, name, slug, sector, province, city')
      .eq('is_approved', true)
      .order('name')
      .limit(6),
  ]);

  // Vagas só são carregadas para profissionais autenticados (regra de acesso).
  const vagasResult = perfil === 'profissional' ? await getVagasPublicas() : null;

  const erros: Erros = {
    categorias: !!categorias.error,
    servicos: !!servicos.error,
    profissionais: !!profissionais.error,
    empresas: !!empresas.error,
    vagas: vagasResult ? !vagasResult.success : false,
  };

  return {
    perfil,
    categorias: (categorias.data ?? []) as CategoriaHome[],
    servicos: (servicos.data ?? []) as ServicoHome[],
    profissionais: (profissionais.data ?? []) as ProfissionalHome[],
    empresas: (empresas.data ?? []) as EmpresaHome[],
    vagas: (vagasResult && vagasResult.success ? vagasResult.data.slice(0, 3) : []) as VagaHome[],
    erros,
  };
}

export default async function Home() {
  const dados = await carregarHome();

  return (
    <MainLayout>
      <div className="nm-home">
        <HomeStyles />
        <div className="nm-wrap">
          <HomeHero>
            <HomeSearch />
          </HomeHero>
          <HomeCategorias
            categorias={dados.categorias}
            servicos={dados.servicos}
            erroCategorias={dados.erros.categorias}
            erroServicos={dados.erros.servicos}
          />
          <HomeProfissionais profissionais={dados.profissionais} erro={dados.erros.profissionais} />
          <HomeEmpresas empresas={dados.empresas} erro={dados.erros.empresas} />
          <HomeVagas perfil={dados.perfil} vagas={dados.vagas} erro={dados.erros.vagas} />
          <HomeInvestimentos perfil={dados.perfil} />
          <HomeCtaFinal perfil={dados.perfil} />
        </div>
      </div>
    </MainLayout>
  );
}
