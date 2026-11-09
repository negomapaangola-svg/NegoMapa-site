import { PROVINCIAS } from '@/components/home/constants';

export type TipoDescobrir = 'servicos' | 'produtos';

export type ParamsDescobrir = {
  tipo: TipoDescobrir;
  q: string;
  categoria: string;
  provincia: string;
  municipio: string;
  preco: string;
  avaliacao: string;
  estado_produto: string;
  entrega: string;
  pagina: number;
};

export type SearchParamsRaw = Record<string, string | string[] | undefined>;

export const OPCOES_PRECO = [
  { valor: '', rotulo: 'Qualquer preço' },
  { valor: 'ate-50000', rotulo: 'Até 50 000 Kz' },
  { valor: '50000-200000', rotulo: '50 000 – 200 000 Kz' },
  { valor: 'acima-200000', rotulo: 'Acima de 200 000 Kz' },
  { valor: 'sob-consulta', rotulo: 'Sob consulta' },
] as const;

export const OPCOES_AVALIACAO = [
  { valor: '', rotulo: 'Qualquer avaliação' },
  { valor: '4', rotulo: '4 estrelas ou mais' },
  { valor: '3', rotulo: '3 estrelas ou mais' },
] as const;

export const OPCOES_ESTADO_PRODUTO = [
  { valor: '', rotulo: 'Novo ou usado' },
  { valor: 'novo', rotulo: 'Novo' },
  { valor: 'usado', rotulo: 'Usado' },
] as const;

export const OPCOES_ENTREGA = [
  { valor: '', rotulo: 'Qualquer entrega' },
  { valor: 'gratuita', rotulo: 'Entrega gratuita' },
  { valor: 'paga', rotulo: 'Entrega paga' },
  { valor: 'a_combinar', rotulo: 'A combinar' },
] as const;

export const EXEMPLOS_PESQUISA = [
  'Electricista',
  'Costureira',
  'Mecânico',
  'Canalizador',
  'Pintor',
  'Técnico de informática',
] as const;

export const EXEMPLOS_PESQUISA_PRODUTOS = [
  'Móveis',
  'Televisor',
  'Gerador',
  'Telemóvel',
  'Roupa',
  'Computador',
] as const;

function valorUnico(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v) ?? '';
}

function opcaoValida(valor: string, opcoes: readonly { valor: string }[]): string {
  return opcoes.some((o) => o.valor === valor) ? valor : '';
}

export function lerParametros(raw: SearchParamsRaw): ParamsDescobrir {
  const q = valorUnico(raw.q).replace(/\s+/g, ' ').trim().slice(0, 100);
  const provinciaBruta = valorUnico(raw.provincia);
  const provincia = (PROVINCIAS as readonly string[]).includes(provinciaBruta) ? provinciaBruta : '';
  const numeroPagina = parseInt(valorUnico(raw.pagina) || '1', 10);
  const pagina = Number.isFinite(numeroPagina) && numeroPagina > 0 ? Math.min(numeroPagina, 1000) : 1;

  return {
    tipo: valorUnico(raw.tipo) === 'produtos' ? 'produtos' : 'servicos',
    q,
    categoria: valorUnico(raw.categoria).slice(0, 100),
    provincia,
    municipio: valorUnico(raw.municipio).slice(0, 100),
    preco: opcaoValida(valorUnico(raw.preco), OPCOES_PRECO),
    avaliacao: opcaoValida(valorUnico(raw.avaliacao), OPCOES_AVALIACAO),
    estado_produto: opcaoValida(valorUnico(raw.estado_produto), OPCOES_ESTADO_PRODUTO),
    entrega: opcaoValida(valorUnico(raw.entrega), OPCOES_ENTREGA),
    pagina,
  };
}

export function hrefDescobrir(atual: ParamsDescobrir, alteracoes: Partial<ParamsDescobrir> = {}): string {
  const p = { ...atual, ...alteracoes };
  const qs = new URLSearchParams();
  qs.set('tipo', p.tipo);
  if (p.q) qs.set('q', p.q);
  if (p.categoria) qs.set('categoria', p.categoria);
  if (p.provincia) qs.set('provincia', p.provincia);
  if (p.municipio) qs.set('municipio', p.municipio);
  if (p.preco) qs.set('preco', p.preco);
  if (p.tipo === 'servicos' && p.avaliacao) qs.set('avaliacao', p.avaliacao);
  if (p.tipo === 'produtos' && p.estado_produto) qs.set('estado_produto', p.estado_produto);
  if (p.tipo === 'produtos' && p.entrega) qs.set('entrega', p.entrega);
  if (p.pagina > 1) qs.set('pagina', String(p.pagina));
  return `/descobrir?${qs.toString()}`;
}
