import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, setToken, setUser, isAuthenticated } from '../api'
import { theme } from '../styles/theme'

/* ─── Configuración de documentos ─────────────────────────────────── */
const DOCS = {
  DNI:       { label: 'DNI',        desc: 'Documento Nacional de Identidad', maxLen: 8,  pattern: /^\d+$/,        hint: 'Solo 8 dígitos numéricos' },
  CE:        { label: 'CE',         desc: 'Carnet de Extranjería',           maxLen: 12, pattern: /^[A-Z0-9]+$/i, hint: 'Letras y números, máx. 12' },
  PASAPORTE: { label: 'Pasaporte',  desc: 'Pasaporte',                       maxLen: 12, pattern: /^[A-Z0-9]+$/i, hint: 'Letras y números, máx. 12' },
}

const ONLY_LETTERS = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/

const FIELDS_TO_VALIDATE = [
  'nombres', 'apellido_paterno', 'apellido_materno',
  'numero_documento', 'telefono', 'email', 'password', 'confirmPassword',
]

/* ─── Validadores ──────────────────────────────────────────────────── */
function validateField(name, value, form) {
  switch (name) {
    case 'nombres':
      if (!value.trim()) return 'Los nombres son requeridos.'
      if (/\d/.test(value)) return 'No se permiten números en los nombres.'
      if (!ONLY_LETTERS.test(value.trim())) return 'Solo se permiten letras.'
      return null
    case 'apellido_paterno':
      if (!value.trim()) return 'El apellido paterno es requerido.'
      if (/\d/.test(value)) return 'No se permiten números en el apellido.'
      if (!ONLY_LETTERS.test(value.trim())) return 'Solo se permiten letras.'
      return null
    case 'apellido_materno':
      if (!value.trim()) return null
      if (/\d/.test(value)) return 'No se permiten números en el apellido.'
      if (!ONLY_LETTERS.test(value.trim())) return 'Solo se permiten letras.'
      return null
    case 'numero_documento': {
      const doc = DOCS[form.tipo_documento]
      if (!value) return 'El número de documento es requerido.'
      if (form.tipo_documento === 'DNI' && value.length !== 8) return 'El DNI debe tener exactamente 8 dígitos.'
      if (form.tipo_documento !== 'DNI' && value.length < 5) return `Mínimo 5 caracteres para ${doc.label}.`
      if (!doc.pattern.test(value)) return doc.hint
      return null
    }
    case 'telefono':
      if (!value) return null
      if (value.length !== 9) return 'El celular debe tener 9 dígitos.'
      if (!value.startsWith('9')) return 'El celular debe comenzar con 9.'
      return null
    case 'email':
      if (!value.trim()) return 'El correo es requerido.'
      if (!value.includes('@')) return 'El correo debe contener "@".'
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Ingrese un correo válido.'
      return null
    case 'password':
      if (!value) return 'La contraseña es requerida.'
      if (value.length < 6) return 'Mínimo 6 caracteres.'
      return null
    case 'confirmPassword':
      if (!value) return 'Confirme su contraseña.'
      if (value !== form.password) return 'Las contraseñas no coinciden.'
      return null
    default:
      return null
  }
}

/* ─── Íconos de sección ────────────────────────────────────────────── */
function IconUser() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke={theme.colors.primary} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  )
}

function IconLock() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke={theme.colors.primary} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  )
}

/* ─── Custom select de tipo de documento ──────────────────────────── */
const DOC_ICONS = {
  DNI: (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2"/><path d="M8 10h.01M8 14h.01M11 10h5M11 14h5"/>
    </svg>
  ),
  CE: (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
    </svg>
  ),
  PASAPORTE: (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2"/><circle cx="12" cy="11" r="3"/>
      <path d="M8 7h1M15 7h1M8 17h8"/>
    </svg>
  ),
}

