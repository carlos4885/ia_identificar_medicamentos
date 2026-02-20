# backend/bridge_api.py
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import uvicorn
import requests
import os
import re
from pathlib import Path
import shutil

app = FastAPI()

# Configurar CORS para React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===== RUTAS - USAN TUS CARPETAS EXISTENTES =====
BASE_DIR = Path(__file__).parent.parent.absolute()  # Sube un nivel a la raíz
FOTOS_DIR = BASE_DIR / "Fotos"      # Usa tu carpeta Fotos existente
DATA_DIR = BASE_DIR / "data"        # Usa tu carpeta data existente

print("="*60)
print("🚀 BRIDGE API - Usando tus carpetas existentes")
print("="*60)
print(f"📁 Directorio raíz: {BASE_DIR}")
print(f"📸 Tus fotos: {FOTOS_DIR}")
print(f"📚 Tus datos: {DATA_DIR}")
print("="*60)

# ===== TU CÓDIGO DE JUPYTER =====
def ocr_space_ocr(ruta_imagen, idioma="spa"):
    """API gratuita de OCR.space - IGUAL QUE EN TU NOTEBOOK"""
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

@app.post("/api/identificar")
async def identificar_medicamento(file: UploadFile = File(...)):
    """
    ENDPOINT QUE USA TU MISMO CÓDIGO
    """
    try:
        # Guardar imagen en TU carpeta Fotos
        imagen_path = FOTOS_DIR / "foto_actual.jpg"
        with open(imagen_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        print(f"📸 Imagen guardada en: {imagen_path}")
        
        # TU CÓDIGO: OCR.space
        texto = ocr_space_ocr(str(imagen_path), idioma="spa")
        
        # TU CÓDIGO: Extraer código nacional
        patron = r'\d{6}\.\d'
        codigo_nacional = re.search(patron, texto)
        
        if not codigo_nacional:
            return {"error": "No se encontró código nacional"}
        
        codigo_nacional = codigo_nacional.group().split('.')[0]
        print(f"✅ Código: {codigo_nacional}")
        
        # TU CÓDIGO: Consultar AEMPS
        url = f"https://cima.aemps.es/cima/rest/presentacion/{codigo_nacional}"
        respuesta = requests.get(url)
        
        if respuesta.status_code != 200:
            return {"error": "Medicamento no encontrado"}
        
        datos = respuesta.json()
        nombre = datos.get('nombre')
        
        # Buscar URL del prospecto
        url_prospecto = None
        for doc in datos.get('docs', []):
            if doc.get('tipo') == 2:
                url_prospecto = doc.get('url')
                break
        
        # Descargar PDF a TU carpeta data
        pdf_guardado = None
        if url_prospecto:
            nombre_limpio = nombre.split()[0] if nombre else "medicamento"
            pdf_path = DATA_DIR / f"Prospecto_{nombre_limpio}_{codigo_nacional}.pdf"
            
            resp_pdf = requests.get(url_prospecto)
            if resp_pdf.status_code == 200:
                with open(pdf_path, "wb") as f:
                    f.write(resp_pdf.content)
                pdf_guardado = str(pdf_path)
                print(f"✅ PDF guardado en: {pdf_path}")
        
        return {
            "success": True,
            "codigo_nacional": codigo_nacional,
            "nombre": nombre,
            "prospecto_pdf": pdf_guardado,
            "mensaje": "Medicamento identificado"
        }
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return {"error": str(e)}

if __name__ == "__main__":
    print("\n📡 Servidor corriendo en: http://localhost:8000")
    print("🔗 Endpoint POST: http://localhost:8000/api/identificar")
    print("="*60 + "\n")
    uvicorn.run(app, host="0.0.0.0", port=8000)