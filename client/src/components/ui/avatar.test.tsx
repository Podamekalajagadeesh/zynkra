import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Avatar, AvatarImage, AvatarFallback } from './avatar';

describe('Avatar component', () => {
  it('renders a circle with an initial when no children', () => {
    render(<Avatar name="John" />);
    expect(screen.getByText('J')).toBeInTheDocument();
  });

  it('renders children when provided', () => {
    render(
      <Avatar>
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
    );

    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('applies custom className and size', () => {
    const { container } = render(
      <Avatar className="custom-class" size={64}>
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>
    );

    const avatarEl = container.firstChild as HTMLElement;
    expect(avatarEl.className).toContain('custom-class');
    expect(avatarEl.getAttribute('style')).toContain('width: 64px');
  });

  it('renders with children inside aria-hidden container', () => {
    const { container } = render(
      <Avatar>
        <AvatarFallback>User</AvatarFallback>
      </Avatar>
    );

    const avatarEl = container.firstChild as HTMLElement;
    expect(avatarEl.getAttribute('aria-hidden')).toBe('true');
  });

  it('renders AvatarImage correctly', () => {
    render(
      <Avatar>
        <AvatarImage src="/avatar.jpg" alt="User avatar" />
      </Avatar>
    );

    const img = screen.getByAltText('User avatar') as HTMLImageElement;
    expect(img.src).toContain('/avatar.jpg');
  });
});
