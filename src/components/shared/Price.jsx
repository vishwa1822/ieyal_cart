import { formatPrice } from "@/lib/theme";

export function Price({ basePrice, sellingPrice, size = "md", className = "" }) {
  const hasDiscount = basePrice > sellingPrice;
  const discount = hasDiscount ? Math.round(((basePrice - sellingPrice) / basePrice) * 100) : 0;
  const sizes = {
    sm: { price: "text-sm", mrp: "text-xs" },
    md: { price: "text-base font-semibold", mrp: "text-sm" },
    lg: { price: "text-xl font-bold", mrp: "text-sm" },
  };
  const s = sizes[size] || sizes.md;

  return (
    <div className={`flex items-center gap-2 tabular-nums ${className}`}>
      <span className={`${s.price} text-[var(--color-text)]`}>{formatPrice(sellingPrice)}</span>
      {hasDiscount && (
        <>
          <span className={`${s.mrp} text-muted line-through`}>{formatPrice(basePrice)}</span>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-success/10 text-success">
            {discount}% OFF
          </span>
        </>
      )}
    </div>
  );
}
