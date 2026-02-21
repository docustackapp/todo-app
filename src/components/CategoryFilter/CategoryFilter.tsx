import { CATEGORIES } from '../../constants/categories';

export interface CategoryFilterProps {
  activeFilter: string | null;
  onFilterChange: (categoryId: string | null) => void;
}

export default function CategoryFilter({ activeFilter, onFilterChange }: CategoryFilterProps) {
  const activeClass =
    'bg-todoodle-coral text-white border border-transparent';
  const inactiveClass =
    'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300';

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      <button
        type="button"
        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
          activeFilter === null ? activeClass : inactiveClass
        }`}
        onClick={() => onFilterChange(null)}
      >
        All 🗂️
      </button>

      {CATEGORIES.map((category) => (
        <button
          key={category.id}
          type="button"
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            activeFilter === category.id ? activeClass : inactiveClass
          }`}
          onClick={() => onFilterChange(category.id)}
        >
          {category.emoji} {category.name}
        </button>
      ))}
    </div>
  );
}
