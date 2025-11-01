"use client";

import { useRef, useState } from "react";
import Link from "next/link";

import {
  DrawingCanvas,
  type DrawingCanvasHandle,
} from "@/components/drawing/drawing-canvas";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function CreatePage() {
  const canvasRef = useRef<DrawingCanvasHandle>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleCapture = () => {
    const dataUrl = canvasRef.current?.toDataURL();
    if (!dataUrl) {
      setStatusMessage("Nothing to capture yet. Try drawing first.");
      return;
    }
    setPreview(dataUrl);
    setStatusMessage("Screenshot captured. Ready to send.");
  };

  const handleSend = async () => {
    const dataUrl = canvasRef.current?.toDataURL();
    if (!dataUrl) {
      setStatusMessage("Create a drawing and capture it before sending.");
      return;
    }

    setIsSending(true);
    setStatusMessage("Uploading sketch to /api/generate-3d …");
    try {
      const response = await fetch("http://localhost:8000/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: dataUrl }),
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        throw new Error(errorPayload?.error ?? response.statusText);
      }

      const payload = await response.json();
      setStatusMessage(
        typeof payload?.message === "string"
          ? payload.message
          : "Sketch sent successfully. Check job status in the console.",
      );
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? `Upload failed: ${error.message}`
          : "Upload failed. Try again.",
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-secondary/40 text-foreground">
      <header className="border-b border-border/60 bg-background/90 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              Create 3D Concept
            </h1>
            <p className="text-sm text-muted-foreground">
              Sketch a silhouette, capture it, and send it to the generator
              pipeline.
            </p>
          </div>
          <Button asChild variant="ghost" className="h-9 px-4">
            <Link href="/">Back Home</Link>
          </Button>
        </div>
      </header>
      <main className="flex flex-1 flex-col">
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8 lg:flex-row">
          <section className="flex w-full flex-1 flex-col gap-4 lg:max-w-[58%]">
            <div className="rounded-2xl border border-border/60 bg-background/80 p-6 shadow-lg backdrop-blur">
              <h2 className="text-base font-semibold leading-tight">
                Sketch workspace
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Use any brush and background combination. Capture sends the
                current canvas into the preview, while Send uploads the same
                image to the generation API.
              </p>
              <div className="mt-6 h-[520px]">
                <DrawingCanvas ref={canvasRef} className="h-full" />
              </div>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <Button
                  type="button"
                  onClick={handleCapture}
                  className="h-11 flex-1"
                >
                  Make Screenshot
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleSend}
                  disabled={isSending}
                  className={cn("h-11 flex-1", isSending && "animate-pulse")}
                >
                  {isSending ? "Sending…" : "Send to /api/generate-3d"}
                </Button>
              </div>
              {statusMessage ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  {statusMessage}
                </p>
              ) : null}
            </div>
          </section>
          <section className="flex w-full flex-1 flex-col gap-4 lg:max-w-[42%]">
            <div className="flex h-full flex-col gap-4 rounded-2xl border border-border/60 bg-card/80 p-6 shadow-lg backdrop-blur">
              <div>
                <h2 className="text-base font-semibold leading-tight">
                  Screenshot preview & status
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  The latest captured frame appears below. This is exactly what
                  will be submitted to the generator endpoint.
                </p>
              </div>
              <div className="relative flex flex-1 items-center justify-center rounded-xl border border-border/60 bg-secondary/40 p-4">
                {preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={preview}
                    alt="Captured canvas preview"
                    className="max-h-full w-full rounded-lg border border-border/60 object-contain shadow-md"
                  />
                ) : (
                  <div className="flex flex-col items-center text-center text-sm text-muted-foreground">
                    <span className="text-lg font-medium">
                      No screenshot yet
                    </span>
                    <span className="mt-1">
                      Tap &ldquo;Make Screenshot&rdquo; once you are happy with
                      the sketch.
                    </span>
                  </div>
                )}
              </div>
              <div className="rounded-xl border border-dashed border-border/60 bg-background/80 p-4 text-sm text-muted-foreground">
                <p className="font-semibold text-foreground">Workflow tips</p>
                <ul className="mt-2 space-y-2">
                  <li>
                    Keep silhouettes bold and high-contrast; the generator
                    performs best with clean edges.
                  </li>
                  <li>
                    Use the color picker to test lighting variations. Background
                    color is preserved in the upload.
                  </li>
                  <li>
                    Looking for the API contract? Inspect{" "}
                    <code className="rounded bg-secondary/60 px-1 py-0.5 text-xs text-secondary-foreground">
                      src/app/api/generate/route.ts
                    </code>
                    .
                  </li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
