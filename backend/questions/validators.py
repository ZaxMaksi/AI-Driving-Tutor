from django.core.exceptions import ValidationError
from PIL import Image

MAX_IMAGE_SIZE_MB = 5
ALLOWED_IMAGE_FORMATS = ("JPEG", "JPG", "PNG", "WEBP")


def validate_question_image(image_file):
    """Перевірка розміру та формату зображення за допомогою Pillow."""
    if image_file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024:
        raise ValidationError(
            f"Розмір файлу не повинен перевищувати {MAX_IMAGE_SIZE_MB} МБ."
        )

    try:
        image = Image.open(image_file)
        image_format = image.format.upper() if image.format else ""
        if image_format not in ALLOWED_IMAGE_FORMATS:
            raise ValidationError(
                f"Непідтримуваний формат зображення: '{image_format}'. Дозволені формати: {', '.join(ALLOWED_IMAGE_FORMATS)}."
            )
        # Перевірка цілісності даних зображення
        image.verify()
    except Exception as e:
        if isinstance(e, ValidationError):
            raise
        raise ValidationError("Завантажений файл не є дійсним або пошкоджений.") from e
