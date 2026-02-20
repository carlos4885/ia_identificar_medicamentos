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
import time
import json

app = FastAPI()

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===== CONFIGURACIÓN =====
BASE_DIR = Path(__file__).parent.parent.absolute()
FOTOS_DIR = BASE_DIR / "Fotos"
DATA_DIR = BASE_DIR / "data"
CACHE_DIR = BASE_DIR / "cache"

FOTOS_DIR.mkdir(exist_ok=True)
DATA_DIR.mkdir(exist_ok=True)
CACHE_DIR.mkdir(exist_ok=True)

# ===== CACHE DE MEDICAMENTOS =====
CACHE_FILE = CACHE_DIR / "medicamentos_cache.json"

def cargar_cache():
    """Carga el caché de medicamentos"""
    if CACHE_FILE.exists():
        try:
            with open(CACHE_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            return {}
    return {}

def guardar_cache(cache):
    """Guarda el caché de medicamentos"""
    with open(CACHE_FILE, 'w', encoding='utf-8') as f:
        json.dump(cache, f, ensure_ascii=False, indent=2)

# Cargar caché al iniciar
CACHE_MEDICAMENTOS = cargar_cache()
print(f"📚 Caché cargado con {len(CACHE_MEDICAMENTOS)} medicamentos")

def ocr_space_ocr(ruta_imagen, idioma="spa"):
    """OCR.space con múltiples intentos"""
    url = "https://api.ocr.space/parse/image"
    
    configuraciones = [
        {"OCREngine": "2", "scale": True, "detectOrientation": True},
        {"OCREngine": "1", "scale": True, "detectOrientation": True},
        {"OCREngine": "2", "scale": False, "detectOrientation": True},
    ]
    
    for config in configuraciones:
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
                if texto and len(texto) > 20:
                    return texto.strip()
        except:
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
        r'(\d{6})',            # 6 dígitos exactos
        r'(\d{7})',            # 7 dígitos
        r'(\d{8})',            # 8 dígitos
        r'nº\s*(\d{6})',       # nº seguido de 6 dígitos
        r'codigo?\s*(\d{6})',  # código seguido de 6 dígitos
    ]
    
    for patron in patrones:
        match = re.search(patron, texto_limpio, re.IGNORECASE)
        if match:
            return match.group(1)
    
    return None

def extraer_nombre_medicamento(texto):
    """Extrae posibles nombres de medicamentos"""
    if not texto:
        return None
    
    lineas = texto.split('\n')
    
    # Palabras que suelen estar en nombres de medicamentos
    indicadores = [
        'comprimidos', 'capsulas', 'mg', 'g', 'ml', 'solución',
        'inyectable', 'crema', 'pomada', 'colirio', 'jarabe'
    ]
    
    nombres_posibles = []
    
    for linea in lineas:
        linea = linea.strip()
        if len(linea) < 3 or len(linea) > 100:
            continue
        
        # Buscar líneas que podrían ser nombres
        if any(palabra in linea.lower() for palabra in ['®', '™', 'laboratorio', 'pharma']):
            nombres_posibles.append(linea)
        elif any(palabra in linea.lower() for palabra in indicadores):
            nombres_posibles.append(linea)
        elif linea[0].isupper() and len(linea.split()) <= 5:
            nombres_posibles.append(linea)
    
    return nombres_posibles[0] if nombres_posibles else None

def extraer_dosis(texto):
    """Extrae la dosis del medicamento"""
    if not texto:
        return None
    
    patrones_dosis = [
        r'(\d+)\s*mg',
        r'(\d+)\s*g',
        r'(\d+)\s*ml',
        r'(\d+)\s*mcg',
    ]
    
    for patron in patrones_dosis:
        match = re.search(patron, texto, re.IGNORECASE)
        if match:
            return match.group(0)
    
    return None

def extraer_laboratorio(texto):
    """Extrae el laboratorio"""
    if not texto:
        return None
    
    laboratorios_conocidos = [
        'normon', 'cinfa', 'kern', 'teva', 'sandoz', 'mylan',
        'gsk', 'pfizer', 'bayer', 'novartis', 'roche', 'merck',
        'lilly', 'sanofi', 'abbott', 'johnson', 'janssen'
    ]
    
    texto_lower = texto.lower()
    for lab in laboratorios_conocidos:
        if lab in texto_lower:
            return lab.capitalize()
    
    return None

def consultar_aemps(codigo):
    """Consulta la API de AEMPS"""
    try:
        url = f"https://cima.aemps.es/cima/rest/presentacion/{codigo}"
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            return response.json()
    except:
        pass
    
    return None

def buscar_por_nombre_en_cache(nombre_parcial):
    """Busca en el caché por nombre parcial"""
    if not nombre_parcial:
        return None
    
    nombre_lower = nombre_parcial.lower()
    resultados = []
    
    for codigo, info in CACHE_MEDICAMENTOS.items():
        if nombre_lower in info.get('nombre', '').lower():
            resultados.append({
                'codigo': codigo,
                'nombre': info.get('nombre'),
                'confianza': 'alta' if len(nombre_parcial) > 5 else 'media'
            })
    
    return resultados[:5] if resultados else None