function DocSelect({ value, onChange, disabled }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" disabled={disabled} onClick={() => setOpen(o => !o)} style={docSelectBtnStyle(open)}>
        <span style={{ color: theme.colors.primary, display: 'flex' }}>{DOC_ICONS[value]}</span>
        <span style={{ flex: 1, textAlign: 'left', fontSize: '13.5px', color: theme.colors.textDark, fontWeight: '500' }}>
          {DOCS[value].label}
        </span>
        <span style={{ fontSize: '11px', color: theme.colors.textLight, marginRight: '4px' }}>
          {DOCS[value].desc}
        </span>
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke={theme.colors.textLight} strokeWidth="2.5"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.18s ease', flexShrink: 0 }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div style={docDropdownStyle}>
          {Object.entries(DOCS).map(([key, doc]) => (
            <button key={key} type="button"
              onClick={() => { onChange(key); setOpen(false) }}
              style={docOptionStyle(key === value)}
              onMouseEnter={e => { if (key !== value) e.currentTarget.style.backgroundColor = theme.colors.primaryLight }}
              onMouseLeave={e => { if (key !== value) e.currentTarget.style.backgroundColor = 'transparent' }}
            >
              <span style={{ color: key === value ? theme.colors.primary : theme.colors.textMedium, display: 'flex' }}>
                {DOC_ICONS[key]}
              </span>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: key === value ? theme.colors.primary : theme.colors.textDark }}>
                  {doc.label}
                </div>
                <div style={{ fontSize: '11px', color: theme.colors.textLight }}>{doc.desc}</div>
              </div>
              {key === value && (
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke={theme.colors.primary} strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Campo con validación visual ──────────────────────────────────── */
function ValidatedField({ label, error, touched, value, required, noIcon, children }) {
  const isValid = touched && !error && value
  const isError = touched && !!error

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <label style={labelStyle}>
        {label}{required && <span style={{ color: theme.colors.primary }}> *</span>}
      </label>
      <div style={{ position: 'relative' }}>
        {children}
        {/* Solo mostrar ícono de estado si noIcon=false (campos sin botón ojo) */}
        {!noIcon && (isValid || isError) && (
          <span style={fieldStatusIconStyle}>
            {isValid
              ? <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#10B981" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              : <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#EF4444" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            }
          </span>
        )}
      </div>
      {isError && <span style={fieldErrorStyle}>{error}</span>}
    </div>
  )
}

/* ─── Hook de efecto máquina de escribir ───────────────────────────── */
function useTypewriter(text, speed = 55) {
  const [displayed, setDisplayed] = useState('')
  useEffect(() => {
    setDisplayed('')
    let i = 0
    const id = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) clearInterval(id)
    }, speed)
    return () => clearInterval(id)
  }, [text, speed])
  return displayed
}

/* ─── Barra de progreso ────────────────────────────────────────────── */
const STEPS = [
  { label: 'Datos Personales',    fields: ['nombres', 'apellido_paterno', 'numero_documento'] },
  { label: 'Credenciales',         fields: ['email', 'password', 'confirmPassword'] },
  { label: 'Confirmación',         fields: [] },
]

function ProgressBar({ errors, touched, consentimiento }) {
  // Paso completado si todos sus campos requeridos son válidos y tocados
  const stepsCompleted = STEPS.map((step, i) => {
    if (i === 2) return consentimiento
    return step.fields.every(f => touched[f] && !errors[f])
  })

  // Paso activo: el primero no completado
  const activeStep = stepsCompleted.findIndex(c => !c)
  const currentStep = activeStep === -1 ? 3 : activeStep

  return (
    <div style={progressWrapStyle}>
      {STEPS.map((step, i) => {
        const done = stepsCompleted[i]
        const active = i === currentStep
        return (
          <div key={i} style={progressItemStyle}>
            {/* Línea conectora izquierda */}
            {i > 0 && (
              <div style={connectorStyle(stepsCompleted[i - 1])} />
            )}

            <div style={progressCircleStyle(done, active)}>
              {done
                ? <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                : <span style={{ fontSize: '11px', fontWeight: '700', color: active ? '#fff' : theme.colors.textLight }}>{i + 1}</span>
              }
            </div>
            <span style={progressLabelStyle(done, active)}>{step.label}</span>
          </div>
        )
      })}
    </div>
  )
}

/* ─── Componente principal ─────────────────────────────────────────── */
export default function Register() {
  const [form, setForm] = useState({
    nombres: '', apellido_paterno: '', apellido_materno: '',
    tipo_documento: 'DNI', numero_documento: '',
    telefono: '', email: '', password: '', confirmPassword: '',
  })
  const [touched, setTouched] = useState({})
  const [consentimiento, setConsentimiento] = useState(false)
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const navigate = useNavigate()

  const titleText = useTypewriter('Registro de Ficha Vital', 60)

  useEffect(() => {
    if (isAuthenticated()) navigate('/dashboard')
  }, [navigate])

  const errors = {}
  FIELDS_TO_VALIDATE.forEach(f => { errors[f] = validateField(f, form[f], form) })

  const allValid = FIELDS_TO_VALIDATE.every(f => !errors[f]) && consentimiento
  const passMatch = form.confirmPassword && form.password === form.confirmPassword

  const setField = (field) => (value) => {
    if (field === 'tipo_documento') {
      setForm(f => ({ ...f, tipo_documento: value, numero_documento: '' }))
      setTouched(t => ({ ...t, numero_documento: false }))
      return
    }
    setForm(f => ({ ...f, [field]: value }))
    setTouched(t => ({ ...t, [field]: true }))
  }

  const handleBlur = (field) => () => setTouched(t => ({ ...t, [field]: true }))

  const handleRegister = async (e) => {
    e.preventDefault()
    const allTouched = {}
    FIELDS_TO_VALIDATE.forEach(f => { allTouched[f] = true })
    setTouched(allTouched)
    if (FIELDS_TO_VALIDATE.some(f => errors[f])) return
    if (!consentimiento) { setServerError('Debe aceptar la política de consentimiento (Ley N° 29733).'); return }
    setLoading(true); setServerError(null)
    try {
      const data = await api.register({
        nombres: form.nombres.trim(),
        apellido_paterno: form.apellido_paterno.trim(),
        apellido_materno: form.apellido_materno.trim() || undefined,
        tipo_documento: form.tipo_documento,
        numero_documento: form.numero_documento.trim(),
        telefono: form.telefono.trim() || undefined,
        email: form.email.trim().toLowerCase(),
        password: form.password,
      })
      setToken(data.access_token)
      setUser({ id: data.user_id, nombre_completo: data.nombre_completo, email: data.email })
      setSuccess(true)
      setTimeout(() => navigate('/registro'), 2000)
    } catch (err) {
      setServerError(err.message || 'Error en el registro. Intente nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  const getInputStyle = (field) => {
    const isValid = touched[field] && !errors[field] && form[field]
    const isErr   = touched[field] && !!errors[field]
    return {
      ...baseInputStyle,
      borderColor: isValid ? '#10B981' : isErr ? '#EF4444' : theme.colors.border,
      boxShadow:   isValid ? '0 0 0 3px rgba(16,185,129,0.08)'
                 : isErr   ? '0 0 0 3px rgba(239,68,68,0.08)'
                 : theme.shadows.input,
    }
  }

  // Para campos de contraseña (tienen botón ojo a la derecha)
  const getPassInputStyle = (field) => {
    const isValid = touched[field] && !errors[field] && form[field]
    const isErr   = touched[field] && !!errors[field]
    return {
      ...baseInputStyle,
      paddingRight: '40px', // espacio para botón ojo
      borderColor: isValid ? '#10B981' : isErr ? '#EF4444' : theme.colors.border,
      boxShadow:   isValid ? '0 0 0 3px rgba(16,185,129,0.08)'
                 : isErr   ? '0 0 0 3px rgba(239,68,68,0.08)'
                 : theme.shadows.input,
    }
  }

  return (
    <>
      <style>{globalStyles}</style>

      {/* ── Overlay de éxito ── */}
      {success && (
        <div style={successOverlayStyle}>
          <div style={successModalStyle} className="success-modal-in">
            <div style={successCircleStyle} className="success-circle-pop">
              <svg viewBox="0 0 52 52" width="52" height="52">
                <circle cx="26" cy="26" r="25" fill="none" stroke="#10B981" strokeWidth="2.5" className="success-circle-draw" />
                <polyline points="14,27 22,35 38,18" fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="success-check-draw" />
              </svg>
            </div>
            <h2 style={successModalTitleStyle}>¡Cuenta creada exitosamente!</h2>
            <p style={successModalSubStyle}>Preparando tu Ficha Vital de Emergencia...</p>
            <div style={successProgressBgStyle}>
              <div style={successProgressFillStyle} className="success-progress-fill" />
            </div>
            <p style={successModalHintStyle}>Serás redirigido en un momento</p>
          </div>
        </div>
      )}

      <div style={containerStyle} className="animate-fade-in">
        <div style={cardStyle}>
          <div style={topBarStyle} />

          {/* ── Header ── */}
          <div style={headerAreaStyle}>
            {/* Título con fondo rojo y efecto máquina de escribir */}
            <div style={titleBoxStyle}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="8.5" cy="7" r="4"/>
                <line x1="20" y1="8" x2="20" y2="14"/>
                <line x1="17" y1="11" x2="23" y2="11"/>
              </svg>
              <span style={titleBoxTextStyle}>
                {titleText}
                <span className="cursor-blink">|</span>
              </span>
            </div>

            <p style={subtitleStyle}>Cree su cuenta para generar su código QR de emergencia</p>

            <ProgressBar errors={errors} touched={touched} consentimiento={consentimiento} />
          </div>

          {/* ── Alertas ── */}
          {serverError && (
            <div style={alertStyle('error')}>
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {serverError}
            </div>
          )}
          {success && (
            <div style={alertStyle('success')}>
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}>
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              ¡Cuenta creada exitosamente! Redirigiendo a tu ficha médica...
            </div>
          )}

          {/* ── Formulario ── */}
          <form onSubmit={handleRegister} style={formStyle} noValidate>

            <SectionHeader icon={<IconUser />} label="DATOS PERSONALES" />

            <div style={twoColStyle}>
              <ValidatedField label="Nombres" error={errors.nombres} touched={touched.nombres} value={form.nombres} required>
                <input value={form.nombres}
                  onChange={e => setField('nombres')(e.target.value.replace(/[0-9]/g, ''))}
                  onBlur={handleBlur('nombres')}
                  placeholder="Juan Carlos"
                  style={getInputStyle('nombres')}
                  disabled={loading || success}
                  className="mr-input" />
              </ValidatedField>

              <ValidatedField label="Apellido Paterno" error={errors.apellido_paterno} touched={touched.apellido_paterno} value={form.apellido_paterno} required>
                <input value={form.apellido_paterno}
                  onChange={e => setField('apellido_paterno')(e.target.value.replace(/[0-9]/g, ''))}
                  onBlur={handleBlur('apellido_paterno')}
                  placeholder="Pérez"
                  style={getInputStyle('apellido_paterno')}
                  disabled={loading || success}
                  className="mr-input" />
              </ValidatedField>
            </div>

            <div style={twoColStyle}>
              <ValidatedField label="Apellido Materno" error={errors.apellido_materno} touched={touched.apellido_materno} value={form.apellido_materno}>
                <input value={form.apellido_materno}
                  onChange={e => setField('apellido_materno')(e.target.value.replace(/[0-9]/g, ''))}
                  onBlur={handleBlur('apellido_materno')}
                  placeholder="Alva (opcional)"
                  style={getInputStyle('apellido_materno')}
                  disabled={loading || success}
                  className="mr-input" />
              </ValidatedField>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={labelStyle}>Tipo de Documento <span style={{ color: theme.colors.primary }}>*</span></label>
                <DocSelect value={form.tipo_documento} onChange={val => setField('tipo_documento')(val)} disabled={loading || success} />
              </div>
            </div>

            <div style={twoColStyle}>
              <ValidatedField label={`N° Documento · ${DOCS[form.tipo_documento].hint}`} error={errors.numero_documento} touched={touched.numero_documento} value={form.numero_documento} required>
                <input value={form.numero_documento}
                  onChange={e => {
                    let val = e.target.value
                    if (form.tipo_documento === 'DNI') val = val.replace(/\D/g, '')
                    else val = val.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
                    if (val.length <= DOCS[form.tipo_documento].maxLen) setField('numero_documento')(val)
                  }}
                  onBlur={handleBlur('numero_documento')}
                  placeholder={form.tipo_documento === 'DNI' ? '12345678' : form.tipo_documento === 'CE' ? 'AB1234567' : 'AB123456'}
                  maxLength={DOCS[form.tipo_documento].maxLen}
                  style={getInputStyle('numero_documento')}
                  disabled={loading || success}
                  className="mr-input" />
              </ValidatedField>

              <ValidatedField label="Celular (opcional)" error={errors.telefono} touched={touched.telefono} value={form.telefono}>
                <input value={form.telefono}
                  onChange={e => setField('telefono')(e.target.value.replace(/\D/g, '').slice(0, 9))}
                  onBlur={handleBlur('telefono')}
                  placeholder="9XXXXXXXX"
                  maxLength="9"
                  style={getInputStyle('telefono')}
                  disabled={loading || success}
                  className="mr-input" />
              </ValidatedField>
            </div>

            <SectionHeader icon={<IconLock />} label="CREDENCIALES DE ACCESO" />

            <ValidatedField label="Correo Electrónico" error={errors.email} touched={touched.email} value={form.email} required>
              <input type="email" value={form.email}
                onChange={e => setField('email')(e.target.value)}
                onBlur={handleBlur('email')}
                placeholder="juan.perez@correo.com"
                style={getInputStyle('email')}
                disabled={loading || success}
                className="mr-input" />
            </ValidatedField>

            <div style={twoColStyle}>
              {/* Contraseña — noIcon para no superponer check con ojo */}
              <ValidatedField label="Contraseña" error={errors.password} touched={touched.password} value={form.password} required noIcon>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setField('password')(e.target.value)}
                  onBlur={handleBlur('password')}
                  placeholder="Mínimo 6 caracteres"
                  style={getPassInputStyle('password')}
                  disabled={loading || success}
                  className="mr-input"
                />
                <button type="button" onClick={() => setShowPass(v => !v)} style={eyeBtnStyle} tabIndex={-1}>
                  <EyeIcon open={showPass} />
                </button>
              </ValidatedField>

              {/* Confirmar contraseña */}
              <ValidatedField label="Confirmar Contraseña" error={errors.confirmPassword} touched={touched.confirmPassword} value={form.confirmPassword} required noIcon>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={e => setField('confirmPassword')(e.target.value)}
                  onBlur={handleBlur('confirmPassword')}
                  placeholder="Repita su contraseña"
                  style={{
                    ...baseInputStyle,
                    paddingRight: '40px',
                    borderColor: touched.confirmPassword
                      ? (passMatch ? '#10B981' : (errors.confirmPassword ? '#EF4444' : theme.colors.border))
                      : theme.colors.border,
                    boxShadow: touched.confirmPassword && passMatch
                      ? '0 0 0 3px rgba(16,185,129,0.08)'
                      : touched.confirmPassword && errors.confirmPassword
                      ? '0 0 0 3px rgba(239,68,68,0.08)'
                      : theme.shadows.input,
                  }}
                  disabled={loading || success}
                  className="mr-input"
                />
                <button type="button" onClick={() => setShowConfirm(v => !v)} style={eyeBtnStyle} tabIndex={-1}>
                  <EyeIcon open={showConfirm} />
                </button>
              </ValidatedField>
            </div>

            {/* Consentimiento */}
            <div style={consentBoxStyle}>
              <input type="checkbox" id="consent" checked={consentimiento}
                onChange={e => setConsentimiento(e.target.checked)}
                style={checkboxStyle} disabled={loading || success} />
              <label htmlFor="consent" style={consentLabelStyle}>
                <strong>Consentimiento (Ley N° 29733):</strong> Autorizo la recopilación y tratamiento de mis datos de salud para ser expuestos exclusivamente a personal de emergencia en situaciones críticas.
              </label>
            </div>

            {/* Botón submit: verde si todo completo, rojo si no */}
            <button
              type="submit"
              disabled={loading || success}
              style={loading || success ? disabledBtnStyle : submitBtnStyle}
              className={!loading && !success ? (allValid ? 'mr-btn-ready' : 'mr-btn-primary') : ''}
            >
              {loading
                ? <><Spinner /> Creando cuenta...</>
                : success
                ? <><CheckIcon /> Cuenta creada</>
                : 'Registrarse y aceptar términos'
              }
            </button>
          </form>

          <div style={footerLinkStyle}>
            <span style={{ color: theme.colors.textMedium }}>¿Ya tienes una cuenta?</span>
            <Link to="/login" style={loginLinkStyle}>Iniciar sesión</Link>
          </div>
        </div>
      </div>
    </>
  )
}

/* ─── Subcomponentes ───────────────────────────────────────────────── */
function SectionHeader({ icon, label }) {
  return (
    <div style={sectionHeaderStyle}>
      <span style={sectionIconStyle}>{icon}</span>
      <span style={sectionLabelStyle}>{label}</span>
      <div style={{ flex: 1, height: '1px', backgroundColor: theme.colors.border }} />
    </div>
  )
}

function EyeIcon({ open }) {
  return open
    ? <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke={theme.colors.textLight} strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
    : <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke={theme.colors.textLight} strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
}

function Spinner() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5"
      style={{ marginRight: '7px', animation: 'spin 0.8s linear infinite', flexShrink: 0 }}>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5"
      style={{ marginRight: '7px', flexShrink: 0 }}>
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

/* ─── Estilos globales ─────────────────────────────────────────────── */
const globalStyles = `
  @keyframes spin      { to { transform: rotate(360deg); } }
  @keyframes fadeIn    { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
  @keyframes blink     { 0%,100% { opacity:1; } 50% { opacity:0; } }
  @keyframes overlayIn { from { opacity:0; } to { opacity:1; } }
  @keyframes modalPop  { from { opacity:0; transform:scale(0.88) translateY(16px); } to { opacity:1; transform:scale(1) translateY(0); } }
  @keyframes circlePop { from { transform:scale(0); } to { transform:scale(1); } }
  @keyframes progressFill { from { width:0%; } to { width:100%; } }
  @keyframes drawCircle {
    from { stroke-dasharray:0 157; }
    to   { stroke-dasharray:157 0; }
  }
  @keyframes drawCheck {
    from { stroke-dasharray:0 40; }
    to   { stroke-dasharray:40 0; }
  }

  .animate-fade-in { animation: fadeIn 0.35s ease; }
  .cursor-blink    { animation: blink 0.9s step-end infinite; font-weight:300; margin-left:1px; }

  .success-modal-in  { animation: modalPop 0.38s cubic-bezier(0.34,1.56,0.64,1) both; }
  .success-circle-pop { animation: circlePop 0.4s 0.25s cubic-bezier(0.34,1.56,0.64,1) both; }
  .success-circle-draw {
    stroke-dasharray: 0 157;
    animation: drawCircle 0.5s 0.15s ease-out forwards;
  }
  .success-check-draw {
    stroke-dasharray: 0 40;
    animation: drawCheck 0.35s 0.6s ease-out forwards;
  }
  .success-progress-fill {
    animation: progressFill 2s 0.4s ease-out forwards;
  }

  /* Botón rojo (formulario incompleto) */
  .mr-btn-primary {
    transition: all 0.2s cubic-bezier(0.4,0,0.2,1) !important;
  }
  .mr-btn-primary:hover:not(:disabled) {
    background-color: #B91C1C !important;
    box-shadow: 0 6px 20px rgba(220,38,38,0.32) !important;
    transform: translateY(-1px);
  }
  .mr-btn-primary:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(220,38,38,0.2) !important;
  }

  /* Botón verde (formulario completo y listo) */
  .mr-btn-ready {
    background-color: #DC2626 !important;
    transition: all 0.22s cubic-bezier(0.4,0,0.2,1) !important;
  }
  .mr-btn-ready:hover:not(:disabled) {
    background-color: #059669 !important;
    box-shadow: 0 6px 22px rgba(5,150,105,0.30) !important;
    transform: translateY(-1px);
  }
  .mr-btn-ready:active:not(:disabled) {
    transform: translateY(0);
  }

  .mr-input { transition: border-color 0.17s ease, box-shadow 0.17s ease !important; }
  .mr-input:focus { outline: none !important; }
`

/* ─── Estilos ──────────────────────────────────────────────────────── */
const containerStyle = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  minHeight: '80vh', padding: '32px 16px',
}

