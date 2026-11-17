import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const PUBLIC_BUCKETS = new Set([
  'profissionais-avatars',
  'profissionais-portfolio',
  'empresas-logos',
  'empresas-portfolio',
])
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ caminho: string[] }> },
) {
  const { caminho } = await params
  if (!Array.isArray(caminho) || caminho.length !== 4) {
    return new NextResponse('Not found', { status: 404 })
  }

  const [bucket, ownerId, folder, file] = caminho
  if (
    !PUBLIC_BUCKETS.has(bucket) ||
    !UUID.test(ownerId) ||
    !['avatar', 'portfolio'].includes(folder) ||
    (bucket.endsWith('avatars') || bucket === 'empresas-logos' ? folder !== 'avatar' : folder !== 'portfolio') ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(webp|jpg)$/i.test(file)
  ) {
    return new NextResponse('Not found', { status: 404 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    return new NextResponse('Image service unavailable', { status: 503 })
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const path = ownerId + '/' + folder + '/' + file
  const { data: allowed, error: authorizationError } = await admin.rpc('pode_servir_imagem', {
    p_bucket: bucket,
    p_name: path,
  })
  if (authorizationError || allowed !== true) {
    return new NextResponse('Not found', { status: 404 })
  }

  const { data: image, error } = await admin.storage.from(bucket).download(path)
  if (error || !image) return new NextResponse('Not found', { status: 404 })

  const contentType = ['image/webp', 'image/jpeg', 'image/png'].includes(image.type) ? image.type : 'application/octet-stream'
  return new NextResponse(await image.arrayBuffer(), {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': 'inline',
      'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=60',
      'X-Content-Type-Options': 'nosniff',
      'Vary': 'Accept-Encoding',
    },
  })
}
