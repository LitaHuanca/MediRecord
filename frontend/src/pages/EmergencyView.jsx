import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { api } from '../api'

/* ── Responsive & animation styles (self-contained) ──────────────── */
function EmergencyStyles() {
  return (
    <style>{`
      @keyframes em-spin  { to { transform: rotate(360deg); } }
      @keyframes em-pulse { 0%,100%{opacity:1} 50%{opacity:0.45} }
      @keyframes em-fade  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }

      .em-card { animation: em-fade 0.35s ease both; }
      .em-call-btn:hover { background-color: #B91C1C !important; }

      /* ── Layout grids ── */
      .em-main-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
      .em-row-grid  { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 14px; }

      /* ── Hero row ── */
      .em-hero-row  { display: flex; align-items: flex-start; gap: 20px; flex-wrap: wrap; }
      .em-hero-meta { text-align: right; flex-shrink: 0; }
      .em-name      { font-size: 26px; font-weight: 800; color: #0F172A; letter-spacing: -0.4px; line-height: 1.15; margin-bottom: 10px; }

      /* ── TopBar helpers ── */
      .em-topbar-sub  { font-size: 10.5px; font-weight: 500; color: rgba(255,255,255,0.75); line-height: 1; }
      .em-badge-text  { font-size: 12px; font-weight: 700; color: #FFF; }

      /* ── Mobile ── */
      @media (max-width: 640px) {
        .em-inner      { padding: 12px 12px 48px !important; }
        .em-main-grid  { grid-template-columns: 1fr !important; }
        .em-row-grid   { grid-template-columns: 1fr !important; }
        .em-hero-meta  { text-align: left !important; width: 100%; margin-top: 8px; }
        .em-name       { font-size: 20px !important; letter-spacing: -0.2px !important; }
        .em-topbar-sub { display: none !important; }
        .em-badge-text { display: none !important; }
        .em-avatar     { width: 60px !important; height: 60px !important; border-radius: 13px !important; }
      }

      @media (max-width: 380px) {
        .em-avatar { width: 50px !important; height: 50px !important; }
        .em-name   { font-size: 17px !important; }
      }

      @media (prefers-reduced-motion: reduce) {
        .em-card { animation: none !important; }
      }
    `}</style>
  )
}

/* ── Gender avatar ──────────────────────────────────────────────── */
function GenderAvatar({ sexo, initials }) {
  const isFemale = sexo === 'Femenino'
  const isMale   = sexo === 'Masculino'
  return (
    <div
      className="em-avatar"
      style={{
        width: 68, height: 68, borderRadius: 15,
        backgroundColor: '#DC2626',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, overflow: 'hidden',
      }}
    >
      {isFemale ? <FemaleIcon /> : isMale ? <MaleIcon /> : (
        <span style={{ fontSize: 22, fontWeight: 800, color: '#FFF' }}>{initials}</span>
      )}
    </div>
  )
}

function FemaleIcon() {
  return (
    <svg width="46" height="50" viewBox="0 0 46 52" fill="none" aria-label="Sexo: Femenino">
      {/* Hair arch over head */}
      <path d="M9 21 C8 11 12 5 23 5 C34 5 38 11 37 21 C35 15 30 12 23 12 C16 12 11 15 9 21Z" fill="white" opacity="0.85"/>
      {/* Head */}
      <circle cx="23" cy="21" r="11" fill="white"/>
      {/* Long hair – left side */}
      <path d="M12 20 C10 26 10 33 12 39" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.75"/>
      {/* Long hair – right side */}
      <path d="M34 20 C36 26 36 33 34 39" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.75"/>
      {/* Dress / A-line skirt */}
      <path d="M13 39 C9 44 8 51 8 52 H38 C38 51 37 44 33 39 C29 42 17 42 13 39Z" fill="white" opacity="0.9"/>
    </svg>
  )
}

