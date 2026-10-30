// Lista de províncias usada na pesquisa da página inicial.
// Fonte: negomapa-prototipo.html (21 províncias). O prompt B.6.15 indicava 18; ver relatório.
export const PROVINCIAS = [
  'Bengo',
  'Benguela',
  'Bié',
  'Cabinda',
  'Cassai-Zambeze',
  'Cubango',
  'Cuando',
  'Cuanza Norte',
  'Cuanza Sul',
  'Cunene',
  'Huambo',
  'Huíla',
  'Icolo e Bengo',
  'Luanda',
  'Lunda Norte',
  'Lunda Sul',
  'Malanje',
  'Moxico',
  'Namibe',
  'Uíge',
  'Zaire',
] as const;

export type Perfil = 'visitante' | 'profissional' | 'empresa';
