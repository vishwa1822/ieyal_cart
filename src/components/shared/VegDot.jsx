export function VegDot({ type = "veg", size = 12 }) {
  const isVeg = type === "veg" || type === "Veg";
  return (
    <span
      className="inline-flex items-center justify-center shrink-0 rounded-sm border-2"
      style={{
        width: size,
        height: size,
        borderColor: isVeg ? "var(--color-success)" : "var(--color-danger)",
      }}
      aria-label={isVeg ? "Vegetarian" : "Non-vegetarian"}
    >
      <span
        className="rounded-full"
        style={{
          width: size * 0.4,
          height: size * 0.4,
          backgroundColor: isVeg ? "var(--color-success)" : "var(--color-danger)",
        }}
      />
    </span>
  );
}
