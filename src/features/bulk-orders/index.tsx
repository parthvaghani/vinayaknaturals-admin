import { useState, useMemo } from 'react';
import { Header } from '@/components/layout/header';
import { Main } from '@/components/layout/main';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { Search } from '@/components/search';
import { columns, type BulkOrderRow as TableBulkOrder } from './components/columns';
import { DataTable } from './components/data-table';
import BulkOrdersProvider from './context/bulk-orders-context';
import { useBulkOrdersList, type BulkOrder as ApiBulkOrder } from '@/hooks/use-bulk-orders';

export default function BulkOrders() {
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [search, setSearch] = useState<string>('');

  const { data, isLoading, isError, error, isFetching } = useBulkOrdersList({
    page,
    limit,
    searchTerm: search || undefined,
  });

  const bulkOrders: TableBulkOrder[] = useMemo(() => {
    const raw: ApiBulkOrder[] = Array.isArray(data?.results)
      ? (data?.results as ApiBulkOrder[])
      : [];
    return raw.map((order) => ({
      _id: String(order?._id ?? order?.id ?? ''),
      fullName: String(order?.fullName ?? ''),
      emailAddress: String(order?.emailAddress ?? ''),
      phoneNumber: order?.phoneNumber ? String(order.phoneNumber) : undefined,
      deliveryAddress: order?.deliveryAddress ? String(order.deliveryAddress) : undefined,
      products: order?.products || [],
      createdAt: order?.createdAt ? String(order.createdAt) : undefined,
      updatedAt: order?.updatedAt ? String(order.updatedAt) : undefined,
    }));
  }, [data]);

  return (
    <BulkOrdersProvider>
      <Header fixed>
        <Search />
        <div className='ml-auto flex items-center space-x-4'>
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className='mb-2 flex flex-wrap items-center justify-between space-y-2 gap-x-4'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Bulk Orders</h2>
            <p className='text-muted-foreground'>
              Manage bulk orders and customer requests here.
            </p>
          </div>
          <div className='flex items-center gap-6' />
        </div>

        <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12'>
          {isLoading || isFetching ? (
            <p>Loading Bulk Orders...</p>
          ) : isError ? (
            <p className='text-red-500'>Error: {(error as Error)?.message ?? 'Failed to load bulk orders'}</p>
          ) : (
            <DataTable<TableBulkOrder, unknown>
              data={bulkOrders}
              columns={columns}
              search={search}
              onSearchChange={(val) => {
                setSearch(val);
                setPage(1);
              }}
              pagination={{ page, limit, total: data?.total ?? bulkOrders.length }}
              onPaginationChange={({ page: nextPage, limit: nextLimit }) => {
                setPage(nextPage);
                setLimit(nextLimit);
              }}
            />
          )}
        </div>
      </Main>
    </BulkOrdersProvider>
  );
}
