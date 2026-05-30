import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { theme } from '../styles/theme'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [attempts, setAttempts] = useState(0)
  const [lockoutTime, setLockoutTime] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    // Se comprueba que el usuario ya tiene una sesión activa
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/dashboard')
    })

    const savedLockout = localStorage.getItem('login_lockout_until')
    if (savedLockout) {
      const remaining = new Date(savedLockout) - new Date()
      if (remaining > 0) {
        setLockoutTime(new Date(savedLockout))
      } else {
        localStorage.removeItem('login_lockout_until')
      }
    }
  }, [navigate])

  // Se cuenta los intentos fallidos y se bloquea el acceso por 1 minuto después de 5 intentos
  useEffect(() => {
    if (!lockoutTime) return
    const timer = setInterval(() => {
      const remaining = lockoutTime - new Date()
      if (remaining <= 0) {
        setLockoutTime(null)
        setAttempts(0)
        localStorage.removeItem('login_lockout_until')
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [lockoutTime])

  const handleLogin = async (e) => {
    e.preventDefault()
    if (lockoutTime) return

    setLoading(true)
    setError(null)

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        const nextAttempts = attempts + 1
        setAttempts(nextAttempts)
        if (nextAttempts >= 5) {
          const blockUntil = new Date(Date.now() + 60 * 1000) // 1 minute lockout
          setLockoutTime(blockUntil)
          localStorage.setItem('login_lockout_until', blockUntil.toISOString())
          throw new Error('Demasiados intentos fallidos. Cuenta bloqueada por 1 minuto (DevSecOps BPMN 429).')
        }
        throw authError
      }

      // Login exitoso, se limpia el contador de intentos
      setAttempts(0)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión. Verifique sus credenciales.')
    } finally {
      setLoading(false)
    }
  }

  const getLockoutSeconds = () => {
    if (!lockoutTime) return 0
    return Math.max(0, Math.ceil((lockoutTime - new Date()) / 1000))
  }

  return (
    <div style={containerStyle} className="animate-fade-in">
      <div style={cardStyle}>
        <div style={headerDecorStyle}></div>
        
        <div style={headerStyle}>
          <div style={iconContainerStyle}>
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <h2 style={titleStyle}>Ingreso Clínico</h2>
          <p style={subtitleStyle}>Acceso seguro para ciudadanos a la Ficha Vital</p>
        </div>

        {error && (
          <div style={errorContainerStyle}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>{error}</span>
          </div>
        )}

        {lockoutTime && (
          <div style={lockoutContainerStyle}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <span>Seguridad activa: Espere {getLockoutSeconds()}s para reintentar</span>
          </div>
        )}

        <form onSubmit={handleLogin} style={formStyle}>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Correo Electrónico</label>
            <div style={inputWrapperStyle}>
              <span style={inputIconStyle}>@</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@correo.com"
                style={inputStyle}
                disabled={loading || !!lockoutTime}
              />
            </div>
          </div>

          <div style={inputGroupStyle}>
            <label style={labelStyle}>Contraseña</label>
            <div style={inputWrapperStyle}>
              <span style={inputIconStyle}>🔑</span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={inputStyle}
                disabled={loading || !!lockoutTime}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !!lockoutTime}
            style={loading || !!lockoutTime ? disabledButtonStyle : buttonStyle}
          >
            {loading ? 'Validando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div style={footerStyle}>
          <span>¿No tienes una cuenta vital?</span>
          <Link to="/register" style={linkStyle}>Crear una cuenta</Link>
        </div>
      </div>
    </div>
  )
}

const containerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '60vh',
  padding: '20px 0',
}

const cardStyle = {
  backgroundColor: theme.colors.bgPrimary,
  border: `1px solid ${theme.colors.border}`,
  borderRadius: theme.borderRadius.lg,
  padding: '40px 32px',
  width: '100%',
  maxWidth: '440px',
  boxShadow: theme.shadows.card,
  position: 'relative',
  overflow: 'hidden',
}

const headerDecorStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  height: '6px',
  backgroundColor: theme.colors.primary,
}

const headerStyle = {
  textAlign: 'center',
  marginBottom: '32px',
}

const iconContainerStyle = {
  width: '56px',
  height: '56px',
  borderRadius: '16px',
  backgroundColor: theme.colors.primaryLight,
  color: theme.colors.primary,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '16px',
  boxShadow: '0 4px 14px rgba(220, 38, 38, 0.08)',
}

const titleStyle = {
  fontSize: '22px',
  fontWeight: '700',
  color: theme.colors.textDark,
  letterSpacing: '-0.3px',
}

const subtitleStyle = {
  fontSize: '13px',
  color: theme.colors.textLight,
  marginTop: '6px',
  fontWeight: '500',
}

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
}

const inputGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
}

const labelStyle = {
  fontSize: '13px',
  fontWeight: '600',
  color: theme.colors.textMedium,
}

const inputWrapperStyle = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
}

const inputIconStyle = {
  position: 'absolute',
  left: '14px',
  color: theme.colors.textLight,
  fontSize: '14px',
  fontWeight: '600',
}

const inputStyle = {
  width: '100%',
  padding: '12px 16px 12px 40px',
  border: `1px solid ${theme.colors.border}`,
  borderRadius: theme.borderRadius.md,
  fontSize: '15px',
  color: theme.colors.textDark,
  outline: 'none',
  transition: theme.transitions.fast,
  boxShadow: theme.shadows.input,
  fontFamily: theme.fonts.main,
}

const buttonStyle = {
  backgroundColor: theme.colors.primary,
  color: '#FFFFFF',
  border: 'none',
  borderRadius: theme.borderRadius.md,
  padding: '14px',
  fontSize: '15px',
  fontWeight: '600',
  cursor: 'pointer',
  boxShadow: '0 4px 14px rgba(220, 38, 38, 0.2)',
  transition: theme.transitions.default,
  marginTop: '10px',
}

const disabledButtonStyle = {
  ...buttonStyle,
  backgroundColor: theme.colors.textLight,
  cursor: 'not-allowed',
  boxShadow: 'none',
}

const errorContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '12px 16px',
  backgroundColor: theme.colors.dangerLight,
  border: `1px solid ${theme.colors.primaryBorder}`,
  borderRadius: theme.borderRadius.md,
  color: theme.colors.primary,
  fontSize: '13px',
  fontWeight: '500',
  marginBottom: '20px',
  lineHeight: '1.4',
}

const lockoutContainerStyle = {
  ...errorContainerStyle,
  backgroundColor: theme.colors.warningLight,
  border: '1px solid #FEF3C7',
  color: theme.colors.warning,
}

const footerStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '8px',
  marginTop: '28px',
  fontSize: '13px',
  color: theme.colors.textMedium,
  fontWeight: '500',
}

const linkStyle = {
  color: theme.colors.primary,
  fontWeight: '600',
  textDecoration: 'none',
}
