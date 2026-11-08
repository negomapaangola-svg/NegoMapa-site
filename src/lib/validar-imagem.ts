/**
 * Validação partilhada para imagens enviadas por utilizadores.
 * - Aceita apenas JPG, PNG ou WebP.
 * - Limite padrão: 2 MB por imagem.
 */
export const TIPOS_IMAGEM Aceites = ['image/jpeg', 'image/png', 'image/webp'] as const;

export const TAMANHO_MAXIMO_IMAGEM = 2 * 1024 * 1024; // 2 MB

export function validarImagem(
  file: File,
  opcoes?: { tipos?: readonly string[]; maxBytes?: number }
): string | null {
  const tipos = opcoes?.tipos ?? TIPOS_IMAGEM_ACEITES;
  const maxBytes = opcoes?.maxBytes ?? TAMANHO_MAXIMO_IMAGEM;

  if (!tipos.includes(file.type)) {
    return 'Tipo de ficheiro não permitido. Use JPG, PNG ou WebP.';
  }

  if (file.size > maxBytes) {
    const maxMB = Math.round((maxBytes / (1024 * 1024)) * 10) / 10;
    return `A imagem excede o tamanho máximo de ${maxMB} MB.`;
  }

  return null;
}
