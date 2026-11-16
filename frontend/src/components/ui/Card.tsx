import { forwardRef } from 'react'
import { cn } from '../../lib/utils'

interface CardProps {
  className?: string
  children: React.ReactNode
  header?: React.ReactNode
  footer?: React.ReactNode
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, header, footer }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl border bg-card text-card-foreground shadow',
          className
        )}
      >
        {header && (
          <div className="border-b border-muted p-6 pb-0">{header}</div>
        )}
        <div className="p-6">{children}</div>
        {footer && (
          <div className="border-t border-muted p-6 pt-0">{footer}</div>
        )}
      </div>
    )
  }
)
Card.displayName = 'Card'

const CardHeader = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-col space-y-1.5 p-6 not-first:pb-0', className)}
    {...props}
  >{children}</div>
)
CardHeader.displayName = 'CardHeader'

const CardTitle = ({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <h3
    className={cn('text-2xl font-semibold leading-none tracking-tight', className)}
    {...props}
  >{children}</h3>
)
CardTitle.displayName = 'CardTitle'

const CardDescription = ({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  >{children}</p>
)
CardDescription.displayName = 'CardDescription'

const CardContent = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('p-6 pt-0', className)} {...props}>
    {children}
  </div>
)
CardContent.displayName = 'CardContent'

const CardFooter = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  >
    {children}
  </div>
)
CardFooter.displayName = 'CardFooter'

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
}
