import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

// Layout & Route Guards
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

// Pages
import Login from './pages/Login'
import Register from './pages/Register'
import RegistroMultistep from './pages/RegistroMultistep'
import Dashboard from './pages/Dashboard'
import EmergencyView from './pages/EmergencyView'

const serviceCards = [
  {
    icon: '+',
    title: 'Crea tu Ficha Vital',
    text: 'Registra solo los datos médicos importantes para una atención rápida.',
    color: 'rgba(185, 28, 28, 0.16)',
  },
  {
    icon: 'QR',
    title: 'Genera tu QR/NFC',
    text: 'Descarga, imprime o usa tu identificador en casco, DNI o celular.',
    color: 'rgba(22, 163, 74, 0.16)',
  },
  {
    icon: '✓',
    title: 'Acceso en emergencia',
    text: 'El rescatista ve datos críticos sin instalar ninguna aplicación.',
    color: 'rgba(59, 130, 246, 0.16)',
  },
]

const featureTiles = [
  { icon: '!', title: 'Alergias' },
  { icon: 'G', title: 'Tipo de sangre' },
  { icon: 'C', title: 'Condiciones' },
  { icon: 'Rx', title: 'Medicamentos' },
  { icon: 'Tel', title: 'Contacto' },
  { icon: 'Log', title: 'Auditoría' },
]

const steps = [
  { number: '1', text: 'El ciudadano registra su información médica crítica.' },
  { number: '2', text: 'El sistema genera un QR o enlace NFC seguro.' },
  { number: '3', text: 'El rescatista escanea y visualiza la Ficha Vital.' },
]

