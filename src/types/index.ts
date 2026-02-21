// ─── Category ────────────────────────────────────────────────────────────────

export type CategoryColor =
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'purple'
  | 'pink';

export interface Category {
  id: string;        // slug, e.g. 'work'
  name: string;      // display name, e.g. 'Work'
  color: CategoryColor;
  emoji: string;     // single emoji character, e.g. '💼'
}

// ─── Task ────────────────────────────────────────────────────────────────────

export interface Task {
  id: string;                // UUID v4 from crypto.randomUUID()
  text: string;              // 1–500 characters (validated on input)
  completed: boolean;
  categoryId: string | null; // Category.id or null
  order: number;             // non-negative integer; equals array index after reorder
  createdAt: string;         // ISO 8601 timestamp, e.g. '2026-02-21T10:00:00.000Z'
}

// ─── Theme ───────────────────────────────────────────────────────────────────

export type Theme = 'light' | 'dark';

// ─── AppState ────────────────────────────────────────────────────────────────

export interface AppState {
  tasks: Task[];
  theme: Theme;
  activeFilter: string | null; // Category.id or null (null means "All")
}

// ─── Default State ───────────────────────────────────────────────────────────

export const DEFAULT_STATE: AppState = {
  tasks: [],
  theme: 'light',
  activeFilter: null,
};
