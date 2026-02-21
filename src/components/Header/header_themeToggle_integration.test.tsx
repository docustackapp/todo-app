/**
 * Integration tests: Header ↔ ThemeToggle ↔ types/index.ts
 *
 * The header-component branch provides Header and ThemeToggle.
 * Header composes ThemeToggle and wires its onToggle prop to the
 * parent-supplied onToggleTheme callback.  These tests verify:
 *  - ThemeToggle click propagates to Header's onToggleTheme prop
 *  - Header displays the correct theme icon (☀️ for dark, 🌙 for light)
 *  - Stats (doneCount / totalCount) render correctly
 *  - The title "Todoodle" and tagline are present
 *
 * NOTE: The architecture spec defines the Header prop as "completedCount"
 * but the implementation uses "doneCount".  We test with the actual
 * implemented interface (doneCount) to detect if this diverges further.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import Header from './Header';

describe('Header ↔ ThemeToggle integration', () => {
  it('renders the Todoodle title', () => {
    render(
      <Header theme="light" onToggleTheme={vi.fn()} totalCount={0} doneCount={0} />,
    );
    expect(screen.getByText('Todoodle')).toBeInTheDocument();
  });

  it('renders the tagline with fun emoji', () => {
    render(
      <Header theme="light" onToggleTheme={vi.fn()} totalCount={0} doneCount={0} />,
    );
    expect(screen.getByText(/Your tasks, but make it fun/)).toBeInTheDocument();
  });

  it('renders stats as "{doneCount} done / {totalCount} total"', () => {
    render(
      <Header theme="light" onToggleTheme={vi.fn()} totalCount={10} doneCount={3} />,
    );
    expect(screen.getByText(/3 done \/ 10 total/)).toBeInTheDocument();
  });

  it('renders stats correctly when doneCount equals totalCount (all done)', () => {
    render(
      <Header theme="light" onToggleTheme={vi.fn()} totalCount={5} doneCount={5} />,
    );
    expect(screen.getByText(/5 done \/ 5 total/)).toBeInTheDocument();
  });

  it('renders stats correctly when doneCount is 0 (none done)', () => {
    render(
      <Header theme="light" onToggleTheme={vi.fn()} totalCount={7} doneCount={0} />,
    );
    expect(screen.getByText(/0 done \/ 7 total/)).toBeInTheDocument();
  });

  it('shows moon icon (🌙) when theme is "light"', () => {
    render(
      <Header theme="light" onToggleTheme={vi.fn()} totalCount={0} doneCount={0} />,
    );
    expect(screen.getByRole('button', { name: /toggle dark mode/i }).textContent).toContain('🌙');
  });

  it('shows sun icon (☀️) when theme is "dark"', () => {
    render(
      <Header theme="dark" onToggleTheme={vi.fn()} totalCount={0} doneCount={0} />,
    );
    expect(screen.getByRole('button', { name: /toggle dark mode/i }).textContent).toContain('☀️');
  });

  it('clicking the ThemeToggle button calls onToggleTheme exactly once', () => {
    const mockToggle = vi.fn();
    render(
      <Header theme="light" onToggleTheme={mockToggle} totalCount={0} doneCount={0} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /toggle dark mode/i }));
    expect(mockToggle).toHaveBeenCalledOnce();
  });

  it('clicking the ThemeToggle button twice calls onToggleTheme twice', () => {
    const mockToggle = vi.fn();
    render(
      <Header theme="light" onToggleTheme={mockToggle} totalCount={0} doneCount={0} />,
    );
    const btn = screen.getByRole('button', { name: /toggle dark mode/i });
    fireEvent.click(btn);
    fireEvent.click(btn);
    expect(mockToggle).toHaveBeenCalledTimes(2);
  });

  it('ThemeToggle aria-label is "Toggle dark mode" for accessibility', () => {
    render(
      <Header theme="light" onToggleTheme={vi.fn()} totalCount={0} doneCount={0} />,
    );
    expect(
      screen.getByRole('button', { name: /toggle dark mode/i }),
    ).toBeInTheDocument();
  });
});
