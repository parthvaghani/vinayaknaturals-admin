import { ReactNode } from 'react'
import { SearchProvider } from '@/context/search-context'
import { SidebarProvider } from '@/components/ui/sidebar'

interface POSLayoutProps {
  children: ReactNode
}

export function POSLayout({ children }: POSLayoutProps) {
  return (
    <SearchProvider>
      <SidebarProvider defaultOpen={false}>
        <div className='h-screen w-screen bg-gray-50'>{children}</div>
      </SidebarProvider>
    </SearchProvider>
  )
}
