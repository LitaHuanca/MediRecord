import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { supabase } from '../../supabaseClient'

/* ─── SVG Icons ─── */
const IconCrossSmall = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
    <path d="M12 5v14M5 12h14"/>
  </svg>
)
const IconPhone = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.68h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.5 17.4z"/>
  </svg>
)
const IconHeart = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
)
const IconCrossRed = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round">
    <path d="M12 5v14M5 12h14"/>
  </svg>
)
const IconEye = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
)
const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const IconAlert = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
)
const IconDrop = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
  </svg>
)

export default function EmergencyView() {
  const { token } = useParams()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [errorState, setErrorState] = useState(null)
  const [ficha, setFicha] = useState(null)

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
        const { data, error: rpcError } = await supabase.rpc('obtener_ficha_emergencia', {
          p_token_uuid: token,
          p_ip: null,
          p_user_agent: navigator.userAgent,
          p_via_nfc: viaNfc
        })
        if (rpcError) throw rpcError
        if (data?.error) {
          setErrorState({ code: data.error, revocado_en: data.revocado_en ? new Date(data.revocado_en).toLocaleString() : null })
          return
        }
        setFicha(data)
      } catch (err) {
        setErrorState({ code: 'server_error', message: err.message || 'Error de conexión con la central de salud.' })
      } finally {
        setLoading(false)
      }
    }
    loadEmergencyRecord()
  }, [token, viaNfc])

  const getAge = (dobString) => {
    if (!dobString) return 'N/A'
    const dob = new Date(dobString)
    return Math.abs(new Date(Date.now() - dob.getTime()).getUTCFullYear() - 1970)
  }

  const maskDni = (dni) => {
    if (!dni || dni.length < 4) return '****'
    return '****' + dni.slice(-4)
  }

  const hasCriticalWarning = () => {
    if (!ficha) return false
    const criticalKeywords = ['marcapasos', 'hemofilia', 'epilepsia', 'cardiopatía', 'insuficiencia renal']
    const notesMatch = criticalKeywords.some(k => (ficha.notas || '').toLowerCase().includes(k))
    const conditionMatch = (ficha.condiciones || []).some(c => criticalKeywords.some(k => c.nombre.toLowerCase().includes(k)))
    return conditionMatch || notesMatch
  }

  // ── LOADING ───────────────────────────────────────────
  if (loading) {
    return (
      <div style={loadingContainerStyle}>
        {/* Top bar skeleton */}
        <div style={topBarStyle}>
          <div style={topBarLeftStyle}>
            <div style={logoCircleStyle}><IconCrossSmall /></div>
            <div>
              <p style={logoTextStyle}>MediRecord</p>
              <p style={logoSubStyle}>Ficha Vital de Emergencia</p>
            </div>
          </div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flex:1 }}>
          <div style={loadingSpinnerStyle}></div>
          <p style={{ color:'#111827', marginTop:20, fontWeight:700, fontSize:18 }}>ESTABLECIENDO CANAL VITAL...</p>
          <p style={{ color:'#6B7280', fontSize:13, marginTop:6, fontWeight:500 }}>Verificando firma digital y registrando acceso...</p>
        </div>
      </div>
    )
  }

  // ── ERROR ──────────────────────────────────────────────
  if (errorState) {
    const isRevoked = errorState.code === 'token_revocado'
    return (
      <div style={errorPageStyle}>
        <div style={topBarStyle}>
          <div style={topBarLeftStyle}>
            <div style={logoCircleStyle}><IconCrossSmall /></div>
            <div>
              <p style={logoTextStyle}>MediRecord</p>
              <p style={logoSubStyle}>Ficha Vital de Emergencia</p>
            </div>
          </div>
        </div>
        <div style={errorCardWrapStyle}>
          <div style={errorCardStyle}>
            <div style={errorIconCircleStyle(isRevoked)}>
              {isRevoked ? (
                <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              )}
            </div>
            <h2 style={errorTitleStyle}>{isRevoked ? 'Código Vital Revocado' : 'Código Vital Inválido'}</h2>
            <p style={errorDescStyle}>
              {isRevoked
                ? 'Este código ha sido revocado por el ciudadano titular. Contacte al personal de salud para asistencia.'
                : 'El código QR o TAG NFC escaneado no coincide con ningún registro activo en el sistema MediRecord.'}
            </p>
            {isRevoked && errorState.revocado_en && (
              <div style={revocationBoxStyle}>
                <strong>Fecha de revocación:</strong><span>{errorState.revocado_en}</span>
              </div>
            )}
            <p style={errorFooterStyle}>🛡️ MediRecord · Ley N° 29733 · SQA UNMSM 2026</p>
          </div>
        </div>
      </div>
    )
  }

  const criticalAlergias = (ficha?.alergias || []).filter(a => a.severidad === 'severa' || a.severidad === 'anafilaxia')
  const regularAlergias = (ficha?.alergias || []).filter(a => a.severidad === 'leve' || a.severidad === 'moderada')
  const allAlergias = [...criticalAlergias, ...regularAlergias]
  const primerContacto = ficha?.contactos?.[0]
  const primeraMedicacion = ficha?.medicamentos?.[0]
  const primeraCondicion = ficha?.condiciones?.[0]

  const patientInitials = ficha?.nombre
    ? ficha.nombre.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
    : '?'

  // ── MAIN VIEW ─────────────────────────────────────────
  return (
    <div style={pageStyle}>

      {/* ── TOP BAR ── */}
      <div style={topBarStyle}>
        <div style={topBarLeftStyle}>
          <div style={logoCircleStyle}><IconCrossSmall /></div>
          <div>
            <p style={logoTextStyle}>MediRecord</p>
            <p style={logoSubStyle}>Ficha Vital de Emergencia</p>
          </div>
        </div>
        <div style={verifiedPillStyle}>
          <span style={verifiedDotStyle}></span>
          Código activo y verificado
        </div>
      </div>

      {/* ── PAGE INNER ── */}
      <div style={innerStyle}>

        {/* ── HERO PATIENT CARD ── */}
        <div style={heroCardStyle}>
          <div style={heroCardInnerStyle}>
            {/* Patient identified badge */}
            <div style={patientBadgeStyle}>
              <span style={patientBadgeDotStyle}></span>
              Paciente identificado
            </div>

            {/* Avatar + name row */}
            <div style={patientRowStyle}>
              <div style={patientAvatarStyle}>{patientInitials}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <h1 style={patientNameStyle}>{ficha?.nombre}</h1>
                <div style={pillsRowStyle}>
                  <span style={infoPillStyle}>{getAge(ficha?.fecha_nacimiento)} años</span>
                  <span style={infoPillStyle}>{ficha?.sexo?.charAt(0).toUpperCase() + ficha?.sexo?.slice(1)}</span>
                  <span style={infoPillStyle}>DNI {maskDni(ficha?.dni)}</span>
                  {ficha?.donante_organos && (
                    <span style={{ ...infoPillStyle, backgroundColor:'#DCFCE7', color:'#166534' }}>
                      ✓ Donante
                    </span>
                  )}
                  <span style={{ ...infoPillStyle, backgroundColor:'#DCFCE7', color:'#166534' }}>
                    ✓ Ficha actualizada
                  </span>
                </div>
              </div>
              {/* Right side meta */}
              <div style={heroMetaStyle}>
                <p style={heroMetaLabelStyle}>ÚLTIMA ACTUALIZACIÓN</p>
                <p style={heroMetaValueStyle}>
                  {ficha?.ultima_actualizacion
                    ? new Date(ficha.ultima_actualizacion).toLocaleDateString('es-PE', { day:'numeric', month:'short', year:'numeric' })
                    : 'Registrado'}
                </p>
                <p style={heroMetaSubStyle}>Acceso registrado automáticamente en la bitácora de seguridad.</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── CRITICAL ALLERGY BANNER (only if severe) ── */}
        {criticalAlergias.length > 0 && (
          <div style={criticalAllergyBannerStyle}>
            <p style={criticalBannerLabelStyle}>ALERTA MÉDICA PRIORITARIA</p>
            <div style={criticalBannerBodyStyle}>
              <div style={criticalBannerIconStyle}>!</div>
              <div style={{ flex:1 }}>
                <p style={criticalBannerNameStyle}>
                  {criticalAlergias.map(a => a.nombre).join(' · ')}
                </p>
                <p style={criticalBannerDescStyle}>
                  {criticalAlergias[0]?.reaccion
                    ? `Reacción conocida: ${criticalAlergias[0].reaccion}`
                    : `Alergia ${criticalAlergias[0]?.severidad} — administrar tratamiento inmediato`}
                </p>
              </div>
              <span style={criticalBadgeStyle}>Visible primero</span>
            </div>
          </div>
        )}

        {/* ── QUICK ACTIONS ROW ── */}
        {primerContacto && (
          <div style={quickActionsGridStyle}>
            <a href={`tel:${primerContacto.telefono}`} style={quickCardStyle}>
              <div style={quickIconCircleStyle('#DCFCE7')}>
                <IconPhone />
              </div>
              <div>
                <p style={quickCardTitleStyle}>Llamar contacto</p>
                <p style={quickCardSubStyle}>{primerContacto.nombre} · {primerContacto.relacion}</p>
              </div>
            </a>
            <div style={quickCardStyle}>
              <div style={quickIconCircleStyle('#FEE2E2')}>
                <IconCrossRed />
              </div>
              <div>
                <p style={quickCardTitleStyle}>Ver datos clínicos</p>
                <p style={quickCardSubStyle}>Alergias, medicación y condiciones</p>
              </div>
            </div>
            <div style={quickCardStyle}>
              <div style={quickIconCircleStyle('#DBEAFE')}>
                <IconEye />
              </div>
              <div>
                <p style={quickCardTitleStyle}>Verificación</p>
                <p style={quickCardSubStyle}>Acceso registrado y auditado</p>
              </div>
            </div>
          </div>
        )}

        {/* ── MAIN GRID (left 55% / right 45%) ── */}
        <div style={mainGridStyle}>

          {/* ─ LEFT COLUMN ─ */}
          <div style={leftColStyle}>

            {/* Critical medical data section title */}
            <div style={sectionHeaderStyle}>
              <div style={sectionIconStyle}><IconCrossRed /></div>
              <div>
                <h2 style={sectionTitleStyle}>Datos médicos críticos</h2>
                <p style={sectionSubStyle}>Información priorizada para atención de primera respuesta.</p>
              </div>
            </div>

            {/* 2x2 data grid */}
            <div style={medGridStyle}>

              {/* Alergias */}
              <div style={medCardStyle}>
                <span style={medLabelStyle}>ALERGIAS</span>
                <div style={medIconAbsStyle}>
                  <span style={medIconCircleStyle('#FEF2F2')}><IconAlert /></span>
                </div>
                <p style={medValueStyle}>
                  {allAlergias.length > 0 ? allAlergias[0].nombre : 'Ninguna reportada'}
                </p>
                <p style={medDescStyle}>
                  {allAlergias.length > 1 ? `+ ${allAlergias.length - 1} más · ` : ''}
                  {allAlergias.length > 0 ? `Severidad: ${allAlergias[0].severidad}` : 'Sin alergias conocidas registradas'}
                </p>
              </div>

              {/* Tipo de sangre */}
              <div style={medCardStyle}>
                <span style={medLabelStyle}>TIPO DE SANGRE</span>
                <div style={medIconAbsStyle}>
                  <span style={medIconCircleStyle('#FEF2F2')}><IconDrop /></span>
                </div>
                <p style={{ ...medValueStyle, color: ficha?.tipo_sangre ? '#111827' : '#D97706' }}>
                  {ficha?.tipo_sangre || 'No registrado'}
                </p>
                <p style={medDescStyle}>
                  {ficha?.tipo_sangre ? 'Verificado · vital para transfusión' : 'Dato pendiente — consultar al paciente'}
                </p>
              </div>

              {/* Condición médica */}
              <div style={medCardStyle}>
                <span style={medLabelStyle}>CONDICIÓN MÉDICA</span>
                <div style={medIconAbsStyle}>
                  <span style={medIconCircleStyle('#FEF2F2')}><IconHeart /></span>
                </div>
                <p style={medValueStyle}>
                  {primeraCondicion ? primeraCondicion.nombre : 'Sin condiciones'}
                </p>
                <p style={medDescStyle}>
                  {primeraCondicion
                    ? (primeraCondicion.tratamiento ? `Tratamiento: ${primeraCondicion.tratamiento}` : `Estado: ${primeraCondicion.estado}`)
                    : 'No se reportan patologías crónicas activas'}
                </p>
              </div>

              {/* Medicamento */}
              <div style={medCardStyle}>
                <span style={medLabelStyle}>MEDICAMENTO ACTUAL</span>
                <div style={medIconAbsStyle}>
                  <span style={rxBadgeStyle}>Rx</span>
                </div>
                <p style={medValueStyle}>
                  {primeraMedicacion ? primeraMedicacion.nombre : 'Sin medicación'}
                </p>
                <p style={medDescStyle}>
                  {primeraMedicacion
                    ? `${primeraMedicacion.dosis || ''} ${primeraMedicacion.frecuencia || ''}`.trim() || 'Ver prescripción'
                    : 'Sin medicamentos registrados actualmente'}
                </p>
              </div>
            </div>

            {/* ── Clinical observations ── */}
            {(ficha?.notas || hasCriticalWarning() || allAlergias.length > 1 || (ficha?.condiciones || []).length > 1 || (ficha?.medicamentos || []).length > 1) && (
              <div style={observationsCardStyle}>
                <div style={sectionHeaderStyle}>
                  <div style={obsSectionIconStyle}>T</div>
                  <div>
                    <h3 style={sectionTitleStyle}>Observaciones clínicas</h3>
                    <p style={sectionSubStyle}>Notas visibles para personal de emergencia.</p>
                  </div>
                </div>
                <div style={obsList}>
                  {ficha?.notas && (
                    <div style={obsItemStyle}>
                      <div style={obsNumStyle}>01</div>
                      <div>
                        <p style={obsTextStyle}>{ficha.notas}</p>
                        <p style={obsSubStyle}>Notas médicas del paciente</p>
                      </div>
                    </div>
                  )}
                  {allAlergias.length > 1 && (
                    <div style={{ ...obsItemStyle, borderTop:'1px solid #F3F4F6' }}>
                      <div style={obsNumStyle}>0{ficha?.notas ? '2' : '1'}</div>
                      <div>
                        <p style={obsTextStyle}>
                          {allAlergias.map(a => `${a.nombre} (${a.severidad})`).join(', ')}
                        </p>
                        <p style={obsSubStyle}>Listado completo de alergias</p>
                      </div>
                    </div>
                  )}
                  {(ficha?.condiciones || []).length > 1 && (
                    <div style={{ ...obsItemStyle, borderTop:'1px solid #F3F4F6' }}>
                      <div style={obsNumStyle}>0{ficha?.notas ? (allAlergias.length > 1 ? '3' : '2') : (allAlergias.length > 1 ? '2' : '1')}</div>
                      <div>
                        <p style={obsTextStyle}>
                          {ficha.condiciones.map(c => c.nombre).join(' · ')}
                        </p>
                        <p style={obsSubStyle}>Condiciones crónicas registradas</p>
                      </div>
                    </div>
                  )}
                  {(ficha?.medicamentos || []).length > 1 && (
                    <div style={{ ...obsItemStyle, borderTop:'1px solid #F3F4F6' }}>
                      <div style={obsNumStyle}>+</div>
                      <div>
                        <p style={obsTextStyle}>
                          {ficha.medicamentos.map(m => m.nombre).join(' · ')}
                        </p>
                        <p style={obsSubStyle}>Medicación actual completa</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ─ RIGHT COLUMN ─ */}
          <div style={rightColStyle}>

            {/* Emergency contact card */}
            {primerContacto ? (
              <div style={contactCardStyle}>
                <h3 style={contactCardTitleStyle}>Contacto de emergencia</h3>
                <p style={contactCardSubStyle}>Llamar inmediatamente en caso de emergencia.</p>

                <div style={contactAvatarRowStyle}>
                  <div style={contactAvatarStyle}>
                    {primerContacto.nombre.split(' ').slice(0,2).map(n => n[0]).join('').toUpperCase()}
                  </div>
                  <div>
                    <p style={contactNameStyle}>{primerContacto.nombre}</p>
                    <p style={contactPhoneStyle}>{primerContacto.telefono}</p>
                    <p style={contactRelStyle}>{primerContacto.relacion?.toUpperCase()}</p>
                  </div>
                </div>

                {/* Secondary contacts */}
                {(ficha?.contactos || []).slice(1).map((c, i) => (
                  <div key={i} style={secondaryContactStyle}>
                    <div style={secondaryAvatarStyle}>{c.nombre[0]}</div>
                    <div>
                      <p style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.9)' }}>{c.nombre}</p>
                      <p style={{ fontSize:12, color:'rgba(255,255,255,0.65)' }}>{c.telefono} · {c.relacion}</p>
                    </div>
                  </div>
                ))}

                <a href={`tel:${primerContacto.telefono}`} style={callNowBtnStyle}>
                  <IconPhone /> Llamar ahora
                </a>
              </div>
            ) : (
              <div style={{ ...contactCardStyle, opacity:0.85 }}>
                <h3 style={contactCardTitleStyle}>Contacto de emergencia</h3>
                <p style={{ color:'rgba(255,255,255,0.75)', fontSize:14, marginTop:8 }}>No se registraron contactos de emergencia para este paciente.</p>
              </div>
            )}

            {/* Verification card */}
            <div style={verificationCardStyle}>
              <h3 style={verifTitleStyle}>Verificación del acceso</h3>
              <p style={verifSubStyle}>Este acceso ha sido registrado en la bitácora de auditoría inmutable.</p>
              <div style={verifListStyle}>
                <div style={verifItemStyle}>
                  <div style={verifCheckStyle}><IconCheck /></div>
                  <div>
                    <p style={verifItemTitleStyle}>QR activo</p>
                    <p style={verifItemSubStyle}>Token verificado en base de datos segura</p>
                  </div>
                </div>
                <div style={verifItemStyle}>
                  <div style={verifCheckStyle}><IconCheck /></div>
                  <div>
                    <p style={verifItemTitleStyle}>Acceso registrado</p>
                    <p style={verifItemSubStyle}>IP, hora y dispositivo anotados</p>
                  </div>
                </div>
                <div style={verifItemStyle}>
                  <div style={verifCheckStyle}><IconCheck /></div>
                  <div>
                    <p style={verifItemTitleStyle}>Vista limitada</p>
                    <p style={verifItemSubStyle}>Solo datos críticos son visibles</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Legal note */}
            <div style={legalNoteStyle}>
              <p style={legalTextStyle}>
                <strong>Nota para personal de emergencia:</strong> Esta información es de carácter médico confidencial,
                disponible bajo la Ley N° 29733 (Protección de Datos Personales). Su acceso ha sido registrado
                automáticamente. El uso indebido está sujeto a responsabilidad legal.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════
   STYLES
═══════════════════════════════════════════════════════ */

// Page shells
const pageStyle = {
  backgroundColor: '#F9FAFB',
  minHeight: '100vh',
  fontFamily: "system-ui,-apple-system,'Segoe UI',sans-serif",
}
const loadingContainerStyle = {
  display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#F9FAFB',
}
const errorPageStyle = {
  display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#F9FAFB',
}

// Top bar
const topBarStyle = {
  backgroundColor: '#DC2626',
  height: 56,
  padding: '0 24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  position: 'sticky',
  top: 0,
  zIndex: 100,
}
const topBarLeftStyle = {
  display: 'flex', alignItems: 'center', gap: 12,
}
const logoCircleStyle = {
  width: 32, height: 32, borderRadius: '50%',
  backgroundColor: 'rgba(255,255,255,0.2)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}
const logoTextStyle = {
  color: '#FFFFFF', fontWeight: 700, fontSize: 16, lineHeight: 1.2,
}
const logoSubStyle = {
  color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 1,
}
const verifiedPillStyle = {
  display: 'flex', alignItems: 'center', gap: 8,
  backgroundColor: '#16a34a', color: '#FFFFFF',
  fontSize: 13, fontWeight: 700, padding: '5px 14px',
  borderRadius: 20,
}
const verifiedDotStyle = {
  width: 8, height: 8, borderRadius: '50%', backgroundColor: '#FFFFFF',
  animation: 'pulseEmergency 1.5s infinite', flexShrink: 0,
}

// Loading spinner
const loadingSpinnerStyle = {
  width: 48, height: 48, border: '5px solid #E5E7EB',
  borderTop: '5px solid #DC2626', borderRadius: '50%',
  animation: 'spin 1s linear infinite',
}

// Error
const errorCardWrapStyle = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  flex: 1, padding: 24,
}
const errorCardStyle = {
  backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB',
  borderRadius: 16, padding: 40, width: '100%', maxWidth: 480,
  boxShadow: '0 20px 50px rgba(15,23,42,0.10)', textAlign: 'center',
}
const errorIconCircleStyle = (isRevoked) => ({
  width: 72, height: 72, borderRadius: '50%',
  backgroundColor: isRevoked ? '#FEE2E2' : '#F1F5F9',
  color: isRevoked ? '#DC2626' : '#64748B',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  marginBottom: 24,
})
const errorTitleStyle = { fontSize: 22, fontWeight: 800, color: '#111827' }
const errorDescStyle = { fontSize: 14, color: '#6B7280', lineHeight: 1.5, marginTop: 12 }
const revocationBoxStyle = {
  marginTop: 20, padding: '12px 16px', backgroundColor: '#F8FAFC',
  border: '1px solid #E5E7EB', borderRadius: 10,
  fontSize: 13, color: '#475569', display: 'flex', justifyContent: 'space-between', gap: 8,
}
const errorFooterStyle = { fontSize: 11, color: '#9CA3AF', marginTop: 20 }

// Page inner
const innerStyle = {
  maxWidth: 700, margin: '0 auto',
  padding: '16px 16px 48px',
}

// Hero card
const heroCardStyle = {
  backgroundColor: '#FFFFFF', border: '1px solid #F1F5F9',
  borderRadius: 16, padding: 24,
  boxShadow: '0 4px 16px rgba(0,0,0,0.06)', marginBottom: 12,
}
const heroCardInnerStyle = {}
const patientBadgeStyle = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  backgroundColor: '#FEF2F2', color: '#DC2626', fontSize: 12, fontWeight: 700,
  padding: '4px 12px', borderRadius: 20, marginBottom: 16,
}
const patientBadgeDotStyle = {
  width: 7, height: 7, borderRadius: '50%', backgroundColor: '#DC2626',
  animation: 'pulseEmergency 1.5s infinite',
}
const patientRowStyle = {
  display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap',
}
const patientAvatarStyle = {
  width: 72, height: 72, borderRadius: 16, backgroundColor: '#DC2626',
  color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: 24, fontWeight: 800, flexShrink: 0,
}
const patientNameStyle = {
  fontSize: 32, fontWeight: 800, color: '#111827',
  letterSpacing: '-0.5px', lineHeight: 1.1, marginBottom: 10,
}
const pillsRowStyle = {
  display: 'flex', flexWrap: 'wrap', gap: 8,
}
const infoPillStyle = {
  backgroundColor: '#F3F4F6', color: '#374151', fontSize: 13,
  padding: '4px 12px', borderRadius: 20,
}
const heroMetaStyle = {
  flexShrink: 0, textAlign: 'right', marginLeft: 'auto',
}
const heroMetaLabelStyle = {
  fontSize: 10, fontWeight: 700, color: '#9CA3AF',
  letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4,
}
const heroMetaValueStyle = {
  fontSize: 18, fontWeight: 800, color: '#111827',
}
const heroMetaSubStyle = {
  fontSize: 12, color: '#9CA3AF', marginTop: 4, maxWidth: 160, lineHeight: 1.4,
}

