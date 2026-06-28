import { ScrollProgress } from "@/components/ui/ScrollProgress";
import { Hero } from "@/components/home/Hero";
import { ScienceBlock } from "@/components/home/ScienceBlock";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { HorizontalGallery } from "@/components/home/HorizontalGallery";
import { BrandStory } from "@/components/home/BrandStory";
import { ParallaxBand } from "@/components/home/ParallaxBand";
import { WhatsAppCTA } from "@/components/home/WhatsAppCTA";

export default function HomePage() {
  return (
    <>
      <ScrollProgress />
      <Hero />
      <ScienceBlock />
      <FeaturedProducts />
      <HorizontalGallery />
      <BrandStory />
      <ParallaxBand />
      <WhatsAppCTA />
    </>
  );
}
