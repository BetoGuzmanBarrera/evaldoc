import { useState } from 'react'
import { Activity, LockKeyhole, Menu, ShieldCheck, Smartphone, TrendingUp, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { institutions } from '../../data/mock/institutions'
import { Brand } from '../../components/ui/Brand'

const benefits = [
  { title: 'Evaluaciones seguras', description: 'Privacidad desde el diseño', icon: ShieldCheck },
  { title: 'Resultados en tiempo real', description: 'Indicadores siempre actualizados', icon: Activity },
  { title: 'Mejora continua', description: 'Decisiones con evidencia', icon: TrendingUp },
  { title: 'En cualquier dispositivo', description: 'Acceso simple y responsive', icon: Smartphone },
]

export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  return <div className="landing"><header className="landing-header"><Brand /><nav className={`landing-nav ${menuOpen ? 'is-open' : ''}`} aria-label="Navegación principal"><a href="#inicio" onClick={() => setMenuOpen(false)}>Inicio</a><a href="#caracteristicas" onClick={() => setMenuOpen(false)}>Características</a><a href="#instituciones" onClick={() => setMenuOpen(false)}>Instituciones</a><a href="#seguridad" onClick={() => setMenuOpen(false)}>Seguridad</a><a href="#contacto" onClick={() => setMenuOpen(false)}>Contacto</a></nav><div className="landing-actions"><Link className="button button-outline" to="/login">Iniciar sesión</Link><Link className="button button-primary" to="/register">Registrarse</Link></div><button className="landing-menu-toggle icon-button" type="button" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={menuOpen}>{menuOpen ? <X size={24} /> : <Menu size={24} />}</button></header>
    <main><section className="hero-section" id="inicio"><div className="hero-copy"><p className="eyebrow">EVALUACIÓN DOCENTE · SEGURA Y ANÓNIMA</p><h1>Tu opinión fortalece<br className="desktop-break" /> la educación</h1><p className="hero-subtitle">Plataforma institucional para realizar evaluaciones docentes de forma segura, anónima y confiable.</p><div className="hero-actions"><Link className="button button-primary" to="/login">Comenzar</Link><a className="button button-outline" href="#caracteristicas">Conocer más</a></div></div><div className="product-mockup" aria-label="Vista previa del panel de EvalDoc"><div className="mock-sidebar"><strong>EvalDoc</strong><span>Inicio</span><span>Evaluaciones</span><span>Historial</span></div><div className="mock-main"><strong className="mock-welcome">Hola, Alberto</strong><div className="mock-metrics"><div><strong>8</strong><span>Total</span></div><div><strong>3</strong><span>Realizadas</span></div><div><strong>5</strong><span>Pendientes</span></div></div><div className="mock-progress"><span>Progreso de evaluaciones</span><strong>37%</strong><div className="progress-track"><span style={{ width: '37%' }} /></div></div></div></div></section>
    <section className="benefits-section" id="caracteristicas" aria-label="Características de EvalDoc">{benefits.map(({ title, description, icon: Icon }) => <div className="benefit" key={title}><Icon size={24} aria-hidden="true" /><div><h2>{title}</h2><p>{description}</p></div></div>)}</section>
    <section className="institutions-section" id="instituciones"><h2>Diseñado para instituciones educativas</h2><div className="institution-list">{institutions.map((institution) => <span className="institution-chip" key={institution.id}>{institution.shortName}</span>)}</div></section>
    <section className="landing-bottom" id="seguridad"><div><LockKeyhole size={19} aria-hidden="true" /><strong>Seguridad y anonimato desde el diseño</strong></div><p id="contacto">EvalDoc · Plataforma de evaluación institucional</p></section></main></div>
}
