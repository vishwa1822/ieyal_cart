import { VegDot } from "@/components/shared/VegDot";
import { Price } from "@/components/shared/Price";
import { QuantityStepper } from "@/components/shared/QuantityStepper";

// ────────────────────────────────────────────────────────────────────────
// ProductCard — the one dish/menu-item card used everywhere a product is
// listed (Home, Search, category grids). Mobile renders as a horizontal
// row card, desktop (lg+) as a vertical grid card — same data, same
// interactions, just a different layout direction.
// ────────────────────────────────────────────────────────────────────────
// Tolerant read of a stock signal — different endpoints have used different
// field names historically (stock, stockCount, quantityAvailable, isAvailable).
// Returns null when the API gives no stock signal at all, so callers can
// skip rendering a badge rather than guessing.
function readStockState(item) {
  if (item.isAvailable === false || item.inStock === false) return "out";
  const count = item.stock ?? item.stockCount ?? item.quantityAvailable ?? item.availableQty;
  if (typeof count === "number") {
    if (count <= 0) return "out";
    if (count <= 5) return "low";
  }
  return null;
}

export function ProductCard({ item, qty = 0, onQtyChange, onClick }) {
  // Category-list items carry images in `imageUrl` (array); some
  // already-normalized shapes (e.g. cart-derived items) use `image`
  // (string). Support both without assuming either is present.
  const imageSrc = (Array.isArray(item.imageUrl) ? item.imageUrl[0] : item.imageUrl) || item.image;
  // Top-level `basePrice` on list items is a placeholder (0) — the real
  // MRP/price pair lives in defaultBasePrice/defaultSellingPrice.
  const mrp = item.defaultBasePrice ?? item.basePrice;
  const price = item.defaultSellingPrice ?? item.sellingPrice;
  const stockState = readStockState(item);
  const outOfStock = stockState === "out";

  return (
    <div className={`group relative flex lg:flex-col gap-3.5 lg:gap-0 p-3.5 lg:p-0 rounded-2xl lg:rounded-[var(--radius-card)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-xs)] overflow-hidden transition-all duration-300 ease-out ${outOfStock ? "opacity-60" : "hover:-translate-y-1.5 hover:scale-[1.01] hover:shadow-[var(--shadow-md)] hover:border-[var(--color-border-strong)]"}`}>
      <button onClick={onClick} disabled={outOfStock} className="relative h-20 w-20 lg:h-40 lg:w-full rounded-xl lg:rounded-none bg-[var(--color-bg)] shrink-0 overflow-hidden">
        {imageSrc ? (
          <img src={imageSrc} alt={item.name} className="h-full w-full object-cover transition-transform duration-[500ms] ease-out group-hover:scale-110" />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-2xl lg:text-4xl">🍽️</div>
        )}
        {stockState === "low" && (
          <span className="absolute top-1.5 left-1.5 lg:top-2.5 lg:left-2.5 text-[9px] font-bold uppercase tracking-wide text-white bg-[var(--color-warning)] rounded-full px-2 py-0.5 shadow-sm">
            Only {item.stock ?? item.stockCount ?? item.quantityAvailable ?? item.availableQty} left
          </span>
        )}
        {outOfStock && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="text-[10px] font-bold uppercase tracking-wide text-white bg-black/60 rounded-full px-2.5 py-1">Sold out</span>
          </span>
        )}
      </button>
      <div className="flex-1 min-w-0 flex flex-col lg:p-4">
        <button onClick={onClick} disabled={outOfStock} className="text-left">
          <div className="flex items-center gap-1.5">
            <VegDot type={item.dietryType} />
            <p className="text-sm lg:text-[15px] font-semibold truncate text-[var(--color-ink)] tracking-tight">{item.name}</p>
          </div>
          {item.description && (
            <p className="text-xs text-[var(--color-text-muted)] line-clamp-2 mt-1 leading-relaxed">{item.description}</p>
          )}
          <Price basePrice={mrp} sellingPrice={price} size="sm" className="mt-1.5" />
        </button>
        <div className="mt-auto pt-2.5 flex justify-end">
          {outOfStock ? (
            <span className="text-xs font-semibold text-[var(--color-text-muted)]">Unavailable</span>
          ) : (
            <QuantityStepper value={qty} onChange={onQtyChange} size="sm" />
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
