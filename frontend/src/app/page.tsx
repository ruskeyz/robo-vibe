import Link from "next/link";

import { Button } from "@/components/ui/button";
import SceneCanvas from "@/components/three/scene-canvas";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-secondary/40 px-6 py-16 font-sans text-foreground">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-12 rounded-2xl border border-border/60 bg-background/80 p-10 shadow-xl backdrop-blur">
        <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] md:items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center rounded-full border border-border/60 bg-secondary/60 px-3 py-1 text-xs uppercase tracking-[0.3em] text-secondary-foreground">
              Robo Vibe 2
            </div>
            <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
              Next.js, Tailwind, shadcn/ui, and a ready-to-go Three.js canvas.
            </h1>
            <p className="text-base text-muted-foreground sm:text-lg">
              Start prototyping your immersive interface right away. This
              scaffold bundles modern styling primitives with a live WebGL scene
              so you can focus on building the experience.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button asChild className="h-11 px-6 text-base">
                <Link href="/create" target="_blank" rel="noopener noreferrer">
                  Explore the playground
                </Link>
              </Button>
              {/* <Button variant="outline" asChild className="h-11 px-6 text-base"> */}
              {/*   <Link href="/api/hello">Check API Route</Link> */}
              {/* </Button> */}
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border border-border/60 bg-secondary/60 p-3">
            <SceneCanvas />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-3"></div>
      </main>
    </div>
  );
}
