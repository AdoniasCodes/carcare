import Image from "next/image";

const stats = [
  { value: "500+", label: "Cars Serviced" },
  { value: "Same Day", label: "Service Available" },
  { value: "Certified", label: "Mechanics" },
  { value: "Addis Ababa", label: "& Surrounding Areas" },
];

const testimonials = [
  {
    name: "Abebe M.",
    text: "I was stuck on the side of the road near Megenagna. CarCare sent a mechanic in less than an hour. Professional and fair pricing. Highly recommend!",
    car: "Toyota Corolla 2018",
  },
  {
    name: "Sara T.",
    text: "I used to waste half my day at a garage just for an oil change. Now CarCare comes to my office parking lot. Game changer!",
    car: "Suzuki Vitara 2020",
  },
  {
    name: "Daniel K.",
    text: "The mechanic was very knowledgeable and explained everything he was doing. I finally feel like I can trust someone with my car.",
    car: "Hyundai Tucson 2019",
  },
];

export default function TrustSection() {
  return (
    <section className="py-20 sm:py-28 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Stats with background image */}
        <div className="relative rounded-3xl overflow-hidden mb-20">
          <Image
            src="/images/trust-bg.jpg"
            alt="Car service background"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-primary/90" />
          <div className="relative grid grid-cols-2 md:grid-cols-4 gap-6 p-8 sm:p-12">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-white">
                  {stat.value}
                </p>
                <p className="text-white/60 text-sm mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div className="text-center mb-12">
          <span className="text-accent font-semibold text-sm uppercase tracking-wider">Testimonials</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-primary mt-2 mb-4">
            What Our Customers Say
          </h2>
          <p className="text-lg text-gray-600">
            Real experiences from real customers
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-surface rounded-2xl p-8 relative border border-gray-100"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 leading-relaxed mb-6">
                &ldquo;{testimonial.text}&rdquo;
              </p>
              <div className="flex items-center gap-3 border-t border-gray-200 pt-4">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-semibold text-sm">
                    {testimonial.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">
                    {testimonial.name}
                  </p>
                  <p className="text-xs text-gray-500">{testimonial.car}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
