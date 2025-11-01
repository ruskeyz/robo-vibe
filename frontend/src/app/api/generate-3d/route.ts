import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const image = body?.image;

    if (typeof image !== "string" || !image.startsWith("data:image/png;base64,")) {
      return NextResponse.json(
        { error: "Expected base64-encoded PNG data in the `image` field." },
        { status: 400 }
      );
    }

    // Placeholder job identifier. Replace with integration to your 3D generation service.
    const jobId = `job_${crypto.randomUUID()}`;

    const base64 = image.split(",")[1] ?? "";
    const receivedBytes = Math.floor((base64.length * 3) / 4);

    return NextResponse.json({
      message: "Sketch received. Generation job queued.",
      jobId,
      receivedBytes,
    });
  } catch (error) {
    console.error("[generate-3d] Failed to parse request:", error);
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }
}
