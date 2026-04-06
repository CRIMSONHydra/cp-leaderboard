import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Loading from '../Loading';

describe('Loading', () => {
  it('renders default loading message', () => {
    render(<Loading />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders custom message', () => {
    render(<Loading message="Loading spaces..." />);
    expect(screen.getByText('Loading spaces...')).toBeInTheDocument();
  });

  it('renders spinner element', () => {
    const { container } = render(<Loading />);
    expect(container.querySelector('.loading-spinner')).toBeInTheDocument();
  });

  it('renders three bouncing dots', () => {
    const { container } = render(<Loading />);
    expect(container.querySelectorAll('.loading-dot')).toHaveLength(3);
  });
});
