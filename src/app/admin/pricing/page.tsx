"use client";

import { useEffect, useState } from "react";

interface PlanPricing {
  plan: "silver" | "gold" | "platinum";
  base_price: number;
  current_price: number;
  discount_label: string | null;
  discount_reason: string | null;
}

const planMeta: Record<string, { label: string; color: string }> = {
  silver: { label: "Silver", color: "bg-slate-100 text-slate-800 border-slate-300" },
  gold: { label: "Gold", color: "bg-amber-50 text-amber-800 border-amber-300" },
  platinum: { label: "Platinum", color: "bg-indigo-50 text-indigo-800 border-indigo-300" },
};

function formatETB(n: number): string {
  return new Intl.NumberFormat("en-ET").format(n);
}

export default function AdminPricingPage() {
  const [rows, setRows] = useState<PlanPricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingPlan, setSavingPlan] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, Partial<PlanPricing>>>({});

  const fetchPricing = () => {
    setLoading(true);
    fetch("/api/pricing")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setRows(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPricing();
  }, []);

  const setField = (plan: string, field: keyof PlanPricing, value: string | number | null) => {
    setEdits((prev) => ({
      ...prev,
      [plan]: { ...prev[plan], [field]: value },
    }));
  };

  const getValue = <K extends keyof PlanPricing>(row: PlanPricing, field: K): PlanPricing[K] => {
    const edit = edits[row.plan];
    if (edit && field in edit) return edit[field] as PlanPricing[K];
    return row[field];
  };

  const save = async (plan: string) => {
    const edit = edits[plan];
    if (!edit) return;
    setSavingPlan(plan);
    try {
      const key = localStorage.getItem("admin-key");
      const res = await fetch(`/api/pricing/${plan}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-key": key || "" },
        body: JSON.stringify(edit),
      });
      if (!res.ok) throw new Error("Failed");
      setEdits((prev) => {
        const next = { ...prev };
        delete next[plan];
        return next;
      });
      fetchPricing();
    } catch (err) {
      console.error(err);
      alert("Failed to save");
    } finally {
      setSavingPlan(null);
    }
  };

  const clearDiscount = (plan: string, basePrice: number) => {
    setEdits((prev) => ({
      ...prev,
      [plan]: {
        ...prev[plan],
        current_price: basePrice,
        discount_label: null,
        discount_reason: null,
      },
    }));
  };

  if (loading) {
    return <div className="text-center py-16 text-gray-500">Loading pricing...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Pricing & Discounts</h2>
        <p className="text-gray-500">
          Set the live yearly price for each plan. If the current price is below base price, a
          discount badge shows on the public site.
        </p>
      </div>

      <div className="space-y-5">
        {rows.map((row) => {
          const meta = planMeta[row.plan];
          const editedBase = Number(getValue(row, "base_price")) || 0;
          const editedCurrent = Number(getValue(row, "current_price")) || 0;
          const editedLabel = (getValue(row, "discount_label") as string | null) ?? "";
          const editedReason = (getValue(row, "discount_reason") as string | null) ?? "";
          const hasEdits = Boolean(edits[row.plan]);
          const showDiscount = editedCurrent < editedBase && editedBase > 0;
          const savingsPct = showDiscount ? Math.round(((editedBase - editedCurrent) / editedBase) * 100) : 0;

          return (
            <div key={row.plan} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-5 sm:p-6 flex flex-wrap items-center justify-between gap-3 border-b">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${meta.color}`}>
                    {meta.label}
                  </span>
                  {showDiscount && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                      {savingsPct}% OFF
                    </span>
                  )}
                </div>
                <div className="text-right">
                  {showDiscount ? (
                    <div>
                      <span className="text-gray-400 text-sm line-through mr-2">{formatETB(editedBase)} ETB</span>
                      <span className="text-2xl font-bold text-green-700">{formatETB(editedCurrent)} ETB</span>
                    </div>
                  ) : (
                    <span className="text-2xl font-bold text-gray-900">{formatETB(editedCurrent)} ETB</span>
                  )}
                  <p className="text-xs text-gray-500">/ year</p>
                </div>
              </div>

              <div className="p-5 sm:p-6 grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Base Price (ETB)</label>
                  <input
                    type="number"
                    value={editedBase}
                    onChange={(e) => setField(row.plan, "base_price", Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                  />
                  <p className="text-xs text-gray-400 mt-1">The original/full price (shown crossed out when discounted)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Price (ETB)</label>
                  <input
                    type="number"
                    value={editedCurrent}
                    onChange={(e) => setField(row.plan, "current_price", Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                  />
                  <p className="text-xs text-gray-400 mt-1">What customers actually pay</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount Badge Label</label>
                  <input
                    type="text"
                    value={editedLabel}
                    onChange={(e) => setField(row.plan, "discount_label", e.target.value)}
                    placeholder="e.g. Limited Time / Launch Special"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                  />
                  <p className="text-xs text-gray-400 mt-1">Short text shown on the badge</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount Reason / Note</label>
                  <input
                    type="text"
                    value={editedReason}
                    onChange={(e) => setField(row.plan, "discount_reason", e.target.value)}
                    placeholder="e.g. Save 500 ETB this May only"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                  />
                  <p className="text-xs text-gray-400 mt-1">Longer explanation shown under the price</p>
                </div>
              </div>

              <div className="p-5 sm:p-6 bg-gray-50 flex flex-wrap gap-3 justify-end">
                <button
                  onClick={() => clearDiscount(row.plan, editedBase)}
                  className="px-4 py-2 bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                >
                  Clear Discount
                </button>
                <button
                  onClick={() => save(row.plan)}
                  disabled={!hasEdits || savingPlan === row.plan}
                  className="px-6 py-2 bg-primary hover:bg-primary-light disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {savingPlan === row.plan ? "Saving..." : hasEdits ? "Save Changes" : "No Changes"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <p className="font-semibold mb-1">How it works:</p>
        <ul className="list-disc list-inside space-y-1 text-blue-700">
          <li>Set <strong>Base Price</strong> = the regular yearly price.</li>
          <li>Set <strong>Current Price</strong> = what you&apos;re charging right now (lower for a discount, same as base for no discount).</li>
          <li>Add a <strong>Label</strong> like &ldquo;May Special&rdquo; and a <strong>Reason</strong> like &ldquo;Save 1,000 ETB this month&rdquo;.</li>
          <li>Changes show on the public landing page and `/subscription` immediately.</li>
        </ul>
      </div>
    </div>
  );
}
