import type { Theme } from '../../types/index';
import ThemeToggle from './ThemeToggle';

export interface HeaderProps {
  theme: Theme;
  onToggleTheme: () => void;
  totalCount: number;
  doneCount: number;
}

export default function Header({ theme, onToggleTheme, totalCount, doneCount }: HeaderProps) {
  return (
    <header className="flex items-center justify-between py-6 px-4">
      <div>
        <h1 className="text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-todoodle-coral to-todoodle-teal">
          Todoodle
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Your tasks, but make it fun ✨
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          {doneCount} done / {totalCount} total
        </p>
      </div>
      <ThemeToggle theme={theme} onToggle={onToggleTheme} />
    </header>
  );
}
