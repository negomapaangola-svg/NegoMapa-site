'use client'
export const MAX_IMAGE_BYTES=10*1024*1024
const TYPES=['image/jpeg','image/png','image/webp']
export type ProcessedImage={file:File;mimeType:'image/webp'|'image/jpeg';width:number;height:number;size:number}
export async function processImage(input:File):Promise<ProcessedImage>{
 if(!TYPES.includes(input.type))throw new Error('Formato inválido. Seleccione JPG, JPEG, PNG ou WebP.')
 if(input.size>MAX_IMAGE_BYTES)throw new Error('O ficheiro original excede 10 MB.')
 if(!input.size)throw new Error('O ficheiro está vazio.')
 const bitmap=await createImageBitmap(input,{imageOrientation:'from-image'})
 try{const scale=Math.min(1,1600/Math.max(bitmap.width,bitmap.height)),width=Math.max(1,Math.round(bitmap.width*scale)),height=Math.max(1,Math.round(bitmap.height*scale)),canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)throw new Error('Não foi possível processar a imagem.');ctx.drawImage(bitmap,0,0,width,height);const encode=(type:string)=>new Promise<Blob|null>(r=>canvas.toBlob(r,type,.8));let blob=await encode('image/webp'),mimeType:'image/webp'|'image/jpeg'='image/webp';if(!blob||blob.type!=='image/webp'){blob=await encode('image/jpeg');mimeType='image/jpeg'}if(!blob)throw new Error('O navegador não conseguiu comprimir a imagem.');const file=new File([blob],`imagem-${Date.now()}.${mimeType==='image/webp'?'webp':'jpg'}`,{type:mimeType,lastModified:Date.now()});return{file,mimeType,width,height,size:blob.size}}finally{bitmap.close()}
}
