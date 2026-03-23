const steps = [
  {
    number: "1",
    title: "Book Online or Call",
    description:
      "Fill out our simple booking form or give us a call. Tell us about your car and what you need.",
  },
  {
    number: "2",
    title: "We Come to You",
    description:
      "Our certified mechanic arrives at your location — home, office, or roadside. No need to go anywhere.",
  },
  {
    number: "3",
    title: "Problem Solved",
    description:
      "We fix your car on the spot. Pay when the job is done. Simple, fast, and hassle-free.",
  },
];

export default function HowItWorks() {
  return (
    <section className="py-20 sm:py-28 bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-primary mb-4">
            How It Works
          </h2>
          <p className="text-lg text-gray-600">
            Getting your car serviced has never been this easy
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <div key={index} className="relative text-center">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-accent to-accent/20" />
              )}

              <div className="relative z-10 w-20 h-20 bg-accent text-white rounded-2xl flex items-center justify-center text-3xl font-bold mx-auto mb-6 shadow-lg shadow-accent/20">
                {step.number}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {step.title}
              </h3>
              <p className="text-gray-600 leading-relaxed max-w-sm mx-auto">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
