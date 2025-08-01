import { Button } from '@/components/ui/button';

export const SecondaryButton = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <Button
      variant="outline"
      className="w-full bg-secondary text-primary-foreground"
    >
      {children}
    </Button>
  );
};
