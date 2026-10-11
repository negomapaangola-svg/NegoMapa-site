'use server'

import { createSupabaseServerClient } from '@/lib/supabase-server'
import { randomUUID } from 'crypto'

type AllowedBucket =
  | 'empresas-logos'
  | 'profissionais-avatars'
  | 'servicos-imagens'
  | 'documentos-privados'

type UploadResult =
  | { url: string }
  | { path: string }
  | { error: string }

const bucketConfig: Record<AllowedBucket, { allowedTypes: string[]; maxSize: number; isPublic: boolean }> = {
  'empresas-logos': {
    allowedTypes: ['image/png', 'image/jpeg', 'image/webp'],
    maxSize: 2 * 1024 * 1024,
    isPublic: true,
  },
  'profissionais-avatars': {
    allowedTypes: ['image/png', 'image/jpeg', 'image/webp'],
    maxSize: 1 * 1024 * 1024,
    isPublic: true,
  },
  'servicos-imagens': {
    allowedTypes: ['image/png', 'image/jpeg', 'image/webp'],
    maxSize: 5 * 1024 * 1024,
    isPublic: true,
  },
  'documentos-privados': {
    allowedTypes: ['application/pdf', 'image/png', 'image/jpeg'],
    maxSize: 10 * 1024 * 1024,
    isPublic: false,
  },
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
  if (!bucketConfig[bucket]) {
    return { error: 'Bucket inválido' }
  }

  const config = bucketConfig[bucket]

  if (!config.allowedTypes.includes(file.type)) {
    return { error: `Tipo de ficheiro não permitido para ${bucket}. Tipos aceites: ${config.allowedTypes.join(', ')}` }
  }

  if (file.size > config.maxSize) {
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
  const path = `${folder}/${user.id}/${uniqueName}`

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    console.error('Erro no upload:', uploadError)
    return { error: 'Erro ao fazer upload do ficheiro' }
  }

  if (config.isPublic) {
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path)
    return { url: publicUrl }
  }

  return { path }
}