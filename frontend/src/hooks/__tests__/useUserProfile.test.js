import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

vi.mock('../../services/api', () => ({
  api: {
    getUserHistory: vi.fn()
  }
}));

const { api } = await import('../../services/api');
const { useUserProfile } = await import('../useUserProfile');

describe('useUserProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts with loading true', () => {
    api.getUserHistory.mockReturnValue(new Promise(() => {})); // never resolves
    const { result } = renderHook(() => useUserProfile('123'));
    expect(result.current.loading).toBe(true);
    expect(result.current.userData).toBeNull();
    expect(result.current.history).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('sets userData and history on success', async () => {
    api.getUserHistory.mockResolvedValue({
      success: true,
      data: {
        user: { name: 'Test User' },
        history: { codeforces: { success: true, data: [] } }
      }
    });

    const { result } = renderHook(() => useUserProfile('123'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.userData).toEqual({ name: 'Test User' });
    expect(result.current.history).toEqual({ codeforces: { success: true, data: [] } });
    expect(result.current.error).toBeNull();
  });

  it('sets error on API failure', async () => {
    api.getUserHistory.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useUserProfile('123'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.userData).toBeNull();
  });

  it('sets error on unsuccessful response', async () => {
    api.getUserHistory.mockResolvedValue({
      success: false,
      error: 'User not found'
    });

    const { result } = renderHook(() => useUserProfile('123'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('User not found');
  });
});
