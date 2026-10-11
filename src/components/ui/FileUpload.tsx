'use client'

import { useState, useCallback } from 'react'
import { uploadFile } from '@/lib/actions/upload'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { cn } from '@/lib/utils'

type AllowedBucket =
  | 'empresas-logos'
  | 'profissionais-avatars'
  | 'servicos-imagens'
  | 'documentos-privados'

type UploadStatus = 'idle' | 'loading' | 'success' | 'error'

interface FileUploadProps {
  bucket: AllowedBucket
  folder: string
  onUpload: (result: { url?: string; path?: string }) => void
  label?: string
  accept?: string
}

const bucketConfig: Record<AllowedBucket, { allowedTypes: string[]; maxSize: number; isPublic: boolean }> = {
  'empresas-logos': {
    allowedTypes: ['image/png', 'image/jpeg', 'image/webp'],
    maxSize: 2 * 1024 * 1024,
    isPublic: true,
  },
  'profissionais-avatars': {
    allowedTypes: ['image/png', 'image/jpeg', 'image/webp'],
    maxSize: 1 * 1024 * 1024,
    isPublic: true,
  },
  'servicos-imagens': {
    allowedTypes: ['image/png', 'image/jpeg', 'image/webp'],
    maxSize: 5 * 1024 * 1024,
    isPublic: true,
  },
  'documentos-privados': {
    allowedTypes: ['application/pdf', 'image/png', 'image/jpeg'],
    maxSize: 10 * 1024 * 1024,
    isPublic: false,
  },
}

