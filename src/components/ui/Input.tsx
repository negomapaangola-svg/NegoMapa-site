'use client';

import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className="space-y-2">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-neutral-900">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full rounded-xl border bg-white px-4 py-3 text-neutral-900 placeholder:text-neutral-400',
            'focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500',
            error ? 'border-red-500' : 'border-neutral-200',
            className
          )}
          aria-invalid={Boolean(error)}
          {...props}
        />
        {hint && !error && <p className="text-xs text-neutral-500">{hint}</p>}
        {error && <p className="text-xs font-medium text-red-600">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
