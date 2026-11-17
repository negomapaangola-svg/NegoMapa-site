'use client'
import {useState} from 'react'
import {ImageUpload} from '@/components/images/ImageUpload'

type Bucket='profissionais-avatars'|'empresas-logos'|'clientes-avatars'
type PortfolioBucket='profissionais-portfolio'|'empresas-portfolio'
type Props={bucket:Bucket;avatar:string;avatarName:string;portfolioBucket?:PortfolioBucket;portfolio?:unknown[];portfolioName?:string}

function normalize(bucket:Bucket|PortfolioBucket,value:string):string{
  if(!value)return ''
  if(value.startsWith('/api/imagens/'))return value
  if(value.startsWith('http')){
    try{
      const pathname=new URL(value).pathname
      const marker='/storage/v1/object/'
      const index=pathname.indexOf(marker)
      if(index>=0){
        const parts=pathname.slice(index+marker.length).split('/')
        if(parts[0]==='public'||parts[0]==='sign')parts.shift()
        if(parts.shift()!==bucket)return ''
        const path=parts.map(decodeURIComponent).join('/')
        return bucket==='clientes-avatars'?path:'/api/imagens/'+bucket+'/'+path.split('/').map(encodeURIComponent).join('/')
      }
    }catch{return ''}
    return ''
  }
  return bucket==='clientes-avatars'?value:'/api/imagens/'+bucket+'/'+value.split('/').map(encodeURIComponent).join('/')
}
function imageEntry(item:unknown,bucket:PortfolioBucket):{ref:string;key:string}|null{
  if(typeof item==='string'){
    const ref=normalize(bucket,item)
    return ref?{ref,key:''}:null
  }
  if(!item||typeof item!=='object')return null
  const record=item as Record<string,unknown>
  for(const key of ['imagem_url','image_url','foto_url','url_imagem','url_projeto']){
    if(typeof record[key]==='string'){
      const ref=normalize(bucket,record[key] as string)
      if(ref)return {ref,key}
    }
  }
  return null
}
export function ImageFields({bucket,avatar,avatarName,portfolioBucket,portfolio=[],portfolioName}:Props){
  const [a,setA]=useState(avatar?[normalize(bucket,avatar)]:[])
  const [portfolioData,setPortfolioData]=useState<unknown[]>(portfolio)
  const [p,setP]=useState<string[]>(portfolioBucket?portfolio.flatMap(item=>{
    const entry=imageEntry(item,portfolioBucket)
    return entry?[entry.ref]:[]
  }):[])
  const changePortfolio=(next:string[])=>{
    if(!portfolioBucket)return
    const entries=portfolioData.map(item=>({item,entry:imageEntry(item,portfolioBucket)}))
    const preserved=entries.filter(x=>!x.entry).map(x=>x.item)
    const images=next.map(ref=>{
      const previous=entries.find(x=>x.entry?.ref===ref)
      if(!previous)return {imagem_url:ref}
      if(typeof previous.item==='string')return ref
      return {...(previous.item as Record<string,unknown>),[previous.entry?.key||'imagem_url']:ref}
    })
    setP(next)
    setPortfolioData([...preserved,...images])
  }
  return <div className="space-y-6">
    <input type="hidden" name={avatarName} value={a[0]??''}/>
    <ImageUpload bucket={bucket} folder="avatar" value={a} onChange={setA} label="Foto de perfil / logótipo"/>
    {portfolioBucket&&portfolioName&&<><input type="hidden" name={portfolioName} value={JSON.stringify(portfolioData)}/><ImageUpload bucket={portfolioBucket} folder="portfolio" value={p} onChange={changePortfolio} multiple label="Imagens do portfólio"/></>}
  </div>
}
