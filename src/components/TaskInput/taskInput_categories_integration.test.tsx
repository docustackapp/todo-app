/**
 * Integration tests: TaskInput ↔ CATEGORIES constant
 *
 * TaskInput (task-input-component branch) imports CATEGORIES from
 * the shared categories.ts constant.  These tests verify that the
 * category selector in TaskInput reflects the CATEGORIES data exactly,
 * and that the onAdd callback receives the correct categoryId strings
 * (which must match the IDs used by TaskCard/CategoryBadge).
 */
import { render, screen, fireEvent } from '@testing-library/react';
import TaskInput from './TaskInput';
import { CATEGORIES } from '../../constants/categories';

describe('TaskInput ↔ CATEGORIES integration', () => {
  it('renders exactly CATEGORIES.length + 1 options in the category selector (None + 6)', () => {
    render(<TaskInput onAdd={vi.fn()} />);
    const select = screen.getByRole('combobox', { name: /select category/i });
    const options = select.querySelectorAll('option');
    expect(options).toHaveLength(CATEGORIES.length + 1); // +1 for "None"
  });

  it('includes a "None" option as the first entry in the category selector', () => {
    render(<TaskInput onAdd={vi.fn()} />);
    const select = screen.getByRole('combobox', { name: /select category/i });
    const firstOption = select.querySelectorAll('option')[0];
    expect(firstOption.value).toBe('');
    expect(firstOption.textContent).toBe('None');
  });

  it('renders an option for every category in CATEGORIES with matching value (id)', () => {
    render(<TaskInput onAdd={vi.fn()} />);
    const select = screen.getByRole('combobox', { name: /select category/i });
    const optionValues = Array.from(select.querySelectorAll('option'))
      .map((o) => o.value)
      .filter((v) => v !== ''); // exclude "None"

    CATEGORIES.forEach((cat) => {
      expect(
        optionValues,
        `Category selector should have an option with value "${cat.id}"`,
      ).toContain(cat.id);
    });
  });

  it('calls onAdd with null categoryId when "None" is selected and form is submitted', () => {
    const mockOnAdd = vi.fn();
    render(<TaskInput onAdd={mockOnAdd} />);

    const input = screen.getByRole('textbox', { name: /new task text/i });
    fireEvent.change(input, { target: { value: 'My task' } });
    // "None" is default — value is ''
    fireEvent.click(screen.getByRole('button', { name: /add task/i }));

    expect(mockOnAdd).toHaveBeenCalledOnce();
    expect(mockOnAdd).toHaveBeenCalledWith('My task', null);
  });

  it('calls onAdd with the selected categoryId string matching a CATEGORIES id', () => {
    const mockOnAdd = vi.fn();
    render(<TaskInput onAdd={mockOnAdd} />);

    const input = screen.getByRole('textbox', { name: /new task text/i });
    fireEvent.change(input, { target: { value: 'Work task' } });

    const select = screen.getByRole('combobox', { name: /select category/i });
    fireEvent.change(select, { target: { value: 'work' } });

    fireEvent.click(screen.getByRole('button', { name: /add task/i }));

    expect(mockOnAdd).toHaveBeenCalledOnce();
    expect(mockOnAdd).toHaveBeenCalledWith('Work task', 'work');
    // Verify 'work' is a real CATEGORIES id (not a made-up string)
    expect(CATEGORIES.map((c) => c.id)).toContain('work');
  });

  it('calls onAdd with trimmed text, discarding leading/trailing whitespace', () => {
    const mockOnAdd = vi.fn();
    render(<TaskInput onAdd={mockOnAdd} />);

    const input = screen.getByRole('textbox', { name: /new task text/i });
    fireEvent.change(input, { target: { value: '  Buy milk  ' } });
    fireEvent.click(screen.getByRole('button', { name: /add task/i }));

    expect(mockOnAdd).toHaveBeenCalledWith('Buy milk', null);
  });

  it('does not call onAdd when task text is empty', () => {
    const mockOnAdd = vi.fn();
    render(<TaskInput onAdd={mockOnAdd} />);
    fireEvent.click(screen.getByRole('button', { name: /add task/i }));
    expect(mockOnAdd).not.toHaveBeenCalled();
  });

  it('does not call onAdd when task text is whitespace only', () => {
    const mockOnAdd = vi.fn();
    render(<TaskInput onAdd={mockOnAdd} />);
    const input = screen.getByRole('textbox', { name: /new task text/i });
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: /add task/i }));
    expect(mockOnAdd).not.toHaveBeenCalled();
  });

  it('resets text input to empty after a successful submission', () => {
    const mockOnAdd = vi.fn();
    render(<TaskInput onAdd={mockOnAdd} />);
    const input = screen.getByRole('textbox', { name: /new task text/i });
    fireEvent.change(input, { target: { value: 'Reset me' } });
    fireEvent.click(screen.getByRole('button', { name: /add task/i }));
    expect((input as HTMLInputElement).value).toBe('');
  });

  it('submits via Enter key the same way as clicking the Add button', () => {
    const mockOnAdd = vi.fn();
    render(<TaskInput onAdd={mockOnAdd} />);
    const input = screen.getByRole('textbox', { name: /new task text/i });
    fireEvent.change(input, { target: { value: 'Enter key task' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    expect(mockOnAdd).toHaveBeenCalledWith('Enter key task', null);
  });
});
