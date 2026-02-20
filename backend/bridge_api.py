# backend/bridge_api.py
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
import uvicorn
import requests
import os
import re
from pathlib import Path
import shutil
import time
import json
from datetime import datetime
from typing import Optional

app = FastAPI()

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especifica tu dominio
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===== CONFIGURACIÓN DE CARPETAS =====
BASE_DIR = Path(__file__).parent.parent.absolute()
FOTOS_DIR = BASE_DIR / "Fotos"
PROSPECTOS_DIR = BASE_DIR / "prospectos"
DATA_DIR = BASE_DIR / "data"
CACHE_DIR = BASE_DIR / "cache"

# Crear carpetas si no existen
FOTOS_DIR.mkdir(exist_ok=True)
PROSPECTOS_DIR.mkdir(exist_ok=True)
DATA_DIR.mkdir(exist_ok=True)
CACHE_DIR.mkdir(exist_ok=True)

print("="*70)
print("🚀 BACKEND MEDSCAN IA - CON DESCARGA DE PROSPECTOS")
print("="*70)
print(f"📁 Directorio base: {BASE_DIR}")
print(f"📸 Fotos temporales: {FOTOS_DIR}")
print(f"📑 Prospectos guardados: {PROSPECTOS_DIR}")
print("="*70)

# ===== CACHE DE MEDICAMENTOS =====
CACHE_FILE = CACHE_DIR / "medicamentos_cache.json"

