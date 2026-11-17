'use client'
import {useState} from 'react'
import {ImageUpload} from '@/components/images/ImageUpload'
type Props={bucket:'profissionais-avatars'|'empresas-logos'|'clientes-avatars';avatar:string;portfolioBucket:'profissionais-portfolio'|'empresas-portfolio';portfolio:string[];avatarName:string;portfolioName:string}
export function ImageFields({bucket,avatar,portfolioBucket,portfolio,avatarName,portfolioName}:Props){const [a,setA]=useState(avatar?[avatar]:[]),[p,setP]=useState(portfolio.filter(x=>typeof x==='string'));return <div className="space-y-6"><input type="hidden" name={avatarName} value={a[0]??''}/><ImageUpload bucket={bucket} folder="avatar" value={a} onChange={setA} label="Foto de perfil / logótipo"/><input type="hidden" name={portfolioName} value={JSON.stringify(p)}/><ImageUpload bucket={portfolioBucket} folder="portfolio" value={p} onChange={setP} multiple label="Imagens do portfólio"/></div>}