const bucketLabels: Record<AllowedBucket, string> = {
  'empresas-logos': 'Logótipo da empresa',
  'profissionais-avatars': 'Avatar do profissional',
  'servicos-imagens': 'Imagem do serviço',
  'documentos-privados': 'Documento privado',
}

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function FileUpload({ bucket, folder, onUpload, label, accept }: FileUploadProps) {
  const config = bucketConfig[bucket]
  const defaultLabel = label || `Carregar ${bucketLabels[bucket].toLowerCase()}`
  const defaultAccept = accept || config.allowedTypes.join(',')

  const [status, setStatus] = useState<UploadStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const validateFile = useCallback((file: File): string | null => {
    if (!config.allowedTypes.includes(file.type)) {
      return `Tipo de ficheiro não permitido. Tipos aceites: ${config.allowedTypes.map(t => t.split('/')[1]).join(', ')}`
    }
    if (file.size > config.maxSize) {
      return `Ficheiro excede o tamanho máximo de ${formatBytes(config.maxSize)}`
    }
    return null
  }, [config])

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      setStatus('error')
      event.currentTarget.value = ''
      return
    }

    setSelectedFile(file)
    setFileName(file.name)
    setError(null)
    setStatus('idle')

    if (config.isPublic && file.type.startsWith('image/')) {
      const objectUrl = URL.createObjectURL(file)
      setPreviewUrl(objectUrl)
    }
  }, [config, validateFile])

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return

    setStatus('loading')
    setError(null)

    try {
      const result = await uploadFile(bucket, folder, selectedFile)

      if ('error' in result) {
        setError(result.error)
        setStatus('error')
        return
      }

      setStatus('success')
      onUpload(result)

      if ('url' in result && config.isPublic) {
        setPreviewUrl(result.url)
      }
    } catch {
      setError('Erro inesperado ao fazer upload')
      setStatus('error')
    }
  }, [bucket, folder, selectedFile, config.isPublic, onUpload])

  const handleRemove = useCallback(() => {
    setSelectedFile(null)
    setFileName(null)
    setPreviewUrl(null)
    setError(null)
    setStatus('idle')
  }, [])

  const isPublicBucket = config.isPublic
  const showPreview = isPublicBucket && previewUrl && (status === 'success' || status === 'idle')

  return (
    <Card variant="liquid" padding="md">
      <div className="space-y-4">
        <div>
          <label
            htmlFor={`file-upload-${bucket}`}
            className={cn(
              'block cursor-pointer transition-colors',
              status === 'loading' && 'opacity-50 cursor-wait'
            )}
          >
            <div
              className={cn(
                'relative rounded-[4px] border-2 border-dashed p-6 text-center transition-all duration-200',
                status === 'idle' && selectedFile && 'border-orange-500 bg-orange-50 dark:bg-orange-900/20',
                status === 'idle' && !selectedFile && 'border-neutral-300 dark:border-neutral-700 hover:border-orange-500',
                status === 'loading' && 'border-orange-500 bg-orange-50 dark:bg-orange-900/20',
                status === 'success' && 'border-green-500 bg-green-50 dark:bg-green-900/20',
                status === 'error' && 'border-red-500 bg-red-50 dark:bg-red-900/20'
              )}
            >
              <input
                id={`file-upload-${bucket}`}
                type="file"
                accept={defaultAccept}
                onChange={handleFileChange}
                disabled={status === 'loading'}
                className="sr-only"
                aria-describedby={`file-upload-hint-${bucket} ${error ? `file-upload-error-${bucket}` : ''}`}
              />

              {showPreview && previewUrl && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <img
                    src={previewUrl}
                    alt={fileName || 'Preview'}
                    className="max-w-full max-h-48 object-contain rounded-[4px]"
                  />
                </div>
              )}

              {!showPreview && (
                <div className="space-y-3">
                  <div className="flex flex-col items-center gap-2">
                    <svg
                      className="w-10 h-10 text-neutral-400 dark:text-neutral-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <span className="font-heading font-semibold text-neutral-900 dark:text-neutral-50">
                      {defaultLabel}
                    </span>
                  </div>

                  <p id={`file-upload-hint-${bucket}`} className="text-sm text-neutral-500 dark:text-neutral-400">
                    {config.allowedTypes.map(t => `.${t.split('/')[1]}`).join(', ')} • até {formatBytes(config.maxSize)}
                  </p>

                  {selectedFile && status === 'idle' && (
                    <div className="flex items-center justify-center gap-3 text-sm">
                      <span className="text-neutral-700 dark:text-neutral-300">{fileName}</span>
                      <span className="text-neutral-500 dark:text-neutral-400">{formatBytes(selectedFile.size)}</span>
                    </div>
                  )}
                </div>
              )}

              {status === 'loading' && (
                <div className="flex flex-col items-center gap-3">
                  <svg
                    className="animate-spin w-8 h-8 text-orange-500"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span className="font-heading font-medium text-neutral-900 dark:text-neutral-50">A carregar...</span>
                </div>
              )}

              {status === 'success' && !showPreview && (
                <div className="flex flex-col items-center gap-2 text-green-600 dark:text-green-400">
                  <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-heading font-medium">Enviado com sucesso</span>
                  {fileName && <span className="text-sm text-neutral-500 dark:text-neutral-400">{fileName}</span>}
                </div>
              )}

              {status === 'error' && (
                <div className="flex flex-col items-center gap-2 text-red-600 dark:text-red-400">
                  <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="font-heading font-medium">Erro no upload</span>
                  {error && <p id={`file-upload-error-${bucket}`} className="text-sm text-center">{error}</p>}
                </div>
              )}
            </div>
          </label>
        </div>

        {(selectedFile && status === 'idle') || status === 'success' || status === 'error') && (
          <div className="flex items-center gap-3">
            {status === 'idle' && selectedFile && (
              <Button
                variant="primary"
                onClick={handleUpload}
                disabled={status === 'loading'}
                className="flex-1"
              >
                Confirmar upload
              </Button>
            )}

            {(status === 'success' || status === 'error') && (
              <Button variant="outline" onClick={handleRemove} className="flex-1">
                {status === 'success' ? 'Enviar outro' : 'Tentar novamente'}
              </Button>
            )}
          </div>
        )}

        <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center">
          {isPublicBucket
            ? 'O ficheiro será público após o upload.'
            : 'O ficheiro será armazenado de forma privada. Não será gerada URL pública.'
          }
        </p>
      </div>
    </Card>
  )
}