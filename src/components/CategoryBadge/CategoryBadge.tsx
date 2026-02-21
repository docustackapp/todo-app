import { CATEGORIES, CATEGORY_COLOR_CLASSES } from '../../constants/categories';

export interface CategoryBadgeProps {
  categoryId: string;
}

export default function CategoryBadge({ categoryId }: CategoryBadgeProps): JSX.Element | null {
  const category = CATEGORIES.find((c) => c.id === categoryId);
  if (!category) return null;

  const colors = CATEGORY_COLOR_CLASSES[category.color];

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${colors.bg} ${colors.text}`}
    >
      {category.emoji} {category.name}
    </span>
  );
}
