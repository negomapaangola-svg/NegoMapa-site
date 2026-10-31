/**
 * Listas de seleção reutilizáveis (setores, províncias, municípios, faixas de preço).
 *
 * Fonte única para os formulários. Não há tabela na base de dados para estas listas:
 * alterar um valor aqui muda as opções de todos os formulários que as usam.
 *
 * Atenção: valores já gravados na base de dados (ex.: "Tecnologia " com espaço
 * final) não correspondem a estas listas. Ver a secção de normalização no fim.
 */

// ---------------------------------------------------------------------------
// 1. Setores de empresa
// ---------------------------------------------------------------------------

export const SETORES_EMPRESA = [
  'Agricultura',
  'Comércio',
  'Construção',
  'Educação',
  'Moda',
  'Saúde',
  'Serviços',
  'Tecnologia',
  'Transportes',
  'Outro',
] as const

export type SetorEmpresa = (typeof SETORES_EMPRESA)[number]

// ---------------------------------------------------------------------------
// 2. Províncias (18, estrutura anterior à divisão de 2024)
// ---------------------------------------------------------------------------

export const PROVINCIAS = [
  'Bengo',
  'Benguela',
  'Bié',
  'Cabinda',
  'Cuando-Cubango',
  'Cuanza Norte',
  'Cuanza Sul',
  'Cunene',
  'Huambo',
  'Huíla',
  'Luanda',
  'Lunda Norte',
  'Lunda Sul',
  'Malanje',
  'Moxico',
  'Namibe',
  'Uíge',
  'Zaire',
] as const

export type Provincia = (typeof PROVINCIAS)[number]

// ---------------------------------------------------------------------------
// 3. Municípios por província
// Ver nota de validação no fim: a lista deve ser conferida com fonte oficial.
// ---------------------------------------------------------------------------

export const MUNICIPIOS_POR_PROVINCIA: Readonly<Record<Provincia, ReadonlyArray<string>>> = {
  Bengo: ['Ambriz', 'Bula Atumba', 'Dande', 'Dembos', 'Nambuangongo', 'Pango Aluquém'],
  Benguela: [
    'Balombo', 'Baía Farta', 'Benguela', 'Booma', 'Caimbambo',
    'Catumbela', 'Chongorói', 'Cubal', 'Ganda', 'Lobito',
  ],
  Bié: ['Andulo', 'Camacupa', 'Catabola', 'Chinguar', 'Chitembo', 'Cuemba', 'Cunhinga', 'Cuíto', 'Nharea'],
  Cabinda: ['Belize', 'Buco-Zau', 'Cabinda', 'Cacongo'],
  'Cuando-Cubango': [
    'Calai', 'Cuangar', 'Cuchi', 'Cuito Cuanavale', 'Dirico',
    'Mavinga', 'Menongue', 'Nancova', 'Rivungo',
  ],
  'Cuanza Norte': [
    'Ambaca', 'Banga', 'Bolongongo', 'Cambambe', 'Cazengo',
    'Golungo Alto', 'Gonguembo', 'Lucala', 'Quiculungo', 'Samba Caju',
  ],
  'Cuanza Sul': [
    'Amboim', 'Cassongue', 'Cela', 'Conda', 'Ebo', 'Libolo', 'Mussende',
    'Porto Amboim', 'Quibala', 'Quilenda', 'Quikuma', 'Seles', 'Sumbe',
  ],
  Cunene: ['Cahama', 'Cuanhama', 'Cuvelai', 'Namacunde', 'Ombadja'],
  Huambo: [
    'Bailundo', 'Caála', 'Cachiungo', 'Chicala-Cholohanga', 'Chinjenje', 'Ecunha',
    'Huambo', 'Londuimbali', 'Longonjo', 'Mungo', 'Tchicala-Tcholohanga', 'Tchindjenje', 'Ucuma',
  ],
  Huíla: [
    'Caconda', 'Cacula', 'Caluquembe', 'Chiange', 'Chibia', 'Chicomba', 'Chipindo',
    'Cuvango', 'Humpata', 'Jamba', 'Lubango', 'Matala', 'Quilengues', 'Quipungo',
  ],
  Luanda: [
    'Belas', 'Cacuaco', 'Cazenga', 'Icolo e Bengo', 'Ingombota', 'Kilamba Kiaxi',
    'Maianga', 'Rangel', 'Samba', 'Sambizanga', 'Viana',
  ],
  'Lunda Norte': [
    'Cambulo', 'Capenda-Camulemba', 'Caungula', 'Chitato', 'Cuango',
    'Cuílo', 'Lubalo', 'Lucapa', 'Xá-Muteba',
  ],
  'Lunda Sul': ['Cacolo', 'Dala', 'Muconda', 'Saurimo'],
  Malanje: [
    'Cacuso', 'Calandula', 'Cambundi-Catembo', 'Cangandala', 'Caombo', 'Cuaba Nzoji',
    'Cunda-dia-Baze', 'Luquembo', 'Malanje', 'Marimba', 'Massango', 'Mucari', 'Quela', 'Quirima',
  ],
  Moxico: ['Alto Zambeze', 'Bundas', 'Camanongue', 'Cameia', 'Léua', 'Luacano', 'Luau', 'Luena', 'Moxico'],
  Namibe: ['Bibala', 'Camucuio', 'Moçâmedes', 'Tômbua', 'Virei'],
  Uíge: [
    'Alto Cauale', 'Ambuíla', 'Bembe', 'Buengas', 'Bungo', 'Damba', 'Macocola',
    'Mucaba', 'Negage', 'Puri', 'Quimbele', 'Quitexe', 'Sanza Pombo', 'Songo', 'Uíge', 'Zombo',
  ],
  Zaire: ['Cuimba', "M'Banza Kongo", 'Nóqui', 'Nezeto', 'Soyo', 'Tomboco'],
}

