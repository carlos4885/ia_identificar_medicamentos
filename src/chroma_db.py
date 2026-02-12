import os
import shutil
from langchain_community.vectorstores import Chroma
from langchain_core.documents import Document

CHROMA_PATH = 'chroma'

def save_to_chroma_db(chunks: list[Document], embedding_model) -> Chroma:
    # Remove the existing Chroma database
    if os.path.exists(CHROMA_PATH):
        try:
            shutil.rmtree(CHROMA_PATH)
        except Exception as e:
            print(f"Error removing Chroma database: {e}")

    # Initialize the Chroma database
    db = Chroma.from_documents(
        chunks,
        persist_directory=CHROMA_PATH,
        embedding=embedding_model
    )
    # Persist the database
    print(f"Saved chunks to {CHROMA_PATH}")
    
    # ✅ IMPORTANTE: DEVOLVER la base de datos
    return db  # ← Cambiar "return" por "return db"