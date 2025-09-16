import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from './data-table-column-header';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { DataTableRowActions } from './data-table-row-actions';
import countries from 'i18n-iso-countries';
import type { LocaleData } from 'i18n-iso-countries';
import enLocale from 'i18n-iso-countries/langs/en.json';

countries.registerLocale(enLocale as LocaleData);

export interface UserRow {
  _id: string;
  email: string;
  phoneNumber?: string;
  role: string;
  isActive: boolean;
  profileCompleted?: boolean;
  createdAt?: string;
  user_details?: {
    name?: string;
    country?: string;
    city?: string;
    zip?: string;
    address?: string;
    avatar?: string;
  };
}

export const columns: ColumnDef<UserRow>[] = [

  {
    id: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Name' />
    ),
    accessorFn: (row) => row.user_details?.name ?? row.email.split('@')[0],
    cell: ({ row }) => {
      const name = (row.original.user_details?.name ?? '').trim();
      const avatar = row.original.user_details?.avatar ?? '';
      const fallback = (name || row.original.email).slice(0, 2).toUpperCase();
      return (
        <div className='flex items-center gap-2'>
          <Avatar className='h-8 w-8'>
            <AvatarImage src={avatar} alt={name} />
            <AvatarFallback>{fallback}</AvatarFallback>
          </Avatar>
          <div className='flex flex-col'>
            <span className='font-medium'>{name || '—'}</span>
            <span className='text-xs text-muted-foreground'>{row.original.email}</span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'phoneNumber',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Phone' />
    ),
    cell: ({ row }) => <span>{row.original.phoneNumber || '—'}</span>,
  },
  {
    accessorKey: 'country',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Country' />
    ),
    cell: ({ row }) => {
      const raw = String(row.original.user_details?.country || '').trim();
      if (!raw) return <span className='font-medium'>—</span>;

      let iso2 = '';
      const upper = raw.toUpperCase();
      if (upper.length === 2) {
        iso2 = upper;
      } else if (upper.length === 3) {
        iso2 = countries.alpha3ToAlpha2(upper) || '';
      }
      if (!iso2) {
        const foundIso2 = countries.getAlpha2Code(raw, 'en');
        if (foundIso2) iso2 = foundIso2.toUpperCase();
      }

      const fullName = (iso2 && countries.getName(iso2, 'en')) || countries.getName(upper, 'en') || raw;

      return (
        <div className='flex items-center gap-2'>
          {iso2 ? (
            <span className={`fi fis fi-${iso2.toLowerCase()} rounded-full`} aria-hidden />
          ) : null}
          <span className='font-medium'>{fullName}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'role',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Role' />
    ),
    cell: ({ row }) => {
      const role = String(row.original.role || '').toLowerCase();
      const label = role ? role.replace(/^\w/, (c) => c.toUpperCase()) : '—';
      return <Badge variant={label === 'Admin' ? 'default' : 'pending'}>{label}</Badge>;
    },
  },
  {
    accessorKey: 'isActive',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    cell: ({ row }) => (
      <Badge variant={row.original.isActive ? 'enable' : 'destructive'}>
        {row.original.isActive ? 'Active' : 'Inactive'}
      </Badge>
    ),
    enableSorting: true,
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Created' />
    ),
    cell: ({ row }) => {
      const createdAt = row.original.createdAt;
      if (!createdAt) return <span>—</span>;
      const d = new Date(createdAt);
      if (isNaN(d.getTime())) return <span>—</span>;
      return <span>{d.toLocaleDateString()}</span>;
    },
  },

  // ✅ Actions
  {
    id: 'actions',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Actions" className='text-center' />,
    cell: ({ row }) => <DataTableRowActions row={row} />,
    enableSorting: false,
    enableHiding: false,
  },
];
