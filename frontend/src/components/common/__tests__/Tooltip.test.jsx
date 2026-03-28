import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Tooltip from '../Tooltip';

describe('Tooltip', () => {
  it('renders children content', () => {
    render(<Tooltip content="Tooltip text"><span>Hover me</span></Tooltip>);
    expect(screen.getByText('Hover me')).toBeInTheDocument();
  });

  it('tooltip is hidden by default', () => {
    render(<Tooltip content="Tooltip text"><span>Hover me</span></Tooltip>);
    const tooltip = screen.getByRole('tooltip', { hidden: true });
    expect(tooltip).toHaveAttribute('aria-hidden', 'true');
    expect(tooltip).toHaveStyle({ display: 'none' });
  });

  it('tooltip has role="tooltip"', () => {
    render(<Tooltip content="Tooltip text"><span>Hover me</span></Tooltip>);
    expect(screen.getByRole('tooltip', { hidden: true })).toBeInTheDocument();
  });

  it('tooltip becomes visible on mouse enter', () => {
    render(<Tooltip content="Tooltip text"><span>Hover me</span></Tooltip>);
    const wrapper = screen.getByText('Hover me').closest('.tooltip-wrapper');
    fireEvent.mouseEnter(wrapper);

    const tooltip = screen.getByRole('tooltip', { hidden: true });
    expect(tooltip).toHaveAttribute('aria-hidden', 'false');
    expect(tooltip).toHaveStyle({ display: 'block' });
  });

  it('tooltip hides on mouse leave', () => {
    render(<Tooltip content="Tooltip text"><span>Hover me</span></Tooltip>);
    const wrapper = screen.getByText('Hover me').closest('.tooltip-wrapper');

    fireEvent.mouseEnter(wrapper);
    fireEvent.mouseLeave(wrapper);

    const tooltip = screen.getByRole('tooltip', { hidden: true });
    expect(tooltip).toHaveAttribute('aria-hidden', 'true');
    expect(tooltip).toHaveStyle({ display: 'none' });
  });

  it('renders tooltip content text', () => {
    render(<Tooltip content="Helpful info"><span>Hover me</span></Tooltip>);
    expect(screen.getByText('Helpful info')).toBeInTheDocument();
  });
});
