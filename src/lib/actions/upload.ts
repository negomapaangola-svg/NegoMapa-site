'use server'

import { createSupabaseServerClient } from '@/lib/supabase-server'
import { randomUUID } from 'crypto'

type AllowedBucket =
  | 'empresas-logos'
  | 'profissionais-avatars'
  | 'servicos-imagens'
  | 'vagas-capas'
  | 'documentos-privados'

type UploadResult =
  | { url: string }
  | { path: string }
  | { error: string }

const TAMANHO_MAXIMO_IMAGEM = 2 * 1024 * 1024 // 2 MB

const bucketConfig: Record<AllowedBucket, { allowedTypes: string[]; maxSize: number; isPublic: boolean }> = {
  'empresas-logos': {
    allowedTypes: ['image/png', 'image/jpeg', 'image/webp'],
    maxSize: TAMANHO_MAXIMO_IMAGEM,
    isPublic: true,
  },
  'profissionais-avatars': {
    allowedTypes: ['image/png', 'image/jpeg', 'image/webp'],
    maxSize: TAMANHO_MAXIMO_IMAGEM,
    isPublic: true,
  },
  'servicos-imagens': {
    allowedTypes: ['image/png', 'image/jpeg', 'image/webp'],
    maxSize: TAMANHO_MAXIMO_IMAGEM,
    isPublic: true,
  },
  'vagas-capas': {
    allowedTypes: ['image/png', 'image/jpeg', 'image/webp'],
    maxSize: TAMANHO_MAXIMO_IMAGEM,
    isPublic: true,
  },
  'documentos-privados': {
    allowedTypes: ['application/pdf', 'image/png', 'image/jpeg'],
    maxSize: 10 * 1024 * 1024,
    isPublic: false,
  },
}

function assinaturaValida(mimeType: string, bytes: Buffer): boolean {
  if (mimeType === 'image/png') return bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  if (mimeType === 'image/jpeg') return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  if (mimeType === 'image/webp') return bytes.length >= 12 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP'
  if (mimeType === 'application/pdf') return bytes.length >= 5 && bytes.toString('ascii', 0, 5) === '%PDF-'
  return false
}

function getExtension(mimeType: string): string {
  switch (mimeType) {
    case 'image/png':
      return 'png'
    case 'image/jpeg':
      return 'jpg'
    case 'image/webp':
      return 'webp'
    case 'application/pdf':
      return 'pdf'
    default:
      return 'bin'
  }
}

export async function uploadFile(
  bucket: AllowedBucket,
  folder: string,
  file: File
): Promise<UploadResult> {
  if (!bucketConfig[bucket] || typeof folder !== 'string' || !/^[a-zA-Z0-9_-]{1,48}$/.test(folder)) {
    return { error: 'Bucket inválido' }
  }

  const config = bucketConfig[bucket]

  if (!(file instanceof File) || !config.allowedTypes.includes(file.type)) {
    return { error: `Tipo de ficheiro não permitido para ${bucket}. Tipos aceites: ${config.allowedTypes.join(', ')}` }
  }

  if (!file || typeof file.size !== 'number' || file.size <= 0 || file.size > config.maxSize) {
    const maxMB = config.maxSize / (1024 * 1024)
    return { error: `Ficheiro excede o tamanho máximo de ${maxMB}MB para ${bucket}` }
  }

  const supabase = await createSupabaseServerClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Utilizador não autenticado' }
  }

  const extension = getExtension(file.type)
  const uniqueName = `${randomUUID()}.${extension}`
  const path = `${user.id}/${folder}/${uniqueName}`

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  if (!assinaturaValida(file.type, buffer)) return { error: 'O conteúdo do ficheiro não corresponde ao tipo declarado.' }

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    console.error('Erro no upload do ficheiro. Código:', uploadError.statusCode ?? 'indisponível')
    return { error: 'Não foi possível carregar o ficheiro. Verifique o tipo, tamanho e permissões.' }
  }

  if (config.isPublic) {
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path)
    return { url: publicUrl }
  }

  return { path }
}
