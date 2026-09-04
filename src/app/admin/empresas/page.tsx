"use client"

import * as React from "react"
import { supabase } from "@/lib/supabase"

type Empresa = {
  id: string
  name: string
  sector?: string
  province?: string
  email?: string
  contact?: string
  is_approved: boolean
}

function useEmpresas() {
  const [empresas, setEmpresas] = React.useState<Empresa[]>([])
  const [carregando, setCarregando] = React.useState(true)

  React.useEffect(() => {
    async function carregar() {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("is_approved", false)

      if (error) {
        console.error("Erro ao carregar empresas:", error)
      } else {
        setEmpresas(data || [])
      }
      setCarregando(false)
    }

    carregar()
  }, [])

  const aprovar = async (id: string) => {
    const { error } = await supabase
      .from("companies")
      .update({ is_approved: true })
      .eq("id", id)

    if (!error) {
      setEmpresas(prev =>
        prev.map(e => (e.id === id ? { ...e, is_approved: true } : e)),
      )
    }
  }

  const rejeitar = async (id: string) => {
    const { error } = await supabase
      .from("companies")
      .delete()
      .eq("id", id)

    if (!error) {
      setEmpresas(prev => prev.filter(e => e.id !== id))
    }
  }

  return { empresas, aprovar, rejeitar }
}

export default function AdminEmpresasPage() {
  const { empresas, aprovar, rejeitar } = useEmpresas()
  const [userEmail, setUserEmail] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function checkEmail() {
      const { data } = await supabase.auth.getUser()
      if (data.user?.email) {
        setUserEmail(data.user.email)
      }
    }
    checkEmail()
  }, [])

  if (!userEmail) {
    // TODO: definir lista de emails admin permitidos
  }

  // Lista de admins permitidos (adicione seu email real aqui)
  const adminsPermitidos = ["admin@negomapa.com"]

  if (!adminsPermitidos.includes(userEmail)) {
    return (
      <div className="min-h-screen p-8 text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Acesso negado</h2>
        <p className="text-neutral-600">Você precisa estar logado como admin para acessar esta página.</p>
        <br />
        <a href="/" className="text-blue-600 hover:underline">Voltar ao inicio</a>
      </div>
    )
  }

  if (empresas.length === 0) {
    return (
      <div className="min-h-screen p-8 text-center">
        <p className="text-neutral-500">Nenhuma empresa pendente de aprovação.</p>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 bg-neutral-50 dark:bg-neutral-900">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">
          Administração de Empresas
        </h1>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300 rounded-lg overflow-hidden dark:border-neutral-700">
            <thead>
              <tr className="border-b bg-neutral-200 dark:bg-neutral-800">
                <th className="p-4 text-left text-neutral-700 dark:text-neutral-300">Nome</th>
                <th className="p-4 text-left text-neutral-700 dark:text-neutral-300">Setor</th>
                <th className="p-4 text-left text-neutral-700 dark:text-neutral-300">Província</th>
                <th className="p-4 text-left text-neutral-700 dark:text-neutral-300">Email</th>
                <th className="p-4 text-left text-neutral-700 dark:text-neutral-300">Contacto</th>
                <th className="p-4 text-left text-neutral-700 dark:text-neutral-300">Ação</th>
              </tr>
            </thead>
            <tbody>
              {empresas.map((empresa) => (
                <tr key={empresa.id} className="border-b dark:bg-neutral-800 dark:text-neutral-200">
                  <td className="p-4">{empresa.name}</td>
                  <td className="p-4">{empresa.sector || "-"}</td>
                  <td className="p-4">{empresa.province || "-"}</td>
                  <td className="p-4">{empresa.email || "-"}</td>
                  <td className="p-4">{empresa.phone || "-"}</td>
                  <td className="p-4">
                    {!empresa.is_approved ? (
                      <>
                        <button
                          onClick={() => aprovar(empresa.id)}
                          className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-300 dark:bg-green-600 dark:text-white dark:focus:ring-green-400"
                        >
                          Aprovar
                        </button>
                        <button
                          onClick={() => rejeitar(empresa.id)}
                          className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 ml-2 focus:outline-none focus:ring-2 focus:ring-red-300 dark:bg-red-600 dark:text-white dark:focus:ring-red-400"
                        >
                          Rejeitar
                        </button>
                      </>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}