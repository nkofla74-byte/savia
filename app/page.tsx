export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-5 py-24">
      <h1 className="font-display text-5xl font-bold text-primary">Savia</h1>
      <p className="mt-4 max-w-md font-body text-lg text-ink/80">
        Aceites botánicos con base científica. Fórmulas honestas, hechas en Bogotá.
      </p>
      <div className="mt-8 flex flex-wrap gap-4">
        <span className="rounded-full bg-accent px-4 py-2 text-bg">accent</span>
        <span className="rounded-full bg-surface px-4 py-2 text-ink">surface</span>
        <span className="rounded-full bg-primary px-4 py-2 text-bg">primary</span>
        <span className="text-muted">muted</span>
      </div>
    </main>
  );
}
