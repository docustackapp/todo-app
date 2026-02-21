/**
 * Integration tests: CategoryBadge ↔ CATEGORIES ↔ CATEGORY_COLOR_CLASSES
 *
 * Verifies that every category defined in the CATEGORIES constant can be
 * rendered by CategoryBadge without error, and that the color-class mapping
 * covers every color used by CATEGORIES.  These two files were contributed
 * by different branches and must align perfectly.
 */
import { render, screen } from '@testing-library/react';
import CategoryBadge from './CategoryBadge';
import { CATEGORIES, CATEGORY_COLOR_CLASSES } from '../../constants/categories';

describe('CategoryBadge ↔ CATEGORIES integration', () => {
  it('renders without crash for every category ID in CATEGORIES', () => {
    CATEGORIES.forEach((cat) => {
      const { unmount } = render(<CategoryBadge categoryId={cat.id} />);
      // If CategoryBadge returned null (category not found) the text would not be present.
      expect(
        screen.getByText(new RegExp(cat.name)),
        `CategoryBadge should render name for category id "${cat.id}"`,
      ).toBeInTheDocument();
      unmount();
    });
  });

  it('renders the correct emoji for every category in CATEGORIES', () => {
    CATEGORIES.forEach((cat) => {
      const { unmount } = render(<CategoryBadge categoryId={cat.id} />);
      // The badge renders `{category.emoji} {category.name}` inside a <span>.
      const badge = screen.getByText(new RegExp(cat.name));
      expect(
        badge.textContent,
        `CategoryBadge should include emoji "${cat.emoji}" for category "${cat.id}"`,
      ).toContain(cat.emoji);
      unmount();
    });
  });

  it('returns null for an unknown category ID (defensive path)', () => {
    const { container } = render(<CategoryBadge categoryId="nonexistent-id" />);
    expect(container.firstChild).toBeNull();
  });

  it('CATEGORY_COLOR_CLASSES has an entry for every color used in CATEGORIES', () => {
    const usedColors = new Set(CATEGORIES.map((c) => c.color));
    usedColors.forEach((color) => {
      expect(
        CATEGORY_COLOR_CLASSES[color],
        `CATEGORY_COLOR_CLASSES should have an entry for color "${color}" used by CATEGORIES`,
      ).toBeDefined();
      expect(CATEGORY_COLOR_CLASSES[color].bg).toBeTruthy();
      expect(CATEGORY_COLOR_CLASSES[color].text).toBeTruthy();
    });
  });

  it('applies bg and text color classes from CATEGORY_COLOR_CLASSES to each badge', () => {
    CATEGORIES.forEach((cat) => {
      const { unmount } = render(<CategoryBadge categoryId={cat.id} />);
      const badge = screen.getByText(new RegExp(cat.name));
      const colorEntry = CATEGORY_COLOR_CLASSES[cat.color];
      // The bg class string (may be multi-word, test for the first token)
      const bgClass = colorEntry.bg.split(' ')[0];
      const textClass = colorEntry.text.split(' ')[0];
      expect(
        badge.className,
        `Badge for "${cat.id}" should carry bg class "${bgClass}"`,
      ).toContain(bgClass);
      expect(
        badge.className,
        `Badge for "${cat.id}" should carry text class "${textClass}"`,
      ).toContain(textClass);
      unmount();
    });
  });
});
