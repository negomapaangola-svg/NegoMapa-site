"use client"

import * as React from 'react'
import { supabase } from '@/lib/supabase'
import { getSession, isAdmin } from '@/lib/auth'

type Empresa = {
  id: string
  name: string
  sector?: string
  province?: string
  city?: string
  is_approved: boolean
}

function useEmpresas(): [
  Empresa[],
  () => Promise<void>,
  (id: string, aprovar: boolean) => Promise<void>
] {
  const [empresas, setEmpresas] = React.useState<Empresa[]>([])

  const carregar = async (): Promise<void> => {
    const { data, error } = await supabase
      .from('companies')
      .select('*')

    if (error) {
      console.error('Erro ao carregar empresas:', error)
    } else {
      setEmpresas(data || [])
    }
  }

  const atualizar = async (id: string, aprovar: boolean): Promise<void> => {
    const { error } = await supabase
      .from('companies')
      .update({ is_approved: aprovar })
      .eq('id', id)

    if (!error) {
      setEmpresas(prev => prev.map(e => e.id === id ? { ...e, is_approved: aprovar } : e))
    }
  }

  return [empresas, carregar, atualizar]
}

export default function AdminEmpresasPage() {
  const [empresas, carregar, atualizar] = useEmpresas()
  const [carregando, setCarregando] = React.useState(true)
  const [isLoggedIn, setIsLoggedIn] = React.useState(false)

  React.useEffect(() => {
    async function checkLogin() {
      const session = await getSession()
      if (session && await isAdmin()) {
        setIsLoggedIn(true)
      } else {
        setIsLoggedIn(false)
      }
      setCarregando(false)
    }

    checkLogin()
  }, [])

  if (carregando) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Verificando acesso...</p>
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#ef4444' }}>
        <h2>Acesso negado</h2>
        <p>Você precisa estar logado como admin para acessar esta página.</p>
        <br />
        <a href="/" style={{ color: '#3b82f6', textDecoration: 'none' }}>Voltar ao inicio</a>
      </div>
    )
  }

  if (empresas.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Nenhuma empresa cadastrada</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ marginBottom: '20px' }}>Administração de Empresas</h1>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #ddd' }}>
            <th style={{ padding: '8px', textAlign: 'left' }}>Nome</th>
            <th style={{ padding: '8px', textAlign: 'left' }}>Setor</th>
            <th style={{ padding: '8px', textAlign: 'left' }}>Província</th>
            <th style={{ padding: '8px', textAlign: 'left' }}>Aprovado</th>
            <th style={{ padding: '8px', textAlign: 'left' }}>&nbsp;</th>
          </tr>
        </thead>
        <tbody>
          {empresas.map((empresa) => (
            <tr key={empresa.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td style={{ padding: '8px' }}>{empresa.name}</td>
              <td style={{ padding: '8px' }}>{empresa.sector || ''}</td>
              <td style={{ padding: '8px' }}>{empresa.province || ''}</td>
              <td style={{ padding: '8px' }}>
                {empresa.is_approved ? 'Sim' : 'Não'}
              </td>
              <td style={{ padding: '8px' }}>
                {empresa.is_approved ? (
                  <button
                    onClick={() => atualizar(empresa.id, false)}
                    style={{
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    Rejeitar
                  </button>
                ) : (
                  <button
                    onClick={() => atualizar(empresa.id, true)}
                    style={{
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    Aprovar
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}