import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { theme } from '../styles/theme'

export default function EmergencyView() {
  const { token } = useParams()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [errorState, setErrorState] = useState(null)
  const [ficha, setFicha] = useState(null)

  // Grab scan source (QR or NFC) from URL query
  const viaNfc = searchParams.get('via') === 'nfc'

  useEffect(() => {
    async function loadEmergencyRecord() {
      try {
        setLoading(true)
        setErrorState(null)

        if (!token) {
          setErrorState({ code: 'token_invalido', message: 'Token de emergencia no especificado.' })
          return
        }

        // Call RPC: obtener_ficha_emergencia
        // Bypasses RLS to read only critical fields, automatically registers access in DB
        const { data, error: rpcError } = await supabase.rpc('obtener_ficha_emergencia', {
          p_token_uuid: token,
          p_ip: null, // Let Postgres capture or pass null
          p_user_agent: navigator.userAgent,
          p_via_nfc: viaNfc
        })

        if (rpcError) throw rpcError

        if (data?.error) {
          setErrorState({
            code: data.error,
            revocado_en: data.revocado_en ? new Date(data.revocado_en).toLocaleString() : null
          })
          return
        }

        setFicha(data)

      } catch (err) {
        setErrorState({
          code: 'server_error',
          message: err.message || 'Error de conexión con la central de salud.'
        })
      } finally {
        setLoading(false)
      }
    }

    loadEmergencyRecord()
  }, [token, viaNfc])

  const getAge = (dobString) => {
    if (!dobString) return 'N/A'
    const dob = new Date(dobString)
    const diffMs = Date.now() - dob.getTime()
    const ageDate = new Date(diffMs)
    return Math.abs(ageDate.getUTCFullYear() - 1970)
  }

  // Check if patient has any critical conditions that need immediate warnings
  const hasCriticalWarning = () => {
    if (!ficha) return false
    const criticalKeywords = ['marcapasos', 'hemofilia', 'epilepsia', 'cardiopatía', 'insuficiencia renal']
    const notesText = (ficha.notas || '').toLowerCase()
    
    const conditionMatch = (ficha.condiciones || []).some(c => 
      criticalKeywords.some(keyword => c.nombre.toLowerCase().includes(keyword))
    )
    const notesMatch = criticalKeywords.some(keyword => notesText.includes(keyword))
    
    return conditionMatch || notesMatch
  }

  if (loading) {
    return (
      <div style={spinnerContainerStyle}>
        <div style={pulseCrossStyle}>✚</div>
        <p style={{ color: theme.colors.textDark, marginTop: '20px', fontWeight: '700', fontSize: '18px', letterSpacing: '-0.3px' }}>
          ESTABLECIENDO CANAL VITAL SEGURO...
        </p>
        <p style={{ color: theme.colors.textLight, fontSize: '13px', marginTop: '6px', fontWeight: '500' }}>
          Verificando firma digital y registrando acceso en bitácora...
        </p>
      </div>
    )
  }

  // Handle Token Revoked or Invalid States
  if (errorState) {
    const isRevoked = errorState.code === 'token_revocado'
    return (
      <div style={errorContainerStyle} className="animate-fade-in">
        <div style={errorCardStyle}>
          <div style={errorIconWrapperStyle(isRevoked)}>
            {isRevoked ? (
              <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            )}
          </div>
          
          <h2 style={errorTitleStyle}>
            {isRevoked ? 'Código Vital Revocado' : 'Código Vital Invalido'}
          </h2>
          
          <p style={errorDescStyle}>
            {isRevoked 
              ? 'Este código de emergencia ha sido revocado y desactivado por el ciudadano titular por motivos de seguridad y control de privacidad (Ley N° 29733).'
              : 'El código QR o TAG NFC escaneado no coincide con ningún registro activo en el sistema MediRecord.'}
          </p>

          {isRevoked && errorState.revocado_en && (
            <div style={revocationBoxStyle}>
              <strong>Fecha de revocación:</strong>
              <span>{errorState.revocado_en}</span>
            </div>
          )}

          <div style={{ marginTop: '24px', borderTop: `1px solid ${theme.colors.border}`, paddingTop: '20px' }}>
            <span style={secureLabelStyle}>🛡️ MediRecord UNMSM | SQA 2026</span>
          </div>
        </div>
      </div>
    )
  }

  const criticalAlergias = (ficha?.alergias || []).filter(a => a.severidad === 'severa' || a.severidad === 'anafilaxia')
  const regularAlergias = (ficha?.alergias || []).filter(a => a.severidad === 'leve' || a.severidad === 'moderada')

  return (
    <div style={pageContainerStyle} className="animate-fade-in">
      
      {/* EMERGENCY GLOWING HEADER */}
      <div style={emergencyHeaderStyle}>
        <div style={emergencyHeaderLeftStyle}>
          <span style={livePulseDotStyle}></span>
          <div>
            <h1 style={emergencyTitleStyle}>Ficha Vital de Emergencia</h1>
            <p style={emergencySubtitleStyle}>Universidad Nacional Mayor de San Marcos</p>
          </div>
        </div>
        <span style={emergencyBadgeStyle}>HORA DORADA</span>
      </div>

      {/* CRITICAL ALERTS BANNER (PULSING) */}
      {hasCriticalWarning() && (
        <div style={criticalBannerStyle} className="pulse-emergency">
          <span style={{ fontSize: '20px' }}>⚠️</span>
          <div>
            <strong>ALERTA DE ALTO RIESGO CLÍNICO VIGENTE</strong>
            <p style={{ fontSize: '11px', marginTop: '2px', opacity: 0.9 }}>
              Revisar notas especiales y condiciones del paciente de inmediato.
            </p>
          </div>
        </div>
      )}

      {/* MAIN EMERGENCY GRID */}
      <div style={gridContainerStyle}>
        
        {/* TRIAGE HEADER SHIELD (BLOOD & ANAFILAXIA) */}
        <div style={triageSectionStyle}>
          
          {/* BLOOD CARD */}
          <div style={triageBloodCardStyle}>
            <span style={triageLabelStyle}>GRUPO SANGUÍNEO</span>
            <strong style={triageBloodValueStyle}>{ficha?.tipo_sangre}</strong>
            <span style={bloodWarningTextStyle}>Vital para Transfusión</span>
          </div>

          {/* ANAFILAXIA BANNER */}
          {criticalAlergias.length > 0 ? (
            <div style={triageAlergiaCardStyle}>
              <span style={triageLabelStyle}>PELIGRO DE ANAFILAXIA</span>
              <div style={alergiaDangerListStyle}>
                {criticalAlergias.map((a, i) => (
                  <div key={i} style={alergiaDangerItemStyle}>
                    ✚ {a.nombre.toUpperCase()} ({a.severidad})
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={triageAlergiaSafeCardStyle}>
              <span style={triageLabelStyle}>ALERGIAS SEVERAS</span>
              <strong style={{ fontSize: '20px', fontWeight: '800', marginTop: '6px' }}>NINGUNA REGISTRADA</strong>
            </div>
          )}
        </div>

        {/* GENERAL DEMOGRAPHICS */}
        <div style={cardStyle}>
          <h3 style={sectionTitleStyle}>Filiación y Métricas</h3>
          
          <div className="emergency-demo-grid">
            <div style={demoItemStyle}>
              <span style={demoLabelStyle}>Nombre del Paciente</span>
              <strong style={demoValueStyle}>{ficha?.nombre}</strong>
            </div>
            
            <div style={demoItemStyle}>
              <span style={demoLabelStyle}>Edad</span>
              <strong style={demoValueStyle}>{getAge(ficha?.fecha_nacimiento)} años</strong>
            </div>

            <div style={demoItemStyle}>
              <span style={demoLabelStyle}>Sexo</span>
              <strong style={demoValueStyle}>{ficha?.sexo?.toUpperCase()}</strong>
            </div>

            <div style={demoItemStyle}>
              <span style={demoLabelStyle}>Donante Órganos</span>
              <strong style={{ ...demoValueStyle, color: ficha?.donante_organos ? theme.colors.success : theme.colors.textMedium }}>
                {ficha?.donante_organos ? 'SÍ' : 'NO'}
              </strong>
            </div>

            <div style={demoItemStyle}>
              <span style={demoLabelStyle}>Peso</span>
              <strong style={demoValueStyle}>{ficha?.peso_kg ? `${ficha.peso_kg} Kg` : 'N/R'}</strong>
            </div>

            <div style={demoItemStyle}>
              <span style={demoLabelStyle}>Estatura</span>
              <strong style={demoValueStyle}>{ficha?.altura_cm ? `${ficha.altura_cm} cm` : 'N/R'}</strong>
            </div>
          </div>
        </div>

        {/* CLINICAL SPECIAL NOTES */}
        {ficha?.notas && (
          <div style={notesCardStyle}>
            <h3 style={{ ...sectionTitleStyle, color: theme.colors.primary }}>Notas Clínicas y Dispositivos Implantados</h3>
            <p style={notesTextStyle}>{ficha.notas}</p>
          </div>
        )}

        {/* ALERGIAS Y CONDICIONES LIST */}
        <div className="emergency-dual-grid">
          
          {/* ALERGIAS */}
          <div style={cardStyle}>
            <h3 style={sectionTitleStyle}>Alergias Clínicas</h3>
            {regularAlergias.length === 0 && criticalAlergias.length === 0 ? (
              <p style={emptyStateStyle}>No se reportan alergias.</p>
            ) : (
              <div style={listStyle}>
                {[...criticalAlergias, ...regularAlergias].map((a, i) => (
                  <div key={i} style={itemStyle(a.severidad === 'severa' || a.severidad === 'anafilaxia')}>
                    <div>
                      <strong style={itemTitleStyle}>{a.nombre}</strong>
                      {a.reaccion && <p style={itemSubStyle}>Reacción: {a.reaccion}</p>}
                    </div>
                    <span style={itemBadgeStyle(a.severidad)}>{a.severidad.toUpperCase()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CONDICIONES CRÓNICAS */}
          <div style={cardStyle}>
            <h3 style={sectionTitleStyle}>Condiciones Médicas</h3>
            {(!ficha?.condiciones || ficha.condiciones.length === 0) ? (
              <p style={emptyStateStyle}>No se reportan patologías crónicas activas.</p>
            ) : (
              <div style={listStyle}>
                {ficha.condiciones.map((c, i) => (
                  <div key={i} style={itemStyle(false)}>
                    <div>
                      <strong style={itemTitleStyle}>{c.nombre}</strong>
                      {c.tratamiento && <p style={itemSubStyle}>Tratamiento: {c.tratamiento}</p>}
                    </div>
                    <span style={conditionBadgeStyle}>{c.estado.toUpperCase()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* EMERGENCY CONTACTS (TAP TO CALL) */}
        <div style={cardStyle}>
          <h3 style={{ ...sectionTitleStyle, color: theme.colors.success }}>
            Contactos de Emergencia (Llamar Directamente)
          </h3>
          
          {(!ficha?.contactos || ficha.contactos.length === 0) ? (
            <p style={emptyStateStyle}>No se registraron contactos de emergencia.</p>
          ) : (
            <div style={contactListStyle}>
              {ficha.contactos.map((c, i) => (
                <a key={i} href={`tel:${c.telefono}`} style={contactCallCardStyle}>
                  <div style={contactDetailsStyle}>
                    <div style={priorityBadgeStyle}>Prioridad {i + 1}</div>
                    <strong style={contactNameStyle}>{c.nombre}</strong>
                    <span style={contactRelStyle}>{c.relacion.toUpperCase()}</span>
                  </div>
                  <div style={callIconWrapperStyle}>
                    <span style={{ fontSize: '18px' }}>📞</span>
                    <span style={callLabelStyle}>LLAMAR</span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* AUDIT SHIELD */}
        <div style={auditFooterStyle}>
          <span style={{ fontWeight: '700' }}>ACCESO REGISTRADO EN BITÁCORA DE AUDITORÍA INMUTABLE</span>
          <p style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
            De acuerdo con la Ley N° 29733 y los protocolos DevSecOps de la UNMSM, este acceso ha sido firmado y registrado con su IP origen.
          </p>
        </div>

      </div>
    </div>
  )
}

// Styling definitions
const spinnerContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  backgroundColor: '#0F172A', // Dark screen for loading dramatic feel
}

const pulseCrossStyle = {
  fontSize: '64px',
  color: '#EF4444',
  animation: 'pulseEmergency 1.5s infinite',
}

const errorContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  backgroundColor: '#f8fafc',
  padding: '24px',
}

const errorCardStyle = {
  backgroundColor: theme.colors.bgPrimary,
  border: `1px solid ${theme.colors.border}`,
  borderRadius: theme.borderRadius.lg,
  padding: '40px',
  width: '100%',
  maxWidth: '480px',
  boxShadow: theme.shadows.dialog,
  textAlign: 'center',
}

const errorIconWrapperStyle = (isRevoked) => ({
  width: '72px',
  height: '72px',
  borderRadius: '50%',
  backgroundColor: isRevoked ? '#FEE2E2' : '#F1F5F9',
  color: isRevoked ? '#EF4444' : '#64748B',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '24px',
})

const errorTitleStyle = {
  fontSize: '22px',
  fontWeight: '800',
  color: theme.colors.textDark,
  letterSpacing: '-0.5px',
}

const errorDescStyle = {
  fontSize: '14px',
  color: theme.colors.textMedium,
  lineHeight: '1.5',
  marginTop: '12px',
  fontWeight: '500',
}

const revocationBoxStyle = {
  marginTop: '20px',
  padding: '12px 16px',
  backgroundColor: theme.colors.bgSecondary,
  border: `1px solid ${theme.colors.border}`,
  borderRadius: theme.borderRadius.md,
  fontSize: '12.5px',
  color: theme.colors.textMedium,
  display: 'flex',
  justifyContent: 'space-between',
}

const secureLabelStyle = {
  fontSize: '11px',
  fontWeight: '700',
  color: theme.colors.textLight,
  letterSpacing: '1px',
}

const pageContainerStyle = {
  maxWidth: '680px',
  margin: '0 auto',
  padding: '16px 16px 40px 16px',
}

const emergencyHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '16px 20px',
  backgroundColor: '#0F172A',
  borderRadius: theme.borderRadius.md,
  color: '#FFFFFF',
  marginBottom: '20px',
  boxShadow: '0 4px 20px rgba(15,23,42,0.15)',
}

const emergencyHeaderLeftStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
}

const livePulseDotStyle = {
  width: '10px',
  height: '10px',
  borderRadius: '50%',
  backgroundColor: '#EF4444',
  boxShadow: '0 0 0 0 rgba(239, 68, 68, 0.7)',
  animation: 'pulseEmergency 1.5s infinite',
}

const emergencyTitleStyle = {
  fontSize: '16px',
  fontWeight: '800',
  letterSpacing: '-0.3px',
}

const emergencySubtitleStyle = {
  fontSize: '10px',
  color: '#94A3B8',
  fontWeight: '600',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
}

const emergencyBadgeStyle = {
  fontSize: '9px',
  fontWeight: '800',
  backgroundColor: '#EF4444',
  color: '#FFFFFF',
  padding: '4px 10px',
  borderRadius: '4px',
  letterSpacing: '0.75px',
}

const criticalBannerStyle = {
  backgroundColor: '#BE123C',
  border: `1px solid #FDA4AF`,
  color: '#FFFFFF',
  padding: '16px 20px',
  borderRadius: theme.borderRadius.md,
  marginBottom: '20px',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  fontSize: '13px',
}

const gridContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
}

const triageSectionStyle = {
  display: 'grid',
  gridTemplateColumns: '160px 1fr',
  gap: '16px',
}

const triageBloodCardStyle = {
  backgroundColor: '#BE123C',
  color: '#FFFFFF',
  borderRadius: theme.borderRadius.lg,
  padding: '20px',
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 10px 25px rgba(190, 18, 60, 0.15)',
}

const triageLabelStyle = {
  fontSize: '9px',
  fontWeight: '800',
  letterSpacing: '0.75px',
  opacity: 0.9,
  textTransform: 'uppercase',
  display: 'block',
}

const triageBloodValueStyle = {
  fontSize: '48px',
  fontWeight: '900',
  lineHeight: '1',
  margin: '8px 0',
}

const bloodWarningTextStyle = {
  fontSize: '9px',
  fontWeight: '600',
  backgroundColor: 'rgba(255, 255, 255, 0.15)',
  padding: '2px 8px',
  borderRadius: '4px',
}

const triageAlergiaCardStyle = {
  backgroundColor: '#FEF2F2',
  border: `2px solid #FCA5A5`,
  borderRadius: theme.borderRadius.lg,
  padding: '20px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
}

const triageAlergiaSafeCardStyle = {
  ...triageAlergiaCardStyle,
  backgroundColor: '#ECFDF5',
  border: '2px solid #6EE7B7',
  color: theme.colors.success,
  alignItems: 'center',
}

const alergiaDangerListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  marginTop: '10px',
}

const alergiaDangerItemStyle = {
  fontSize: '14px',
  fontWeight: '800',
  color: '#991B1B',
}

const cardStyle = {
  backgroundColor: theme.colors.bgPrimary,
  border: `1px solid ${theme.colors.border}`,
  borderRadius: theme.borderRadius.lg,
  padding: '24px',
  boxShadow: theme.shadows.card,
}

const sectionTitleStyle = {
  fontSize: '14px',
  fontWeight: '800',
  color: theme.colors.textDark,
  textTransform: 'uppercase',
  letterSpacing: '0.75px',
  marginBottom: '16px',
  borderBottom: `2px solid ${theme.colors.border}`,
  paddingBottom: '8px',
}

const demographicsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '16px 20px',
}

const demoItemStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
}

const demoLabelStyle = {
  fontSize: '11px',
  fontWeight: '500',
  color: theme.colors.textLight,
}

const demoValueStyle = {
  fontSize: '15px',
  fontWeight: '700',
  color: theme.colors.textDark,
}

const notesCardStyle = {
  ...cardStyle,
  backgroundColor: '#FFFBEB',
  border: '1px solid #FCD34D',
}

const notesTextStyle = {
  fontSize: '14px',
  color: '#92400E',
  fontWeight: '600',
  lineHeight: '1.5',
}

const dualGridStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '16px',
}

const emptyStateStyle = {
  fontSize: '13px',
  color: theme.colors.textLight,
  textAlign: 'center',
  padding: '12px 0',
  fontWeight: '500',
}

const listStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
}

const itemStyle = (isSevere) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px',
  backgroundColor: isSevere ? theme.colors.dangerLight : theme.colors.bgSecondary,
  border: `1px solid ${isSevere ? theme.colors.primaryBorder : theme.colors.border}`,
  borderRadius: theme.borderRadius.md,
})

const itemTitleStyle = {
  fontSize: '14px',
  fontWeight: '700',
  color: theme.colors.textDark,
}

const itemSubStyle = {
  fontSize: '12px',
  color: theme.colors.textMedium,
  marginTop: '2px',
  fontWeight: '500',
}

const itemBadgeStyle = (severity) => {
  const isSevere = severity === 'severa' || severity === 'anafilaxia'
  return {
    fontSize: '9px',
    fontWeight: '800',
    backgroundColor: isSevere ? theme.colors.primary : theme.colors.warning,
    color: '#FFFFFF',
    padding: '2px 8px',
    borderRadius: '4px',
  }
}

const conditionBadgeStyle = {
  fontSize: '9px',
  fontWeight: '800',
  backgroundColor: theme.colors.textDark,
  color: '#FFFFFF',
  padding: '2px 8px',
  borderRadius: '4px',
}

const contactListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
}

const contactCallCardStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '16px 20px',
  backgroundColor: '#ECFDF5',
  border: '1px solid #A7F3D0',
  borderRadius: theme.borderRadius.lg,
  textDecoration: 'none',
  boxShadow: '0 4px 10px rgba(16, 185, 129, 0.04)',
  transition: theme.transitions.default,
  ':hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 14px rgba(16, 185, 129, 0.08)',
  }
}

const contactDetailsStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
}

const priorityBadgeStyle = {
  fontSize: '8px',
  fontWeight: '800',
  color: theme.colors.success,
  backgroundColor: '#D1FAE5',
  padding: '2px 6px',
  borderRadius: '4px',
  width: 'fit-content',
  marginBottom: '4px',
  letterSpacing: '0.5px',
}

const contactNameStyle = {
  fontSize: '16px',
  fontWeight: '800',
  color: theme.colors.textDark,
}

const contactRelStyle = {
  fontSize: '11px',
  fontWeight: '700',
  color: theme.colors.textMedium,
}

const callIconWrapperStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '4px',
  color: theme.colors.success,
}

const callLabelStyle = {
  fontSize: '9px',
  fontWeight: '800',
  letterSpacing: '0.75px',
}

const auditFooterStyle = {
  textAlign: 'center',
  padding: '24px',
  backgroundColor: '#0F172A',
  color: '#FFFFFF',
  borderRadius: theme.borderRadius.lg,
  fontSize: '12px',
}