// Critical allergy banner
const criticalAllergyBannerStyle = {
  backgroundColor: '#DC2626', borderRadius: 16, padding: '20px 24px', marginBottom: 12,
}
const criticalBannerLabelStyle = {
  fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.85)',
  letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8,
}
const criticalBannerBodyStyle = {
  display: 'flex', alignItems: 'flex-start', gap: 16,
}
const criticalBannerIconStyle = {
  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
  backgroundColor: 'rgba(255,255,255,0.2)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: '#FFFFFF', fontSize: 22, fontWeight: 900,
}
const criticalBannerNameStyle = {
  fontSize: 28, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.3px', lineHeight: 1.1,
}
const criticalBannerDescStyle = {
  fontSize: 14, color: 'rgba(255,255,255,0.9)', lineHeight: 1.5, marginTop: 4,
}
const criticalBadgeStyle = {
  flexShrink: 0, backgroundColor: 'rgba(255,255,255,0.2)',
  color: '#FFFFFF', fontSize: 12, fontWeight: 700,
  padding: '3px 10px', borderRadius: 20,
}

// Quick actions
const quickActionsGridStyle = {
  display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
  gap: 12, marginBottom: 16,
}
const quickCardStyle = {
  display: 'flex', alignItems: 'center', gap: 12,
  backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB',
  borderRadius: 12, padding: 16, cursor: 'pointer',
  textDecoration: 'none', transition: 'box-shadow 0.2s',
}
const quickIconCircleStyle = (bg) => ({
  width: 38, height: 38, borderRadius: '50%', backgroundColor: bg,
  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  color: bg === '#DCFCE7' ? '#16a34a' : bg === '#DBEAFE' ? '#1d4ed8' : '#DC2626',
})
const quickCardTitleStyle = { fontSize: 14, fontWeight: 700, color: '#111827' }
const quickCardSubStyle = { fontSize: 12, color: '#6B7280', marginTop: 2 }

