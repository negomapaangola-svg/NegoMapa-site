'use client';
import { ErrorState } from '@/components/ui/CatalogComponents';
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="mx-auto max-w-7xl px-4 py-12"><ErrorState onRetry={reset} /></main>;
}
