import Hero from "@/components/landing/hero";
import Services from "@/components/landing/services";
import HowItWorks from "@/components/landing/how-it-works";
import TrustSection from "@/components/landing/trust-section";
import CTASection from "@/components/landing/cta-section";
import Footer from "@/components/landing/footer";

export default function Home() {
  return (
    <main>
      <Hero />
      <Services />
      <HowItWorks />
      <TrustSection />
      <CTASection />
      <Footer />
    </main>
  );
}
