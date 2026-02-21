import { render, screen, fireEvent } from '@testing-library/react';
import TaskCard from './TaskCard';
import type { Task } from '../../types/index';

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'test-id',
  text: 'Test task',
  completed: false,
  categoryId: null,
  order: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

describe('TaskCard', () => {
  it('renders task text', () => {
    render(<TaskCard task={makeTask()} onToggleComplete={vi.fn()} onDelete={vi.fn()} onEdit={vi.fn()} />);
    expect(screen.getByText('Test task')).toBeInTheDocument();
  });

  it('renders strikethrough when completed:true', () => {
    render(<TaskCard task={makeTask({ completed: true })} onToggleComplete={vi.fn()} onDelete={vi.fn()} onEdit={vi.fn()} />);
    const text = screen.getByText('Test task');
    expect(text).toHaveClass('line-through');
  });

  it('does not render strikethrough when completed:false', () => {
    render(<TaskCard task={makeTask({ completed: false })} onToggleComplete={vi.fn()} onDelete={vi.fn()} onEdit={vi.fn()} />);
    const text = screen.getByText('Test task');
    expect(text).not.toHaveClass('line-through');
  });

  it('renders CategoryBadge when categoryId is non-null', () => {
    render(<TaskCard task={makeTask({ categoryId: 'work' })} onToggleComplete={vi.fn()} onDelete={vi.fn()} onEdit={vi.fn()} />);
    expect(screen.getByText(/Work/)).toBeInTheDocument();
  });

  it('does not render CategoryBadge when categoryId is null', () => {
    render(<TaskCard task={makeTask({ categoryId: null })} onToggleComplete={vi.fn()} onDelete={vi.fn()} onEdit={vi.fn()} />);
    expect(screen.queryByText(/Work|Personal|Shopping|Health|Learning|Fun/)).not.toBeInTheDocument();
  });

  it('clicking checkbox calls onToggleComplete with task id', () => {
    const mockToggle = vi.fn();
    render(<TaskCard task={makeTask()} onToggleComplete={mockToggle} onDelete={vi.fn()} onEdit={vi.fn()} />);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(mockToggle).toHaveBeenCalledWith('test-id');
  });
});
