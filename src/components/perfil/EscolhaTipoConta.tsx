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
  return <div>
    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 font-heading font-bold text-orange-700 dark:bg-orange-950/50 dark:text-orange-200">{sigla}</div>
    <Button type="button" fullWidth onClick={escolher} loading={pendente} disabled={pendente}>Continuar</Button>
    {erro&&<p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-300">{erro}</p>}
  </div>
}