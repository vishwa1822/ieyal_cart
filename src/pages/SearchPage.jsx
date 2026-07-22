import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, ArrowLeft, Leaf, Sparkles } from "lucide-react";
import { PageShell } from "@/components/layout/AppShell";
import { useApp } from "@/context/AppContext";
import { VegDot } from "@/components/shared/VegDot";
import { Price } from "@/components/shared/Price";
import { QuantityStepper } from "@/components/shared/QuantityStepper";
import { formatPrice } from "@/lib/theme";

// ===========================================================================
// SearchPage — client-side search across the categories/items already loaded
// in AppContext. No backend search API exists, so we filter locally.
//
// Features:
//  • Instant search with debounce feel (useMemo)
//  • Shows matching items grouped by category
//  • Recent searches stored in localStorage
//  • "Popular" section when search is empty
// ===========================================================================

const RECENT_KEY = "owncart_recent_searches";
const MAX_RECENT = 6;

function getRecent() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]").slice(0, MAX_RECENT);
  } catch { return []; }
}

function saveRecent(term) {
  if (!term.trim()) return;
  const prev = getRecent().filter((t) => t !== term.trim());
  localStorage.setItem(RECENT_KEY, JSON.stringify([term.trim(), ...prev].slice(0, MAX_RECENT)));
}

function clearRecent() {
  localStorage.removeItem(RECENT_KEY);
}

export default function SearchPage() {
  const navigate = useNavigate();
  const { categories } = useApp();
  const inputRef = useRef(null);
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState(getRecent);

  // Focus the input on mount
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // Flatten all items from all categories for searching
  const allItems = useMemo(() => {
    const items = [];
    (categories || []).forEach((cat) => {
      (cat.items || []).forEach((item) => {
        items.push({
          ...item,
          categoryName: cat.categoryName || cat.name || "",
          categoryId: cat._id,
        });
      });
    });
    return items;
  }, [categories]);

  // Filter results
  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return allItems.filter((item) => {
      const name = (item.itemName || item.name || "").toLowerCase();
      const cat = (item.categoryName || "").toLowerCase();
      const desc = (item.description || "").toLowerCase();
      return name.includes(q) || cat.includes(q) || desc.includes(q);
    });
  }, [query, allItems]);

  // Group results by category
  const grouped = useMemo(() => {
    const map = new Map();
    results.forEach((item) => {
      const key = item.categoryName || "Other";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    });
    return [...map.entries()];
  }, [results]);

  // Popular items — top 8 items from all categories
  const popular = useMemo(() => {
    return allItems
      .filter((it) => it.isPopular || it.isBestSeller || it.isRecommended)
      .slice(0, 8);
  }, [allItems]);

  const handleItemClick = (item) => {
    const id = item._id || item.itemId;
    if (id) {
      saveRecent(query);
      navigate(`/product/${id}`);
    }
  };

  const handleRecentClick = (term) => {
    setQuery(term);
  };

  return (
    <PageShell title="Search">
      <div className="px-4 lg:px-0 pt-4 lg:pt-0 pb-6 max-w-2xl lg:max-w-4xl mx-auto lg:mx-0 space-y-5">
        {/* Search bar */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="lg:hidden h-10 w-10 rounded-btn bg-surface border border-border flex items-center justify-center text-muted hover:text-primary hover:border-primary/40 transition-colors shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="flex-1 flex items-center gap-2.5 rounded-btn border border-border bg-surface px-4 py-2.5 shadow-xs focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15 transition-all">
            <Search className="h-4 w-4 text-faint shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search dishes, categories…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-faint"
              autoComplete="off"
              spellCheck="false"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="p-0.5 rounded text-faint hover:text-muted transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* No query — show recent searches + popular */}
        {!query.trim() && (
          <>
            {/* Recent searches */}
            {recent.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold">Recent searches</p>
                  <button
                    onClick={() => { clearRecent(); setRecent([]); }}
                    className="text-xs text-primary font-medium hover:underline"
                  >
                    Clear all
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recent.map((term) => (
                    <button
                      key={term}
                      onClick={() => handleRecentClick(term)}
                      className="px-3 py-1.5 rounded-full border border-border bg-surface text-sm text-muted hover:border-primary/40 hover:text-primary transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Popular items */}
            {popular.length > 0 && (
              <div>
                <p className="text-sm font-semibold mb-3 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-primary" /> Popular dishes
                </p>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
                  {popular.map((item) => (
                    <SearchResultItem key={item._id || item.itemId} item={item} onClick={handleItemClick} />
                  ))}
                </div>
              </div>
            )}

            {popular.length === 0 && recent.length === 0 && (
              <div className="text-center py-16 text-muted">
                <Search className="h-10 w-10 mx-auto mb-3 text-faint" />
                <p className="font-medium">Search for dishes</p>
                <p className="text-sm text-faint mt-1">Type a dish name, category, or ingredient</p>
              </div>
            )}
          </>
        )}

        {/* Query active — show results */}
        {query.trim() && results.length === 0 && (
          <div className="text-center py-16 text-muted">
            <Search className="h-10 w-10 mx-auto mb-3 text-faint" />
            <p className="font-medium">No results for "{query}"</p>
            <p className="text-sm text-faint mt-1">Try a different dish name or browse the menu</p>
          </div>
        )}

        {query.trim() && grouped.length > 0 && (
          <div className="space-y-5">
            <p className="text-xs text-faint font-medium">
              {results.length} result{results.length !== 1 ? "s" : ""} for "{query}"
            </p>
            {grouped.map(([catName, items]) => (
              <div key={catName}>
                <p className="text-sm font-semibold mb-2 text-muted">{catName}</p>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
                  {items.map((item) => (
                    <SearchResultItem key={item._id || item.itemId} item={item} onClick={handleItemClick} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}

// ── Search result item card ──────────────────────────────────────────────
function SearchResultItem({ item, onClick }) {
  const price = item.sellingPrice || item.price || item.mrp || 0;
  const originalPrice = item.mrp && item.mrp > price ? item.mrp : null;

  return (
    <button
      onClick={() => onClick(item)}
      className="w-full flex items-center gap-3 rounded-card border border-border bg-surface p-3 shadow-xs hover:shadow-premium hover:border-border-strong transition-all text-left card-hover"
    >
      {/* Image */}
      <div className="h-14 w-14 rounded-btn bg-[var(--color-bg)] shrink-0 flex items-center justify-center overflow-hidden">
        {item.image || item.itemImage ? (
          <img
            src={item.image || item.itemImage}
            alt={item.itemName || item.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-lg">🍽️</span>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {item.itemType === "veg" && <VegDot />}
          <p className="text-sm font-semibold truncate">{item.itemName || item.name}</p>
        </div>
        {item.categoryName && (
          <p className="text-xs text-faint mt-0.5 truncate">{item.categoryName}</p>
        )}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm font-bold tabular-nums">{formatPrice(price)}</span>
          {originalPrice && (
            <span className="text-xs text-faint line-through tabular-nums">{formatPrice(originalPrice)}</span>
          )}
        </div>
      </div>
    </button>
  );
}