function LandingPage() {
  const [session, setSession] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
  }, [])

  return (
    <div style={landingShellStyle} className="animate-fade-in">
      <div style={topStripStyle}>
        <div style={topStripInnerStyle}>
          <span><strong>Emergencias:</strong> información médica crítica disponible en segundos.</span>
          <span>Acceso por QR/NFC · Ficha Vital · Trazabilidad</span>
        </div>
      </div>

      <section style={heroSectionStyle}>
        <div style={heroPatternStyle}></div>
        <div className="landing-hero-grid" style={heroInnerStyle}>
          <div style={heroCopyStyle}>
            <div style={eyebrowStyle}>Ficha Vital de Emergencia</div>
            <h1 style={heroTitleStyle}>
              Tu información médica crítica,
              <span style={heroTitleAccentStyle}> disponible en segundos.</span>
            </h1>
            <p style={heroTextStyle}>
              MediRecord permite registrar alergias, tipo de sangre, condiciones, medicamentos y contactos de emergencia en una ficha segura accesible mediante QR o NFC.
            </p>

            <div style={heroActionsStyle}>
              {session ? (
                <Link to="/dashboard" style={primaryPillStyle}>
                  Ir a mi Dashboard Clínico
                </Link>
              ) : (
                <>
                  <Link to="/register" style={primaryPillStyle}>
                    Crear mi Ficha Vital
                  </Link>
                  <Link to="/login" style={ghostPillStyle}>
                    Iniciar sesión
                  </Link>
                </>
              )}
            </div>

            <div className="landing-trust-grid" style={trustRowStyle}>
              <div style={trustCardStyle}>
                <strong style={trustValueStyle}>QR</strong>
                <span style={trustTextStyle}>Acceso universal desde cualquier cámara.</span>
              </div>
              <div style={trustCardStyle}>
                <strong style={trustValueStyle}>NFC</strong>
                <span style={trustTextStyle}>Compatible con etiquetas físicas.</span>
              </div>
              <div style={trustCardStyle}>
                <strong style={trustValueStyle}>24/7</strong>
                <span style={trustTextStyle}>Información disponible en emergencias.</span>
              </div>
            </div>
          </div>

          <div style={heroVisualStyle} aria-hidden="true" className="landing-hero-visual">
            <div style={redCurveStyle}></div>
            <div style={doctorCardStyle}>
              <div style={{ ...floatingCardStyle, ...qrMiniStyle }}>
                <div style={qrBoxStyle}></div>
                <div>
                  <strong style={floatingTitleStyle}>QR activo</strong>
                  <span style={floatingTextStyle}>Ficha Vital protegida</span>
                </div>
              </div>

              <div style={{ ...floatingCardStyle, ...alertMiniStyle }}>
                  <strong style={floatingTitleStyle}>Alerta médica</strong>
                <span style={floatingTextStyle}>Alergias y condiciones visibles primero.</span>
              </div>

              <div style={statusPillStyle}>
                <span style={statusDotStyle}></span>
                Acceso seguro
              </div>

              <div style={doctorFigureStyle}>
                <div style={headStyle}></div>
                <div style={{ ...armStyle, ...armLeftStyle }}></div>
                <div style={{ ...armStyle, ...armRightStyle }}></div>
                <div style={bodyCoatStyle}></div>
                <div style={shirtStyle}></div>
                <div style={stethoscopeStyle}></div>
                <div style={stethoscopeBellStyle}></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={quickServicesStyle} aria-label="Servicios principales">
        <div className="landing-service-grid" style={serviceGridStyle}>
          {serviceCards.map((service) => (
            <article key={service.title} style={serviceCardStyle}>
              <div style={serviceImageStyle(service.color)}>
                <div style={serviceCircleStyle}></div>
                <div style={serviceIconStyle}>{service.icon}</div>
              </div>
              <div style={serviceBodyStyle}>
                <h3 style={serviceTitleStyle}>{service.title}</h3>
                <p style={serviceTextStyle}>{service.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section style={sectionStyle}>
        <div style={sectionHeadingStyle}>
          <span style={sectionLabelStyle}>Información esencial</span>
          <h2 style={sectionTitleStyle}>Datos médicos visibles con prioridad clínica</h2>
          <p style={sectionTextStyle}>
            La pantalla de emergencia está pensada para mostrar primero lo que puede cambiar una decisión médica en segundos.
          </p>
        </div>

        <div className="landing-feature-grid" style={featuresGridStyle}>
          {featureTiles.map((feature) => (
            <div key={feature.title} style={featureTileStyle}>
              <div style={featureIconStyle}>{feature.icon}</div>
              <h4 style={featureTitleStyle}>{feature.title}</h4>
            </div>
          ))}
        </div>
      </section>

      <section style={aboutBandStyle}>
        <div style={aboutRingStyle}></div>
        <div className="landing-about-grid" style={aboutInnerStyle}>
          <div>
            <h2 style={aboutTitleStyle}>Diseñado para actuar rápido cuando cada minuto importa.</h2>
            <p style={aboutTextStyle}>
              Una experiencia visual limpia, médica e institucional: alto contraste, acentos rojos y tarjetas fáciles de leer desde dispositivos móviles.
            </p>
          </div>
          <div style={stepsStyle}>
            {steps.map((step) => (
              <div key={step.number} style={stepStyle}>
                <strong style={stepNumberStyle}>{step.number}</strong>
                <span style={stepTextStyle}>{step.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route 
            path="/registro" 
            element={
              <ProtectedRoute>
                <RegistroMultistep />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />

          <Route path="/emergency/:token" element={<EmergencyView />} />
          
          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App

const red = '#B91C1C'
const redDark = '#7F1D1D'
const redSoft = '#FEE2E2'
const text = '#1F2937'
const muted = '#6B7280'
const line = '#E5E7EB'
const dark = '#18181B'
const white = '#FFFFFF'
const maxWidth = '1180px'

const landingShellStyle = {
  width: 'calc(100vw - 0px)',
  marginLeft: 'calc(50% - 50vw)',
  marginRight: 'calc(50% - 50vw)',
  marginTop: '-40px',
  marginBottom: '-40px',
  backgroundColor: white,
  color: text,
  overflow: 'hidden',
}

const topStripStyle = {
  backgroundColor: dark,
  color: 'rgba(255, 255, 255, 0.82)',
  fontSize: '13px',
  padding: '8px 0',
}

const topStripInnerStyle = {
  width: `min(${maxWidth}, calc(100% - 40px))`,
  margin: '0 auto',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '16px',
  flexWrap: 'wrap',
}

const heroSectionStyle = {
  position: 'relative',
  overflow: 'hidden',
  background: `radial-gradient(circle at 10% 20%, rgba(185, 28, 28, 0.08), transparent 30%), linear-gradient(90deg, #fff 0%, #fff 46%, #F9FAFB 46%, #F9FAFB 100%)`,
  borderBottom: `1px solid ${line}`,
}

const heroPatternStyle = {
  position: 'absolute',
  inset: 0,
  backgroundImage: 'radial-gradient(rgba(31, 41, 55, 0.11) 1px, transparent 1px)',
  backgroundSize: '18px 18px',
  opacity: 0.18,
  pointerEvents: 'none',
}

const heroInnerStyle = {
  position: 'relative',
  width: `min(${maxWidth}, calc(100% - 40px))`,
  margin: '0 auto',
  display: 'grid',
  gridTemplateColumns: '1.02fr 0.98fr',
  alignItems: 'center',
  gap: '56px',
  minHeight: '640px',
  padding: '58px 0 74px',
}

const heroCopyStyle = {
  position: 'relative',
  zIndex: 2,
}

const eyebrowStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '9px',
  backgroundColor: redSoft,
  color: redDark,
  border: '1px solid rgba(185, 28, 28, 0.16)',
  padding: '9px 14px',
  borderRadius: '999px',
  fontSize: '13px',
  fontWeight: 800,
  marginBottom: '22px',
}

const heroTitleStyle = {
  fontSize: 'clamp(42px, 5vw, 70px)',
  lineHeight: 0.98,
  letterSpacing: '-0.06em',
  color: '#111827',
  maxWidth: '680px',
  marginBottom: '22px',
  fontWeight: 900,
}

const heroTitleAccentStyle = {
  color: red,
  display: 'block',
}

const heroTextStyle = {
  maxWidth: '600px',
  fontSize: '18px',
  color: muted,
  marginBottom: '30px',
}

const heroActionsStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '14px',
  flexWrap: 'wrap',
  marginBottom: '34px',
}

const pillBaseStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '999px',
  padding: '12px 20px',
  fontWeight: 800,
  fontSize: '14px',
  whiteSpace: 'nowrap',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease',
}

const primaryPillStyle = {
  ...pillBaseStyle,
  backgroundColor: red,
  color: white,
  boxShadow: '0 12px 28px rgba(185, 28, 28, 0.26)',
}

const ghostPillStyle = {
  ...pillBaseStyle,
  color: red,
  backgroundColor: white,
  border: '1px solid rgba(185, 28, 28, 0.22)',
}

const trustRowStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: '14px',
  maxWidth: '620px',
}

const trustCardStyle = {
  padding: '16px',
  border: `1px solid ${line}`,
  backgroundColor: 'rgba(255, 255, 255, 0.86)',
  borderRadius: '16px',
  boxShadow: '0 10px 28px rgba(31, 41, 55, 0.06)',
}

const trustValueStyle = {
  display: 'block',
  color: '#111827',
  fontSize: '21px',
  lineHeight: 1,
  marginBottom: '7px',
}

const trustTextStyle = {
  color: muted,
  fontSize: '13px',
  fontWeight: 600,
}

const heroVisualStyle = {
  position: 'relative',
  height: '510px',
  display: 'grid',
  placeItems: 'center',
}

const redCurveStyle = {
  position: 'absolute',
  left: '-18px',
  top: '-42px',
  width: '170px',
  height: '650px',
  borderLeft: `16px solid ${red}`,
  borderRadius: '52% 0 0 52%',
  transform: 'rotate(3deg)',
  opacity: 0.96,
}

const doctorCardStyle = {
  position: 'relative',
  width: 'min(420px, 92%)',
  minHeight: '470px',
  borderRadius: '34px',
  background: 'linear-gradient(180deg, rgba(255,255,255,0.72), rgba(255,255,255,0.96)), radial-gradient(circle at 50% 0%, rgba(185, 28, 28, 0.13), transparent 38%)',
  border: '1px solid rgba(229, 231, 235, 0.86)',
  boxShadow: '0 18px 45px rgba(31, 41, 55, 0.12)',
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center',
  padding: '34px',
}

const doctorFigureStyle = {
  position: 'relative',
  width: '260px',
  height: '365px',
  zIndex: 1,
}

const headStyle = {
  position: 'absolute',
  top: 0,
  left: '50%',
  width: '82px',
  height: '82px',
  transform: 'translateX(-50%)',
  backgroundColor: '#F3D8C7',
  borderRadius: '50%',
  boxShadow: 'inset 0 -10px 0 rgba(127,29,29,0.08)',
}

const bodyCoatStyle = {
  position: 'absolute',
  top: '84px',
  left: '50%',
  width: '205px',
  height: '268px',
  transform: 'translateX(-50%)',
  backgroundColor: white,
  borderRadius: '42px 42px 20px 20px',
  border: `1px solid ${line}`,
  boxShadow: '0 22px 40px rgba(31,41,55,0.1)',
}

const shirtStyle = {
  position: 'absolute',
  top: '108px',
  left: '50%',
  width: '76px',
  height: '160px',
  transform: 'translateX(-50%)',
  background: 'linear-gradient(#DBEAFE, #BFDBFE)',
  clipPath: 'polygon(0 0, 100% 0, 82% 100%, 18% 100%)',
  borderRadius: '0 0 18px 18px',
  zIndex: 2,
}

const stethoscopeStyle = {
  position: 'absolute',
  top: '118px',
  left: '50%',
  width: '120px',
  height: '132px',
  transform: 'translateX(-50%)',
  border: '5px solid #9CA3AF',
  borderTop: 0,
  borderRadius: '0 0 60px 60px',
  zIndex: 3,
}

const stethoscopeBellStyle = {
  position: 'absolute',
  top: '224px',
  left: '182px',
  width: '25px',
  height: '25px',
  backgroundColor: '#6B7280',
  borderRadius: '50%',
  boxShadow: 'inset 0 0 0 7px #D1D5DB',
  zIndex: 4,
}

const armStyle = {
  position: 'absolute',
  top: '126px',
  width: '58px',
  height: '164px',
  backgroundColor: white,
  border: `1px solid ${line}`,
  borderRadius: '32px',
  zIndex: 1,
}

const armLeftStyle = {
  left: 0,
  transform: 'rotate(13deg)',
}

const armRightStyle = {
  right: 0,
  transform: 'rotate(-13deg)',
}

const floatingCardStyle = {
  position: 'absolute',
  zIndex: 4,
  backgroundColor: 'rgba(255, 255, 255, 0.94)',
  border: '1px solid rgba(229, 231, 235, 0.9)',
  borderRadius: '18px',
  boxShadow: '0 18px 38px rgba(31, 41, 55, 0.13)',
  padding: '14px 16px',
  backdropFilter: 'blur(12px)',
}

const qrMiniStyle = {
  right: '14px',
  top: '86px',
  display: 'grid',
  gridTemplateColumns: '58px 1fr',
  alignItems: 'center',
  gap: '12px',
  width: '218px',
}

const qrBoxStyle = {
  width: '58px',
  height: '58px',
  borderRadius: '10px',
  background: 'linear-gradient(90deg, #111 8px, transparent 8px) 0 0/18px 18px, linear-gradient(#111 8px, transparent 8px) 0 0/18px 18px, #fff',
  border: '7px solid #fff',
  outline: `1px solid ${line}`,
}

const alertMiniStyle = {
  left: '4px',
  bottom: '76px',
  width: '226px',
  borderLeft: `5px solid ${red}`,
}

const floatingTitleStyle = {
  display: 'block',
  fontSize: '13px',
  color: '#111827',
  lineHeight: 1.2,
}

const floatingTextStyle = {
  display: 'block',
  fontSize: '12px',
  color: muted,
  marginTop: '3px',
}

const statusPillStyle = {
  position: 'absolute',
  right: '48px',
  bottom: '22px',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  padding: '10px 14px',
  borderRadius: '999px',
  backgroundColor: '#DCFCE7',
  color: '#166534',
  fontWeight: 800,
  fontSize: '13px',
  zIndex: 5,
  boxShadow: '0 12px 26px rgba(22, 163, 74, 0.18)',
}

const statusDotStyle = {
  width: '9px',
  height: '9px',
  borderRadius: '50%',
  backgroundColor: '#16A34A',
}

const quickServicesStyle = {
  marginTop: '-52px',
  position: 'relative',
  zIndex: 5,
}

const serviceGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '20px',
  width: `min(${maxWidth}, calc(100% - 40px))`,
  margin: '0 auto',
}

const serviceCardStyle = {
  backgroundColor: white,
  border: `1px solid ${line}`,
  borderRadius: '18px',
  overflow: 'hidden',
  boxShadow: '0 16px 36px rgba(31, 41, 55, 0.08)',
}

const serviceImageStyle = (color) => ({
  height: '132px',
  background: `radial-gradient(circle at 28% 44%, ${color}, transparent 25%), linear-gradient(135deg, #fff, #F3F4F6)`,
  position: 'relative',
  overflow: 'hidden',
})

const serviceCircleStyle = {
  position: 'absolute',
  width: '150px',
  height: '150px',
  border: '18px solid rgba(185, 28, 28, 0.08)',
  borderRadius: '50%',
  right: '-32px',
  top: '-52px',
}

const serviceIconStyle = {
  position: 'absolute',
  left: '24px',
  bottom: '22px',
  width: '56px',
  height: '56px',
  borderRadius: '16px',
  backgroundColor: red,
  color: white,
  display: 'grid',
  placeItems: 'center',
  fontSize: '22px',
  fontWeight: 900,
  boxShadow: '0 12px 24px rgba(185, 28, 28, 0.22)',
}

const serviceBodyStyle = {
  padding: '20px 24px 24px',
}

const serviceTitleStyle = {
  fontSize: '20px',
  letterSpacing: '-0.02em',
  marginBottom: '8px',
  color: '#111827',
}

const serviceTextStyle = {
  color: muted,
  fontSize: '14px',
}

const sectionStyle = {
  width: `min(${maxWidth}, calc(100% - 40px))`,
  margin: '0 auto',
  padding: '82px 0 76px',
}

const sectionHeadingStyle = {
  textAlign: 'center',
  maxWidth: '680px',
  margin: '0 auto 42px',
}

const sectionLabelStyle = {
  display: 'block',
  color: red,
  fontWeight: 800,
  fontSize: '13px',
  marginBottom: '8px',
}

const sectionTitleStyle = {
  fontSize: 'clamp(30px, 3.5vw, 44px)',
  lineHeight: 1.08,
  letterSpacing: '-0.05em',
  color: '#111827',
  marginBottom: '14px',
}

const sectionTextStyle = {
  color: muted,
  fontSize: '16px',
}

const featuresGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(6, 1fr)',
  gap: '18px',
}

const featureTileStyle = {
  minHeight: '148px',
  borderRadius: '18px',
  backgroundColor: '#555555',
  color: white,
  padding: '20px 14px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  textAlign: 'center',
  position: 'relative',
  overflow: 'hidden',
}

const featureIconStyle = {
  width: '44px',
  height: '44px',
  display: 'grid',
  placeItems: 'center',
  border: '2px solid rgba(255,255,255,0.85)',
  borderRadius: '14px',
  marginBottom: '14px',
  fontSize: '18px',
  fontWeight: 800,
}

const featureTitleStyle = {
  fontSize: '12px',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
}

const aboutBandStyle = {
  background: `linear-gradient(135deg, ${redDark}, ${red})`,
  color: white,
  padding: '56px 0',
  overflow: 'hidden',
  position: 'relative',
}

const aboutRingStyle = {
  position: 'absolute',
  width: '360px',
  height: '360px',
  border: '52px solid rgba(255,255,255,0.08)',
  borderRadius: '50%',
  right: '-110px',
  top: '-130px',
}

const aboutInnerStyle = {
  width: `min(${maxWidth}, calc(100% - 40px))`,
  margin: '0 auto',
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '42px',
  alignItems: 'center',
  position: 'relative',
  zIndex: 1,
}

const aboutTitleStyle = {
  fontSize: 'clamp(30px, 3vw, 42px)',
  lineHeight: 1.1,
  letterSpacing: '-0.05em',
  marginBottom: '14px',
}

const aboutTextStyle = {
  color: 'rgba(255,255,255,0.82)',
  fontSize: '16px',
}

const stepsStyle = {
  display: 'grid',
  gap: '14px',
}

const stepStyle = {
  backgroundColor: 'rgba(255,255,255,0.13)',
  border: '1px solid rgba(255,255,255,0.18)',
  borderRadius: '16px',
  padding: '16px 18px',
  display: 'grid',
  gridTemplateColumns: '42px 1fr',
  alignItems: 'center',
  gap: '14px',
  backdropFilter: 'blur(10px)',
}

const stepNumberStyle = {
  width: '42px',
  height: '42px',
  borderRadius: '50%',
  backgroundColor: white,
  color: red,
  display: 'grid',
  placeItems: 'center',
  fontSize: '18px',
}

const stepTextStyle = {
  color: white,
  fontWeight: 700,
}
