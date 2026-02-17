import re
from dotenv import load_dotenv
from flask import Flask, request, jsonify
import requests
import os

load_dotenv()
CHATPDF_API_KEY = os.getenv('CHATPDF_API_KEY')

app = Flask(__name__)

UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)


def ocr_space_ocr(ruta_imagen, idioma="spa"):
    """API gratuita de OCR.space - 500 peticiones/mes gratis"""
    url = "https://api.ocr.space/parse/image"
    
    with open(ruta_imagen, "rb") as archivo:
        respuesta = requests.post(
            url,
            files={"filename": archivo},
            data={
                "apikey": "helloworld",  # API key gratuita para pruebas
                "language": idioma,       # spa para español
                "isOverlayRequired": False
            }
        )
    if respuesta.status_code == 200:
        resultado = respuesta.json()
        return resultado.get("ParsedResults", [{}])[0].get("ParsedText", "")

def sacar_codigo_nacional(texto):
    patron = '\d{6}\.\d'
    codigo_nacional = re.search(patron, texto) 
    codigo_nacional = codigo_nacional.group() #aqui basicamente con .group() extraemos el texto que coincide con el patrón encontrado por re.search() 
    codigo_nacional = codigo_nacional.split('.')[0] #Quitamos el punto, ya que la API no lo reconoce con el punto
    print(f"Código nacional encontrado: {codigo_nacional}")
    return codigo_nacional

def request_cima(codigo_nacional):
    url = f"https://cima.aemps.es/cima/rest/presentacion/{codigo_nacional}"
    respuesta = requests.get(url)
    if respuesta.status_code == 200:
        datos = respuesta.json()
        nombre_medicamento = datos.get('nombre') 
        nombre_medicamento = nombre_medicamento.split()[0] # Solo cojo la primera palabra, porque si no, el nombre del medicamento es muy largo y no se puede guardar con ese nombre
        print(f"Nombre: {nombre_medicamento}")
        for doc in datos['docs']:
            if doc['tipo'] == 1:
                try:
                    url_ficha_tecnica = doc['url']
                    respuesta = requests.get(url_ficha_tecnica)
                    nombre_ficha_tecnica = os.path.join(UPLOAD_FOLDER, f"Ficha_{nombre_medicamento}.pdf")
                    with open(nombre_ficha_tecnica, "wb") as archivo:
                        archivo.write(respuesta.content)
                except Exception as e:
                    print(f"Ocurrió un error a la hora de guardar la url del PDF: {e}")
            elif doc['tipo'] == 2:
                try:
                    url_prospecto= doc['url']
                    respuesta2 = requests.get(url_prospecto)
                    nombre_prospecto = os.path.join(UPLOAD_FOLDER, f"Prospecto_{nombre_medicamento}.pdf")
                    with open(nombre_prospecto, "wb") as archivo:
                        archivo.write(respuesta2.content)
                except Exception as e:
                    print(f"Ocurrió un error a la hora de guardar la url del PDF: {e}")
        SOURCE_IDS = subir_a_chatpdf([f"Ficha_{nombre_medicamento}.pdf", f"Prospecto_{nombre_medicamento}.pdf"])
        return {
            "nombre": nombre_medicamento,
            "ficha_tecnica": url_ficha_tecnica,
            "prospecto": url_prospecto,
            "source_ids": SOURCE_IDS
        }
    else:
        print(f"Error: No se encontró el medicamento (Status: {respuesta.status_code})")

def subir_a_chatpdf(rutas_archivos):
    """Sube múltiples archivos y devuelve una lista de sourceIds"""
    if isinstance(rutas_archivos, str):
        rutas_archivos = [rutas_archivos]
    
    url = "https://api.chatpdf.com/v1/sources/add-file"
    headers = {"x-api-key": CHATPDF_API_KEY}
    
    source_ids = []
    
    for ruta in rutas_archivos:
        nombre_archivo = os.path.basename(ruta)
        print(f"Subiendo: {nombre_archivo}")
        
        with open(ruta, "rb") as f:
            files = [("file", (nombre_archivo, f, "application/pdf"))]
            response = requests.post(url, headers=headers, files=files)
        
        if response.status_code == 200:
            source_id = response.json().get("sourceId")
            source_ids.append(source_id)
            print(f"✓ {nombre_archivo} subido exitosamente")
        else:
            print(f"✗ Error al subir {nombre_archivo}: {response.text}")
    
    return source_ids

def preguntar_a_pdfs(source_ids, pregunta):
    """Envía una pregunta sobre múltiples PDFs"""
    if not source_ids:
        return "No hay PDFs cargados para consultar"
    
    url = "https://api.chatpdf.com/v1/chats/message"
    headers = {
        "x-api-key": CHATPDF_API_KEY,
        "Content-Type": "application/json"
    }
    
    # Usar el primer sourceId y hacer referencia a todos en la pregunta
    data = {
        "sourceId": source_ids[0],
        "messages": [
            {
                "role": "user",
                "content": f"Tengo {len(source_ids)} documentos PDF. Usando TODOS los documentos cargados, responde: {pregunta}"
            }
        ]
    }
    
    response = requests.post(url, headers=headers, json=data)
    
    if response.status_code == 200:
        return response.json().get("content")
    else:
        print(f"Error en pregunta: {response.text}")
        return "Error al obtener respuesta de ChatPDF"

@app.route('/upload', methods=['POST'])
def upload_image():
    if 'foto' not in request.files:
        return jsonify({"error": "No se envió ninguna imagen"}), 400
    
    archivo = request.files['foto']
    if archivo.filename == '':
        return jsonify({"error": "Nombre de archivo vacío"}), 400

    ruta_destino = os.path.join(UPLOAD_FOLDER, archivo.filename)
    archivo.save(ruta_destino)

    texto_extraido = ocr_space_ocr(ruta_destino)

    codigo_nacional = sacar_codigo_nacional(texto_extraido)

    request_cima(codigo_nacional)
    
    return jsonify({
        "mensaje": "Todo Fino"
    }), 200


@app.route('/pregunta', methods=['GET'])
def hacer_pregunta():
    pregunta = request.args.get('pregunta')
    respuesta = preguntar_a_pdfs(SOURCE_IDS, pregunta)
    return jsonify({
        "pregunta": pregunta,
        "respuesta": respuesta
    }), 200


if __name__ == '__main__':
    app.run(debug=True)