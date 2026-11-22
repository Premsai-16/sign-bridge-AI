import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '../../lib/utils'
import { Link } from 'react-router-dom'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'success' | 'primary'
  size?: 'xs' | 'sm' | 'default' | 'lg' | 'xl'
  loading?: boolean
  asLink?: boolean
  to?: string
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', loading, children, disabled, asLink, to, ...props }, ref) => {
    if (asLink && to) {
      return (
        <Link
          to={to}
          className={cn(
            'inline-flex items-center justify-center rounded-xl gap-2 text-sm font-semibold transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:pointer-events-none disabled:opacity-50',
            {
              'bg-primary text-primary-foreground hover:bg-primary/90': variant === 'default',
              'bg-secondary text-secondary-foreground hover:bg-secondary/80': variant === 'secondary',
              'border border-input bg-background hover:bg-accent hover:text-accent-foreground': variant === 'outline',
              'hover:bg-accent hover:text-accent-foreground': variant === 'ghost',
              'bg-destructive text-destructive-foreground hover:bg-destructive/90': variant === 'destructive',
              'bg-success text-success-foreground hover:bg-success/90': variant === 'success',
              'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md': variant === 'primary',
            },
            {
              'min-h-11 px-3 text-xs': size === 'xs',
              'min-h-11 px-4': size === 'sm',
              'min-h-11 px-4 py-2': size === 'default',
              'h-11 px-6': size === 'lg',
              'h-12 px-8 text-base': size === 'xl',
            },
            className
          )}
        >
          {children}
        </Link>
      )
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center rounded-xl gap-2 text-sm font-semibold transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          {
            'bg-primary text-primary-foreground hover:bg-primary/90': variant === 'default',
            'bg-secondary text-secondary-foreground hover:bg-secondary/80': variant === 'secondary',
            'border border-input bg-background hover:bg-accent hover:text-accent-foreground': variant === 'outline',
            'hover:bg-accent hover:text-accent-foreground': variant === 'ghost',
            'bg-destructive text-destructive-foreground hover:bg-destructive/90': variant === 'destructive',
            'bg-success text-success-foreground hover:bg-success/90': variant === 'success',
            'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md': variant === 'primary',
          },
          {
            'min-h-11 px-3 text-xs': size === 'xs',
            'min-h-11 px-4': size === 'sm',
            'min-h-11 px-4 py-2': size === 'default',
            'h-11 px-6': size === 'lg',
            'h-12 px-8 text-base': size === 'xl',
          },
          className
        )}
        {...props}
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2">
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
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
            {children}
          </div>
        ) : (
          children
        )}
      </button>
    )
  }
)
Button.displayName = 'Button'

export { Button }