def cargar_cache():
    """Carga el caché de medicamentos"""
    if CACHE_FILE.exists():
        try:
            with open(CACHE_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error cargando caché: {e}")
            return {}
    return {}

def guardar_cache(cache):
    """Guarda el caché de medicamentos"""
    try:
        with open(CACHE_FILE, 'w', encoding='utf-8') as f:
            json.dump(cache, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"Error guardando caché: {e}")

# Cargar caché al iniciar
CACHE_MEDICAMENTOS = cargar_cache()
print(f"📚 Caché cargado con {len(CACHE_MEDICAMENTOS)} medicamentos")

# ===== FUNCIONES OCR =====
def ocr_space_ocr(ruta_imagen, idioma="spa"):
    """OCR.space con múltiples intentos"""
    url = "https://api.ocr.space/parse/image"
    
    configuraciones = [
        {"OCREngine": "2", "scale": True, "detectOrientation": True},
        {"OCREngine": "1", "scale": True, "detectOrientation": True},
        {"OCREngine": "2", "scale": False, "detectOrientation": True},
    ]
    
    for i, config in enumerate(configuraciones):
        try:
            with open(ruta_imagen, "rb") as archivo:
                respuesta = requests.post(
                    url,
                    files={"filename": archivo},
                    data={
                        "apikey": "helloworld",
                        "language": idioma,
                        "isOverlayRequired": False,
                        **config
                    },
                    timeout=30
                )
            
            if respuesta.status_code == 200:
                resultado = respuesta.json()
                texto = resultado.get("ParsedResults", [{}])[0].get("ParsedText", "")
                if texto and len(texto) > 10:
                    print(f"✅ OCR intento {i+1} exitoso")
                    return texto.strip()
        except Exception as e:
            print(f"⚠️ OCR intento {i+1} falló: {e}")
            continue
    
    return ""

def extraer_codigo_nacional(texto):
    """Extrae código nacional en cualquier formato"""
    if not texto:
        return None
    
    # Limpiar texto
    texto_limpio = texto.replace(' ', '').replace('\n', '').replace('\r', '')
    
    # Patrones de códigos españoles
    patrones = [
        r'(\d{6})\.\d',        # 6 dígitos + punto + dígito
        r'nº\s*(\d{6})',       # nº seguido de 6 dígitos
        r'codigo?\s*(\d{6})',  # código seguido de 6 dígitos
        r'(\d{6})',            # 6 dígitos exactos
        r'(\d{7})',            # 7 dígitos
        r'(\d{8})',            # 8 dígitos
    ]
    
    for patron in patrones:
        match = re.search(patron, texto_limpio, re.IGNORECASE)
        if match:
            codigo = match.group(1)
            # Validar que sea un código razonable
            if len(codigo) >= 6 and len(codigo) <= 8:
                return codigo
    
    return None

def extraer_nombre_medicamento(texto):
    """Extrae posibles nombres de medicamentos"""
    if not texto:
        return None
    
    lineas = texto.split('\n')
    
    # Palabras que suelen estar en nombres de medicamentos
    indicadores = [
        'comprimidos', 'capsulas', 'mg', 'g', 'ml', 'solución',
        'inyectable', 'crema', 'pomada', 'colirio', 'jarabe',
        'efg', 'recubiertos', 'oral', 'tópica'
    ]
    
    for linea in lineas:
        linea = linea.strip()
        if len(linea) < 3 or len(linea) > 100:
            continue
        
        # Buscar líneas que podrían ser nombres
        if any(palabra in linea.lower() for palabra in ['®', '™', 'laboratorio', 'pharma']):
            return linea
        elif any(palabra in linea.lower() for palabra in indicadores):
            # Devolver la línea anterior si existe
            idx = lineas.index(linea)
            if idx > 0 and len(lineas[idx-1].strip()) > 3:
                return lineas[idx-1].strip()
            return linea
    
    return None

# ===== FUNCIONES DE DESCARGA DE PROSPECTO =====
def descargar_prospecto(codigo, nombre_medicamento=None):
    """
    Descarga el prospecto del medicamento desde AEMPS
    """
    try:
        print(f"📥 Intentando descargar prospecto para código: {codigo}")
        
        # Consultar AEMPS para obtener URLs
        url = f"https://cima.aemps.es/cima/rest/presentacion/{codigo}"
        response = requests.get(url, timeout=10)
        
        if response.status_code != 200:
            print(f"⚠️ No se pudo consultar AEMPS para {codigo}")
            return None
        
        datos = response.json()
        
        # Si no tenemos nombre, usar el de AEMPS
        if not nombre_medicamento:
            nombre_medicamento = datos.get('nombre', 'Desconocido')
        
        # Buscar URL del prospecto (tipo = 2)
        url_prospecto = None
        for doc in datos.get('docs', []):
            if doc.get('tipo') == 2:  # 2 = prospecto
                url_prospecto = doc.get('url')
                break
        
        if not url_prospecto:
            print(f"⚠️ No se encontró URL de prospecto para {codigo}")
            return None
        
        print(f"🔗 URL del prospecto encontrada")
        
        # Descargar el PDF
        respuesta_pdf = requests.get(url_prospecto, timeout=30)
        
        if respuesta_pdf.status_code != 200:
            print(f"⚠️ Error al descargar PDF: {respuesta_pdf.status_code}")
            return None
        
        # Generar nombre seguro para el archivo
        nombre_limpio = re.sub(r'[^\w\s-]', '', nombre_medicamento)[:40]
        fecha = datetime.now().strftime("%Y%m%d")
        nombre_archivo = f"Prospecto_{nombre_limpio}_{codigo}_{fecha}.pdf"
        ruta_pdf = PROSPECTOS_DIR / nombre_archivo
        
        # Guardar el PDF
        with open(ruta_pdf, "wb") as f:
            f.write(respuesta_pdf.content)
        
        tamaño = ruta_pdf.stat().st_size / 1024
        print(f"✅ Prospecto guardado: {nombre_archivo} ({tamaño:.1f} KB)")
        
        return {
            "nombre": nombre_archivo,
            "ruta": str(ruta_pdf),
            "tamaño": f"{tamaño:.1f} KB",
            "url_original": url_prospecto,
            "fecha_descarga": fecha
        }
        
    except Exception as e:
        print(f"❌ Error descargando prospecto: {e}")
        return None

# ===== ENDPOINTS PRINCIPALES =====

@app.get("/")
async def root():
    return {
        "mensaje": "BACKEND MEDSCAN IA",
        "version": "2.0",
        "estado": "funcionando",
        "endpoints": {
            "POST /api/identificar": "Identificar medicamento desde foto",
            "GET /api/medicamento/{codigo}": "Obtener información por código",
            "GET /api/prospecto/{codigo}": "Obtener información del prospecto",
            "GET /api/prospecto/archivo/{nombre}": "Descargar archivo PDF",
            "GET /api/prospectos": "Listar todos los prospectos descargados",
            "GET /api/test": "Endpoint de prueba"
        }
    }

@app.post("/api/identificar")
async def identificar_medicamento(file: UploadFile = File(...)):
    """
    Endpoint principal para identificar medicamentos desde foto
    """
    try:
        # Guardar imagen
        timestamp = int(time.time())
        imagen_path = FOTOS_DIR / f"foto_{timestamp}.jpg"
        
        with open(imagen_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        print(f"\n📸 Nueva imagen recibida: {imagen_path}")
        
        # Hacer OCR
        print("🔍 Ejecutando OCR...")
        texto_ocr = ocr_space_ocr(str(imagen_path))
        
        if texto_ocr:
            print(f"📝 Texto extraído:\n{texto_ocr[:300]}...")
        else:
            print("⚠️ No se pudo extraer texto de la imagen")
        
        # Extraer código nacional
        codigo = extraer_codigo_nacional(texto_ocr)
        
        resultado = {
            "success": False,
            "texto_ocr": texto_ocr[:200] + "..." if texto_ocr else "",
        }
        
        # Si hay código, buscar información
        if codigo:
            print(f"✅ Código encontrado: {codigo}")
            
            # Verificar si ya está en caché
            if codigo in CACHE_MEDICAMENTOS:
                info_cache = CACHE_MEDICAMENTOS[codigo]
                resultado.update({
                    "success": True,
                    "metodo": "cache",
                    "codigo_nacional": codigo,
                    "nombre": info_cache.get('nombre'),
                    "presentacion": info_cache.get('presentacion'),
                    "laboratorio": info_cache.get('laboratorio'),
                    "prospecto": info_cache.get('prospecto')
                })
                print(f"✅ Información obtenida de caché")
                return resultado
            
            # Consultar AEMPS
            try:
                url = f"https://cima.aemps.es/cima/rest/presentacion/{codigo}"
                response = requests.get(url, timeout=10)
                
                if response.status_code == 200:
                    datos = response.json()
                    nombre_medicamento = datos.get('nombre', 'Desconocido')
                    
                    # Intentar descargar prospecto automáticamente
                    prospecto = descargar_prospecto(codigo, nombre_medicamento)
                    
                    # Guardar en caché
                    info_medicamento = {
                        "nombre": nombre_medicamento,
                        "presentacion": datos.get('presentacion'),
                        "laboratorio": datos.get('laboratorio', {}).get('nombre'),
                        "prospecto": prospecto,
                        "fecha_consulta": datetime.now().isoformat()
                    }
                    
                    CACHE_MEDICAMENTOS[codigo] = info_medicamento
                    guardar_cache(CACHE_MEDICAMENTOS)
                    
                    resultado.update({
                        "success": True,
                        "metodo": "aemps",
                        "codigo_nacional": codigo,
                        "nombre": nombre_medicamento,
                        "presentacion": datos.get('presentacion'),
                        "laboratorio": datos.get('laboratorio', {}).get('nombre'),
                        "prospecto": prospecto
                    })
                    
                    print(f"✅ Medicamento identificado: {nombre_medicamento}")
                    return resultado
                    
            except Exception as e:
                print(f"⚠️ Error consultando AEMPS: {e}")
        
        # Si no se identificó
        resultado["mensaje"] = "No se pudo identificar automáticamente"
        resultado["consejo"] = "Asegúrate de que la foto muestre claramente el código de barras"
        
        return resultado
        
    except Exception as e:
        print(f"❌ Error en identificar: {e}")
        return {
            "success": False,
            "error": str(e)
        }

@app.get("/api/medicamento/{codigo}")
async def get_medicamento(codigo: str):
    """
    Obtiene información de un medicamento por código
    """
    # Buscar en caché primero
    if codigo in CACHE_MEDICAMENTOS:
        return CACHE_MEDICAMENTOS[codigo]
    
    # Consultar AEMPS
    try:
        url = f"https://cima.aemps.es/cima/rest/presentacion/{codigo}"
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            datos = response.json()
            
            # Intentar descargar prospecto
            prospecto = descargar_prospecto(codigo, datos.get('nombre'))
            
            info = {
                "nombre": datos.get('nombre'),
                "presentacion": datos.get('presentacion'),
                "laboratorio": datos.get('laboratorio', {}).get('nombre'),
                "prospecto": prospecto
            }
            
            # Guardar en caché
            CACHE_MEDICAMENTOS[codigo] = info
            guardar_cache(CACHE_MEDICAMENTOS)
            
            return info
        
        raise HTTPException(404, "Medicamento no encontrado")
        
    except Exception as e:
        raise HTTPException(500, str(e))

@app.get("/api/prospecto/{codigo}")
async def get_prospecto_info(codigo: str):
    """
    Obtiene información del prospecto de un medicamento
    """
    # Buscar en caché
    if codigo in CACHE_MEDICAMENTOS:
        info = CACHE_MEDICAMENTOS[codigo]
        if info.get('prospecto'):
            return info['prospecto']
    
    # Si no está en caché, intentar descargar
    try:
        url = f"https://cima.aemps.es/cima/rest/presentacion/{codigo}"
        response = requests.get(url, timeout=10)
        
        if response.status_code != 200:
            raise HTTPException(404, "Medicamento no encontrado")
        
        datos = response.json()
        prospecto = descargar_prospecto(codigo, datos.get('nombre'))
        
        if not prospecto:
            raise HTTPException(404, "No se encontró prospecto para este medicamento")
        
        return prospecto
        
    except Exception as e:
        raise HTTPException(500, str(e))

@app.get("/api/prospecto/archivo/{nombre_archivo}")
async def get_prospecto_file(nombre_archivo: str):
    """
    Sirve el archivo PDF del prospecto para descargar o visualizar
    """
    ruta_pdf = PROSPECTOS_DIR / nombre_archivo
    
    if not ruta_pdf.exists():
        raise HTTPException(404, "Archivo no encontrado")
    
    return FileResponse(
        path=ruta_pdf,
        filename=nombre_archivo,
        media_type='application/pdf',
        headers={
            "Content-Disposition": f"attachment; filename={nombre_archivo}"
        }
    )

@app.get("/api/prospectos")
async def listar_prospectos():
    """
    Lista todos los prospectos descargados
    """
    prospectos = []
    for pdf in PROSPECTOS_DIR.glob("*.pdf"):
        stats = pdf.stat()
        prospectos.append({
            "nombre": pdf.name,
            "tamaño": f"{stats.st_size / 1024:.1f} KB",
            "fecha": datetime.fromtimestamp(stats.st_mtime).strftime("%Y-%m-%d %H:%M"),
            "ruta": str(pdf)
        })
    
    prospectos.sort(key=lambda x: x['fecha'], reverse=True)
    
    return {
        "total": len(prospectos),
        "prospectos": prospectos
    }

@app.get("/api/test")
async def test():
    """
    Endpoint de prueba para verificar conexión
    """
    return {
        "mensaje": "Backend funcionando correctamente",
        "timestamp": datetime.now().isoformat(),
        "estado": "ok",
        "carpetas": {
            "fotos": str(FOTOS_DIR),
            "prospectos": str(PROSPECTOS_DIR),
            "cache": str(CACHE_DIR)
        },
        "stats": {
            "medicamentos_cache": len(CACHE_MEDICAMENTOS),
            "prospectos_descargados": len(list(PROSPECTOS_DIR.glob("*.pdf")))
        }
    }

@app.get("/api/debug/{codigo}")
async def debug_prospecto(codigo: str):
    """
    Endpoint de depuración para ver el proceso de descarga
    """
    resultados = []
    
    # Paso 1: Consultar AEMPS
    try:
        url = f"https://cima.aemps.es/cima/rest/presentacion/{codigo}"
        response = requests.get(url, timeout=10)
        resultados.append({
            "paso": "Consulta AEMPS",
            "status": response.status_code,
            "ok": response.status_code == 200
        })
        
        if response.status_code == 200:
            datos = response.json()
            resultados.append({
                "paso": "Datos obtenidos",
                "nombre": datos.get('nombre'),
                "docs_disponibles": len(datos.get('docs', []))
            })
            
            # Buscar prospecto
            for doc in datos.get('docs', []):
                if doc.get('tipo') == 2:
                    resultados.append({
                        "paso": "URL prospecto encontrada",
                        "url": doc.get('url')
                    })
                    break
    except Exception as e:
        resultados.append({
            "paso": "Error",
            "error": str(e)
        })
    
    return {
        "codigo": codigo,
        "resultados": resultados
    }

if __name__ == "__main__":
    print("\n" + "="*70)
    print("🚀 BACKEND INICIADO CORRECTAMENTE")
    print("="*70)
    print("📡 Servidor: http://localhost:8000")
    print("🔗 Endpoints disponibles:")
    print("   POST /api/identificar")
    print("   GET  /api/medicamento/{codigo}")
    print("   GET  /api/prospecto/{codigo}")
    print("   GET  /api/prospecto/archivo/{nombre}")
    print("   GET  /api/prospectos")
    print("   GET  /api/test")
    print("="*70)
    print("📁 Carpeta de prospectos:", PROSPECTOS_DIR)
    print("📚 Medicamentos en caché:", len(CACHE_MEDICAMENTOS))
    print("="*70 + "\n")
    
    uvicorn.run(app, host="0.0.0.0", port=8000)