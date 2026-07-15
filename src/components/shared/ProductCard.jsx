import { VegDot } from "@/components/shared/VegDot";
import { Price } from "@/components/shared/Price";
import { QuantityStepper } from "@/components/shared/QuantityStepper";

// ────────────────────────────────────────────────────────────────────────
// ProductCard — the one dish/menu-item card used everywhere a product is
// listed (Home, Search, category grids). Mobile renders as a horizontal
// row card, desktop (lg+) as a vertical grid card — same data, same
// interactions, just a different layout direction.
// ────────────────────────────────────────────────────────────────────────
export function ProductCard({ item, qty = 0, onQtyChange, onClick }) {
  return (
    <div className="group flex lg:flex-col gap-3 lg:gap-0 p-3 lg:p-0 rounded-2xl lg:rounded-[var(--radius-card)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-xs)] overflow-hidden transition-all duration-300 ease-out hover:-translate-y-1.5 hover:scale-[1.01] hover:shadow-[var(--shadow-md)] hover:border-[var(--color-border-strong)]">
      <button onClick={onClick} className="h-20 w-20 lg:h-40 lg:w-full rounded-xl lg:rounded-none bg-[var(--color-bg)] shrink-0 overflow-hidden">
        {item.image ? (
          <img src={item.image} alt={item.name} className="h-full w-full object-cover transition-transform duration-[400ms] ease-out group-hover:scale-110" />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-2xl lg:text-4xl">🍽️</div>
        )}
      </button>
      <div className="flex-1 min-w-0 flex flex-col lg:p-4">
        <button onClick={onClick} className="text-left">
          <div className="flex items-center gap-1.5">
            <VegDot type={item.dietryType} />
            <p className="text-sm lg:text-[15px] font-semibold truncate text-[var(--color-ink)]">{item.name}</p>
          </div>
          {item.description && (
            <p className="text-xs text-[var(--color-text-muted)] line-clamp-2 mt-0.5">{item.description}</p>
          )}
          <Price basePrice={item.basePrice} sellingPrice={item.sellingPrice} size="sm" className="mt-1" />
        </button>
        <div className="mt-auto pt-2 flex justify-end">
          <QuantityStepper value={qty} onChange={onQtyChange} size="sm" />
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
