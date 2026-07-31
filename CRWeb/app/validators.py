"""
Validadores personalizados de archivos subidos.

`validar_imagen_jpeg` se usa en fotos que son documentos de verificación de
identidad (foto del vehículo, fotos de licencia del conductor): exige
JPG/JPEG estrictamente, revisando tanto la extensión como los primeros
bytes reales del archivo (su "firma"), para que no baste con renombrar un
.png o .webp a .jpg y colarlo.
"""
from django.core.exceptions import ValidationError
import os

EXTENSIONES_JPEG_VALIDAS = {".jpg", ".jpeg"}

# Firma binaria real de un archivo JPEG: siempre empieza con estos 3 bytes.
FIRMA_JPEG = b"\xFF\xD8\xFF"


def validar_imagen_jpeg(archivo):
    """
    Validador de campo para usar en un ImageField:
        foto = models.ImageField(..., validators=[validar_imagen_jpeg])

    También se puede llamar directamente sobre un UploadedFile en una
    vista (ver app/views.py) antes de asignarlo al modelo.
    """
    nombre = getattr(archivo, "name", "") or ""
    _, extension = os.path.splitext(nombre)
    extension = extension.lower()

    if extension not in EXTENSIONES_JPEG_VALIDAS:
        raise ValidationError(
            f"Formato no permitido ('{extension or 'sin extensión'}'). "
            "Debe ser una imagen JPG o JPEG."
        )

    posicion_original = archivo.file.tell() if hasattr(archivo, "file") else 0
    archivo.seek(0)
    encabezado = archivo.read(3)
    archivo.seek(posicion_original)

    if encabezado != FIRMA_JPEG:
        raise ValidationError(
            "El archivo no es una imagen JPEG válida (el contenido no "
            "coincide con el formato, aunque el nombre diga .jpg/.jpeg)."
        )
