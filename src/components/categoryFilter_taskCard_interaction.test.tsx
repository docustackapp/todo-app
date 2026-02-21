/**
 * Integration tests: CategoryFilter ↔ TaskCard ↔ CategoryBadge cross-feature interaction
 *
 * Three separate branches (category-filter-component, task-card-component,
 * utility-layer) all depend on the shared CATEGORIES constant.  The filter
 * IDs emitted by CategoryFilter must exactly match the categoryId values
 * that TaskCard/CategoryBadge use for lookup.  A mismatch would mean a user
 * clicking a filter chip would never see a match against any task badge.
 *
 * These tests exercise the full filter → task render pipeline in isolation.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import CategoryFilter from './CategoryFilter/CategoryFilter';
import TaskCard from './TaskCard/TaskCard';
import { CATEGORIES } from '../constants/categories';
import type { Task } from '../types/index';

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'cross-feature-id',
  text: 'Cross feature task',
  completed: false,
  categoryId: null,
  order: 0,
  createdAt: '2026-02-21T00:00:00.000Z',
  ...overrides,
});

describe('CategoryFilter ↔ TaskCard ↔ CategoryBadge cross-feature interaction', () => {
  it('IDs emitted by CategoryFilter chips match the categoryId values accepted by TaskCard/CategoryBadge for all 6 categories', () => {
    CATEGORIES.forEach((cat) => {
      // Render the filter bar and capture what ID it emits when clicked
      const emitted: (string | null)[] = [];
      const { unmount: unmountFilter } = render(
        <CategoryFilter activeFilter={null} onFilterChange={(id) => emitted.push(id)} />,
      );
      fireEvent.click(screen.getByText(new RegExp(cat.name)));
      const filterId = emitted[0];
      unmountFilter();

      // Now render a TaskCard with that exact categoryId and verify CategoryBadge shows
      const { unmount: unmountCard } = render(
        <TaskCard
          task={makeTask({ categoryId: filterId as string })}
          onToggleComplete={vi.fn()}
          onDelete={vi.fn()}
          onEdit={vi.fn()}
        />,
      );
      expect(
        screen.getByText(new RegExp(cat.name)),
        `After CategoryFilter emits "${filterId}", a TaskCard with categoryId="${filterId}" should show the "${cat.name}" badge`,
      ).toBeInTheDocument();
      unmountCard();
    });
  });

  it('null emitted by CategoryFilter "All" chip is distinct from any CATEGORIES id', () => {
    const emitted: (string | null)[] = [];
    render(
      <CategoryFilter activeFilter="work" onFilterChange={(id) => emitted.push(id)} />,
    );
    fireEvent.click(screen.getByText(/All/));
    expect(emitted[0]).toBeNull();
    const categoryIds = CATEGORIES.map((c) => c.id);
    expect(categoryIds).not.toContain(null);
  });

  it('a task with categoryId="work" renders the same text as the CategoryFilter "Work" chip', () => {
    // The category name displayed in the filter chip and the badge must match
    render(
      <TaskCard
        task={makeTask({ categoryId: 'work' })}
        onToggleComplete={vi.fn()}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
      />,
    );
    const badge = screen.getByText(/Work/);
    expect(badge).toBeInTheDocument();

    // The CATEGORIES constant provides the single source of truth for both
    const workCategory = CATEGORIES.find((c) => c.id === 'work');
    expect(workCategory?.name).toBe('Work');
    expect(badge.textContent).toContain(workCategory!.name);
  });

  it('every CATEGORIES id appears in CategoryFilter chips', () => {
    // Render CategoryFilter and capture all chip texts in isolation
    const { container: filterContainer } = render(
      <CategoryFilter activeFilter={null} onFilterChange={vi.fn()} />,
    );
    const chipTexts = Array.from(filterContainer.querySelectorAll('button'))
      .map((b) => b.textContent ?? '');

    CATEGORIES.forEach((cat) => {
      expect(
        chipTexts.some((t) => t.includes(cat.name)),
        `CategoryFilter should display a chip for category "${cat.name}"`,
      ).toBe(true);
    });
  });

  it('every CATEGORIES id is a valid TaskCard categoryId that renders a badge', () => {
    // Test each category independently to avoid DOM collision between
    // CategoryFilter chips and TaskCard badges carrying the same category name.
    CATEGORIES.forEach((cat) => {
      const { unmount, container } = render(
        <TaskCard
          task={makeTask({ categoryId: cat.id })}
          onToggleComplete={vi.fn()}
          onDelete={vi.fn()}
          onEdit={vi.fn()}
        />,
      );
      // Query within the TaskCard container only (no CategoryFilter in scope)
      const badge = container.querySelector('span.rounded-full');
      expect(
        badge,
        `TaskCard should render a badge element for category "${cat.id}"`,
      ).not.toBeNull();
      expect(
        badge!.textContent,
        `Badge text should include category name "${cat.name}"`,
      ).toContain(cat.name);
      unmount();
    });
  });
});
