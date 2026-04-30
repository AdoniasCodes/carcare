"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLang } from "@/lib/i18n";
import { CONTACT } from "@/lib/contact";
import LangToggle from "@/components/lang-toggle";
import PromoInput, { type PromoApplied } from "@/components/promo-input";
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

interface Form {
  name: string;
  phone: string;
  email: string;
  carMake: string;
  carModel: string;
  carYear: string;
  plateNumber: string;
  plan: string;
  location: string;
  notes: string;
}

function formatETB(amount: number): string {
  return new Intl.NumberFormat("en-ET").format(amount);
}

function computeFinalPrice(currentPrice: number, promo: PromoApplied | null): number {
  if (!promo) return currentPrice;
  if (promo.discount_type === "percent") {
    return Math.max(0, Math.round(currentPrice * (1 - promo.discount_value / 100)));
  }
  return Math.max(0, currentPrice - promo.discount_value);
}

function SubscriptionPageInner() {
  const { t } = useLang();
  const searchParams = useSearchParams();
  const initialPlan = searchParams.get("plan");
  const validInitial = initialPlan && ["silver", "gold", "platinum"].includes(initialPlan) ? initialPlan : "gold";

  const [pricing, setPricing] = useState<Record<string, PricingRow>>({});
  const [form, setForm] = useState<Form>({
    name: "",
    phone: "",
    email: "",
    carMake: "",
    carModel: "",
    carYear: "",
    plateNumber: "",
    plan: validInitial,
    location: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [subId, setSubId] = useState("");
  const [promo, setPromo] = useState<PromoApplied | null>(null);

  useEffect(() => {
    if (initialPlan && ["silver", "gold", "platinum"].includes(initialPlan)) {
      setForm((prev) => ({ ...prev, plan: initialPlan }));
    }
  }, [initialPlan]);

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

  // Re-validate promo when plan changes (a code might be plan-specific)
  useEffect(() => {
    if (!promo) return;
    fetch("/api/promo/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: promo.code, context: "subscription", plan: form.plan }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (!data.valid) setPromo(null);
      })
      .catch(() => {});
  }, [form.plan, promo]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof Form, string>> = {};

    if (!form.name.trim() || form.name.trim().length < 2) newErrors.name = t("subPage.errName");
    if (!form.phone.trim()) newErrors.phone = t("subPage.errPhone2");
    else if (!/^(\+251|0)9\d{8}$/.test(form.phone.replace(/\s/g, ""))) newErrors.phone = t("subPage.errPhone");
    if (!form.carMake.trim()) newErrors.carMake = t("subPage.errMake");
    if (!form.carModel.trim()) newErrors.carModel = t("subPage.errModel");
    if (!form.carYear.trim()) newErrors.carYear = t("subPage.errYear");
    else {
      const year = parseInt(form.carYear);
      if (year < 1990 || year > new Date().getFullYear() + 1) newErrors.carYear = t("subPage.errYear");
    }
    if (!form.plan) newErrors.plan = t("subPage.errPlan");
    if (!form.location.trim()) newErrors.location = t("subPage.errLoc");

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, promoCode: promo?.code || null }),
      });

      if (!res.ok) throw new Error("Failed to submit");

      const data = await res.json();
      setSubId(data.id || "CONFIRMED");
      setSubmitted(true);
    } catch {
      setErrors({ name: t("subPage.errGeneric") });
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name as keyof Form]) {
      setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
    }
  };

  const getPlanPrice = (planId: string): { base: number; current: number; label: string | null; reason: string | null } => {
    const live = pricing[planId];
    const tier = tiers.find((t) => t.id === planId);
    return {
      base: live?.base_price ?? tier?.defaultPrice ?? 0,
      current: live?.current_price ?? tier?.defaultPrice ?? 0,
      label: live?.discount_label ?? null,
      reason: live?.discount_reason ?? null,
    };
  };

  if (submitted) {
    const tier = tiers.find((tt) => tt.id === form.plan);
    const planPrice = getPlanPrice(form.plan);
    const finalPrice = computeFinalPrice(planPrice.current, promo);
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-10">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">{t("subPage.successTitle")}</h1>
          <p className="text-gray-600 mb-2">{t("subPage.successText")}</p>
          {tier && (
            <p className="text-sm text-gray-700 mb-2">
              {t(tier.nameKey)} — <span className="font-semibold">{formatETB(finalPrice)} ETB</span>
              {(promo || finalPrice < planPrice.base) && (
                <span className="text-gray-400 line-through ml-2">{formatETB(planPrice.base)} ETB</span>
              )}
              {" "}
              {t("sub.perYear")}
            </p>
          )}
          {promo && (
            <p className="text-xs text-green-600 mb-2">{t("promo.applied")} {promo.code}</p>
          )}
          <p className="text-sm text-gray-400 mb-8">
            {t("subPage.reference")}: {subId}
          </p>
          <div className="flex flex-col gap-3">
            <a
              href={`tel:${CONTACT.phonePrimary}`}
              className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-light transition-colors"
            >
              {t("book.callNow")}
            </a>
            <Link href="/" className="text-primary hover:text-primary-light font-medium transition-colors">
              {t("book.backHome")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const selectedPlanPrice = getPlanPrice(form.plan);
  const finalPrice = computeFinalPrice(selectedPlanPrice.current, promo);

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary via-primary-light to-primary-dark py-12 sm:py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between mb-3">
            <Link href="/" className="text-white/60 hover:text-white text-sm transition-colors">
              {t("subPage.back")}
            </Link>
            <LangToggle variant="dark" />
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3">{t("subPage.title")}</h1>
          <p className="text-lg text-white/80 max-w-2xl">{t("subPage.heroSub")}</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Plan picker */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{t("subPage.planTitle")}</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {tiers.map((tier) => {
              const price = getPlanPrice(tier.id);
              const hasDiscount = price.current < price.base;
              const savingsPct = hasDiscount ? Math.round(((price.base - price.current) / price.base) * 100) : 0;
              return (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, plan: tier.id }))}
                  className={`relative text-left rounded-2xl p-6 transition-all duration-200 border-2 ${
                    form.plan === tier.id
                      ? "border-accent bg-white shadow-lg ring-2 ring-accent/20"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  {tier.highlight && (
                    <span className="absolute -top-2 right-4 bg-accent text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                      {t("sub.popular")}
                    </span>
                  )}
                  {hasDiscount && (
                    <span className="absolute -top-2 left-4 bg-red-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                      {savingsPct}% OFF
                    </span>
                  )}
                  <h3 className="font-bold text-primary text-lg mb-1">{t(tier.nameKey)}</h3>
                  <p className="text-xs text-gray-500 mb-4 leading-relaxed">{t(tier.taglineKey)}</p>
                  <div className="mb-2">
                    {hasDiscount && (
                      <div className="text-xs text-gray-400 line-through">{formatETB(price.base)} ETB</div>
                    )}
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-gray-900">{formatETB(price.current)}</span>
                      <span className="text-sm text-gray-500">ETB</span>
                    </div>
                  </div>
                  {hasDiscount && (price.label || price.reason) && (
                    <div className="mb-4 rounded-lg px-2 py-1.5 bg-red-50 border border-red-100">
                      {price.label && (
                        <p className="text-[10px] font-bold uppercase tracking-wider text-red-700">{price.label}</p>
                      )}
                      {price.reason && <p className="text-[10px] text-red-600">{price.reason}</p>}
                    </div>
                  )}
                  <ul className="space-y-2">
                    {tier.features.map((fkey, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                        <svg className="w-4 h-4 flex-shrink-0 text-green-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{t(fkey)}</span>
                      </li>
                    ))}
                  </ul>
                  {form.plan === tier.id && (
                    <div className="absolute top-4 right-4 w-6 h-6 bg-accent rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          {errors.plan && <p className="text-red-500 text-sm mt-2">{errors.plan}</p>}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t("subPage.formTitle")}</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("subPage.fullName")} *</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder={t("book.fullNamePh")}
                  className={`w-full px-4 py-3 rounded-xl border ${
                    errors.name ? "border-red-400 bg-red-50" : "border-gray-200"
                  } focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors`}
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("subPage.phone")} *</label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="09XX XXX XXXX"
                  className={`w-full px-4 py-3 rounded-xl border ${
                    errors.phone ? "border-red-400 bg-red-50" : "border-gray-200"
                  } focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors`}
                />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("subPage.email")}</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t("subPage.carTitle")}</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("subPage.make")} *</label>
                <input
                  type="text"
                  name="carMake"
                  value={form.carMake}
                  onChange={handleChange}
                  placeholder={t("book.makePh")}
                  className={`w-full px-4 py-3 rounded-xl border ${
                    errors.carMake ? "border-red-400 bg-red-50" : "border-gray-200"
                  } focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors`}
                />
                {errors.carMake && <p className="text-red-500 text-sm mt-1">{errors.carMake}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("subPage.model")} *</label>
                <input
                  type="text"
                  name="carModel"
                  value={form.carModel}
                  onChange={handleChange}
                  placeholder={t("book.modelPh")}
                  className={`w-full px-4 py-3 rounded-xl border ${
                    errors.carModel ? "border-red-400 bg-red-50" : "border-gray-200"
                  } focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors`}
                />
                {errors.carModel && <p className="text-red-500 text-sm mt-1">{errors.carModel}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("subPage.year")} *</label>
                <input
                  type="number"
                  name="carYear"
                  value={form.carYear}
                  onChange={handleChange}
                  placeholder={t("book.yearPh")}
                  className={`w-full px-4 py-3 rounded-xl border ${
                    errors.carYear ? "border-red-400 bg-red-50" : "border-gray-200"
                  } focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors`}
                />
                {errors.carYear && <p className="text-red-500 text-sm mt-1">{errors.carYear}</p>}
              </div>
              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("subPage.plate")}</label>
                <input
                  type="text"
                  name="plateNumber"
                  value={form.plateNumber}
                  onChange={handleChange}
                  placeholder="A-12345"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("subPage.location")} *</label>
                <input
                  type="text"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder={t("subPage.locationPh")}
                  className={`w-full px-4 py-3 rounded-xl border ${
                    errors.location ? "border-red-400 bg-red-50" : "border-gray-200"
                  } focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors`}
                />
                {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
              </div>
              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("subPage.notes")}</label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"
                />
              </div>
            </div>
          </div>

          {/* Promo code */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm">
            <PromoInput context="subscription" plan={form.plan} onApply={setPromo} applied={promo} />
          </div>

          {/* Order summary */}
          <div className="bg-primary text-white rounded-2xl p-6 sm:p-8 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/70 mb-3">{t("pricing.you_pay")}</h3>
            <div className="space-y-1.5 text-sm text-white/80">
              <div className="flex justify-between">
                <span>{t(tiers.find(tt => tt.id === form.plan)?.nameKey || "sub.gold.name")}</span>
                <span>{formatETB(selectedPlanPrice.current)} ETB</span>
              </div>
              {selectedPlanPrice.current < selectedPlanPrice.base && (
                <div className="flex justify-between text-white/60 text-xs">
                  <span>{t("pricing.original")}</span>
                  <span className="line-through">{formatETB(selectedPlanPrice.base)} ETB</span>
                </div>
              )}
              {promo && (
                <div className="flex justify-between text-accent">
                  <span>{promo.code}</span>
                  <span>
                    -{promo.discount_type === "percent"
                      ? `${promo.discount_value}%`
                      : `${formatETB(promo.discount_value)} ETB`}
                  </span>
                </div>
              )}
            </div>
            <div className="border-t border-white/20 mt-4 pt-4 flex items-baseline justify-between">
              <span className="text-lg font-semibold">{t("subPage.submit")}</span>
              <div className="text-right">
                <p className="text-3xl font-bold">{formatETB(finalPrice)} <span className="text-sm font-normal">ETB</span></p>
                <p className="text-xs text-white/60">{t("sub.perYear")}</p>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-accent hover:bg-accent-dark disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-lg transition-all duration-200 shadow-lg shadow-accent/30 hover:shadow-xl hover:-translate-y-0.5 disabled:shadow-none disabled:hover:translate-y-0"
          >
            {submitting ? t("subPage.submitting") : t("subPage.submit")}
          </button>

          <p className="text-center text-sm text-gray-500">
            {t("subPage.callPrefer")}{" "}
            <a href={`tel:${CONTACT.phonePrimary}`} className="text-primary font-medium hover:underline">
              {t("subPage.callDirect")}
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}

export default function SubscriptionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface flex items-center justify-center"><p className="text-gray-500">Loading...</p></div>}>
      <SubscriptionPageInner />
    </Suspense>
  );
}
