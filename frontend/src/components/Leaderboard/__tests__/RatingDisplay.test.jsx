import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import RatingDisplay from '../RatingDisplay';

describe('RatingDisplay', () => {
  it('renders "-" with no-handle class when handle is absent', () => {
    const { container } = render(<RatingDisplay platform="codeforces" />);
    expect(screen.getByText('-')).toBeInTheDocument();
    expect(container.querySelector('.no-handle')).toBeInTheDocument();
  });

  it('renders "Unrated" link when handle exists but no rating', () => {
    render(<RatingDisplay platform="codeforces" handle="user1" />);
    const link = screen.getByText('Unrated');
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', 'https://codeforces.com/profile/user1');
  });

  it('renders rating value when handle and rating exist', () => {
    render(<RatingDisplay platform="codeforces" handle="user1" rating={1900} />);
    expect(screen.getByText('1900')).toBeInTheDocument();
  });

  it('renders rating with correct color', () => {
    render(<RatingDisplay platform="codeforces" handle="user1" rating={1900} />);
    const link = screen.getByText('1900').closest('a');
    expect(link).toHaveStyle({ color: '#aa00aa' }); // CM purple
  });

  it('renders rank when provided', () => {
    render(<RatingDisplay platform="codechef" handle="user1" rating={2500} rank="7★" />);
    expect(screen.getByText('7★')).toBeInTheDocument();
  });

  it('links open in new tab', () => {
    render(<RatingDisplay platform="codeforces" handle="user1" rating={1500} />);
    const link = screen.getByText('1500').closest('a');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('links to correct platform URL', () => {
    render(<RatingDisplay platform="leetcode" handle="testuser" rating={2100} />);
    const link = screen.getByText('2100').closest('a');
    expect(link).toHaveAttribute('href', 'https://leetcode.com/u/testuser');
  });
});