@app.post("/api/identificar")
async def identificar_medicamento(file: UploadFile = File(...)):
    """
    Endpoint universal para identificar cualquier medicamento
    """
    try:
        # Guardar imagen
        timestamp = int(time.time())
        imagen_path = FOTOS_DIR / f"foto_{timestamp}.jpg"
        
        with open(imagen_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        print(f"\n📸 Nueva imagen: {imagen_path}")
        
        # 1. Hacer OCR
        print("🔍 Ejecutando OCR...")
        texto_ocr = ocr_space_ocr(str(imagen_path))
        
        if texto_ocr:
            print(f"📝 Texto extraído:\n{texto_ocr[:500]}")
        else:
            print("⚠️ No se pudo extraer texto")
        
        # 2. Extraer información
        codigo = extraer_codigo_nacional(texto_ocr)
        nombre = extraer_nombre_medicamento(texto_ocr)
        dosis = extraer_dosis(texto_ocr)
        laboratorio = extraer_laboratorio(texto_ocr)
        
        resultado = {
            "success": False,
            "texto_ocr": texto_ocr[:200] + "..." if texto_ocr else "",
            "informacion_extraida": {
                "codigo": codigo,
                "nombre": nombre,
                "dosis": dosis,
                "laboratorio": laboratorio
            }
        }
        
        # 3. Si hay código, consultar AEMPS
        if codigo:
            print(f"✅ Código encontrado: {codigo}")
            datos_aemps = consultar_aemps(codigo)
            
            if datos_aemps:
                # Guardar en caché
                CACHE_MEDICAMENTOS[codigo] = {
                    "nombre": datos_aemps.get('nombre'),
                    "presentacion": datos_aemps.get('presentacion'),
                    "laboratorio": datos_aemps.get('laboratorio', {}).get('nombre')
                }
                guardar_cache(CACHE_MEDICAMENTOS)
                
                resultado.update({
                    "success": True,
                    "metodo": "codigo_nacional",
                    "codigo": codigo,
                    "nombre": datos_aemps.get('nombre'),
                    "presentacion": datos_aemps.get('presentacion'),
                    "laboratorio": datos_aemps.get('laboratorio', {}).get('nombre'),
                    "prospecto_url": next((doc['url'] for doc in datos_aemps.get('docs', []) if doc['tipo'] == 2), None)
                })
                return resultado
        
        # 4. Si hay nombre, buscar en caché
        if nombre:
            print(f"🔍 Buscando por nombre: {nombre}")
            sugerencias = buscar_por_nombre_en_cache(nombre)
            if sugerencias:
                resultado.update({
                    "success": False,
                    "metodo": "nombre_parcial",
                    "sugerencias": sugerencias,
                    "mensaje": "¿Es alguno de estos medicamentos?"
                })
                return resultado
        
        # 5. Si no se identificó, devolver lo encontrado
        print("⚠️ No se pudo identificar automáticamente")
        resultado["mensaje"] = "No se pudo identificar automáticamente"
        resultado["consejo"] = "Asegúrate de que la foto muestre claramente el código de barras o el nombre"
        
        return resultado
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return {
            "success": False,
            "error": str(e)
        }

@app.get("/api/medicamento/{codigo}")
async def get_medicamento(codigo: str):
    """Obtener información de un medicamento por código"""
    # Buscar en caché primero
    if codigo in CACHE_MEDICAMENTOS:
        return CACHE_MEDICAMENTOS[codigo]
    
    # Si no está en caché, consultar AEMPS
    datos = consultar_aemps(codigo)
    if datos:
        return datos
    
    raise HTTPException(404, "Medicamento no encontrado")

@app.get("/api/buscar/{termino}")
async def buscar_medicamentos(termino: str):
    """Buscar medicamentos por nombre"""
    resultados = []
    termino_lower = termino.lower()
    
    for codigo, info in CACHE_MEDICAMENTOS.items():
        if termino_lower in info.get('nombre', '').lower():
            resultados.append({
                "codigo": codigo,
                "nombre": info.get('nombre'),
                "laboratorio": info.get('laboratorio')
            })
    
    return {"resultados": resultados[:10]}

@app.get("/api/test")
async def test():
    return {
        "mensaje": "API Universal de Medicamentos",
        "estado": "funcionando",
        "medicamentos_en_cache": len(CACHE_MEDICAMENTOS),
        "endpoints": {
            "POST /api/identificar": "Identificar medicamento desde foto",
            "GET /api/medicamento/{codigo}": "Info por código",
            "GET /api/buscar/{termino}": "Buscar por nombre"
        }
    }

if __name__ == "__main__":
    print("="*60)
    print("🚀 API UNIVERSAL DE MEDICAMENTOS")
    print("="*60)
    print(f"📁 Directorio: {BASE_DIR}")
    print(f"📚 Medicamentos en caché: {len(CACHE_MEDICAMENTOS)}")
    print("\n📡 Endpoints:")
    print("   POST /api/identificar  → Identificar desde foto")
    print("   GET  /api/medicamento/  → Info por código")
    print("   GET  /api/buscar/       → Buscar por nombre")
    print("\n🔗 Servidor: http://localhost:8000")
    print("="*60)
    
    uvicorn.run(app, host="0.0.0.0", port=8000)