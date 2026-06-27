import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { theme } from '../styles/theme'
import Modal from '../components/Modal'
import QRCode from 'qrcode'

/* ─── SVG Icon helpers ─── */
const IconBell = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
)
const IconCross = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M12 5v14M5 12h14"/>
  </svg>
)
const IconQr = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    <path d="M14 14h.01M18 14h.01M14 18h.01M18 18h.01M14 21h7M21 14v7"/>
  </svg>
)
const IconClock = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
)
const IconGear = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
)
const IconEye = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
)
const IconExclaim = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
)
const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)
const IconRefresh = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
)
const IconHelp = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)
const IconLogout = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
)
const IconEdit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)
const IconSave = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
  </svg>
)
const IconCheck = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const IconQrLarge = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    <path d="M14 14h.01M18 14h.01M14 18h.01M18 18h.01M14 21h7M21 14v7"/>
  </svg>
)
const IconDownload = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
)
const IconPrint = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
  </svg>
)
const IconAmbulance = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
    <path d="M7 10h4M9 8v4"/>
  </svg>
)

/* ─── Donut chart ─── */
function DonutChart({ percent = 85 }) {
  const r = 52
  const circ = 2 * Math.PI * r
  const offset = circ - (percent / 100) * circ
  return (
    <div style={{ position: 'relative', width: 140, height: 140, flexShrink: 0 }}>
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={r} fill="none" stroke="#F3F4F6" strokeWidth="14"/>
        <circle cx="70" cy="70" r={r} fill="none" stroke="#DC2626" strokeWidth="14"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          transform="rotate(-90 70 70)" style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A' }}>{percent}%</span>
        <span style={{ fontSize: '10px', fontWeight: 600, color: '#94A3B8', marginTop: 2 }}>completa</span>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════ */
export default function Dashboard() {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState(null)

  const [usuario, setUsuario] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [alergias, setAlergias] = useState([])
  const [condiciones, setCondiciones] = useState([])
  const [medicamentos, setMedicamentos] = useState([])
  const [contactos, setContactos] = useState([])
  const [activeToken, setActiveToken] = useState(null)
  const [nfcTags, setNfcTags] = useState([])
  const [accesos, setAccesos] = useState([])
  const [qrError, setQrError] = useState(null)
  const [qrImageUrl, setQrImageUrl] = useState('')

  // Modal states
  const [isRevokeModalOpen, setIsRevokeModalOpen] = useState(false)
  const [revokeMotivo, setRevokeMotivo] = useState('Pérdida de dispositivo')
  const [customMotivo, setCustomMotivo] = useState('')
  const [isNfcModalOpen, setIsNfcModalOpen] = useState(false)
  const [manualNfcUid, setManualNfcUid] = useState('')

  // Inline edit state
  const [editingFicha, setEditingFicha] = useState(false)
  const [editValues, setEditValues] = useState({})
  const [saveLoading, setSaveLoading] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // User menu dropdown
  const [showUserMenu, setShowUserMenu] = useState(false)
  // Mobile sidebar toggle
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // ── FETCH DATA ──────────────────────────────────────────
  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate('/login'); return }

      const { data: dbUsuario, error: userError } = await supabase
        .from('usuarios').select('*').eq('auth_user_id', user.id).maybeSingle()
      if (userError) throw userError
      if (!dbUsuario) { navigate('/registro'); return }
      setUsuario(dbUsuario)

      let activeDbToken = null
      const { data: dbToken, error: tokenFetchError } = await supabase
        .from('tokens_qr').select('*').eq('usuario_id', dbUsuario.id).eq('estado', 'activo').maybeSingle()
      if (tokenFetchError) throw tokenFetchError
      if (dbToken) {
        activeDbToken = dbToken
      } else {
        const { data: createdToken, error: tokenCreateError } = await supabase
          .from('tokens_qr').insert([{ usuario_id: dbUsuario.id, estado: 'activo' }]).select('*').single()
        if (tokenCreateError) throw tokenCreateError
        activeDbToken = createdToken
      }
      setActiveToken(activeDbToken)

      const { data: dbPerfil } = await supabase
        .from('perfiles_medicos').select('*').eq('usuario_id', dbUsuario.id).maybeSingle()
      if (dbPerfil) {
        setPerfil(dbPerfil)
        setEditValues({
          tipo_sangre: dbPerfil.tipo_sangre || '',
          peso_kg: dbPerfil.peso_kg || '',
          altura_cm: dbPerfil.altura_cm || '',
          notas_adicionales: dbPerfil.notas_adicionales || '',
          donante_organos: dbPerfil.donante_organos || false,
        })

        const { data: dbAlergias } = await supabase
          .from('perfil_alergias').select('severidad, reaccion_observada, alergias(nombre, categoria)').eq('perfil_id', dbPerfil.id)
        if (dbAlergias) setAlergias(dbAlergias.map(item => ({ nombre: item.alergias?.nombre, categoria: item.alergias?.categoria, severidad: item.severidad, reaccion: item.reaccion_observada })))

        const { data: dbCondiciones } = await supabase
          .from('perfil_condiciones').select('estado, tratamiento_actual, condiciones_cronicas(nombre, categoria)').eq('perfil_id', dbPerfil.id)
        if (dbCondiciones) setCondiciones(dbCondiciones.map(item => ({ nombre: item.condiciones_cronicas?.nombre, categoria: item.condiciones_cronicas?.categoria, estado: item.estado, tratamiento: item.tratamiento_actual })))

        const { data: dbMedicamentos } = await supabase
          .from('perfil_medicamentos').select('dosis, frecuencia, notas, medicamentos(nombre_generico)').eq('perfil_id', dbPerfil.id)
        if (dbMedicamentos) setMedicamentos(dbMedicamentos.map(item => ({ nombre: item.medicamentos?.nombre_generico, dosis: item.dosis, frecuencia: item.frecuencia, notas: item.notas })))
      } else {
        navigate('/registro'); return
      }

      const { data: dbContactos } = await supabase.from('contactos_emergencia').select('*').eq('usuario_id', dbUsuario.id).order('orden_prioridad')
      if (dbContactos) setContactos(dbContactos)

      if (activeDbToken) {
        const { data: dbNfc } = await supabase.from('nfc_tags').select('*').eq('token_qr_id', activeDbToken.id)
        if (dbNfc) setNfcTags(dbNfc)
        const { data: dbAccesos } = await supabase
          .from('accesos_emergencia').select('*').eq('token_qr_id', activeDbToken.id)
          .order('accedido_en', { ascending: false }).limit(10)
        if (dbAccesos) setAccesos(dbAccesos)
      }
    } catch (err) {
      setError(err.message || 'Error al descargar sus datos clínicos de la nube.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDashboardData() }, [])

  // ── QR ────────────────────────────────────────────────
  useEffect(() => {
    if (!activeToken?.token_uuid) { setQrImageUrl(''); return }
    let cancelled = false
    setQrError(null)
    const emergencyUrl = `${window.location.origin}/emergency/${activeToken.token_uuid}`
    QRCode.toDataURL(emergencyUrl, { width: 240, margin: 2, errorCorrectionLevel: 'H', color: { dark: '#0F172A', light: '#FFFFFF' } })
      .then((dataUrl) => { if (!cancelled) setQrImageUrl(dataUrl) })
      .catch(() => { if (!cancelled) setQrError('No se pudo renderizar el QR.') })
    return () => { cancelled = true }
  }, [activeToken])

  // ── DOWNLOAD QR ───────────────────────────────────────
  const handleDownloadQR = async () => {
    if (!activeToken || !usuario) return
    setQrError(null)
    try {
      const emergencyUrl = `${window.location.origin}/emergency/${activeToken.token_uuid}`
      const qrDataUrl = await QRCode.toDataURL(emergencyUrl, { width: 260, margin: 2, errorCorrectionLevel: 'H', color: { dark: '#0F172A', light: '#FFFFFF' } })
      const exportCanvas = document.createElement('canvas')
      exportCanvas.width = 400; exportCanvas.height = 520
      const ctx = exportCanvas.getContext('2d')
      ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, 400, 520)
      ctx.fillStyle = '#DC2626'; ctx.fillRect(0, 0, 400, 70)
      ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 18px Inter, sans-serif'; ctx.textAlign = 'center'
      ctx.fillText('MediRecord UNMSM', 200, 32)
      ctx.font = '600 11px Inter, sans-serif'; ctx.fillText('FICHA VITAL DE EMERGENCIA', 200, 52)
      const qrImage = new Image(); qrImage.src = qrDataUrl; await qrImage.decode()
      ctx.drawImage(qrImage, 70, 100, 260, 260)
      ctx.fillStyle = '#475569'; ctx.font = 'bold 14px Inter, sans-serif'
      ctx.fillText(usuario.nombre_completo.toUpperCase(), 200, 390)
      ctx.fillStyle = '#94A3B8'; ctx.font = '600 11px Inter, sans-serif'
      ctx.fillText(`DNI: ${usuario.dni}`, 200, 410)
      ctx.fillStyle = '#0F172A'; ctx.fillRect(0, 445, 400, 75)
      ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 13px Inter, sans-serif'
      ctx.fillText('EN CASO DE EMERGENCIA ESCANEE AQUI', 200, 472)
      const link = document.createElement('a')
      link.download = `MediRecord_QR_${usuario.dni}.png`
      link.href = exportCanvas.toDataURL('image/png'); link.click()
    } catch (err) {
      setQrError(err.message || 'No se pudo descargar el QR.')
    }
  }

  // ── REVOKE ────────────────────────────────────────────
  const handleRevokeToken = async () => {
    if (!activeToken) return
    setActionLoading(true); setError(null)
    const finalMotivo = revokeMotivo === 'Otro' ? customMotivo : revokeMotivo
    try {
      const { data, error: rpcError } = await supabase.rpc('revocar_token', { p_token_id: activeToken.id, p_motivo: finalMotivo })
      if (rpcError) throw rpcError
      if (data?.error) throw new Error(data.error)
      const { error: insertError } = await supabase.from('tokens_qr').insert([{ usuario_id: usuario.id, estado: 'activo' }])
      if (insertError) throw insertError
      setIsRevokeModalOpen(false); setRevokeMotivo('Pérdida de dispositivo'); setCustomMotivo('')
      await fetchDashboardData()
    } catch (err) {
      setError(err.message || 'Error al revocar y regenerar el código vital.')
    } finally {
      setActionLoading(false)
    }
  }

  // ── NFC ───────────────────────────────────────────────
  const handleRegisterNfc = async () => {
    if (!manualNfcUid.trim()) return
    setActionLoading(true); setError(null)
    try {
      const { data: existingTag } = await supabase.from('nfc_tags').select('id').eq('tag_uid', manualNfcUid.trim()).maybeSingle()
      if (existingTag) throw new Error('Este Chip NFC ya se encuentra vinculado a un expediente.')
      const { error: nfcError } = await supabase.from('nfc_tags').insert([{ token_qr_id: activeToken.id, tag_uid: manualNfcUid.trim(), estado: 'activo' }])
      if (nfcError) throw nfcError
      await supabase.from('audit_log').insert([{ usuario_id: usuario.id, accion: 'NFC_VINCULADO', tabla_afectada: 'nfc_tags', datos_nuevos: { tag_uid: manualNfcUid.trim() } }])
      setIsNfcModalOpen(false); setManualNfcUid('')
      await fetchDashboardData()
    } catch (err) {
      setError(err.message || 'Error al vincular el TAG NFC físico.')
    } finally {
      setActionLoading(false)
    }
  }

  // ── INLINE SAVE ───────────────────────────────────────
  const handleSaveFicha = async () => {
    if (!perfil) return
    setSaveLoading(true)
    try {
      const { error: updateError } = await supabase
        .from('perfiles_medicos')
        .update({
          tipo_sangre: editValues.tipo_sangre || null,
          peso_kg: editValues.peso_kg ? parseFloat(editValues.peso_kg) : null,
          altura_cm: editValues.altura_cm ? parseInt(editValues.altura_cm) : null,
          notas_adicionales: editValues.notas_adicionales || null,
          donante_organos: editValues.donante_organos,
        })
        .eq('id', perfil.id)
      if (updateError) throw updateError
      setEditingFicha(false)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
      await fetchDashboardData()
    } catch (err) {
      setError(err.message || 'No se pudo guardar los cambios.')
    } finally {
      setSaveLoading(false)
    }
  }

  // ── LOGOUT ────────────────────────────────────────────
  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  // ── Derived ───────────────────────────────────────────
  const initials = usuario
    ? usuario.nombre_completo.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
    : 'DA'
  const missingBloodType = !perfil?.tipo_sangre

  const completionItems = [
    !!usuario?.nombre_completo,
    alergias.length > 0 || condiciones.length > 0,
    !!perfil?.tipo_sangre,
    medicamentos.length > 0,
    contactos.length > 0,
  ]
  const completionPercent = Math.round((completionItems.filter(Boolean).length / completionItems.length) * 100)

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <IconBell />, path: '/dashboard', active: true },
    { id: 'ficha', label: 'Mi Ficha Vital', icon: <IconCross />, path: '/registro' },
    { id: 'qr', label: 'Mi QR / NFC', icon: <IconQr /> },
    { id: 'historial', label: 'Historial', icon: <IconClock /> },
    { id: 'config', label: 'Configuración', icon: <IconGear /> },
  ]
  const secItems = [
    { id: 'auditoria', label: 'Auditoría', icon: <IconEye /> },
    { id: 'revocar', label: 'Revocar QR', icon: <IconExclaim />, danger: true, onClick: () => setIsRevokeModalOpen(true) },
  ]

  if (loading) {
    return (
      <div style={loadingWrapStyle}>
        <div style={spinnerStyle}></div>
        <p style={{ color: '#94A3B8', marginTop: 16, fontWeight: 500, fontSize: 14 }}>Abriendo panel vital...</p>
      </div>
    )
  }

  return (
    <div style={shellStyle} onClick={() => { showUserMenu && setShowUserMenu(false); sidebarOpen && setSidebarOpen(false) }}>

      {/* Mobile sidebar overlay */}
      <div className="dashboard-overlay" onClick={() => setSidebarOpen(false)} />

      {/* ═══ SIDEBAR ══════════════════════════════════════ */}
      <aside style={sidebarStyle} className={`dashboard-sidebar${sidebarOpen ? ' sidebar-open' : ''}`}>
        {/* Logo */}
        <div style={logoAreaStyle}>
          <div style={logoCircleStyle}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
          </div>
          <span style={logoTextStyle}>MediRecord</span>
        </div>

        <p style={navSectionLabelStyle}>PANEL DEL USUARIO</p>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {navItems.map(item =>
            item.path ? (
              <Link key={item.id} to={item.path} style={item.active ? navItemActiveStyle : navItemStyle}>
                <span style={item.active ? navIconActiveStyle : navIconStyle}>{item.icon}</span>
                {item.label}
              </Link>
            ) : (
              <button key={item.id} style={navItemStyle} onClick={item.onClick}>
                <span style={navIconStyle}>{item.icon}</span>
                {item.label}
              </button>
            )
          )}
        </nav>

        <div style={navDividerStyle}></div>
        <p style={navSectionLabelStyle}>SEGURIDAD</p>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {secItems.map(item => (
            <button key={item.id} style={item.danger ? navItemDangerStyle : navItemStyle} onClick={item.onClick}>
              <span style={item.danger ? navIconDangerStyle : navIconStyle}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Emergency card */}
        <div style={sidebarEmergencyCardStyle}>
          <p style={sidebarCardTitleStyle}>Ficha de emergencia</p>
          <p style={sidebarCardSubStyle}>Tu QR está activo y listo para ser usado por personal de primera respuesta.</p>
          {activeToken && (
            <Link to={`/emergency/${activeToken.token_uuid}`} target="_blank" style={sidebarCardBtnStyle}>
              Ver QR activo
            </Link>
          )}
        </div>

        {/* Logout button at sidebar bottom */}
        <button onClick={handleLogout} style={sidebarLogoutBtnStyle}>
          <IconLogout />
          Cerrar sesión
        </button>
      </aside>

      {/* ═══ MAIN AREA ════════════════════════════════════ */}
      <div style={mainAreaStyle}>

        {/* ── TOP BAR ───────────────────────────────────── */}
        <header style={topBarStyle} className="dashboard-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button className="dashboard-hamburger" onClick={e => { e.stopPropagation(); setSidebarOpen(v => !v) }} aria-label="Menú">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <div style={searchWrapStyle}>
              <span style={searchIconStyle}><IconSearch /></span>
              <input type="search" placeholder="Buscar..." style={searchInputStyle} className="dashboard-search-input" />
            </div>
          </div>
          <div style={topBarRightStyle}>
            <button style={topBarIconBtnStyle} onClick={fetchDashboardData} title="Actualizar"><IconRefresh /></button>
            <button style={topBarIconBtnStyle} title="Ayuda"><IconHelp /></button>
            {/* User chip — clickable for logout menu */}
            <div style={{ position: 'relative' }} onClick={e => { e.stopPropagation(); setShowUserMenu(v => !v) }}>
              <button style={userChipStyle}>
                <div style={avatarStyle}>{initials}</div>
                <div>
                  <p style={userNameStyle}>{usuario?.nombre_completo || 'Usuario'}</p>
                  <p style={userRoleStyle}>Ciudadano</p>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              {showUserMenu && (
                <div style={userDropdownStyle}>
                  <div style={dropdownHeaderStyle}>
                    <div style={{ ...avatarStyle, width: 42, height: 42, fontSize: 16 }}>{initials}</div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>{usuario?.nombre_completo}</p>
                      <p style={{ fontSize: 12, color: '#6B7280' }}>Ciudadano · MediRecord</p>
                    </div>
                  </div>
                  <div style={dropdownDivStyle}></div>
                  <button onClick={handleLogout} style={dropdownLogoutBtnStyle}>
                    <IconLogout />
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── CONTENT ───────────────────────────────────── */}
        <main style={contentStyle} className="dashboard-content">

          {/* Heading row */}
          <div style={headingRowStyle} className="dashboard-heading-row">
            <div>
              <p style={breadcrumbStyle}>Inicio / Dashboard</p>
              <h1 style={pageTitleStyle}>Panel de Ficha Vital</h1>
              <p style={pageSubtitleStyle}>Administra tu información médica crítica, revisa el estado de tu QR y controla los accesos recientes.</p>
            </div>
            <div style={headingActionsStyle}>
              <button onClick={handleDownloadQR} style={btnOutlineRedStyle}><IconDownload /> Descargar QR</button>
              <Link to="/registro" style={btnSolidRedStyle}>✏️ Editar Ficha Vital</Link>
            </div>
          </div>

          {error && (
            <div style={errorBannerStyle}><IconExclaim /><span>{error}</span></div>
          )}
          {saveSuccess && (
            <div style={successBannerStyle}><IconCheck /><span>¡Datos guardados correctamente!</span></div>
          )}

          {missingBloodType && (
            <div style={amberBannerStyle}>
              <div style={amberIconStyle}>!</div>
              <div style={{ flex: 1 }}>
                <p style={amberTitleStyle}>Completa un dato importante de tu ficha</p>
                <p style={amberSubStyle}>Agrega tu tipo de sangre para mejorar la utilidad de tu Ficha Vital en una emergencia.</p>
              </div>
              <button onClick={() => setEditingFicha(true)} style={amberBtnStyle}>Completar ahora</button>
            </div>
          )}

          {/* Stat cards */}
          <div style={statRowStyle} className="dashboard-stat-row">
            <div style={statCardStyle}>
              <p style={statLabelStyle}>ESTADO DEL QR</p>
              <p style={statValueStyle}>{activeToken ? 'Activo' : 'Inactivo'}</p>
              <p style={statSubStyle}>Disponible para escaneo mediante enlace seguro.</p>
            </div>
            <div style={statCardStyle}>
              <p style={statLabelStyle}>ÚLTIMA ACTUALIZACIÓN</p>
              <p style={statValueStyle}>
                {perfil?.updated_at
                  ? new Date(perfil.updated_at).toLocaleDateString('es-PE', { day: 'numeric', month: 'long' })
                  : '— sin datos —'}
              </p>
              <p style={statSubStyle}>Actualiza cada vez que cambie tu medicación.</p>
            </div>
            <div style={statCardStyle}>
              <p style={statLabelStyle}>ACCESOS REGISTRADOS</p>
              <p style={statValueStyle}>{String(accesos.length).padStart(2, '0')}</p>
              <p style={statSubStyle}>Consultas recientes guardadas en la bitácora.</p>
            </div>
          </div>

          {/* 2-column grid */}
          <div style={twoColGridStyle} className="dashboard-two-col-grid">

            {/* ── LEFT: Estado Ficha con edición inline ── */}
            <div style={cardStyle}>
              <div style={cardHeaderStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h2 style={cardTitleStyle}>Estado de la Ficha Vital</h2>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={badgeGreenStyle}>● Ficha activa</span>
                  {!editingFicha ? (
                    <button onClick={() => setEditingFicha(true)} style={editInlineBtnStyle}>
                      <IconEdit /> Editar
                    </button>
                  ) : (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => { setEditingFicha(false); setEditValues({ tipo_sangre: perfil?.tipo_sangre || '', peso_kg: perfil?.peso_kg || '', altura_cm: perfil?.altura_cm || '', notas_adicionales: perfil?.notas_adicionales || '', donante_organos: perfil?.donante_organos || false }) }} style={cancelInlineBtnStyle}>Cancelar</button>
                      <button onClick={handleSaveFicha} disabled={saveLoading} style={saveInlineBtnStyle}>
                        <IconSave /> {saveLoading ? 'Guardando...' : 'Guardar'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <p style={cardSubStyle}>Resumen general de datos médicos completados.</p>

              <div style={fichaBodyStyle} className="dashboard-ficha-body">
                <DonutChart percent={completionPercent} />

                <div style={checkListStyle}>
                  {/* Datos personales */}
                  <div style={checkItemStyle}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flex: 1 }}>
                      <span style={checkIconGreenStyle}>✓</span>
                      <div>
                        <p style={checkItemTitleStyle}>Datos personales registrados</p>
                        <p style={checkItemSubStyle}>Nombre, edad y contacto principal.</p>
                      </div>
                    </div>
                    <span style={badgeGrayStyle}>Completo</span>
                  </div>

                  {/* Alergias */}
                  <div style={checkItemStyle}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flex: 1 }}>
                      <span style={alergias.length > 0 ? checkIconGreenStyle : checkIconAmberStyle}>
                        {alergias.length > 0 ? '✓' : '!'}
                      </span>
                      <div>
                        <p style={checkItemTitleStyle}>Alergias y condiciones críticas</p>
                        <p style={checkItemSubStyle}>
                          {alergias.length > 0
                            ? alergias.slice(0, 2).map(a => a.nombre).join(', ') + (alergias.length > 2 ? ` +${alergias.length - 2} más` : '')
                            : 'Sin alergias registradas.'}
                          {condiciones.length > 0 && ` · ${condiciones.length} condición(es) crónica(s)`}
                        </p>
                      </div>
                    </div>
                    <span style={alergias.length > 0 ? badgeGrayStyle : badgeAmberStyle}>{alergias.length > 0 ? 'Completo' : 'Pendiente'}</span>
                  </div>

                  {/* Medicamentos */}
                  <div style={checkItemStyle}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flex: 1 }}>
                      <span style={medicamentos.length > 0 ? checkIconGreenStyle : checkIconAmberStyle}>
                        {medicamentos.length > 0 ? '✓' : '!'}
                      </span>
                      <div>
                        <p style={checkItemTitleStyle}>Medicación actual</p>
                        <p style={checkItemSubStyle}>
                          {medicamentos.length > 0
                            ? medicamentos.slice(0, 2).map(m => m.nombre).join(', ') + (medicamentos.length > 2 ? ` +${medicamentos.length - 2} más` : '')
                            : 'Sin medicamentos registrados.'}
                        </p>
                      </div>
                    </div>
                    <span style={medicamentos.length > 0 ? badgeGrayStyle : badgeAmberStyle}>{medicamentos.length > 0 ? 'Completo' : 'Pendiente'}</span>
                  </div>

                  {/* Tipo de sangre — inline editable */}
                  <div style={checkItemStyle}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flex: 1 }}>
                      <span style={missingBloodType ? checkIconAmberStyle : checkIconGreenStyle}>
                        {missingBloodType ? '!' : '✓'}
                      </span>
                      <div style={{ flex: 1 }}>
                        <p style={checkItemTitleStyle}>{missingBloodType ? 'Tipo de sangre pendiente' : `Tipo de sangre: ${perfil?.tipo_sangre}`}</p>
                        {editingFicha ? (
                          <select
                            value={editValues.tipo_sangre}
                            onChange={e => setEditValues(v => ({ ...v, tipo_sangre: e.target.value }))}
                            style={inlineSelectStyle}
                          >
                            <option value="">Seleccionar...</option>
                            {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        ) : (
                          <p style={checkItemSubStyle}>Este dato ayuda al personal médico en atención urgente.</p>
                        )}
                      </div>
                    </div>
                    <span style={missingBloodType ? badgeAmberStyle : badgeGrayStyle}>{missingBloodType ? 'Falta dato' : 'Completo'}</span>
                  </div>
                </div>
              </div>

              {/* Additional inline-edit fields */}
              {editingFicha && (
                <div style={inlineEditPanelStyle}>
                  <p style={inlineEditTitleStyle}>Edición rápida de métricas</p>
                  <div style={inlineEditGridStyle}>
                    <div>
                      <label style={inlineLabelStyle}>Peso (kg)</label>
                      <input type="number" value={editValues.peso_kg} onChange={e => setEditValues(v => ({ ...v, peso_kg: e.target.value }))} style={inlineInputStyle} placeholder="ej. 70" />
                    </div>
                    <div>
                      <label style={inlineLabelStyle}>Altura (cm)</label>
                      <input type="number" value={editValues.altura_cm} onChange={e => setEditValues(v => ({ ...v, altura_cm: e.target.value }))} style={inlineInputStyle} placeholder="ej. 175" />
                    </div>
                    <div style={{ gridColumn: '1/-1' }}>
                      <label style={inlineLabelStyle}>Donante de órganos</label>
                      <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                        {[true, false].map(val => (
                          <button key={String(val)} onClick={() => setEditValues(v => ({ ...v, donante_organos: val }))}
                            style={{ ...inlineToggleBtnStyle, ...(editValues.donante_organos === val ? inlineToggleBtnActiveStyle : {}) }}>
                            {val ? 'Sí, soy donante' : 'No soy donante'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div style={{ gridColumn: '1/-1' }}>
                      <label style={inlineLabelStyle}>Notas médicas adicionales</label>
                      <textarea value={editValues.notas_adicionales} onChange={e => setEditValues(v => ({ ...v, notas_adicionales: e.target.value }))}
                        style={{ ...inlineInputStyle, minHeight: 80, resize: 'vertical' }}
                        placeholder="Marcapasos, implantes, observaciones especiales..." />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── RIGHT: Mi QR ── */}
            <div style={cardStyle}>
              <div style={cardHeaderStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={cardIconRedQrStyle}><IconQrLarge /></span>
                  <h2 style={cardTitleStyle}>Mi QR de emergencia</h2>
                </div>
                <span style={badgeGreenStyle}>● Activo</span>
              </div>
              <p style={cardSubStyle}>Identificador público de acceso rápido.</p>

              <div style={qrSectionStyle} className="dashboard-qr-section">
                <div style={qrImageWrapStyle}>
                  {qrImageUrl ? (
                    <img src={qrImageUrl} alt="Código QR de emergencia" style={qrImgStyle} />
                  ) : (
                    <div style={qrPlaceholderStyle}>{qrError || 'Generando QR...'}</div>
                  )}
                </div>

                <div style={qrInfoColStyle} className="dashboard-qr-info-col">
                  <p style={qrInfoTitleStyle}>Ficha Vital disponible</p>
                  <p style={qrInfoSubStyle}>Imprime este QR o colócalo en tu casco, DNI, tarjeta física o pantalla de bloqueo.</p>
                  {activeToken && (
                    <p style={qrTokenStyle}>/emergency/{activeToken.token_uuid?.slice(0, 16)}...</p>
                  )}

                  <div style={qrActionsRowStyle}>
                    <button onClick={handleDownloadQR} style={qrActionBtnGrayStyle}><IconDownload /> Descargar</button>
                    <button onClick={() => window.print()} style={qrActionBtnGrayStyle}><IconPrint /> Imprimir</button>
                    <button onClick={() => setIsRevokeModalOpen(true)} style={qrActionBtnDangerStyle}><IconExclaim /> Revocar</button>
                  </div>

                  {/* Vista del paramédico */}
                  {activeToken && (
                    <Link
                      to={`/emergency/${activeToken.token_uuid}`}
                      target="_blank"
                      style={paramedBtnStyle}
                    >
                      <IconAmbulance />
                      Vista del paramédico
                    </Link>
                  )}

                  <button style={nfcLinkStyle} onClick={() => setIsNfcModalOpen(true)}>
                    + Vincular Tag NFC
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Access log */}
          <div style={{ ...cardStyle, marginTop: 24 }}>
            <div style={cardHeaderStyle}>
              <h2 style={cardTitleStyle}>Historial de Accesos de Emergencia</h2>
              <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500 }}>Últimos 10 registros</span>
            </div>
            {accesos.length === 0 ? (
              <p style={emptyTableStyle}>Ningún acceso de emergencia registrado hasta el momento.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={tableStyle}>
                  <thead>
                    <tr style={thRowStyle}>
                      <th style={thStyle}>Fecha / Hora</th>
                      <th style={thStyle}>IP Origen</th>
                      <th style={thStyle}>Vía</th>
                      <th style={thStyle}>Resultado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accesos.map(acc => (
                      <tr key={acc.id} style={tdRowStyle}>
                        <td style={tdStyle}>{new Date(acc.accedido_en).toLocaleString()}</td>
                        <td style={tdStyle}>{acc.ip_origen || 'Desconocida'}</td>
                        <td style={tdStyle}>{acc.via_nfc ? '📟 NFC' : '📷 QR'}</td>
                        <td style={tdStyle}>
                          <span style={acc.resultado === 'exitoso' ? accOkStyle : accErrStyle}>
                            {acc.resultado.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ═══ MODALS ═══════════════════════════════════════ */}
      <Modal isOpen={isRevokeModalOpen} onClose={() => setIsRevokeModalOpen(false)} title="⚠️ Revocar Código QR de Emergencia">
        <p style={modalDescStyle}>Al revocar este token QR, se invalidará permanentemente el código actual. Un nuevo QR activo será generado al instante.</p>
        <div style={inputGroupStyle}>
          <label style={modalLabelStyle}>Motivo de la Revocación</label>
          <select value={revokeMotivo} onChange={(e) => setRevokeMotivo(e.target.value)} style={modalSelectStyle}>
            <option value="Pérdida de dispositivo">Pérdida de dispositivo físico</option>
            <option value="Actualización de datos">Actualización profunda de datos</option>
            <option value="Sospecha de vulnerabilidad">Sospecha de escaneo malintencionado</option>
            <option value="Otro">Otro motivo</option>
          </select>
        </div>
        {revokeMotivo === 'Otro' && (
          <div style={{ ...inputGroupStyle, marginTop: 12 }}>
            <label style={modalLabelStyle}>Especifique el motivo</label>
            <input type="text" placeholder="Ej. Robo de billetera con tarjeta vital" value={customMotivo} onChange={(e) => setCustomMotivo(e.target.value)} style={modalInputStyle} />
          </div>
        )}
        <div style={modalBtnRowStyle}>
          <button onClick={() => setIsRevokeModalOpen(false)} style={modalBtnSecStyle} disabled={actionLoading}>Cancelar</button>
          <button onClick={handleRevokeToken} style={modalBtnDangerStyle} disabled={actionLoading}>
            {actionLoading ? 'Revocando...' : 'Confirmar Revocación'}
          </button>
        </div>
      </Modal>

      <Modal isOpen={isNfcModalOpen} onClose={() => setIsNfcModalOpen(false)} title="📟 Vincular Tag NFC Físico">
        <p style={modalDescStyle}>Vincule un dispositivo físico de identificación médica (pulsera, llavero o sticker NTAG213/215).</p>
        <div style={inputGroupStyle}>
          <label style={modalLabelStyle}>UID físico del Chip NFC</label>
          <input type="text" placeholder="Ej. 04:A3:B2:C1:D0:E9:80" value={manualNfcUid} onChange={(e) => setManualNfcUid(e.target.value)} style={modalInputStyle} />
          <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>*Para pruebas del SQA, ingrese cualquier identificador alfanumérico único.</p>
        </div>
        <div style={modalBtnRowStyle}>
          <button onClick={() => setIsNfcModalOpen(false)} style={modalBtnSecStyle} disabled={actionLoading}>Cancelar</button>
          <button onClick={handleRegisterNfc} style={modalBtnPrimaryStyle} disabled={actionLoading || !manualNfcUid.trim()}>
            {actionLoading ? 'Guardando...' : 'Vincular Dispositivo'}
          </button>
        </div>
      </Modal>
    </div>
  )
}

/* ══════════════════════════════════════════════════════
   STYLES
═══════════════════════════════════════════════════════ */
const loadingWrapStyle = { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100vh', backgroundColor:'#F8FAFC' }
const spinnerStyle = { width:48, height:48, border:'5px solid #E2E8F0', borderTop:'5px solid #DC2626', borderRadius:'50%', animation:'spin 1s linear infinite' }
const shellStyle = { display:'flex', minHeight:'100vh', backgroundColor:'#F8FAFC', fontFamily:"system-ui,-apple-system,'Segoe UI',sans-serif" }

// SIDEBAR
const sidebarStyle = { width:260, flexShrink:0, backgroundColor:'#111827', display:'flex', flexDirection:'column', padding:'24px 0', minHeight:'100vh', position:'sticky', top:0, height:'100vh', overflowY:'auto' }
const logoAreaStyle = { display:'flex', alignItems:'center', gap:12, padding:'0 20px', marginBottom:32 }
const logoCircleStyle = { width:38, height:38, borderRadius:'50%', backgroundColor:'#DC2626', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:'0 4px 12px rgba(220,38,38,0.4)' }
const logoTextStyle = { color:'#FFFFFF', fontWeight:700, fontSize:18, letterSpacing:'-0.3px' }
const navSectionLabelStyle = { fontSize:10, fontWeight:700, color:'#6B7280', letterSpacing:'1px', textTransform:'uppercase', padding:'0 20px', marginBottom:6 }
const navItemBase = { display:'flex', alignItems:'center', gap:10, padding:'10px 20px', borderRadius:8, margin:'1px 8px', fontSize:14, fontWeight:500, cursor:'pointer', border:'none', textDecoration:'none', textAlign:'left', transition:'all 0.15s ease' }
const navItemStyle = { ...navItemBase, color:'#9CA3AF', backgroundColor:'transparent' }
const navItemActiveStyle = { ...navItemBase, color:'#FFFFFF', backgroundColor:'#DC2626' }
const navItemDangerStyle = { ...navItemBase, color:'#F87171', backgroundColor:'transparent' }
const navIconStyle = { color:'#6B7280', display:'flex' }
const navIconActiveStyle = { color:'#FFFFFF', display:'flex' }
const navIconDangerStyle = { color:'#F87171', display:'flex' }
const navDividerStyle = { height:1, backgroundColor:'#1F2937', margin:'16px 20px' }
const sidebarEmergencyCardStyle = { margin:'20px 12px 0', padding:'18px', borderRadius:12, backgroundColor:'#DC2626', marginTop:'auto' }
const sidebarCardTitleStyle = { color:'#FFFFFF', fontWeight:700, fontSize:14, marginBottom:6 }
const sidebarCardSubStyle = { color:'rgba(255,255,255,0.80)', fontSize:12, lineHeight:1.5, marginBottom:14 }
const sidebarCardBtnStyle = { display:'inline-block', backgroundColor:'#FFFFFF', color:'#DC2626', fontSize:12, fontWeight:700, padding:'6px 14px', borderRadius:6, textDecoration:'none' }
const sidebarLogoutBtnStyle = { display:'flex', alignItems:'center', gap:10, padding:'12px 20px', margin:'12px 8px 0', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer', border:'1px solid #374151', backgroundColor:'transparent', color:'#9CA3AF', transition:'all 0.15s', width:'calc(100% - 16px)', textAlign:'left' }

// MAIN
const mainAreaStyle = { flex:1, display:'flex', flexDirection:'column', minWidth:0 }
const topBarStyle = { backgroundColor:'#FFFFFF', borderBottom:'1px solid #E5E7EB', padding:'14px 32px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, position:'sticky', top:0, zIndex:50, boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }
const searchWrapStyle = { position:'relative', display:'flex', alignItems:'center' }
const searchIconStyle = { position:'absolute', left:12, color:'#9CA3AF', display:'flex' }
const searchInputStyle = { width:400, padding:'9px 14px 9px 38px', border:'1px solid #E5E7EB', borderRadius:10, fontSize:13, color:'#374151', backgroundColor:'#F9FAFB', outline:'none', fontFamily:'inherit' }
const topBarRightStyle = { display:'flex', alignItems:'center', gap:8 }
const topBarIconBtnStyle = { width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid #E5E7EB', borderRadius:8, background:'transparent', color:'#6B7280', cursor:'pointer' }
const userChipStyle = { display:'flex', alignItems:'center', gap:10, padding:'6px 12px', border:'1px solid #E5E7EB', borderRadius:10, marginLeft:4, background:'transparent', cursor:'pointer' }
const avatarStyle = { width:34, height:34, borderRadius:'50%', backgroundColor:'#DC2626', color:'#FFFFFF', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, flexShrink:0 }
const userNameStyle = { fontSize:13, fontWeight:700, color:'#111827', lineHeight:1.2 }
const userRoleStyle = { fontSize:11, color:'#6B7280', fontWeight:500 }

// User dropdown
const userDropdownStyle = { position:'absolute', top:'calc(100% + 8px)', right:0, backgroundColor:'#FFFFFF', border:'1px solid #E5E7EB', borderRadius:12, boxShadow:'0 8px 24px rgba(0,0,0,0.12)', width:220, zIndex:200, overflow:'hidden' }
const dropdownHeaderStyle = { display:'flex', alignItems:'center', gap:12, padding:'16px' }
const dropdownDivStyle = { height:1, backgroundColor:'#F3F4F6' }
const dropdownLogoutBtnStyle = { display:'flex', alignItems:'center', gap:10, width:'100%', padding:'12px 16px', border:'none', background:'transparent', fontSize:13, fontWeight:600, color:'#DC2626', cursor:'pointer', textAlign:'left' }

// CONTENT
const contentStyle = { flex:1, padding:'28px 32px 40px', overflowY:'auto' }
const headingRowStyle = { display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:16, marginBottom:24 }
const breadcrumbStyle = { fontSize:12, color:'#DC2626', fontWeight:600, marginBottom:6 }
const pageTitleStyle = { fontSize:32, fontWeight:800, color:'#111827', letterSpacing:'-0.5px', lineHeight:1.1, marginBottom:8 }
const pageSubtitleStyle = { fontSize:14, color:'#6B7280', maxWidth:620, lineHeight:1.55 }
const headingActionsStyle = { display:'flex', gap:10, flexShrink:0, marginTop:4 }
const btnOutlineRedStyle = { display:'inline-flex', alignItems:'center', gap:6, padding:'10px 18px', border:'1.5px solid #DC2626', borderRadius:9, color:'#DC2626', backgroundColor:'#FFFFFF', fontSize:13, fontWeight:600, cursor:'pointer', textDecoration:'none' }
const btnSolidRedStyle = { display:'inline-flex', alignItems:'center', gap:6, padding:'10px 18px', border:'none', borderRadius:9, color:'#FFFFFF', backgroundColor:'#DC2626', fontSize:13, fontWeight:600, cursor:'pointer', textDecoration:'none', boxShadow:'0 4px 12px rgba(220,38,38,0.25)' }

const errorBannerStyle = { display:'flex', alignItems:'center', gap:10, padding:'12px 16px', backgroundColor:'#FEF2F2', border:'1px solid #FEE2E2', borderRadius:10, color:'#DC2626', fontSize:13.5, fontWeight:500, marginBottom:20 }
const successBannerStyle = { display:'flex', alignItems:'center', gap:10, padding:'12px 16px', backgroundColor:'#ECFDF5', border:'1px solid #A7F3D0', borderRadius:10, color:'#065F46', fontSize:13.5, fontWeight:600, marginBottom:20 }
const amberBannerStyle = { display:'flex', alignItems:'center', gap:14, backgroundColor:'#FFFBEB', borderLeft:'4px solid #F59E0B', border:'1px solid #FDE68A', borderLeftWidth:4, borderLeftColor:'#F59E0B', borderRadius:'0 10px 10px 0', padding:'16px 20px', marginBottom:24 }
const amberIconStyle = { width:32, height:32, borderRadius:'50%', backgroundColor:'#FEF3C7', color:'#D97706', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:800, flexShrink:0 }
const amberTitleStyle = { fontSize:14, fontWeight:700, color:'#92400E', marginBottom:2 }
const amberSubStyle = { fontSize:13, color:'#78350F' }
const amberBtnStyle = { fontSize:13, fontWeight:700, color:'#DC2626', background:'transparent', border:'none', cursor:'pointer', flexShrink:0, whiteSpace:'nowrap' }

const statRowStyle = { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:24 }
const statCardStyle = { backgroundColor:'#FFFFFF', border:'1px solid #E5E7EB', borderRadius:12, padding:'20px 24px', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }
const statLabelStyle = { fontSize:10, fontWeight:700, color:'#9CA3AF', letterSpacing:'0.8px', textTransform:'uppercase', marginBottom:8 }
const statValueStyle = { fontSize:28, fontWeight:800, color:'#111827', lineHeight:1, marginBottom:8 }
const statSubStyle = { fontSize:12, color:'#9CA3AF', lineHeight:1.4 }

const twoColGridStyle = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }
const cardStyle = { backgroundColor:'#FFFFFF', border:'1px solid #E5E7EB', borderRadius:14, padding:'24px', boxShadow:'0 2px 10px rgba(0,0,0,0.04)' }
const cardHeaderStyle = { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }
const cardIconRedQrStyle = { display:'flex', color:'#DC2626', width:32, height:32, borderRadius:8, backgroundColor:'#FEF2F2', alignItems:'center', justifyContent:'center' }
const cardTitleStyle = { fontSize:15, fontWeight:700, color:'#111827' }
const cardSubStyle = { fontSize:13, color:'#9CA3AF', marginBottom:20, marginTop:2 }
const badgeGreenStyle = { fontSize:11, fontWeight:700, color:'#065F46', backgroundColor:'#D1FAE5', padding:'3px 10px', borderRadius:20, flexShrink:0 }
const badgeGrayStyle = { fontSize:11, fontWeight:600, color:'#374151', backgroundColor:'#F3F4F6', padding:'2px 8px', borderRadius:6, flexShrink:0 }
const badgeAmberStyle = { fontSize:11, fontWeight:700, color:'#92400E', backgroundColor:'#FEF3C7', padding:'2px 8px', borderRadius:6, flexShrink:0 }

// Inline edit controls
const editInlineBtnStyle = { display:'flex', alignItems:'center', gap:5, padding:'5px 10px', border:'1px solid #E5E7EB', borderRadius:7, fontSize:12, fontWeight:600, color:'#374151', backgroundColor:'#F9FAFB', cursor:'pointer' }
const cancelInlineBtnStyle = { padding:'5px 10px', border:'1px solid #E5E7EB', borderRadius:7, fontSize:12, fontWeight:600, color:'#6B7280', backgroundColor:'transparent', cursor:'pointer' }
const saveInlineBtnStyle = { display:'flex', alignItems:'center', gap:5, padding:'5px 12px', border:'none', borderRadius:7, fontSize:12, fontWeight:700, color:'#FFFFFF', backgroundColor:'#DC2626', cursor:'pointer' }
const inlineSelectStyle = { marginTop:6, padding:'6px 10px', border:'1px solid #D1D5DB', borderRadius:7, fontSize:13, fontFamily:'inherit', outline:'none', cursor:'pointer', width:'100%' }
const inlineEditPanelStyle = { marginTop:20, paddingTop:16, borderTop:'1px solid #F3F4F6' }
const inlineEditTitleStyle = { fontSize:12, fontWeight:700, color:'#6B7280', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:12 }
const inlineEditGridStyle = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }
const inlineLabelStyle = { fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:4 }
const inlineInputStyle = { width:'100%', padding:'8px 10px', border:'1px solid #D1D5DB', borderRadius:7, fontSize:13, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }
const inlineToggleBtnStyle = { flex:1, padding:'8px 12px', border:'1px solid #E5E7EB', borderRadius:7, fontSize:12, fontWeight:600, color:'#6B7280', backgroundColor:'#F9FAFB', cursor:'pointer' }
const inlineToggleBtnActiveStyle = { backgroundColor:'#DC2626', color:'#FFFFFF', border:'1px solid #DC2626' }

// Ficha body
const fichaBodyStyle = { display:'flex', alignItems:'flex-start', gap:20 }
const checkListStyle = { flex:1, display:'flex', flexDirection:'column', gap:14 }
const checkItemStyle = { display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:10, paddingBottom:14, borderBottom:'1px solid #F3F4F6' }
const checkIconGreenStyle = { width:20, height:20, borderRadius:'50%', backgroundColor:'#D1FAE5', color:'#10B981', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, flexShrink:0, marginTop:1 }
const checkIconAmberStyle = { width:20, height:20, borderRadius:'50%', backgroundColor:'#FEF3C7', color:'#D97706', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, flexShrink:0, marginTop:1 }
const checkItemTitleStyle = { fontSize:13, fontWeight:600, color:'#111827', lineHeight:1.3 }
const checkItemSubStyle = { fontSize:12, color:'#9CA3AF', marginTop:2 }

// QR section
const qrSectionStyle = { display:'flex', gap:20, alignItems:'flex-start' }
const qrImageWrapStyle = { backgroundColor:'#F8FAFC', border:'1px solid #E5E7EB', borderRadius:12, padding:12, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }
const qrImgStyle = { width:180, height:180, display:'block', borderRadius:6 }
const qrPlaceholderStyle = { width:180, height:180, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, color:'#9CA3AF', fontWeight:500, textAlign:'center', padding:12 }
const qrInfoColStyle = { flex:1, minWidth:0 }
const qrInfoTitleStyle = { fontSize:15, fontWeight:700, color:'#111827', marginBottom:6 }
const qrInfoSubStyle = { fontSize:12, color:'#6B7280', lineHeight:1.55, marginBottom:12 }
const qrTokenStyle = { fontSize:10, color:'#9CA3AF', fontFamily:'monospace', backgroundColor:'#F3F4F6', padding:'4px 8px', borderRadius:6, marginBottom:14, display:'block', wordBreak:'break-all' }
const qrActionsRowStyle = { display:'flex', gap:8, flexWrap:'wrap', marginBottom:12 }
const qrActionBtnBase = { display:'inline-flex', alignItems:'center', gap:5, padding:'7px 12px', borderRadius:7, fontSize:12, fontWeight:600, cursor:'pointer' }
const qrActionBtnGrayStyle = { ...qrActionBtnBase, border:'1px solid #D1D5DB', backgroundColor:'#FFFFFF', color:'#374151' }
const qrActionBtnDangerStyle = { ...qrActionBtnBase, border:'1px solid #FCA5A5', backgroundColor:'#FFFFFF', color:'#DC2626' }
const paramedBtnStyle = { display:'flex', alignItems:'center', gap:7, padding:'9px 14px', border:'none', borderRadius:8, backgroundColor:'#111827', color:'#FFFFFF', fontSize:13, fontWeight:700, cursor:'pointer', textDecoration:'none', marginBottom:10, width:'100%', justifyContent:'center' }
const nfcLinkStyle = { border:'none', background:'transparent', cursor:'pointer', color:'#DC2626', fontSize:12, fontWeight:700, padding:0 }

// Table
const tableStyle = { width:'100%', borderCollapse:'collapse' }
const thRowStyle = { borderBottom:'2px solid #E5E7EB' }
const thStyle = { padding:'10px 14px', fontSize:11, fontWeight:700, color:'#6B7280', textTransform:'uppercase', letterSpacing:'0.5px', textAlign:'left' }
const tdRowStyle = { borderBottom:'1px solid #F3F4F6' }
const tdStyle = { padding:'12px 14px', fontSize:13, color:'#374151', fontWeight:500 }
const emptyTableStyle = { textAlign:'center', padding:'24px', color:'#9CA3AF', fontSize:13, fontWeight:500 }
const accOkStyle = { fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:4, backgroundColor:'#D1FAE5', color:'#065F46' }
const accErrStyle = { fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:4, backgroundColor:'#FEF2F2', color:'#DC2626' }

// Modals
const modalDescStyle = { fontSize:13.5, color:'#475569', lineHeight:1.5, marginBottom:20 }
const inputGroupStyle = { display:'flex', flexDirection:'column', gap:6 }
const modalLabelStyle = { fontSize:13, fontWeight:600, color:'#475569' }
const modalSelectStyle = { padding:'11px 12px', border:'1px solid #D1D5DB', borderRadius:8, fontSize:14, fontFamily:'inherit', outline:'none', cursor:'pointer' }
const modalInputStyle = { padding:'11px 12px', border:'1px solid #D1D5DB', borderRadius:8, fontSize:14, fontFamily:'inherit', outline:'none', width:'100%', boxSizing:'border-box' }
const modalBtnRowStyle = { display:'flex', justifyContent:'flex-end', gap:10, marginTop:24, borderTop:'1px solid #E5E7EB', paddingTop:16 }
const modalBtnSecStyle = { padding:'10px 20px', borderRadius:8, border:'none', backgroundColor:'#F3F4F6', color:'#374151', fontSize:13.5, fontWeight:600, cursor:'pointer' }
const modalBtnDangerStyle = { padding:'10px 20px', borderRadius:8, border:'none', backgroundColor:'#DC2626', color:'#FFFFFF', fontSize:13.5, fontWeight:600, cursor:'pointer' }
const modalBtnPrimaryStyle = { padding:'10px 20px', borderRadius:8, border:'none', backgroundColor:'#10B981', color:'#FFFFFF', fontSize:13.5, fontWeight:600, cursor:'pointer' }
