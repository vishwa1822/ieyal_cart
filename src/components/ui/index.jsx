import { forwardRef, useState } from "react";

const cn = (...classes) => classes.filter(Boolean).join(" ");

// ── Button ───────────────────────────────────────────────────────────────
// The app's ONLY three button styles — matches the public homepage's pill
// buttons exactly. Keep new call sites to these three variants:
//   primary   — solid accent pill, the one main action per view
//   secondary — outlined pill, secondary actions
//   text      — no chrome, for tertiary / inline actions
// Legacy variant names (default/outline/ghost/destructive) are mapped so
// existing call sites across pages keep working without a mass rename.
export function Button({ className, variant = "primary", size = "default", loading = false, disabled, children, ...props }) {
  const variants = {
    primary: "bg-[var(--color-primary)] text-white shadow-[var(--shadow-sm)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-glow)] active:translate-y-0 active:shadow-[var(--shadow-xs)]",
    secondary: "border border-[var(--color-ink)]/15 bg-transparent text-[var(--color-ink)] hover:bg-[var(--color-ink)] hover:text-white hover:border-[var(--color-ink)]",
    text: "bg-transparent text-[var(--color-ink)] hover:text-[var(--color-primary)] shadow-none px-2",
    // legacy aliases
    default: "bg-[var(--color-primary)] text-white shadow-[var(--shadow-sm)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-glow)] active:translate-y-0 active:shadow-[var(--shadow-xs)]",
    outline: "border border-[var(--color-ink)]/15 bg-transparent text-[var(--color-ink)] hover:bg-[var(--color-ink)] hover:text-white hover:border-[var(--color-ink)]",
    ghost: "bg-transparent text-[var(--color-ink)] hover:text-[var(--color-primary)] shadow-none px-2",
    destructive: "bg-[var(--color-danger)] text-white shadow-[var(--shadow-sm)] hover:opacity-90",
  };
  const sizes = {
    default: "h-11 px-6 text-sm",
    sm: "h-9 px-4 text-sm",
    lg: "h-12 px-7 text-base",
    icon: "h-10 w-10 rounded-full",
  };
  return (
    <button
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-300 active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none disabled:translate-y-0 disabled:shadow-none",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading && (
        <span className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" aria-hidden="true" />
      )}
      {children}
    </button>
  );
}

export function Card({ className, hover = false, as: Comp = "div", children, ...props }) {
  return (
    <Comp
      className={cn(
        "rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-xs)] transition-all duration-300 ease-out",
        hover && "hover:-translate-y-1 hover:shadow-[var(--shadow-md)] hover:border-[var(--color-border-strong)]",
        Comp === "button" && "text-left cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </Comp>
  );
}

export function CardHeader({ className, children, ...props }) {
  return <div className={cn("flex flex-col gap-1.5 p-5 pb-0", className)} {...props}>{children}</div>;
}

export function CardTitle({ className, children, ...props }) {
  return <h3 className={cn("font-display text-lg font-medium leading-tight text-[var(--color-ink)]", className)} {...props}>{children}</h3>;
}

export function CardDescription({ className, children, ...props }) {
  return <p className={cn("text-sm text-muted", className)} {...props}>{children}</p>;
}

export function CardContent({ className, children, ...props }) {
  return <div className={cn("p-5", className)} {...props}>{children}</div>;
}

export const Input = forwardRef(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        "flex h-11 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm text-[var(--color-text)] outline-none transition-colors placeholder:text-[var(--color-text-faint)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/15",
        className
      )}
      {...props}
    />
  );
});

export function Label({ className, children, ...props }) {
  return <label className={cn("text-sm font-medium", className)} {...props}>{children}</label>;
}

export function Separator({ className, orientation = "horizontal", ...props }) {
  return (
    <div
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className
      )}
      {...props}
    />
  );
}

export function Badge({ className, variant = "default", children, ...props }) {
  const variants = {
    default: "bg-[var(--color-primary)]/10 text-[var(--color-primary)]",
    secondary: "bg-[var(--color-bg)] text-[var(--color-text-muted)] border border-[var(--color-border)]",
    destructive: "bg-[var(--color-danger)]/10 text-[var(--color-danger)]",
    success: "bg-[var(--color-success)]/10 text-[var(--color-success)]",
    warning: "bg-[var(--color-warning)]/10 text-[var(--color-warning)]",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide", variants[variant], className)} {...props}>
      {children}
    </span>
  );
}