const cardStyle = {
  backgroundColor: theme.colors.bgPrimary,
  border: `1px solid ${theme.colors.border}`,
  borderRadius: theme.borderRadius.lg,
  width: '100%', maxWidth: '600px',
  boxShadow: '0 12px 40px rgba(15,23,42,0.07)',
  position: 'relative', overflow: 'hidden',
}

const topBarStyle = {
  height: '4px',
  background: 'linear-gradient(90deg, #DC2626 0%, #EF4444 60%, #F87171 100%)',
}

const headerAreaStyle = {
  padding: '26px 36px 20px',
  textAlign: 'center',
  borderBottom: `1px solid ${theme.colors.border}`,
  background: 'linear-gradient(180deg, #fff 0%, #fff8f8 100%)',
}

const titleBoxStyle = {
  display: 'inline-flex', alignItems: 'center', gap: '10px',
  backgroundColor: theme.colors.primary,
  padding: '10px 22px',
  borderRadius: theme.borderRadius.md,
  marginBottom: '14px',
  boxShadow: '0 4px 16px rgba(220,38,38,0.22)',
}

const titleBoxTextStyle = {
  fontSize: '18px', fontWeight: '800',
  color: '#fff', letterSpacing: '-0.3px',
  minWidth: '220px', textAlign: 'left',
}

