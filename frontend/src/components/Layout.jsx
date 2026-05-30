import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { theme } from '../styles/theme'

export default function Layout({ children }) {
  const [user, setUser] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // Check current user state
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  // Check if we are on the emergency page or dashboard, which manage their own layout
  const isEmergencyPage = location.pathname.startsWith('/emergency')
  const isDashboardPage = location.pathname === '/dashboard'

  if (isEmergencyPage) {
    return <div style={{ minHeight: '100vh', backgroundColor: theme.colors.bgSecondary }}>{children}</div>
  }

  if (isDashboardPage) {
    return <>{children}</>
  }

  return (
    <div style={containerStyle}>
      {/* HEADER */}
      <header style={headerStyle}>
        <div style={navContainerStyle}>
          <Link to="/" style={logoLinkStyle}>
            <div style={logoIconStyle}>
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19V5"/>
              </svg>
            </div>
            <div>
              <span style={logoTextStyle}>MediRecord</span>
              <span style={logoSubStyle}>Ficha Vital UNMSM</span>
            </div>
          </Link>

          <nav style={navLinksStyle}>
            {user ? (
              <>
                <Link to="/dashboard" style={location.pathname === '/dashboard' ? activeLinkStyle : linkStyle}>
                  Dashboard
                </Link>
                <Link to="/registro" style={location.pathname === '/registro' ? activeLinkStyle : linkStyle}>
                  Registrar Ficha
                </Link>
                <div style={userBadgeStyle}>
                  <div style={avatarStyle}>
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                  <span style={emailTextStyle} title={user.email}>{user.email?.split('@')[0]}</span>
                </div>
                <button onClick={handleLogout} style={logoutButtonStyle}>
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <>
                <Link to="/login" style={linkStyle}>
                  Iniciar Sesión
                </Link>
                <Link to="/register" style={signUpButtonStyle}>
                  Registrarse
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main style={mainStyle}>
        <div style={contentWrapperStyle}>
          {children}
        </div>
      </main>

      {/* FOOTER */}
      <footer style={footerStyle}>
        <div style={footerContainerStyle}>
          <div>
            <p style={footerTitleStyle}>MediRecord &copy; 2026</p>
            <p style={footerSubTextStyle}>Universidad Nacional Mayor de San Marcos</p>
          </div>
          <div style={footerMetaStyle}>
            <span style={footerTagStyle}>DevSecOps</span>
            <span style={footerTagStyle}>Ley N° 29733</span>
            <span style={footerTagStyle}>Grupo 5 SQA</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

const containerStyle = {
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  backgroundColor: theme.colors.bgSecondary,
}

const headerStyle = {
  backgroundColor: theme.colors.bgPrimary,
  borderBottom: `1px solid ${theme.colors.border}`,
  position: 'sticky',
  top: 0,
  zIndex: 100,
  boxShadow: '0 4px 20px rgba(15, 23, 42, 0.02)',
}

const navContainerStyle = {
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '16px 24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}

const logoLinkStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  textDecoration: 'none',
  color: theme.colors.textDark,
}

const logoIconStyle = {
  width: '38px',
  height: '38px',
  borderRadius: '10px',
  backgroundColor: theme.colors.primaryLight,
  color: theme.colors.primary,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 4px 10px rgba(220, 38, 38, 0.1)',
  animation: 'pulseEmergency 3s infinite',
}

const logoTextStyle = {
  fontSize: '20px',
  fontWeight: '700',
  color: theme.colors.textDark,
  display: 'block',
  letterSpacing: '-0.5px',
  lineHeight: '1.2',
}

const logoSubStyle = {
  fontSize: '11px',
  color: theme.colors.textLight,
  fontWeight: '500',
  display: 'block',
}

const navLinksStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '24px',
}

const linkStyle = {
  fontSize: '14px',
  fontWeight: '600',
  color: theme.colors.textMedium,
  textDecoration: 'none',
  padding: '8px 12px',
  borderRadius: theme.borderRadius.sm,
  transition: theme.transitions.fast,
}

const activeLinkStyle = {
  ...linkStyle,
  color: theme.colors.primary,
  backgroundColor: theme.colors.primaryLight,
}

const userBadgeStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '6px 12px',
  backgroundColor: theme.colors.bgTertiary,
  borderRadius: theme.borderRadius.full,
}

const avatarStyle = {
  width: '24px',
  height: '24px',
  borderRadius: '50%',
  backgroundColor: theme.colors.primary,
  color: '#ffffff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '12px',
  fontWeight: '700',
}

const emailTextStyle = {
  fontSize: '13px',
  fontWeight: '600',
  color: theme.colors.textMedium,
  maxWidth: '90px',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}

const signUpButtonStyle = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#FFFFFF',
  backgroundColor: theme.colors.primary,
  textDecoration: 'none',
  padding: '8px 16px',
  borderRadius: theme.borderRadius.md,
  boxShadow: '0 4px 10px rgba(220, 38, 38, 0.15)',
  transition: theme.transitions.fast,
}

const logoutButtonStyle = {
  fontSize: '13px',
  fontWeight: '600',
  color: theme.colors.textMedium,
  backgroundColor: 'transparent',
  border: `1px solid ${theme.colors.border}`,
  padding: '8px 14px',
  borderRadius: theme.borderRadius.md,
  cursor: 'pointer',
  transition: theme.transitions.fast,
}

const mainStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
}

const contentWrapperStyle = {
  maxWidth: '1200px',
  width: '100%',
  margin: '0 auto',
  padding: '40px 24px',
  flex: 1,
}

const footerStyle = {
  backgroundColor: theme.colors.textDark,
  color: '#FFFFFF',
  padding: '32px 24px',
  borderTop: `1px solid rgba(255, 255, 255, 0.05)`,
}

const footerContainerStyle = {
  maxWidth: '1200px',
  margin: '0 auto',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: '20px',
}

const footerTitleStyle = {
  fontSize: '15px',
  fontWeight: '700',
  letterSpacing: '0.2px',
}

const footerSubTextStyle = {
  fontSize: '12px',
  color: '#94A3B8',
  marginTop: '4px',
}

const footerMetaStyle = {
  display: 'flex',
  gap: '12px',
  flexWrap: 'wrap',
}

const footerTagStyle = {
  fontSize: '11px',
  fontWeight: '600',
  color: '#94A3B8',
  backgroundColor: 'rgba(255, 255, 255, 0.07)',
  padding: '4px 10px',
  borderRadius: theme.borderRadius.sm,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
}
