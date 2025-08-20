import { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from './data-table-column-header';
import { DataTableRowActions, type OrderRow } from './data-table-row-actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useUpdateOrderStatus } from '@/hooks/use-orders';
import { toast } from 'sonner';
import { useState } from "react";
import { Input } from "@/components/ui/input";


function isUserObject(v: OrderRow['userId']): v is Exclude<OrderRow['userId'], string> {
    return typeof v === 'object' && v !== null;
}

const statusVariantMap: Record<string, 'enable' | 'reviewed' | 'placed' | 'inprogress' | 'destructive' | 'delivered' | 'default'> = {
    placed: 'placed',
    accepted: 'reviewed',
    inprogress: 'inprogress',
    completed: 'enable',
    cancelled: 'destructive',
    delivered: 'delivered',
};

const STATUS_OPTIONS = [
    { value: 'placed', label: 'Placed' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'inprogress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'delivered', label: 'Delivered' },
] as const;


function StatusCell({ order }: { order: OrderRow; }) {
    const current = order.status?.toLowerCase();
    const variant = statusVariantMap[current] || "default";
    const { mutate: updateStatus, isPending } = useUpdateOrderStatus();

    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [cancelReason, setCancelReason] = useState("");

    const onSelect = (next: string) => {
        if (next === order.status) return;

        if (next === "cancelled") {
            setShowCancelDialog(true); // open dialog instead of direct update
            return;
        }

        updateStatus(
            { id: order._id, status: next },
            {
                onSuccess: () => toast.success("Order status updated"),
                onError: (err: unknown) => {
                    const message =
                        err instanceof Error ? err.message : "Failed to update status";
                    toast.error(message);
                },
            }
        );
    };

    // Disable rules based on your flow
    const isDisabled = (status: string) => {
        switch (current) {
            case "placed":
                return ["placed", "inprogress", "completed", "delivered"].includes(status);
            case "accepted":
                return ["placed", "accepted", "completed", "delivered"].includes(status);
            case "inprogress":
                return ["placed", "accepted", "inprogress", "cancelled", "delivered"].includes(status);
            case "completed":
                return ["placed", "accepted", "inprogress", "completed", "cancelled"].includes(status);
            case "cancelled":
                return true;
            case "delivered":
                return true;
            default:
                return false;
        }
    };

    const confirmCancel = () => {
        if (!cancelReason.trim()) {
            toast.error("Please enter a cancellation reason");
            return;
        }

        updateStatus(
            { id: order._id, status: "cancelled", note: cancelReason },
            {
                onSuccess: () => {
                    toast.success("Order cancelled");
                    setCancelReason("");
                    setShowCancelDialog(false);
                },
                onError: (err: unknown) => {
                    const message =
                        err instanceof Error ? err.message : "Failed to cancel order";
                    toast.error(message);
                },
            }
        );
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto"
                        disabled={isPending}
                    >
                        <Badge variant={variant} className="cursor-pointer select-none">
                            {order.status}
                        </Badge>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                    {STATUS_OPTIONS.map((opt) => (
                        <DropdownMenuItem
                            key={opt.value}
                            disabled={isPending || isDisabled(opt.value)}
                            onSelect={() => onSelect(opt.value)}
                        >
                            <Badge
                                variant={statusVariantMap[opt.value]}
                                className={`cursor-pointer select-none ${isDisabled(opt.value) ? "opacity-50" : ""
                                    }`}
                            >
                                {opt.label}
                            </Badge>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Cancel reason dialog */}
            <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cancel Order</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <label className="text-sm font-medium">Reason for cancellation</label>
                        <Input
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            placeholder="Enter reason..."
                        />
                    </div>
                    <DialogFooter className="mt-4">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowCancelDialog(false);
                                setCancelReason("");
                            }}
                        >
                            Close
                        </Button>
                        <Button onClick={confirmCancel} disabled={isPending}>
                            Confirm Cancel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}


export const columns: ColumnDef<OrderRow>[] = [
    {
        id: 'select',
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && 'indeterminate')
                }
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label='Select all'
                className='translate-y-[2px]'
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label='Select row'
                className='translate-y-[2px]'
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: '_id',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Order ID' />,
        cell: ({ row }) => <span className='font-medium'>{row.original._id}</span>,
    },
    {
        accessorKey: 'userId',
        header: ({ column }) => <DataTableColumnHeader column={column} title='User' />,
        cell: ({ row }) => {
            const v = row.original.userId;
            let label: string;
            if (isUserObject(v)) {
                label = v.user_details?.name || v.email || v._id || v.id || '—';
            } else {
                label = String(v ?? '—');
            }
            return <span className='truncate max-w-[220px] block'>{label}</span>;
        },
    },
    {
        accessorKey: 'phoneNumber',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Phone' />,
        cell: ({ row }) => <span>{row.original.phoneNumber}</span>,
    },
    {
        accessorKey: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Status' />,
        cell: ({ row }) => <StatusCell order={row.original} />,
    },
    {
        id: 'amount',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Amount' />,
        cell: ({ row }) => {
            const orig = row.original.originalTotal ?? row.original.totalAmount ?? 0;
            const total = row.original.totalAmount ?? 0;
            const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
            const hasDiscount = (row.original.originalTotal ?? 0) > (row.original.totalAmount ?? 0);
            return (
                <div className='flex items-center gap-2'>
                    {hasDiscount && <span className='line-through text-muted-foreground'>{fmt(orig)}</span>}
                    <span className='font-semibold'>{fmt(total)}</span>
                </div>
            );
        },
    },
    {
        id: 'images',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Images' />,
        cell: ({ row }) => {
            const images = row.original.images || [];
            if (!images.length) return <span>—</span>;
            const first = images[0];
            return (
                <Dialog>
                    <DialogTrigger asChild>
                        <img src={first} alt='Preview' className='h-10 w-10 rounded object-cover border cursor-pointer' />
                    </DialogTrigger>
                    <DialogContent className='sm:max-w-[600px]'>
                        <DialogHeader>
                            <DialogTitle>Order Product Images</DialogTitle>
                        </DialogHeader>
                        <div className='grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4'>
                            {images.map((img, index) => (
                                <img key={index} src={img} alt={`Image ${index + 1}`} className='w-full h-32 object-cover rounded border' />
                            ))}
                        </div>
                    </DialogContent>
                </Dialog>
            );
        },
    },
    {
        accessorKey: 'createdAt',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Created' />,
        cell: ({ row }) => {
            const d = new Date(row.original.createdAt);
            return <span>{isNaN(d.getTime()) ? '—' : d.toLocaleString()}</span>;
        },
    },
    {
        id: 'actions',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Actions' className='text-center' />,
        cell: ({ row }) => {
            return (
                <div className='flex justify-center'>
                    <DataTableRowActions row={row as unknown as import('@tanstack/react-table').Row<OrderRow>} />
                </div>
            );
        },
        enableSorting: false,
        enableHiding: false,
    },
];


