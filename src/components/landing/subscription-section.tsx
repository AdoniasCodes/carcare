"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/translations";

interface Tier {
  id: "silver" | "gold" | "platinum";
  nameKey: TranslationKey;
  taglineKey: TranslationKey;
  defaultPrice: number;
  features: TranslationKey[];
  highlight?: boolean;
}

interface PricingRow {
  plan: "silver" | "gold" | "platinum";
  base_price: number;
  current_price: number;
  discount_label: string | null;
  discount_reason: string | null;
}

const tiers: Tier[] = [
  {
    id: "silver",
    nameKey: "sub.silver.name",
    taglineKey: "sub.silver.tagline",
    defaultPrice: 1500,
    features: ["sub.silver.f1", "sub.silver.f2", "sub.silver.f3", "sub.silver.f4", "sub.silver.f5"],
  },
  {
    id: "gold",
    nameKey: "sub.gold.name",
    taglineKey: "sub.gold.tagline",
    defaultPrice: 2500,
    features: ["sub.gold.f1", "sub.gold.f2", "sub.gold.f3", "sub.gold.f4", "sub.gold.f5", "sub.gold.f6"],
    highlight: true,
  },
  {
    id: "platinum",
    nameKey: "sub.platinum.name",
    taglineKey: "sub.platinum.tagline",
    defaultPrice: 4000,
    features: [
      "sub.platinum.f1",
      "sub.platinum.f2",
      "sub.platinum.f3",
      "sub.platinum.f4",
      "sub.platinum.f5",
      "sub.platinum.f6",
      "sub.platinum.f7",
    ],
  },
];

function formatETB(amount: number): string {
  return new Intl.NumberFormat("en-ET").format(amount);
}

export default function SubscriptionSection() {
  const { t } = useLang();
  const [pricing, setPricing] = useState<Record<string, PricingRow>>({});

  useEffect(() => {
    fetch("/api/pricing")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const map: Record<string, PricingRow> = {};
          data.forEach((row: PricingRow) => {
            map[row.plan] = row;
          });
          setPricing(map);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <section id="subscription" className="py-20 sm:py-28 bg-gradient-to-b from-surface to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <span className="text-accent font-semibold text-sm uppercase tracking-wider">{t("sub.eyebrow")}</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary mt-2 mb-5">
            {t("sub.title")}
          </h2>
          <p className="text-lg text-gray-600 leading-relaxed">{t("sub.subtitle")}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {tiers.map((tier) => {
            const live = pricing[tier.id];
            const basePrice = live?.base_price ?? tier.defaultPrice;
            const currentPrice = live?.current_price ?? tier.defaultPrice;
            const hasDiscount = currentPrice < basePrice;
            const savingsPct = hasDiscount ? Math.round(((basePrice - currentPrice) / basePrice) * 100) : 0;
            const discountLabel = live?.discount_label;
            const discountReason = live?.discount_reason;

            return (
              <div
                key={tier.id}
                className={`relative rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 ${
                  tier.highlight
                    ? "bg-primary text-white shadow-2xl shadow-primary/30 ring-2 ring-accent scale-100 md:scale-105"
                    : "bg-white border border-gray-100 shadow-sm hover:shadow-xl"
                }`}
              >
                {tier.highlight && (
                  <div className="absolute top-4 right-4 bg-accent text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                    {t("sub.popular")}
                  </div>
                )}

                {hasDiscount && (
                  <div className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-lg">
                    {savingsPct}% OFF
                  </div>
                )}

                <div className={`p-8 ${hasDiscount ? "pt-14" : ""}`}>
                  <h3 className={`text-2xl font-bold mb-1 ${tier.highlight ? "text-white" : "text-primary"}`}>
                    {t(tier.nameKey)}
                  </h3>
                  <p className={`text-sm mb-6 ${tier.highlight ? "text-white/70" : "text-gray-500"}`}>
                    {t(tier.taglineKey)}
                  </p>

                  <div className="mb-3">
                    {hasDiscount && (
                      <div className={`text-sm line-through ${tier.highlight ? "text-white/50" : "text-gray-400"}`}>
                        {formatETB(basePrice)} ETB
                      </div>
                    )}
                    <div className="flex items-baseline gap-2">
                      <span className={`text-4xl font-bold ${tier.highlight ? "text-white" : "text-gray-900"}`}>
                        {formatETB(currentPrice)}
                      </span>
                      <span className={`text-sm ${tier.highlight ? "text-white/70" : "text-gray-500"}`}>ETB</span>
                    </div>
                    <p className={`text-sm mt-1 ${tier.highlight ? "text-white/70" : "text-gray-500"}`}>
                      {t("sub.perYear")}
                    </p>
                  </div>

                  {hasDiscount && (discountLabel || discountReason) && (
                    <div
                      className={`mb-6 rounded-lg px-3 py-2 ${
                        tier.highlight
                          ? "bg-accent/20 border border-accent/30"
                          : "bg-red-50 border border-red-100"
                      }`}
                    >
                      {discountLabel && (
                        <p className={`text-xs font-bold uppercase tracking-wider ${tier.highlight ? "text-accent" : "text-red-700"}`}>
                          {discountLabel}
                        </p>
                      )}
                      {discountReason && (
                        <p className={`text-xs mt-0.5 ${tier.highlight ? "text-white/80" : "text-red-600"}`}>
                          {discountReason}
                        </p>
                      )}
                    </div>
                  )}

                  <ul className="space-y-3 mb-8 mt-2">
                    {tier.features.map((fkey, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <svg
                          className={`w-5 h-5 flex-shrink-0 mt-0.5 ${tier.highlight ? "text-accent" : "text-green-500"}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className={`text-sm leading-relaxed ${tier.highlight ? "text-white/90" : "text-gray-700"}`}>
                          {t(fkey)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={`/subscription?plan=${tier.id}`}
                    className={`block w-full text-center px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                      tier.highlight
                        ? "bg-accent hover:bg-accent-dark text-white shadow-lg shadow-accent/30"
                        : "bg-primary hover:bg-primary-light text-white"
                    }`}
                  >
                    {t("sub.choose")}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <Link
            href="/subscription"
            className="inline-flex items-center gap-2 text-primary hover:text-primary-light font-semibold transition-colors"
          >
            {t("sub.viewAll")}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
