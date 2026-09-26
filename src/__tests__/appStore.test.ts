import { describe, it, expect } from 'vitest';
import { useAppStore } from '../store/appStore';
import { act } from '@testing-library/react';

describe('useAppStore', () => {
  it('toggles sidebar state', () => {
    const initialState = useAppStore.getState().isSidebarOpen;
    expect(initialState).toBe(true);

    act(() => {
      useAppStore.getState().toggleSidebar();
    });

    expect(useAppStore.getState().isSidebarOpen).toBe(false);
  });
});
