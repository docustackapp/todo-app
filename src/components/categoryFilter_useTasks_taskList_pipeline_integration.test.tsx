/**
 * Integration tests: CategoryFilter ↔ useTasks ↔ TaskList full rendering pipeline
 *
 * Three branches were merged that participate in this pipeline:
 *   - issue/category-filter-component → CategoryFilter (emits category IDs)
 *   - issue/hook-use-tasks            → useTasks (setActiveFilter, filteredTasks)
 *   - issue/task-list-component       → TaskList (renders filteredTasks)
 *
 * The critical integration guarantee:
 *   CategoryFilter emits a category ID → useTasks.setActiveFilter stores it →
 *   useTasks.filteredTasks narrows the task list → TaskList renders exactly
 *   the matching tasks and nothing else.
 *
 * If any link in this chain uses a different ID format (e.g., display name
 * instead of slug), the filter would silently show zero results even though
 * matching tasks exist.  These tests exercise the full end-to-end pipeline.
 *
 * NOTE on selectors: when CategoryFilter chips and TaskCard CategoryBadges
 * share the same category name text, we use within(filterBar) to scope
 * chip queries to the filter bar element.
 *
 * NOTE on framer-motion: framer-motion's AnimatePresence keeps exiting elements
 * in the DOM during the exit animation, so DOM-presence checks for removed tasks
 * are unreliable without mocking the library.  We therefore verify filtering
 * correctness via hookResult.filteredTasks (the canonical source of truth) and
 * use DOM assertions only for tasks that are expected to BE present.
 * framer-motion is mocked to allow synchronous removal in tests where DOM-based
 * absence checks are needed.
 */
import React from 'react';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import CategoryFilter from './CategoryFilter/CategoryFilter';
import TaskList from './TaskList/TaskList';
import { useTasks } from '../hooks/useTasks';
import { CATEGORIES } from '../constants/categories';

// Suppress canvas-confetti in jsdom
const mockConfetti = vi.hoisted(() => vi.fn());
vi.mock('canvas-confetti', () => ({ default: mockConfetti }));