// Main grid
const mainGridStyle = {
  display: 'grid',
  gridTemplateColumns: '55% 45%',
  gap: 16,
  alignItems: 'start',
}
const leftColStyle = { display: 'flex', flexDirection: 'column', gap: 12 }
const rightColStyle = { display: 'flex', flexDirection: 'column', gap: 12 }

// Section headers
const sectionHeaderStyle = {
  display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14,
}
const sectionIconStyle = {
  width: 36, height: 36, borderRadius: 10, backgroundColor: '#FEF2F2',
  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
}
const obsSectionIconStyle = {
  width: 36, height: 36, borderRadius: 10, backgroundColor: '#FEF2F2',
  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  color: '#DC2626', fontSize: 16, fontWeight: 800,
}
const sectionTitleStyle = {
  fontSize: 18, fontWeight: 800, color: '#111827',
}
const sectionSubStyle = {
  fontSize: 13, color: '#6B7280', marginTop: 2,
}

// Medical data grid (2x2)
const medGridStyle = {
  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
}
const medCardStyle = {
  backgroundColor: '#FFFFFF', border: '1px solid #F1F5F9',
  borderRadius: 12, padding: '16px 20px', position: 'relative',
}
const medLabelStyle = {
  fontSize: 10, fontWeight: 700, color: '#6B7280',
  letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 6,
}
const medIconAbsStyle = {
  position: 'absolute', top: 12, right: 12,
}
const medIconCircleStyle = (bg) => ({
  width: 28, height: 28, borderRadius: '50%', backgroundColor: bg,
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
})
const rxBadgeStyle = {
  backgroundColor: '#EFF6FF', color: '#1d4ed8',
  fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 6,
  display: 'inline-block',
}
const medValueStyle = {
  fontSize: 22, fontWeight: 800, color: '#111827', lineHeight: 1.2, marginBottom: 4,
}
const medDescStyle = {
  fontSize: 13, color: '#6B7280',
}

