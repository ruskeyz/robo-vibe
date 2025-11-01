"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DrawingCanvasHandle = {
  toDataURL: () => string | null;
  clear: () => void;
};

type DrawingCanvasProps = {
  className?: string;
  initialColor?: string;
  initialSize?: number;
};

const COLORS = [
  { name: "Sky", value: "#0ea5e9" },
  { name: "Emerald", value: "#10b981" },
  { name: "Amber", value: "#f59e0b" },
  { name: "Fuchsia", value: "#d946ef" },
  { name: "Slate", value: "#475569" },
  { name: "White", value: "#ffffff" },
  { name: "Black", value: "#000000" },
];

const SIZES = [4, 8, 12, 18];

function DrawingCanvasComponent(
  { className, initialColor = COLORS[0].value, initialSize = SIZES[1] }: DrawingCanvasProps,
  ref: React.Ref<DrawingCanvasHandle>
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const [brushColor, setBrushColor] = useState(initialColor);
  const [brushSize, setBrushSize] = useState(initialSize);
  const [bgColor, setBgColor] = useState("#0f172a");

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio ?? 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctxRef.current = ctx;

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, rect.width, rect.height);
  }, [brushColor, brushSize, bgColor]);

  useEffect(() => {
    setupCanvas();
    const handleResize = () => setupCanvas();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setupCanvas]);

  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    ctx.strokeStyle = brushColor;
  }, [brushColor]);

  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    ctx.lineWidth = brushSize;
  }, [brushSize]);

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;

    canvas.setPointerCapture(event.pointerId);
    drawingRef.current = true;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    lastPointRef.current = { x, y };

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = ctxRef.current;
    if (!ctx || !drawingRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const lastPoint = lastPointRef.current;
    if (!lastPoint) {
      ctx.lineTo(x, y);
      ctx.stroke();
      lastPointRef.current = { x, y };
      return;
    }

    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    lastPointRef.current = { x, y };
  };

  const endDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;

    if (event.pointerId) {
      canvas.releasePointerCapture(event.pointerId);
    }
    drawingRef.current = false;
    lastPointRef.current = null;
    ctx.closePath();
  };

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, rect.width, rect.height);
  }, [bgColor]);

  useImperativeHandle(
    ref,
    () => ({
      toDataURL: () => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        return canvas.toDataURL("image/png");
      },
      clear: () => clearCanvas(),
    }),
    [clearCanvas]
  );

  useEffect(() => {
    clearCanvas();
  }, [bgColor, clearCanvas]);

  return (
    <div
      className={cn(
        "flex h-full w-full flex-col gap-4 rounded-xl border border-border/60 bg-card/80 p-4 backdrop-blur",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Brush
          </span>
          <div className="flex items-center gap-1">
            {COLORS.map((color) => (
              <button
                key={color.value}
                type="button"
                className={cn(
                  "size-6 rounded-full border border-border/60 transition-transform hover:scale-105",
                  brushColor === color.value && "ring-2 ring-ring ring-offset-1"
                )}
                style={{ backgroundColor: color.value }}
                onClick={() => setBrushColor(color.value)}
                aria-label={`Select ${color.name} brush color`}
              />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Size
          </span>
          <div className="flex items-center gap-2">
            {SIZES.map((size) => (
              <button
                key={size}
                type="button"
                className={cn(
                  "flex h-7 items-center rounded-full border border-border/60 px-2 text-xs transition-colors hover:bg-secondary/60",
                  brushSize === size && "bg-secondary text-secondary-foreground"
                )}
                onClick={() => setBrushSize(size)}
              >
                {size}px
              </button>
            ))}
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <label
            htmlFor="background-color"
            className="text-xs uppercase tracking-[0.2em] text-muted-foreground"
          >
            Background
          </label>
          <input
            id="background-color"
            type="color"
            value={bgColor}
            onChange={(event) => setBgColor(event.target.value)}
            className="h-8 w-12 cursor-pointer rounded border border-border/60 bg-transparent"
            aria-label="Select background color"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearCanvas}
            className="h-8 px-3 text-xs"
          >
            Clear
          </Button>
        </div>
      </div>
      <div className="relative flex-1">
        <canvas
          ref={canvasRef}
          className="h-full w-full cursor-crosshair rounded-lg bg-background/60 shadow-inner"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrawing}
          onPointerLeave={endDrawing}
          onPointerCancel={endDrawing}
          aria-label="Drawing canvas"
          role="img"
          tabIndex={0}
          style={{ touchAction: "none" }}
        />
      </div>
    </div>
  );
}

const DrawingCanvas = forwardRef<DrawingCanvasHandle, DrawingCanvasProps>(
  DrawingCanvasComponent
);
DrawingCanvas.displayName = "DrawingCanvas";

export { DrawingCanvas };
export type { DrawingCanvasHandle };
