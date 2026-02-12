import os
from src.file_processor import chunk_pdfs
from src.chroma_db import save_to_chroma_db
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv() # <--- Este paso "activa" el archivo .env
api_key = os.getenv('API_KEY')  

os.environ["GOOGLE_API_KEY"] = api_key # <--- Pon tu API key aquí
genai.configure(api_key=os.environ["GOOGLE_API_KEY"])

# 1. Verificar modelos de embedding y chat disponibles
print("🔍 VERIFICANDO MODELOS DISPONIBLES:")
print("="*50)

modelos_embedding = []
modelos_chat = []

for m in genai.list_models():
    if 'embedContent' in m.supported_generation_methods:
        modelos_embedding.append(m.name)
        print(f"✅ EMBEDDING: {m.name}")
    if 'generateContent' in m.supported_generation_methods:
        modelos_chat.append(m.name)
        print(f"🟢 CHAT: {m.name}")


if modelos_embedding:
    modelo_embedding = modelos_embedding[0] 
    print(f"\n📌 Usando embeddings: {modelo_embedding}")
else:
    print("❌ No hay modelos de embedding disponibles")
    exit()

if modelos_chat:
    modelo_chat = modelos_chat[0]
    print(f"📌 Usando chat: {modelo_chat}")
else:
    print("❌ No hay modelos de chat disponibles")
    exit()


chunks = chunk_pdfs()

embeddings = GoogleGenerativeAIEmbeddings(
    model=modelo_embedding,
    task_type="retrieval_document"
)


llm = ChatGoogleGenerativeAI(
    model=modelo_chat,  
    temperature=0
)

print("\n🚀 Conectando con Google AI Studio...")
db = save_to_chroma_db(chunks, embeddings)

print("\n✅ Chatbot de medicina listo. Escribe 'salir' para terminar.")
print(f"🤖 Modelo activo: {modelo_chat}")

while True:
    query = input("\n💬 Pregunta: ")
    
    if query.lower() in ["salir", "exit", "quit"]:
        print("¡Adiós!")
        break

    # Buscar en el PDF (SOLO EN TU BASE DE DATOS LOCAL)
    docs = db.similarity_search(query, k=5)
    context = "\n---\n".join([doc.page_content for doc in docs])
    
    # 🚨 PROMPT QUE LO AISLA COMPLETAMENTE
    prompt = f"""ERES UN PROGRAMA DE CONSULA LOCAL SIN ACCESO A INTERNET.
    
    ⚠️ RESTRICCIONES ABSOLUTAS:
    1️⃣ NO TIENES CONOCIMIENTO PREVIO - Has sido resetado
    2️⃣ NO TIENES ACCESO A INTERNET - Bloqueado
    3️⃣ NO PUEDES ACCEDER A NINGUNA BASE DE DATOS EXTERNA
    4️⃣ SOLO EXISTE EL TEXTO QUE APARECE ABAJO - NADA MÁS
    
    TEXTO AUTORIZADO (Única fuente de información):
    ================================================
    {context}
    ================================================
    
    INSTRUCCIÓN:
    - LEE SOLO EL TEXTO AUTORIZADO
    - SI LA PREGUNTA NO SE RESPONDE CON ESE TEXTO → Responde EXACTAMENTE: "No lo sé"
    - NO USES NINGÚN OTRO CONOCIMIENTO
    - NO DES EXPLICACIONES
    - NO DIGAS "como modelo de lenguaje"
    - NO MENCIONES INTERNET
    
    Pregunta: {query}
    
    Respuesta:"""

    try:
        response = llm.invoke(prompt)
        print(f"\n🤖: {response.content}")
    except Exception as e:
        print(f"\n❌ Error: {e}")