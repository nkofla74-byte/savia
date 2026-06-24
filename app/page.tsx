import { ScrollProgress } from "@/components/ui/ScrollProgress";
import { Hero } from "@/components/home/Hero";
import { ScienceBlock } from "@/components/home/ScienceBlock";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { BrandStory } from "@/components/home/BrandStory";
import { WhatsAppCTA } from "@/components/home/WhatsAppCTA";

export default function HomePage() {
  return (
    <>
      <ScrollProgress />
      <Hero />
      <ScienceBlock />
      <FeaturedProducts />
      <BrandStory />
      <WhatsAppCTA />
    </>
  );
}
