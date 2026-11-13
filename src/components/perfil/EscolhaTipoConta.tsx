'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { escolherTipoConta } from '@/lib/actions/perfil-pessoal'
type Tipo='cliente'|'profissional'|'empresa'
export function EscolhaTipoConta({tipo,sigla}:{tipo:Tipo;sigla:string}) {
  const [erro,setErro]=useState('')
  const [pendente,start]=useTransition()
  const router=useRouter()
  function escolher() {
    setErro('')
    start(async()=>{
      const r=await escolherTipoConta(tipo)
      if(r.ok){router.replace('/perfil');router.refresh()} else setErro(r.message)
    })
  }
  const cores = { cliente: 'bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-200', profissional: 'bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-200', empresa: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200' }
  return <div>
    <div className={"mb-4 flex h-10 w-10 items-center justify-center rounded-xl font-heading text-sm font-bold " + cores[tipo]}>{sigla}</div>
    <Button type="button" size="sm" fullWidth onClick={escolher} loading={pendente} disabled={pendente}>Continuar</Button>
    {erro&&<p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-300">{erro}</p>}
  </div>
}