/** Municípios de uma província. Devolve lista vazia se a província não existir. */
export function municipiosDa(provincia: string): ReadonlyArray<string> {
  return (MUNICIPIOS_POR_PROVINCIA as Record<string, ReadonlyArray<string>>)[provincia] ?? []
}

// ---------------------------------------------------------------------------
// 4. Faixas de preço "desde" (Kwanza)
// valor: limite inferior em Kz (0 = sem mínimo). Usar "a combinar" quando não houver preço.
// ---------------------------------------------------------------------------

export const FAIXAS_PRECO_DESDE = [
  { valor: 0, rotulo: 'Até 10.000 Kz' },
  { valor: 10_000, rotulo: 'Desde 10.000 Kz' },
  { valor: 50_000, rotulo: 'Desde 50.000 Kz' },
  { valor: 100_000, rotulo: 'Desde 100.000 Kz' },
  { valor: 500_000, rotulo: 'Desde 500.000 Kz' },
  { valor: 1_000_000, rotulo: 'Desde 1.000.000 Kz' },
  { valor: -1, rotulo: 'A combinar' },
] as const

export type FaixaPreco = (typeof FAIXAS_PRECO_DESDE)[number]

// ---------------------------------------------------------------------------
// Normalização de valores já gravados na base de dados
// ---------------------------------------------------------------------------

/** Remove espaços extra e normaliza maiúsculas/minúsculas ao comparar com as listas. */
export function normalizarTexto(valor: string | null | undefined): string {
  return (valor ?? '').replace(/\s+/g, ' ').trim()
}

/** Devolve a entrada da lista que corresponde ao valor (ignora espaços e maiúsculas). */
export function encontrarNaLista<T extends string>(valor: string | null | undefined, lista: ReadonlyArray<T>): T | undefined {
  const alvo = normalizarTexto(valor).toLowerCase()
  return lista.find((item) => item.toLowerCase() === alvo)
}

// ---------------------------------------------------------------------------
// Notas de validação (não são código)
// - Províncias: a lista usa a estrutura de 18 províncias pedida. O ficheiro
//   src/components/home/constants.ts tem 21 entradas (divisão de 2024):
//   Cassai-Zambeze, Cuando, Cubango e Moxico Leste não estão aqui.
//   Confirmar com o cliente qual é a estrutura oficial a usar.
// - Municípios: lista de memória, sem fonte oficial verificada nesta sessão.
//   Validar com o INE ou com o Diário da República antes de publicar.
// - Setores e base de dados: companies.sector tem valores com espaços finais
//   ("Tecnologia ", "Construção ") e "Medicina", que não existe aqui.
//   Usar encontrarNaLista para mostrar esses registos sem os perder.
// ---------------------------------------------------------------------------
