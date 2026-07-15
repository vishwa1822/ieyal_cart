import { X } from "lucide-react";

export function BottomSheet({ open, onClose, title, children, footer }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg animate-slide-up">
        <div className="mx-auto w-12 h-1 rounded-full bg-border mb-2" />
        <div className="rounded-t-[20px] bg-surface border border-border shadow-premium-lg max-h-[85vh] flex flex-col">
          <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border/60">
            <h3 className="font-semibold text-base">{title}</h3>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-[var(--color-bg)] transition-colors">
              <X className="h-5 w-5 text-muted" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
          {footer && (
            <div className="px-5 py-4 border-t border-border/60 bg-surface">{footer}</div>
          )}
        </div>
      </div>
    </div>
  );
}
