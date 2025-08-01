import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

import type { UseFormReturn, Path } from 'react-hook-form';
import type { z } from 'zod';

interface TextInputOptions<TSchema extends z.ZodType> {
  form: UseFormReturn<z.infer<TSchema>>;
  name: Path<z.infer<TSchema>>;
  label: string;
  placeholder?: string;
  type?: string;
  autoComplete?: string;
}

export const TextInput = <TSchema extends z.ZodType>({
  form,
  name,
  label,
  placeholder,
  type,
  autoComplete,
}: TextInputOptions<TSchema>) => {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="grid gap-2">
          <FormLabel htmlFor={name}>{label}</FormLabel>
          <FormControl>
            <Input
              id={name}
              placeholder={placeholder}
              type={type}
              autoComplete={autoComplete}
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
