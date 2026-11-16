import * as React from 'react'
import { cn } from '../../lib/utils'

interface ProgressProps
  extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
  orientation?: 'horizontal' | 'vertical'
  indicatorClassName?: string
}

const Progress = React.forwardRef<
  HTMLDivElement,
  ProgressProps
>(({ className, value, orientation = 'horizontal', indicatorClassName, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'relative overflow-hidden bg-muted rounded-full transition-all',
        orientation === 'horizontal' && 'h-2 w-full',
        orientation === 'vertical' && 'h-full w-2',
        className
      )}
      {...props}
    >
      <div
        className={cn(
          'h-full w-0 bg-primary transition-all duration-300 ease-out',
          orientation === 'horizontal' && 'translate-x-0',
          orientation === 'vertical' && '',
          indicatorClassName
        )}
        style={{ transform: `scaleX(${value ?? 0})` }}
      />
    </div>
  )
})
Progress.displayName = 'Progress'

export { Progress }