import Image from "next/image";

type SectionImageProps = {
  src?: string;
  alt: string;
  sizes?: string;
  className?: string;
};

export function SectionImage({ src, alt, sizes = "(max-width: 768px) 100vw, 50vw", className }: SectionImageProps) {
  if (!src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`grid place-items-center bg-gradient-to-br from-primary/80 to-primary/40 ${className ?? ""}`}
      >
        <span className="text-xs uppercase tracking-[0.18em] text-bg/70">Foto próximamente</span>
      </div>
    );
  }
  return (
    <div className={`relative overflow-hidden ${className ?? ""}`}>
      <Image src={src} alt={alt} fill sizes={sizes} className="object-cover" />
    </div>
  );
}
