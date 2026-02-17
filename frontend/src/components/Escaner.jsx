import { useState } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Camera as CameraIcon, Check, X, RefreshCw, Loader2 } from 'lucide-react';
import axios from 'axios';

const Escaner = () => {
  const [imagen, setImagen] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);

//Función para abrir la cámara nativa
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

      // Guardar la imagen
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
      
    } finally {
      setCargando(false);
    }
  };

  const reiniciar = () => {
    setImagen(null);
    setResultado(null);
    setError(null);
  };

  // Animación global fadeIn
  if (typeof document !== 'undefined' && !document.getElementById('fadeInKeyframesEscaner')) {
    const style = document.createElement('style');
    style.id = 'fadeInKeyframesEscaner';
    style.innerHTML = `@keyframes fadeIn { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: none; } }`;
    document.head.appendChild(style);
  }
  const fadeIn = { animation: 'fadeIn 0.7s cubic-bezier(.68,-0.55,.27,1.55)' };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 8px 0 8px', background: 'none', ...fadeIn }}>
      <h2 style={{ fontSize: 30, fontWeight: 900, color: '#2563eb', marginBottom: 28, letterSpacing: 0.5, textShadow: '0 2px 12px #2563eb22', ...fadeIn }}>Identificar Medicina</h2>

      {/* ESTADO 1: No hay foto */}
      {!imagen && (
        <button 
          onClick={tomarFoto}
          style={{
            width: 260, height: 260, borderRadius: 32,
            background: 'rgba(34,211,238,0.10)', border: '3.5px dashed #22d3ee',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', boxShadow: '0 4px 24px 0 #22d3ee11',
            transition: 'box-shadow 0.2s, transform 0.2s',
            marginBottom: 18,
            ...fadeIn
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <CameraIcon size={80} color="#22d3ee" />
          <span style={{ fontSize: 22, fontWeight: 800, color: '#22d3ee', marginTop: 12, letterSpacing: 0.5 }}>TOCAR PARA<br/>ESCANEAR</span>
        </button>
      )}

      {/* ESTADO 2: Foto tomada, confirmar envío */}
      {imagen && !resultado && !cargando && (
        <div className="glass" style={{ width: '100%', maxWidth: 420, margin: '0 auto', borderRadius: 24, boxShadow: '0 4px 24px 0 #2563eb11', padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', ...fadeIn }}>
          <img src={imagen} alt="Captura" style={{ width: '100%', maxHeight: 320, objectFit: 'contain', borderRadius: 16, border: '2px solid #22d3ee', marginBottom: 18, transition: 'box-shadow 0.2s' }} />
          <div style={{ display: 'flex', gap: 18, width: '100%', justifyContent: 'center', marginTop: 8 }}>
            <button onClick={reiniciar} style={{ padding: 15, background: '#ef4444', borderRadius: 12, color: 'white', fontWeight: 700, fontSize: 18, minWidth: 56, boxShadow: '0 2px 8px #ef444422', transition: 'background 0.2s, transform 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <X size={28} />
            </button>
            <button 
              onClick={analizarMedicamento}
              style={{ 
                flex: 1, padding: 15, background: 'linear-gradient(90deg,#22c55e 60%,#22d3ee 100%)', borderRadius: 12, color: 'white',
                fontSize: 20, fontWeight: 800, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10,
                boxShadow: '0 2px 12px #22c55e22', border: 'none', minWidth: 120, transition: 'background 0.2s, transform 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <Check size={28} /> ANALIZAR
            </button>
          </div>
        </div>
      )}

      {/* ESTADO 3: Cargando */}
      {cargando && (
        <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', ...fadeIn }}>
          <Loader2 size={64} className="animate-spin" color="#2563eb" style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: 18, fontSize: 22, fontWeight: 700, color: '#64748b' }}>Consultando IA...</p>
        </div>
      )}

      {/* ESTADO 4: Resultado o Error */}
      {resultado && (
        <div className="glass" style={{ background: 'rgba(34,197,94,0.10)', padding: 28, borderRadius: 24, border: '2px solid #22c55e', width: '100%', maxWidth: 420, margin: '0 auto', marginTop: 8, boxShadow: '0 4px 24px 0 #22c55e11', ...fadeIn }}>
          <h3 style={{ fontSize: 28, color: '#14532d', margin: 0, fontWeight: 900 }}>{resultado.nombre}</h3>
          <p style={{ fontSize: 18, color: '#166534', marginTop: 10, fontWeight: 600 }}>{resultado.info}</p>
          <button onClick={reiniciar} style={{ marginTop: 24, width: '100%', padding: 15, background: 'white', border: '2px solid #22c55e', color: '#22c55e', borderRadius: 12, fontSize: 18, fontWeight: 800, boxShadow: '0 2px 8px #22c55e22', transition: 'background 0.2s, transform 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <RefreshCw style={{ display: 'inline', marginRight: 8 }} />
            ESCANEAR OTRA
          </button>
        </div>
      )}

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.10)', padding: 18, borderRadius: 16, color: '#b91c1c', width: '100%', maxWidth: 420, margin: '24px auto 0 auto', fontSize: 18, fontWeight: 700, border: '2px solid #ef4444', boxShadow: '0 2px 8px #ef444422', ...fadeIn }}>
          ⚠️ {error}
          <button onClick={reiniciar} style={{ display: 'block', marginTop: 12, textDecoration: 'underline', fontWeight: 800, color: '#b91c1c', background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
            onMouseLeave={e => e.currentTarget.style.color = '#b91c1c'}
          >Intentar de nuevo</button>
        </div>
      )}
    </div>
  );
};

export default Escaner;
