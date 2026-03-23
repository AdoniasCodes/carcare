import Link from "next/link";
import Image from "next/image";

export default function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src="/images/hero-car.jpg"
          alt="Professional car service"
          fill
          className="object-cover"
          priority
        />
        {/* Dark overlay with gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/85 to-primary/60" />
      </div>

      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text content */}
          <div>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-8">
              <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
              <span className="text-white/90 text-sm font-medium">
                First of its kind in Ethiopia
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Expert Car Care,{" "}
              <span className="text-accent">Delivered to You</span>
            </h1>

            <p className="text-lg sm:text-xl text-white/80 mb-10 max-w-2xl leading-relaxed">
              No more wasting your day at a garage. Our certified mechanics come
              to your location — home, office, or roadside. Fast, reliable, and
              professional vehicle service.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/book"
                className="inline-flex items-center justify-center px-8 py-4 bg-accent hover:bg-accent-dark text-white font-semibold rounded-xl text-lg transition-all duration-200 shadow-lg shadow-accent/30 hover:shadow-xl hover:shadow-accent/40 hover:-translate-y-0.5"
              >
                Book a Service
                <svg
                  className="ml-2 w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Link>

              <a
                href="tel:+251900000000"
                className="inline-flex items-center justify-center px-8 py-4 border-2 border-white/30 hover:border-white/60 text-white font-semibold rounded-xl text-lg transition-all duration-200 hover:-translate-y-0.5 backdrop-blur-sm"
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
            </div>

            {/* Quick stats */}
            <div className="flex flex-wrap gap-8 mt-14 pt-8 border-t border-white/10">
              <div>
                <p className="text-3xl font-bold text-white">24/7</p>
                <p className="text-white/60 text-sm mt-1">Available</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-white">30 min</p>
                <p className="text-white/60 text-sm mt-1">Response Time</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-white">100%</p>
                <p className="text-white/60 text-sm mt-1">Satisfaction</p>
              </div>
            </div>
          </div>

          {/* Hero image card (visible on large screens) */}
          <div className="hidden lg:block">
            <div className="relative">
              <div className="absolute -inset-4 bg-accent/20 rounded-3xl blur-2xl" />
              <div className="relative bg-white/10 backdrop-blur-md rounded-3xl p-3 border border-white/20">
                <Image
                  src="/images/mechanic-work.jpg"
                  alt="CarCare mechanic servicing a vehicle"
                  width={600}
                  height={400}
                  className="rounded-2xl object-cover w-full h-[400px]"
                />
                <div className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-sm rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Service Complete</p>
                      <p className="text-xs text-gray-500">Routine maintenance - Bole, Addis Ababa</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
