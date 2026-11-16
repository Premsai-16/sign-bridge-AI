import { forwardRef } from 'react'
import { cn } from '../../lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, id: propsId, label, error, helperText, ...props }, ref) => {
    const inputId = propsId || `input-${Math.random().toString(36).slice(2, 11)}`

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium mb-1">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          type={type}
          className={cn(
            'flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm transition-colors',
            'file:border-0 file:bg-transparent file:text-sm file:font-medium',
            'placeholder:text-muted-foreground focus-visible:outline-none',
            'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-destructive focus-visible:ring-destructive',
            className
          )}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-description` : undefined}
          {...props}
        />
        {helperText && !error && (
          <p id={`${inputId}-description`} className="mt-1 text-sm text-muted-foreground">
            {helperText}
          </p>
        )}
        {error && (
          <p id={`${inputId}-error`} className="mt-1 text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input }