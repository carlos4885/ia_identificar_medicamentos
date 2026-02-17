import { useState } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Camera as CameraIcon, Check, X, RefreshCw, Loader2 } from 'lucide-react';
import axios from 'axios';

const Escaner = () => {
  const [imagen, setImagen] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);

  // 1. Función para abrir la cámara nativa
  const tomarFoto = async () => {
    setError(null);
    setResultado(null);
    
    try {
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera, // Abre la cámara directamente
        saveToGallery: false
      });

      // Guardamos la imagen para mostrarla (blob url)
      setImagen(photo.webPath);
    } catch (e) {
      console.log("El usuario canceló o hubo error", e);
    }
  };

  // 2. Función para enviar al Backend (Python)
  const analizarMedicamento = async () => {
    if (!imagen) return;
    
    setCargando(true);
    setError(null);

    try {
      // Convertir la imagen URI a Blob para enviarla
      const response = await fetch(imagen);
      const blob = await response.blob();
      
      const formData = new FormData();
      formData.append('file', blob, 'foto.jpg');

      // Llamada al Proxy que configuramos en vite.config.js
      // Esto irá a http://127.0.0.1:8000/api/identificar
      const apiResponse = await axios.post('/api/identificar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setResultado(apiResponse.data); // Guardamos la info del medicamento
    } catch (err) {
      console.error(err);
      // fallback para pruebas si el back no está corriendo aún
      setError("No pudimos conectar con el servidor. ¿Está encendido?");
      
      // SIMULACIÓN (Borrar esto cuando tu Python funcione bien):
      /*
      setTimeout(() => {
        setResultado({
            nombre: "Paracetamol 500mg",
            info: "Tomar cada 8 horas para el dolor.",
            confianza: 0.95
        });
        setError(null);
      }, 2000);
      */
    } finally {
      setCargando(false);
    }
  };

  const reiniciar = () => {
    setImagen(null);
    setResultado(null);
    setError(null);
  };

  return (
    <div className="p-4 flex flex-col items-center" style={{ minHeight: '80vh' }}>
      <h2 className="text-2xl font-bold mb-6 text-blue-800">Identificar Medicina</h2>

      {/* ESTADO 1: No hay foto */}
      {!imagen && (
        <button 
          onClick={tomarFoto}
          style={{
            width: '280px', height: '280px', borderRadius: '20px',
            background: '#e0f2fe', border: '4px dashed #0284c7',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <CameraIcon size={80} color="#0284c7" />
          <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#0284c7', marginTop: '10px' }}>
            TOCAR PARA<br/>ESCANEAR
          </span>
        </button>
      )}

      {/* ESTADO 2: Foto tomada, confirmar envío */}
      {imagen && !resultado && !cargando && (
        <div className="flex flex-col items-center w-full">
          <img src={imagen} alt="Captura" style={{ width: '100%', maxHeight: '400px', objectFit: 'contain', borderRadius: '12px', border: '2px solid #333' }} />
          
          <div className="flex gap-4 mt-6 w-full justify-center">
            <button onClick={reiniciar} style={{ padding: '15px', background: '#ef4444', borderRadius: '12px', color: 'white' }}>
              <X size={32} />
            </button>
            <button 
              onClick={analizarMedicamento}
              style={{ 
                flex: 1, padding: '15px', background: '#22c55e', borderRadius: '12px', color: 'white',
                fontSize: '20px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px'
              }}
            >
              <Check size={32} /> ANALIZAR
            </button>
          </div>
        </div>
      )}

      {/* ESTADO 3: Cargando */}
      {cargando && (
        <div className="mt-10 flex flex-col items-center">
          <Loader2 size={64} className="animate-spin text-blue-600" />
          <p className="mt-4 text-xl font-bold text-gray-600">Consultando IA...</p>
        </div>
      )}

      {/* ESTADO 4: Resultado o Error */}
      {resultado && (
        <div style={{ background: '#dcfce7', padding: '20px', borderRadius: '16px', border: '2px solid #22c55e', width: '100%' }}>
          <h3 style={{ fontSize: '28px', color: '#14532d', margin: 0 }}>{resultado.nombre}</h3>
          <p style={{ fontSize: '18px', color: '#166534', marginTop: '10px' }}>{resultado.info}</p>
          
          <button onClick={reiniciar} style={{ marginTop: '20px', width: '100%', padding: '15px', background: 'white', border: '2px solid #22c55e', color: '#22c55e', borderRadius: '10px', fontSize: '18px', fontWeight: 'bold' }}>
            <RefreshCw style={{ display: 'inline', marginRight: '8px' }} />
            ESCANEAR OTRA
          </button>
        </div>
      )}

      {error && (
        <div style={{ background: '#fee2e2', padding: '15px', borderRadius: '12px', color: '#b91c1c', width: '100%', marginTop: '20px', fontSize: '18px' }}>
          ⚠️ {error}
          <button onClick={reiniciar} className="block mt-2 underline font-bold">Intentar de nuevo</button>
        </div>
      )}
    </div>
  );
};

export default Escaner;