const subtitleStyle = {
  fontSize: '13px', color: theme.colors.textLight,
  fontWeight: '500', margin: '0 0 18px',
}

/* ─── Progress bar ──────────── */
const progressWrapStyle = {
  display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
  gap: '0', marginTop: '4px',
}

const progressItemStyle = {
  display: 'flex', flexDirection: 'column', alignItems: 'center',
  gap: '5px', position: 'relative', flex: 1,
}

const connectorStyle = (done) => ({
  position: 'absolute', top: '10px', right: '50%', left: '-50%',
  height: '2px',
  backgroundColor: done ? '#10B981' : theme.colors.border,
  transition: 'background-color 0.3s ease',
  zIndex: 0,
})

const progressCircleStyle = (done, active) => ({
  width: '22px', height: '22px', borderRadius: '50%',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  backgroundColor: done ? '#10B981' : active ? theme.colors.primary : theme.colors.bgTertiary,
  border: `2px solid ${done ? '#10B981' : active ? theme.colors.primary : theme.colors.border}`,
  transition: 'all 0.3s ease',
  position: 'relative', zIndex: 1,
  boxShadow: active && !done ? '0 0 0 3px rgba(220,38,38,0.12)' : 'none',
})

const progressLabelStyle = (done, active) => ({
  fontSize: '10.5px', fontWeight: done || active ? '700' : '500',
  color: done ? '#059669' : active ? theme.colors.primary : theme.colors.textLight,
  transition: 'color 0.3s ease', textAlign: 'center',
  whiteSpace: 'nowrap',
})

