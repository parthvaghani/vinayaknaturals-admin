import { useState, useMemo } from 'react'
import {
  usePartnershipRequestsList,
  type PartnershipRequest as ApiPartnershipRequest,
} from '@/hooks/use-partnership-requests'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import {
  columns,
  type PartnershipRequestRow as TablePartnershipRequest,
} from './components/columns'
import { DataTable } from './components/data-table'
import PartnershipRequestsProvider from './context/partnership-requests-context'

export default function PartnershipRequests() {
  const [page, setPage] = useState<number>(1)
  const [limit, setLimit] = useState<number>(10)
  const [search, setSearch] = useState<string>('')

  const { data, isLoading, isError, error, isFetching } =
    usePartnershipRequestsList({
      page,
      limit,
      searchTerm: search || undefined,
    })

  const partnershipRequests: TablePartnershipRequest[] = useMemo(() => {
    const raw: ApiPartnershipRequest[] = Array.isArray(data?.results)
      ? (data?.results as ApiPartnershipRequest[])
      : []
    return raw.map((pr) => ({
      _id: String(pr?._id ?? pr?.id ?? ''),
      name: String(pr?.fullName ?? ''),
      email: String(pr?.emailAddress ?? ''),
      phoneNumber: pr?.phoneNumber ? String(pr.phoneNumber) : undefined,
      company: pr?.additionalInformation
        ? String(pr.additionalInformation)
        : undefined,
      message: pr?.additionalInformation
        ? String(pr.additionalInformation)
        : undefined,
      status: 'pending', // Default status since it's not in the API response
      createdAt: pr?.createdAt ? String(pr.createdAt) : undefined,
      updatedAt: pr?.updatedAt ? String(pr.updatedAt) : undefined,
    }))
  }, [data])

  return (
    <PartnershipRequestsProvider>
      <Header fixed>
        <Search />
        <div className='ml-auto flex items-center space-x-4'>
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className='mb-2 flex flex-wrap items-center justify-between space-y-2 gap-x-4'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>
              Partnership Requests
            </h2>
            <p className='text-muted-foreground'>
              Manage partnership requests and applications here.
            </p>
          </div>
          <div className='flex items-center gap-6' />
        </div>

        <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12'>
          {isLoading || isFetching ? (
            <p>Loading Partnership Requests...</p>
          ) : isError ? (
            <p className='text-red-500'>
              Error:{' '}
              {(error as Error)?.message ??
                'Failed to load partnership requests'}
            </p>
          ) : (
            <DataTable<TablePartnershipRequest, any> // eslint-disable-line @typescript-eslint/no-explicit-any
              data={partnershipRequests}
              columns={columns}
              search={search}
              onSearchChange={(val) => {
                setSearch(val)
                setPage(1)
              }}
              pagination={{
                page,
                limit,
                total: data?.total ?? partnershipRequests.length,
              }}
              onPaginationChange={({ page: nextPage, limit: nextLimit }) => {
                setPage(nextPage)
                setLimit(nextLimit)
              }}
            />
          )}
        </div>
      </Main>
    </PartnershipRequestsProvider>
  )
}
