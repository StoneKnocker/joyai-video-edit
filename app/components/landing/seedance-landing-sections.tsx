import { SeedanceCTA } from "./seedance-cta";
import { SeedanceFAQ } from "./seedance-faq";
import { SeedanceFeatures } from "./seedance-features";
import { SeedanceGallery } from "./seedance-gallery";
import { SeedancePricing } from "./seedance-pricing";
import { SeedanceSteps } from "./seedance-steps";
import { SeedanceTestimonials } from "./seedance-testimonials";
import { SeedanceUseCases } from "./seedance-use-cases";

export function SeedanceLandingSections() {
  return (
    <div className="w-full bg-background">
      <SeedanceGallery />
      <SeedanceFeatures />
      <SeedanceUseCases />
      <SeedanceSteps />
      <SeedanceTestimonials />
      <SeedancePricing />
      <SeedanceFAQ />
      <SeedanceCTA />
    </div>
  );
}