export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-border/60", className)}
      {...props}
    />
  );
}

export function Progress({ value = 0, className, ...props }) {
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-border", className)} {...props}>
      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${value}%` }} />
    </div>
  );
}

export function Checkbox({ checked, onCheckedChange, className, ...props }) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      className={cn("h-4 w-4 rounded border-border accent-primary", className)}
      {...props}
    />
  );
}

export function Switch({ checked, onCheckedChange, className }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
        checked ? "bg-primary" : "bg-border",
        className
      )}
    >
      <span className={cn("pointer-events-none block h-5 w-5 rounded-full bg-white shadow transition-transform", checked ? "translate-x-5" : "translate-x-0")} />
    </button>
  );
}

export function RadioGroup({ value, onValueChange, className, children }) {
  return (
    <div className={className} role="radiogroup">
      {children?.type ? children : Array.isArray(children) && children.map((child) =>
        child ? { ...child, props: { ...child.props, checked: child.props.value === value, onSelect: () => onValueChange?.(child.props.value) } } : null
      )}
      {typeof children === "function" ? null : children}
    </div>
  );
}

export function RadioGroupItem({ value, id, disabled, checked, onSelect, className }) {
  return (
    <input
      type="radio"
      id={id}
      value={value}
      checked={checked}
      disabled={disabled}
      onChange={() => onSelect?.()}
      className={cn("h-4 w-4 accent-primary", className)}
    />
  );
}

export function Select({ value, onValueChange, children, defaultValue }) {
  const [val, setVal] = useState(value ?? defaultValue ?? "");
  const handleChange = (e) => {
    setVal(e.target.value);
    onValueChange?.(e.target.value);
  };
  return <div>{typeof children === "function" ? children({ value: val, onChange: handleChange }) : children}</div>;
}

export function SelectTrigger({ children, className }) {
  return <>{children}</>;
}

export function SelectValue({ placeholder }) {
  return <span>{placeholder}</span>;
}

export function SelectContent({ children, onChange, value }) {
  return (
    <select
      value={value}
      onChange={onChange}
      className="flex h-10 w-full rounded-btn border border-border bg-surface px-3 text-sm outline-none focus:border-primary"
    >
      {children}
    </select>
  );
}

export function SelectItem({ value, children }) {
  return <option value={value}>{children}</option>;
}

export function Dialog({ open, onOpenChange, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => onOpenChange?.(false)} />
      <div className="relative z-10 w-full max-w-sm animate-slide-up">{children}</div>
    </div>
  );
}

export function DialogTrigger({ asChild, children, onClick }) {
  if (asChild) return children;
  return <button onClick={onClick}>{children}</button>;
}

export function DialogContent({ className, children }) {
  return (
    <div className={cn("mx-4 mb-4 sm:mb-0 rounded-card border border-border bg-surface p-5 shadow-premium-lg max-h-[85vh] overflow-y-auto", className)}>
      {children}
    </div>
  );
}

export function DialogHeader({ className, children }) {
  return <div className={cn("mb-4", className)}>{children}</div>;
}

export function DialogTitle({ className, children }) {
  return <h2 className={cn("text-lg font-semibold", className)}>{children}</h2>;
}

export function DialogFooter({ className, children }) {
  return <div className={cn("flex gap-2 justify-end mt-4", className)}>{children}</div>;
}

export function AlertDialog({ children }) {
  return <>{children}</>;
}

export function AlertDialogTrigger({ asChild, children }) {
  return children;
}

export function AlertDialogContent({ children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 w-full max-w-sm rounded-card border border-border bg-surface p-5 shadow-premium-lg">{children}</div>
    </div>
  );
}

export function AlertDialogHeader({ children }) {
  return <div className="mb-3">{children}</div>;
}

export function AlertDialogTitle({ children }) {
  return <h3 className="font-semibold">{children}</h3>;
}

export function AlertDialogDescription({ children }) {
  return <p className="text-sm text-muted mt-1">{children}</p>;
}

export function AlertDialogFooter({ children }) {
  return <div className="flex gap-2 justify-end mt-4">{children}</div>;
}

export function AlertDialogCancel({ children, onClick }) {
  return <Button variant="outline" onClick={onClick}>{children}</Button>;
}

export function AlertDialogAction({ children, onClick }) {
  return <Button variant="destructive" onClick={onClick}>{children}</Button>;
}

export function Tabs({ defaultValue, children }) {
  const [tab, setTab] = useState(defaultValue);
  return <div data-tab={tab}>{typeof children === "function" ? children({ tab, setTab }) : children}</div>;
}

export function TabsList({ className, children }) {
  return <div className={cn("inline-flex rounded-btn bg-[var(--color-bg)] p-1", className)}>{children}</div>;
}

export function TabsTrigger({ value, className, children, onClick }) {
  return (
    <button className={cn("flex-1 rounded-btn px-3 py-1.5 text-sm font-medium transition-colors", className)} onClick={onClick}>
      {children}
    </button>
  );
}

export function TabsContent({ value, children }) {
  return <div className="mt-4">{children}</div>;
}

export function Accordion({ type, collapsible, defaultValue, children }) {
  return <div className="divide-y divide-border">{children}</div>;
}

export function AccordionItem({ value, children }) {
  return <div>{children}</div>;
}

export function AccordionTrigger({ className, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button className={cn("flex w-full items-center justify-between py-3 font-medium", className)} onClick={() => setOpen(!open)}>
        {children}
        <span className="text-muted">{open ? "−" : "+"}</span>
      </button>
      {open && <div className="pb-3">{children}</div>}
    </div>
  );
}

export function AccordionContent({ className, children }) {
  return <div className={cn("text-sm text-muted pb-3", className)}>{children}</div>;
}

export function Avatar({ className, children }) {
  return <div className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)}>{children}</div>;
}

export function AvatarFallback({ className, children }) {
  return <div className={cn("flex h-full w-full items-center justify-center rounded-full bg-primary/10 text-primary font-medium", className)}>{children}</div>;
}

export function Popover({ defaultOpen, children }) {
  return <div className="relative inline-block">{children}</div>;
}

export function PopoverTrigger({ asChild, children }) {
  return children;
}

export function PopoverContent({ className, children }) {
  return <div className={cn("rounded-card border border-border bg-surface p-4 shadow-premium-lg", className)}>{children}</div>;
}

export function Slider({ value, onValueChange, min = 0, max = 100, step = 1 }) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value?.[1] ?? value}
      onChange={(e) => onValueChange?.([min, Number(e.target.value)])}
      className="w-full accent-primary"
    />
  );
}

export function Pagination({ children }) {
  return <nav className="flex justify-center mt-4">{children}</nav>;
}

export function PaginationContent({ children }) {
  return <ul className="flex items-center gap-1">{children}</ul>;
}

export function PaginationItem({ children }) {
  return <li>{children}</li>;
}

export function PaginationLink({ isActive, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "h-9 w-9 rounded-btn text-sm",
        isActive ? "bg-primary text-white" : "hover:bg-[var(--color-bg)]"
      )}
    >
      {children}
    </button>
  );
}

export function PaginationPrevious({ onClick }) {
  return <button onClick={onClick} className="h-9 px-3 text-sm hover:bg-[var(--color-bg)] rounded-btn">Prev</button>;
}

export function PaginationNext({ onClick }) {
  return <button onClick={onClick} className="h-9 px-3 text-sm hover:bg-[var(--color-bg)] rounded-btn">Next</button>;
}

export function Command({ className, children }) {
  return <div className={cn("rounded-card border border-border bg-surface overflow-hidden", className)}>{children}</div>;
}

export function CommandInput({ placeholder, value, onValueChange }) {
  return (
    <input
      value={value}
      onChange={(e) => onValueChange?.(e.target.value)}
      placeholder={placeholder}
      className="w-full border-0 border-b border-border px-4 py-3 text-sm outline-none"
    />
  );
}

export function CommandList({ children }) {
  return <div className="max-h-72 overflow-y-auto p-2">{children}</div>;
}

export function CommandEmpty({ children }) {
  return <p className="py-6 text-center text-sm text-muted">{children}</p>;
}

export function CommandGroup({ heading, children }) {
  return (
    <div className="mb-2">
      {heading && <p className="px-2 py-1.5 text-xs font-medium text-muted">{heading}</p>}
      {children}
    </div>
  );
}

export function CommandItem({ children, onSelect }) {
  return (
    <button
      onClick={onSelect}
      className="w-full text-left px-2 py-2 text-sm rounded-md hover:bg-[var(--color-bg)] transition-colors"
    >
      {children}
    </button>
  );
}
