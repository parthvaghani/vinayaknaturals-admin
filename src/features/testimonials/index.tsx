import { Header } from '@/components/layout/header';
import { Main } from '@/components/layout/main';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { Search } from '@/components/search';
import { ThemeSwitch } from '@/components/theme-switch';
import { DataTable } from './components/data-table';
import { columns, type Testimonial } from './components/columns';
import { useTestimonialsList } from '@/hooks/use-testimonials';
import { TestimonialsPrimaryButtons } from './components/testimonials-primary-buttons';
import { useState, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Testimonials() {
    const [status, setStatus] = useState<'all' | 'visible' | 'hidden'>('all');
    const visible = useMemo(() => {
        if (status === 'visible') return true;
        if (status === 'hidden') return false;
        return undefined;
    }, [status]);

    const { data, isLoading, isError, error, isFetching } = useTestimonialsList({
        page: 1,
        limit: 100,
        visible,
    });
    return (
        <>
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
                        <h2 className='text-2xl font-bold tracking-tight'>Testimonials</h2>
                        <p className='text-muted-foreground'>Manage customer testimonials.</p>
                    </div>
                    <div className='flex items-center gap-3'>
                        <div className='flex items-center gap-2'>
                            <Select
                                value={status}
                                onValueChange={(val: 'all' | 'visible' | 'hidden') => setStatus(val)}
                            >
                                <SelectTrigger id='status-filter' className='h-8 w-[160px]'>
                                    <SelectValue placeholder='All' />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value='all'>All</SelectItem>
                                    <SelectItem value='visible'>Visible</SelectItem>
                                    <SelectItem value='hidden'>Hidden</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <TestimonialsPrimaryButtons />
                    </div>
                </div>

                <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12'>
                    {isLoading || isFetching ? (
                        <p>Loading Testimonials...</p>
                    ) : isError ? (
                        <p className='text-red-500'>Error: {(error as Error).message}</p>
                    ) : (
                        <DataTable data={(data?.results as Testimonial[]) ?? []} columns={columns} />
                    )}
                </div>
            </Main>
        </>
    );
}


