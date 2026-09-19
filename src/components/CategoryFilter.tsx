interface CategoryFilterProps {
  categories: string[];
  selected: string | null;
  onSelect: (category: string | null) => void;
}

const BASE_BUTTON =
  'px-4 py-1.5 text-sm font-medium rounded-full border transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500';

function buttonClass(isActive: boolean) {
  if (isActive) return `${BASE_BUTTON} bg-blue-600 text-white border-blue-600`;
  return `${BASE_BUTTON} bg-white text-slate-700 border-slate-300 hover:bg-slate-50`;
}

/**
 * Filtro avançado por categoria, exibido apenas nos resultados de busca.
 *
 * O deslizamento muda de eixo conforme a tela: no desktop é uma coluna que
 * rola na vertical ao lado dos resultados; no mobile, uma faixa que rola na
 * horizontal acima deles. Daí o `flex-row` virar `lg:flex-col` e o
 * `overflow-x-auto` virar `lg:overflow-y-auto`.
 */
export default function CategoryFilter({ categories, selected, onSelect }: CategoryFilterProps) {
  // Com uma categoria só não há o que filtrar — o filtro seria decorativo.
  if (categories.length < 2) return null;

  return (
    <div className="mb-6 lg:mb-0">
      <h2 className="text-sm font-semibold text-slate-900 mb-3">Filtrar por categoria</h2>

      <ul
        className="
          flex flex-row gap-2 overflow-x-auto whitespace-nowrap pb-2
          lg:flex-col lg:flex-nowrap lg:gap-2 lg:overflow-x-visible
          lg:overflow-y-auto lg:max-h-[70vh] lg:whitespace-normal lg:pb-0 lg:pr-2
        "
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
