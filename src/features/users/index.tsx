import { useState, useMemo } from 'react';
import { Header } from '@/components/layout/header';
import { Main } from '@/components/layout/main';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { Search } from '@/components/search';
import { ThemeSwitch } from '@/components/theme-switch';
import { columns, type UserRow as TableUser } from './components/columns';
import { DataTable } from './components/data-table';
import TasksProvider from './context/tasks-context';
import { useUsersList, type User as ApiUser } from '@/hooks/use-users';

// import { ColumnDef } from '@tanstack/react-table'


export default function Products() {
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [search, setSearch] = useState<string>('');

  const { data, isLoading, isError, error, isFetching } = useUsersList({
    page,
    limit,
    searchTerm: search || undefined,
  });

  const users: TableUser[] = useMemo(() => {
    const raw: ApiUser[] = Array.isArray(data?.results)
      ? (data?.results as ApiUser[])
      : [];
    return raw.map((u) => ({
      _id: String(u?._id ?? u?.id ?? ''),
      email: String(u?.email ?? ''),
      phoneNumber: u?.phoneNumber ? String(u.phoneNumber) : undefined,
      role: String(u?.role ?? ''),
      isActive: Boolean(u?.isActive ?? false),
      profileCompleted: Boolean(u?.profileCompleted ?? false),
      createdAt: u?.createdAt ? String(u.createdAt) : undefined,
      user_details: u?.user_details
        ? {
            name: u.user_details?.name ? String(u.user_details.name) : undefined,
            country: u.user_details?.country ? String(u.user_details.country) : undefined,
            city: u.user_details?.city ? String(u.user_details.city) : undefined,
            zip: u.user_details?.zip ? String(u.user_details.zip) : undefined,
            address: u.user_details?.address ? String(u.user_details.address) : undefined,
            avatar: u.user_details?.avatar ? String(u.user_details.avatar) : undefined,
          }
        : undefined,
    }));
  }, [data]);
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
            <h2 className='text-2xl font-bold tracking-tight'>User List</h2>
            <p className='text-muted-foreground'>
              Manage your users and their roles here.
            </p>
          </div>
          <div className='flex items-center gap-6' />
        </div>

        <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12'>
          {isLoading || isFetching ? (
            <p>Loading Users...</p>
          ) : isError ? (
            <p className='text-red-500'>Error: {(error as Error)?.message ?? 'Failed to load users'}</p>
          ) : (
            <DataTable<TableUser>
              data={users}
              columns={columns}
              search={search}
              onSearchChange={(val) => {
                setSearch(val);
                setPage(1);
              }}
              pagination={{ page, limit, total: data?.total ?? users.length }}
              onPaginationChange={({ page: nextPage, limit: nextLimit }) => {
                setPage(nextPage);
                setLimit(nextLimit);
              }}
            />
          )}
        </div>
      </Main>

      {/* <ProductDialogs /> */}
    </TasksProvider>
  );
}
