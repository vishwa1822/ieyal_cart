import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Share2 } from "lucide-react";
import { Button, Skeleton } from "@/components/ui";
import { VegDot } from "@/components/shared/VegDot";
import { Price } from "@/components/shared/Price";
import { QuantityStepper } from "@/components/shared/QuantityStepper";
import { BottomSheet } from "@/components/shared/BottomSheet";
import { formatPrice } from "@/lib/theme";
import { useApp } from "@/context/AppContext";
import { productApi, cartApi } from "@/lib/api/services";

// ===========================================================================
// Maps to: POST /item/getItemDetail { itemId, outletId }
// Add to cart: POST /cart/create
// ===========================================================================

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { outlet, token, customer, belongsTo } = useApp();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariation, setSelectedVariation] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState({});
  const [qty, setQty] = useState(1);
  const [showAddons, setShowAddons] = useState(false);
  const [adding, setAdding] = useState(false);

  // API: POST /item/getItemDetail { itemId, outletId }
  useEffect(() => {
    if (!id || !outlet?._id) return;
    (async () => {
      try {
        const res = await productApi.getItemDetail(id, outlet._id, null, token);
        const item = res.data || res;
        setProduct(item);
        if (item.variations?.length) {
          setSelectedVariation(item.variations[item.variations.length - 1]);
        }
      } catch {
        // If API fails, try to find item from categories in context
        setProduct(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, outlet, token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface pb-28">
        <Skeleton className="h-64 w-full" />
        <div className="px-4 mt-4 space-y-3">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-8 w-32" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted">Product not found</p>
          <Button variant="outline" onClick={() => navigate(-1)} className="mt-4">Go back</Button>
        </div>
      </div>
    );
  }

  const itemName = product.itemname || product.name || "Product";
  const basePrice = selectedVariation?.basePrice || product.basePrice || 0;
  const sellingPrice = selectedVariation?.sellingPrice || product.sellingPrice || 0;
  const addonTotal = Object.entries(selectedAddons).reduce((sum, [addonId, on]) => {
    if (!on) return sum;
    const addon = product.addons?.flatMap((g) => g.items).find((a) => a._id === addonId);
    return sum + (addon?.price || 0);
  }, 0);
  const lineTotal = (sellingPrice + addonTotal) * qty;

  const toggleAddon = (addonId) => {
    setSelectedAddons((prev) => ({ ...prev, [addonId]: !prev[addonId] }));
  };

  // API: POST /cart/create
  const handleAddToCart = async () => {
    setAdding(true);
    try {
      const addOnDetails = [];
      product.addons?.forEach((group) => {
        const selectedIds = group.items.filter((a) => selectedAddons[a._id]).map((a) => a._id);
        if (selectedIds.length) {
          addOnDetails.push({ group_id: group.group_id, addon_item_ids: selectedIds });
        }
      });

      const savedAddrStr = localStorage.getItem("selectedAddress");
      const savedAddr = savedAddrStr ? JSON.parse(savedAddrStr) : null;
      const addressPayload = (savedAddr && (savedAddr.id || savedAddr._id))
        ? { addressId: savedAddr.id || savedAddr._id }
        : {
          address1: "Default",
          address2: "Default",
          city: "Default",
          state: "Default",
          country: "India",
          pincode: "000000",
          latitude: 10.777460,
          longitude: 79.634514
        };

      const payload = {
        items: [{
          itemId: id,
          quantity: qty,
          variationId: selectedVariation?._id || "",
          addOnDetails,
          currency: "INR",
        }],
        deliveryType: "Door Delivery",
        orderType: "Door Delivery",
        customerName: customer?.name || "",
        customerPhoneNo: customer?.phone || "",
        instruction: "",
        outletId: outlet._id,
        ...addressPayload
      };

      await cartApi.create(payload, token);
      navigate("/cart");
    } catch {
      navigate("/cart");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] pb-28">
      {/* Hero image */}
      <div className="relative h-64 bg-gradient-to-b from-secondary/40 to-[var(--color-bg)]">
        <button onClick={() => navigate(-1)} className="absolute top-4 left-4 z-10 p-2 rounded-full glass shadow-premium">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button className="absolute top-4 right-4 z-10 p-2 rounded-full glass shadow-premium">
          <Share2 className="h-5 w-5" />
        </button>
        {product.image?.length ? (
          <img src={product.image[0]} alt={itemName} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-6xl">🍽️</div>
        )}
      </div>

      <div className="px-4 -mt-6 relative z-10">
        <div className="rounded-card bg-surface border border-border shadow-premium-lg p-5 animate-slide-up">
          <div className="flex items-center gap-2 mb-1">
            <VegDot type={product.dietryType} size={14} />
            <h1 className="text-xl font-bold">{itemName}</h1>
          </div>
          <p className="text-sm text-muted leading-relaxed">{product.description}</p>
          <Price basePrice={basePrice} sellingPrice={sellingPrice} size="lg" className="mt-3" />

          {/* Variations */}
          {product.variations?.length > 0 && (
            <div className="mt-5">
              <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Size</p>
              <div className="flex gap-2">
                {product.variations.map((v) => (
                  <button
                    key={v._id}
                    onClick={() => setSelectedVariation(v)}
                    className={`flex-1 py-2.5 rounded-btn text-sm font-semibold border-2 transition-all ${selectedVariation?._id === v._id
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-muted"
                      }`}
                  >
                    {v.name}
                    <span className="block text-xs font-normal mt-0.5">{formatPrice(v.sellingPrice)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Add-ons trigger */}
          {product.addons?.length > 0 && (
            <button
              onClick={() => setShowAddons(true)}
              className="mt-4 w-full py-3 rounded-btn border border-dashed border-primary/40 text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
            >
              Customize add-ons {addonTotal > 0 && `(+${formatPrice(addonTotal)})`}
            </button>
          )}
        </div>
      </div>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 glass border-t border-border/60 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-4">
          <QuantityStepper value={qty} onChange={setQty} size="lg" min={1} />
          <Button className="flex-1 h-12 text-base font-semibold" onClick={handleAddToCart} disabled={adding}>
            {adding ? "Adding…" : `Add to cart · ${formatPrice(lineTotal)}`}
          </Button>
        </div>
      </div>

      <BottomSheet
        open={showAddons}
        onClose={() => setShowAddons(false)}
        title="Customize your order"
        footer={
          <Button className="w-full" onClick={() => setShowAddons(false)}>
            Done · {formatPrice(lineTotal)}
          </Button>
        }
      >
        {product.addons?.map((group) => (
          <div key={group.group_id} className="mb-4">
            <p className="text-sm font-semibold mb-2">{group.group_name}</p>
            <div className="space-y-2">
              {group.items.map((addon) => (
                <label
                  key={addon._id}
                  className="flex items-center justify-between p-3 rounded-btn border border-border hover:border-primary/30 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={!!selectedAddons[addon._id]}
                      onChange={() => toggleAddon(addon._id)}
                      className="accent-primary"
                    />
                    <span className="text-sm">{addon.name}</span>
                  </div>
                  <span className="text-sm font-medium text-primary">+{formatPrice(addon.price)}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </BottomSheet>
    </div>
  );
}
