import { Minus, Plus } from "lucide-react";

export function QuantityStepper({ value = 1, onChange, min = 0, max = 99, size = "md" }) {
  const sizes = {
    sm: { btn: "p-1", icon: "h-3 w-3", text: "text-xs w-5" },
    md: { btn: "p-1.5", icon: "h-3.5 w-3.5", text: "text-sm w-6" },
    lg: { btn: "p-2", icon: "h-4 w-4", text: "text-base w-8" },
  };
  const s = sizes[size] || sizes.md;

  const dec = () => onChange?.(Math.max(min, value - 1));
  const inc = () => onChange?.(Math.min(max, value + 1));

  if (value === 0) {
    return (
      <button
        onClick={() => onChange?.(1)}
        className="px-4 py-1.5 text-sm font-semibold rounded-btn bg-[#a6412b] text-white hover:opacity-90 transition-opacity shadow-sm"
      >
        ADD
      </button>
    );
  }

  return (
    <div className="inline-flex items-center gap-1 rounded-btn border-2 border-[#a6412b] bg-[#a6412b]/5 overflow-hidden">
      <button onClick={dec} className={`${s.btn} hover:bg-[#a6412b]/10 transition-colors`} aria-label="Decrease">
        <Minus className={`${s.icon} text-[#a6412b]`} />
      </button>
      <span className={`${s.text} text-center font-semibold tabular-nums text-[#a6412b]`}>{value}</span>
      <button onClick={inc} className={`${s.btn} hover:bg-[#a6412b]/10 transition-colors`} aria-label="Increase">
        <Plus className={`${s.icon} text-[#a6412b]`} />
      </button>
    </div>
  );
}
