import { HeroAnimation } from "@/components/home/HeroAnimation";
import { ScienceBlock } from "@/components/home/ScienceBlock";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { BrandStory } from "@/components/home/BrandStory";
import { WhatsAppCTA } from "@/components/home/WhatsAppCTA";
import { ScrollProgress } from "@/components/ui/ScrollProgress";

export default function HomePage() {
  return (
    <>
      <ScrollProgress />
      <HeroAnimation />
      <ScienceBlock />
      <FeaturedProducts />
      <BrandStory />
      <WhatsAppCTA />
    </>
  );
}
