'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase-browser'
import { processImage } from '@/lib/image-processing'

type Bucket='profissionais-avatars'|'empresas-logos'|'profissionais-portfolio'|'empresas-portfolio'|'clientes-avatars'
type Props={bucket:Bucket;folder:'avatar'|'portfolio';value:string[];onChange:(v:string[])=>void;multiple?:boolean;label:string}
type Pending={id:string;url:string;file:File}

function pathOf(value:string,bucket:Bucket):string {
  if(value.startsWith('/api/imagens/')){
    const parts=value.split('/').slice(3)
    if(parts.shift()!==bucket)return ''
    return parts.map(decodeURIComponent).join('/')
  }
  if(!value.startsWith('http'))return value
  try{
    const pathname=new URL(value).pathname
    const marker='/storage/v1/object/'
    const index=pathname.indexOf(marker)
    if(index<0)return ''
    const parts=pathname.slice(index+marker.length).split('/')
    if(parts[0]==='public'||parts[0]==='sign')parts.shift()
    if(parts.shift()!==bucket)return ''
    return parts.map(decodeURIComponent).join('/')
  }catch{return ''}
}
function publicRoute(bucket:Bucket,path:string){return '/api/imagens/'+bucket+'/'+path.split('/').map(encodeURIComponent).join('/')}

