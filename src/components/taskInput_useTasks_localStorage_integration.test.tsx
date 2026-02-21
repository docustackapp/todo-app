/**
 * Integration tests: TaskInput ↔ useTasks ↔ localStorage
 *
 * Two separate branches were merged:
 *   - issue/task-input-component  → provides TaskInput with onAdd prop
 *   - issue/hook-use-tasks        → provides useTasks (addTask, editTask, deleteTask, etc.)
 *
 * These tests wire TaskInput's onAdd directly to useTasks.addTask,
 * replicating exactly how App.tsx should compose them.  They verify:
 *   1. TaskInput submitting text calls useTasks.addTask, which adds the task
 *   2. The task is immediately visible in useTasks.tasks with correct fields
 *   3. The task is persisted to localStorage under 'todoodle_state'
 *   4. categoryId from TaskInput's selector is correctly threaded to the task
 *   5. Whitespace-only / empty input from TaskInput never adds a task
 *   6. TaskInput's reset-after-submit behaviour plays well with useTasks state
 *
 * This is the highest-risk boundary: if the onAdd signature or argument order
 * ever diverges between TaskInput and useTasks.addTask the user can never add
 * a task — a silent integration failure invisible from unit tests alone.
 */
import { render, screen, fireEvent, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import TaskInput from './TaskInput/TaskInput';
import { useTasks } from '../hooks/useTasks';
import { readState } from '../utils/localStorage';

// Suppress canvas-confetti in jsdom
const mockConfetti = vi.hoisted(() => vi.fn());
vi.mock('canvas-confetti', () => ({ default: mockConfetti }));

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * A lightweight wrapper that wires TaskInput to a useTasks hook instance,
 * rendering the hook result as a ref so test code can inspect it after actions.
 */
function renderTaskInputWithHook() {
  const hookResult = { current: null as ReturnType<typeof useTasks> | null };

  function Wrapper() {
    const hook = useTasks();
    hookResult.current = hook;
    return <TaskInput onAdd={hook.addTask} />;
  }

  const utils = render(<Wrapper />);
  return { ...utils, hookResult };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('TaskInput ↔ useTasks integration: task creation pipeline', () => {
  beforeEach(() => {
    localStorage.clear();
    mockConfetti.mockClear();
  });

  it('submitting a task via TaskInput adds it to useTasks.tasks', async () => {
    const { hookResult } = renderTaskInputWithHook();

    const input = screen.getByRole('textbox', { name: /new task text/i });
    fireEvent.change(input, { target: { value: 'Buy milk' } });
    fireEvent.click(screen.getByRole('button', { name: /add task/i }));

    expect(hookResult.current!.tasks).toHaveLength(1);
    expect(hookResult.current!.tasks[0].text).toBe('Buy milk');
    expect(hookResult.current!.tasks[0].completed).toBe(false);
  });

  it('task added via TaskInput is persisted to localStorage immediately', () => {
    renderTaskInputWithHook();

    const input = screen.getByRole('textbox', { name: /new task text/i });
    fireEvent.change(input, { target: { value: 'Walk the dog' } });
    fireEvent.click(screen.getByRole('button', { name: /add task/i }));

    const state = readState();
    expect(state.tasks).toHaveLength(1);
    expect(state.tasks[0].text).toBe('Walk the dog');
  });

  it('categoryId selected in TaskInput is correctly set on the stored task', () => {
    renderTaskInputWithHook();

    const input = screen.getByRole('textbox', { name: /new task text/i });
    fireEvent.change(input, { target: { value: 'Work task' } });

    const select = screen.getByRole('combobox', { name: /select category/i });
    fireEvent.change(select, { target: { value: 'work' } });

    fireEvent.click(screen.getByRole('button', { name: /add task/i }));

    const state = readState();
    expect(state.tasks[0].categoryId).toBe('work');
    expect(state.tasks[0].text).toBe('Work task');
  });

  it('null categoryId (None) from TaskInput is correctly reflected in localStorage', () => {
    renderTaskInputWithHook();

    const input = screen.getByRole('textbox', { name: /new task text/i });
    fireEvent.change(input, { target: { value: 'No category task' } });
    // "None" is the default — no need to change the select
    fireEvent.click(screen.getByRole('button', { name: /add task/i }));

    const state = readState();
    expect(state.tasks[0].categoryId).toBeNull();
  });

  it('whitespace-only input via TaskInput does NOT add any task', () => {
    const { hookResult } = renderTaskInputWithHook();

    const input = screen.getByRole('textbox', { name: /new task text/i });
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: /add task/i }));

    expect(hookResult.current!.tasks).toHaveLength(0);
    expect(readState().tasks).toHaveLength(0);
  });

  it('empty input via TaskInput does NOT add any task', () => {
    const { hookResult } = renderTaskInputWithHook();

    fireEvent.click(screen.getByRole('button', { name: /add task/i }));

    expect(hookResult.current!.tasks).toHaveLength(0);
  });

  it('Enter key in TaskInput adds the task via useTasks.addTask', () => {
    const { hookResult } = renderTaskInputWithHook();

    const input = screen.getByRole('textbox', { name: /new task text/i });
    fireEvent.change(input, { target: { value: 'Enter key task' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(hookResult.current!.tasks).toHaveLength(1);
    expect(hookResult.current!.tasks[0].text).toBe('Enter key task');
    const state = readState();
    expect(state.tasks[0].text).toBe('Enter key task');
  });

  it('text is trimmed by useTasks.addTask even when TaskInput sends trimmed text', () => {
    const { hookResult } = renderTaskInputWithHook();

    const input = screen.getByRole('textbox', { name: /new task text/i });
    // TaskInput itself trims on submit, and useTasks.addTask also trims
    fireEvent.change(input, { target: { value: '  Trim test  ' } });
    fireEvent.click(screen.getByRole('button', { name: /add task/i }));

    expect(hookResult.current!.tasks[0].text).toBe('Trim test');
    expect(readState().tasks[0].text).toBe('Trim test');
  });

  it('adding multiple tasks via TaskInput gives each the correct order value', () => {
    const { hookResult } = renderTaskInputWithHook();

    const input = screen.getByRole('textbox', { name: /new task text/i });

    fireEvent.change(input, { target: { value: 'First' } });
    fireEvent.click(screen.getByRole('button', { name: /add task/i }));

    fireEvent.change(input, { target: { value: 'Second' } });
    fireEvent.click(screen.getByRole('button', { name: /add task/i }));

    fireEvent.change(input, { target: { value: 'Third' } });
    fireEvent.click(screen.getByRole('button', { name: /add task/i }));

    const tasks = hookResult.current!.tasks;
    expect(tasks).toHaveLength(3);
    // order must equal array index
    tasks.forEach((t, i) => {
      expect(t.order).toBe(i);
    });
    // localStorage reflects all three
    expect(readState().tasks).toHaveLength(3);
  });

  it('TaskInput text field resets to empty after useTasks.addTask succeeds', () => {
    renderTaskInputWithHook();

    const input = screen.getByRole('textbox', { name: /new task text/i });
    fireEvent.change(input, { target: { value: 'Reset after submit' } });
    fireEvent.click(screen.getByRole('button', { name: /add task/i }));

    // TaskInput resets its internal text state on successful submit
    expect((input as HTMLInputElement).value).toBe('');
  });
});

describe('TaskInput ↔ useTasks: category + filter interaction', () => {
  beforeEach(() => {
    localStorage.clear();
    mockConfetti.mockClear();
  });

  it('task added with categoryId "work" appears in useTasks.filteredTasks when filter is "work"', () => {
    // Render TaskInput wired to useTasks separately from the hook inspection
    const { result } = renderHook(() => useTasks());

    render(<TaskInput onAdd={result.current.addTask} />);

    const input = screen.getByRole('textbox', { name: /new task text/i });
    fireEvent.change(input, { target: { value: 'Work task' } });
    const select = screen.getByRole('combobox', { name: /select category/i });
    fireEvent.change(select, { target: { value: 'work' } });
    fireEvent.click(screen.getByRole('button', { name: /add task/i }));

    act(() => {
      result.current.setActiveFilter('work');
    });

    expect(result.current.filteredTasks).toHaveLength(1);
    expect(result.current.filteredTasks[0].text).toBe('Work task');
    expect(result.current.filteredTasks[0].categoryId).toBe('work');
  });

  it('task added with no category does NOT appear in filteredTasks when a category filter is active', () => {
    const { result } = renderHook(() => useTasks());

    render(<TaskInput onAdd={result.current.addTask} />);

    const input = screen.getByRole('textbox', { name: /new task text/i });
    fireEvent.change(input, { target: { value: 'No category' } });
    // Leave select at "None" (default)
    fireEvent.click(screen.getByRole('button', { name: /add task/i }));

    act(() => {
      result.current.setActiveFilter('work');
    });

    expect(result.current.filteredTasks).toHaveLength(0);
    expect(result.current.tasks).toHaveLength(1); // still in full list
  });
});
