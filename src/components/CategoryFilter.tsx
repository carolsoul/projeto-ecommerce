import {
  BORDER,
  BRAND,
  BRAND_BG,
  BRAND_BG_HOVER,
  BRAND_BORDER,
  CARD,
  HOVER_PINK,
  ON_BRAND,
  RING,
} from '../lib/theme';

interface CategoryFilterProps {
  categories: string[];
  selected: string | null;
  onSelect: (category: string | null) => void;
}

const BASE_BUTTON =
  `px-4 py-1.5 text-sm font-medium rounded-full border transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 ${RING}`;

function buttonClass(isActive: boolean) {
  if (isActive) return `${BASE_BUTTON} ${BRAND_BG} ${ON_BRAND} ${BRAND_BORDER} ${BRAND_BG_HOVER}`;
  return `${BASE_BUTTON} ${CARD} ${BRAND} ${BORDER} ${HOVER_PINK}`;
}

/**
 * Filtro avançado por categoria, no desktop rola na vertical, no mobile rola na
 * horizontal. `flex-row` vira `lg:flex-col` e o `overflow-x-auto` vira `lg:overflow-y-auto`.
 */
export default function CategoryFilter({ categories, selected, onSelect }: CategoryFilterProps) {
  if (categories.length < 2) return null;

  return (
    <div className="mb-6 lg:mb-0">
      <h2 className={`text-sm font-semibold ${BRAND} mb-3`}>Filtrar por categoria</h2>

      <ul
        className={`flex flex-row gap-2 overflow-x-auto whitespace-nowrap pb-2 lg:flex-col lg:flex-nowrap lg:gap-2 lg:overflow-x-visible lg:overflow-y-auto lg:max-h-[70vh] lg:whitespace-normal lg:pb-0 lg:pr-2`}
      >
        <li className="shrink-0">
          <button
            type="button"
            onClick={() => onSelect(null)}
            aria-pressed={selected === null}
            className={`${buttonClass(selected === null)} lg:w-full lg:text-left`}
          >
            Todas
          </button>
        </li>

        {categories.map((category) => (
          <li key={category} className="shrink-0">
            <button
              type="button"
              onClick={() => onSelect(category)}
              aria-pressed={selected === category}
              className={`${buttonClass(selected === category)} capitalize lg:w-full lg:text-left`}
            >
              {category}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
