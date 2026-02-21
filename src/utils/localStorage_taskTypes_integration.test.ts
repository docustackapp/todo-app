/**
 * Integration tests: localStorage utils ↔ types/index.ts ↔ CATEGORIES
 *
 * The utility-layer branch provides readState/writeState which serialise
 * AppState (defined in types/index.ts) to localStorage.  Task objects
 * carry categoryId values that must match the CATEGORIES constant.
 * These tests exercise the full data-flow from structured Task objects
 * through JSON serialisation and back.
 */
import { readState, writeState, STORAGE_KEY } from './localStorage';
import { DEFAULT_STATE } from '../types/index';
import { CATEGORIES } from '../constants/categories';
import type { AppState, Task } from '../types/index';
import { generateId } from './id';

// Helper to create a fully-valid Task object
function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-id-001',
    text: 'Sample task',
    completed: false,
    categoryId: null,
    order: 0,
    createdAt: '2026-02-21T10:00:00.000Z',
    ...overrides,
  };
}

describe('localStorage ↔ AppState types integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('readState returns DEFAULT_STATE (tasks:[], theme:light, activeFilter:null) when storage is empty', () => {
    const state = readState();
    expect(state).toEqual(DEFAULT_STATE);
    expect(state.tasks).toHaveLength(0);
    expect(state.theme).toBe('light');
    expect(state.activeFilter).toBeNull();
  });

  it('round-trips a Task with all required fields without data loss', () => {
    const task = makeTask({
      id: 'round-trip-id',
      text: 'Buy milk',
      completed: false,
      categoryId: null,
      order: 0,
      createdAt: '2026-02-21T12:00:00.000Z',
    });
    writeState({ tasks: [task], theme: 'light', activeFilter: null });
    const recovered = readState();
    expect(recovered.tasks).toHaveLength(1);
    const t = recovered.tasks[0];
    expect(t.id).toBe('round-trip-id');
    expect(t.text).toBe('Buy milk');
    expect(t.completed).toBe(false);
    expect(t.categoryId).toBeNull();
    expect(t.order).toBe(0);
    expect(t.createdAt).toBe('2026-02-21T12:00:00.000Z');
  });

  it('round-trips a Task with a valid CATEGORIES categoryId without corruption', () => {
    CATEGORIES.forEach((cat) => {
      localStorage.clear();
      const task = makeTask({ categoryId: cat.id });
      writeState({ tasks: [task], theme: 'light', activeFilter: null });
      const recovered = readState();
      expect(recovered.tasks[0].categoryId).toBe(cat.id);
    });
  });

  it('round-trips AppState.theme for both "light" and "dark"', () => {
    (['light', 'dark'] as const).forEach((theme) => {
      localStorage.clear();
      writeState({ tasks: [], theme, activeFilter: null });
      const recovered = readState();
      expect(recovered.theme).toBe(theme);
    });
  });

  it('round-trips AppState.activeFilter for each CATEGORIES id and null', () => {
    const filters: (string | null)[] = [null, ...CATEGORIES.map((c) => c.id)];
    filters.forEach((filter) => {
      localStorage.clear();
      writeState({ tasks: [], theme: 'light', activeFilter: filter });
      const recovered = readState();
      expect(recovered.activeFilter).toBe(filter);
    });
  });

  it('round-trips multiple tasks preserving order and completed status', () => {
    const tasks: Task[] = [
      makeTask({ id: 't1', text: 'Task 1', order: 0, completed: false, categoryId: 'work' }),
      makeTask({ id: 't2', text: 'Task 2', order: 1, completed: true,  categoryId: 'personal' }),
      makeTask({ id: 't3', text: 'Task 3', order: 2, completed: false, categoryId: null }),
    ];
    writeState({ tasks, theme: 'dark', activeFilter: 'work' });
    const recovered = readState();

    expect(recovered.tasks).toHaveLength(3);
    expect(recovered.tasks[0].text).toBe('Task 1');
    expect(recovered.tasks[1].completed).toBe(true);
    expect(recovered.tasks[2].categoryId).toBeNull();
    expect(recovered.theme).toBe('dark');
    expect(recovered.activeFilter).toBe('work');
  });

  it('writeState persists under the exact key "todoodle_state" (STORAGE_KEY)', () => {
    const state: AppState = { tasks: [], theme: 'light', activeFilter: null };
    writeState(state);
    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed).toEqual(state);
  });

  it('generateId produces a non-empty string suitable as Task.id', () => {
    const id = generateId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
    // UUID v4 format: 8-4-4-4-12 hex chars
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it('generateId values can be used as Task IDs that survive a localStorage round-trip', () => {
    const id = generateId();
    const task = makeTask({ id, text: 'Generated ID task' });
    writeState({ tasks: [task], theme: 'light', activeFilter: null });
    const recovered = readState();
    expect(recovered.tasks[0].id).toBe(id);
  });
});
