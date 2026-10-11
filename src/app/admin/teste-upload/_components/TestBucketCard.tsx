'use client'

import { useState } from 'react'
import { FileUpload } from '@/components/ui/FileUpload'

interface TestBucketCardProps {
  bucket: 'empresas-logos' | 'profissionais-avatars' | 'servicos-imagens' | 'documentos-privados'
  folder: string
  label: string
}

export function TestBucketCard({ bucket, folder, label }: TestBucketCardProps) {
  const [result, setResult] = useState<{ url?: string; path?: string; error?: string } | null>(null)

  const handleUpload = (uploadResult: { url?: string; path?: string; error?: string }) => {
    setResult(uploadResult)
  }

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-[4px] border border-card-border dark:border-neutral-700 p-6 shadow-sm">
      <h3 className="text-lg font-heading font-semibold text-ink dark:text-cream mb-2">
        {label}
      </h3>
      <FileUpload
        bucket={bucket}
        folder={folder}
        onUpload={handleUpload}
      />
      <div className="mt-4 p-3 bg-neutral-50 dark:bg-neutral-900 rounded-[4px] text-xs font-mono">
        <p className="text-neutral-500 dark:text-neutral-400">Resultado do upload:</p>
        <pre id={`result-${bucket}`} className="mt-1 whitespace-pre-wrap text-neutral-700 dark:text-neutral-300">
          {result ? JSON.stringify(result, null, 2) : 'Aguardando upload...'}
        </pre>
      </div>
    </div>
  )
}