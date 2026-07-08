import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, setToken, setUser, isAuthenticated } from '../api'
import { theme } from '../styles/theme'

/* ─── useTypewriter ──────────────────────────────────────────────────── */
function useTypewriter(text, speed = 45) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)
  useEffect(() => {
    setDisplayed('')
    setDone(false)
    if (!text) return
    let i = 0
    const id = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) { clearInterval(id); setDone(true) }
    }, speed)
    return () => clearInterval(id)
  }, [text, speed])
  return { displayed, done }
}

/* ─── Icons ──────────────────────────────────────────────────────────── */
const IcEmail = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke={theme.colors.primary} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
)
const IcLock = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke={theme.colors.primary} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
)
const IcEyeOpen = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
)
const IcEyeClosed = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
)
const IcAlert = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0 }}>
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
)

/* ─── FField ─────────────────────────────────────────────────────────── */
function FField({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
      <label style={{ fontSize: '13px', fontWeight: '600', color: theme.colors.textMedium }}>{label}</label>
      {children}
    </div>
  )
}

/* ─── helpers ─────────────────────────────────────────────────────────── */
function borderColor(valid, invalid) {
  if (valid)   return '#10B981'
  if (invalid) return '#EF4444'
  return theme.colors.border
}

const baseInput = {
  width: '100%',
  padding: '11px 14px 11px 42px',
  borderRadius: theme.borderRadius.md,
  fontSize: '14px',
  color: theme.colors.textDark,
  outline: 'none',
  fontFamily: theme.fonts.main,
  boxSizing: 'border-box',
  transition: 'border-color 0.18s ease, box-shadow 0.18s ease',
  backgroundColor: '#FFFFFF',
}