// Observations
const observationsCardStyle = {
  backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB',
  borderRadius: 16, padding: '20px 24px',
}
const obsList = { display: 'flex', flexDirection: 'column' }
const obsItemStyle = {
  display: 'flex', alignItems: 'flex-start', gap: 14, padding: '12px 0',
}
const obsNumStyle = {
  width: 32, height: 32, borderRadius: 8, backgroundColor: '#FEF2F2',
  color: '#DC2626', fontSize: 14, fontWeight: 800,
  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
}
const obsTextStyle = { fontSize: 14, fontWeight: 600, color: '#374151', lineHeight: 1.4 }
const obsSubStyle = { fontSize: 12, color: '#9CA3AF', marginTop: 2 }

// Contact card (red)
const contactCardStyle = {
  backgroundColor: '#DC2626', borderRadius: 16, padding: '20px 24px',
}
const contactCardTitleStyle = {
  fontSize: 18, fontWeight: 700, color: '#FFFFFF',
}
const contactCardSubStyle = {
  fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4, marginBottom: 16,
}
const contactAvatarRowStyle = {
  display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14,
}
const contactAvatarStyle = {
  width: 48, height: 48, borderRadius: '50%',
  backgroundColor: 'rgba(255,255,255,0.2)',
  color: '#FFFFFF', fontSize: 18, fontWeight: 700,
  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
}
const contactNameStyle = { fontSize: 16, fontWeight: 700, color: '#FFFFFF' }
const contactPhoneStyle = { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginTop: 2 }
const contactRelStyle = { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 }
const secondaryContactStyle = {
  display: 'flex', alignItems: 'center', gap: 12,
  borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 10, marginBottom: 10,
}
const secondaryAvatarStyle = {
  width: 32, height: 32, borderRadius: '50%',
  backgroundColor: 'rgba(255,255,255,0.2)',
  color: '#FFFFFF', fontSize: 13, fontWeight: 700,
  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
}
const callNowBtnStyle = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
  width: '100%', backgroundColor: '#FFFFFF', color: '#DC2626',
  fontSize: 15, fontWeight: 700, padding: 14, borderRadius: 10,
  textDecoration: 'none', marginTop: 16,
  transition: 'background 0.2s',
}

// Verification card
const verificationCardStyle = {
  backgroundColor: '#FFFFFF',
  borderLeft: '4px solid #16a34a',
  borderRadius: 12, padding: 20,
  border: '1px solid #E5E7EB',
  borderLeftWidth: 4, borderLeftColor: '#16a34a',
}
const verifTitleStyle = { fontSize: 16, fontWeight: 700, color: '#111827' }
const verifSubStyle = { fontSize: 13, color: '#6B7280', marginTop: 4, marginBottom: 14 }
const verifListStyle = { display: 'flex', flexDirection: 'column', gap: 12 }
const verifItemStyle = { display: 'flex', alignItems: 'flex-start', gap: 12 }
const verifCheckStyle = {
  width: 24, height: 24, borderRadius: '50%', backgroundColor: '#DCFCE7',
  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
}
const verifItemTitleStyle = { fontSize: 14, fontWeight: 700, color: '#111827' }
const verifItemSubStyle = { fontSize: 12, color: '#9CA3AF', marginTop: 2 }

// Legal note
const legalNoteStyle = {
  backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB',
  borderRadius: 10, padding: '12px 16px',
}
const legalTextStyle = { fontSize: 12, color: '#6B7280', lineHeight: 1.5 }