/* ─── Form ────────────────────────────────────────────────────────── */
const formStyle = {
  display: 'flex', flexDirection: 'column', gap: '13px',
  padding: '22px 36px 26px',
}

const twoColStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '13px' }

const labelStyle = { fontSize: '12px', fontWeight: '600', color: theme.colors.textMedium }

const baseInputStyle = {
  width: '100%', padding: '10px 14px',
  border: `1px solid ${theme.colors.border}`,
  borderRadius: theme.borderRadius.md,
  fontSize: '13.5px', color: theme.colors.textDark,
  outline: 'none', boxShadow: theme.shadows.input,
  fontFamily: theme.fonts.main, boxSizing: 'border-box',
  backgroundColor: theme.colors.bgPrimary,
}

const fieldStatusIconStyle = {
  position: 'absolute', right: '11px', top: '50%',
  transform: 'translateY(-50%)',
  display: 'flex', alignItems: 'center', pointerEvents: 'none',
}

const fieldErrorStyle = {
  fontSize: '11px', color: '#EF4444', fontWeight: '500',
}

const eyeBtnStyle = {
  position: 'absolute', right: '11px', top: '50%',
  transform: 'translateY(-50%)',
  background: 'none', border: 'none', cursor: 'pointer',
  display: 'flex', alignItems: 'center', padding: '2px',
  zIndex: 1,
}

