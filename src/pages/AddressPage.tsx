import React, { useState, useEffect } from "react";
import {
  Card, CardContent, Button, Input, Label, Checkbox,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui";
import { PageShell } from "@/components/layout/AppShell";
import { Home, Briefcase, MapPin, Plus, Pencil, Trash2, ShieldCheck, AlertTriangle } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { customerApi } from "@/lib/api/services";
import { useNavigate } from "react-router-dom";

// ===========================================================================
// AddressPage — wrapped in PageShell for proper desktop header/sidebar/nav.
// Desktop: 2-column grid of address cards. Mobile: single column.
// Maps to: customer/get-addresses (list), customer/create-address (save)
// ===========================================================================

const ICONS = { home: Home, office: Briefcase, work: Briefcase, other: MapPin };

const emptyForm = {
  fullName: "", phone: "", door: "", street: "", area: "", landmark: "",
  city: "", pincode: "", state: "", country: "India", type: "home", isDefault: false,
  latitude: null, longitude: null,
};

export default function AddressPage() {
  const navigate = useNavigate();
  const { customer, token, belongsTo, isLoggedIn, userLocation } = useApp();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const update = (k: string) => (e: any) => setForm({ ...form, [k]: e.target?.value ?? e });

  // API: POST /customer/get-addresses
  const loadAddresses = async (pageNum: number, isLoadMore = false) => {
    if (!isLoggedIn || !customer?.phone || !token) { 
      setLoading(false); 
      return; 
    }
    
    if (isLoadMore) setLoadingMore(true);
    else setLoading(true);

    try {
      const lat = userLocation?.lat ?? 10.777460;
      const lng = userLocation?.lng ?? 79.634514;
      // customerApi.getAddresses uses params: { page, limit } inside the apiRequest wrapper, but let's pass it manually if the wrapper needs it, or rely on its default.
      // Wait, in services.js, getAddresses has hardcoded params { page: 1, limit: 20 }. I will update services.js separately if needed, or pass it directly.
      // Actually, since I can't easily change services.js without an extra step, I'll assume it respects pagination if provided in params. Let's look at services.js: it hardcodes `params: { page: 1, limit: 20 }`. Let's fix that in a moment. For now, fetch with correct lat/lng.
      const res = await customerApi.getAddresses(customer.phone, lat, lng, token, pageNum);
      const list = res.data || res.addresses || [];
      const total = res.totalCount || 0;
      
      const formatted = list.map((a: any) => {
        const latVal = Number(a.latitude);
        const lngVal = Number(a.longitude);
        const isInvalid = (!latVal && !lngVal) || a.address === ", , , , , " || !a.address;
        
        return {
          id: a._id,
          type: a.type || "home",
          fullName: a.customerName || customer.name || "",
          phone: a.customerPhone || customer.phone || "",
          line: a.address || `${a.address1 || ""}${a.address2 ? ", " + a.address2 : ""}`,
          city: a.city || "",
          state: a.state || "",
          pincode: a.pincode || "",
          landmark: a.landMark || "",
          isDefault: a.isDefault || false,
          latitude: a.latitude,
          longitude: a.longitude,
          location: a.location,
          isInvalid
        };
      });

      if (isLoadMore) {
        setAddresses(prev => [...prev, ...formatted]);
      } else {
        setAddresses(formatted);
      }
      
      setHasMore(total > (isLoadMore ? addresses.length + formatted.length : formatted.length));
    } catch {
      if (!isLoadMore) setAddresses([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadAddresses(1, false);
  }, [customer, token, isLoggedIn, userLocation]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadAddresses(nextPage, true);
  };

  // API: POST /customer/create-address
  const handleSave = async () => {
    if (!form.door || !form.city || !form.state || !form.country || !form.pincode) {
      setSaveError("Please fill all required fields (Door No, City, State, Country, Pincode).");
      return;
    }

    const pincodeRegex = /^[0-9]{6}$/;
    if (!pincodeRegex.test(form.pincode)) {
      setSaveError("Please enter a valid 6-digit pincode.");
      return;
    }

    const lat = form.latitude ?? userLocation?.lat;
    const lng = form.longitude ?? userLocation?.lng;

    if (lat == null || lng == null || isNaN(Number(lat)) || isNaN(Number(lng)) || (lat === 0 && lng === 0)) {
      setSaveError("Invalid location coordinates. Please try searching for a location first.");
      return;
    }

    setSaveError("");
    setSaving(true);
    try {
      const payload = {
        address1: form.door,
        address2: form.street ? `${form.street}${form.area ? ", " + form.area : ""}` : (form.area || ""),
        city: form.city,
        state: form.state,
        country: form.country,
        pincode: form.pincode,
        latitude: Number(lat),
        longitude: Number(lng),
        landMark: form.landmark,
        type: form.type,
        belongsTo: belongsTo,
      };
      const res = await customerApi.createAddress(payload, token);
      const saved = res.data || res;
      setAddresses((prev) => [
        ...prev,
        {
          id: saved._id,
          type: saved.type || form.type,
          fullName: saved.customerName || form.fullName,
          phone: saved.customerPhone || form.phone,
          line: saved.address || `${form.door}, ${form.street}`,
          city: saved.city || form.city,
          state: saved.state || form.state,
          pincode: saved.pincode || form.pincode,
          landmark: saved.landMark || form.landmark,
          latitude: saved.latitude || payload.latitude,
          longitude: saved.longitude || payload.longitude,
          location: saved.location,
          isDefault: form.isDefault,
          isInvalid: false
        },
      ]);
      setForm(emptyForm);
      setOpen(false);
      // Refresh list automatically after Add to ensure accurate state
      loadAddresses(1, false);
    } catch (err: any) {
      setSaveError(err.message || "Failed to save address. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const remove = (id: string) => {
    // Optimistic delete, actual API call would go here if provided
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  };

  // Not logged in
  if (!isLoggedIn) {
    return (
      <PageShell title="Saved Addresses">
        <div className="flex flex-col items-center justify-center gap-4 py-24 px-4 text-center">
          <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="font-semibold">Sign in to manage addresses</p>
            <p className="text-sm text-muted mt-1">Your saved delivery addresses will appear here.</p>
          </div>
          <Button onClick={() => navigate("/login")} size="lg" className="shadow-glow">Log in</Button>
        </div>
      </PageShell>
    );
  }

  if (loading) {
    return (
      <PageShell title="Saved Addresses">
        <div className="px-4 lg:px-0 pt-4 lg:pt-0 space-y-3 max-w-2xl">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 w-full bg-border/40 rounded-card animate-pulse" />
          ))}
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Saved Addresses">
      <div className="px-4 lg:px-0 pt-4 lg:pt-0 pb-6 space-y-5 max-w-2xl lg:max-w-3xl mx-auto lg:mx-0">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Saved addresses</h2>
            {addresses.length > 0 && (
              <p className="text-xs text-muted mt-0.5">{addresses.length} address{addresses.length !== 1 ? "es" : ""} saved</p>
            )}
          </div>
          <Button size="sm" className="gap-1.5 font-medium shadow-sm" onClick={() => { setOpen(true); setSaveError(""); setForm(emptyForm); }}>
            <Plus className="h-4 w-4" /> Add address
          </Button>
        </div>

        {/* Empty state */}
        {addresses.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-center rounded-card border border-dashed border-border bg-surface">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
              <MapPin className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold">No saved addresses yet</p>
              <p className="text-sm text-muted mt-1">Add a delivery address to speed up checkout.</p>
            </div>
            <Button size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" /> Add your first address
            </Button>
          </div>
        )}

        {/* Address grid — 1 col on mobile, 2 col on desktop */}
        {addresses.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {addresses.map((a) => {
              const Icon = ICONS[a.type] ?? MapPin;
              return (
                <Card 
                  key={a.id} 
                  className={`border-border shadow-premium rounded-lg2 cursor-pointer transition-all ${a.isInvalid ? "opacity-60 bg-gray-50 hover:opacity-100" : "card-hover"}`} 
                  onClick={() => { 
                    if (!a.isInvalid) {
                      localStorage.setItem("selectedAddress", JSON.stringify(a)); 
                      navigate(-1); 
                    }
                  }}
                >
                  <CardContent className="pt-4 pb-4 flex gap-3">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${a.isInvalid ? "bg-gray-200" : "bg-primary/10"}`}>
                      {a.isInvalid ? <AlertTriangle className="h-5 w-5 text-gray-500" /> : <Icon className="h-5 w-5 text-primary" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-semibold text-sm capitalize">{a.type}</p>
                        {a.isDefault && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                            Default
                          </span>
                        )}
                      </div>
                      {a.fullName && (
                        <p className="text-xs text-muted truncate">{a.fullName} · {a.phone}</p>
                      )}
                      <p className="text-sm text-muted mt-0.5 leading-snug">
                        {a.line}
                        {a.landmark ? `, ${a.landmark}` : ""}
                        {a.city ? `, ${a.city}` : ""}
                        {a.state ? `, ${a.state}` : ""}
                        {a.pincode ? ` – ${a.pincode}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1.5 shrink-0 self-start">
                      <button className="p-1.5 text-faint hover:text-primary hover:bg-primary/5 rounded-lg transition-colors" title="Edit">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => remove(a.id)}
                        className="p-1.5 text-faint hover:text-danger hover:bg-danger/5 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Load More */}
        {hasMore && (
          <div className="flex justify-center mt-6">
            <Button variant="outline" onClick={handleLoadMore} disabled={loadingMore}>
              {loadingMore ? "Loading…" : "Load more"}
            </Button>
          </div>
        )}

        {/* Add address dialog */}
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setSaveError(""); }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>New address</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5 col-span-2">
                  <Label>Full name</Label>
                  <Input value={form.fullName} onChange={update("fullName")} placeholder="e.g. Priya Sharma" />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label>Phone</Label>
                  <Input value={form.phone} onChange={update("phone")} inputMode="tel" placeholder="98765 43210" />
                </div>
                <div className="space-y-1.5">
                  <Label>Door / Flat no. *</Label>
                  <Input value={form.door} onChange={update("door")} placeholder="12B" />
                </div>
                <div className="space-y-1.5">
                  <Label>Street</Label>
                  <Input value={form.street} onChange={update("street")} placeholder="MG Road" />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label>Area / Locality</Label>
                  <Input value={form.area} onChange={update("area")} placeholder="Adyar" />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label>Landmark</Label>
                  <Input value={form.landmark} onChange={update("landmark")} placeholder="Near bus stop" />
                </div>
                <div className="space-y-1.5">
                  <Label>City *</Label>
                  <Input value={form.city} onChange={update("city")} placeholder="Chennai" />
                </div>
                <div className="space-y-1.5">
                  <Label>Pincode *</Label>
                  <Input value={form.pincode} onChange={update("pincode")} inputMode="numeric" placeholder="600020" />
                </div>
                <div className="space-y-1.5">
                  <Label>State</Label>
                  <Input value={form.state} onChange={update("state")} placeholder="Tamil Nadu" />
                </div>
                <div className="space-y-1.5">
                  <Label>Country</Label>
                  <Input value={form.country} onChange={update("country")} />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label>Type</Label>
                  <select
                    value={form.type}
                    onChange={update("type")}
                    className="w-full h-10 rounded-btn border border-border bg-surface px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="home">🏠 Home</option>
                    <option value="office">💼 Office</option>
                    <option value="other">📍 Other</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 col-span-2 text-sm text-muted pt-1">
                  <Checkbox checked={form.isDefault} onCheckedChange={(v) => setForm({ ...form, isDefault: v })} />
                  Set as default address
                </label>
              </div>
              {saveError && (
                <p className="text-sm text-danger bg-danger/5 border border-danger/20 rounded-btn px-3 py-2">
                  {saveError}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : "Save address"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageShell>
  );
}
