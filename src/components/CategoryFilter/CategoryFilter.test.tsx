import { render, screen, fireEvent } from '@testing-library/react';
import CategoryFilter from './CategoryFilter';

describe('CategoryFilter', () => {
  it('renders 7 chips (All + 6 categories)', () => {
    render(<CategoryFilter activeFilter={null} onFilterChange={vi.fn()} />);
    const chips = screen.getAllByRole('button');
    expect(chips).toHaveLength(7);
  });

  it('clicking category chip calls onFilterChange with category id', () => {
    const mockChange = vi.fn();
    render(<CategoryFilter activeFilter={null} onFilterChange={mockChange} />);
    fireEvent.click(screen.getByText(/Work/));
    expect(mockChange).toHaveBeenCalledWith('work');
  });

  it('clicking All chip calls onFilterChange with null', () => {
    const mockChange = vi.fn();
    render(<CategoryFilter activeFilter="work" onFilterChange={mockChange} />);
    fireEvent.click(screen.getByText(/All/));
    expect(mockChange).toHaveBeenCalledWith(null);
  });

  it('active chip has different CSS class than inactive chips', () => {
    render(<CategoryFilter activeFilter="work" onFilterChange={vi.fn()} />);
    const workChip = screen.getByText(/Work/).closest('button')!;
    const personalChip = screen.getByText(/Personal/).closest('button')!;
    expect(workChip.className).not.toBe(personalChip.className);
  });
});
