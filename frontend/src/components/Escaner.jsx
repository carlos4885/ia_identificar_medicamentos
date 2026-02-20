import { useState } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Camera as CameraIcon, Check, X, RefreshCw, Loader2, FileText } from 'lucide-react';
import axios from 'axios';

const Escaner = () => {
  const [imagen, setImagen] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);

  // URL del bridge API
  const API_URL = 'http://localhost:8000';

  const tomarFoto = async () => {
    setError(null);
    setResultado(null);
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
      setError("Error al tomar la foto");
    } finally {
      setCargando(false);
    }
  };

  const analizarMedicamento = async () => {
    if (!imagen) return;
    
    setCargando(true);
    setError(null);

    try {
      const response = await fetch(imagen);
      const blob = await response.blob();
      const formData = new FormData();
      formData.append('file', blob, 'foto.jpg');
      
      // LLAMAR AL BRIDGE (no al proxy)
      const apiResponse = await axios.post(`${API_URL}/api/identificar`, formData);
      
      if (apiResponse.data.error) {
        setError(apiResponse.data.error);
      } else {
        setResultado(apiResponse.data);
      }
    } catch (err) {
      setError("No se pudo conectar con el servidor");
    } finally {
      setCargando(false);
    }
  };

  const verPDF = () => {
    if (resultado?.prospecto_pdf) {
      const nombrePDF = resultado.prospecto_pdf.split('\\').pop().split('/').pop();
      window.open(`${API_URL}/api/pdf/${nombrePDF}`, '_blank');
    }
  };

  const reiniciar = () => {
    setImagen(null);
    setResultado(null);
    setError(null);
  };

  // Animación
  const fadeIn = { animation: 'fadeIn 0.7s ease' };

  return (
    <div style={{ padding: 32, textAlign: 'center' }}>
      <h2 style={{ color: '#2563eb' }}>Identificar Medicina</h2>

      {!imagen && !resultado && (
        <button onClick={tomarFoto} style={{ padding: 40, border: '3px dashed #22d3ee', borderRadius: 32, background: 'none' }}>
          <CameraIcon size={80} color="#22d3ee" />
          <p>TOCAR PARA ESCANEAR</p>
        </button>
      )}

      {imagen && !resultado && !cargando && (
        <div>
          <img src={imagen} style={{ maxWidth: '100%', maxHeight: 300 }} />
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button onClick={reiniciar} style={{ background: '#ef4444', padding: 15, borderRadius: 12 }}>
              <X size={24} color="white" />
            </button>
            <button onClick={analizarMedicamento} style={{ background: '#22c55e', padding: '15px 30px', borderRadius: 12 }}>
              <Check size={24} color="white" /> ANALIZAR
            </button>
          </div>
        </div>
      )}

      {cargando && (
        <div>
          <Loader2 size={64} className="animate-spin" color="#2563eb" />
          <p>Procesando...</p>
        </div>
      )}

      {resultado && (
        <div style={{ border: '2px solid #22c55e', borderRadius: 24, padding: 20 }}>
          <h3>{resultado.nombre}</h3>
          <p>Código: {resultado.codigo_nacional}</p>
          
          {resultado.prospecto_pdf && (
            <button onClick={verPDF} style={{ background: '#3b82f6', color: 'white', padding: 12, borderRadius: 12 }}>
              <FileText /> VER PROSPECTO
            </button>
          )}
          
          <button onClick={reiniciar} style={{ marginTop: 20, background: 'white', border: '2px solid #22c55e', padding: 12 }}>
            <RefreshCw /> ESCANEAR OTRA
          </button>
        </div>
      )}

      {error && (
        <div style={{ color: '#b91c1c', border: '2px solid #ef4444', padding: 20 }}>
          ⚠️ {error}
          <button onClick={reiniciar}>Reintentar</button>
        </div>
      )}
    </div>
  );
};

export default Escaner;