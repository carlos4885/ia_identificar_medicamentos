import os
from pathlib import Path
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

def chunk_pdfs() -> list[Document]:
    # USAMOS 'r' para evitar errores de \U y quitamos las comillas extras
    # Así debe quedar (fíjate en la r antes de la comilla):
    BASE_DIR = Path(__file__).resolve().parent.parent
    archivo_especifico = os.path.join(BASE_DIR, "data", "Ficha_IBUPROFENO (ARGININA)  CINFA 600 mg GRANULADO PARA SOLUCION ORAL EFG , 500 sobres.pdf")
    
    # 1. Verificación manual: ¿Existe el archivo?
    if not os.path.exists(archivo_especifico):
        print(f"❌ ERROR: El archivo no existe en la ruta: {archivo_especifico}")
        return []

    # 2. Cargar el PDF
    print("📖 Cargando y leyendo el PDF...")
    loader = PyPDFLoader(archivo_especifico)
    documents = loader.load()

    if not documents:
        print("⚠️ El PDF se leyó pero no devolvió texto.")
        return []

    # 3. Dividir el texto
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=100,
        add_start_index=True,
    )

    chunks = text_splitter.split_documents(documents)
    print(f"✅ Se han generado {len(chunks)} fragmentos de texto.")
    return chunks
