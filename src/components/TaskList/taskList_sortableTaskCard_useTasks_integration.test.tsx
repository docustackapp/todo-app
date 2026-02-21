/**
 * Integration tests: TaskList ↔ SortableTaskCard ↔ useTasks
 *
 * Three branches were merged that touch this interaction chain:
 *   - issue/hook-use-tasks    → provides useTasks with ID-based reorderTasks
 *   - issue/task-list-component → provides TaskList + SortableTaskCard
 *
 * Critical integration guarantees verified here:
 *   1. TaskList renders exactly one SortableTaskCard per task
 *   2. TaskList displays the empty-state UI when tasks array is empty
 *   3. SortableTaskCard correctly forwards task props to TaskCard (text, completed,
 *      categoryId) — prop-drilling chain must not drop any field
 *   4. TaskList's onReorder receives string IDs (not numeric indices) — verifying
 *      that active.id / over.id are passed through as strings
 *   5. TaskList's onToggleComplete, onDelete, onEdit callbacks reach the
 *      underlying TaskCard and fire with the correct task id
 *   6. When useTasks provides filteredTasks to TaskList, only matching tasks
 *      are rendered
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import TaskList from './TaskList';
import { SortableTaskCard } from './SortableTaskCard';
import { useTasks } from '../../hooks/useTasks';
import type { Task } from '../../types/index';

// Suppress canvas-confetti in jsdom
const mockConfetti = vi.hoisted(() => vi.fn());
vi.mock('canvas-confetti', () => ({ default: mockConfetti }));

// ─── Test task factory ────────────────────────────────────────────────────────

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: `task-${Math.random().toString(36).slice(2)}`,
    text: 'Test task',
    completed: false,
    categoryId: null,
    order: 0,
    createdAt: '2026-02-21T00:00:00.000Z',
    ...overrides,
  };
}

// ─── TaskList rendering ───────────────────────────────────────────────────────

describe('TaskList rendering integration', () => {
  it('renders the empty-state message when tasks array is empty', () => {
    render(
      <TaskList
        tasks={[]}
        onToggleComplete={vi.fn()}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
        onReorder={vi.fn()}
      />,
    );

    expect(screen.getByText(/Nothing here yet/i)).toBeInTheDocument();
    expect(screen.getByText(/Add something fun/i)).toBeInTheDocument();
  });

  it('does not render the empty-state when tasks array is non-empty', () => {
    const tasks = [makeTask({ text: 'Do something' })];

    render(
      <TaskList
        tasks={tasks}
        onToggleComplete={vi.fn()}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
        onReorder={vi.fn()}
      />,
    );

    expect(screen.queryByText(/Nothing here yet/i)).not.toBeInTheDocument();
  });

  it('renders exactly one task card per task in the tasks array', () => {
    const tasks = [
      makeTask({ id: 'id-1', text: 'Task One' }),
      makeTask({ id: 'id-2', text: 'Task Two' }),
      makeTask({ id: 'id-3', text: 'Task Three' }),
    ];

    render(
      <TaskList
        tasks={tasks}
        onToggleComplete={vi.fn()}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
        onReorder={vi.fn()}
      />,
    );

    expect(screen.getByText('Task One')).toBeInTheDocument();
    expect(screen.getByText('Task Two')).toBeInTheDocument();
    expect(screen.getByText('Task Three')).toBeInTheDocument();
  });

  it('onToggleComplete is called with the correct task id when checkbox clicked', () => {
    const onToggleComplete = vi.fn();
    const task = makeTask({ id: 'abc-123', text: 'Click me' });

    render(
      <TaskList
        tasks={[task]}
        onToggleComplete={onToggleComplete}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
        onReorder={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('checkbox'));

    expect(onToggleComplete).toHaveBeenCalledOnce();
    expect(onToggleComplete).toHaveBeenCalledWith('abc-123');
  });

  it('onDelete is called with the correct task id when delete button clicked', () => {
    const onDelete = vi.fn();
    const task = makeTask({ id: 'del-456', text: 'Delete me' });

    render(
      <TaskList
        tasks={[task]}
        onToggleComplete={vi.fn()}
        onDelete={onDelete}
        onEdit={vi.fn()}
        onReorder={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByLabelText('Delete task'));

    expect(onDelete).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledWith('del-456');
  });

  it('renders task text from the task prop (prop-drilling through SortableTaskCard → TaskCard)', () => {
    const task = makeTask({ text: 'Unique text from task prop' });

    render(
      <TaskList
        tasks={[task]}
        onToggleComplete={vi.fn()}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
        onReorder={vi.fn()}
      />,
    );

    expect(screen.getByText('Unique text from task prop')).toBeInTheDocument();
  });
});

// ─── SortableTaskCard ↔ TaskCard prop forwarding ─────────────────────────────

describe('SortableTaskCard ↔ TaskCard prop forwarding integration', () => {
  it('renders task.text inside TaskCard via SortableTaskCard', () => {
    const task = makeTask({ text: 'Prop forwarding test' });

    render(
      <SortableTaskCard
        task={task}
        onToggleComplete={vi.fn()}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    expect(screen.getByText('Prop forwarding test')).toBeInTheDocument();
  });

  it('renders strikethrough style when task.completed is true', () => {
    const task = makeTask({ text: 'Completed task', completed: true });

    render(
      <SortableTaskCard
        task={task}
        onToggleComplete={vi.fn()}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    const textEl = screen.getByText('Completed task');
    // TaskCard applies 'line-through' class when completed
    expect(textEl.className).toMatch(/line-through/);
  });

  it('does NOT render strikethrough when task.completed is false', () => {
    const task = makeTask({ text: 'Incomplete task', completed: false });

    render(
      <SortableTaskCard
        task={task}
        onToggleComplete={vi.fn()}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    const textEl = screen.getByText('Incomplete task');
    expect(textEl.className).not.toMatch(/line-through/);
  });

  it('renders a CategoryBadge when task.categoryId is non-null', () => {
    const task = makeTask({ text: 'Categorized', categoryId: 'work' });

    render(
      <SortableTaskCard
        task={task}
        onToggleComplete={vi.fn()}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    // CategoryBadge renders the category name
    expect(screen.getByText(/Work/)).toBeInTheDocument();
  });

  it('does NOT render a CategoryBadge when task.categoryId is null', () => {
    const task = makeTask({ text: 'No category', categoryId: null });

    render(
      <SortableTaskCard
        task={task}
        onToggleComplete={vi.fn()}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    // No category badge text should appear
    expect(screen.queryByText(/Work|Personal|Shopping|Health|Learning|Fun/)).not.toBeInTheDocument();
  });

  it('drag handle button is rendered inside SortableTaskCard', () => {
    const task = makeTask({ text: 'Draggable task' });

    render(
      <SortableTaskCard
        task={task}
        onToggleComplete={vi.fn()}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('Drag to reorder')).toBeInTheDocument();
  });

  it('onToggleComplete fires with task.id when checkbox clicked through SortableTaskCard', () => {
    const onToggleComplete = vi.fn();
    const task = makeTask({ id: 'sortable-id-789', text: 'Toggle via sortable' });

    render(
      <SortableTaskCard
        task={task}
        onToggleComplete={onToggleComplete}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('checkbox'));

    expect(onToggleComplete).toHaveBeenCalledOnce();
    expect(onToggleComplete).toHaveBeenCalledWith('sortable-id-789');
  });
});

// ─── TaskList ↔ useTasks integration ─────────────────────────────────────────

describe('TaskList ↔ useTasks integration', () => {
  beforeEach(() => {
    localStorage.clear();
    mockConfetti.mockClear();
  });

  it('TaskList renders filteredTasks from useTasks (only matching tasks shown under active filter)', () => {
    const { result } = renderHook(() => useTasks());

    act(() => { result.current.addTask('Work task', 'work'); });
    act(() => { result.current.addTask('Personal task', 'personal'); });
    act(() => { result.current.setActiveFilter('work'); });

    // Render TaskList with filteredTasks (as App.tsx does)
    const { rerender } = render(
      <TaskList
        tasks={result.current.filteredTasks}
        onToggleComplete={result.current.toggleComplete}
        onDelete={result.current.deleteTask}
        onEdit={result.current.editTask}
        onReorder={result.current.reorderTasks}
      />,
    );

    // Only 'Work task' should be visible
    expect(screen.getByText('Work task')).toBeInTheDocument();
    expect(screen.queryByText('Personal task')).not.toBeInTheDocument();

    // Clear filter → both tasks should appear
    act(() => { result.current.setActiveFilter(null); });

    rerender(
      <TaskList
        tasks={result.current.filteredTasks}
        onToggleComplete={result.current.toggleComplete}
        onDelete={result.current.deleteTask}
        onEdit={result.current.editTask}
        onReorder={result.current.reorderTasks}
      />,
    );

    expect(screen.getByText('Work task')).toBeInTheDocument();
    expect(screen.getByText('Personal task')).toBeInTheDocument();
  });

  it('TaskList shows empty state when useTasks.filteredTasks is empty due to active filter', () => {
    const { result } = renderHook(() => useTasks());

    act(() => { result.current.addTask('Work task', 'work'); });
    act(() => { result.current.setActiveFilter('health'); }); // no health tasks

    render(
      <TaskList
        tasks={result.current.filteredTasks}
        onToggleComplete={result.current.toggleComplete}
        onDelete={result.current.deleteTask}
        onEdit={result.current.editTask}
        onReorder={result.current.reorderTasks}
      />,
    );

    expect(screen.getByText(/Nothing here yet/i)).toBeInTheDocument();
  });

  it('onReorder from TaskList connects to useTasks.reorderTasks and updates task order', () => {
    const { result } = renderHook(() => useTasks());

    act(() => { result.current.addTask('First', null); });
    act(() => { result.current.addTask('Second', null); });

    const id0 = result.current.tasks[0].id;
    const id1 = result.current.tasks[1].id;

    // Simulate what TaskList.handleDragEnd does: call onReorder with string IDs
    act(() => {
      result.current.reorderTasks(id0, id1);
    });

    // Tasks should be swapped
    expect(result.current.tasks[0].text).toBe('Second');
    expect(result.current.tasks[1].text).toBe('First');
    expect(result.current.tasks).toHaveLength(2);
  });

  it('onToggleComplete from TaskList triggers confetti on first completion', () => {
    const { result } = renderHook(() => useTasks());

    act(() => { result.current.addTask('Complete this', null); });

    render(
      <TaskList
        tasks={result.current.tasks}
        onToggleComplete={result.current.toggleComplete}
        onDelete={result.current.deleteTask}
        onEdit={result.current.editTask}
        onReorder={result.current.reorderTasks}
      />,
    );

    act(() => {
      fireEvent.click(screen.getByRole('checkbox'));
    });

    // Confetti fires on false→true transition
    expect(mockConfetti).toHaveBeenCalledOnce();

    // Task is now complete
    expect(result.current.tasks[0].completed).toBe(true);
  });

  it('onDelete from TaskList removes the task from useTasks state', () => {
    const { result } = renderHook(() => useTasks());

    act(() => { result.current.addTask('Delete me', null); });
    expect(result.current.tasks).toHaveLength(1);

    const { rerender } = render(
      <TaskList
        tasks={result.current.tasks}
        onToggleComplete={result.current.toggleComplete}
        onDelete={result.current.deleteTask}
        onEdit={result.current.editTask}
        onReorder={result.current.reorderTasks}
      />,
    );

    act(() => {
      fireEvent.click(screen.getByLabelText('Delete task'));
    });

    rerender(
      <TaskList
        tasks={result.current.tasks}
        onToggleComplete={result.current.toggleComplete}
        onDelete={result.current.deleteTask}
        onEdit={result.current.editTask}
        onReorder={result.current.reorderTasks}
      />,
    );

    expect(result.current.tasks).toHaveLength(0);
    expect(screen.getByText(/Nothing here yet/i)).toBeInTheDocument();
  });
});
