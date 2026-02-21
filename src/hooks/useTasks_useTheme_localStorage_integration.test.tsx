/**
 * Integration tests: useTasks ↔ useTheme shared localStorage state
 *
 * Both hooks merged from separate branches read and write the SAME
 * localStorage key ('todoodle_state').  A naive write would clobber
 * the slice owned by the other hook.  Both implementations use a
 * read-before-write strategy, so the critical integration guarantee is:
 *
 *   - useTasks mutations MUST preserve the `theme` slice written by useTheme
 *   - useTheme mutations MUST preserve the `tasks` and `activeFilter` slices
 *     written by useTasks
 *
 * These tests simulate the real interaction that occurs when both hooks are
 * mounted simultaneously in the same React tree (as they are in App.tsx).
 */
import { renderHook, act } from '@testing-library/react';
import { useTasks } from './useTasks';
import { useTheme } from './useTheme';
import { readState } from '../utils/localStorage';

// Suppress canvas-confetti in jsdom
const mockConfetti = vi.hoisted(() => vi.fn());
vi.mock('canvas-confetti', () => ({ default: mockConfetti }));

describe('useTasks ↔ useTheme shared localStorage integration', () => {
  beforeEach(() => {
    localStorage.clear();
    mockConfetti.mockClear();
    document.documentElement.classList.remove('dark');
  });

  // ── Priority 1: read-before-write prevents cross-hook clobbering ──────────

  it('useTheme.toggleTheme does NOT clobber tasks previously written by useTasks.addTask', () => {
    const { result: tasksHook } = renderHook(() => useTasks());
    const { result: themeHook } = renderHook(() => useTheme());

    // useTasks writes tasks to localStorage
    act(() => {
      tasksHook.current.addTask('Buy milk', null);
    });
    expect(readState().tasks).toHaveLength(1);
    expect(readState().tasks[0].text).toBe('Buy milk');

    // useTheme toggles theme — must read tasks first, not overwrite them
    act(() => {
      themeHook.current.toggleTheme();
    });

    const state = readState();
    expect(state.theme).toBe('dark'); // theme was toggled
    expect(state.tasks).toHaveLength(1); // tasks must survive
    expect(state.tasks[0].text).toBe('Buy milk'); // task text intact
  });

  it('useTasks.addTask does NOT clobber the theme previously written by useTheme.toggleTheme', () => {
    const { result: themeHook } = renderHook(() => useTheme());
    const { result: tasksHook } = renderHook(() => useTasks());

    // useTheme writes theme 'dark' to localStorage
    act(() => {
      themeHook.current.toggleTheme(); // light → dark
    });
    expect(readState().theme).toBe('dark');

    // useTasks adds a task — must read theme first, not overwrite it
    act(() => {
      tasksHook.current.addTask('Walk the dog', null);
    });

    const state = readState();
    expect(state.tasks).toHaveLength(1); // task written
    expect(state.tasks[0].text).toBe('Walk the dog');
    expect(state.theme).toBe('dark'); // theme must survive
  });

  it('multiple interleaved mutations from both hooks preserve all state slices', () => {
    const { result: tasksHook } = renderHook(() => useTasks());
    const { result: themeHook } = renderHook(() => useTheme());

    act(() => { tasksHook.current.addTask('Task A', 'work'); });
    act(() => { themeHook.current.toggleTheme(); }); // dark
    act(() => { tasksHook.current.addTask('Task B', 'personal'); });
    act(() => { themeHook.current.toggleTheme(); }); // light
    act(() => { tasksHook.current.addTask('Task C', null); });

    const state = readState();
    expect(state.tasks).toHaveLength(3);
    expect(state.tasks.map((t) => t.text)).toEqual(['Task A', 'Task B', 'Task C']);
    expect(state.theme).toBe('light'); // final toggle brought it back to light
  });

  it('useTasks.deleteTask preserves the theme slice written by useTheme', () => {
    const { result: tasksHook } = renderHook(() => useTasks());
    const { result: themeHook } = renderHook(() => useTheme());

    act(() => { tasksHook.current.addTask('Delete me', null); });
    act(() => { themeHook.current.toggleTheme(); }); // dark
    const idToDelete = tasksHook.current.tasks[0].id;

    act(() => { tasksHook.current.deleteTask(idToDelete); });

    const state = readState();
    expect(state.tasks).toHaveLength(0);
    expect(state.theme).toBe('dark'); // theme survives deleteTask
  });

  it('useTasks.editTask preserves the theme slice written by useTheme', () => {
    const { result: tasksHook } = renderHook(() => useTasks());
    const { result: themeHook } = renderHook(() => useTheme());

    act(() => { tasksHook.current.addTask('Original', null); });
    act(() => { themeHook.current.toggleTheme(); }); // dark
    const id = tasksHook.current.tasks[0].id;

    act(() => { tasksHook.current.editTask(id, 'Edited'); });

    const state = readState();
    expect(state.tasks[0].text).toBe('Edited');
    expect(state.theme).toBe('dark'); // theme survives editTask
  });

  it('useTasks.toggleComplete preserves the theme slice written by useTheme', () => {
    const { result: tasksHook } = renderHook(() => useTasks());
    const { result: themeHook } = renderHook(() => useTheme());

    act(() => { tasksHook.current.addTask('Complete me', null); });
    act(() => { themeHook.current.toggleTheme(); }); // dark
    const id = tasksHook.current.tasks[0].id;

    act(() => { tasksHook.current.toggleComplete(id); });

    const state = readState();
    expect(state.tasks[0].completed).toBe(true);
    expect(state.theme).toBe('dark'); // theme survives toggleComplete
  });

  it('useTasks.reorderTasks preserves the theme slice written by useTheme', () => {
    const { result: tasksHook } = renderHook(() => useTasks());
    const { result: themeHook } = renderHook(() => useTheme());

    act(() => { tasksHook.current.addTask('Task 1', null); });
    act(() => { tasksHook.current.addTask('Task 2', null); });
    act(() => { tasksHook.current.addTask('Task 3', null); });
    act(() => { themeHook.current.toggleTheme(); }); // dark

    const id0 = tasksHook.current.tasks[0].id;
    const id2 = tasksHook.current.tasks[2].id;
    act(() => { tasksHook.current.reorderTasks(id0, id2); });

    const state = readState();
    expect(state.tasks).toHaveLength(3);
    expect(state.theme).toBe('dark'); // theme survives reorderTasks
  });

  it('activeFilter persisted by useTasks.setActiveFilter is preserved after useTheme.toggleTheme', () => {
    const { result: tasksHook } = renderHook(() => useTasks());
    const { result: themeHook } = renderHook(() => useTheme());

    act(() => { tasksHook.current.setActiveFilter('work'); });
    expect(readState().activeFilter).toBe('work');

    act(() => { themeHook.current.toggleTheme(); }); // reads current state, writes theme

    const state = readState();
    expect(state.activeFilter).toBe('work'); // activeFilter survives toggleTheme
    expect(state.theme).toBe('dark');
  });
});
