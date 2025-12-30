import { useState, useEffect } from 'react'
import { useUsersList, User } from '@/hooks/use-users'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'

export function UserDropdown({
  value,
  onChange,
  error,
}: {
  value: string
  onChange: (val: string) => void
  error?: string
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm)

  // Debounce to avoid too many API calls
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchTerm), 300)
    return () => clearTimeout(handler)
  }, [searchTerm])

  // Fetch users using hook
  const { data: usersData } = useUsersList({
    searchTerm: debouncedSearch,
    limit: 10000000000,
  })
  const users: User[] = usersData?.results || []

  return (
    <div className='flex-1 space-y-2'>
      <Label htmlFor='userType'>User Type</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id='userType' className='w-full'>
          <SelectValue placeholder='Select or search a user' />
        </SelectTrigger>
        <SelectContent className='max-h-60 overflow-y-auto'>
          <div className='p-2'>
            <Input
              placeholder='Search users...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='border-accent mb-2 w-full border'
            />
            <Separator />
            {users.length === 0 ? (
              <p className='text-muted-foreground text-sm'>No users found</p>
            ) : (
              users.map((user) => (
                <SelectItem
                  key={user._id || user.id}
                  value={user._id || user.id || ''}
                >
                  {user.user_details?.name || user.email}
                </SelectItem>
              ))
            )}
          </div>
        </SelectContent>
      </Select>
      {error && <p className='text-xs text-red-500'>{error}</p>}
    </div>
  )
}
