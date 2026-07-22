import { useEffect, useRef, useState } from "react";

// ────────────────────────────────────────────────────────────────────────
// SegmentedControl — Apple-style segmented picker: options share one pill
// track and a single sliding indicator glides beneath the active option,
// instead of each option being its own independently-styled button.
// Purely presentational — callers keep owning selection state.
// ────────────────────────────────────────────────────────────────────────
export default function SegmentedControl({ options, value, onChange, size = "md" }) {
  const trackRef = useRef(null);
  const btnRefs = useRef({});
  const [indicator, setIndicator] = useState({ left: 0, width: 0, ready: false });

  const sizes = {
    sm: "h-10 text-[13px]",
    md: "h-12 text-sm",
  };

  useEffect(() => {
    const el = btnRefs.current[value];
    const track = trackRef.current;
    if (!el || !track) return;
    const trackRect = track.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    setIndicator({ left: elRect.left - trackRect.left, width: elRect.width, ready: true });
  }, [value, options]);

  useEffect(() => {
    const onResize = () => {
      const el = btnRefs.current[value];
      const track = trackRef.current;
      if (!el || !track) return;
      const trackRect = track.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      setIndicator({ left: elRect.left - trackRect.left, width: elRect.width, ready: true });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [value]);

  return (
    <div
      ref={trackRef}
      role="tablist"
      className={`relative inline-flex w-full items-stretch gap-1 rounded-2xl border border-[var(--iy-border)] bg-[var(--iy-bg)] p-1 shadow-inner ${sizes[size] || sizes.md}`}
    >
      {indicator.ready && (
        <div
          aria-hidden
          className="absolute top-1 bottom-1 rounded-xl bg-[var(--iy-accent)] shadow-[var(--iy-shadow-sm)] transition-[left,width] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
          style={{ left: indicator.left, width: indicator.width }}
        />
      )}
      {options.map(({ key, label, icon: Icon, disabled }) => {
        const active = value === key;
        return (
          <button
            key={key}
            ref={(el) => (btnRefs.current[key] = el)}
            role="tab"
            aria-selected={active}
            disabled={disabled}
            onClick={() => !disabled && onChange(key)}
            className={`relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded-xl font-semibold transition-colors duration-300 ${active ? "text-white" : "text-[var(--iy-ink-soft)] hover:text-[var(--iy-ink)]"
              } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
          >
            {Icon && <Icon className="h-4 w-4" />}
            {label}
          </button>
        );
      })}
    </div>
  );
}
