import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { theme } from '../styles/theme'

export default function Register() {
  const [nombreCompleto, setNombreCompleto] = useState('')
  const [dni, setDni] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [consentimiento, setConsentimiento] = useState(false)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('¡Registro exitoso! Redirigiendo al acceso clínico...')
  
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/dashboard')
    })
  }, [navigate])

  const handleRegister = async (e) => {
    e.preventDefault()
    
    // Validations
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    if (!/^\d{8}$/.test(dni)) {
      setError('El DNI debe contener exactamente 8 dígitos numéricos.')
      return
    }

    if (nombreCompleto.trim().length < 2) {
      setError('El nombre completo debe tener al menos 2 caracteres.')
      return
    }

    if (!consentimiento) {
      setError('Debe aceptar la política de consentimiento de datos según la Ley N° 29733.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const normalizedEmail = email.trim().toLowerCase()

      // 1. Supabase Auth Sign Up
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            nombre_completo: nombreCompleto.trim(),
            dni,
          },
        },
      })

      if (signUpError) throw signUpError

      const authUser = authData.user
      if (!authUser) {
        throw new Error('Supabase Auth no devolvió un usuario. Verifique que el registro por correo esté habilitado y que este correo no exista ya en Authentication > Users.')
      }

      if (!authData.session) {
        setError(null)
        setSuccess(true)
        setSuccessMessage('Cuenta creada. Revise su correo para confirmar la cuenta y luego inicie sesión.')
        setTimeout(() => {
          navigate('/login')
        }, 5000)
        return
      }

      // 2. Insert into custom "usuarios" table
      // We first check if the trigger has already inserted the user
      const { data: existingUser } = await supabase
        .from('usuarios')
        .select('id')
        .eq('auth_user_id', authUser.id)
        .maybeSingle()

      if (!existingUser) {
        const { error: dbError } = await supabase
          .from('usuarios')
          .insert([
            {
              auth_user_id: authUser.id,
              email: normalizedEmail,
              nombre_completo: nombreCompleto.trim(),
              dni: dni,
              activo: true,
            }
          ])

        if (dbError) {
          console.error("Error al insertar en usuarios:", dbError)
          throw new Error('Error al inicializar la base de datos de usuario: ' + dbError.message)
        }
      }

      setSuccess(true)
      setSuccessMessage('¡Registro exitoso! Redirigiendo al expediente clínico...')
      // Redirect to login or auto-login
      setTimeout(() => {
        navigate('/registro')
      }, 3000)

    } catch (err) {
      setError(err.message || 'Ocurrió un error en el registro. Intente nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={containerStyle} className="animate-fade-in">
      <div style={cardStyle}>
        <div style={headerDecorStyle}></div>
        
        <div style={headerStyle}>
          <div style={iconContainerStyle}>
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="8.5" cy="7" r="4"/>
              <line x1="20" y1="8" x2="20" y2="14"/>
              <line x1="17" y1="11" x2="23" y2="11"/>
            </svg>
          </div>
          <h2 style={titleStyle}>Registro de Ficha Vital</h2>
          <p style={subtitleStyle}>Cree su cuenta única para generar su código de emergencia</p>
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

        {success && (
          <div style={successContainerStyle}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleRegister} style={formStyle}>
          <div className="register-two-col">
            <div style={inputGroupStyle}>
              <label style={labelStyle}>Nombre Completo (como en DNI)</label>
              <input
                type="text"
                required
                value={nombreCompleto}
                onChange={(e) => setNombreCompleto(e.target.value)}
                placeholder="Juan Pérez Alva"
                style={inputStyle}
                disabled={loading || success}
              />
            </div>

            <div style={inputGroupStyle}>
              <label style={labelStyle}>DNI (8 dígitos)</label>
              <input
                type="text"
                maxLength="8"
                required
                value={dni}
                onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
                placeholder="12345678"
                style={inputStyle}
                disabled={loading || success}
              />
            </div>
          </div>

          <div style={inputGroupStyle}>
            <label style={labelStyle}>Correo Electrónico</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="juan.perez@unmsm.edu.pe"
              style={inputStyle}
              disabled={loading || success}
            />
          </div>

          <div className="register-two-col">
            <div style={inputGroupStyle}>
              <label style={labelStyle}>Contraseña</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                style={inputStyle}
                disabled={loading || success}
              />
            </div>

            <div style={inputGroupStyle}>
              <label style={labelStyle}>Confirmar Contraseña</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita contraseña"
                style={inputStyle}
                disabled={loading || success}
              />
            </div>
          </div>

          {/* Ley 29733 Protection Checkbox */}
          <div style={consentBoxStyle}>
            <input
              type="checkbox"
              id="consentimiento"
              checked={consentimiento}
              onChange={(e) => setConsentimiento(e.target.checked)}
              style={checkboxStyle}
              disabled={loading || success}
            />
            <label htmlFor="consentimiento" style={consentLabelStyle}>
              <strong>Consentimiento de Datos Personales (Ley N° 29733):</strong> Autorizo de manera previa, libre, expresa e inequívoca la recopilación, almacenamiento y tratamiento de mis datos de salud (sensibles) para el único propósito de ser expuestos exclusivamente a paramédicos y personal de emergencia en situaciones críticas.
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || success}
            style={loading || success ? disabledButtonStyle : buttonStyle}
          >
            {loading ? 'Creando cuenta...' : 'Registrarse y Aceptar Términos'}
          </button>
        </form>

        <div style={footerStyle}>
          <span>¿Ya tienes una cuenta clínica?</span>
          <Link to="/login" style={linkStyle}>Iniciar sesión</Link>
        </div>
      </div>
    </div>
  )
}

const containerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '80vh',
  padding: '20px 0',
}

const cardStyle = {
  backgroundColor: theme.colors.bgPrimary,
  border: `1px solid ${theme.colors.border}`,
  borderRadius: theme.borderRadius.lg,
  padding: '40px 32px',
  width: '100%',
  maxWidth: '560px',
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
  marginBottom: '28px',
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
  gap: '18px',
}

const twoColStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '16px',
}

const inputGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
}

const labelStyle = {
  fontSize: '13px',
  fontWeight: '600',
  color: theme.colors.textMedium,
}

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  border: `1px solid ${theme.colors.border}`,
  borderRadius: theme.borderRadius.md,
  fontSize: '14px',
  color: theme.colors.textDark,
  outline: 'none',
  transition: theme.transitions.fast,
  boxShadow: theme.shadows.input,
  fontFamily: theme.fonts.main,
}

const consentBoxStyle = {
  display: 'flex',
  gap: '12px',
  padding: '16px',
  backgroundColor: theme.colors.bgSecondary,
  border: `1px solid ${theme.colors.border}`,
  borderRadius: theme.borderRadius.md,
  marginTop: '4px',
}

const checkboxStyle = {
  width: '18px',
  height: '18px',
  marginTop: '3px',
  cursor: 'pointer',
  accentColor: theme.colors.primary,
  flexShrink: 0,
}

const consentLabelStyle = {
  fontSize: '11.5px',
  color: theme.colors.textMedium,
  lineHeight: '1.45',
  cursor: 'pointer',
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
  marginBottom: '16px',
}

const successContainerStyle = {
  ...errorContainerStyle,
  backgroundColor: theme.colors.successLight,
  border: '1px solid #A7F3D0',
  color: theme.colors.success,
}

const footerStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '8px',
  marginTop: '24px',
  fontSize: '13px',
  color: theme.colors.textMedium,
  fontWeight: '500',
}

const linkStyle = {
  color: theme.colors.primary,
  fontWeight: '600',
  textDecoration: 'none',
}
