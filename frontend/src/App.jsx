import React from 'react';
import './App.css';
import { styles } from './App.styles';
import { 
  Camera, RefreshCw, Settings, User, 
  Home, Zap, Image as ImageIcon 
} from 'lucide-react';

function App() {
  return (
    <div style={styles.container}>
      {/* SECCIÓN SUPERIOR: VISTA CÁMARA */}
      <div style={styles.cameraView}>
        <div style={styles.topBar}>
          <div style={styles.iconCircle}><Zap size={20} color="white" /></div>
          <span style={styles.pills}>CÁMARA</span>
          <div style={styles.iconCircle}><Settings size={20} color="white" /></div>
        </div>

        <div style={styles.focusFrame}>
          <div style={styles.statusText}>Listo para foto</div>
        </div>
      </div>

      {/* SECCIÓN INFERIOR: CONTROLES */}
      <div style={styles.controlsPanel}>
        <div style={styles.tabBar}>
          <span>VIDEO</span>
          <span style={styles.activeTab}>FOTO</span>
          <span>GALERÍA</span>
        </div>

        <div style={styles.captureRow}>
          <div style={styles.thumbnailPreview}>
            {/* Imagen de ejemplo simulando la galería */}
            <img 
              src="https://picsum.photos/100" 
              alt="last" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
          </div>
          
          <button style={styles.captureButton} onClick={() => alert("Capturando medicamento...")}>
            <div style={styles.captureButtonInner}>
              <Camera size={30} color="black" fill="black" />
            </div>
          </button>

          <div style={styles.iconCircleGray}>
            <RefreshCw size={24} color="#333" />
          </div>
        </div>
        
        <p style={styles.hintText}>Tocar botón para foto</p>

        {/* BARRA DE NAVEGACIÓN */}
        <div style={styles.bottomNav}>
          <div style={styles.navItemActive}>
            <Home size={24} />
            <span>INICIO</span>
          </div>
          <div style={styles.navItem}>
            <Settings size={24} />
            <span>AJUSTES</span>
          </div>
          <div style={styles.navItem}>
            <User size={24} />
            <span>PERFIL</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;