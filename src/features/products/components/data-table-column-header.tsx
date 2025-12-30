import { ArrowDownIcon, ArrowUpIcon } from '@radix-ui/react-icons'
import { Column } from '@tanstack/react-table'
import { cn } from '@/lib/utils'

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>
  title: string
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={cn('text-sm font-medium', className)}>{title}</div>
  }

  return (
    <div
      className={cn(
        'flex cursor-pointer items-center space-x-1 select-none',
        className
      )}
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
    >
      <span>{title}</span>
      {column.getIsSorted() === 'desc' ? (
        <ArrowDownIcon className='text-muted-foreground h-4 w-4' />
      ) : column.getIsSorted() === 'asc' ? (
        <ArrowUpIcon className='text-muted-foreground h-4 w-4' />
      ) : null}
    </div>
  )
}
