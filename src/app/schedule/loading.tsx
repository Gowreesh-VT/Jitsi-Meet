import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="schedule-retro relative min-h-screen">
      <div className="stars-container" />
      <div className="neon-grid" />
      <div className="synth-sun" />
      <div className="scanline-overlay" />

      <main className="main-shell relative z-10">
        <section className="hero mb-16 pt-12">
          <Skeleton className="h-10 w-64 mx-auto mb-4 bg-white/10" />
          <div className="hero-rule mb-6" />
          <Skeleton className="h-6 w-96 mx-auto bg-white/5" />
        </section>

        <div className="space-y-24">
          {[1, 2].map((section) => (
            <section key={section} className="event-section">
              <div className="mb-10 text-left border-l-4 border-white/20 pl-6">
                <Skeleton className="h-8 w-48 mb-2 bg-white/10" />
                <Skeleton className="h-4 w-64 bg-white/5" />
              </div>

              <div className="event-grid">
                {[1, 2, 3].map((card) => (
                  <div key={card} className="event-card opacity-50">
                    <div className="event-card__content space-y-4">
                      <div className="flex gap-2">
                         <Skeleton className="h-6 w-20 bg-white/10" />
                         <Skeleton className="h-6 w-16 bg-white/10" />
                      </div>
                      <Skeleton className="h-8 w-full bg-white/10" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32 bg-white/5" />
                        <Skeleton className="h-4 w-40 bg-white/5" />
                      </div>
                    </div>
                    <div className="mt-6">
                      <Skeleton className="h-12 w-full bg-white/10" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
