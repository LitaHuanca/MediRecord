import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { theme } from './styles/theme'

// Layout & Route Guards
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

// Pages
import Login from './pages/Login'
import Register from './pages/Register'
import RegistroMultistep from './pages/RegistroMultistep'
import Dashboard from './pages/Dashboard'
import EmergencyView from './pages/EmergencyView'

function LandingPage() {
  const [session, setSession] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
  }, [])

  return (
    <div style={landingContainerStyle} className="animate-fade-in">
      <div style={heroWrapperStyle}>
        <div style={leftHeroStyle}>
          <span style={taglineStyle}>✚ MediRecord UNMSM</span>
          <h1 style={titleStyle}>Ficha Vital de Emergencia y Código QR</h1>
          <p style={descriptionStyle}>
            Plataforma para los ciudadanos de la Universidad Nacional Mayor de San Marcos. 
            Registre su historial médico crítico y genere un código QR/NFC que paramédicos 
            y socorristas pueden escanear en emergencias para salvar su vida en la Hora Dorada.
          </p>

          <div style={actionRowStyle}>
            {session ? (
              <Link to="/dashboard" style={primaryBtnStyle}>
                Ir a mi Dashboard Clínico &rarr;
              </Link>
            ) : (
              <>
                <Link to="/register" style={primaryBtnStyle}>
                  Registrar Ficha Vital Gratis
                </Link>
                <Link to="/login" style={secondaryBtnStyle}>
                  Iniciar Sesión
                </Link>
              </>
            )}
          </div>

          <div style={complianceRowStyle}>
            <span style={compBadgeStyle}>🛡️ Ley N° 29733 Compliant</span>
            <span style={compBadgeStyle}>💻 DevSecOps</span>
            <span style={compBadgeStyle}>🎓 UNMSM Grupo 5</span>
          </div>
        </div>

        <div style={rightHeroStyle}>
          <div style={visualShieldCardStyle}>
            <div style={shieldCrossIconStyle}>✚</div>
            <h3 style={shieldTitleStyle}>Ficha Vital Inmutable</h3>
            <p style={shieldDescStyle}>
              Sus datos médicos sensibles están encriptados y protegidos. Solo se exponen 
              al escanear su código físico en incidentes graves.
            </p>
            <div style={visualListStyle}>
              <div style={vListItemStyle}>✓ Acceso instantáneo en la Hora Dorada</div>
              <div style={vListItemStyle}>✓ Trazabilidad completa de accesos (IP e IP logs)</div>
              <div style={vListItemStyle}>✓ Revocación atómica de códigos QR y NFC</div>
            </div>
          </div>
        </div>
      </div>
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

// Styles for Welcome landing page
const landingContainerStyle = {
  padding: '40px 0',
}

const heroWrapperStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '48px',
  flexWrap: 'wrap',
}

const leftHeroStyle = {
  flex: '1.2',
  minWidth: '320px',
  textAlign: 'left',
}

const taglineStyle = {
  fontSize: '13px',
  fontWeight: '700',
  color: theme.colors.primary,
  backgroundColor: theme.colors.primaryLight,
  padding: '6px 12px',
  borderRadius: theme.borderRadius.sm,
  textTransform: 'uppercase',
  letterSpacing: '1px',
}

const titleStyle = {
  fontSize: '44px',
  fontWeight: '900',
  color: theme.colors.textDark,
  letterSpacing: '-1.5px',
  lineHeight: '1.15',
  margin: '24px 0 16px 0',
}

const descriptionStyle = {
  fontSize: '16px',
  color: theme.colors.textMedium,
  lineHeight: '1.6',
  marginBottom: '36px',
}

const actionRowStyle = {
  display: 'flex',
  gap: '16px',
  flexWrap: 'wrap',
  marginBottom: '40px',
}

const primaryBtnStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '14px 28px',
  backgroundColor: theme.colors.primary,
  color: '#FFFFFF',
  borderRadius: theme.borderRadius.md,
  fontSize: '15px',
  fontWeight: '700',
  boxShadow: '0 4px 14px rgba(220, 38, 38, 0.2)',
  transition: theme.transitions.default,
}

const secondaryBtnStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '14px 28px',
  backgroundColor: theme.colors.bgPrimary,
  border: `1px solid ${theme.colors.border}`,
  color: theme.colors.textMedium,
  borderRadius: theme.borderRadius.md,
  fontSize: '15px',
  fontWeight: '700',
  transition: theme.transitions.default,
}

const complianceRowStyle = {
  display: 'flex',
  gap: '12px',
  flexWrap: 'wrap',
}

const compBadgeStyle = {
  fontSize: '11px',
  fontWeight: '600',
  color: theme.colors.textLight,
  backgroundColor: theme.colors.bgTertiary,
  padding: '4px 10px',
  borderRadius: theme.borderRadius.sm,
}

const rightHeroStyle = {
  flex: '0.8',
  minWidth: '320px',
  display: 'flex',
  justifyContent: 'center',
}

const visualShieldCardStyle = {
  backgroundColor: theme.colors.bgPrimary,
  border: `1px solid ${theme.colors.border}`,
  borderRadius: theme.borderRadius.lg,
  padding: '36px',
  boxShadow: '0 20px 40px rgba(15, 23, 42, 0.05)',
  textAlign: 'center',
  width: '100%',
  maxWidth: '380px',
  position: 'relative',
}

const shieldCrossIconStyle = {
  width: '64px',
  height: '64px',
  borderRadius: '20px',
  backgroundColor: theme.colors.primaryLight,
  color: theme.colors.primary,
  fontSize: '32px',
  fontWeight: '300',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '20px',
  boxShadow: '0 8px 20px rgba(220, 38, 38, 0.1)',
  animation: 'pulseEmergency 2.5s infinite',
}

const shieldTitleStyle = {
  fontSize: '18px',
  fontWeight: '800',
  color: theme.colors.textDark,
  marginBottom: '8px',
}

const shieldDescStyle = {
  fontSize: '13px',
  color: theme.colors.textMedium,
  lineHeight: '1.5',
  marginBottom: '24px',
}

const visualListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  textAlign: 'left',
  borderTop: `1px solid ${theme.colors.border}`,
  paddingTop: '20px',
}

const vListItemStyle = {
  fontSize: '12px',
  fontWeight: '700',
  color: theme.colors.textMedium,
}
