'use client'
import { useState, useTransition, type FormEvent } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { actualizarPerfilPessoal } from '@/lib/actions/perfil-pessoal'

type Props = { email: string; nome: string; telefone: string; whatsapp: string; avatarUrl: string | null }
export function PerfilPessoalForm({ email, nome: nomeInicial, telefone: telefoneInicial, whatsapp: whatsappInicial, avatarUrl }: Props) {
  const [nome,setNome]=useState(nomeInicial)
  const [telefone,setTelefone]=useState(telefoneInicial)
  const [whatsapp,setWhatsapp]=useState(whatsappInicial)
  const [avatar,setAvatar]=useState(avatarUrl ?? '')
  const [mensagem,setMensagem]=useState('')
  const [ok,setOk]=useState(false)
  const [pendente,start]=useTransition()
  function submit(e:FormEvent<HTMLFormElement>) {
    e.preventDefault(); setMensagem(''); setOk(false)
    start(async()=>{
      const r=await actualizarPerfilPessoal({nome,telefone,whatsapp,avatar_url:avatar})
      setMensagem(r.message); setOk(r.ok)
    })
  }
  return <form onSubmit={submit} className="space-y-5">
    <div className="flex items-center gap-4">
      <Avatar src={avatar || null} alt={nome || 'Avatar'} name={nome} width={72} height={72}/>
      <div><p className="font-semibold text-ink dark:text-cream">{nome || 'O seu nome'}</p><p className="text-sm text-neutral-600 dark:text-cream-text">As iniciais aparecem quando não existe fotografia.</p></div>
    </div>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="text-sm font-medium sm:col-span-2">Email da conta
        <input type="email" value={email} readOnly aria-readonly="true" className="mt-1 w-full rounded-xl border border-card-border bg-neutral-100 px-4 py-3 dark:bg-neutral-800"/>
        <span className="mt-1 block text-xs font-normal text-neutral-500">O email é gerido pela autenticação e não pode ser alterado aqui.</span>
      </label>
      <label className="text-sm font-medium sm:col-span-2">Nome
        <input value={nome} onChange={e=>setNome(e.target.value)} minLength={2} maxLength={80} required autoComplete="name" className="mt-1 w-full rounded-xl border border-card-border bg-white px-4 py-3 dark:bg-neutral-900"/>
      </label>
      <label className="text-sm font-medium">Telefone
        <input type="tel" value={telefone} onChange={e=>setTelefone(e.target.value)} maxLength={20} autoComplete="tel" placeholder="+244 9XX XXX XXX" className="mt-1 w-full rounded-xl border border-card-border bg-white px-4 py-3 dark:bg-neutral-900"/>
      </label>
      <label className="text-sm font-medium">WhatsApp
        <input type="tel" value={whatsapp} onChange={e=>setWhatsapp(e.target.value)} maxLength={20} autoComplete="tel" placeholder="+244 9XX XXX XXX" className="mt-1 w-full rounded-xl border border-card-border bg-white px-4 py-3 dark:bg-neutral-900"/>
      </label>
      <label className="text-sm font-medium sm:col-span-2">Avatar (ficheiro no armazenamento NegóMapa)
        <input type="url" value={avatar} onChange={e=>setAvatar(e.target.value)} maxLength={2048} placeholder="https://…/storage/v1/object/public/…" className="mt-1 w-full rounded-xl border border-card-border bg-white px-4 py-3 dark:bg-neutral-900"/>
      </label>
    </div>
    {mensagem && <p role="status" aria-live="polite" className={ok?'text-sm text-green-700 dark:text-green-300':'text-sm text-red-700 dark:text-red-300'}>{mensagem}</p>}
    <Button type="submit" loading={pendente} disabled={pendente}>Guardar alterações</Button>
  </form>
}