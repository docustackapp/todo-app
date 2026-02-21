import { renderHook, act } from '@testing-library/react';
import { useTheme } from './useTheme';
import { readState, writeState } from '../utils/localStorage';
import { DEFAULT_STATE } from '../types/index';

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('initial theme absent in localStorage → returns theme light', () => {
    // localStorage cleared in beforeEach; no key present
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('light');
  });

  it('initial theme from localStorage dark → returns theme dark', () => {
    writeState({ ...DEFAULT_STATE, theme: 'dark' });
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('dark');
  });

  it('toggleTheme changes light→dark', () => {
    const { result } = renderHook(() => useTheme());
    act(() => result.current.toggleTheme());
    expect(result.current.theme).toBe('dark');
  });

  it('toggleTheme changes dark→light', () => {
    writeState({ ...DEFAULT_STATE, theme: 'dark' });
    const { result } = renderHook(() => useTheme());
    act(() => result.current.toggleTheme());
    expect(result.current.theme).toBe('light');
  });

  it('after toggleTheme, readState().theme reflects new value', () => {
    const { result } = renderHook(() => useTheme());
    act(() => result.current.toggleTheme());
    expect(readState().theme).toBe('dark');
  });

  it('applies dark class to document.documentElement when theme is dark', () => {
    writeState({ ...DEFAULT_STATE, theme: 'dark' });
    renderHook(() => useTheme());
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('removes dark class from document.documentElement when theme is light', () => {
    // Start with dark class present, then render with light theme
    document.documentElement.classList.add('dark');
    // localStorage cleared in beforeEach so theme defaults to light
    renderHook(() => useTheme());
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('document.documentElement.classList reflects theme after toggle (light→dark)', () => {
    const { result } = renderHook(() => useTheme());
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    act(() => result.current.toggleTheme());
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('document.documentElement.classList reflects theme after toggle (dark→light)', () => {
    writeState({ ...DEFAULT_STATE, theme: 'dark' });
    const { result } = renderHook(() => useTheme());
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    act(() => result.current.toggleTheme());
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
