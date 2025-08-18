import { useEffect, useState } from 'react'
import {
  createFileRoute,
  Link,
  useNavigate,
  useRouter,
} from '@tanstack/react-router'
import { IconArrowUpRight, IconLoader2 } from '@tabler/icons-react'
import { SignedIn, useAuth, UserButton } from '@clerk/clerk-react'
import { ClerkLogo } from '@/assets/clerk-logo'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { LearnMore } from '@/components/learn-more'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { columns } from '@/features/users/components/columns'
import { DataTable } from '@/features/users/components/data-table'
import type { UserRow as TableUser } from '@/features/users/components/columns'

export const Route = createFileRoute('/clerk/_authenticated/user-management')({
  component: UserManagement,
})

function UserManagement() {
  const [opened, setOpened] = useState(true)
  const { isLoaded, isSignedIn } = useAuth()

  if (!isLoaded) {
    return (
      <div className='flex h-svh items-center justify-center'>
        <IconLoader2 className='size-8 animate-spin' />
      </div>
    )
  }

  if (!isSignedIn) {
    return <Unauthorized />
  }

  // Minimal mock; in a real setup, point this to the same API as /users
  const userList: TableUser[] = [
    {
      _id: '66c1e8f7b12d3f5f9c123456',
      email: 'john.doe@example.com',
      phoneNumber: '+14155552671',
      role: 'user',
      isActive: true,
      profileCompleted: true,
      createdAt: '2025-08-18T10:25:30.123Z',
      user_details: {
        name: 'John Doe',
        country: 'United States',
        city: 'San Francisco',
        zip: '94107',
        address: '123 Market Street, Apt 5B',
        avatar: 'https://cdn.example.com/uploads/avatars/johndoe.png',
      },
    },
  ]
  return (
    <>
      <SignedIn>
        {/* Wrapper removed since the original UsersProvider is not present */}
          <Header fixed>
            <Search />
            <div className='ml-auto flex items-center space-x-4'>
              <ThemeSwitch />
              <UserButton />
            </div>
          </Header>

          <Main>
            <div className='mb-2 flex flex-wrap items-center justify-between space-y-2'>
              <div>
                <h2 className='text-2xl font-bold tracking-tight'>User List</h2>
                <div className='flex gap-1'>
                  <p className='text-muted-foreground'>
                    Manage your users and their roles here.
                  </p>
                  <LearnMore
                    open={opened}
                    onOpenChange={setOpened}
                    contentProps={{ side: 'right' }}
                  >
                    <p>
                      This is the same as{' '}
                      <Link
                        to='/users'
                        className='text-blue-500 underline decoration-dashed underline-offset-2'
                      >
                        '/users'
                      </Link>
                    </p>

                    <p className='mt-4'>
                      You can sign out or manage/delete your account via the
                      User Profile menu in the top-right corner of the page.
                      <IconArrowUpRight className='inline-block size-4' />
                    </p>
                  </LearnMore>
                </div>
              </div>
              {/* Primary actions can be added here if needed */}
            </div>
            <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12'>
              <DataTable<TableUser> data={userList} columns={columns} />
            </div>
          </Main>

          {/* Dialogs can be added here if needed */}
      </SignedIn>
    </>
  )
}

const COUNTDOWN = 5 // Countdown second

function Unauthorized() {
  const navigate = useNavigate()
  const { history } = useRouter()

  const [opened, setOpened] = useState(true)
  const [cancelled, setCancelled] = useState(false)
  const [countdown, setCountdown] = useState(COUNTDOWN)

  // Set and run the countdown conditionally
  useEffect(() => {
    if (cancelled || opened) return
    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(interval)
  }, [cancelled, opened])

  // Navigate to sign-in page when countdown hits 0
  useEffect(() => {
    if (countdown > 0) return
    navigate({ to: '/clerk/sign-in' })
  }, [countdown, navigate])

  return (
    <div className='h-svh'>
      <div className='m-auto flex h-full w-full flex-col items-center justify-center gap-2'>
        <h1 className='text-[7rem] leading-tight font-bold'>401</h1>
        <span className='font-medium'>Unauthorized Access</span>
        <p className='text-muted-foreground text-center'>
          You must be authenticated via Clerk{' '}
          <sup>
            <LearnMore open={opened} onOpenChange={setOpened}>
              <p>
                This is the same as{' '}
                <Link
                  to='/users'
                  className='text-blue-500 underline decoration-dashed underline-offset-2'
                >
                  '/users'
                </Link>
                .{' '}
              </p>
              <p>You must first sign in using Clerk to access this route. </p>

              <p className='mt-4'>
                After signing in, you'll be able to sign out or delete your
                account via the User Profile dropdown on this page.
              </p>
            </LearnMore>
          </sup>
          <br />
          to access this resource.
        </p>
        <div className='mt-6 flex gap-4'>
          <Button variant='outline' onClick={() => history.go(-1)}>
            Go Back
          </Button>
          <Button onClick={() => navigate({ to: '/clerk/sign-in' })}>
            <ClerkLogo className='invert' /> Sign in
          </Button>
        </div>
        <div className='mt-4 h-8 text-center'>
          {!cancelled && !opened && (
            <>
              <p>
                {countdown > 0
                  ? `Redirecting to Sign In page in ${countdown}s`
                  : `Redirecting...`}
              </p>
              <Button variant='link' onClick={() => setCancelled(true)}>
                Cancel Redirect
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
