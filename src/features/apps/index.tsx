import { useProducts } from '@/hooks/use-products'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { columns } from './components/columns'
import { DataTable } from './components/data-table'
import { ProductsPrimaryButtons } from './components/products-primary-buttons'
import TasksProvider from './context/tasks-context'
import type { Product } from './data/schema'
import { ColumnDef } from '@tanstack/react-table'


export default function Product() {
  const { data, isLoading, isError, error } = useProducts()
  return (
    <TasksProvider>
      <Header fixed>
        <Search />
        <div className='ml-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className='mb-2 flex flex-wrap items-center justify-between space-y-2 gap-x-4'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Products</h2>
            <p className='text-muted-foreground'>
              Manage and view all products in one place!
            </p>
          </div>
          <ProductsPrimaryButtons />
          
        </div>

        <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12'>
  {isLoading ? (
    <p>Loading Products...</p>
  ) : isError ? (
    <p className='text-red-500'>Error: {(error as Error).message}</p>
  ) : (
    <DataTable
      data={data as unknown as Product[]}
      columns={columns as unknown as ColumnDef<Product, unknown>[]}
    />
  )}
</div>
      </Main>

      {/* <ProductDialogs /> */}
    </TasksProvider>
  )
}
