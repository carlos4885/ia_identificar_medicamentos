import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Camera, Pill, Bell, Settings, Sun, Moon } from 'lucide-react';
import Escaner from './components/Escaner.jsx';

// Animación simple para entrada de pantalla
const fadeIn = {
  animation: 'fadeIn 0.7s cubic-bezier(.68,-0.55,.27,1.55)',
};

// Agregar keyframes globales
if (typeof document !== 'undefined' && !document.getElementById('fadeInKeyframes')) {
  const style = document.createElement('style');
  style.id = 'fadeInKeyframes';
  style.innerHTML = `@keyframes fadeIn { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: none; } }`;
  document.head.appendChild(style);
}

// Pantalla de Pastillas
const Pastillero = () => (
  <div style={{
    padding: '32px',
    maxWidth: 480,
    margin: '0 auto',
    background: 'rgba(255,255,255,0.7)',
    borderRadius: '24px',
    boxShadow: '0 4px 24px 0 rgba(0,64,128,0.07)',
    marginTop: 32,
    ...fadeIn
  }}>
    <h2 style={{color: '#2563eb', fontWeight: 800, fontSize: 28, marginBottom: 8, letterSpacing: 0.5}}>💊 Mis Pastillas</h2>
    <p style={{color: '#64748b', fontSize: 18}}>Tu lista está vacía.</p>
  </div>
);
// Pantalla de Alarmas
// ...existing code...
const Alarmas = () => {
  const [alarmas, setAlarmas] = useState([
    // Ejemplo de alarma
    { id: 1, hora: '08:00', descripcion: 'Tomar pastilla A', activo: true },
    { id: 2, hora: '14:00', descripcion: 'Tomar pastilla B', activo: false }
  ]);
  const [showMenuId, setShowMenuId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [nuevaAlarma, setNuevaAlarma] = useState({ hora: '', descripcion: '', activo: true });

  const handleAddAlarma = () => {
    if (!nuevaAlarma.hora || !nuevaAlarma.descripcion) return;
    setAlarmas([...alarmas, { ...nuevaAlarma, id: Date.now() }]);
    setNuevaAlarma({ hora: '', descripcion: '', activo: true });
    setShowAdd(false);
  };
  const handleEditAlarma = (id) => {
    // Lógica de edición (puede abrir modal o similar)
    alert('Editar alarma ' + id);
  };
  const handleDeleteAlarma = (id) => {
    setAlarmas(alarmas.filter(a => a.id !== id));
    setShowMenuId(null);
  };

  return (
    <div style={{
      padding: '32px',
      maxWidth: 480,
      margin: '0 auto',
      background: 'rgba(255,255,255,0.7)',
      borderRadius: '24px',
      boxShadow: '0 4px 24px 0 rgba(0,64,128,0.07)',
      marginTop: 32,
      ...fadeIn
    }}>
      <h2 style={{color: '#22c55e', fontWeight: 800, fontSize: 28, marginBottom: 8, letterSpacing: 0.5}}>🔔 Alarmas</h2>
      <div style={{display:'flex', alignItems:'center', marginBottom: 18}}>
        <button
          style={{
            background: 'linear-gradient(135deg,#22c55e 60%,#2563eb 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: '50%',
            width: 44,
            height: 44,
            fontSize: 28,
            fontWeight: 900,
            cursor: 'pointer',
            marginRight: 12,
            boxShadow: '0 2px 8px #22c55e33',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s'
          }}
          onClick={() => setShowAdd(!showAdd)}
          title="Añadir alarma"
        >+</button>
        <span style={{fontWeight:700, color:'#22c55e', fontSize:18}}>Añadir alarma</span>
      </div>
      {showAdd && (
        <div style={{marginBottom:18, background:'#e0f2fe', padding:16, borderRadius:12}}>
          <input
            type="time"
            value={nuevaAlarma.hora}
            onChange={e => setNuevaAlarma({...nuevaAlarma, hora: e.target.value})}
            style={{marginRight:8, padding:6, borderRadius:6, border:'1px solid #22c55e'}}
          />
          <input
            type="text"
            placeholder="Descripción"
            value={nuevaAlarma.descripcion}
            onChange={e => setNuevaAlarma({...nuevaAlarma, descripcion: e.target.value})}
            style={{marginRight:8, padding:6, borderRadius:6, border:'1px solid #22c55e'}}
          />
          <button
            onClick={handleAddAlarma}
            style={{background:'#22c55e', color:'#fff', border:'none', borderRadius:6, padding:'6px 12px', fontWeight:700, cursor:'pointer'}}
          >Guardar</button>
        </div>
      )}
      {alarmas.length === 0 ? (
        <p style={{color: '#64748b', fontSize: 18}}>No hay alarmas configuradas.</p>
      ) : (
        <ul style={{listStyle:'none', padding:0}}>
          {alarmas.map(alarma => (
            <li key={alarma.id} style={{
              display:'flex',
              alignItems:'center',
              justifyContent:'space-between',
              background:'#f0fdf4',
              borderRadius:12,
              marginBottom:12,
              padding:'12px 16px',
              boxShadow:'0 2px 8px #22c55e11',
              position:'relative'
            }}>
              <div>
                <div style={{fontWeight:700, fontSize:18, color:'#22c55e'}}>{alarma.hora} <span style={{fontSize:15, color:'#64748b'}}>{alarma.descripcion}</span></div>
                <div style={{fontSize:14, color:alarma.activo ? '#22c55e' : '#64748b'}}>{alarma.activo ? 'Activa' : 'Inactiva'}</div>
              </div>
              <div style={{position:'relative'}}>
                <button
                  style={{background:'none', border:'none', fontSize:22, color:'#2563eb', cursor:'pointer', padding:4, borderRadius:8}}
                  onClick={() => setShowMenuId(alarma.id === showMenuId ? null : alarma.id)}
                  title="Opciones"
                >⋮</button>
                {showMenuId === alarma.id && (
                  <div style={{position:'absolute', right:0, top:28, background:'#fff', border:'1px solid #e0e7ef', borderRadius:8, boxShadow:'0 2px 8px #2563eb22', zIndex:10}}>
                    <button
                      style={{display:'block', width:'100%', background:'none', border:'none', color:'#2563eb', padding:'8px 16px', cursor:'pointer', textAlign:'left', fontWeight:700}}
                      onClick={() => handleEditAlarma(alarma.id)}
                    >Editar</button>
                    <button
                      style={{display:'block', width:'100%', background:'none', border:'none', color:'#dc2626', padding:'8px 16px', cursor:'pointer', textAlign:'left', fontWeight:700}}
                      onClick={() => handleDeleteAlarma(alarma.id)}
                    >Eliminar</button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
// ...existing code...

function NavBar() {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;
  const btnStyle = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '10px',
    textDecoration: 'none',
    color: '#64748b',
    transition: 'color 0.2s',
    fontWeight: 500,
    fontSize: 15,
    letterSpacing: 0.2
  };
  const activeStyle = {
    ...btnStyle,
    color: '#2563eb',
    fontWeight: 700,
    textShadow: '0 2px 8px #c7d2fe55'
  };
  return (
    <nav style={{
      position: 'fixed',
      left: 0,
      bottom: 0,
      width: '100%',
      height: '84px',
      background: 'rgba(255,255,255,0.85)',
      boxShadow: '0 0 24px 0 rgba(37,99,235,0.08)',
      borderTop: '1.5px solid #e0e7ef',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(12px)',
      animation: 'fadeIn 0.7s cubic-bezier(.68,-0.55,.27,1.55)'
    }}>
      <Link to="/" style={isActive('/') ? activeStyle : btnStyle}>
        <Pill size={32} style={{marginBottom: 2, transition: 'transform 0.2s'}} />
        <span>Pastillas</span>
      </Link>
      <Link to="/escanear" style={{ ...btnStyle, color: 'white', margin: '0 8px' }}>
        <div style={{
          background: 'linear-gradient(135deg,#2563eb 60%,#22d3ee 100%)',
          padding: '18px',
          borderRadius: '50%',
          marginTop: '-48px',
          boxShadow: '0 6px 24px 0 #2563eb55',
          border: '4px solid #fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'box-shadow 0.2s, transform 0.2s',
        }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Camera size={100} />
        </div>
        <span style={{fontSize: '15px', color: '#2563eb', fontWeight: 700, marginTop: '7px', letterSpacing: 0.2}}>Escanear</span>
      </Link>
      <Link to="/alarmas" style={isActive('/alarmas') ? activeStyle : btnStyle}>
        <Bell size={32} style={{marginBottom: 2, transition: 'transform 0.2s'}} />
        <span>Alarmas</span>
      </Link>
    </nav>
  );
}

function App() {
  const [showSettings, setShowSettings] = useState(false);
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'light';
    }
    return 'light';
  });

  // Cambia el tema y guarda en localStorage
  const toggleTheme = (t) => {
    setTheme(t);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', t);
    }
  };

  // Aplica el tema al body
  if (typeof document !== 'undefined') {
    document.body.style.background = theme === 'dark'
      ? 'linear-gradient(120deg,#181f2a 0%,#23272f 100%)'
      : 'linear-gradient(120deg,#e0f2fe 0%,#f8fafc 100%)';
    document.body.style.color = theme === 'dark' ? '#e0e6ef' : '#213547';
  }

  return (
    <div style={{
      paddingBottom: '110px',
      fontFamily: 'Inter, system-ui, sans-serif',
      minHeight: '100vh',
      background: theme === 'dark'
        ? 'linear-gradient(120deg,#181f2a 0%,#23272f 100%)'
        : 'linear-gradient(120deg,#e0f2fe 0%,#f8fafc 100%)',
      color: theme === 'dark' ? '#e0e6ef' : '#213547',
      boxSizing: 'border-box',
      transition: 'background 0.4s, color 0.4s',
    }}>
      <header style={{
        background: theme === 'dark' ? 'rgba(24,31,42,0.85)' : 'rgba(255,255,255,0.65)',
        color: '#2563eb',
        padding: '28px 0 18px 0',
        boxShadow: '0 2px 24px 0 #2563eb11',
        textAlign: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(10px)',
        borderBottom: '1.5px solid #e0e7ef',
        minHeight: 70,
      }}>
        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <h1 style={{
            margin: 0,
            fontSize: '2.1rem',
            fontWeight: 900,
            letterSpacing: 0.5,
            textShadow: '0 2px 12px #2563eb22',
            flex: 1,
          }}>
            MedSacn <span style={{color:'#22d3ee'}}>IA</span>
          </h1>
          <button
            aria-label="Ajustes"
            style={{
              position: 'absolute',
              right: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              padding: 8,
              cursor: 'pointer',
              borderRadius: 8,
              transition: 'background 0.2s',
              outline: 'none',
              boxShadow: 'none',
            }}
            onClick={() => setShowSettings(true)}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(34,211,238,0.12)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            <Settings size={32} color="#2563eb" />
          </button>
        </div>
      </header>

      {/* Modal de ajustes */}
      {showSettings && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.25)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
          onClick={() => setShowSettings(false)}
        >
          <div
            style={{
              background: theme === 'dark' ? 'rgba(24,31,42,0.98)' : 'rgba(255,255,255,0.98)',
              borderRadius: 20,
              boxShadow: '0 8px 32px 0 #2563eb33',
              padding: 32,
              minWidth: 320,
              maxWidth: '90vw',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              animation: 'fadeIn 0.4s',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{margin: 0, marginBottom: 18, fontWeight: 900, fontSize: 24, color: theme === 'dark' ? '#e0e6ef' : '#2563eb'}}>Ajustes</h2>
            <div style={{display: 'flex', gap: 18, marginBottom: 12}}>
              <button
                onClick={() => toggleTheme('light')}
                style={{
                  background: theme === 'light' ? 'linear-gradient(90deg,#2563eb 60%,#22d3ee 100%)' : 'rgba(220,220,220,0.2)',
                  color: theme === 'light' ? '#fff' : '#2563eb',
                  border: theme === 'light' ? 'none' : '1.5px solid #2563eb33',
                  fontWeight: 800,
                  fontSize: 18,
                  borderRadius: 12,
                  padding: '12px 24px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: theme === 'light' ? '0 2px 12px 0 #2563eb22' : 'none',
                  transition: 'background 0.2s, color 0.2s',
                }}
                disabled={theme === 'light'}
              >
                <Sun size={22} /> Claro
              </button>
              <button
                onClick={() => toggleTheme('dark')}
                style={{
                  background: theme === 'dark' ? 'linear-gradient(90deg,#181f2a 60%,#23272f 100%)' : 'rgba(220,220,220,0.2)',
                  color: theme === 'dark' ? '#fff' : '#23272f',
                  border: theme === 'dark' ? 'none' : '1.5px solid #23272f33',
                  fontWeight: 800,
                  fontSize: 18,
                  borderRadius: 12,
                  padding: '12px 24px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: theme === 'dark' ? '0 2px 12px 0 #181f2a22' : 'none',
                  transition: 'background 0.2s, color 0.2s',
                }}
                disabled={theme === 'dark'}
              >
                <Moon size={22} /> Oscuro
              </button>
            </div>
            <button
              onClick={() => setShowSettings(false)}
              style={{
                marginTop: 18,
                background: 'none',
                color: theme === 'dark' ? '#e0e6ef' : '#2563eb',
                border: 'none',
                fontWeight: 700,
                fontSize: 16,
                cursor: 'pointer',
                textDecoration: 'underline',
                borderRadius: 8,
                padding: 8,
              }}
            >Cerrar</button>
          </div>
        </div>
      )}

      <Routes>
        <Route path="/" element={<Pastillero />} />
        <Route path="/escanear" element={<Escaner />} />
        <Route path="/alarmas" element={<Alarmas />} />
      </Routes>
      <NavBar />
    </div>
  );
}

export default App;