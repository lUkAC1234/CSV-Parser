import os
from io import BytesIO
from typing import List, Optional, Tuple
from PIL import Image
from django.core.files.base import ContentFile

class ImageOptimizationMixin:
    class Meta:
        abstract = True

    WEBP_QUALITIES = (95, 85, 75, 65, 55, 40, 30)
    WEBP_FALLBACK_QUALITY = 20

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._orig_file_names = {}
        for f in getattr(self, "_image_field_names", []):
            field_val = getattr(self, f, None)
            try:
                self._orig_file_names[f] = field_val.name if getattr(field_val, "name", None) else None
            except Exception:
                self._orig_file_names[f] = None

    def _base_name(self, field) -> str:
        name = getattr(field, "name", "") or "image"
        return os.path.splitext(os.path.basename(name))[0]

    def _read_bytes_once(self, field) -> Optional[bytes]:
        if not field:
            return None
        try:
            if hasattr(field, "read"):
                field.seek(0)
                data = field.read()
                return data if data else None
            if hasattr(field, "file"):
                field.file.seek(0)
                data = field.file.read()
                return data if data else None
        except Exception:
            return None
        return None

    def _is_webp_name(self, field) -> bool:
        name = getattr(field, "name", "") or ""
        return name.lower().endswith(".webp")

    def _encode_webp_best_fit(self, img: Image.Image, max_kb: int) -> Optional[bytes]:
        buf = BytesIO()
        for q in self.WEBP_QUALITIES:
            buf.seek(0)
            buf.truncate()
            img.save(buf, format="WEBP", quality=q, method=6)
            if buf.tell() / 1024.0 <= max_kb:
                return buf.getvalue()
        buf.seek(0)
        buf.truncate()
        img.save(buf, format="WEBP", quality=self.WEBP_FALLBACK_QUALITY, method=6)
        return buf.getvalue()

    def _make_thumbnail_bytes(self, img: Image.Image, width: int, quality: int = 85) -> Optional[bytes]:
        try:
            if img.height == 0:
                return None
            aspect = img.width / img.height if img.height else 1
            height = max(1, int(width / (aspect if aspect else 1)))
            thumb = img.resize((width, height), Image.Resampling.LANCZOS)
            buf = BytesIO()
            thumb.save(buf, format="WEBP", quality=quality, method=6)
            return buf.getvalue()
        except Exception:
            return None

    def _image_to_pil(self, src_bytes: bytes) -> Optional[Image.Image]:
        try:
            img = Image.open(BytesIO(src_bytes))
            if img.mode not in ("RGB", "RGBA"):
                img = img.convert("RGB")
            return img
        except Exception:
            return None

    def _should_process(self, image_field_name: str) -> bool:
        cur = getattr(self, image_field_name, None)
        cur_name = getattr(cur, "name", None) if cur else None
        orig = self._orig_file_names.get(image_field_name)
        if cur_name and cur_name != orig:
            return True
        if not orig and cur_name:
            return True
        return False

    def _process_pair(self, image_field_name: str, thumb_field_name: Optional[str], max_kb: int, thumb_w: int) -> None:
        img_field = getattr(self, image_field_name, None)
        if not img_field:
            return
        if not self._should_process(image_field_name):
            if thumb_field_name and self._is_webp_name(img_field) and not getattr(self, thumb_field_name, None):
                src = self._read_bytes_once(img_field)
                if src:
                    pil = self._image_to_pil(src)
                    if pil:
                        tb = self._make_thumbnail_bytes(pil, thumb_w, quality=85)
                        if tb:
                            setattr(self, thumb_field_name, ContentFile(tb, name=f"thumb_{self._base_name(img_field)}.webp"))
            return

        src_bytes = self._read_bytes_once(img_field)
        if not src_bytes:
            return

        if self._is_webp_name(img_field):
            if thumb_field_name and not getattr(self, thumb_field_name, None):
                pil = self._image_to_pil(src_bytes)
                if pil:
                    tb = self._make_thumbnail_bytes(pil, thumb_w, quality=85)
                    if tb:
                        setattr(self, thumb_field_name, ContentFile(tb, name=f"thumb_{self._base_name(img_field)}.webp"))
            return

        pil = self._image_to_pil(src_bytes)
        if not pil:
            return

        webp_bytes = self._encode_webp_best_fit(pil, max_kb)
        if webp_bytes:
            webp_name = f"{self._base_name(img_field)}.webp"
            setattr(self, image_field_name, ContentFile(webp_bytes, name=webp_name))
            pil_for_thumb = self._image_to_pil(webp_bytes) or pil
            thumb_bytes = self._make_thumbnail_bytes(pil_for_thumb, thumb_w, quality=85)
            if thumb_bytes and thumb_field_name:
                setattr(self, thumb_field_name, ContentFile(thumb_bytes, name=f"thumb_{self._base_name(img_field)}.webp"))
        else:
            thumb_bytes = self._make_thumbnail_bytes(pil, thumb_w, quality=85)
            if thumb_bytes and thumb_field_name and not getattr(self, thumb_field_name, None):
                setattr(self, thumb_field_name, ContentFile(thumb_bytes, name=f"thumb_{self._base_name(img_field)}.webp"))

    def process_images_config(self, config: List[Tuple[str, Optional[str], int, int]]) -> None:
        for image_field_name, thumb_field_name, max_kb, thumb_w in config:
            try:
                self._process_pair(image_field_name, thumb_field_name, max_kb, thumb_w)
            except Exception:
                continue