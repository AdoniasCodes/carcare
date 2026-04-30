"use client";

import { useState } from "react";
import Link from "next/link";
import { useLang } from "@/lib/i18n";
import { CONTACT } from "@/lib/contact";
import LangToggle from "@/components/lang-toggle";
import PromoInput, { type PromoApplied } from "@/components/promo-input";
import type { TranslationKey } from "@/lib/translations";

const serviceTypes: { value: string; labelKey: TranslationKey }[] = [
  { value: "preventative", labelKey: "book.svc.preventative" },
  { value: "routine", labelKey: "book.svc.routine" },
  { value: "roadside", labelKey: "book.svc.roadside" },
  { value: "other", labelKey: "book.svc.other" },
];

interface BookingForm {
  name: string;
  phone: string;
  carMake: string;
  carModel: string;
  carYear: string;
  serviceType: string;
  preferredDate: string;
  location: string;
  description: string;
}

export default function BookPage() {
  const { t } = useLang();
  const [form, setForm] = useState<BookingForm>({
    name: "",
    phone: "",
    carMake: "",
    carModel: "",
    carYear: "",
    serviceType: "",
    preferredDate: "",
    location: "",
    description: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof BookingForm, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [bookingId, setBookingId] = useState("");
  const [promo, setPromo] = useState<PromoApplied | null>(null);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof BookingForm, string>> = {};

    if (!form.name.trim() || form.name.trim().length < 2)
      newErrors.name = t("book.errName");
    if (!form.phone.trim())
      newErrors.phone = t("book.errPhoneEmpty");
    else if (!/^(\+251|0)9\d{8}$/.test(form.phone.replace(/\s/g, "")))
      newErrors.phone = t("book.errPhoneInvalid");
    if (!form.carMake.trim()) newErrors.carMake = t("book.errMake");
    if (!form.carModel.trim()) newErrors.carModel = t("book.errModel");
    if (!form.carYear.trim()) newErrors.carYear = t("book.errYearEmpty");
    else {
      const year = parseInt(form.carYear);
      if (year < 1990 || year > new Date().getFullYear() + 1)
        newErrors.carYear = t("book.errYearInvalid");
    }
    if (!form.serviceType) newErrors.serviceType = t("book.errService");
    if (!form.preferredDate) newErrors.preferredDate = t("book.errDate");
    if (!form.location.trim()) newErrors.location = t("book.errLocation");

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, promoCode: promo?.code || null }),
      });

      if (!res.ok) throw new Error("Failed to submit");

      const data = await res.json();
      setBookingId(data.id || "CONFIRMED");
      setSubmitted(true);
    } catch {
      setErrors({ name: t("book.errGeneric") });
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name as keyof BookingForm]) {
      setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">{t("book.success")}</h1>
          <p className="text-gray-600 mb-2">{t("book.successText")}</p>
          <p className="text-sm text-gray-400 mb-8">
            {t("book.reference")}: {bookingId}
          </p>
          <div className="flex flex-col gap-3">
            <a
              href={`tel:${CONTACT.phonePrimary}`}
              className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-light transition-colors"
            >
              <svg className="mr-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
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

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-surface">
      <div className="bg-primary py-8">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex items-center justify-between mb-2">
            <Link href="/" className="text-white/60 hover:text-white text-sm transition-colors">
              {t("book.back")}
            </Link>
            <LangToggle variant="dark" />
          </div>
          <h1 className="text-3xl font-bold text-white">{t("book.title")}</h1>
          <p className="text-white/70 mt-2">{t("book.subtitle")}</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t("book.yourInfo")}</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("book.fullName")} *</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("book.phone")} *</label>
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
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t("book.carDetails")}</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("book.make")} *</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("book.model")} *</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("book.year")} *</label>
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
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t("book.serviceDetails")}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("book.serviceType")} *</label>
                <select
                  name="serviceType"
                  value={form.serviceType}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-xl border ${
                    errors.serviceType ? "border-red-400 bg-red-50" : "border-gray-200"
                  } focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-white`}
                >
                  <option value="">{t("book.selectService")}</option>
                  {serviceTypes.map((s) => (
                    <option key={s.value} value={s.value}>
                      {t(s.labelKey)}
                    </option>
                  ))}
                </select>
                {errors.serviceType && <p className="text-red-500 text-sm mt-1">{errors.serviceType}</p>}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t("book.preferredDate")} *</label>
                  <input
                    type="date"
                    name="preferredDate"
                    value={form.preferredDate}
                    onChange={handleChange}
                    min={today}
                    className={`w-full px-4 py-3 rounded-xl border ${
                      errors.preferredDate ? "border-red-400 bg-red-50" : "border-gray-200"
                    } focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors`}
                  />
                  {errors.preferredDate && <p className="text-red-500 text-sm mt-1">{errors.preferredDate}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t("book.location")} *</label>
                  <input
                    type="text"
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    placeholder={t("book.locationPh")}
                    className={`w-full px-4 py-3 rounded-xl border ${
                      errors.location ? "border-red-400 bg-red-50" : "border-gray-200"
                    } focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors`}
                  />
                  {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("book.describe")}</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder={t("book.describePh")}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm">
            <PromoInput context="booking" onApply={setPromo} applied={promo} />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-accent hover:bg-accent-dark disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-lg transition-all duration-200 shadow-lg shadow-accent/30 hover:shadow-xl hover:-translate-y-0.5 disabled:shadow-none disabled:hover:translate-y-0"
          >
            {submitting ? t("book.submitting") : t("book.submit")}
          </button>

          <p className="text-center text-sm text-gray-500">
            {t("book.preferCall")}{" "}
            <a href={`tel:${CONTACT.phonePrimary}`} className="text-primary font-medium hover:underline">
              {t("book.callDirect")}
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
