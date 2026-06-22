import { HeroAnimation } from "@/components/home/HeroAnimation";
import { ScienceBlock } from "@/components/home/ScienceBlock";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { BrandStory } from "@/components/home/BrandStory";
import { WhatsAppCTA } from "@/components/home/WhatsAppCTA";

export default function HomePage() {
  return (
    <>
      <HeroAnimation />
      <ScienceBlock />
      <FeaturedProducts />
      <BrandStory />
      <WhatsAppCTA />
    </>
  );
}
