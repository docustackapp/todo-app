/**
 * Integration tests: useTasks filteredTasks ↔ reorderTasks with active filter
 *
 * The v1.1 architectural fix changed reorderTasks from index-based to ID-based
 * so that dragging works correctly when a category filter is active.  When a
 * filter is set, filteredTasks is a SUBSET of tasks, so old index-based logic
 * would map filtered indices onto wrong positions in the full array, corrupting
 * the task order.
 *
 * These tests exercise:
 *   1. filteredTasks correctly shows only tasks matching activeFilter
 *   2. reorderTasks(activeId, overId) resolves positions in the FULL tasks
 *      array, so cross-filter reordering doesn't lose or corrupt tasks
 *   3. Clearing the filter after a reorder shows all tasks with correct order
 *   4. setActiveFilter persists and filteredTasks updates reactively
 */
import { renderHook, act } from '@testing-library/react';
import { useTasks } from './useTasks';
import { readState } from '../utils/localStorage';

// Suppress canvas-confetti in jsdom
const mockConfetti = vi.hoisted(() => vi.fn());
vi.mock('canvas-confetti', () => ({ default: mockConfetti }));

describe('useTasks: filteredTasks ↔ reorderTasks with active filter', () => {
  beforeEach(() => {
    localStorage.clear();
    mockConfetti.mockClear();
  });

  // ── filteredTasks correctness ─────────────────────────────────────────────

  it('filteredTasks returns all tasks when activeFilter is null', () => {
    const { result } = renderHook(() => useTasks());

    act(() => { result.current.addTask('Task A', 'work'); });
    act(() => { result.current.addTask('Task B', 'personal'); });
    act(() => { result.current.addTask('Task C', null); });

    // No filter active → filteredTasks === tasks
    expect(result.current.activeFilter).toBeNull();
    expect(result.current.filteredTasks).toHaveLength(3);
  });

  it('filteredTasks returns only tasks matching activeFilter category', () => {
    const { result } = renderHook(() => useTasks());

    act(() => { result.current.addTask('Work task 1', 'work'); });
    act(() => { result.current.addTask('Personal task', 'personal'); });
    act(() => { result.current.addTask('Work task 2', 'work'); });

    act(() => { result.current.setActiveFilter('work'); });

    expect(result.current.filteredTasks).toHaveLength(2);
    expect(result.current.filteredTasks.every((t) => t.categoryId === 'work')).toBe(true);
  });

  it('filteredTasks returns empty array when no tasks match the active filter', () => {
    const { result } = renderHook(() => useTasks());

    act(() => { result.current.addTask('Work task', 'work'); });

    act(() => { result.current.setActiveFilter('health'); });

    expect(result.current.filteredTasks).toHaveLength(0);
  });

  it('filteredTasks updates when setActiveFilter is called', () => {
    const { result } = renderHook(() => useTasks());

    act(() => { result.current.addTask('Work task', 'work'); });
    act(() => { result.current.addTask('Health task', 'health'); });

    // Switch to 'health' filter
    act(() => { result.current.setActiveFilter('health'); });
    expect(result.current.filteredTasks).toHaveLength(1);
    expect(result.current.filteredTasks[0].categoryId).toBe('health');

    // Clear filter → all tasks visible
    act(() => { result.current.setActiveFilter(null); });
    expect(result.current.filteredTasks).toHaveLength(2);
  });

  // ── ID-based reorderTasks with no filter active ───────────────────────────

  it('reorderTasks(id0, id2) correctly moves first task to third position in unfiltered list', () => {
    const { result } = renderHook(() => useTasks());

    act(() => { result.current.addTask('Alpha', null); });
    act(() => { result.current.addTask('Beta', null); });
    act(() => { result.current.addTask('Gamma', null); });

    const id0 = result.current.tasks[0].id; // Alpha
    const id2 = result.current.tasks[2].id; // Gamma

    act(() => { result.current.reorderTasks(id0, id2); });

    // Alpha should now be at index 2
    expect(result.current.tasks[2].id).toBe(id0);
    expect(result.current.tasks[2].text).toBe('Alpha');
    // All three tasks still present
    expect(result.current.tasks).toHaveLength(3);
  });

  it('reorderTasks assigns correct sequential order values after reorder', () => {
    const { result } = renderHook(() => useTasks());

    act(() => { result.current.addTask('Task 1', null); });
    act(() => { result.current.addTask('Task 2', null); });
    act(() => { result.current.addTask('Task 3', null); });

    const id0 = result.current.tasks[0].id;
    const id2 = result.current.tasks[2].id;

    act(() => { result.current.reorderTasks(id0, id2); });

    // order field must equal array index for every task after reorder
    result.current.tasks.forEach((t, i) => {
      expect(t.order).toBe(i);
    });
  });

  // ── ID-based reorderTasks while a category filter is active ──────────────

  it('reorderTasks with active filter does NOT lose any tasks from full tasks array', () => {
    const { result } = renderHook(() => useTasks());

    // Mixed tasks: 2 work, 1 personal
    act(() => { result.current.addTask('Work A', 'work'); });
    act(() => { result.current.addTask('Personal 1', 'personal'); });
    act(() => { result.current.addTask('Work B', 'work'); });

    // Activate 'work' filter
    act(() => { result.current.setActiveFilter('work'); });
    expect(result.current.filteredTasks).toHaveLength(2);

    // Reorder the two visible work tasks (using their real IDs from full tasks)
    const workTaskIds = result.current.tasks
      .filter((t) => t.categoryId === 'work')
      .map((t) => t.id);
    expect(workTaskIds).toHaveLength(2);

    act(() => { result.current.reorderTasks(workTaskIds[0], workTaskIds[1]); });

    // Full tasks array must still have all 3 tasks
    expect(result.current.tasks).toHaveLength(3);
  });

  it('reorderTasks with active filter does NOT corrupt non-matching tasks', () => {
    const { result } = renderHook(() => useTasks());

    act(() => { result.current.addTask('Work A', 'work'); });
    act(() => { result.current.addTask('Personal 1', 'personal'); });
    act(() => { result.current.addTask('Work B', 'work'); });

    const personalId = result.current.tasks.find((t) => t.categoryId === 'personal')!.id;

    act(() => { result.current.setActiveFilter('work'); });

    const workIds = result.current.tasks
      .filter((t) => t.categoryId === 'work')
      .map((t) => t.id);

    act(() => { result.current.reorderTasks(workIds[0], workIds[1]); });

    // The personal task must be unchanged after reorder
    const personalTask = result.current.tasks.find((t) => t.id === personalId);
    expect(personalTask).toBeDefined();
    expect(personalTask!.categoryId).toBe('personal');
    expect(personalTask!.text).toBe('Personal 1');
  });

  it('clearing the filter after reorder shows all tasks with updated order', () => {
    const { result } = renderHook(() => useTasks());

    act(() => { result.current.addTask('Work A', 'work'); }); // index 0
    act(() => { result.current.addTask('Work B', 'work'); }); // index 1
    act(() => { result.current.addTask('Work C', 'work'); }); // index 2

    act(() => { result.current.setActiveFilter('work'); });

    const id0 = result.current.tasks[0].id; // Work A
    const id2 = result.current.tasks[2].id; // Work C

    // Move Work A to position 2
    act(() => { result.current.reorderTasks(id0, id2); });

    // Clear filter
    act(() => { result.current.setActiveFilter(null); });

    // All tasks still present
    expect(result.current.filteredTasks).toHaveLength(3);
    // Work A moved to last position
    expect(result.current.filteredTasks[2].id).toBe(id0);
  });

  it('reorderTasks with a non-existent ID is a no-op and does not throw', () => {
    const { result } = renderHook(() => useTasks());

    act(() => { result.current.addTask('Task 1', null); });
    act(() => { result.current.addTask('Task 2', null); });

    const originalTexts = result.current.tasks.map((t) => t.text);

    // Call with a bogus ID — should silently do nothing
    act(() => {
      result.current.reorderTasks('non-existent-id', result.current.tasks[0].id);
    });

    expect(result.current.tasks.map((t) => t.text)).toEqual(originalTexts);
  });

  // ── setActiveFilter persists to localStorage ──────────────────────────────

  it('setActiveFilter value is persisted to localStorage', () => {
    const { result } = renderHook(() => useTasks());

    act(() => { result.current.setActiveFilter('shopping'); });

    const state = readState();
    expect(state.activeFilter).toBe('shopping');
  });

  it('clearing activeFilter (null) is persisted to localStorage', () => {
    const { result } = renderHook(() => useTasks());

    act(() => { result.current.setActiveFilter('shopping'); });
    act(() => { result.current.setActiveFilter(null); });

    const state = readState();
    expect(state.activeFilter).toBeNull();
  });
});
