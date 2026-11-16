import * as React from 'react'
import { cn } from '../../lib/utils'

interface SwitchProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ className,checked = false, onCheckedChange, ...props }, ref) => {
    const handleClick = () => {
      if (onCheckedChange) {
        onCheckedChange(!checked)
      }
    }

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-full transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          'data-[state=checked]:bg-primary data-[state=unchecked]:bg-input',
          'h-5 w-9 rounded-full',
          className
        )}
        onClick={handleClick}
        data-state={checked ? 'checked' : 'unchecked'}
        {...props}
      >
        <div
          className={cn(
            'pointer-events-none relative h-4 w-4 rounded-full bg-background shadow',
            'transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0.5'
          )}
        />
      </button>
    )
  }
)
Switch.displayName = 'Switch'

export { Switch }