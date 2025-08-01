import { Button } from '@/components/ui/button';

export const SubmitButton = ({ children }: { children: React.ReactNode }) => {
  return (
    <Button type="submit" className="w-full bg-primary text-primary-foreground">
      {children}
    </Button>
  );
};
