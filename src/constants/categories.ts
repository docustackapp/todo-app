import type { Category } from '../types/index';

export const CATEGORIES: Category[] = [
  { id: 'work',     name: 'Work',     color: 'blue',   emoji: '💼' },
  { id: 'personal', name: 'Personal', color: 'purple', emoji: '🌟' },
  { id: 'shopping', name: 'Shopping', color: 'green',  emoji: '🛒' },
  { id: 'health',   name: 'Health',   color: 'red',    emoji: '💪' },
  { id: 'learning', name: 'Learning', color: 'orange', emoji: '📚' },
  { id: 'fun',      name: 'Fun',      color: 'pink',   emoji: '🎉' },
];

/** Map from CategoryColor to Tailwind badge class pairs */
export const CATEGORY_COLOR_CLASSES: Record<string, { bg: string; text: string }> = {
  red:    { bg: 'bg-red-100 dark:bg-red-900/30',       text: 'text-red-700 dark:text-red-300' },
  orange: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300' },
  yellow: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300' },
  green:  { bg: 'bg-green-100 dark:bg-green-900/30',   text: 'text-green-700 dark:text-green-300' },
  blue:   { bg: 'bg-blue-100 dark:bg-blue-900/30',     text: 'text-blue-700 dark:text-blue-300' },
  purple: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300' },
  pink:   { bg: 'bg-pink-100 dark:bg-pink-900/30',     text: 'text-pink-700 dark:text-pink-300' },
};
