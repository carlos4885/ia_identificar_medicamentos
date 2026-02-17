import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Camera, Pill, Bell } from 'lucide-react';
import Escaner from './components/Escaner.jsx'; 

// Pantalla de Pastillas
const Pastillero = () => (
  <div style={{
    padding: '32px',
    maxWidth: 480,
    margin: '0 auto',
    background: 'rgba(255,255,255,0.7)',
    borderRadius: '24px',
    boxShadow: '0 4px 24px 0 rgba(0,64,128,0.07)',
    marginTop: 32
  }}>
    <h2 style={{color: '#2563eb', fontWeight: 800, fontSize: 28, marginBottom: 8, letterSpacing: 0.5}}>💊 Mis Pastillas</h2>
    <p style={{color: '#64748b', fontSize: 18}}>Tu lista está vacía.</p>
  </div>
);
// Pantalla de Alarmas
const Alarmas = () => (
  <div style={{
    padding: '32px',
    maxWidth: 480,
    margin: '0 auto',
    background: 'rgba(255,255,255,0.7)',
    borderRadius: '24px',
    boxShadow: '0 4px 24px 0 rgba(0,64,128,0.07)',
    marginTop: 32
  }}>
    <h2 style={{color: '#22c55e', fontWeight: 800, fontSize: 28, marginBottom: 8, letterSpacing: 0.5}}>🔔 Alarmas</h2>
    <p style={{color: '#64748b', fontSize: 18}}>No hay alarmas configuradas.</p>
  </div>
);

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
      backdropFilter: 'blur(12px)'
    }}>
      <Link to="/" style={isActive('/') ? activeStyle : btnStyle}>
        <Pill size={32} style={{marginBottom: 2}} />
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
          transition: 'box-shadow 0.2s'
        }}>
          <Camera size={40} />
        </div>
        <span style={{fontSize: '15px', color: '#2563eb', fontWeight: 700, marginTop: '7px', letterSpacing: 0.2}}>Escanear</span>
      </Link>
      <Link to="/alarmas" style={isActive('/alarmas') ? activeStyle : btnStyle}>
        <Bell size={32} style={{marginBottom: 2}} />
        <span>Alarmas</span>
      </Link>
    </nav>
  );
}

function App() {
  return (
    <div style={{
      paddingBottom: '110px',
      fontFamily: 'Inter, system-ui, sans-serif',
      minHeight: '100vh',
      background: 'linear-gradient(120deg,#e0f2fe 0%,#f8fafc 100%)',
      boxSizing: 'border-box',
    }}>
      <header style={{
        background: 'rgba(255,255,255,0.65)',
        color: '#2563eb',
        padding: '28px 0 18px 0',
        boxShadow: '0 2px 24px 0 #2563eb11',
        textAlign: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(10px)',
        borderBottom: '1.5px solid #e0e7ef'
      }}>
        <h1 style={{
          margin: 0,
          fontSize: '2.1rem',
          fontWeight: 900,
          letterSpacing: 0.5,
          textShadow: '0 2px 12px #2563eb22'
        }}>
          Mi Pastillero <span style={{color:'#22d3ee'}}>IA</span>
        </h1>
      </header>
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