"use client"

import * as React from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Empresa = {
  id: string
  name: string
  sector?: string
  province?: string
  city?: string
  whatsapp?: string
  phone?: string
  email?: string
  description?: string
  website?: string
}

export default function EmpresaDetalhePage() {
  const { slug } = useParams<{ slug: string }>() || {}

  const [empresa, setEmpresa] = React.useState<Empresa | null>(null)
  const [carregando, setCarregando] = React.useState(true)

  React.useEffect(() => {
    async function carregarEmpresa() {
      if (!slug) {
        setCarregando(false)
        return
      }

      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('slug', slug)
        .single()

      if (error) {
        console.error('Empresa não encontrada:', error)
        setEmpresa(null)
      } else {
        setEmpresa(data as Empresa)
      }
      setCarregando(false)
    }

    carregarEmpresa()
  }, [slug])

  if (carregando) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Carregando empresa...</p>
      </div>
    )
  }

  if (!empresa) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Empresa não encontrada</h2>
        <p>A empresa solicitada não existe ou não está disponível.</p>
        <br />
        <a href="/empresas" style={{ color: '#3b82f6', textDecoration: 'none' }}>Voltar às empresas</a>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '20px' }}>{empresa.name}</h1>

      <div style={{ marginBottom: '16px' }}>
        <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>Setor:</p>
        <p>{empresa.sector || 'Não informado'}</p>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>Província:</p>
        <p>{empresa.province || 'Não informado'}</p>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>Cidade:</p>
        <p>{empresa.city || 'Não informado'}</p>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>WhatsApp:</p>
        <p>{empresa.whatsapp || 'Não informado'}</p>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>Phone:</p>
        <p>{empresa.phone || 'Não informado'}</p>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>Email:</p>
        <a
          href={`mailto:${empresa.email}`}
          style={{ color: '#3b82f6', textDecoration: 'none' }}
        >
          {empresa.email || 'Não informado'}
        </a>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>Website:</p>
        {empresa.website ? (
          <a
            href={empresa.website}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#3b82f6', textDecoration: 'none' }}
          >
            {empresa.website}
          </a>
        ) : (
          <p>Não informado</p>
        )}
      </div>

      <div style={{ marginBottom: '16px' }}>
        <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>Descrição:</p>
        <p>{empresa.description || 'Não informado'}</p>
      </div>
    </div>
  )
}