function MaleIcon() {
  return (
    <svg width="46" height="50" viewBox="0 0 46 52" fill="none" aria-label="Sexo: Masculino">
      {/* Head */}
      <circle cx="23" cy="19" r="11" fill="white"/>
      {/* Short hair detail */}
      <path d="M12 17 C12 8 15 5 23 5 C31 5 34 8 34 17" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/>
      {/* Broad torso / straight shoulders */}
      <path d="M11 37 C8 42 7 50 7 52 H39 C39 50 38 42 35 37 C31 40 27 41 23 41 C19 41 15 40 11 37Z" fill="white" opacity="0.9"/>
    </svg>
  )
}

/* ── Main component ─────────────────────────────────────────────── */
export default function EmergencyView() {
  const { token } = useParams()
  const [searchParams] = useSearchParams()
  const [loading, setLoading]       = useState(true)
  const [errorState, setErrorState] = useState(null)
  const [ficha, setFicha]           = useState(null)
  const viaNfc = searchParams.get('via') === 'nfc'

  useEffect(() => {
    async function load() {
      try {
        setLoading(true); setErrorState(null)
        if (!token) { setErrorState({ code: 'token_invalido', message: 'Token no especificado.' }); return }
        const url = viaNfc ? `${token}?via=nfc` : token
        setFicha(await api.getEmergency(url))
      } catch (err) {
        setErrorState({
          code: err.message?.includes('revocado') ? 'token_revocado' : 'server_error',
          message: err.message || 'Error de conexión.',
        })
      } finally { setLoading(false) }
    }
    load()
  }, [token, viaNfc])

  const getAge = (dob) => {
    if (!dob) return null
    return Math.abs(new Date(Date.now() - new Date(dob).getTime()).getUTCFullYear() - 1970)
  }
  const maskDoc = (doc) => doc?.length >= 4 ? '•••• ' + doc.slice(-4) : '••••'

  /* ── Loading ── */
  if (loading) return (
    <div style={shellStyle}>
      <EmergencyStyles />
      <TopBar />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 16, padding: 40 }}>
        <div style={{ width: 48, height: 48, border: '4px solid #E2E8F0', borderTop: '4px solid #DC2626', borderRadius: '50%', animation: 'em-spin 0.9s linear infinite' }}/>
        <p style={{ fontWeight: 700, fontSize: 17, color: '#0F172A' }}>Verificando ficha vital…</p>
        <p style={{ fontSize: 13, color: '#64748B' }}>Validando firma digital y registrando acceso seguro.</p>
      </div>
    </div>
  )

  /* ── Error ── */
  if (errorState) {
    const isRevoked = errorState.code === 'token_revocado'
    return (
      <div style={shellStyle}>
        <EmergencyStyles />
        <TopBar />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '40px 16px' }}>
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16, padding: '48px 32px', width: '100%', maxWidth: 460, boxShadow: '0 8px 32px rgba(15,23,42,0.08)', textAlign: 'center' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', backgroundColor: isRevoked ? '#FEF2F2' : '#F1F5F9', color: isRevoked ? '#DC2626' : '#64748B', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
              {isRevoked
                ? <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                : <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              }
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', marginBottom: 10 }}>
              {isRevoked ? 'Código QR revocado' : 'Código inválido'}
            </h2>
            <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6, marginBottom: 20 }}>
              {isRevoked
                ? 'Este código ha sido revocado por el ciudadano titular. Contacte al personal de salud para asistencia inmediata.'
                : 'El código QR o tag NFC no corresponde a ningún registro activo en el sistema MediRecord UNMSM.'}
            </p>
            <div style={{ padding: '12px 16px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, fontSize: 12, color: '#94A3B8' }}>
              Ley N° 29733 — Protección de Datos Personales · MediRecord UNMSM 2026
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* ── Data prep ── */
  const allAlergias = [...(ficha?.alergias || [])].sort((a, b) => {
    const order = { 'Crítica': 0, 'Severa': 1, 'Moderada': 2, 'Leve': 3 }
    return (order[a.severidad] ?? 4) - (order[b.severidad] ?? 4)
  })
  const criticasAlergias = allAlergias.filter(a => a.severidad === 'Crítica' || a.severidad === 'Severa')
  const contacto1     = ficha?.contactos?.[0]
  const restContactos = (ficha?.contactos || []).slice(1)
  const med1          = ficha?.medicamentos?.[0]
  const cond1         = ficha?.condiciones?.[0]
  const initials      = (ficha?.nombre_completo || '').split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() || '?'
  const age           = getAge(ficha?.fecha_nacimiento)

  return (
    <div style={shellStyle}>
      <EmergencyStyles />
      <TopBar verified />

      <div className="em-inner" style={{ maxWidth: 860, margin: '0 auto', padding: '24px 16px 60px' }}>

        {/* ── Alerta crítica ── */}
        {criticasAlergias.length > 0 && (
          <div className="em-card" style={{ backgroundColor: '#DC2626', borderRadius: 14, padding: '16px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 3 }}>ALERTA MÉDICA CRÍTICA</p>
              <p style={{ color: '#FFFFFF', fontSize: 17, fontWeight: 800, lineHeight: 1.2, wordBreak: 'break-word' }}>{criticasAlergias.map(a => a.nombre).join(' · ')}</p>
              {criticasAlergias[0]?.reaccion && <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 3 }}>Reacción: {criticasAlergias[0].reaccion}</p>}
            </div>
            <span style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#FFFFFF', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, flexShrink: 0, whiteSpace: 'nowrap' }}>PRIORITARIO</span>
          </div>
        )}

        {/* ── Hero paciente ── */}
        <div className="em-card" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '22px 24px', marginBottom: 16, boxShadow: '0 2px 12px rgba(15,23,42,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block', animation: 'em-pulse 1.5s infinite' }}/>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Paciente identificado · Ficha activa</span>
          </div>

          <div className="em-hero-row">
            {/* Avatar con ícono de género */}
            <GenderAvatar sexo={ficha?.sexo} initials={initials} />

            {/* Nombre + datos */}
            <div style={{ flex: 1, minWidth: 150 }}>
              <h1 className="em-name">{ficha?.nombre_completo}</h1>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {age && <Pill>{age} años</Pill>}
                {ficha?.sexo && <Pill>{ficha.sexo}</Pill>}
                <Pill>Doc. {maskDoc(ficha?.numero_documento)}</Pill>
                {ficha?.tipo_sangre && <Pill red>{ficha.tipo_sangre}</Pill>}
                {ficha?.donante_organos && <Pill green>♥ Donante</Pill>}
              </div>
            </div>

            {/* Última actualización */}
            <div className="em-hero-meta">
              <p style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3 }}>Última actualización</p>
              <p style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>
                {ficha?.ultima_actualizacion
                  ? new Date(ficha.ultima_actualizacion).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })
                  : '—'}
              </p>
              <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 3 }}>Acceso auditado</p>
            </div>
          </div>
        </div>

        {/* ── Grid médico (2×2 → 1 col en móvil) ── */}
        <div className="em-main-grid">
          <MedCard
            label="Alergias"
            icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>}
            iconBg="#FEF2F2"
            value={allAlergias.length > 0 ? allAlergias[0].nombre : 'Ninguna reportada'}
            extra={allAlergias.length > 1 ? `+ ${allAlergias.length - 1} más` : allAlergias[0]?.severidad ? `Severidad: ${allAlergias[0].severidad}` : 'Sin alergias conocidas'}
            badge={allAlergias[0]?.severidad}
            badgeColor={{ 'Crítica': '#DC2626', 'Severa': '#F97316', 'Moderada': '#F59E0B', 'Leve': '#10B981' }[allAlergias[0]?.severidad]}
          />

          <MedCard
            label="Tipo de sangre"
            icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>}
            iconBg="#FEF2F2"
            value={ficha?.tipo_sangre || '—'}
            extra={ficha?.tipo_sangre ? 'Verificado · vital para transfusión' : 'No registrado · consultar al paciente'}
            valueColor={ficha?.tipo_sangre ? '#DC2626' : '#94A3B8'}
          />

          <MedCard
            label="Condición crónica"
            icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>}
            iconBg="#FEF2F2"
            value={cond1 ? cond1.nombre : 'Sin condiciones'}
            extra={cond1 ? (cond1.tratamiento ? `Trat: ${cond1.tratamiento}` : cond1.estado || '') : 'Sin patologías crónicas reportadas'}
          />

          <MedCard
            label="Medicación actual"
            icon={<span style={{ fontSize: 12, fontWeight: 800, color: '#1D4ED8' }}>Rx</span>}
            iconBg="#EFF6FF"
            value={med1 ? med1.nombre : 'Sin medicación'}
            extra={med1 ? `${med1.dosis || ''}${med1.frecuencia ? ' · ' + med1.frecuencia : ''}`.trim() || 'Ver prescripción' : 'Sin medicamentos registrados'}
          />
        </div>

        {/* ── Contacto + Verificación (2 col → 1 col en móvil) ── */}
        <div className="em-row-grid">

          {/* Contacto de emergencia */}
          <div className="em-card" style={{ backgroundColor: '#DC2626', borderRadius: 14, padding: '20px 22px' }}>
            <p style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12 }}>Contacto de emergencia</p>
            {contacto1 ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 46, height: 46, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)', color: '#FFF', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {contacto1.nombre.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ color: '#FFFFFF', fontWeight: 700, fontSize: 15 }}>{contacto1.nombre}</p>
                    <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, marginTop: 1 }}>{contacto1.telefono}</p>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 1, textTransform: 'uppercase', letterSpacing: '0.3px' }}>{contacto1.relacion}</p>
                  </div>
                </div>
                {restContactos.map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 10, marginBottom: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.18)', color: '#FFF', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{c.nombre[0]}</div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: 600 }}>{c.nombre}</p>
                      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{c.telefono} · {c.relacion}</p>
                    </div>
                  </div>
                ))}
                <a
                  href={`tel:${contacto1.telefono}`}
                  className="em-call-btn"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FFFFFF', color: '#DC2626', fontSize: 14, fontWeight: 700, padding: '12px 0', borderRadius: 9, textDecoration: 'none', marginTop: 14, transition: 'background-color 0.2s ease' }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.68h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.5 17.4z"/></svg>
                  Llamar ahora
                </a>
              </>
            ) : (
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 8 }}>No se registraron contactos.</p>
            )}
          </div>

          {/* Verificación + observaciones */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="em-card" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderLeft: '3px solid #10B981', borderRadius: 12, padding: '18px 20px', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}>
              <p style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A', marginBottom: 10 }}>Verificación del acceso</p>
              {[
                ['QR activo y validado', 'Token verificado en base de datos'],
                ['Acceso registrado', 'IP, hora y dispositivo anotados'],
                ['Vista limitada', 'Solo datos críticos son visibles'],
              ].map(([t, s]) => (
                <div key={t} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', backgroundColor: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#065F46" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', lineHeight: 1.2 }}>{t}</p>
                    <p style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 1 }}>{s}</p>
                  </div>
                </div>
              ))}
            </div>

            {(ficha?.notas_adicionales || (ficha?.alergias || []).length > 1 || (ficha?.condiciones || []).length > 1 || (ficha?.medicamentos || []).length > 1) && (
              <div className="em-card" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: '16px 20px', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 10 }}>Observaciones clínicas</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {ficha?.notas_adicionales && <ObsRow label="Notas">{ficha.notas_adicionales}</ObsRow>}
                  {(ficha?.alergias || []).length > 1 && <ObsRow label="Todas las alergias">{(ficha?.alergias || []).map(a => `${a.nombre} (${a.severidad || '?'})`).join(', ')}</ObsRow>}
                  {(ficha?.condiciones || []).length > 1 && <ObsRow label="Condiciones crónicas">{(ficha?.condiciones || []).map(c => c.nombre).join(' · ')}</ObsRow>}
                  {(ficha?.medicamentos || []).length > 1 && <ObsRow label="Medicación completa">{(ficha?.medicamentos || []).map(m => m.nombre).join(' · ')}</ObsRow>}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Nota legal */}
        <div style={{ marginTop: 16, padding: '12px 16px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10 }}>
          <p style={{ fontSize: 11.5, color: '#94A3B8', lineHeight: 1.55, textAlign: 'center' }}>
            <strong style={{ color: '#64748B' }}>Información médica confidencial</strong> — Ley N° 29733 (Protección de Datos Personales). Acceso registrado automáticamente. · MediRecord SQA UNMSM 2026
          </p>
        </div>
      </div>
    </div>
  )
}