export function ImageUpload({bucket,folder,value,onChange,multiple=false,label}:Props){
  const supabase=useMemo(()=>createBrowserSupabaseClient(),[])
  const input=useRef<HTMLInputElement>(null)
  const [pending,setPending]=useState<Pending[]>([])
  const [signed,setSigned]=useState<Record<string,string>>({})
  const [busy,setBusy]=useState(false)
  const [progress,setProgress]=useState(0)
  const [error,setError]=useState('')
  const [notice,setNotice]=useState('')

  const select=async(files:FileList|File[])=>{
    setError('');setNotice('')
    const selected=Array.from(files)
    if(!multiple)selected.splice(1)
    if(value.length+pending.length+selected.length>12){setError('Pode carregar até 12 imagens.');return}
    setBusy(true)
    try{
      const next:Pending[]=[]
      for(const file of selected){
        const result=await processImage(file)
        next.push({id:crypto.randomUUID(),url:URL.createObjectURL(result.file),file:result.file})
      }
      setPending(old=>[...old,...next])
    }catch(e){setError(e instanceof Error?e.message:'Não foi possível processar a imagem.')}
    finally{setBusy(false);if(input.current)input.current.value=''}
  }

  const send=(file:File,path:string,cb:(n:number)=>void)=>new Promise<void>(async(resolve,reject)=>{
    const {data}=await supabase.auth.getSession()
    const base=process.env.NEXT_PUBLIC_SUPABASE_URL
    const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const token=data.session?.access_token
    if(!base||!key||!token){reject(new Error('Sessão expirada.'));return}
    const xhr=new XMLHttpRequest()
    xhr.open('POST',base+'/storage/v1/object/'+bucket+'/'+path)
    xhr.setRequestHeader('Authorization','Bearer '+token)
    xhr.setRequestHeader('apikey',key)
    xhr.setRequestHeader('Content-Type',file.type)
    xhr.setRequestHeader('Cache-Control','max-age=31536000, immutable')
    xhr.upload.onprogress=e=>{if(e.lengthComputable)cb(Math.round(e.loaded/e.total*100))}
    xhr.onload=()=>xhr.status>=200&&xhr.status<300?resolve():reject(new Error('Upload recusado. Verifique permissões e tamanho.'))
    xhr.onerror=()=>reject(new Error('Falha de rede durante o upload.'))
    xhr.send(file)
  })

  const confirm=async()=>{
    if(!pending.length)return
    setBusy(true);setError('');setProgress(0)
    const added:string[]=[]
    try{
      const {data}=await supabase.auth.getUser()
      if(!data.user)throw new Error('Sessão expirada.')
      for(let i=0;i<pending.length;i++){
        const item=pending[i]
        const ext=item.file.type==='image/webp'?'webp':'jpg'
        const path=data.user.id+'/'+folder+'/'+crypto.randomUUID()+'.'+ext
        await send(item.file,path,n=>setProgress(Math.round((i*100+n)/pending.length)))
        added.push(bucket==='clientes-avatars'?path:publicRoute(bucket,path))
      }
      onChange([...value,...added])
      pending.forEach(x=>URL.revokeObjectURL(x.url))
      setPending([])
      setNotice('Upload concluído. Guarde as alterações do perfil para confirmar as referências.')
    }catch(e){setError(e instanceof Error?e.message:'Erro no upload.')}
    finally{setBusy(false)}
  }

  const removeExisting=(index:number)=>{
    const next=value.filter((_,i)=>i!==index)
    onChange(next)
    setNotice('Referência removida. O ficheiro só será apagado depois de guardar e confirmar que não é partilhado.')
  }
  const removePending=(id:string)=>{
    setPending(old=>{const item=old.find(x=>x.id===id);if(item)URL.revokeObjectURL(item.url);return old.filter(x=>x.id!==id)})
  }
  const move=(index:number,direction:number)=>{
    const target=index+direction
    if(target<0||target>=value.length)return
    const next=[...value];[next[index],next[target]]=[next[target],next[index]];onChange(next)
  }

  useEffect(()=>{
    let active=true
    void (async()=>{
      const {data}=await supabase.auth.getUser()
      if(!data.user)return
      const paths=value.map(v=>pathOf(v,bucket)).filter(path=>path.startsWith(data.user.id+'/'))
      const pairs=await Promise.all(paths.map(async path=>{
        const {data:result}=await supabase.storage.from(bucket).createSignedUrl(path,600)
        return result?.signedUrl?([path,result.signedUrl] as const):null
      }))
      if(active)setSigned(Object.fromEntries(pairs.filter((x):x is readonly [string,string]=>Boolean(x))))
    })()
    return()=>{active=false}
  },[bucket,value,supabase])

  const shown=value.map((v,index)=>{
    const path=pathOf(v,bucket)
    const url=bucket==='clientes-avatars'?(signed[path]??''):(signed[path]??(v.startsWith('/api/imagens/')?v:publicRoute(bucket,path)))
    return {key:'saved-'+index,url,index}
  })
  return <section className="space-y-3" aria-label={label}>
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div><h3 className="text-sm font-semibold">{label}</h3><p className="text-xs text-slate-500">JPG, PNG ou WebP · até 10 MB · máximo 1600 px</p></div>
      <button type="button" onClick={()=>input.current?.click()} disabled={busy||(!multiple&&(value.length+pending.length>0))} className="min-h-11 rounded-lg border px-4 text-sm">Seleccionar imagem</button>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple={multiple} className="sr-only" onChange={e=>e.target.files&&void select(e.target.files)}/>
    </div>
    <div onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();if(!busy)void select(e.dataTransfer.files)}} className="flex min-h-28 items-center justify-center rounded-xl border-2 border-dashed border-slate-300 p-4 text-center text-sm text-slate-500">Arraste imagens para aqui ou seleccione no dispositivo.</div>
    {(shown.length>0||pending.length>0)&&<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {shown.map((item,i)=><div key={item.key} className="overflow-hidden rounded-xl border">
        {item.url?<img src={item.url} alt={'Pré-visualização '+(i+1)} className="h-32 w-full object-cover"/>:<div className="flex h-32 items-center justify-center text-xs text-slate-500">A preparar pré-visualização…</div>}
        <div className="flex items-center justify-between p-1">
          {multiple&&<><button type="button" className="min-h-11 min-w-11" aria-label="Mover para cima" onClick={()=>move(item.index,-1)}>↑</button><button type="button" className="min-h-11 min-w-11" aria-label="Mover para baixo" onClick={()=>move(item.index,1)}>↓</button></>}
          <button type="button" className="min-h-11 px-3 text-sm text-red-700" onClick={()=>removeExisting(item.index)}>Remover</button>
        </div>
      </div>)}
      {pending.map((item,i)=><div key={item.id} className="overflow-hidden rounded-xl border"><img src={item.url} alt={'Nova imagem '+(i+1)} className="h-32 w-full object-cover"/><button type="button" className="min-h-11 w-full px-3 text-sm text-red-700" onClick={()=>removePending(item.id)}>Remover</button></div>)}
    </div>}
    {pending.length>0&&<button type="button" onClick={()=>void confirm()} disabled={busy} className="min-h-11 w-full rounded-lg bg-orange-700 px-4 text-sm font-semibold text-white disabled:opacity-50">{busy?'A carregar…':'Confirmar upload'}</button>}
    {busy&&<div role="status" className="space-y-1"><div className="h-2 rounded bg-slate-200"><div className="h-2 rounded bg-orange-600" style={{width:progress+'%'}}/></div><p className="text-xs text-slate-500">Progresso: {progress}%</p></div>}
    {error&&<p role="alert" className="text-sm text-red-700">{error}</p>}
    {notice&&<p role="status" className="text-sm text-emerald-700">{notice}</p>}
  </section>
}
