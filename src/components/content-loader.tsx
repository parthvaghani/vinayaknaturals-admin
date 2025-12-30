import { useIsFetching } from '@tanstack/react-query'
import { useRouterState } from '@tanstack/react-router'
import { cn } from '@/lib/utils'

interface ContentLoaderProps {
  active?: boolean
  className?: string
}

export function ContentLoader({ active, className }: ContentLoaderProps) {
  const routerState = useRouterState()
  const numFetching = useIsFetching()

  const isActive =
    typeof active === 'boolean'
      ? active
      : routerState.status === 'pending' || numFetching > 0

  return (
    <div
      className={cn(
        'bg-background/60 pointer-events-auto absolute inset-0 z-50 flex items-center justify-center backdrop-blur-sm',
        !isActive && 'hidden',
        className
      )}
    >
      <div className='flex flex-col items-center gap-3'>
        <img
          src='/images/logo.png'
          alt='Logo'
          className='h-18 w-auto animate-bounce object-contain'
        />
      </div>
    </div>
  )
}
