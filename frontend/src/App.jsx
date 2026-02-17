import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Camera, Pill, Bell } from 'lucide-react';

// 1. IMPORTAMOS EL ESCÁNER REAL (Esta es la única definición que debe haber)
import Escaner from './components/Escaner.jsx'; 

// 2. Componentes simples para las otras pantallas
const Pastillero = () => <div style={{padding: '20px'}}><h2>💊 Mis Pastillas</h2><p>Tu lista está vacía.</p></div>;
const Alarmas = () => <div style={{padding: '20px'}}><h2>🔔 Alarmas</h2><p>No hay alarmas configuradas.</p></div>;

function NavBar() {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;
  
  const btnStyle = { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px', textDecoration: 'none', color: '#666' };
  const activeStyle = { ...btnStyle, color: '#2563eb', fontWeight: 'bold' };

  return (
    <nav style={{ position: 'fixed', bottom: 0, width: '100%', height: '80px', background: 'white', borderTop: '2px solid #eee', display: 'flex', justifyContent: 'space-around', alignItems: 'center', zIndex: 1000 }}>
      <Link to="/" style={isActive('/') ? activeStyle : btnStyle}>
        <Pill size={32} />
        <span style={{fontSize: '14px'}}>Pastillas</span>
      </Link>
      
      <Link to="/escanear" style={{ ...btnStyle, color: 'white' }}>
        <div style={{ background: '#2563eb', padding: '15px', borderRadius: '50%', marginTop: '-40px', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
          <Camera size={40} />
        </div>
        <span style={{fontSize: '14px', color: '#2563eb', fontWeight: 'bold', marginTop: '5px'}}>Escanear</span>
      </Link>

      <Link to="/alarmas" style={isActive('/alarmas') ? activeStyle : btnStyle}>
        <Bell size={32} />
        <span style={{fontSize: '14px'}}>Alarmas</span>
      </Link>
    </nav>
  );
}

function App() {
  return (
      <div style={{ paddingBottom: '100px', fontFamily: 'sans-serif', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
        <header style={{ background: '#2563eb', color: 'white', padding: '20px' }}>
          <h1 style={{ margin: 0, fontSize: '22px' }}>Mi Pastillero IA</h1>
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