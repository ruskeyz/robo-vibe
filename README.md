# Robo Vibe

Sketch-to-3D prototyping environment that pairs a FastAPI backend with a
Next.js 16 frontend. Users sketch silhouettes in the browser, forward them to
fal.ai's `triposr` model, and receive a hosted `.glb` file plus a QR code that
opens the asset straight from S3.

## Highlights

- End-to-end workflow: draw, capture, upload, and retrieve a 3D model.
- Backend safeguards for missing environment configuration and S3 errors.
- Frontend playground with a configurable sketch canvas and QR preview.
- Three.js scene scaffold for rapid UI experimentation.

## Tech Stack

- **Backend:** FastAPI, fal-client, boto3, python-dotenv, qrcode.
- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS 4, shadcn/ui,
  @react-three/fiber, @react-three/drei.
- **Infrastructure:** AWS S3 for storing generated `.glb` files.

## Project Layout

- `main.py` – FastAPI application exposing `/api/generate` and `/api/demo`.
- `requirements.txt` – Python dependencies for the backend service.
- `frontend/` – Next.js project.
  - `src/app/page.tsx` – Landing page with Three.js hero scene.
  - `src/app/create/page.tsx` – Sketch-to-3D workflow UI.
  - `src/app/api/*` – Frontend proxy routes.
  - `src/components/drawing/drawing-canvas.tsx` – Client-side canvas component.
  - `src/components/three/scene-canvas.tsx` – Reusable spinning cube scene.

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 20+ (Next.js 16 requires an up-to-date runtime)
- AWS account with an S3 bucket configured for hosting generated models
- fal.ai API key with access to `fal-ai/triposr`

### Backend Setup

1. Create and activate a virtual environment (optional but recommended).
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Create a `.env` file next to `main.py` with the following variables:

   | Variable                | Description                                                        |
   | ----------------------- | ------------------------------------------------------------------ |
   | `FAL_KEY`               | API key for fal.ai                                                 |
   | `AWS_ACCESS_KEY_ID`     | IAM access key used to upload to S3                                |
   | `AWS_SECRET_ACCESS_KEY` | IAM secret key                                                     |
   | `AWS_REGION_NAME`       | Region of the target bucket (e.g. `us-east-1`)                     |
   | `S3_BUCKET_NAME`        | Bucket where `.glb` files will be stored                           |
   | `MODEL_S3_KEY`          | (Optional) default key for the demo model, defaults to `model.glb` |

4. Run the API:
   ```bash
   uvicorn main:app --reload
   ```

### Frontend Setup

1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```
2. Create a `.env.local` (or `.env`) file in `frontend/` if you need to point at a
   non-default backend:
   ```
   PYTHON_BACKEND_URL=http://localhost:8000
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
   Visit `http://localhost:3000` to open the playground.

## How It Works

1. Users sketch on `/create` using the drawing canvas.
2. Clicking **Send to /api/generate** posts the captured data-URI to the Next.js
   route `POST /api/generate`.
3. The route converts the base64 payload into multipart form-data and forwards
   it to the Python backend.
4. The backend uploads the image to fal.ai, subscribes to the `triposr` worker,
   downloads the resulting `.glb`, stores it in S3, and generates a QR code that
   encodes the public S3 URL.
5. The frontend surfaces the QR code and public URL, ready for download or
   scanning.

## API Reference (Backend)

### `POST /api/generate`

Accepts a multipart form upload with `sketchImage` (PNG).

- **Response 200**
  ```json
  {
    "publicUrl": "https://bucket.s3.region.amazonaws.com/<uuid>.glb",
    "qrCodeBase64": "data:image/png;base64,..."
  }
  ```
- **Response 400/502/500** include a descriptive `detail` message.

Example request:

```bash
curl -X POST http://localhost:8000/api/generate \
  -F "sketchImage=@example.png"
```

### `GET /api/demo`

Validates that `MODEL_S3_KEY` exists in the configured bucket, produces a
presigned URL valid for one hour, and returns it with a QR code data URI.

## API Reference (Frontend)

### `POST /api/generate`

Proxy endpoint for the backend. Expects `{ "image": "data:image/png;base64,..." }`
and mirrors the backend response. Errors include an `error` string for easier
display in the UI.

- The Google Slides deck with concept designs lives at:<br/>
  `https://docs.google.com/presentation/d/1nS4tW0ttRVGkUmk48ralERJsk3aaOMALA18mLvvxuMw/edit?slide=id.p1#slide=id.p1`
