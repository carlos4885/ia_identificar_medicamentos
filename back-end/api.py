import re
from dotenv import load_dotenv
from flask import Flask, request, jsonify, session
import requests
import os

load_dotenv()
CHATPDF_API_KEY = os.getenv('CHATPDF_API_KEY')


app = Flask(__name__)
app.secret_key = 'tu_clave_secreta_aqui'  # Necesario para usar sesiones

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
        return {
            "nombre": nombre_medicamento,
            "ficha_tecnica": url_ficha_tecnica,
            "prospecto": url_prospecto
        }
    else:
        print(f"Error: No se encontró el medicamento (Status: {respuesta.status_code})")

def subir_a_chatpdf(ruta_pdf):
    url = "https://api.chatpdf.com/v1/sources/add-file"
    headers = {"x-api-key": CHATPDF_API_KEY}
    
    nombre_archivo = os.path.basename(ruta_pdf)
    
    with open(ruta_pdf, "rb") as f:
        files = [("file", (nombre_archivo, f, "application/pdf"))]
        response = requests.post(url, headers=headers, files=files)
    
    if response.status_code == 200:
        source_id = response.json().get("sourceId")
        print(f"✅ Archivo subido: {nombre_archivo}")
        return source_id
    else:
        print(f"❌ Error: {response.text}")
        return None

def preguntar_a_pdf(source_id, pregunta):
    """Envía una pregunta sobre un PDF específico"""
    url = "https://api.chatpdf.com/v1/chats/message"
    headers = {
        "x-api-key": CHATPDF_API_KEY,  # Agregado: header faltante
        "Content-Type": "application/json"
    }
    data = {
        "sourceId": source_id,
        "messages": [
            {
                "role": "user",
                "content": f"Responde únicamente usando el PDF: {pregunta}"
            }
        ]
    }
    
    response = requests.post(url, headers=headers, json=data)  # Modificado: usar json=data en lugar de data
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
    
    nombre = request_cima(codigo_nacional)
    ruta = f'uploads/Ficha_{nombre["nombre"]}.pdf'
    print(f"Rutas obtenidas: {ruta}")
    source_id = subir_a_chatpdf(ruta)
    session['source_id'] = source_id  # Guardar el sourceId en la sesión para usarlo en la pregunta
    return jsonify({
        "mensaje": "Todo Fino"
    }), 200

@app.route('/pregunta', methods=['GET'])
def hacer_pregunta():
    # 1. PRIMERO validar source_id
    source_id = session.get('source_id')
    if not source_id:
        return jsonify({
            "error": "No hay ningún PDF cargado. Primero usa /upload con una imagen"
        }), 400
    
    # 2. SEGUNDO validar pregunta
    pregunta = request.args.get('pregunta')
    if not pregunta:
        return jsonify({
            "error": "No se proporcionó una pregunta. Usa ?pregunta=tu_pregunta"
        }), 400
    
    # 3. AHORA SÍ hacer la pregunta
    respuesta = preguntar_a_pdf(source_id, pregunta)
    
    return jsonify({
        "pregunta": pregunta,
        "respuesta": respuesta
    }), 200

if __name__ == '__main__':
    app.run(debug=True)