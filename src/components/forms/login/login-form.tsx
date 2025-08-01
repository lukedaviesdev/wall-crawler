import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { FormCard } from '@/components/card/form-card';
import { SecondaryButton } from '@/components/forms/buttons/secondary-button';
import { SubmitButton } from '@/components/forms/buttons/submit-button';
import { TextInput } from '@/components/forms/form-fields/text-input';
import { Form } from '@/components/ui/form';

// Improved schema with additional validation rules
const formSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters long' })
    .regex(/[a-zA-Z0-9]/, { message: 'Password must be alphanumeric' }),
});

export const LoginForm = () => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      // Assuming an async login function
      toast(
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">{JSON.stringify(values, null, 2)}</code>
        </pre>,
      );
    } catch (error) {
      console.error('Form submission error', error);
      toast.error('Failed to submit the form. Please try again.');
    }
  }

  return (
    <div className="flex flex-col min-h-[50vh] h-full w-full items-center justify-center px-4">
      <FormCard
        title="Login"
        description="Enter your email and password to login to your account."
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid gap-4">
              <TextInput<typeof formSchema>
                form={form}
                name="email"
                label="Email"
                type="email"
              />
              <TextInput<typeof formSchema>
                form={form}
                name="password"
                label="Password"
                type="password"
              />

              <SubmitButton>Login</SubmitButton>
              <SecondaryButton>Login with Google</SecondaryButton>
            </div>
          </form>
        </Form>
        <div className="mt-4 text-center text-sm">
          Don&apos;t have an account?{' '}
          <a href="#" className="underline">
            Sign up
          </a>
        </div>
      </FormCard>
    </div>
  );
};
