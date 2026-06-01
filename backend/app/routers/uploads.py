import uuid
import io
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from app.core.config import settings
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/uploads", tags=["uploads"])

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_SIGNATURE_TYPES = {"image/png", "image/jpeg"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


async def _get_minio_client():
    """Create aiobotocore S3 client for MinIO."""
    try:
        import aiobotocore.session as aio_session
        session = aio_session.get_session()
        return session.create_client(
            "s3",
            endpoint_url=f"http://{settings.MINIO_ENDPOINT}",
            aws_access_key_id=settings.MINIO_ROOT_USER,
            aws_secret_access_key=settings.MINIO_ROOT_PASSWORD,
            region_name="us-east-1",
        )
    except Exception:
        return None


async def _upload_to_minio(data: bytes, filename: str, content_type: str) -> str:
    """Upload file to MinIO and return public URL."""
    client_ctx = await _get_minio_client()
    if client_ctx is None:
        raise HTTPException(status_code=503, detail="Служба хранилища недоступна")

    async with client_ctx as client:
        # Ensure bucket exists
        try:
            await client.head_bucket(Bucket=settings.MINIO_BUCKET)
        except Exception:
            await client.create_bucket(Bucket=settings.MINIO_BUCKET)

        await client.put_object(
            Bucket=settings.MINIO_BUCKET,
            Key=filename,
            Body=data,
            ContentType=content_type,
        )

    return f"http://{settings.MINIO_ENDPOINT}/{settings.MINIO_BUCKET}/{filename}"


@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """Upload a product or avatar image. Returns { url }."""
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Недопустимый тип файла. Разрешены: {', '.join(ALLOWED_IMAGE_TYPES)}",
        )

    data = await file.read()
    if len(data) > MAX_FILE_SIZE:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="Файл слишком большой (макс. 5 МБ)")

    ext = file.filename.rsplit(".", 1)[-1] if file.filename and "." in file.filename else "jpg"
    filename = f"images/{uuid.uuid4()}.{ext}"

    url = await _upload_to_minio(data, filename, file.content_type)
    return {"url": url}


@router.post("/signature")
async def upload_signature(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """Upload a delivery signature image. Returns { url }."""
    if file.content_type not in ALLOWED_SIGNATURE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Подпись должна быть в формате PNG или JPEG",
        )

    data = await file.read()
    if len(data) > MAX_FILE_SIZE:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="Файл слишком большой (макс. 5 МБ)")

    filename = f"signatures/{uuid.uuid4()}.png"
    url = await _upload_to_minio(data, filename, "image/png")
    return {"url": url}