/* ── Sub-components ─────────────────────────────────────────────── */

function TopBar({ verified }) {
  return (
    <header style={{ backgroundColor: '#DC2626', padding: '0 20px', height: 54, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 8px rgba(220,38,38,0.2)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
        </div>
        <div>
          <p style={{ color: '#FFFFFF', fontWeight: 800, fontSize: 15, letterSpacing: '-0.2px', lineHeight: 1.2 }}>MediRecord</p>
          <p className="em-topbar-sub">Ficha Vital de Emergencia · UNMSM</p>
        </div>
      </div>
      {verified && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, backgroundColor: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', padding: '5px 13px', borderRadius: 20 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#FFFFFF', animation: 'em-pulse 1.5s infinite', display: 'inline-block', flexShrink: 0 }}/>
          <span className="em-badge-text">Código activo y verificado</span>
        </div>
      )}
    </header>
  )
}

function Pill({ children, red, green }) {
  return (
    <span style={{
      fontSize: 12.5, fontWeight: 600, padding: '3px 11px', borderRadius: 20,
      backgroundColor: red ? '#FEF2F2' : green ? '#ECFDF5' : '#F1F5F9',
      color: red ? '#DC2626' : green ? '#065F46' : '#475569',
      border: red ? '1px solid #FEE2E2' : green ? '1px solid #A7F3D0' : '1px solid #E2E8F0',
    }}>{children}</span>
  )
}

