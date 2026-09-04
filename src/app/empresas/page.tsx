"use client"

import * as React from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type Empresa = {
  id: string
  name: string
  sector?: string
  province?: string
  city?: string
  slug: string
  is_approved: boolean
}

export default function EmpresasPage() {
  const [empresas, setEmpresas] = React.useState<any[]>([])
  const [carregando, setCarregando] = React.useState(true)

  React.useEffect(() => {
    async function carregarEmpresas() {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('is_approved', true)

      if (error) {
        console.error('Erro ao carregar empresas:', error)
      } else {
        setEmpresas(data || [])
      }
      setCarregando(false)
    }

    carregarEmpresas()
  }, [])

  if (carregando) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Carregando empresas...</p>
      </div>
    )
  }

  if (empresas.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Nenhuma empresa aprovada ainda</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ marginBottom: '20x' }}>Empresas Aprovadas</h1>
      <div style={{ display: 'grid', gap: '20px', maxWidth: '1200px' }}>
        {empresas.map((empresa) => (
          <div
            key={empresa.id}
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '16px',
              background: 'white',
            }}
          >
            <h3>
              {empresa.name}
            </h3>
            <p>
              {empresa.sector || ''}
            </p>
            <p>
              {empresa.province || ''} - {empresa.city || ''}
            </p>
            <Link href={`/empresa/${empresa.slug}`}>
              <p style={{ marginTop: '12px', display: 'inline-block', color: '#3b82f6', textDecoration: 'none', fontWeight: '500' }}>
                Ver detalhes
              </p>
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}