// Mock framer-motion so AnimatePresence removes children synchronously.
// This prevents exiting task cards from lingering in the DOM during tests.
vi.mock('framer-motion', () => {

  return {
    motion: {
      div: React.forwardRef(
        ({ children, ...rest }: { children?: React.ReactNode; [key: string]: unknown }, ref: React.Ref<HTMLDivElement>) =>
          React.createElement('div', { ...rest, ref }, children),
      ),
    },
    AnimatePresence: ({ children }: { children?: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
  };
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Renders both CategoryFilter and TaskList wired to the same useTasks hook,
 * as App.tsx would do.  A data-testid wrapper around CategoryFilter lets
 * within() scope chip queries away from same-name TaskCard badges.
 */
function renderFilteredPipeline() {
  const hookResult = { current: null as ReturnType<typeof useTasks> | null };

  function App() {
    const hook = useTasks();
    hookResult.current = hook;
    return (
      <>
        <div data-testid="filter-bar">
          <CategoryFilter
            activeFilter={hook.activeFilter}
            onFilterChange={hook.setActiveFilter}
          />
        </div>
        <TaskList
          tasks={hook.filteredTasks}
          onToggleComplete={hook.toggleComplete}
          onDelete={hook.deleteTask}
          onEdit={hook.editTask}
          onReorder={hook.reorderTasks}
        />
      </>
    );
  }

  const utils = render(<App />);
  return {
    ...utils,
    hookResult,
    getFilterBar: () => utils.getByTestId('filter-bar'),
  };
}

/** Click a chip inside the filter bar, wrapped in act() for state flush. */
function clickChip(filterBar: HTMLElement, name: string | RegExp) {
  act(() => {
    fireEvent.click(within(filterBar).getByRole('button', { name }));
  });
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('CategoryFilter ↔ useTasks ↔ TaskList: full filter pipeline', () => {
  beforeEach(() => {
    localStorage.clear();
    mockConfetti.mockClear();
  });

  it('TaskList shows all tasks when no filter is active (CategoryFilter "All" state)', () => {
    const { hookResult, getFilterBar } = renderFilteredPipeline();

    act(() => { hookResult.current!.addTask('Work task', 'work'); });
    act(() => { hookResult.current!.addTask('Personal task', 'personal'); });
    act(() => { hookResult.current!.addTask('Uncategorised task', null); });

    // All tasks visible in the DOM
    expect(screen.getByText('Work task')).toBeInTheDocument();
    expect(screen.getByText('Personal task')).toBeInTheDocument();
    expect(screen.getByText('Uncategorised task')).toBeInTheDocument();

    // "All" chip carries the active styling
    const allChip = within(getFilterBar()).getByRole('button', { name: /All/ });
    expect(allChip.className).toMatch(/todoodle-coral/);

    // filteredTasks equals the full tasks array
    expect(hookResult.current!.filteredTasks).toHaveLength(3);
  });

  it('clicking a CategoryFilter chip updates useTasks.filteredTasks to only matching tasks', () => {
    const { hookResult, getFilterBar } = renderFilteredPipeline();

    act(() => { hookResult.current!.addTask('Work task', 'work'); });
    act(() => { hookResult.current!.addTask('Shopping task', 'shopping'); });

    // Click the Work chip
    clickChip(getFilterBar(), /Work/);

    // filteredTasks now contains only the Work task
    expect(hookResult.current!.filteredTasks).toHaveLength(1);
    expect(hookResult.current!.filteredTasks[0].text).toBe('Work task');
    expect(hookResult.current!.filteredTasks[0].categoryId).toBe('work');

    // Work task remains in the DOM; Shopping task is no longer in filteredTasks
    expect(screen.getByText('Work task')).toBeInTheDocument();
    expect(screen.queryByText('Shopping task')).not.toBeInTheDocument();
  });

  it('clicking CategoryFilter "All" chip restores all tasks in filteredTasks and DOM', () => {
    const { hookResult, getFilterBar } = renderFilteredPipeline();

    act(() => { hookResult.current!.addTask('Health task', 'health'); });
    act(() => { hookResult.current!.addTask('Fun task', 'fun'); });

    // Activate Health filter
    clickChip(getFilterBar(), /Health/);
    expect(hookResult.current!.filteredTasks).toHaveLength(1);
    expect(screen.queryByText('Fun task')).not.toBeInTheDocument();

    // Reset to "All"
    clickChip(getFilterBar(), /All/);
    expect(hookResult.current!.filteredTasks).toHaveLength(2);
    expect(screen.getByText('Health task')).toBeInTheDocument();
    expect(screen.getByText('Fun task')).toBeInTheDocument();
  });

  it('TaskList shows empty state when filter matches no tasks', () => {
    const { hookResult, getFilterBar } = renderFilteredPipeline();

    act(() => { hookResult.current!.addTask('Work task', 'work'); });

    // Filter by 'learning' — no tasks match
    clickChip(getFilterBar(), /Learning/);

    expect(screen.getByText(/Nothing here yet/i)).toBeInTheDocument();
    expect(hookResult.current!.filteredTasks).toHaveLength(0);
    // The work task still exists in the full (unfiltered) state
    expect(hookResult.current!.tasks).toHaveLength(1);
  });

  it('the filter ID emitted by CategoryFilter chip matches the categoryId in useTasks tasks', () => {
    // Verifies the ID contract between CategoryFilter (slug emitter)
    // and useTasks (categoryId consumer) for every built-in category.
    const { hookResult, getFilterBar } = renderFilteredPipeline();

    CATEGORIES.forEach((cat) => {
      act(() => { hookResult.current!.addTask(`Task for ${cat.name}`, cat.id); });
    });

    CATEGORIES.forEach((cat) => {
      // Click the chip — CategoryFilter must emit cat.id (not cat.name)
      clickChip(getFilterBar(), new RegExp(cat.name));

      expect(
        hookResult.current!.filteredTasks.some((t) => t.categoryId === cat.id),
        `After clicking "${cat.name}" chip, filteredTasks should contain a task with categoryId="${cat.id}"`,
      ).toBe(true);

      // Each chip activation should show exactly one matching task
      expect(
        hookResult.current!.filteredTasks,
        `filteredTasks after clicking "${cat.name}" should have exactly 1 task`,
      ).toHaveLength(1);

      clickChip(getFilterBar(), /All/);
    });
  });

  it('switching between category filters updates filteredTasks correctly each time', () => {
    const { hookResult, getFilterBar } = renderFilteredPipeline();

    act(() => { hookResult.current!.addTask('Work A', 'work'); });
    act(() => { hookResult.current!.addTask('Work B', 'work'); });
    act(() => { hookResult.current!.addTask('Health A', 'health'); });

    // Work filter — 2 tasks
    clickChip(getFilterBar(), /Work/);
    expect(hookResult.current!.filteredTasks).toHaveLength(2);
    expect(hookResult.current!.filteredTasks.every((t) => t.categoryId === 'work')).toBe(true);
    expect(screen.getByText('Work A')).toBeInTheDocument();
    expect(screen.getByText('Work B')).toBeInTheDocument();
    expect(screen.queryByText('Health A')).not.toBeInTheDocument();

    // Switch to Health filter — 1 task
    clickChip(getFilterBar(), /Health/);
    expect(hookResult.current!.filteredTasks).toHaveLength(1);
    expect(hookResult.current!.filteredTasks[0].text).toBe('Health A');
    expect(screen.getByText('Health A')).toBeInTheDocument();
    expect(screen.queryByText('Work A')).not.toBeInTheDocument();
    expect(screen.queryByText('Work B')).not.toBeInTheDocument();
  });

  it('toggling complete on a filtered task calls useTasks.toggleComplete with correct id', () => {
    const { hookResult, getFilterBar } = renderFilteredPipeline();

    act(() => { hookResult.current!.addTask('Complete me', 'fun'); });
    act(() => { hookResult.current!.addTask('Other task', 'work'); });

    // Filter to 'fun' — only 'Complete me' is in filteredTasks and DOM
    clickChip(getFilterBar(), /Fun/);
    expect(hookResult.current!.filteredTasks).toHaveLength(1);

    const taskId = hookResult.current!.tasks.find((t) => t.text === 'Complete me')!.id;

    act(() => {
      // Exactly one checkbox now visible (the Fun task)
      fireEvent.click(screen.getByRole('checkbox'));
    });

    const completedTask = hookResult.current!.tasks.find((t) => t.id === taskId);
    expect(completedTask!.completed).toBe(true);
    expect(mockConfetti).toHaveBeenCalledOnce();

    // The other-category task must still exist and be untouched
    const otherTask = hookResult.current!.tasks.find((t) => t.text === 'Other task');
    expect(otherTask).toBeDefined();
    expect(otherTask!.completed).toBe(false);
  });

  it('deleting a filtered task removes it from both filteredTasks and full tasks', () => {
    const { hookResult, getFilterBar } = renderFilteredPipeline();

    act(() => { hookResult.current!.addTask('Delete me', 'shopping'); });
    act(() => { hookResult.current!.addTask('Keep me', 'shopping'); });

    clickChip(getFilterBar(), /Shopping/);
    expect(hookResult.current!.filteredTasks).toHaveLength(2);

    act(() => {
      const deleteBtns = screen.getAllByLabelText('Delete task');
      fireEvent.click(deleteBtns[0]);
    });

    expect(hookResult.current!.filteredTasks).toHaveLength(1);
    expect(hookResult.current!.tasks).toHaveLength(1);
  });

  it('reorderTasks with active filter: ID-based reorder preserves all tasks', () => {
    const { hookResult, getFilterBar } = renderFilteredPipeline();

    act(() => { hookResult.current!.addTask('Work First', 'work'); });
    act(() => { hookResult.current!.addTask('Personal X', 'personal'); });
    act(() => { hookResult.current!.addTask('Work Second', 'work'); });

    // Filter to show only 'work' tasks
    clickChip(getFilterBar(), /Work/);
    expect(hookResult.current!.filteredTasks).toHaveLength(2);

    const workFirst  = hookResult.current!.tasks.find((t) => t.text === 'Work First')!;
    const workSecond = hookResult.current!.tasks.find((t) => t.text === 'Work Second')!;

    // Simulate dragging workFirst onto workSecond (ID-based reorder)
    act(() => {
      hookResult.current!.reorderTasks(workFirst.id, workSecond.id);
    });

    // Full tasks must still have 3 items (Personal X not lost)
    expect(hookResult.current!.tasks).toHaveLength(3);

    // Personal task must be unmodified
    const personal = hookResult.current!.tasks.find((t) => t.categoryId === 'personal');
    expect(personal).toBeDefined();
    expect(personal!.text).toBe('Personal X');

    // Work First should now come after Work Second in the full array
    const workFirstIdx  = hookResult.current!.tasks.findIndex((t) => t.id === workFirst.id);
    const workSecondIdx = hookResult.current!.tasks.findIndex((t) => t.id === workSecond.id);
    expect(workFirstIdx).toBeGreaterThan(workSecondIdx);
  });
});
