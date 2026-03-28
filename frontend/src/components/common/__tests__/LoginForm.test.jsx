import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginForm from '../LoginForm';

describe('LoginForm', () => {
  it('renders heading and form fields', () => {
    render(<LoginForm onLogin={vi.fn()} />);
    expect(screen.getByText('Admin Authentication Required')).toBeInTheDocument();
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
  });

  it('calls onLogin with username and password on submit', async () => {
    const onLogin = vi.fn().mockResolvedValue(undefined);
    render(<LoginForm onLogin={onLogin} />);

    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret' } });
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(onLogin).toHaveBeenCalledWith('admin', 'secret');
    });
  });

  it('shows error when onLogin throws', async () => {
    const onLogin = vi.fn().mockRejectedValue(new Error('Bad credentials'));
    render(<LoginForm onLogin={onLogin} />);

    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(screen.getByText('Bad credentials')).toBeInTheDocument();
    });
  });

  it('disables inputs when externalLoading is true', () => {
    render(<LoginForm onLogin={vi.fn()} loading={true} />);
    expect(screen.getByLabelText('Username')).toBeDisabled();
    expect(screen.getByLabelText('Password')).toBeDisabled();
  });
});
