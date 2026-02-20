import requests
import re

def ocr_space_ocr(ruta_imagen, idioma="spa"):
    url = "https://api.ocr.space/parse/image"
    
    with open(ruta_imagen, "rb") as archivo:
        respuesta = requests.post(
            url,
            files={"filename": archivo},
            data={
                "apikey": "helloworld",
                "language": idioma,
                "isOverlayRequired": False
            }
        )
    
    if respuesta.status_code == 200:
        resultado = respuesta.json()
        return resultado.get("ParsedResults", [{}])[0].get("ParsedText", "")
    return ""

# Extraer código nacional

texto = ocr_space_ocr(r"fotosFarmacia/medicamento prueba7.jpg")
patron = r'(\d{6})\.?(\d?)'
coincidencia = re.search(patron, texto)

if coincidencia:
    codigo = coincidencia.group(1) + (coincidencia.group(2) if coincidencia.group(2) else "")
    print(f"Código nacional encontrado: {codigo}")
else:
    print("No se encontró el código nacional")