const sectionHeaderStyle = {
  display: 'flex', alignItems: 'center', gap: '7px',
  marginTop: '6px',
}

const sectionIconStyle = {
  display: 'flex', alignItems: 'center',
  backgroundColor: theme.colors.primaryLight,
  padding: '4px', borderRadius: '6px',
}

const sectionLabelStyle = {
  fontSize: '11px', fontWeight: '800',
  color: theme.colors.textDark,
  letterSpacing: '0.9px',
}

const consentBoxStyle = {
  display: 'flex', gap: '11px', padding: '13px 15px',
  backgroundColor: theme.colors.bgSecondary,
  border: `1px solid ${theme.colors.border}`,
  borderRadius: theme.borderRadius.md,
}

const checkboxStyle = {
  width: '15px', height: '15px', marginTop: '2px',
  cursor: 'pointer', accentColor: theme.colors.primary, flexShrink: 0,
}

const consentLabelStyle = {
  fontSize: '11.5px', color: theme.colors.textMedium,
  lineHeight: '1.5', cursor: 'pointer',
}

const submitBtnStyle = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px',
  backgroundColor: theme.colors.primary,
  color: '#fff', border: 'none',
  borderRadius: theme.borderRadius.md,
  padding: '13px', fontSize: '14px', fontWeight: '700',
  cursor: 'pointer',
  boxShadow: '0 4px 14px rgba(220,38,38,0.22)',
  marginTop: '4px', letterSpacing: '0.2px',
}

