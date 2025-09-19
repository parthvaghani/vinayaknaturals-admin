import { HTMLAttributes, useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useForgotPassword } from '@/hooks/use-auth';
import { Loader } from 'lucide-react';

type ForgotFormProps = HTMLAttributes<HTMLFormElement>;

const formSchema = z.object({
  email: z.email({
    error: (iss) => (iss.input === '' ? 'Please enter your email' : undefined),
  }),
});

export function ForgotPasswordForm({ className, ...props }: ForgotFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const forgotPassword = useForgotPassword();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '' },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      await forgotPassword.mutateAsync({ email: data.email });
    } catch (error: unknown) {
      let msg = 'Failed to send reset email';
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const maybeAxiosError = error as { response?: { data?: { message?: string; }; }; };
        msg = maybeAxiosError.response?.data?.message || msg;
      } else if (error instanceof Error) {
        msg = error.message;
      }
      setMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('grid gap-2', className)}
        {...props}
      >
        {forgotPassword.isError && (
          <FormMessage>{message}</FormMessage>
        )}
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem className='space-y-1'>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder='name@example.com' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button className='mt-2' disabled={isLoading || forgotPassword.isPending}>
          {isLoading || forgotPassword.isPending ?
            <>
              Continue
              <Loader className='animate-spin' />
            </>
            : 'Continue'}
        </Button>
      </form>
    </Form>
  );
}
