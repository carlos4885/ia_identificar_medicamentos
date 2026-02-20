import { useState, useEffect } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Camera as CameraIcon, Check, X, RefreshCw, Loader2, MessageCircle, Send, FileText, Info } from 'lucide-react';
import axios from 'axios';

const Escaner = () => {
  const [imagen, setImagen] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);
  const [modoPregunta, setModoPregunta] = useState(false);
  const [pregunta, setPregunta] = useState('');
  const [respuesta, setRespuesta] = useState('');
  const [preguntando, setPreguntando] = useState(false);
  const [medicamentoInfo, setMedicamentoInfo] = useState(null);
  const [status, setStatus] = useState(null);

  const API_URL = 'http://localhost:5000';

  // Verificar estado al cargar
  useEffect(() => {
    verificarEstado();
  }, []);

  // Función para verificar el estado de la API
  const verificarEstado = async () => {
    try {
      const response = await axios.get(`${API_URL}/status`);
      setStatus(response.data);
      console.log('✅ API conectada:', response.data);
    } catch (err) {
      console.error('❌ Error conectando a la API:', err);
    }
  };

  // Función para abrir la cámara
  const tomarFoto = async () => {
    setError(null);
    setResultado(null);
    setMedicamentoInfo(null);
    setModoPregunta(false);
    setRespuesta('');
    setPregunta('');
    setCargando(true);
    
    try {
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
      });
      setImagen(photo.webPath);
    } catch (e) {
      setError("No se pudo tomar la foto. Intenta de nuevo.");
    } finally {
      setCargando(false);
    }
  };

  // Función para enviar la foto a tu API Flask
  const analizarMedicamento = async () => {
    if (!imagen) return;
    
    setCargando(true);
    setError(null);
    setResultado(null);

    try {
      // Convertir la imagen URI a Blob
      const response = await fetch(imagen);
      const blob = await response.blob();
      
      // Crear FormData con el campo 'foto' que espera tu API
      const formData = new FormData();
      formData.append('foto', blob, 'medicamento.jpg');
      
      console.log('📤 Enviando imagen a:', `${API_URL}/upload`);
      
      // Enviar a tu API
      const apiResponse = await axios.post(`${API_URL}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000 // 60 segundos para procesos largos
      });
      
      console.log('📥 Respuesta de la API:', apiResponse.data);
      
      if (apiResponse.data.mensaje === "Todo Fino") {
        setResultado({
          success: true,
          mensaje: "✅ Medicamento procesado correctamente"
        });
        
        // Guardar toda la información del medicamento
        setMedicamentoInfo({
          nombre: apiResponse.data.medicamento,
          codigo: apiResponse.data.codigo,
          pdfs: apiResponse.data.pdfs || []
        });

        // Actualizar estado
        verificarEstado();
      } else {
        setError("Error al procesar el medicamento");
      }
    } catch (err) {
      console.error('❌ Error completo:', err);
      if (err.code === 'ECONNABORTED') {
        setError("La operación tomó demasiado tiempo. Intenta de nuevo.");
      } else if (err.response) {
        // Error con respuesta del servidor
        setError(err.response.data.error || "Error del servidor");
      } else if (err.request) {
        setError("No se pudo conectar con el servidor. ¿Está corriendo la API?");
      } else {
        setError("Error al procesar la imagen");
      }
    } finally {
      setCargando(false);
    }
  };

  // Función para hacer preguntas sobre el medicamento
  const hacerPregunta = async () => {
    if (!pregunta.trim()) return;
    
    setPreguntando(true);
    setRespuesta('');
    
    try {
      console.log('❓ Preguntando:', pregunta);
      
      const response = await axios.get(`${API_URL}/pregunta`, {
        params: { pregunta: pregunta },
        timeout: 30000
      });
      
      console.log('💬 Respuesta:', response.data);
      
      if (response.data.respuesta) {
        setRespuesta(response.data.respuesta);
      } else {
        setRespuesta("No se pudo obtener una respuesta");
      }
    } catch (err) {
      console.error('Error en pregunta:', err);
      setError("Error al hacer la pregunta. Intenta de nuevo.");
    } finally {
      setPreguntando(false);
    }
  };

  const reiniciar = () => {
    setImagen(null);
    setResultado(null);
    setMedicamentoInfo(null);
    setError(null);
    setModoPregunta(false);
    setPregunta('');
    setRespuesta('');
  };

  // Formatear nombre de archivo para mostrar
  const getNombreArchivo = (ruta) => {
    if (!ruta) return '';
    return ruta.split('\\').pop().split('/').pop();
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      padding: 20,
      background: 'linear-gradient(135deg, #4158D0 0%, #C850C0 46%, #FFCC70 100%)',
      color: 'white',
      fontFamily: 'Arial, sans-serif'
    }}>
      
      <h1 style={{ 
        fontSize: 36, 
        marginBottom: 20, 
        textAlign: 'center',
        textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
      }}>
        💊 Identificador de Medicamentos
      </h1>

      {/* Indicador de estado de la API */}
      {status && (
        <div style={{
          position: 'absolute',
          top: 20,
          right: 20,
          background: status.sesion_activa ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.2)',
          padding: '8px 15px',
          borderRadius: 20,
          fontSize: 12,
          backdropFilter: 'blur(5px)',
          border: '1px solid rgba(255,255,255,0.3)'
        }}>
          {status.sesion_activa ? '✅ Sesión activa' : '⏳ Esperando medicamento'}
        </div>
      )}

      {/* Estado 1: Sin foto */}
      {!imagen && !resultado && !cargando && (
        <>
          <button 
            onClick={tomarFoto}
            style={{
              width: 260,
              height: 260,
              borderRadius: 130,
              background: 'rgba(255,255,255,0.2)',
              border: '4px solid white',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
              backdropFilter: 'blur(5px)',
              marginBottom: 30
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
            }}
          >
            <CameraIcon size={100} color="white" />
            <span style={{ fontSize: 24, fontWeight: 'bold', marginTop: 10 }}>
              TOMAR FOTO
            </span>
          </button>
          
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            padding: 15,
            borderRadius: 12,
            maxWidth: 300,
            textAlign: 'center',
            fontSize: 14,
            lineHeight: 1.6,
            backdropFilter: 'blur(5px)'
          }}>
            <Info size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />
            Toma una foto del código de barras o del nombre del medicamento
          </div>
        </>
      )}

      {/* Estado 2: Foto tomada */}
      {imagen && !resultado && !cargando && (
        <div style={{ width: '100%', maxWidth: 400 }}>
          <img 
            src={imagen} 
            alt="Foto" 
            style={{ 
              width: '100%', 
              maxHeight: 350, 
              objectFit: 'contain',
              borderRadius: 16,
              border: '3px solid white',
              marginBottom: 20,
              background: 'white'
            }} 
          />
          
          <div style={{ display: 'flex', gap: 15 }}>
            <button 
              onClick={reiniciar}
              style={{
                flex: 1,
                padding: 15,
                background: '#ef4444',
                border: 'none',
                borderRadius: 12,
                color: 'white',
                fontSize: 18,
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <X size={24} /> CANCELAR
            </button>
            
            <button 
              onClick={analizarMedicamento}
              style={{
                flex: 2,
                padding: 15,
                background: '#22c55e',
                border: 'none',
                borderRadius: 12,
                color: 'white',
                fontSize: 20,
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <Check size={24} /> ANALIZAR
            </button>
          </div>
        </div>
      )}

      {/* Estado 3: Cargando */}
      {cargando && (
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={64} className="animate-spin" />
          <p style={{ fontSize: 20, marginTop: 20 }}>
            {resultado ? 'Consultando información...' : 'Analizando imagen...'}
          </p>
          <p style={{ fontSize: 14, opacity: 0.8, marginTop: 10 }}>
            Esto puede tomar unos segundos
          </p>
        </div>
      )}

      {/* Estado 4: Resultado con información del medicamento */}
      {resultado && !modoPregunta && medicamentoInfo && (
        <div style={{
          background: 'rgba(255,255,255,0.95)',
          color: '#333',
          borderRadius: 24,
          padding: 25,
          width: '100%',
          maxWidth: 400,
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)'
        }}>
          <h2 style={{ fontSize: 24, color: '#22c55e', marginBottom: 20, textAlign: 'center' }}>
            ✅ ¡Medicamento identificado!
          </h2>
          
          <div style={{ 
            background: '#f3f4f6', 
            padding: 20, 
            borderRadius: 16, 
            marginBottom: 20 
          }}>
            <p style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>
              {medicamentoInfo.nombre}
            </p>
            <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 15 }}>
              Código: {medicamentoInfo.codigo}
            </p>
            
            {medicamentoInfo.pdfs && medicamentoInfo.pdfs.length > 0 && (
              <div style={{ marginTop: 15 }}>
                <p style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 8 }}>
                  📄 PDFs descargados:
                </p>
                {medicamentoInfo.pdfs.map((pdf, index) => (
                  <div key={index} style={{
                    fontSize: 12,
                    color: '#4b5563',
                    background: 'white',
                    padding: '8px 12px',
                    borderRadius: 8,
                    marginBottom: 5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}>
                    <FileText size={14} color="#3b82f6" />
                    {getNombreArchivo(pdf)}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <button
            onClick={() => setModoPregunta(true)}
            style={{
              width: '100%',
              padding: 15,
              background: '#8b5cf6',
              border: 'none',
              borderRadius: 12,
              color: 'white',
              fontSize: 18,
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginBottom: 10,
              cursor: 'pointer',
              transition: 'transform 0.2s',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <MessageCircle size={20} /> HACER PREGUNTAS
          </button>
          
          <button
            onClick={reiniciar}
            style={{
              width: '100%',
              padding: 15,
              background: 'white',
              border: '2px solid #22c55e',
              borderRadius: 12,
              color: '#22c55e',
              fontSize: 18,
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <RefreshCw size={20} /> ESCANEAR OTRO
          </button>
        </div>
      )}

      {/* Estado 5: Modo preguntas */}
      {modoPregunta && (
        <div style={{
          background: 'rgba(255,255,255,0.95)',
          color: '#333',
          borderRadius: 24,
          padding: 25,
          width: '100%',
          maxWidth: 400,
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ fontSize: 24, color: '#8b5cf6', marginBottom: 15, textAlign: 'center' }}>
            ❓ Pregunta sobre el medicamento
          </h2>
          
          {medicamentoInfo && (
            <div style={{
              background: '#f3f4f6',
              padding: '12px 15px',
              borderRadius: 12,
              marginBottom: 20,
              fontSize: 14,
              textAlign: 'center'
            }}>
              <strong>{medicamentoInfo.nombre}</strong>
            </div>
          )}
          
          <textarea
            value={pregunta}
            onChange={(e) => setPregunta(e.target.value)}
            placeholder="Ej: ¿Para qué sirve? ¿Cada cuánto tomarlo? ¿Contraindicaciones?"
            style={{
              width: '100%',
              padding: 12,
              borderRadius: 12,
              border: '2px solid #8b5cf6',
              fontSize: 16,
              minHeight: 100,
              marginBottom: 15,
              fontFamily: 'inherit',
              resize: 'vertical'
            }}
          />
          
          <button
            onClick={hacerPregunta}
            disabled={preguntando || !pregunta.trim()}
            style={{
              width: '100%',
              padding: 15,
              background: '#8b5cf6',
              border: 'none',
              borderRadius: 12,
              color: 'white',
              fontSize: 18,
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginBottom: 20,
              opacity: (!pregunta.trim() || preguntando) ? 0.5 : 1,
              cursor: (!pregunta.trim() || preguntando) ? 'not-allowed' : 'pointer',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={e => !preguntando && pregunta.trim() && (e.currentTarget.style.transform = 'scale(1.02)')}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            {preguntando ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Send size={20} />
            )}
            {preguntando ? 'PENSANDO...' : 'PREGUNTAR'}
          </button>
          
          {respuesta && (
            <div style={{
              background: '#f3f4f6',
              padding: 20,
              borderRadius: 16,
              marginBottom: 20,
              border: '2px solid #8b5cf6'
            }}>
              <p style={{ fontSize: 16, lineHeight: 1.6, marginBottom: 10 }}>
                <strong>Respuesta:</strong>
              </p>
              <p style={{ fontSize: 15, lineHeight: 1.6 }}>{respuesta}</p>
            </div>
          )}
          
          <button
            onClick={() => setModoPregunta(false)}
            style={{
              width: '100%',
              padding: 12,
              background: '#6b7280',
              border: 'none',
              borderRadius: 12,
              color: 'white',
              fontSize: 16,
              cursor: 'pointer',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            VOLVER AL MEDICAMENTO
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          background: '#fee2e2',
          color: '#b91c1c',
          borderRadius: 16,
          padding: 20,
          width: '100%',
          maxWidth: 400
        }}>
          <p style={{ fontSize: 16, marginBottom: 15, textAlign: 'center' }}>
            ⚠️ {error}
          </p>
          <button
            onClick={reiniciar}
            style={{
              width: '100%',
              padding: 12,
              background: '#b91c1c',
              border: 'none',
              borderRadius: 12,
              color: 'white',
              fontSize: 16,
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            INTENTAR DE NUEVO
          </button>
        </div>
      )}
    </div>
  );
};

export default Escaner;