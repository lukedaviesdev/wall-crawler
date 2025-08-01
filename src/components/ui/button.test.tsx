import { describe, expect, it } from 'vitest';

import { render, screen } from '@/test/test-utils';

import { Button } from './button';

describe('Button', () => {
  it('renders correctly with default props', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-primary');
  });

  it('renders different variants correctly', () => {
    const { rerender } = render(
      <Button variant="destructive">Destructive</Button>,
    );
    expect(screen.getByRole('button')).toHaveClass('bg-destructive');

    rerender(<Button variant="outline">Outline</Button>);
    expect(screen.getByRole('button')).toHaveClass('border-input');

    rerender(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-secondary');

    rerender(<Button variant="ghost">Ghost</Button>);
    expect(screen.getByRole('button')).toHaveClass('hover:bg-accent');

    rerender(<Button variant="link">Link</Button>);
    expect(screen.getByRole('button')).toHaveClass('text-primary');
  });

  it('renders different sizes correctly', () => {
    const { rerender } = render(<Button size="default">Default</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-10');

    rerender(<Button size="sm">Small</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-9');

    rerender(<Button size="lg">Large</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-11');

    rerender(<Button size="icon">Icon</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-10 w-10');
  });

  it('renders as a child component when asChild is true', () => {
    render(
      <Button asChild>
        <a href="/">Link Button</a>
      </Button>,
    );
    const link = screen.getByRole('link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveClass('bg-primary');
  });

  it('forwards ref correctly', () => {
    const { container } = render(
      <Button
        ref={(element) => element?.setAttribute('data-testid', 'ref-test')}
      >
        Ref Test
      </Button>,
    );
    expect(
      container.querySelector('[data-testid="ref-test"]'),
    ).toBeInTheDocument();
  });

  it('applies additional className correctly', () => {
    render(<Button className="custom-class">Custom Class</Button>);
    expect(screen.getByRole('button')).toHaveClass('custom-class');
  });

  it('handles disabled state correctly', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByRole('button')).toHaveClass('disabled:opacity-50');
  });
});
