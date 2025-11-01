import { Buffer } from "node:buffer";
import { NextResponse } from "next/server";

const DEFAULT_BACKEND_URL =
  process.env.PYTHON_BACKEND_URL ??
  process.env.BACKEND_URL ??
  "http://localhost:8000";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const image = body?.image;

    if (
      typeof image !== "string" ||
      !image.startsWith("data:image/png;base64,")
    ) {
      return NextResponse.json(
        { error: "Expected base64-encoded PNG data in the `image` field." },
        { status: 400 },
      );
    }

    const base64 = image.split(",")[1];
    if (!base64) {
      return NextResponse.json(
        { error: "Invalid base64 payload." },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(base64, "base64");

    const formData = new FormData();
    formData.append(
      "sketchImage",
      new File([buffer], "sketch.png", { type: "image/png" }),
    );

    const backendResponse = await fetch(
      `${DEFAULT_BACKEND_URL.replace(/\/$/, "")}/api/generate`,
      {
        method: "POST",
        body: formData,
      },
    );

    const responseText = await backendResponse.text();
    let payload: unknown;

    if (responseText) {
      try {
        payload = JSON.parse(responseText);
      } catch {
        payload = responseText;
      }
    }

    if (!backendResponse.ok) {
      const errorMessage =
        typeof payload === "object" &&
        payload !== null &&
        "detail" in payload &&
        typeof (payload as { detail?: unknown }).detail === "string"
          ? (payload as { detail: string }).detail
          : backendResponse.statusText || "Backend request failed.";

      return NextResponse.json(
        { error: errorMessage },
        { status: backendResponse.status },
      );
    }

    return NextResponse.json(payload ?? {}, {
      status: backendResponse.status,
    });
  } catch (error) {
    console.error("[api/generate] Failed to forward request:", error);
    return NextResponse.json(
      { error: "Failed to forward request to the backend." },
      { status: 502 },
    );
  }
}