function MedCard({ label, icon, iconBg, value, extra, badge, badgeColor, valueColor }) {
  return (
    <div className="em-card" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: '18px 20px', boxShadow: '0 2px 8px rgba(15,23,42,0.04)', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 10.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{label}</span>
        <div style={{ width: 28, height: 28, borderRadius: 7, backgroundColor: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
      </div>
      <p style={{ fontSize: 20, fontWeight: 800, color: valueColor || '#0F172A', lineHeight: 1.2, marginBottom: 5, wordBreak: 'break-word' }}>{value}</p>
      <p style={{ fontSize: 12, color: '#94A3B8', lineHeight: 1.4 }}>{extra}</p>
      {badge && (
        <span style={{ position: 'absolute', top: 14, right: 52, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, backgroundColor: badgeColor + '20', color: badgeColor || '#64748B' }}>{badge}</span>
      )}
    </div>
  )
}

function ObsRow({ label, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
      <div style={{ width: 28, height: 28, borderRadius: 7, backgroundColor: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 10, fontWeight: 800 }}>!</div>
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 2 }}>{label}</p>
        <p style={{ fontSize: 12.5, color: '#374151', lineHeight: 1.4 }}>{children}</p>
      </div>
    </div>
  )
}

const shellStyle = {
  display: 'flex', flexDirection: 'column', minHeight: '100vh',
  backgroundColor: '#F8FAFC', fontFamily: "system-ui,-apple-system,'Segoe UI',sans-serif",
}
