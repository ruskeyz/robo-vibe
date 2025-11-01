import base64
import io
import logging
import os
import tempfile
import uuid

import boto3
import fal_client
import requests
from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import qrcode


load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

FAL_KEY = os.getenv("FAL_KEY")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION_NAME = os.getenv("AWS_REGION_NAME")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")

missing_env = [
    key
    for key in [
        "FAL_KEY",
        "AWS_ACCESS_KEY_ID",
        "AWS_SECRET_ACCESS_KEY",
        "AWS_REGION_NAME",
        "S3_BUCKET_NAME",
    ]
    if not globals()[key]
]

if missing_env:
    raise RuntimeError(
        f"Missing required environment variables: {', '.join(missing_env)}"
    )

s3_client = boto3.client(
    "s3",
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name=AWS_REGION_NAME,
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _save_temp_image(image_bytes: bytes) -> str:
    """Persist uploaded image to a temporary file and return its path."""
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".png")
    temp_file.write(image_bytes)
    temp_file.close()
    return temp_file.name


@app.post("/api/generate")
async def generate(sketchImage: UploadFile = File(...)):
    try:
        image_bytes = await sketchImage.read()

        if not image_bytes:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        temp_image_path = _save_temp_image(image_bytes)

        try:
            fal_image_url = fal_client.upload_file(temp_image_path)

            result = fal_client.subscribe(
                "fal-ai/triposr",
                arguments={"image_url": fal_image_url, "output_format": "glb"},
            )

            model_mesh = result.get("model_mesh")
            if not model_mesh or "url" not in model_mesh:
                logger.error("Unexpected response format: %s", result)
                raise HTTPException(
                    status_code=502,
                    detail="Failed to generate 3D model from sketch.",
                )

            model_url = model_mesh["url"]
            response = requests.get(model_url, timeout=120)
            response.raise_for_status()

            unique_filename = f"{uuid.uuid4()}.glb"

            s3_client.put_object(
                Bucket=S3_BUCKET_NAME,
                Key=unique_filename,
                Body=response.content,
                ACL="public-read",
                ContentType="model/gltf-binary",
            )

            public_s3_url = (
                f"https://{S3_BUCKET_NAME}.s3.{AWS_REGION_NAME}.amazonaws.com/"
                f"{unique_filename}"
            )

            qr = qrcode.QRCode(box_size=10, border=4)
            qr.add_data(public_s3_url)
            qr.make(fit=True)
            qr_image = qr.make_image(fill_color="black", back_color="white")

            qr_buffer = io.BytesIO()
            qr_image.save(qr_buffer, format="PNG")
            qr_buffer.seek(0)

            qr_code_base64 = base64.b64encode(qr_buffer.read()).decode("utf-8")
            qr_code_data_uri = f"data:image/png;base64,{qr_code_base64}"

            return {"publicUrl": public_s3_url, "qrCodeBase64": qr_code_data_uri}
        finally:
            try:
                os.remove(temp_image_path)
            except OSError as removal_error:
                logger.warning("Failed to remove temp file: %s", removal_error)
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Error generating 3D model: %s", exc)
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while processing the sketch.",
        ) from exc
