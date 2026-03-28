import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SortButton from '../SortButton';

describe('SortButton', () => {
  it('renders label text', () => {
    render(<SortButton label="Rating" active={false} direction="desc" onClick={() => {}} />);
    expect(screen.getByText('Rating')).toBeInTheDocument();
  });

  it('shows descending indicator when active and desc', () => {
    render(<SortButton label="Rating" active={true} direction="desc" onClick={() => {}} />);
    expect(screen.getByText('▼')).toBeInTheDocument();
  });

  it('shows ascending indicator when active and asc', () => {
    render(<SortButton label="Rating" active={true} direction="asc" onClick={() => {}} />);
    expect(screen.getByText('▲')).toBeInTheDocument();
  });

  it('does not show sort indicator when not active', () => {
    render(<SortButton label="Rating" active={false} direction="desc" onClick={() => {}} />);
    expect(screen.queryByText('▼')).not.toBeInTheDocument();
    expect(screen.queryByText('▲')).not.toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<SortButton label="Rating" active={false} direction="desc" onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('has active class when active', () => {
    render(<SortButton label="Rating" active={true} direction="desc" onClick={() => {}} />);
    expect(screen.getByRole('button')).toHaveClass('active');
  });

  it('does not have active class when not active', () => {
    render(<SortButton label="Rating" active={false} direction="desc" onClick={() => {}} />);
    expect(screen.getByRole('button')).not.toHaveClass('active');
  });
});
