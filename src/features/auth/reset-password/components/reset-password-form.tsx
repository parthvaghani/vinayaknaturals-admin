import { HTMLAttributes, useMemo, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { useResetPassword } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { PasswordInput } from '@/components/password-input'

type ResetFormProps = HTMLAttributes<HTMLFormElement>

const formSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/, {
        message: 'Include upper, lower, number and special character',
      }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: "Passwords don't match",
  })

function useStrength(password: string) {
  return useMemo(() => {
    let score = 0
    if (password.length >= 8) score += 1
    if (/[A-Z]/.test(password)) score += 1
    if (/[a-z]/.test(password)) score += 1
    if (/\d/.test(password)) score += 1
    if (/[^A-Za-z0-9]/.test(password)) score += 1
    const levels = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong'] as const
    const index = Math.min(Math.max(score - 1, 0), levels.length - 1)
    return { score, label: levels[index] }
  }, [password])
}

export function ResetPasswordForm({ className, ...props }: ResetFormProps) {
  const { token } = useSearch({ from: '/(auth)/reset-password' }) as {
    token?: string
  }
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const resetPassword = useResetPassword()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  const pwd = form.watch('password')
  const strength = useStrength(pwd)

  async function onSubmit(data: z.infer<typeof formSchema>) {
    if (!token) {
      form.setError('password', { message: 'Invalid or missing token' })
      return
    }
    setIsLoading(true)
    try {
      await resetPassword.mutateAsync({ token, password: data.password })
      navigate({ to: '/sign-in' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('grid gap-3', className)}
        {...props}
      >
        <FormField
          control={form.control}
          name='password'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Create a password</FormLabel>
              <FormControl>
                <PasswordInput placeholder='********' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='confirmPassword'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm your password</FormLabel>
              <FormControl>
                <PasswordInput placeholder='********' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className='text-xs'>
          <div className='mb-1 flex items-center justify-between'>
            <span>Password Strength:</span>
            <span className='text-green-600'>{strength.label}</span>
          </div>
          <div className='bg-muted h-1.5 w-full rounded'>
            <div
              className='h-1.5 rounded bg-green-600 transition-all'
              style={{ width: `${(strength.score / 5) * 100}%` }}
            />
          </div>
        </div>

        <Button
          className='mt-1'
          disabled={isLoading || resetPassword.isPending}
        >
          {isLoading || resetPassword.isPending
            ? 'Resetting...'
            : 'Reset Password'}
        </Button>
      </form>
    </Form>
  )
}

export default ResetPasswordForm
