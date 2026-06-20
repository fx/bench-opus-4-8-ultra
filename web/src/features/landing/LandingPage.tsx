import { ThemeScope } from "../../components/ThemeScope.tsx";
import { Nav } from "./Nav.tsx";
import { Hero } from "./Hero.tsx";
import { LogoCloud } from "./LogoCloud.tsx";
import { FeatureBento } from "./FeatureBento.tsx";
import { HowItWorks } from "./HowItWorks.tsx";
import { Stats } from "./Stats.tsx";
import { Testimonials } from "./Testimonials.tsx";
import { Pricing } from "./Pricing.tsx";
import { Faq } from "./Faq.tsx";
import { BigCta } from "./BigCta.tsx";
import { Footer } from "./Footer.tsx";

// The marketing landing page: the route shell applies the marketing theme via
// ThemeScope and composes the eleven sections in spec order. Section components
// own their own content and animations.
export function LandingPage() {
  return (
    <ThemeScope theme="marketing" className="min-h-screen bg-background">
      <Nav />
      <main>
        <Hero />
        <LogoCloud />
        <FeatureBento />
        <HowItWorks />
        <Stats />
        <Testimonials />
        <Pricing />
        <Faq />
        <BigCta />
      </main>
      <Footer />
    </ThemeScope>
  );
}
