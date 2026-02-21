/**
 * Integration tests: TaskCard ↔ CategoryBadge ↔ CATEGORIES
 *
 * TaskCard (task-card-component branch) uses CategoryBadge
 * (also task-card-component branch) which in turn pulls data from
 * CATEGORIES (categories constant shared across all merged branches).
 * These tests verify the end-to-end chain: a Task with a given
 * categoryId flows through TaskCard → CategoryBadge → CATEGORIES lookup
 * and produces the correct visual output.
 */
import { render, screen } from '@testing-library/react';
import TaskCard from './TaskCard';
import { CATEGORIES } from '../../constants/categories';
import type { Task } from '../../types/index';

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'integration-test-id',
  text: 'Integration test task',
  completed: false,
  categoryId: null,
  order: 0,
  createdAt: '2026-02-21T00:00:00.000Z',
  ...overrides,
});

describe('TaskCard ↔ CategoryBadge ↔ CATEGORIES integration', () => {
  it('renders the correct category name badge for each of the 6 CATEGORIES', () => {
    CATEGORIES.forEach((cat) => {
      const { unmount } = render(
        <TaskCard
          task={makeTask({ categoryId: cat.id })}
          onToggleComplete={vi.fn()}
          onDelete={vi.fn()}
          onEdit={vi.fn()}
        />,
      );
      expect(
        screen.getByText(new RegExp(cat.name)),
        `TaskCard should render category name "${cat.name}" for categoryId "${cat.id}"`,
      ).toBeInTheDocument();
      unmount();
    });
  });

  it('renders the correct emoji for each category via CategoryBadge', () => {
    CATEGORIES.forEach((cat) => {
      const { unmount } = render(
        <TaskCard
          task={makeTask({ categoryId: cat.id })}
          onToggleComplete={vi.fn()}
          onDelete={vi.fn()}
          onEdit={vi.fn()}
        />,
      );
      const badge = screen.getByText(new RegExp(cat.name));
      expect(
        badge.textContent,
        `CategoryBadge inside TaskCard should contain emoji "${cat.emoji}" for category "${cat.id}"`,
      ).toContain(cat.emoji);
      unmount();
    });
  });

  it('renders no CategoryBadge at all when categoryId is null', () => {
    render(
      <TaskCard
        task={makeTask({ categoryId: null })}
        onToggleComplete={vi.fn()}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
      />,
    );
    // None of the category names should appear in the DOM
    CATEGORIES.forEach((cat) => {
      expect(
        screen.queryByText(new RegExp(cat.name)),
        `No badge should appear when categoryId is null, but found "${cat.name}"`,
      ).not.toBeInTheDocument();
    });
  });

  it('renders one badge only (not multiple) for a single task with a categoryId', () => {
    render(
      <TaskCard
        task={makeTask({ categoryId: 'work' })}
        onToggleComplete={vi.fn()}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
      />,
    );
    // Only Work badge should appear — no other category names
    expect(screen.getByText(/Work/)).toBeInTheDocument();
    ['Personal', 'Shopping', 'Health', 'Learning', 'Fun'].forEach((name) => {
      expect(screen.queryByText(new RegExp(name))).not.toBeInTheDocument();
    });
  });

  it('task text and category badge are both visible simultaneously', () => {
    render(
      <TaskCard
        task={makeTask({ text: 'My important task', categoryId: 'health' })}
        onToggleComplete={vi.fn()}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
      />,
    );
    expect(screen.getByText('My important task')).toBeInTheDocument();
    expect(screen.getByText(/Health/)).toBeInTheDocument();
  });
});
