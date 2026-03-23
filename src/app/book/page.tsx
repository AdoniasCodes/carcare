"use client";

import { useState } from "react";
import Link from "next/link";

const serviceTypes = [
  { value: "preventative", label: "Preventative Maintenance Check" },
  { value: "routine", label: "Routine Maintenance (Oil, Filters, Brakes)" },
  { value: "roadside", label: "Roadside Assistance (Emergency)" },
  { value: "other", label: "Other / Not Sure" },
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

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof BookingForm, string>> = {};

    if (!form.name.trim() || form.name.trim().length < 2)
      newErrors.name = "Please enter your name";
    if (!form.phone.trim())
      newErrors.phone = "Please enter your phone number";
    else if (!/^(\+251|0)9\d{8}$/.test(form.phone.replace(/\s/g, "")))
      newErrors.phone = "Enter a valid Ethiopian phone number (09... or +2519...)";
    if (!form.carMake.trim()) newErrors.carMake = "Please enter your car make";
    if (!form.carModel.trim()) newErrors.carModel = "Please enter your car model";
    if (!form.carYear.trim()) newErrors.carYear = "Please enter the year";
    else {
      const year = parseInt(form.carYear);
      if (year < 1990 || year > new Date().getFullYear() + 1)
        newErrors.carYear = "Enter a valid year";
    }
    if (!form.serviceType) newErrors.serviceType = "Please select a service";
    if (!form.preferredDate) newErrors.preferredDate = "Please pick a date";
    if (!form.location.trim()) newErrors.location = "Please enter your location";

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
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Failed to submit");

      const data = await res.json();
      setBookingId(data.id || "CONFIRMED");
      setSubmitted(true);
    } catch {
      setErrors({ name: "Something went wrong. Please call us instead." });
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

  // Success screen
  if (submitted) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Booking Confirmed!
          </h1>
          <p className="text-gray-600 mb-2">
            We&apos;ll call you within 30 minutes to confirm your appointment.
          </p>
          <p className="text-sm text-gray-400 mb-8">
            Reference: {bookingId}
          </p>
          <div className="flex flex-col gap-3">
            <a
              href="tel:+251900000000"
              className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-light transition-colors"
            >
              <svg
                className="mr-2 w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              Call Us Now
            </a>
            <Link
              href="/"
              className="text-primary hover:text-primary-light font-medium transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <div className="bg-primary py-8">
        <div className="max-w-3xl mx-auto px-4">
          <Link href="/" className="text-white/60 hover:text-white text-sm mb-2 inline-block transition-colors">
            &larr; Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-white">Book a Service</h1>
          <p className="text-white/70 mt-2">
            Fill in the details below and we&apos;ll get back to you within 30
            minutes.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl mx-auto px-4 py-10">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Info */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Your Information
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your full name"
                  className={`w-full px-4 py-3 rounded-xl border ${
                    errors.name ? "border-red-400 bg-red-50" : "border-gray-200"
                  } focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors`}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
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
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                )}
              </div>
            </div>
          </div>

          {/* Car Info */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Car Details
            </h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Car Make *
                </label>
                <input
                  type="text"
                  name="carMake"
                  value={form.carMake}
                  onChange={handleChange}
                  placeholder="e.g. Toyota"
                  className={`w-full px-4 py-3 rounded-xl border ${
                    errors.carMake ? "border-red-400 bg-red-50" : "border-gray-200"
                  } focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors`}
                />
                {errors.carMake && (
                  <p className="text-red-500 text-sm mt-1">{errors.carMake}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Car Model *
                </label>
                <input
                  type="text"
                  name="carModel"
                  value={form.carModel}
                  onChange={handleChange}
                  placeholder="e.g. Corolla"
                  className={`w-full px-4 py-3 rounded-xl border ${
                    errors.carModel ? "border-red-400 bg-red-50" : "border-gray-200"
                  } focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors`}
                />
                {errors.carModel && (
                  <p className="text-red-500 text-sm mt-1">{errors.carModel}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Year *
                </label>
                <input
                  type="number"
                  name="carYear"
                  value={form.carYear}
                  onChange={handleChange}
                  placeholder="e.g. 2020"
                  className={`w-full px-4 py-3 rounded-xl border ${
                    errors.carYear ? "border-red-400 bg-red-50" : "border-gray-200"
                  } focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors`}
                />
                {errors.carYear && (
                  <p className="text-red-500 text-sm mt-1">{errors.carYear}</p>
                )}
              </div>
            </div>
          </div>

          {/* Service Info */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Service Details
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Type *
                </label>
                <select
                  name="serviceType"
                  value={form.serviceType}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-xl border ${
                    errors.serviceType ? "border-red-400 bg-red-50" : "border-gray-200"
                  } focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-white`}
                >
                  <option value="">Select a service...</option>
                  {serviceTypes.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                {errors.serviceType && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.serviceType}
                  </p>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preferred Date *
                  </label>
                  <input
                    type="date"
                    name="preferredDate"
                    value={form.preferredDate}
                    onChange={handleChange}
                    min={today}
                    className={`w-full px-4 py-3 rounded-xl border ${
                      errors.preferredDate
                        ? "border-red-400 bg-red-50"
                        : "border-gray-200"
                    } focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors`}
                  />
                  {errors.preferredDate && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.preferredDate}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location / Area *
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    placeholder="e.g. Bole, Megenagna, CMC"
                    className={`w-full px-4 py-3 rounded-xl border ${
                      errors.location
                        ? "border-red-400 bg-red-50"
                        : "border-gray-200"
                    } focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors`}
                  />
                  {errors.location && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.location}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Describe Your Issue (Optional)
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Briefly describe what's going on with your car..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-accent hover:bg-accent-dark disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-lg transition-all duration-200 shadow-lg shadow-accent/30 hover:shadow-xl hover:-translate-y-0.5 disabled:shadow-none disabled:hover:translate-y-0"
          >
            {submitting ? "Submitting..." : "Book My Service"}
          </button>

          <p className="text-center text-sm text-gray-500">
            Prefer to call?{" "}
            <a
              href="tel:+251900000000"
              className="text-primary font-medium hover:underline"
            >
              Call us directly
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
