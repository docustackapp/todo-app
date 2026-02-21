/**
 * Integration tests: useTheme ↔ Header ↔ document.documentElement
 *
 * Two branches were merged that participate in this interaction:
 *   - issue/hook-use-theme    → useTheme (toggleTheme, readState/writeState)
 *   - issue/header-component  → Header (renders ThemeToggle, wires onToggleTheme)
 *
 * The critical integration guarantees:
 *   1. When Header's ThemeToggle button is clicked, the onClick chain reaches
 *      useTheme.toggleTheme, which mutates both React state AND localStorage.
 *   2. useTheme.toggleTheme applies the correct CSS class ('dark') to
 *      document.documentElement — Tailwind's class-strategy dark mode.
 *   3. The document class and localStorage theme slice stay in sync after
 *      each toggle (no divergence between in-memory, DOM, and storage).
 *   4. useTasks mutations interleaved with toggleTheme do NOT clobber the
 *      document class or localStorage theme (read-before-write contract).
 *
 * The most dangerous failure here would be: user clicks the theme toggle in
 * the Header, Tailwind dark: classes never activate because the DOM class
 * was not applied by the hook.  This is invisible from unit tests alone.
 */
import { render, screen, fireEvent, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import Header from './Header/Header';
import { useTheme } from '../hooks/useTheme';
import { useTasks } from '../hooks/useTasks';
import { readState } from '../utils/localStorage';

// Suppress canvas-confetti in jsdom
const mockConfetti = vi.hoisted(() => vi.fn());
vi.mock('canvas-confetti', () => ({ default: mockConfetti }));

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Wires useTheme directly to Header — the real App.tsx composition. */
function renderHeaderWithThemeHook(totalCount = 0, doneCount = 0) {
  const hookResult = { current: null as ReturnType<typeof useTheme> | null };

  function App() {
    const hook = useTheme();
    hookResult.current = hook;
    return (
      <Header
        theme={hook.theme}
        onToggleTheme={hook.toggleTheme}
        totalCount={totalCount}
        doneCount={doneCount}
      />
    );
  }

  const utils = render(<App />);
  return { ...utils, hookResult };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('useTheme ↔ Header ↔ DOM class integration', () => {
  beforeEach(() => {
    localStorage.clear();
    mockConfetti.mockClear();
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    document.documentElement.classList.remove('dark');
  });

  it('initial render with light theme: document.documentElement does NOT have the "dark" class', () => {
    renderHeaderWithThemeHook();
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('clicking ThemeToggle in Header via useTheme adds "dark" class to document.documentElement', () => {
    renderHeaderWithThemeHook();

    fireEvent.click(screen.getByRole('button', { name: /toggle dark mode/i }));

    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('clicking ThemeToggle twice removes the "dark" class (toggle back to light)', () => {
    renderHeaderWithThemeHook();

    const btn = screen.getByRole('button', { name: /toggle dark mode/i });
    fireEvent.click(btn); // light → dark
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    fireEvent.click(btn); // dark → light
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('useTheme.toggleTheme persists the new theme to localStorage (Header click path)', () => {
    renderHeaderWithThemeHook();

    fireEvent.click(screen.getByRole('button', { name: /toggle dark mode/i }));

    const state = readState();
    expect(state.theme).toBe('dark');
  });

  it('document class and localStorage theme stay in sync after multiple toggles', () => {
    renderHeaderWithThemeHook();

    const btn = screen.getByRole('button', { name: /toggle dark mode/i });

    for (let i = 0; i < 4; i++) {
      fireEvent.click(btn);
      const state = readState();
      const hasDarkClass = document.documentElement.classList.contains('dark');
      const storedDark = state.theme === 'dark';
      expect(hasDarkClass).toBe(storedDark);
    }
  });

  it('Header shows moon icon (🌙) when useTheme returns light — real hook integration', () => {
    renderHeaderWithThemeHook();
    // Initial state is 'light', so moon icon (→ switch to dark) should appear
    expect(
      screen.getByRole('button', { name: /toggle dark mode/i }).textContent,
    ).toContain('🌙');
  });

  it('Header shows sun icon (☀️) when useTheme toggles to dark — real hook integration', () => {
    renderHeaderWithThemeHook();
    fireEvent.click(screen.getByRole('button', { name: /toggle dark mode/i }));
    // After toggle to dark, sun icon (→ switch to light) should appear
    expect(
      screen.getByRole('button', { name: /toggle dark mode/i }).textContent,
    ).toContain('☀️');
  });

  it('starting from persisted dark theme: document.documentElement has "dark" class on mount', () => {
    // Pre-populate localStorage with dark theme — simulates returning user
    localStorage.setItem(
      'todoodle_state',
      JSON.stringify({ tasks: [], theme: 'dark', activeFilter: null }),
    );

    renderHeaderWithThemeHook();

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(screen.getByRole('button', { name: /toggle dark mode/i }).textContent).toContain('☀️');
  });
});

describe('useTheme ↔ useTasks: shared localStorage does not diverge DOM from storage', () => {
  beforeEach(() => {
    localStorage.clear();
    mockConfetti.mockClear();
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    document.documentElement.classList.remove('dark');
  });

  it('useTasks mutations after toggleTheme do NOT remove the "dark" class from the document', () => {
    const { result: themeHook } = renderHook(() => useTheme());
    const { result: tasksHook } = renderHook(() => useTasks());

    // Toggle to dark — DOM class should appear
    act(() => { themeHook.current.toggleTheme(); });
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    // useTasks add/delete/complete — should not touch the DOM class
    act(() => { tasksHook.current.addTask('Buy milk', null); });
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    const id = tasksHook.current.tasks[0].id;
    act(() => { tasksHook.current.toggleComplete(id); });
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    act(() => { tasksHook.current.deleteTask(id); });
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    // localStorage theme must still be 'dark' after all task mutations
    expect(readState().theme).toBe('dark');
  });

  it('useTheme read-before-write preserves useTasks activeFilter after toggleTheme', () => {
    const { result: tasksHook } = renderHook(() => useTasks());
    const { result: themeHook } = renderHook(() => useTheme());

    act(() => { tasksHook.current.setActiveFilter('learning'); });
    expect(readState().activeFilter).toBe('learning');

    // toggleTheme must read current state (including activeFilter) before writing
    act(() => { themeHook.current.toggleTheme(); });

    const state = readState();
    expect(state.theme).toBe('dark');
    expect(state.activeFilter).toBe('learning'); // must survive toggle
  });
});