const disabledBtnStyle = {
  ...submitBtnStyle,
  backgroundColor: theme.colors.textLight,
  cursor: 'not-allowed', boxShadow: 'none',
}

const alertStyle = (type) => ({
  display: 'flex', alignItems: 'center', gap: '9px',
  margin: '0 36px 0',
  padding: '11px 15px',
  backgroundColor: type === 'error' ? theme.colors.dangerLight : theme.colors.successLight,
  border: `1px solid ${type === 'error' ? theme.colors.primaryBorder : '#A7F3D0'}`,
  borderRadius: theme.borderRadius.md,
  color: type === 'error' ? theme.colors.primary : theme.colors.success,
  fontSize: '13px', fontWeight: '500',
})

const footerLinkStyle = {
  display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
  padding: '15px 0 22px',
  fontSize: '13px', fontWeight: '500',
  borderTop: `1px solid ${theme.colors.border}`,
}

const loginLinkStyle = { color: theme.colors.primary, fontWeight: '700', textDecoration: 'none' }

/* ─── Success overlay ──────────────────────────────────────────────── */
const successOverlayStyle = {
  position: 'fixed', inset: 0, zIndex: 9999,
  backgroundColor: 'rgba(15,23,42,0.55)',
  backdropFilter: 'blur(4px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}

const successModalStyle = {
  backgroundColor: '#fff',
  borderRadius: '20px',
  padding: '44px 52px',
  textAlign: 'center',
  boxShadow: '0 24px 60px rgba(15,23,42,0.18)',
  maxWidth: '360px', width: '90%',
}

const successCircleStyle = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: '80px', height: '80px',
  borderRadius: '50%',
  backgroundColor: '#ECFDF5',
  marginBottom: '20px',
}

