import { useState } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Camera as CameraIcon, Check, X, RefreshCw, Loader2, FileText, HelpCircle } from 'lucide-react';
import axios from 'axios';

const Escaner = () => {
  const [imagen, setImagen] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);
  const [sugerencias, setSugerencias] = useState([]);
  const [modoAyuda, setModoAyuda] = useState(false);

  const API_URL = 'http://localhost:8000';

  // Función para abrir la cámara
  const tomarFoto = async () => {
    setError(null);
    setResultado(null);
    setSugerencias([]);
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

  // Función para analizar
  const analizarMedicamento = async () => {
    if (!imagen) return;
    
    setCargando(true);
    setError(null);
    setResultado(null);
    setSugerencias([]);

    try {
      const response = await fetch(imagen);
      const blob = await response.blob();
      const formData = new FormData();
      formData.append('file', blob, 'foto.jpg');
      
      const apiResponse = await axios.post(`${API_URL}/api/identificar`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000
      });
      
      console.log('Respuesta:', apiResponse.data);
      
      if (apiResponse.data.success) {
        setResultado(apiResponse.data);
      } else {
        if (apiResponse.data.sugerencias?.length > 0) {
          setSugerencias(apiResponse.data.sugerencias);
        }
        setError(apiResponse.data.mensaje || "No se pudo identificar el medicamento");
      }
    } catch (err) {
      setError("Error de conexión. ¿El servidor está encendido?");
    } finally {
      setCargando(false);
    }
  };

  // Probar con una sugerencia
  const probarSugerencia = async (codigo, nombre) => {
    setCargando(true);
    try {
      const response = await axios.get(`${API_URL}/api/medicamento/${codigo}`);
      setResultado({
        success: true,
        nombre: nombre || response.data.nombre,
        codigo_nacional: codigo,
        presentacion: "Información de referencia",
        fuente: "Base de datos local"
      });
      setSugerencias([]);
      setError(null);
    } catch (error) {
      setError("Error al carrar la sugerencia");
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
    setSugerencias([]);
    setModoAyuda(false);
  };

  // Texto de ayuda
  const ayudaTexto = `
    📸 CONSEJOS PARA LA FOTO:
    
    1️⃣ Enfoca bien el código de barras o el nombre
    2️⃣ Buena iluminación
    3️⃣ Sujeta el móvil firme
    4️⃣ Si no funciona, prueba con otra parte del envase
  `;

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      padding: 20,
      backgroundColor: '#f0f9ff',
      fontFamily: 'Arial, sans-serif'
    }}>
      
      <h1 style={{ 
        fontSize: 32, 
        color: '#0369a1',
        marginBottom: 20,
        textAlign: 'center'
      }}>
        💊 MedScan IA
      </h1>

      {/* Botón de ayuda */}
      {!imagen && !cargando && !resultado && (
        <button
          onClick={() => setModoAyuda(!modoAyuda)}
          style={{
            background: 'none',
            border: 'none',
            color: '#0284c7',
            fontSize: 16,
            marginBottom: 20,
            textDecoration: 'underline',
            cursor: 'pointer'
          }}
        >
          {modoAyuda ? 'Ocultar ayuda' : '¿Cómo hacer la foto?'}
        </button>
      )}

      {/* Panel de ayuda */}
      {modoAyuda && (
        <div style={{
          backgroundColor: 'white',
          padding: 20,
          borderRadius: 16,
          marginBottom: 20,
          border: '2px solid #0284c7',
          whiteSpace: 'pre-line',
          fontSize: 16,
          lineHeight: 1.6
        }}>
          {ayudaTexto}
        </div>
      )}

      {/* Estado 1: Sin foto */}
      {!imagen && !resultado && !cargando && (
        <button 
          onClick={tomarFoto}
          style={{
            width: 280,
            height: 280,
            borderRadius: 140,
            backgroundColor: '#0284c7',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 10px 25px rgba(2, 132, 199, 0.4)',
            marginBottom: 30
          }}
        >
          <CameraIcon size={100} color="white" />
          <span style={{ fontSize: 24, fontWeight: 'bold', color: 'white', marginTop: 10 }}>
            TOCAR PARA
          </span>
          <span style={{ fontSize: 28, fontWeight: 'bold', color: 'white' }}>
            ESCANEAR
          </span>
        </button>
      )}

      {/* Estado 2: Foto tomada */}
      {imagen && !resultado && !cargando && sugerencias.length === 0 && (
        <div style={{ width: '100%', maxWidth: 400 }}>
          <img 
            src={imagen} 
            alt="Foto" 
            style={{ 
              width: '100%', 
              maxHeight: 400, 
              objectFit: 'contain',
              borderRadius: 16,
              border: '3px solid #0284c7',
              marginBottom: 20
            }} 
          />
          
          <div style={{ display: 'flex', gap: 15 }}>
            <button 
              onClick={reiniciar}
              style={{
                flex: 1,
                padding: 15,
                backgroundColor: '#ef4444',
                border: 'none',
                borderRadius: 12,
                color: 'white',
                fontSize: 18,
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8
              }}
            >
              <X size={24} /> CANCELAR
            </button>
            
            <button 
              onClick={analizarMedicamento}
              style={{
                flex: 2,
                padding: 15,
                backgroundColor: '#22c55e',
                border: 'none',
                borderRadius: 12,
                color: 'white',
                fontSize: 20,
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8
              }}
            >
              <Check size={24} /> ANALIZAR
            </button>
          </div>
        </div>
      )}

      {/* Estado 3: Cargando */}
      {cargando && (
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={64} className="animate-spin" color="#0284c7" />
          <p style={{ fontSize: 20, marginTop: 20 }}>
            {resultado ? 'Consultando información...' : 'Analizando imagen...'}
          </p>
        </div>
      )}

      {/* Estado 4: Sugerencias */}
      {sugerencias.length > 0 && (
        <div style={{ width: '100%', maxWidth: 400 }}>
          <h3 style={{ color: '#b45309', marginBottom: 15 }}>
            ¿Quizás es alguno de estos?
          </h3>
          
          {sugerencias.map((sug, index) => (
            <button
              key={index}
              onClick={() => probarSugerencia(sug.codigo, sug.nombre)}
              style={{
                width: '100%',
                padding: 15,
                marginBottom: 10,
                backgroundColor: 'white',
                border: '2px solid #0284c7',
                borderRadius: 12,
                fontSize: 16,
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <strong>{sug.nombre}</strong>
              <br />
              <small>Código: {sug.codigo}</small>
            </button>
          ))}
          
          <button
            onClick={reiniciar}
            style={{
              width: '100%',
              padding: 15,
              marginTop: 10,
              backgroundColor: '#6b7280',
              border: 'none',
              borderRadius: 12,
              color: 'white',
              fontSize: 16
            }}
          >
            VOLVER A INTENTAR
          </button>
        </div>
      )}

      {/* Estado 5: Resultado */}
      {resultado && (
        <div style={{
          width: '100%',
          maxWidth: 400,
          backgroundColor: 'white',
          borderRadius: 24,
          padding: 25,
          border: '3px solid #22c55e',
          boxShadow: '0 10px 25px rgba(34, 197, 94, 0.2)'
        }}>
          <h2 style={{ fontSize: 24, color: '#166534', marginBottom: 15 }}>
            ✅ ¡Medicamento identificado!
          </h2>
          
          <p style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>
            {resultado.nombre}
          </p>
          
          <p style={{ fontSize: 16, color: '#4b5563', marginBottom: 5 }}>
            {resultado.presentacion}
          </p>
          
          {resultado.laboratorio && (
            <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 15 }}>
              Laboratorio: {resultado.laboratorio}
            </p>
          )}
          
          <p style={{ fontSize: 14, color: '#9ca3af', marginBottom: 20 }}>
            Código: {resultado.codigo_nacional}
          </p>
          
          {resultado.prospecto_pdf && (
            <button
              onClick={verPDF}
              style={{
                width: '100%',
                padding: 15,
                backgroundColor: '#3b82f6',
                border: 'none',
                borderRadius: 12,
                color: 'white',
                fontSize: 18,
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                marginBottom: 15
              }}
            >
              <FileText size={20} /> VER PROSPECTO
            </button>
          )}
          
          <button
            onClick={reiniciar}
            style={{
              width: '100%',
              padding: 15,
              backgroundColor: 'white',
              border: '2px solid #22c55e',
              borderRadius: 12,
              color: '#22c55e',
              fontSize: 18,
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
          >
            <RefreshCw size={20} /> ESCANEAR OTRO
          </button>
        </div>
      )}

      {/* Estado 6: Error */}
      {error && !sugerencias.length && (
        <div style={{
          width: '100%',
          maxWidth: 400,
          backgroundColor: '#fee2e2',
          borderRadius: 16,
          padding: 20,
          border: '2px solid #ef4444'
        }}>
          <p style={{ fontSize: 18, color: '#b91c1c', marginBottom: 15 }}>
            ⚠️ {error}
          </p>
          
          <button
            onClick={reiniciar}
            style={{
              width: '100%',
              padding: 15,
              backgroundColor: '#ef4444',
              border: 'none',
              borderRadius: 12,
              color: 'white',
              fontSize: 16,
              fontWeight: 'bold'
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