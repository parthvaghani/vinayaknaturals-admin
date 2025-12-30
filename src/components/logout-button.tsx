import { useLogout } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'

interface LogoutButtonProps {
  variant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  children?: React.ReactNode
}

export function LogoutButton({
  variant = 'outline',
  size = 'default',
  className,
  children = 'Logout',
}: LogoutButtonProps) {
  const logoutMutation = useLogout()

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={() => logoutMutation.mutate()}
      disabled={logoutMutation.isPending}
    >
      {logoutMutation.isPending ? 'Logging out...' : children}
    </Button>
  )
}
