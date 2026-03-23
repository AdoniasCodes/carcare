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
    <section className="py-20 sm:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="text-center p-6 bg-primary/5 rounded-2xl"
            >
              <p className="text-2xl sm:text-3xl font-bold text-primary">
                {stat.value}
              </p>
              <p className="text-gray-600 text-sm mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-primary mb-4">
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
              className="bg-surface rounded-2xl p-8 relative"
            >
              {/* Quote mark */}
              <div className="text-5xl text-accent/20 font-serif absolute top-4 right-6">
                &ldquo;
              </div>
              <p className="text-gray-700 leading-relaxed mb-6 relative z-10">
                {testimonial.text}
              </p>
              <div className="border-t border-gray-200 pt-4">
                <p className="font-semibold text-gray-900">
                  {testimonial.name}
                </p>
                <p className="text-sm text-gray-500">{testimonial.car}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