const successModalTitleStyle = {
  fontSize: '20px', fontWeight: '800',
  color: theme.colors.textDark, margin: '0 0 8px',
  letterSpacing: '-0.3px',
}

const successModalSubStyle = {
  fontSize: '14px', color: theme.colors.textMedium,
  fontWeight: '500', margin: '0 0 24px',
}

const successProgressBgStyle = {
  height: '4px', borderRadius: '2px',
  backgroundColor: theme.colors.bgTertiary,
  overflow: 'hidden', marginBottom: '12px',
}

const successProgressFillStyle = {
  height: '100%', borderRadius: '2px',
  backgroundColor: '#10B981', width: '0%',
}

const successModalHintStyle = {
  fontSize: '12px', color: theme.colors.textLight,
  fontWeight: '500', margin: 0,
}

/* ─── DocSelect ────────────────────────────────────────────────────── */
const docSelectBtnStyle = (open) => ({
  display: 'flex', alignItems: 'center', gap: '7px',
  width: '100%', padding: '10px 11px',
  border: `1px solid ${open ? theme.colors.primary : theme.colors.border}`,
  borderRadius: theme.borderRadius.md,
  backgroundColor: theme.colors.bgPrimary,
  cursor: 'pointer',
  boxShadow: open ? '0 0 0 3px rgba(220,38,38,0.10)' : theme.shadows.input,
  transition: 'all 0.17s ease',
  fontFamily: theme.fonts.main, boxSizing: 'border-box',
})

const docDropdownStyle = {
  position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
  backgroundColor: theme.colors.bgPrimary,
  border: `1px solid ${theme.colors.border}`,
  borderRadius: theme.borderRadius.md,
  boxShadow: '0 8px 24px rgba(15,23,42,0.10)',
  zIndex: 50, overflow: 'hidden',
}

const docOptionStyle = (selected) => ({
  display: 'flex', alignItems: 'center', gap: '9px',
  width: '100%', padding: '9px 13px',
  border: 'none', cursor: 'pointer',
  backgroundColor: selected ? theme.colors.primaryLight : 'transparent',
  transition: 'background-color 0.14s ease',
  fontFamily: theme.fonts.main, boxSizing: 'border-box',
})
