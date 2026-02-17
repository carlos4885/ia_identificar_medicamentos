import { useState } from 'react'
import { Camera, RefreshCw, Settings, User, Home, Zap, Image as ImageIcon } from 'lucide-react' // Necesitarás instalar lucide-react

function App() {
  return (
    <div className="app-container" style={styles.container}>
      {/* --- PARTE SUPERIOR: CÁMARA --- */}
      <div className="camera-view" style={styles.cameraView}>
        <div style={styles.topBar}>
          <div style={styles.iconCircle}><Zap size={20} color="white" /></div>
          <span style={styles.pills}>CÁMARA</span>
          <div style={styles.iconCircle}><Settings size={20} color="white" /></div>
        </div>

        <div style={styles.focusFrame}>
          <div style={styles.innerFrame}></div>
          <span style={styles.statusText}>Listo para foto</span>
        </div>
      </div>

      {/* --- PARTE INFERIOR: CONTROLES (Panel Blanco) --- */}
      <div className="controls-panel" style={styles.controlsPanel}>
        <div style={styles.tabBar}>
          <span>VIDEO</span>
          <span style={styles.activeTab}>FOTO</span>
          <span>GALERÍA</span>
        </div>

        <div style={styles.captureRow}>
          <div style={styles.thumbnailPreview}>
            <ImageIcon size={24} color="#ccc" />
          </div>
          
          <button style={styles.captureButton}>
            <div style={styles.captureButtonInner}>
              <Camera size={32} color="black" />
            </div>
          </button>

          <div style={styles.iconCircleGray}>
            <RefreshCw size={24} color="#333" />
          </div>
        </div>
        
        <p style={styles.hintText}>Tocar botón para foto</p>

        {/* --- NAVBAR INFERIOR --- */}
        <div style={styles.bottomNav}>
          <div style={styles.navItemActive}><Home size={24} /><span>INICIO</span></div>
          <div style={styles.navItem}><Settings size={24} /><span>AJUSTES</span></div>
          <div style={styles.navItem}><User size={24} /><span>PERFIL</span></div>
        </div>
      </div>
    </div>
  )
}

// Estilos rápidos para que se vea igual a tu foto
const styles = {
  container: { height: '100vh', backgroundColor: '#000', display: 'flex', flexDirection: 'column', color: 'white', fontFamily: 'sans-serif', overflow: 'hidden' },
  cameraView: { flex: 1, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  topBar: { position: 'absolute', top: 20, width: '90%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  pills: { backgroundColor: 'rgba(255,255,255,0.2)', padding: '5px 20px', borderRadius: '20px', fontWeight: 'bold', fontSize: '14px' },
  iconCircle: { backgroundColor: 'rgba(255,255,255,0.2)', padding: '10px', borderRadius: '50%' },
  focusFrame: { border: '2px solid rgba(255,255,255,0.5)', width: '250px', height: '250px', borderRadius: '30px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', paddingBottom: '20px' },
  statusText: { backgroundColor: 'rgba(0,0,0,0.6)', padding: '4px 12px', borderRadius: '15px', fontSize: '12px' },
  controlsPanel: { backgroundColor: 'white', borderTopLeftRadius: '40px', borderTopRightRadius: '40px', padding: '20px', color: '#333', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  tabBar: { display: 'flex', gap: '30px', fontWeight: 'bold', fontSize: '14px', marginBottom: '30px', color: '#888' },
  activeTab: { color: '#000', borderBottom: '2px solid #000' },
  captureRow: { display: 'flex', width: '100%', justifyContent: 'space-around', alignItems: 'center', marginBottom: '10px' },
  captureButton: { width: '80px', height: '80px', borderRadius: '50%', border: '4px solid #000', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' },
  captureButtonInner: { width: '65px', height: '65px', borderRadius: '50%', backgroundColor: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid #ccc' },
  thumbnailPreview: { width: '50px', height: '50px', borderRadius: '10px', overflow: 'hidden', border: '2px solid #eee' },
  iconCircleGray: { backgroundColor: '#f0f0f0', padding: '12px', borderRadius: '50%' },
  hintText: { fontSize: '12px', color: '#888', marginBottom: '20px' },
  bottomNav: { display: 'flex', width: '100%', justifyContent: 'space-between', borderTop: '1px solid #eee', paddingTop: '15px' },
  navItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '10px', color: '#bbb' },
  navItemActive: { display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '10px', color: '#000' },
}

export default App