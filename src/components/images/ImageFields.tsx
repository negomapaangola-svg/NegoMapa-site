'use client'
import {useState} from 'react'
import {ImageUpload} from '@/components/images/ImageUpload'

type Bucket='profissionais-avatars'|'empresas-logos'|'clientes-avatars'
type PortfolioBucket='profissionais-portfolio'|'empresas-portfolio'
type Props={bucket:Bucket;avatar:string;avatarName:string;portfolioBucket?:PortfolioBucket;portfolio?:string[];portfolioName?:string}

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
export function ImageFields({bucket,avatar,avatarName,portfolioBucket,portfolio=[],portfolioName}:Props){
  const [a,setA]=useState(avatar?[normalize(bucket,avatar)]:[])
  const [p,setP]=useState(portfolio.filter(x=>typeof x==='string').map(x=>normalize(portfolioBucket??'profissionais-portfolio',x)).filter(Boolean))
  return <div className="space-y-6">
    <input type="hidden" name={avatarName} value={a[0]??''}/>
    <ImageUpload bucket={bucket} folder="avatar" value={a} onChange={setA} label="Foto de perfil / logótipo"/>
    {portfolioBucket&&portfolioName&&<><input type="hidden" name={portfolioName} value={JSON.stringify(p)}/><ImageUpload bucket={portfolioBucket} folder="portfolio" value={p} onChange={setP} multiple label="Imagens do portfólio"/></>}
  </div>
}
