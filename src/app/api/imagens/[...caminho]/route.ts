import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'

const PRIVATE_BUCKETS = new Set([
  'profissionais-avatars',
  'profissionais-portfolio',
  'empresas-logos',
  'empresas-portfolio',
  'clientes-avatars',
])
const PUBLIC_BUCKETS = new Set([
  'profissionais-avatars',
  'profissionais-portfolio',
  'empresas-logos',
  'empresas-portfolio',
])
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const IMAGE_FILE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(webp|jpg|png)$/i

function imageResponse(image: Blob, isOwner: boolean) {
  const contentType = ['image/webp', 'image/jpeg', 'image/png'].includes(image.type) ? image.type : 'application/octet-stream'
  return new NextResponse(image, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': 'inline',
      'Cache-Control': isOwner ? 'private, no-store, max-age=0' : 'public, max-age=0, s-maxage=0, must-revalidate',
      'X-Content-Type-Options': 'nosniff',
      'Vary': 'Cookie, Accept-Encoding',
    },
  })
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ caminho: string[] }> },
) {
  const { caminho } = await params
  if (!Array.isArray(caminho) || ![3, 4].includes(caminho.length)) {
    return new NextResponse('Not found', { status: 404 })
  }

  const [bucket, ownerId, folderOrFile, maybeFile] = caminho
  if (!PRIVATE_BUCKETS.has(bucket) || !UUID.test(ownerId)) {
    return new NextResponse('Not found', { status: 404 })
  }

  let path = ''
  if (maybeFile) {
    const folder = folderOrFile
    const file = maybeFile
    const allowedFolder =
      (bucket === 'profissionais-avatars' && ['avatar', 'avatars'].includes(folder)) ||
      (bucket === 'empresas-logos' && folder === 'avatar') ||
      (bucket === 'clientes-avatars' && folder === 'avatar') ||
      (bucket === 'profissionais-portfolio' && folder === 'portfolio') ||
      (bucket === 'empresas-portfolio' && folder === 'portfolio')
    if (!allowedFolder || !IMAGE_FILE.test(file)) {
      return new NextResponse('Not found', { status: 404 })
    }
    path = ownerId + '/' + folder + '/' + file
  } else {
    // Formato legado de logótipo empresarial: {user_id}/logotipo-{timestamp}.jpg
    if (bucket !== 'empresas-logos' || !/^logotipo-[0-9]+\.(webp|jpg|png)$/i.test(folderOrFile)) {
      return new NextResponse('Not found', { status: 404 })
    }
    path = ownerId + '/' + folderOrFile
  }

  const userSupabase = await createSupabaseServerClient()
  const { data: { user } } = await userSupabase.auth.getUser().then(result => result)
  if (user?.id === ownerId) {
    // Leitura privada do próprio dono através do JWT e das políticas RLS existentes.
    const { data: image, error } = await userSupabase.storage.from(bucket).download(path)
    if (error || !image) return new NextResponse('Not found', { status: 404 })
    return imageResponse(image, true)
  }

  // Avatares de clientes nunca têm leitura pública, mesmo quando a rota é conhecida.
  if (!PUBLIC_BUCKETS.has(bucket)) {
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
  const { data: allowed, error: authorizationError } = await admin.rpc('pode_servir_imagem', {
    p_bucket: bucket,
    p_name: path,
  })
  if (authorizationError || allowed !== true) {
    return new NextResponse('Not found', { status: 404 })
  }

  const { data: image, error } = await admin.storage.from(bucket).download(path)
  if (error || !image) return new NextResponse('Not found', { status: 404 })
  return imageResponse(image, false)
}
