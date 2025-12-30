import {
  CheckCircle,
  IndianRupee,
  TrendingUp,
  XCircle,
  TrendingDown,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export type OverviewDatum = {
  name: string
  total: number
  nonCancelled?: number
  cancelled?: number
  paid?: number
  unpaid?: number
  nonCancelledPaid?: number
  nonCancelledUnpaid?: number
  cancelledPaid?: number
  cancelledUnpaid?: number
}

function formatINR(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function Overview({ data }: { data: OverviewDatum[] }) {
  return (
    <>
      <ResponsiveContainer width='100%' height={350}>
        <BarChart data={data}>
          <CartesianGrid stroke='#f1f1f3' vertical={false} />
          <XAxis
            dataKey='name'
            stroke='#888888'
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke='#888888'
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${formatINR(Number(value))}`}
          />
          <Tooltip
            cursor={{ fill: 'rgba(0,0,0,0.04)' }}
            content={({ active, payload, label }) => {
              if (!active || !payload || !payload.length) return null
              const p = payload[0]
              const d = (
                p && p.payload ? (p.payload as OverviewDatum) : undefined
              ) as OverviewDatum | undefined
              if (!d) return null
              return (
                <div className='bg-card/95 max-w-[320px] min-w-[280px] rounded-xl border p-4 text-sm shadow-lg backdrop-blur-sm'>
                  {/* Header */}
                  <div className='border-border/50 mb-3 flex items-center gap-2 border-b pb-2'>
                    <div className='bg-chart-1 h-2 w-2 rounded-full'></div>
                    <div className='text-card-foreground font-semibold'>
                      {label}
                    </div>
                  </div>

                  {/* Main metrics */}
                  <div className='mb-3 space-y-3'>
                    <div className='grid grid-cols-2 gap-3'>
                      <div className='rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800/50 dark:bg-green-950/30'>
                        <div className='mb-1 flex items-center gap-2'>
                          <CheckCircle className='h-4 w-4 text-green-600 dark:text-green-400' />
                          <span className='text-xs font-medium text-green-700 dark:text-green-300'>
                            Paid
                          </span>
                        </div>
                        <div className='font-bold text-green-800 dark:text-green-200'>
                          {formatINR(d.paid || 0)}
                        </div>
                      </div>

                      <div className='rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-800/50 dark:bg-orange-950/30'>
                        <div className='mb-1 flex items-center gap-2'>
                          <XCircle className='h-4 w-4 text-orange-600 dark:text-orange-400' />
                          <span className='text-xs font-medium text-orange-700 dark:text-orange-300'>
                            Unpaid
                          </span>
                        </div>
                        <div className='font-bold text-orange-800 dark:text-orange-200'>
                          {formatINR(d.unpaid || 0)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Detailed breakdown */}
                  <div className='mb-3 space-y-2'>
                    <div className='text-muted-foreground mb-2 flex items-center gap-1 text-xs font-medium'>
                      <TrendingUp className='h-3 w-3' />
                      Active Orders
                    </div>
                    <div className='space-y-1.5 pl-4'>
                      <div className='flex items-center justify-between text-xs'>
                        <span className='text-muted-foreground'>Paid</span>
                        <span className='font-medium text-green-600 dark:text-green-400'>
                          {formatINR(d.nonCancelledPaid || 0)}
                        </span>
                      </div>
                      <div className='flex items-center justify-between text-xs'>
                        <span className='text-muted-foreground'>Unpaid</span>
                        <span className='font-medium text-orange-600 dark:text-orange-400'>
                          {formatINR(d.nonCancelledUnpaid || 0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className='mb-3 space-y-2'>
                    <div className='text-muted-foreground mb-2 flex items-center gap-1 text-xs font-medium'>
                      <TrendingDown className='h-3 w-3' />
                      Cancelled Orders
                    </div>
                    <div className='space-y-1.5 pl-4'>
                      <div className='flex items-center justify-between text-xs'>
                        <span className='text-muted-foreground'>Paid</span>
                        <span className='font-medium text-red-600 dark:text-red-400'>
                          {formatINR(d.cancelledPaid || 0)}
                        </span>
                      </div>
                      <div className='flex items-center justify-between text-xs'>
                        <span className='text-muted-foreground'>Unpaid</span>
                        <span className='font-medium text-red-600 dark:text-red-400'>
                          {formatINR(d.cancelledUnpaid || 0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Summary totals */}
                  <div className='border-border/50 space-y-1.5 border-t pt-3'>
                    <div className='flex items-center justify-between text-xs'>
                      <span className='text-muted-foreground'>
                        Active Total
                      </span>
                      <span className='font-medium'>
                        {formatINR(d.nonCancelled || 0)}
                      </span>
                    </div>
                    <div className='flex items-center justify-between text-xs'>
                      <span className='text-muted-foreground'>
                        Cancelled Total
                      </span>
                      <span className='font-medium'>
                        {formatINR(d.cancelled || 0)}
                      </span>
                    </div>
                    <div className='border-border/30 flex items-center justify-between border-t pt-1.5'>
                      <div className='flex items-center gap-1'>
                        <IndianRupee className='text-primary h-4 w-4' />
                        <span className='text-primary font-bold'>
                          Grand Total
                        </span>
                      </div>
                      <span className='text-primary text-lg font-bold'>
                        {formatINR(d.total || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              )
            }}
          />
          <Bar
            dataKey='total'
            fill='currentColor'
            radius={[4, 4, 0, 0]}
            className='fill-primary'
          />
        </BarChart>
      </ResponsiveContainer>
    </>
  )
}
