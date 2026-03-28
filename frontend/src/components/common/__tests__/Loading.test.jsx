import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Loading from '../Loading';

describe('Loading', () => {
  it('renders loading text', () => {
    render(<Loading />);
    expect(screen.getByText('Loading leaderboard...')).toBeInTheDocument();
  });

  it('renders spinner element', () => {
    const { container } = render(<Loading />);
    expect(container.querySelector('.loading-spinner')).toBeInTheDocument();
  });
});
