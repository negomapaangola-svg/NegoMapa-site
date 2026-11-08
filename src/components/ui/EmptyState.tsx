import type { ReactNode } from 'react';
import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action, className, ...props }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-10 text-center',
        className
      )}
      {...props}
    >
      <h3 className="text-base font-semibold text-neutral-900">{title}</h3>
      {description && <p className="mx-auto mt-2 max-w-md text-sm text-neutral-500">{description}</p>}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}
