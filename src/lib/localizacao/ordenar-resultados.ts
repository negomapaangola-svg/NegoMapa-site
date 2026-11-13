export type LocalizacaoAdministrativa = {
  provincia: string | null;
  municipio: string | null;
  bairro?: string | null;
} | null;

type LinhaLocalizavel = {
  provincia?: string | null;
  municipio?: string | null;
  bairro?: string | null;
};

function normalizar(valor: string | null | undefined): string {
  return (valor ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLocaleLowerCase('pt');
}

/** Mantém todos os resultados e prioriza bairro (se disponível), município e província. */
export function ordenarPorLocalizacaoAdministrativa<T extends LinhaLocalizavel>(
  linhas: T[],
  localizacao: LocalizacaoAdministrativa,
): T[] {
  if (!localizacao || (!localizacao.provincia && !localizacao.municipio && !localizacao.bairro)) return linhas;
  const provincia = normalizar(localizacao.provincia);
  const municipio = normalizar(localizacao.municipio);
  const bairro = normalizar(localizacao.bairro);
  return linhas.map((linha, indice) => {
    const mesmaProvincia = Boolean(provincia && normalizar(linha.provincia) === provincia);
    const mesmoMunicipio = Boolean(municipio && normalizar(linha.municipio) === municipio);
    const mesmoBairro = Boolean(bairro && normalizar(linha.bairro) === bairro);
    const prioridade = mesmoBairro && mesmoMunicipio ? 0 : mesmoMunicipio ? 1 : mesmaProvincia ? 2 : 3;
    return { linha, indice, prioridade };
  }).sort((a, b) => a.prioridade - b.prioridade || a.indice - b.indice).map(({ linha }) => linha);
}
