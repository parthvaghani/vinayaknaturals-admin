import { useGetUsers } from '@/hooks/use-auth'
import { UsersDialogs } from './components/users-dialogs'
import UsersProvider from './context/users-context'
import { Main } from '@/components/layout/main'
import { UsersTable } from './components/users-table'
import { UsersPrimaryButtons } from './components/users-primary-buttons'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Header } from '@/components/layout/header'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { columns } from './components/users-columns'

export default function Users() {
  const { data: userList = [], isLoading, isError } = useGetUsers()

  if (isLoading) return <div>Loading users...</div>
  if (isError) return <div>Failed to load users</div>

  return (
    <UsersProvider>
      <Header fixed>
        <Search />
        <div className='ml-auto flex items-center space-x-4'>   
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className='mb-2 flex flex-wrap items-center justify-between space-y-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>User List</h2>
            <p className='text-muted-foreground'>
              Manage your users and their roles here.
            </p>
          </div>
          <UsersPrimaryButtons />
        </div>
        <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12'>
          <UsersTable data={userList} columns={columns} />
        </div>
      </Main>

      <UsersDialogs />  
    </UsersProvider>
  )
}
