/**
 * Integration tests: CategoryFilter ↔ CATEGORIES ↔ localStorage
 *
 * CategoryFilter (category-filter-component branch) reads CATEGORIES
 * from the shared constant.  TaskCard / CategoryBadge also use the
 * same constant, so the filter IDs must align exactly.  Additionally,
 * the selected filter value is stored in AppState.activeFilter in
 * localStorage — these tests verify that the IDs emitted by
 * CategoryFilter match the IDs that can be written to and read back
 * from localStorage (utility-layer branch).
 */
import { render, screen, fireEvent } from '@testing-library/react';
import CategoryFilter from './CategoryFilter';
import { CATEGORIES } from '../../constants/categories';
import { readState, writeState, STORAGE_KEY } from '../../utils/localStorage';
import type { AppState } from '../../types/index';

describe('CategoryFilter ↔ CATEGORIES ID alignment', () => {
  it('every chip label corresponds to a category in CATEGORIES', () => {
    render(<CategoryFilter activeFilter={null} onFilterChange={vi.fn()} />);
    CATEGORIES.forEach((cat) => {
      // Each category must have a corresponding chip button in the filter bar.
      expect(
        screen.getByText(new RegExp(cat.name)),
        `CategoryFilter should render a chip for category "${cat.id}"`,
      ).toBeInTheDocument();
    });
  });

  it('onFilterChange is called with exact IDs from CATEGORIES (not display names)', () => {
    const collected: (string | null)[] = [];
    render(
      <CategoryFilter
        activeFilter={null}
        onFilterChange={(id) => collected.push(id)}
      />,
    );

    CATEGORIES.forEach((cat) => {
      fireEvent.click(screen.getByText(new RegExp(cat.name)));
    });

    // All emitted IDs must exist in CATEGORIES
    const categoryIds = CATEGORIES.map((c) => c.id);
    collected.forEach((id) => {
      expect(
        categoryIds,
        `onFilterChange emitted "${id}" which is not a valid CATEGORIES id`,
      ).toContain(id);
    });
    expect(collected).toHaveLength(CATEGORIES.length);
  });

  it('the IDs emitted by CategoryFilter match the categoryId values used by CategoryBadge', () => {
    // The id emitted by clicking "Work" chip must be the same id
    // that TaskCard passes to CategoryBadge — they both use CATEGORIES.
    const emittedIds: string[] = [];
    render(
      <CategoryFilter
        activeFilter={null}
        onFilterChange={(id) => { if (id !== null) emittedIds.push(id); }}
      />,
    );

    fireEvent.click(screen.getByText(/Work/));
    expect(emittedIds).toContain('work');
    expect(CATEGORIES.find((c) => c.id === 'work')).toBeDefined();
  });
});

describe('CategoryFilter ↔ localStorage integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('a category ID emitted by CategoryFilter can be persisted and recovered via readState/writeState', () => {
    const captured: (string | null)[] = [];
    render(
      <CategoryFilter
        activeFilter={null}
        onFilterChange={(id) => captured.push(id)}
      />,
    );

    // Click the "Fun" chip — simulates user filtering
    fireEvent.click(screen.getByText(/Fun/));
    const filterId = captured[0]; // 'fun'

    // Persist the active filter just as the app would
    const state: AppState = {
      tasks: [],
      theme: 'light',
      activeFilter: filterId,
    };
    writeState(state);

    const recovered = readState();
    expect(recovered.activeFilter).toBe('fun');
    expect(CATEGORIES.map((c) => c.id)).toContain(recovered.activeFilter);
  });

  it('clicking "All" emits null and null can be round-tripped through localStorage', () => {
    const captured: (string | null)[] = [];
    render(
      <CategoryFilter
        activeFilter="work"
        onFilterChange={(id) => captured.push(id)}
      />,
    );

    fireEvent.click(screen.getByText(/All/));
    const filterId = captured[0]; // null
    expect(filterId).toBeNull();

    const state: AppState = {
      tasks: [],
      theme: 'light',
      activeFilter: filterId,
    };
    writeState(state);

    const recovered = readState();
    expect(recovered.activeFilter).toBeNull();
  });

  it('STORAGE_KEY used by localStorage utils is the canonical "todoodle_state"', () => {
    // Confirms utility layer and any consumer agree on the key name
    expect(STORAGE_KEY).toBe('todoodle_state');
    writeState({ tasks: [], theme: 'light', activeFilter: 'health' });
    const raw = localStorage.getItem('todoodle_state');
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.activeFilter).toBe('health');
  });
});
