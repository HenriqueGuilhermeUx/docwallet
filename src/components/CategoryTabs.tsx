import { Category } from '../types/document';
import { CATEGORIES } from '../types/document';

interface CategoryTabsProps {
  activeCategory: Category | 'all';
  onCategoryChange: (category: Category | 'all') => void;
  getCategoryCount: (category: Category | 'all') => number;
}

export const CategoryTabs: React.FC<CategoryTabsProps> = ({
  activeCategory,
  onCategoryChange,
  getCategoryCount,
}) => {
  return (
    <div className="overflow-x-auto scrollbar-hide px-4 sm:px-6 lg:px-8 py-4">
      <div className="flex gap-2 min-w-max">
        {CATEGORIES.map((category) => {
          const count = getCategoryCount(category.key);
          const isActive = activeCategory === category.key;

          return (
            <button
              key={category.key}
              onClick={() => onCategoryChange(category.key)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap
                transition-all duration-200
                ${isActive
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                }
              `}
            >
              <span>{category.labelPt}</span>
              <span className={`
                px-2 py-0.5 rounded-full text-xs
                ${isActive
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 text-slate-500'
                }
              `}>
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};