import { renderHook, act } from '@testing-library/react';
import { useTasks } from './useTasks';
import { readState } from '../utils/localStorage';

// Mock canvas-confetti so triggerConfetti() doesn't fail in jsdom.
// vi.hoisted ensures mockConfetti is available inside the factory function.
const mockConfetti = vi.hoisted(() => vi.fn());
vi.mock('canvas-confetti', () => ({ default: mockConfetti }));

describe('useTasks', () => {
  beforeEach(() => {
    localStorage.clear();
    mockConfetti.mockClear();
  });

  // ─── addTask ──────────────────────────────────────────────────────────────

  it('addTask with valid text creates a task with correct properties', () => {
    const { result } = renderHook(() => useTasks());

    act(() => {
      result.current.addTask('Buy milk', null);
    });

    expect(result.current.tasks).toHaveLength(1);
    expect(result.current.tasks[0].text).toBe('Buy milk');
    expect(result.current.tasks[0].completed).toBe(false);
  });

  it('addTask with empty string does not increase tasks.length', () => {
    const { result } = renderHook(() => useTasks());

    act(() => {
      result.current.addTask('', null);
    });

    expect(result.current.tasks).toHaveLength(0);
  });

  it('addTask with whitespace-only string does not increase tasks.length', () => {
    const { result } = renderHook(() => useTasks());

    act(() => {
      result.current.addTask('  ', null);
    });

    expect(result.current.tasks).toHaveLength(0);
  });

  // ─── toggleComplete ───────────────────────────────────────────────────────

  it('toggleComplete sets completed from false to true', () => {
    const { result } = renderHook(() => useTasks());

    act(() => {
      result.current.addTask('Buy milk', null);
    });
    const id = result.current.tasks[0].id;

    act(() => {
      result.current.toggleComplete(id);
    });

    expect(result.current.tasks[0].completed).toBe(true);
  });

  it('toggleComplete fires confetti exactly once on false→true transition', () => {
    const { result } = renderHook(() => useTasks());

    act(() => {
      result.current.addTask('Buy milk', null);
    });
    const id = result.current.tasks[0].id;

    act(() => {
      result.current.toggleComplete(id);
    });

    expect(mockConfetti).toHaveBeenCalledTimes(1);
  });

  it('toggleComplete sets completed from true back to false', () => {
    const { result } = renderHook(() => useTasks());

    act(() => {
      result.current.addTask('Buy milk', null);
    });
    const id = result.current.tasks[0].id;

    act(() => {
      result.current.toggleComplete(id); // false → true
    });
    act(() => {
      result.current.toggleComplete(id); // true → false
    });

    expect(result.current.tasks[0].completed).toBe(false);
  });

  it('toggleComplete does not fire confetti on true→false transition', () => {
    const { result } = renderHook(() => useTasks());

    act(() => {
      result.current.addTask('Buy milk', null);
    });
    const id = result.current.tasks[0].id;

    act(() => {
      result.current.toggleComplete(id); // false → true (fires confetti)
    });
    mockConfetti.mockClear();

    act(() => {
      result.current.toggleComplete(id); // true → false (no confetti)
    });

    expect(mockConfetti).toHaveBeenCalledTimes(0);
  });

  // ─── deleteTask ───────────────────────────────────────────────────────────

  it('deleteTask removes exactly one task and leaves remaining tasks unchanged', () => {
    const { result } = renderHook(() => useTasks());

    act(() => {
      result.current.addTask('Task 1', null);
    });
    act(() => {
      result.current.addTask('Task 2', null);
    });

    const idToDelete = result.current.tasks[0].id;
    const remainingText = result.current.tasks[1].text;

    act(() => {
      result.current.deleteTask(idToDelete);
    });

    expect(result.current.tasks).toHaveLength(1);
    expect(result.current.tasks[0].text).toBe(remainingText);
  });

  // ─── editTask ─────────────────────────────────────────────────────────────

  it('editTask updates text while preserving task id and completed', () => {
    const { result } = renderHook(() => useTasks());

    act(() => {
      result.current.addTask('Original text', null);
    });
    const { id, completed } = result.current.tasks[0];

    act(() => {
      result.current.editTask(id, 'New text');
    });

    expect(result.current.tasks[0].text).toBe('New text');
    expect(result.current.tasks[0].id).toBe(id);
    expect(result.current.tasks[0].completed).toBe(completed);
  });

  it('editTask with empty string does not update task text', () => {
    const { result } = renderHook(() => useTasks());

    act(() => {
      result.current.addTask('Original text', null);
    });
    const id = result.current.tasks[0].id;

    act(() => {
      result.current.editTask(id, '');
    });

    expect(result.current.tasks[0].text).toBe('Original text');
  });

  // ─── reorderTasks ─────────────────────────────────────────────────────────

  it('reorderTasks(tasks[0].id, tasks[2].id) moves the task at index 0 to index 2', () => {
    const { result } = renderHook(() => useTasks());

    act(() => {
      result.current.addTask('Task A', null);
    });
    act(() => {
      result.current.addTask('Task B', null);
    });
    act(() => {
      result.current.addTask('Task C', null);
    });

    const id0 = result.current.tasks[0].id;
    const id2 = result.current.tasks[2].id;

    act(() => {
      result.current.reorderTasks(id0, id2);
    });

    expect(result.current.tasks[2].id).toBe(id0);
  });

  // ─── localStorage persistence ─────────────────────────────────────────────

  it('after addTask, readState() contains an entry with matching text', () => {
    const { result } = renderHook(() => useTasks());

    act(() => {
      result.current.addTask('Buy milk', null);
    });

    const state = readState();
    expect(state.tasks.some((t) => t.text === 'Buy milk')).toBe(true);
  });
});