export default function Login() {
  const [email,       setEmail]       = useState('')
  const [password,    setPassword]    = useState('')
  const [showPass,    setShowPass]    = useState(false)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState(null)
  const [attempts,    setAttempts]    = useState(0)
  const [lockoutTime, setLockoutTime] = useState(null)
  const [touched,     setTouched]     = useState({ email: false, password: false })
  const navigate = useNavigate()

  const { displayed, done } = useTypewriter('Ingreso Clínico', 50)

  useEffect(() => {
    if (isAuthenticated()) navigate('/dashboard')
    const saved = localStorage.getItem('login_lockout_until')
    if (saved) {
      const remaining = new Date(saved) - new Date()
      if (remaining > 0) setLockoutTime(new Date(saved))
      else localStorage.removeItem('login_lockout_until')
    }
  }, [navigate])

  useEffect(() => {
    if (!lockoutTime) return
    const timer = setInterval(() => {
      if (lockoutTime - new Date() <= 0) {
        setLockoutTime(null)
        setAttempts(0)
        localStorage.removeItem('login_lockout_until')
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [lockoutTime])

  const emailValid   = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const emailInvalid = touched.email && email.length > 0 && !emailValid
  const passValid    = password.length >= 6
  const passInvalid  = touched.password && password.length > 0 && !passValid

  const canSubmit = emailValid && password.length > 0 && !loading && !lockoutTime

  const handleLogin = async (e) => {
    e.preventDefault()
    if (lockoutTime) return
    setLoading(true)
    setError(null)
    try {
      const data = await api.login({ email, password })
      setToken(data.access_token)
      setUser({ id: data.user_id, nombre_completo: data.nombre_completo, email: data.email })
      setAttempts(0)
      navigate('/dashboard')
    } catch (err) {
      const next = attempts + 1
      setAttempts(next)
      if (next >= 5) {
        const blockUntil = new Date(Date.now() + 60_000)
        setLockoutTime(blockUntil)
        localStorage.setItem('login_lockout_until', blockUntil.toISOString())
        setError('Demasiados intentos fallidos. Cuenta bloqueada por 1 minuto (DevSecOps 429).')
      } else {
        setError(err.message || 'Credenciales incorrectas.')
      }
    } finally {
      setLoading(false)
    }
  }

  const getLockoutSeconds = () => Math.max(0, Math.ceil((lockoutTime - new Date()) / 1000))

  return (
    <>
      <style>{`
        .lg-submit-btn {
          background-color: ${theme.colors.primary};
          color: #FFFFFF;
          border: none;
          border-radius: ${theme.borderRadius.md};
          padding: 13px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          width: 100%;
          margin-top: 8px;
          font-family: ${theme.fonts.main};
          transition: background-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
          box-shadow: 0 4px 14px rgba(220,38,38,0.18);
          letter-spacing: 0.1px;
        }
        .lg-submit-btn:hover:not(:disabled) {
          background-color: #10B981 !important;
          box-shadow: 0 6px 18px rgba(16,185,129,0.28) !important;
          transform: translateY(-1px);
        }
        .lg-submit-btn:disabled {
          background-color: ${theme.colors.textLight};
          cursor: not-allowed;
          box-shadow: none;
        }
        .lg-eye-btn {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          color: ${theme.colors.textLight};
          transition: color 0.15s ease;
          border-radius: 4px;
        }
        .lg-eye-btn:hover { color: ${theme.colors.primary}; }
        .lg-input { border: 1.5px solid; }
        .lg-link:hover { text-decoration: underline; }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: '24px 16px' }}>
        <div style={{
          backgroundColor: theme.colors.bgPrimary,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.borderRadius.lg,
          width: '100%',
          maxWidth: '440px',
          boxShadow: theme.shadows.card,
          overflow: 'hidden',
        }}>

          {/* ── Red header with typewriter ── */}
          <div style={{
            backgroundColor: theme.colors.primary,
            padding: '28px 32px 26px',
            textAlign: 'center',
          }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#FFFFFF', letterSpacing: '-0.3px', margin: 0 }}>
                {displayed}
                {!done && (
                  <span style={{
                    display: 'inline-block',
                    width: '2px',
                    height: '0.85em',
                    backgroundColor: '#FFFFFF',
                    marginLeft: '2px',
                    verticalAlign: 'middle',
                    animation: 'blink 1s step-end infinite',
                  }}/>
                )}
              </h1>
            </div>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', fontWeight: '500', margin: 0 }}>
              Acceso seguro para ciudadanos a la Ficha Vital
            </p>
          </div>

          <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>

          {/* ── Form body ── */}
          <div style={{ padding: '28px 32px 32px' }}>

            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '11px 14px',
                backgroundColor: theme.colors.dangerLight,
                border: `1px solid ${theme.colors.primaryBorder}`,
                borderRadius: theme.borderRadius.md,
                color: theme.colors.primary,
                fontSize: '13px', fontWeight: '500',
                marginBottom: '20px', lineHeight: '1.4',
              }}>
                <IcAlert/>
                <span>{error}</span>
              </div>
            )}

            {lockoutTime && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '11px 14px',
                backgroundColor: theme.colors.warningLight || '#FFFBEB',
                border: '1px solid #FEF3C7',
                borderRadius: theme.borderRadius.md,
                color: theme.colors.warning || '#D97706',
                fontSize: '13px', fontWeight: '500',
                marginBottom: '20px', lineHeight: '1.4',
              }}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0 }}>
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <span>Seguridad activa: Espere {getLockoutSeconds()}s para reintentar</span>
              </div>
            )}

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

              {/* Email */}
              <FField label="Correo Electrónico">
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <span style={{ position: 'absolute', left: '13px', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                    <IcEmail/>
                  </span>
                  <input
                    className="lg-input"
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onBlur={() => setTouched(t => ({ ...t, email: true }))}
                    placeholder="ejemplo@correo.com"
                    disabled={loading || !!lockoutTime}
                    style={{
                      ...baseInput,
                      borderColor: borderColor(touched.email && emailValid, emailInvalid),
                      boxShadow: touched.email && emailValid
                        ? '0 0 0 3px rgba(16,185,129,0.1)'
                        : emailInvalid
                        ? '0 0 0 3px rgba(239,68,68,0.1)'
                        : 'none',
                    }}
                  />
                  {touched.email && email.length > 0 && (
                    <span style={{ position: 'absolute', right: '12px', display: 'flex', alignItems: 'center' }}>
                      {emailValid
                        ? <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#10B981" strokeWidth="2.8"><polyline points="20 6 9 17 4 12"/></svg>
                        : <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#EF4444" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      }
                    </span>
                  )}
                </div>
                {emailInvalid && (
                  <span style={{ fontSize: '12px', color: '#EF4444', fontWeight: '500' }}>
                    Ingresa un correo electrónico válido.
                  </span>
                )}
              </FField>

              {/* Password */}
              <FField label="Contraseña">
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <span style={{ position: 'absolute', left: '13px', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                    <IcLock/>
                  </span>
                  <input
                    className="lg-input"
                    type={showPass ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onBlur={() => setTouched(t => ({ ...t, password: true }))}
                    placeholder="••••••••"
                    disabled={loading || !!lockoutTime}
                    style={{
                      ...baseInput,
                      paddingRight: '42px',
                      borderColor: borderColor(touched.password && passValid, passInvalid),
                      boxShadow: touched.password && passValid
                        ? '0 0 0 3px rgba(16,185,129,0.1)'
                        : passInvalid
                        ? '0 0 0 3px rgba(239,68,68,0.1)'
                        : 'none',
                    }}
                  />
                  <button
                    type="button"
                    className="lg-eye-btn"
                    onClick={() => setShowPass(s => !s)}
                    tabIndex={-1}
                    title={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPass ? <IcEyeClosed/> : <IcEyeOpen/>}
                  </button>
                </div>
                {passInvalid && (
                  <span style={{ fontSize: '12px', color: '#EF4444', fontWeight: '500' }}>
                    La contraseña debe tener al menos 6 caracteres.
                  </span>
                )}
              </FField>

              <button type="submit" className="lg-submit-btn" disabled={loading || !!lockoutTime}>
                {loading ? 'Validando...' : 'Iniciar Sesión'}
              </button>
            </form>

            <div style={{
              display: 'flex', justifyContent: 'center', alignItems: 'center',
              gap: '8px', marginTop: '24px',
              fontSize: '13px', color: theme.colors.textMedium, fontWeight: '500',
            }}>
              <span>¿No tienes una cuenta vital?</span>
              <Link to="/register" className="lg-link" style={{ color: theme.colors.primary, fontWeight: '700', textDecoration: 'none' }}>
                Crear una cuenta
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
