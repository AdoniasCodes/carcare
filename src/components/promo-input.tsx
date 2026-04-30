"use client";

import { useState } from "react";
import { useLang } from "@/lib/i18n";

export interface PromoApplied {
  code: string;
  discount_type: "amount" | "percent";
  discount_value: number;
  description: string | null;
}

interface Props {
  context: "booking" | "subscription";
  plan?: string;
  onApply: (promo: PromoApplied | null) => void;
  applied: PromoApplied | null;
}

export default function PromoInput({ context, plan, onApply, applied }: Props) {
  const { t } = useLang();
  const [code, setCode] = useState("");
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState("");

  const validate = async () => {
    setError("");
    if (!code.trim()) return;
    setValidating(true);
    try {
      const res = await fetch("/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim().toUpperCase(), context, plan }),
      });
      const data = await res.json();
      if (data.valid) {
        onApply({
          code: data.code,
          discount_type: data.discount_type,
          discount_value: data.discount_value,
          description: data.description,
        });
        setCode("");
      } else {
        setError(data.error || t("promo.invalid"));
        onApply(null);
      }
    } catch {
      setError(t("promo.invalid"));
    } finally {
      setValidating(false);
    }
  };

  const remove = () => {
    onApply(null);
    setCode("");
    setError("");
  };

  if (applied) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-green-900 text-sm">
              {applied.code} {t("promo.applied")}
            </p>
            <p className="text-xs text-green-700">
              {applied.discount_type === "percent"
                ? `${applied.discount_value}% ${t("promo.off")}`
                : `${new Intl.NumberFormat("en-ET").format(applied.discount_value)} ETB ${t("promo.off")}`}
              {applied.description ? ` — ${applied.description}` : ""}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={remove}
          className="text-green-700 hover:text-green-900 text-xs font-medium"
        >
          {t("promo.remove")}
        </button>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{t("promo.label")}</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              validate();
            }
          }}
          placeholder={t("promo.placeholder")}
          className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors uppercase tracking-wider"
        />
        <button
          type="button"
          onClick={validate}
          disabled={validating || !code.trim()}
          className="px-5 py-3 bg-primary hover:bg-primary-light disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
        >
          {validating ? "..." : t("promo.apply")}
        </button>
      </div>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
}
