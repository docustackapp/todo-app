import { readState, writeState, STORAGE_KEY } from './localStorage';
import { DEFAULT_STATE } from '../types/index';
import type { AppState } from '../types/index';

describe('readState', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns DEFAULT_STATE when the todoodle_state key is absent', () => {
    const result = readState();
    expect(result).toEqual(DEFAULT_STATE);
  });

  it('returns DEFAULT_STATE when localStorage contains invalid JSON', () => {
    localStorage.setItem(STORAGE_KEY, '{bad json');
    const result = readState();
    expect(result).toEqual(DEFAULT_STATE);
  });

  it('returns parsed state when localStorage contains valid JSON', () => {
    const sampleState: AppState = {
      tasks: [
        {
          id: 'abc-123',
          text: 'Buy milk',
          completed: false,
          categoryId: 'shopping',
          order: 0,
          createdAt: '2026-02-21T10:00:00.000Z',
        },
      ],
      theme: 'dark',
      activeFilter: 'shopping',
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleState));
    const result = readState();
    expect(result).toEqual(sampleState);
  });
});

describe('writeState + readState roundtrip', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('writeState then readState returns object with matching tasks, theme, and activeFilter', () => {
    const sampleState: AppState = {
      tasks: [
        {
          id: 'task-1',
          text: 'Learn Vitest',
          completed: true,
          categoryId: 'learning',
          order: 0,
          createdAt: '2026-02-21T12:00:00.000Z',
        },
        {
          id: 'task-2',
          text: 'Buy groceries',
          completed: false,
          categoryId: null,
          order: 1,
          createdAt: '2026-02-21T13:00:00.000Z',
        },
      ],
      theme: 'dark',
      activeFilter: 'learning',
    };

    writeState(sampleState);
    const result = readState();

    expect(result.tasks).toEqual(sampleState.tasks);
    expect(result.theme).toEqual(sampleState.theme);
    expect(result.activeFilter).toEqual(sampleState.activeFilter);
  });
});

describe('STORAGE_KEY', () => {
  it('uses the exact key string todoodle_state', () => {
    expect(STORAGE_KEY).toBe('todoodle_state');
  });
});
