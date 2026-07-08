import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, removeToken } from '../api'
import Modal from '../components/Modal'
import QRCode from 'qrcode'

/* ─── useTypewriter ─────────────────────────────────────────────────── */
function useTypewriter(text, speed = 42) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)
  useEffect(() => {
    setDisplayed(''); setDone(false)
    if (!text) return
    let i = 0
    const id = setInterval(() => {
      i++; setDisplayed(text.slice(0, i))
      if (i >= text.length) { clearInterval(id); setDone(true) }
    }, speed)
    return () => clearInterval(id)
  }, [text, speed])
  return { displayed, done }
}

/* ─── SVG Icons ─────────────────────────────────────────────────────── */
const Ic = {
  qr: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h.01M18 14h.01M14 18h.01M18 18h.01M14 21h7M21 14v7"/></svg>,
  qrLg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h.01M18 14h.01M14 18h.01M18 18h.01M14 21h7M21 14v7"/></svg>,
  clock: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  eye: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  eyeOff: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
  warn: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  check: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  download: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  print: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>,
  edit: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  save: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  logout: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  refresh: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
  help: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  search: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  dashboard: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  shield: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  audit: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  revoke: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
  lock: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  ambulance: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/><path d="M7 10h4M9 8v4"/></svg>,
  person: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  allergy: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  pill: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.5 20H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H20a2 2 0 0 1 2 2v3"/><circle cx="18" cy="18" r="3"/><path d="m22 22-1.5-1.5"/></svg>,
  phone: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92v2z"/></svg>,
  heart: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
  activity: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  trash: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  chevron: (open) => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.25s ease', flexShrink: 0 }}><polyline points="6 9 12 15 18 9"/></svg>,
  arrow: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  key: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>,
}

/* ─── Donut chart ─────────────────────────────────────────────────────  */
function DonutChart({ percent = 0 }) {
  const r = 52; const circ = 2 * Math.PI * r
  const offset = circ - (percent / 100) * circ
  const color = percent >= 80 ? '#10B981' : percent >= 40 ? '#F59E0B' : '#DC2626'
  return (
    <div style={{ position:'relative', width:130, height:130, flexShrink:0 }}>
      <svg width="130" height="130" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={r} fill="none" stroke="#F1F5F9" strokeWidth="13"/>
        <circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="13"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          transform="rotate(-90 70 70)" style={{ transition:'stroke-dashoffset 1s ease' }}/>
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
        <span style={{ fontSize:'20px', fontWeight:800, color:'#0F172A' }}>{percent}%</span>
        <span style={{ fontSize:'9px', fontWeight:700, color:'#94A3B8', marginTop:1, textTransform:'uppercase', letterSpacing:'0.5px' }}>completa</span>
      </div>
    </div>
  )
}

/* ─── DashSelect – custom styled dropdown (RegistroMultistep aesthetic) ── */
function DashSelect({ value, onChange, options, placeholder = 'Seleccionar...' }) {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [open])
  const label = options.find(o => o === value || o?.value === value)
  const labelStr = label ? (typeof label === 'string' ? label : label.label) : null
  return (
    <div style={{ position:'relative' }} onClick={e=>e.stopPropagation()}>
      <button type="button" onClick={()=>setOpen(v=>!v)}
        style={{ width:'100%', padding:'9px 12px', borderRadius:8, fontSize:13.5, fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer', boxSizing:'border-box', transition:'border-color 0.2s ease', border: value ? '1.5px solid #10B981' : '1.5px solid #D1D5DB', backgroundColor:'#FFFFFF', color: value ? '#0F172A' : '#9CA3AF', outline:'none' }}>
        <span>{labelStr || placeholder}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" style={{ transform:open?'rotate(180deg)':'none', transition:'transform 0.2s', flexShrink:0 }}><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      {open && (
        <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, right:0, backgroundColor:'#FFFFFF', border:'1.5px solid #DC2626', borderRadius:9, boxShadow:'0 10px 28px rgba(15,23,42,0.12)', zIndex:600, overflow:'hidden', maxHeight:240, overflowY:'auto' }}>
          {options.map(opt => {
            const v = typeof opt === 'string' ? opt : opt.value
            const l = typeof opt === 'string' ? opt : opt.label
            const sel = value === v
            return (
              <button key={v} type="button" onClick={()=>{ onChange(v); setOpen(false) }}
                style={{ display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%', padding:'9px 14px', border:'none', borderBottom:'1px solid #F9FAFB', backgroundColor:sel?'#FEF2F2':'#FFFFFF', color:sel?'#DC2626':'#374151', fontSize:13, fontWeight:sel?700:500, cursor:'pointer', textAlign:'left' }}>
                {l}
                {sel && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ─── Inline form field (form aesthetic) ─────────────────────────────── */
function FField({ label, required, error, touched, children }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
      <label style={{ fontSize:12.5, fontWeight:600, color:'#374151' }}>
        {label}{required && <span style={{ color:'#DC2626', marginLeft:2 }}>*</span>}
      </label>
      {children}
      {touched && error && <span style={{ fontSize:11.5, color:'#EF4444', fontWeight:500 }}>{error}</span>}
    </div>
  )
}

function fInput(valid, invalid) {
  return {
    width:'100%', padding:'9px 12px', borderRadius:8, fontSize:13.5, fontFamily:'inherit',
    outline:'none', boxSizing:'border-box', transition:'border-color 0.2s ease',
    border: invalid ? '1.5px solid #EF4444' : valid ? '1.5px solid #10B981' : '1.5px solid #D1D5DB',
  }
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
  const [accesos, setAccesos] = useState([])
  const [qrError, setQrError] = useState(null)
  const [qrImageUrl, setQrImageUrl] = useState('')

  // Modals: existing
  const [isRevokeModalOpen, setIsRevokeModalOpen] = useState(false)
  const [revokeMotivo, setRevokeMotivo] = useState('Pérdida de dispositivo')
  const [customMotivo, setCustomMotivo] = useState('')
  const [isNfcModalOpen, setIsNfcModalOpen] = useState(false)
  const [manualNfcUid, setManualNfcUid] = useState('')

  // Modals: new section editors
  const [isPersonalOpen, setIsPersonalOpen] = useState(false)
  const [personalForm, setPersonalForm] = useState({})
  const [personalSaving, setPersonalSaving] = useState(false)

  const [isAlergiasOpen, setIsAlergiasOpen] = useState(false)
  const [localAlergias, setLocalAlergias] = useState([])
  const [localCondiciones, setLocalCondiciones] = useState([])
  const [alergiasSaving, setAlergiasSaving] = useState(false)

  const [isMedOpen, setIsMedOpen] = useState(false)
  const [localMeds, setLocalMeds] = useState([])
  const [medsSaving, setMedsSaving] = useState(false)

  const [isContactosOpen, setIsContactosOpen] = useState(false)
  const [localContactos, setLocalContactos] = useState([])
  const [contactosSaving, setContactosSaving] = useState(false)

  // Change password
  const [isChangePwdOpen, setIsChangePwdOpen] = useState(false)
  const [pwdForm, setPwdForm] = useState({ actual:'', nueva:'', confirmar:'' })
  const [pwdLoading, setPwdLoading] = useState(false)
  const [pwdError, setPwdError] = useState(null)
  const [pwdSuccess, setPwdSuccess] = useState(false)
  const [showPwd, setShowPwd] = useState({ actual:false, nueva:false, confirmar:false })

  // UI
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [securityOpen, setSecurityOpen] = useState(false)
  const [savedSection, setSavedSection] = useState(null) // 'personal'|'alergias'|'meds'|'contactos'

  // ── FETCH ─────────────────────────────────────────────
  const fetchDashboardData = async () => {
    try {
      setLoading(true); setError(null)
      const ficha = await api.getFicha()
      setUsuario({ nombre_completo: ficha.nombre_completo, numero_documento: ficha.numero_documento, telefono: ficha.telefono })
      setActiveToken(ficha.token_qr ? { token_uuid: ficha.token_qr } : null)
      setPerfil({ tipo_sangre: ficha.tipo_sangre, sexo: ficha.sexo, fecha_nacimiento: ficha.fecha_nacimiento, donante_organos: ficha.donante_organos, peso_kg: ficha.peso_kg, altura_cm: ficha.altura_cm, notas_adicionales: ficha.notas_adicionales })
      setAlergias(ficha.alergias || [])
      setCondiciones(ficha.condiciones || [])
      setMedicamentos(ficha.medicamentos || [])
      setContactos(ficha.contactos || [])
    } catch (err) {
      if (err.message?.includes('401') || err.message?.includes('Credenciales')) { removeToken(); navigate('/login') }
      else setError(err.message || 'Error al cargar datos.')
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchDashboardData() }, [])

  // ── QR ───────────────────────────────────────────────
  useEffect(() => {
    if (!activeToken?.token_uuid) { setQrImageUrl(''); return }
    let cancelled = false; setQrError(null)
    QRCode.toDataURL(`${window.location.origin}/emergency/${activeToken.token_uuid}`, { width:240, margin:2, errorCorrectionLevel:'H', color:{ dark:'#0F172A', light:'#FFFFFF' } })
      .then(url => { if (!cancelled) setQrImageUrl(url) })
      .catch(() => { if (!cancelled) setQrError('No se pudo generar el QR.') })
    return () => { cancelled = true }
  }, [activeToken])

  // ── DOWNLOAD QR ───────────────────────────────────────
  const handleDownloadQR = async () => {
    if (!activeToken || !usuario) return
    try {
      const url = `${window.location.origin}/emergency/${activeToken.token_uuid}`
      const qrDataUrl = await QRCode.toDataURL(url, { width:260, margin:2, errorCorrectionLevel:'H', color:{ dark:'#0F172A', light:'#FFFFFF' } })
      const canvas = document.createElement('canvas'); canvas.width=400; canvas.height=520
      const ctx = canvas.getContext('2d')
      ctx.fillStyle='#FFFFFF'; ctx.fillRect(0,0,400,520)
      ctx.fillStyle='#DC2626'; ctx.fillRect(0,0,400,70)
      ctx.fillStyle='#FFFFFF'; ctx.font='bold 18px Inter,sans-serif'; ctx.textAlign='center'
      ctx.fillText('MediRecord UNMSM',200,32); ctx.font='600 11px Inter,sans-serif'; ctx.fillText('FICHA VITAL DE EMERGENCIA',200,52)
      const img = new Image(); img.src=qrDataUrl; await img.decode()
      ctx.drawImage(img,70,100,260,260)
      ctx.fillStyle='#475569'; ctx.font='bold 14px Inter,sans-serif'; ctx.fillText(usuario.nombre_completo.toUpperCase(),200,390)
      ctx.fillStyle='#94A3B8'; ctx.font='600 11px Inter,sans-serif'; ctx.fillText(`Doc: ${usuario.numero_documento}`,200,410)
      ctx.fillStyle='#0F172A'; ctx.fillRect(0,445,400,75)
      ctx.fillStyle='#FFFFFF'; ctx.font='bold 13px Inter,sans-serif'; ctx.fillText('EN CASO DE EMERGENCIA ESCANEE AQUI',200,472)
      const a = document.createElement('a'); a.download=`MediRecord_QR_${usuario.numero_documento}.png`; a.href=canvas.toDataURL('image/png'); a.click()
    } catch (err) { setQrError(err.message) }
  }

  // ── REVOKE ───────────────────────────────────────────
  const handleRevokeToken = async () => {
    setActionLoading(true); setError(null)
    try {
      await api.revokeToken(); setIsRevokeModalOpen(false); setRevokeMotivo('Pérdida de dispositivo'); setCustomMotivo('')
      await fetchDashboardData()
    } catch (err) { setError(err.message) }
    finally { setActionLoading(false) }
  }

  // ── PERSONAL SAVE ────────────────────────────────────
  const openPersonalModal = () => {
    setPersonalForm({
      telefono: usuario?.telefono || '',
      tipo_sangre: perfil?.tipo_sangre || '',
      sexo: perfil?.sexo || '',
      fecha_nacimiento: perfil?.fecha_nacimiento?.slice(0,10) || '',
      donante_organos: perfil?.donante_organos || false,
      peso_kg: perfil?.peso_kg || '',
      altura_cm: perfil?.altura_cm || '',
      notas_adicionales: perfil?.notas_adicionales || '',
    })
    setIsPersonalOpen(true)
  }

  const handleSavePersonal = async () => {
    setPersonalSaving(true)
    try {
      await api.upsertFicha({
        telefono: personalForm.telefono || null,
        tipo_sangre: personalForm.tipo_sangre || null,
        sexo: personalForm.sexo || null,
        fecha_nacimiento: personalForm.fecha_nacimiento || null,
        donante_organos: personalForm.donante_organos,
        peso_kg: personalForm.peso_kg ? parseFloat(personalForm.peso_kg) : null,
        altura_cm: personalForm.altura_cm ? parseInt(personalForm.altura_cm) : null,
        notas_adicionales: personalForm.notas_adicionales || null,
        alergias: alergias.filter(a=>a.alergia_id).map(a=>({ alergia_id:a.alergia_id, severidad:a.severidad, reaccion:a.reaccion })),
        condiciones: condiciones.filter(c=>c.condicion_id).map(c=>({ condicion_id:c.condicion_id, estado:c.estado, tratamiento:c.tratamiento })),
        medicamentos: medicamentos.map(m=>({ nombre:m.nombre, dosis:m.dosis, frecuencia:m.frecuencia, notas:m.notas })),
        contactos: contactos.map((c,i)=>({ nombre:c.nombre, telefono:c.telefono, relacion:c.relacion, orden_prioridad:i+1 })),
      })
      // Actualizar estado local sin recargar el panel
      setUsuario(v=>({ ...v, telefono: personalForm.telefono || null }))
      setPerfil(v=>({ ...v,
        tipo_sangre: personalForm.tipo_sangre || null,
        sexo: personalForm.sexo || null,
        fecha_nacimiento: personalForm.fecha_nacimiento || null,
        donante_organos: personalForm.donante_organos,
        peso_kg: personalForm.peso_kg ? parseFloat(personalForm.peso_kg) : null,
        altura_cm: personalForm.altura_cm ? parseInt(personalForm.altura_cm) : null,
        notas_adicionales: personalForm.notas_adicionales || null,
      }))
      setSavedSection('personal'); setTimeout(()=>setSavedSection(null), 2500)
      setTimeout(()=>setIsPersonalOpen(false), 900)
    } catch(err) { setError(err.message) }
    finally { setPersonalSaving(false) }
  }

  // ── ALERGIAS SAVE ────────────────────────────────────
  const openAlergiasModal = () => { setLocalAlergias([...alergias]); setLocalCondiciones([...condiciones]); setIsAlergiasOpen(true) }

  const handleSaveAlergias = async () => {
    setAlergiasSaving(true)
    try {
      await api.upsertFicha({
        telefono: usuario?.telefono||null, tipo_sangre: perfil?.tipo_sangre||null,
        sexo: perfil?.sexo||null, fecha_nacimiento: perfil?.fecha_nacimiento||null,
        donante_organos: perfil?.donante_organos||false,
        peso_kg: perfil?.peso_kg||null, altura_cm: perfil?.altura_cm||null,
        notas_adicionales: perfil?.notas_adicionales||null,
        alergias: localAlergias.filter(a=>a.alergia_id).map(a=>({ alergia_id:a.alergia_id, severidad:a.severidad, reaccion:a.reaccion })),
        condiciones: localCondiciones.filter(c=>c.condicion_id).map(c=>({ condicion_id:c.condicion_id, estado:c.estado, tratamiento:c.tratamiento })),
        medicamentos: medicamentos.map(m=>({ nombre:m.nombre, dosis:m.dosis, frecuencia:m.frecuencia, notas:m.notas })),
        contactos: contactos.map((c,i)=>({ nombre:c.nombre, telefono:c.telefono, relacion:c.relacion, orden_prioridad:i+1 })),
      })
      setAlergias([...localAlergias]); setCondiciones([...localCondiciones])
      setSavedSection('alergias'); setTimeout(()=>setSavedSection(null), 2500)
      setTimeout(()=>setIsAlergiasOpen(false), 900)
    } catch(err) { setError(err.message) }
    finally { setAlergiasSaving(false) }
  }

  // ── MEDICAMENTOS SAVE ────────────────────────────────
  const openMedModal = () => { setLocalMeds([...medicamentos]); setIsMedOpen(true) }

  const handleSaveMeds = async () => {
    setMedsSaving(true)
    try {
      await api.upsertFicha({
        telefono: usuario?.telefono||null, tipo_sangre: perfil?.tipo_sangre||null,
        sexo: perfil?.sexo||null, fecha_nacimiento: perfil?.fecha_nacimiento||null,
        donante_organos: perfil?.donante_organos||false,
        peso_kg: perfil?.peso_kg||null, altura_cm: perfil?.altura_cm||null,
        notas_adicionales: perfil?.notas_adicionales||null,
        alergias: alergias.filter(a=>a.alergia_id).map(a=>({ alergia_id:a.alergia_id, severidad:a.severidad, reaccion:a.reaccion })),
        condiciones: condiciones.filter(c=>c.condicion_id).map(c=>({ condicion_id:c.condicion_id, estado:c.estado, tratamiento:c.tratamiento })),
        medicamentos: localMeds.map(m=>({ nombre:m.nombre, dosis:m.dosis, frecuencia:m.frecuencia, notas:m.notas })),
        contactos: contactos.map((c,i)=>({ nombre:c.nombre, telefono:c.telefono, relacion:c.relacion, orden_prioridad:i+1 })),
      })
      setMedicamentos([...localMeds])
      setSavedSection('meds'); setTimeout(()=>setSavedSection(null), 2500)
      setTimeout(()=>setIsMedOpen(false), 900)
    } catch(err) { setError(err.message) }
    finally { setMedsSaving(false) }
  }

  // ── CONTACTOS SAVE ───────────────────────────────────
  const openContactosModal = () => { setLocalContactos([...contactos]); setIsContactosOpen(true) }

  const handleSaveContactos = async () => {
    setContactosSaving(true)
    try {
      await api.upsertFicha({
        telefono: usuario?.telefono||null, tipo_sangre: perfil?.tipo_sangre||null,
        sexo: perfil?.sexo||null, fecha_nacimiento: perfil?.fecha_nacimiento||null,
        donante_organos: perfil?.donante_organos||false,
        peso_kg: perfil?.peso_kg||null, altura_cm: perfil?.altura_cm||null,
        notas_adicionales: perfil?.notas_adicionales||null,
        alergias: alergias.filter(a=>a.alergia_id).map(a=>({ alergia_id:a.alergia_id, severidad:a.severidad, reaccion:a.reaccion })),
        condiciones: condiciones.filter(c=>c.condicion_id).map(c=>({ condicion_id:c.condicion_id, estado:c.estado, tratamiento:c.tratamiento })),
        medicamentos: medicamentos.map(m=>({ nombre:m.nombre, dosis:m.dosis, frecuencia:m.frecuencia, notas:m.notas })),
        contactos: localContactos.map((c,i)=>({ nombre:c.nombre, telefono:c.telefono, relacion:c.relacion, orden_prioridad:i+1 })),
      })
      setContactos([...localContactos])
      setSavedSection('contactos'); setTimeout(()=>setSavedSection(null), 2500)
      setTimeout(()=>setIsContactosOpen(false), 900)
    } catch(err) { setError(err.message) }
    finally { setContactosSaving(false) }
  }

  // ── CHANGE PASSWORD ──────────────────────────────────
  const openChangePwd = () => {
    setPwdForm({ actual:'', nueva:'', confirmar:'' })
    setPwdError(null); setPwdSuccess(false)
    setShowUserMenu(false); setIsChangePwdOpen(true)
  }

  const handleChangePassword = async () => {
    setPwdError(null)
    if (pwdForm.nueva !== pwdForm.confirmar) { setPwdError('Las contraseñas nuevas no coinciden.'); return }
    if (pwdForm.nueva.length < 6) { setPwdError('La nueva contraseña debe tener al menos 6 caracteres.'); return }
    setPwdLoading(true)
    try {
      await api.changePassword({ password_actual: pwdForm.actual, password_nueva: pwdForm.nueva })
      setPwdSuccess(true)
      setTimeout(() => { setIsChangePwdOpen(false); setPwdSuccess(false) }, 2000)
    } catch(err) { setPwdError(err.message) }
    finally { setPwdLoading(false) }
  }

  const handleLogout = () => { removeToken(); navigate('/login') }

  // ── Derived ───────────────────────────────────────────
  const initials = usuario ? usuario.nombre_completo.split(' ').slice(0,2).map(n=>n[0]).join('').toUpperCase() : 'DA'
  const firstName = usuario?.nombre_completo?.split(' ')[0] || 'Usuario'

  const completionItems = [
    !!usuario?.nombre_completo,
    alergias.length > 0 || condiciones.length > 0,
    !!perfil?.tipo_sangre,
    medicamentos.length > 0,
    contactos.length > 0,
  ]
  const completionPercent = Math.round((completionItems.filter(Boolean).length / completionItems.length) * 100)

  const titleTyper = useTypewriter(loading ? '' : 'Panel de Ficha Vital', 45)

  if (loading) {
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100vh', backgroundColor:'#F8FAFC' }}>
        <div style={{ width:46, height:46, border:'4px solid #E2E8F0', borderTop:'4px solid #DC2626', borderRadius:'50%', animation:'spin 0.9s linear infinite' }}></div>
        <p style={{ color:'#94A3B8', marginTop:14, fontWeight:500, fontSize:13.5 }}>Abriendo panel vital...</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  /* ══════════════════════ RENDER ══════════════════════ */
  return (
    <div style={shellStyle} onClick={() => { showUserMenu && setShowUserMenu(false); sidebarOpen && setSidebarOpen(false) }}>
      <style>{globalCSS}</style>

      {/* Mobile overlay */}
      <div className={`db-overlay${sidebarOpen?' db-overlay-active':''}`} onClick={()=>setSidebarOpen(false)} />

      {/* ═══ SIDEBAR ═══════════════════════════════════ */}
      <aside style={sidebarStyle} className={`dashboard-sidebar${sidebarOpen?' sidebar-open':''}`}>
        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:11, padding:'20px 16px 16px' }}>
          <div style={{ width:36, height:36, borderRadius:9, backgroundColor:'#DC2626', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 10px rgba(220,38,38,0.28)', flexShrink:0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
          </div>
          <div>
            <span style={{ color:'#0F172A', fontWeight:800, fontSize:15.5, letterSpacing:'-0.3px', display:'block', lineHeight:1.2 }}>MediRecord</span>
            <span style={{ color:'#94A3B8', fontSize:9.5, fontWeight:600, display:'block', letterSpacing:'0.2px' }}>Ficha Vital UNMSM</span>
          </div>
        </div>

        <div style={sbDivStyle}/>

        {/* User profile */}
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px', margin:'8px', borderRadius:10, backgroundColor:'#F8FAFC', border:'1px solid #F1F5F9' }}>
          <div style={{ width:36, height:36, borderRadius:'50%', backgroundColor:'#DC2626', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, flexShrink:0, boxShadow:'0 2px 8px rgba(220,38,38,0.2)' }}>{initials}</div>
          <div style={{ minWidth:0 }}>
            <p style={{ fontSize:12.5, fontWeight:700, color:'#0F172A', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', lineHeight:1.2 }}>{usuario?.nombre_completo}</p>
            <p style={{ fontSize:10.5, color:'#94A3B8', fontWeight:500, marginTop:1 }}>Ciudadano · MediRecord</p>
          </div>
        </div>

        <div style={sbDivStyle}/>

        {/* Nav */}
        <div style={{ padding:'6px 10px', flex:1 }}>
          <span style={sbLabelStyle}>NAVEGACIÓN</span>
          <Link to="/dashboard" className="sb-item sb-active" style={sbItemActiveStyle}><span style={{ display:'flex', color:'inherit' }}>{Ic.dashboard}</span>Dashboard</Link>

          <div style={{ ...sbDivStyle, margin:'10px 0 4px' }}/>
          <span style={sbLabelStyle}>SEGURIDAD</span>

          <button className="sb-toggle" onClick={()=>setSecurityOpen(v=>!v)} style={sbToggleStyle}>
            <span style={{ display:'flex', color:'#64748B' }}>{Ic.shield}</span>
            <span style={{ flex:1, textAlign:'left' }}>Seguridad</span>
            {Ic.chevron(securityOpen)}
          </button>

          {securityOpen && (
            <div style={{ paddingLeft:6 }}>
              <button className="sb-sub" style={sbSubStyle}><span style={{ display:'flex', color:'#64748B' }}>{Ic.audit}</span>Auditoría</button>
              <button className="sb-sub" onClick={()=>setIsRevokeModalOpen(true)} style={{ ...sbSubStyle, color:'#DC2626' }}><span style={{ display:'flex', color:'#DC2626' }}>{Ic.revoke}</span>Revocar QR</button>
            </div>
          )}
        </div>

        {/* Emergency card */}
        {activeToken && (
          <div style={{ margin:'8px 10px 10px', padding:'14px 16px', borderRadius:12, background:'linear-gradient(135deg,#DC2626,#B91C1C)', boxShadow:'0 4px 14px rgba(220,38,38,0.22)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
              <div style={{ width:26, height:26, borderRadius:6, backgroundColor:'rgba(255,255,255,0.18)', display:'flex', alignItems:'center', justifyContent:'center', color:'white' }}>{Ic.qr}</div>
              <p style={{ color:'#fff', fontWeight:700, fontSize:12.5 }}>QR Activo</p>
            </div>
            <p style={{ color:'rgba(255,255,255,0.82)', fontSize:11.5, lineHeight:1.5, marginBottom:10 }}>Ficha disponible para personal de emergencia.</p>
            <Link to={`/emergency/${activeToken.token_uuid}`} target="_blank" style={{ display:'inline-block', backgroundColor:'rgba(255,255,255,0.18)', color:'#fff', fontSize:11.5, fontWeight:700, padding:'5px 12px', borderRadius:7, textDecoration:'none', border:'1px solid rgba(255,255,255,0.25)' }}>Vista paramédico</Link>
          </div>
        )}

        <div style={{ ...sbDivStyle, margin:'12px 10px 4px' }}/>
        <div style={{ padding:'4px 10px 16px' }}>
          <button onClick={handleLogout} className="sb-logout" style={sbLogoutStyle}>{Ic.logout} Cerrar sesión</button>
        </div>
      </aside>

      {/* ═══ MAIN ══════════════════════════════════════ */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>

        {/* Top bar */}
        <header style={topBarStyle}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <button className="dashboard-hamburger" onClick={e=>{e.stopPropagation();setSidebarOpen(v=>!v)}} style={iconBtnStyle}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ width:28, height:28, borderRadius:7, backgroundColor:'#DC2626', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
              </div>
              <span style={{ fontSize:14, fontWeight:700, color:'#0F172A', letterSpacing:'-0.2px' }}>MediRecord</span>
              <span style={{ fontSize:12, color:'#94A3B8', fontWeight:500, marginLeft:2 }}>/ Dashboard</span>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <button className="db-topbtn" style={iconBtnStyle} onClick={fetchDashboardData} title="Actualizar">{Ic.refresh}</button>
            <button className="db-topbtn" style={iconBtnStyle} title="Ayuda">{Ic.help}</button>
            <div style={{ position:'relative' }} onClick={e=>{e.stopPropagation();setShowUserMenu(v=>!v)}}>
              <button style={userChipStyle}>
                <div style={avatarStyle}>{initials}</div>
                <div><p style={{ fontSize:13, fontWeight:700, color:'#111827', lineHeight:1.2 }}>{firstName}</p><p style={{ fontSize:11, color:'#6B7280', fontWeight:500 }}>Ciudadano</p></div>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              {showUserMenu && (
                <div style={dropdownStyle}>
                  <div style={{ display:'flex', alignItems:'center', gap:11, padding:'14px 16px' }}>
                    <div style={{ ...avatarStyle, width:40, height:40, fontSize:15 }}>{initials}</div>
                    <div><p style={{ fontWeight:700, fontSize:13.5, color:'#111827' }}>{usuario?.nombre_completo}</p><p style={{ fontSize:11.5, color:'#6B7280' }}>Ciudadano · MediRecord</p></div>
                  </div>
                  <div style={{ height:1, backgroundColor:'#F3F4F6' }}/>
                  <button onClick={openChangePwd} className="db-menu-item" style={menuItemStyle}>{Ic.key} Cambiar contraseña</button>
                  <div style={{ height:1, backgroundColor:'#F3F4F6' }}/>
                  <button onClick={handleLogout} className="db-menu-item-danger" style={{ ...menuItemStyle, color:'#DC2626' }}>{Ic.logout} Cerrar sesión</button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex:1, padding:'28px 28px 48px', overflowY:'auto' }} className="dash-content-fade">

          {/* Heading */}
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:16, marginBottom:24 }} className="dashboard-heading-row">
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
                <span style={{ fontSize:11, fontWeight:700, color:'#DC2626', letterSpacing:'0.5px', textTransform:'uppercase' }}>Inicio</span>
                <span style={{ color:'#D1D5DB', fontSize:11 }}>›</span>
                <span style={{ fontSize:11, fontWeight:600, color:'#94A3B8' }}>Dashboard</span>
              </div>
              <h1 style={{ fontSize:28, fontWeight:800, color:'#0F172A', letterSpacing:'-0.5px', lineHeight:1.15, marginBottom:6, minHeight:'1.15em' }}>
                {titleTyper.displayed}
                {!titleTyper.done && <span style={{ display:'inline-block', width:2, height:'0.85em', backgroundColor:'#DC2626', marginLeft:2, verticalAlign:'middle' }}>|</span>}
              </h1>
              <p style={{ fontSize:13, color:'#64748B', maxWidth:560, lineHeight:1.6 }}>Administra tu información médica crítica, revisa el estado de tu QR y controla los accesos.</p>
            </div>
            <div style={{ display:'flex', gap:10, flexShrink:0, marginTop:4 }}>
              <button onClick={handleDownloadQR} className="db-btn-outline" style={btnOutlineStyle}>{Ic.download} Descargar QR</button>
              <Link to="/registro" className="db-btn-solid" style={btnSolidStyle}>{Ic.edit} Editar Ficha</Link>
            </div>
          </div>

          {error && <div style={errorBannerStyle}>{Ic.warn}<span>{error}</span><button onClick={()=>setError(null)} style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', color:'#DC2626', fontWeight:700, fontSize:14 }}>✕</button></div>}

          {/* ── STAT CARDS ─────────────────────────────── */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:24 }} className="dashboard-stat-row">

            {/* QR Status */}
            <div className="db-stat-card" style={statCardStyle}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                  <div style={{ width:34, height:34, borderRadius:9, backgroundColor:'#FEF2F2', display:'flex', alignItems:'center', justifyContent:'center', color:'#DC2626' }}>{Ic.qr}</div>
                  <span style={statLabelStyle}>Estado del QR</span>
                </div>
                <span style={{ width:8, height:8, borderRadius:'50%', backgroundColor: activeToken ? '#10B981' : '#94A3B8', display:'inline-block', boxShadow: activeToken ? '0 0 0 3px #D1FAE5' : 'none' }}/>
              </div>
              <p style={{ fontSize:24, fontWeight:800, color: activeToken ? '#0F172A' : '#9CA3AF', lineHeight:1, marginBottom:6 }}>{activeToken ? 'Activo' : 'Inactivo'}</p>
              <p style={statSubStyle}>{activeToken ? 'Escaneando y en línea.' : 'Sin código activo.'}</p>
              {activeToken && (
                <div style={{ marginTop:12, paddingTop:12, borderTop:'1px solid #F1F5F9' }}>
                  <Link to={`/emergency/${activeToken.token_uuid}`} target="_blank" style={{ fontSize:12, fontWeight:600, color:'#DC2626', textDecoration:'none', display:'inline-flex', alignItems:'center', gap:4 }}>Ver ficha pública {Ic.arrow}</Link>
                </div>
              )}
            </div>

            {/* Completitud */}
            <div className="db-stat-card" style={statCardStyle}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                  <div style={{ width:34, height:34, borderRadius:9, backgroundColor:'#F0FDF4', display:'flex', alignItems:'center', justifyContent:'center', color:'#10B981' }}>{Ic.heart}</div>
                  <span style={statLabelStyle}>Completitud</span>
                </div>
                <span style={{ fontSize:11, fontWeight:700, color: completionPercent>=80?'#065F46':completionPercent>=40?'#92400E':'#991B1B', backgroundColor: completionPercent>=80?'#D1FAE5':completionPercent>=40?'#FEF3C7':'#FEF2F2', padding:'2px 9px', borderRadius:20 }}>{completionPercent < 100 ? 'Incompleta' : 'Completa'}</span>
              </div>
              <p style={{ fontSize:24, fontWeight:800, color:'#0F172A', lineHeight:1, marginBottom:6 }}>{completionPercent}%</p>
              <p style={statSubStyle}>{completionItems.filter(Boolean).length} de {completionItems.length} secciones completadas.</p>
              <div style={{ marginTop:10, height:5, backgroundColor:'#F1F5F9', borderRadius:10, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${completionPercent}%`, backgroundColor: completionPercent>=80?'#10B981':completionPercent>=40?'#F59E0B':'#DC2626', borderRadius:10, transition:'width 1s ease' }}/>
              </div>
            </div>

            {/* Última actualización */}
            <div className="db-stat-card" style={statCardStyle}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                  <div style={{ width:34, height:34, borderRadius:9, backgroundColor:'#F8FAFC', display:'flex', alignItems:'center', justifyContent:'center', color:'#475569' }}>{Ic.clock}</div>
                  <span style={statLabelStyle}>Última actualización</span>
                </div>
              </div>
              <p style={{ fontSize:22, fontWeight:800, color:'#0F172A', lineHeight:1, marginBottom:6 }}>
                {perfil?.updated_at ? new Date(perfil.updated_at).toLocaleDateString('es-PE',{day:'numeric',month:'short'}) : '— —'}
              </p>
              <p style={statSubStyle}>Actualiza tu ficha cuando cambié tu medicación o datos.</p>
              <div style={{ marginTop:12, paddingTop:12, borderTop:'1px solid #F1F5F9' }}>
                <button onClick={fetchDashboardData} style={{ fontSize:12, fontWeight:600, color:'#475569', background:'transparent', border:'none', cursor:'pointer', display:'inline-flex', alignItems:'center', gap:4, padding:0 }}>{Ic.refresh} Refrescar datos</button>
              </div>
            </div>
          </div>

          {/* ── FICHA CARD + QR CARD ─────────────────── */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }} className="dashboard-two-col-grid">

            {/* Ficha Vital */}
            <div style={cardStyle}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:32, height:32, borderRadius:8, backgroundColor:'#FEF2F2', display:'flex', alignItems:'center', justifyContent:'center', color:'#DC2626' }}>{Ic.heart}</div>
                  <h2 style={cardTitleStyle}>Estado de la Ficha Vital</h2>
                </div>
                <span style={badgeGreenStyle}>● Activa</span>
              </div>
              <p style={cardSubStyle}>Ver detalle o eliminar entradas. Para editar, ve a la Ficha Vital.</p>

              <div style={{ display:'flex', alignItems:'flex-start', gap:18 }} className="dashboard-ficha-body">
                <DonutChart percent={completionPercent} />

                <div style={{ flex:1, display:'flex', flexDirection:'column', gap:0 }}>

                  {/* Item: Datos personales */}
                  <div style={checkRowStyle}>
                    <div style={{ display:'flex', alignItems:'flex-start', gap:9, flex:1 }}>
                      <div style={checkIconBase('#D1FAE5','#10B981')}>✓</div>
                      <div>
                        <p style={checkTitleStyle}>Datos personales</p>
                        <p style={checkSubStyle}>{usuario?.nombre_completo} · {usuario?.telefono || 'Sin teléfono'}</p>
                      </div>
                    </div>
                    <button onClick={openPersonalModal} className="db-check-btn" style={checkBtnStyle}>{Ic.edit} Editar</button>
                  </div>

                  {/* Item: Alergias y condiciones */}
                  <div style={checkRowStyle}>
                    <div style={{ display:'flex', alignItems:'flex-start', gap:9, flex:1 }}>
                      <div style={(alergias.length>0||condiciones.length>0) ? checkIconBase('#D1FAE5','#10B981') : checkIconBase('#FEF3C7','#D97706')}>
                        {(alergias.length>0||condiciones.length>0) ? '✓' : '!'}
                      </div>
                      <div>
                        <p style={checkTitleStyle}>Alergias y condiciones</p>
                        <p style={checkSubStyle}>
                          {alergias.length>0 ? alergias.slice(0,2).map(a=>a.nombre).join(', ')+(alergias.length>2?` +${alergias.length-2}`:'') : 'Sin alergias'}
                          {condiciones.length>0 && ` · ${condiciones.length} condición${condiciones.length!==1?'es':''}`}
                        </p>
                      </div>
                    </div>
                    <button onClick={openAlergiasModal} className="db-check-btn" style={checkBtnStyle}>{Ic.eye} Detalle</button>
                  </div>

                  {/* Item: Medicación */}
                  <div style={checkRowStyle}>
                    <div style={{ display:'flex', alignItems:'flex-start', gap:9, flex:1 }}>
                      <div style={medicamentos.length>0 ? checkIconBase('#D1FAE5','#10B981') : checkIconBase('#FEF3C7','#D97706')}>
                        {medicamentos.length>0 ? '✓' : '!'}
                      </div>
                      <div>
                        <p style={checkTitleStyle}>Medicación actual</p>
                        <p style={checkSubStyle}>{medicamentos.length>0 ? `${medicamentos.length} medicamento${medicamentos.length!==1?'s':''} registrado${medicamentos.length!==1?'s':''}` : 'Sin medicamentos'}</p>
                      </div>
                    </div>
                    <button onClick={openMedModal} className="db-check-btn" style={checkBtnStyle}>{Ic.eye} Detalle</button>
                  </div>

                  {/* Item: Contactos de emergencia */}
                  <div style={{ ...checkRowStyle, borderBottom:'none', paddingBottom:0 }}>
                    <div style={{ display:'flex', alignItems:'flex-start', gap:9, flex:1 }}>
                      <div style={contactos.length>0 ? checkIconBase('#D1FAE5','#10B981') : checkIconBase('#FEF3C7','#D97706')}>
                        {contactos.length>0 ? '✓' : '!'}
                      </div>
                      <div>
                        <p style={checkTitleStyle}>Contactos de emergencia</p>
                        <p style={checkSubStyle}>{contactos.length>0 ? contactos.slice(0,2).map(c=>c.nombre).join(', ')+(contactos.length>2?` +${contactos.length-2}`:'') : 'Sin contactos'}</p>
                      </div>
                    </div>
                    <button onClick={openContactosModal} className="db-check-btn" style={checkBtnStyle}>{Ic.eye} Detalle</button>
                  </div>
                </div>
              </div>
            </div>

            {/* QR Card */}
            <div style={cardStyle}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:32, height:32, borderRadius:8, backgroundColor:'#FEF2F2', display:'flex', alignItems:'center', justifyContent:'center', color:'#DC2626' }}>{Ic.qrLg}</div>
                  <h2 style={cardTitleStyle}>Mi QR de emergencia</h2>
                </div>
                <span style={badgeGreenStyle}>● Activo</span>
              </div>
              <p style={cardSubStyle}>Identificador público de acceso rápido.</p>

              <div style={{ display:'flex', gap:18, alignItems:'flex-start' }} className="dashboard-qr-section">
                <div style={{ backgroundColor:'#F8FAFC', border:'1px solid #E5E7EB', borderRadius:11, padding:10, flexShrink:0 }}>
                  {qrImageUrl ? <img src={qrImageUrl} alt="QR" style={{ width:168, height:168, display:'block', borderRadius:6 }}/> : <div style={{ width:168, height:168, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, color:'#9CA3AF', textAlign:'center', padding:10 }}>{qrError || 'Generando...'}</div>}
                </div>

                <div style={{ flex:1, minWidth:0 }} className="dashboard-qr-info-col">
                  <p style={{ fontSize:14, fontWeight:700, color:'#111827', marginBottom:5 }}>Ficha Vital disponible</p>
                  <p style={{ fontSize:12, color:'#6B7280', lineHeight:1.55, marginBottom:10 }}>Imprime o coloca en tu casco, DNI, o pantalla de bloqueo.</p>
                  {activeToken && <p style={{ fontSize:10, color:'#94A3B8', fontFamily:'monospace', backgroundColor:'#F3F4F6', padding:'3px 7px', borderRadius:5, marginBottom:12, display:'block', wordBreak:'break-all' }}>/emergency/{activeToken.token_uuid?.slice(0,16)}...</p>}
                  <div style={{ display:'flex', gap:7, flexWrap:'wrap', marginBottom:10 }}>
                    <button onClick={handleDownloadQR} className="db-qr-btn" style={qrBtnStyle}>{Ic.download} Descargar</button>
                    <button onClick={()=>window.print()} className="db-qr-btn" style={qrBtnStyle}>{Ic.print} Imprimir</button>
                    <button onClick={()=>setIsRevokeModalOpen(true)} className="db-qr-danger" style={qrDangerBtnStyle}>{Ic.warn} Revocar</button>
                  </div>
                  {activeToken && (
                    <Link to={`/emergency/${activeToken.token_uuid}`} target="_blank" className="db-parame" style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', border:'none', borderRadius:8, backgroundColor:'#0F172A', color:'#fff', fontSize:12.5, fontWeight:700, cursor:'pointer', textDecoration:'none', marginBottom:8, justifyContent:'center' }}>
                      {Ic.ambulance} Vista del paramédico
                    </Link>
                  )}
                  <button onClick={()=>setIsNfcModalOpen(true)} style={{ border:'none', background:'transparent', cursor:'pointer', color:'#DC2626', fontSize:12, fontWeight:700, padding:0 }}>+ Vincular Tag NFC</button>
                </div>
              </div>
            </div>
          </div>

          {/* Access log */}
          <div style={{ ...cardStyle, marginTop:22 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:32, height:32, borderRadius:8, backgroundColor:'#F8FAFC', display:'flex', alignItems:'center', justifyContent:'center', color:'#475569' }}>{Ic.activity}</div>
                <h2 style={cardTitleStyle}>Historial de Accesos</h2>
              </div>
              <span style={{ fontSize:12, color:'#94A3B8', fontWeight:500 }}>Últimos 10 registros</span>
            </div>
            {accesos.length===0 ? (
              <div style={{ textAlign:'center', padding:'28px 24px' }}>
                <div style={{ width:44, height:44, borderRadius:'50%', backgroundColor:'#F8FAFC', border:'1.5px dashed #D1D5DB', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 10px', color:'#9CA3AF' }}>{Ic.eye}</div>
                <p style={{ color:'#9CA3AF', fontSize:13.5, fontWeight:500 }}>Sin accesos registrados aún.</p>
                <p style={{ color:'#C4C9D4', fontSize:12, marginTop:3 }}>Cuando alguien escanee tu QR, quedará registrado aquí.</p>
              </div>
            ) : (
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead><tr style={{ borderBottom:'2px solid #E5E7EB' }}>
                    {['Fecha / Hora','IP Origen','Vía','Resultado'].map(h=><th key={h} style={{ padding:'10px 14px', fontSize:11, fontWeight:700, color:'#6B7280', textTransform:'uppercase', letterSpacing:'0.5px', textAlign:'left' }}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {accesos.map(acc=>(
                      <tr key={acc.id} style={{ borderBottom:'1px solid #F3F4F6' }}>
                        <td style={{ padding:'11px 14px', fontSize:13, color:'#374151', fontWeight:500 }}>{new Date(acc.accedido_en).toLocaleString()}</td>
                        <td style={{ padding:'11px 14px', fontSize:13, color:'#374151', fontWeight:500 }}>{acc.ip_origen||'Desconocida'}</td>
                        <td style={{ padding:'11px 14px', fontSize:13, color:'#374151', fontWeight:500 }}>{acc.via_nfc?'📟 NFC':'📷 QR'}</td>
                        <td style={{ padding:'11px 14px' }}>
                          <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:4, ...(acc.resultado==='exitoso'?{backgroundColor:'#D1FAE5',color:'#065F46'}:{backgroundColor:'#FEF2F2',color:'#DC2626'}) }}>{acc.resultado.replace('_',' ')}</span>
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

      {/* ═══════════════ MODALS ════════════════════════ */}

      {/* Revocar */}
      <Modal isOpen={isRevokeModalOpen} onClose={()=>setIsRevokeModalOpen(false)} title="⚠️ Revocar Código QR">
        <p style={mdDescStyle}>Al revocar este token QR, se invalidará permanentemente. Un nuevo QR se generará al instante.</p>
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          <label style={mdLabelStyle}>Motivo</label>
          <select value={revokeMotivo} onChange={e=>setRevokeMotivo(e.target.value)} style={mdSelectStyle}>
            <option value="Pérdida de dispositivo">Pérdida de dispositivo físico</option>
            <option value="Actualización de datos">Actualización profunda de datos</option>
            <option value="Sospecha de vulnerabilidad">Sospecha de escaneo malintencionado</option>
            <option value="Otro">Otro motivo</option>
          </select>
        </div>
        {revokeMotivo==='Otro' && <div style={{ marginTop:10 }}><label style={mdLabelStyle}>Especifique</label><input type="text" value={customMotivo} onChange={e=>setCustomMotivo(e.target.value)} style={mdInputStyle} placeholder="Describe el motivo"/></div>}
        <div style={mdBtnRowStyle}>
          <button onClick={()=>setIsRevokeModalOpen(false)} style={mdBtnSecStyle} disabled={actionLoading}>Cancelar</button>
          <button onClick={handleRevokeToken} style={mdBtnDangerStyle} disabled={actionLoading}>{actionLoading?'Revocando...':'Confirmar Revocación'}</button>
        </div>
      </Modal>

      {/* NFC */}
      <Modal isOpen={isNfcModalOpen} onClose={()=>setIsNfcModalOpen(false)} title="📟 Vincular Tag NFC">
        <p style={mdDescStyle}>Vincule un dispositivo físico de identificación médica (pulsera, llavero o sticker NTAG213/215).</p>
        <label style={mdLabelStyle}>UID físico del Chip NFC</label>
        <input type="text" placeholder="Ej. 04:A3:B2:C1:D0:E9:80" value={manualNfcUid} onChange={e=>setManualNfcUid(e.target.value)} style={mdInputStyle}/>
        <p style={{ fontSize:11, color:'#94A3B8', marginTop:4 }}>*Para pruebas del SQA, ingrese cualquier ID alfanumérico único.</p>
        <div style={mdBtnRowStyle}>
          <button onClick={()=>setIsNfcModalOpen(false)} style={mdBtnSecStyle}>Cancelar</button>
          <button onClick={()=>{ setError('La vinculación NFC estará disponible próximamente.'); setIsNfcModalOpen(false) }} style={mdBtnPrimaryStyle} disabled={!manualNfcUid.trim()}>Vincular Dispositivo</button>
        </div>
      </Modal>

      {/* ─── Datos Personales ─── */}
      <Modal isOpen={isPersonalOpen} onClose={()=>setIsPersonalOpen(false)} title="Editar Datos Personales">
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>

          <div style={{ gridColumn:'1/-1' }}>
            <p style={mdSectionLabel}>Datos de identificación</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, padding:'12px 14px', backgroundColor:'#F8FAFC', borderRadius:9, border:'1px solid #F1F5F9' }}>
              <div>
                <p style={{ fontSize:11, color:'#94A3B8', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px' }}>Nombre completo</p>
                <p style={{ fontSize:13.5, fontWeight:600, color:'#0F172A', marginTop:2 }}>{usuario?.nombre_completo}</p>
              </div>
              <div>
                <p style={{ fontSize:11, color:'#94A3B8', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px' }}>N.º Documento</p>
                <p style={{ fontSize:13.5, fontWeight:600, color:'#0F172A', marginTop:2 }}>{usuario?.numero_documento}</p>
              </div>
            </div>
          </div>

          <FField label="Teléfono celular" error="9 dígitos empezando con 9" touched={personalForm.telefono?.length>0 && !/^9\d{8}$/.test(personalForm.telefono)}>
            <input type="tel" value={personalForm.telefono||''} onChange={e=>setPersonalForm(v=>({...v,telefono:e.target.value.replace(/\D/g,'').slice(0,9)}))} style={fInput(personalForm.telefono?.length===9, personalForm.telefono?.length>0 && personalForm.telefono?.length!==9)} placeholder="987654321"/>
          </FField>

          <FField label="Fecha de nacimiento">
            <input type="date" value={personalForm.fecha_nacimiento||''} onChange={e=>setPersonalForm(v=>({...v,fecha_nacimiento:e.target.value}))} style={fInput(!!personalForm.fecha_nacimiento, false)}/>
          </FField>

          <FField label="Sexo">
            <select value={personalForm.sexo||''} onChange={e=>setPersonalForm(v=>({...v,sexo:e.target.value}))} style={{ ...fInput(!!personalForm.sexo,false), cursor:'pointer' }}>
              <option value="">Seleccionar...</option>
              <option value="Masculino">Masculino</option>
              <option value="Femenino">Femenino</option>
              <option value="Otro">Otro / Prefiero no decir</option>
            </select>
          </FField>

          <FField label="Tipo de sangre">
            <select value={personalForm.tipo_sangre||''} onChange={e=>setPersonalForm(v=>({...v,tipo_sangre:e.target.value}))} style={{ ...fInput(!!personalForm.tipo_sangre,false), cursor:'pointer' }}>
              <option value="">Seleccionar...</option>
              {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(t=><option key={t} value={t}>{t}</option>)}
            </select>
          </FField>

          <FField label="Peso (kg)">
            <input type="number" value={personalForm.peso_kg||''} onChange={e=>setPersonalForm(v=>({...v,peso_kg:e.target.value}))} style={fInput(!!personalForm.peso_kg,false)} placeholder="ej. 70" min="20" max="300"/>
          </FField>

          <FField label="Altura (cm)">
            <input type="number" value={personalForm.altura_cm||''} onChange={e=>setPersonalForm(v=>({...v,altura_cm:e.target.value}))} style={fInput(!!personalForm.altura_cm,false)} placeholder="ej. 170" min="50" max="250"/>
          </FField>

          <div style={{ gridColumn:'1/-1' }}>
            <label style={{ fontSize:12.5, fontWeight:600, color:'#374151', display:'block', marginBottom:6 }}>Donante de órganos</label>
            <div style={{ display:'flex', gap:8 }}>
              {[true,false].map(val=>(
                <button key={String(val)} onClick={()=>setPersonalForm(v=>({...v,donante_organos:val}))}
                  style={{ flex:1, padding:'9px 12px', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', border: personalForm.donante_organos===val?'1.5px solid #DC2626':'1.5px solid #E2E8F0', backgroundColor: personalForm.donante_organos===val?'#DC2626':'#FFFFFF', color: personalForm.donante_organos===val?'#FFFFFF':'#64748B', transition:'all 0.2s ease' }}>
                  {val ? '❤️  Sí, soy donante' : 'No soy donante'}
                </button>
              ))}
            </div>
          </div>

          <div style={{ gridColumn:'1/-1' }}>
            <label style={{ fontSize:12.5, fontWeight:600, color:'#374151', display:'block', marginBottom:6 }}>Notas médicas adicionales</label>
            <textarea value={personalForm.notas_adicionales||''} onChange={e=>setPersonalForm(v=>({...v,notas_adicionales:e.target.value}))} style={{ ...fInput(false,false), minHeight:72, resize:'vertical' }} placeholder="Marcapasos, implantes, alergias a anestesias, observaciones para el paramédico..."/>
          </div>
        </div>
        <div style={mdBtnRowStyle}>
          <button onClick={()=>setIsPersonalOpen(false)} style={mdBtnSecStyle}>Cancelar</button>
          <button onClick={handleSavePersonal} disabled={personalSaving} className="md-save-btn" style={savedSection==='personal'?mdBtnSavedStyle:mdBtnPrimaryStyle}>{savedSection==='personal'?<>{Ic.check} ¡Guardado!</>:<>{Ic.save} {personalSaving?'Guardando...':'Guardar cambios'}</>}</button>
        </div>
      </Modal>

      {/* ─── Alergias & Condiciones ─── */}
      <Modal isOpen={isAlergiasOpen} onClose={()=>setIsAlergiasOpen(false)} title="Alergias y Condiciones Crónicas">
        {/* Alergias */}
        <p style={mdSectionLabel}>Alergias registradas · {localAlergias.length}</p>
        {localAlergias.length===0 ? (
          <div style={{ textAlign:'center', padding:'14px 0 10px', color:'#94A3B8', fontSize:13 }}>Sin alergias registradas.</div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:16 }}>
            {localAlergias.map((a,i)=>(
              <div key={i} style={itemCardStyle}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, flex:1, minWidth:0 }}>
                    <span style={{ fontSize:11, fontWeight:700, backgroundColor:'#FEF2F2', color:'#DC2626', padding:'2px 9px', borderRadius:20, border:'1px solid #FEE2E2', flexShrink:0 }}>{a.categoria||'Alergia'}</span>
                    <span style={{ fontSize:13.5, fontWeight:700, color:'#0F172A', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.nombre}</span>
                    {a.severidad && <span style={{ fontSize:11, fontWeight:600, backgroundColor:'#FFF7ED', color:'#C2410C', padding:'2px 8px', borderRadius:12, border:'1px solid #FED7AA', flexShrink:0 }}>{a.severidad}</span>}
                  </div>
                  <button onClick={()=>setLocalAlergias(prev=>prev.filter((_,j)=>j!==i))} style={removeBtnStyle}>{Ic.trash}</button>
                </div>
                {a.reaccion && <p style={{ fontSize:12, color:'#64748B', marginTop:6, paddingLeft:2 }}><span style={{ fontWeight:600 }}>Reacción:</span> {a.reaccion}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Condiciones */}
        <p style={{ ...mdSectionLabel, marginTop:4 }}>Condiciones crónicas · {localCondiciones.length}</p>
        {localCondiciones.length===0 ? (
          <div style={{ textAlign:'center', padding:'14px 0 10px', color:'#94A3B8', fontSize:13 }}>Sin condiciones registradas.</div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:10 }}>
            {localCondiciones.map((c,i)=>(
              <div key={i} style={itemCardStyle}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, flex:1, minWidth:0 }}>
                    <span style={{ fontSize:11, fontWeight:700, backgroundColor:'#F0FDF4', color:'#065F46', padding:'2px 9px', borderRadius:20, border:'1px solid #A7F3D0', flexShrink:0 }}>{c.categoria||'Condición'}</span>
                    <span style={{ fontSize:13.5, fontWeight:700, color:'#0F172A', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.nombre}</span>
                    {c.estado && <span style={{ fontSize:11, fontWeight:600, backgroundColor:'#EFF6FF', color:'#1D4ED8', padding:'2px 8px', borderRadius:12, border:'1px solid #BFDBFE', flexShrink:0 }}>{c.estado}</span>}
                  </div>
                  <button onClick={()=>setLocalCondiciones(prev=>prev.filter((_,j)=>j!==i))} style={removeBtnStyle}>{Ic.trash}</button>
                </div>
                {(c.tratamiento||c.tratamiento_actual) && <p style={{ fontSize:12, color:'#64748B', marginTop:6, paddingLeft:2 }}><span style={{ fontWeight:600 }}>Tratamiento:</span> {c.tratamiento||c.tratamiento_actual}</p>}
              </div>
            ))}
          </div>
        )}

        <div style={{ padding:'10px 14px', borderRadius:8, backgroundColor:'#FEF2F2', border:'1px solid #FEE2E2', marginTop:12 }}>
          <p style={{ fontSize:12.5, color:'#991B1B', fontWeight:500 }}>Para <strong>agregar o editar</strong> alergias o condiciones, ve a la Ficha Vital completa.</p>
          <Link to="/registro" onClick={()=>setIsAlergiasOpen(false)} style={{ fontSize:12.5, fontWeight:700, color:'#DC2626', textDecoration:'none', display:'inline-flex', alignItems:'center', gap:4, marginTop:4 }}>Ir a editar ficha {Ic.arrow}</Link>
        </div>
        <div style={mdBtnRowStyle}>
          <button onClick={()=>setIsAlergiasOpen(false)} style={mdBtnSecStyle}>Cerrar</button>
          <button onClick={handleSaveAlergias} disabled={alergiasSaving} className="md-save-btn" style={savedSection==='alergias'?mdBtnSavedStyle:mdBtnPrimaryStyle}>{savedSection==='alergias'?<>{Ic.check} ¡Guardado!</>:<>{Ic.trash} {alergiasSaving?'Guardando...':'Confirmar eliminación'}</>}</button>
        </div>
      </Modal>

      {/* ─── Medicamentos ─── */}
      <Modal isOpen={isMedOpen} onClose={()=>setIsMedOpen(false)} title="Medicación Actual">
        <p style={mdSectionLabel}>Medicamentos registrados · {localMeds.length}</p>
        {localMeds.length===0 ? (
          <div style={{ textAlign:'center', padding:'18px 0 10px', color:'#94A3B8', fontSize:13 }}>Sin medicamentos registrados.</div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:14 }}>
            {localMeds.map((m,i)=>(
              <div key={i} style={itemCardStyle}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, flex:1, minWidth:0 }}>
                    <div style={{ width:22, height:22, borderRadius:6, backgroundColor:'#EFF6FF', display:'flex', alignItems:'center', justifyContent:'center', color:'#3B82F6', fontSize:11, fontWeight:800, flexShrink:0 }}>{i+1}</div>
                    <span style={{ fontSize:13.5, fontWeight:700, color:'#0F172A', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{m.nombre}</span>
                    {m.dosis && <span style={{ fontSize:11, fontWeight:600, backgroundColor:'#F0F9FF', color:'#0369A1', padding:'2px 8px', borderRadius:12, border:'1px solid #BAE6FD', flexShrink:0 }}>{m.dosis}</span>}
                  </div>
                  <button onClick={()=>setLocalMeds(prev=>prev.filter((_,j)=>j!==i))} style={removeBtnStyle}>{Ic.trash}</button>
                </div>
                <div style={{ display:'flex', gap:16, marginTop:6, paddingLeft:2 }}>
                  {m.frecuencia && <p style={{ fontSize:12, color:'#64748B' }}><span style={{ fontWeight:600 }}>Frecuencia:</span> {m.frecuencia}</p>}
                  {m.notas && <p style={{ fontSize:12, color:'#64748B' }}><span style={{ fontWeight:600 }}>Notas:</span> {m.notas}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
        <div style={{ padding:'10px 14px', borderRadius:8, backgroundColor:'#FEF2F2', border:'1px solid #FEE2E2' }}>
          <p style={{ fontSize:12.5, color:'#991B1B', fontWeight:500 }}>Para <strong>agregar o editar</strong> medicamentos, ve a la Ficha Vital completa.</p>
          <Link to="/registro" onClick={()=>setIsMedOpen(false)} style={{ fontSize:12.5, fontWeight:700, color:'#DC2626', textDecoration:'none', display:'inline-flex', alignItems:'center', gap:4, marginTop:4 }}>Ir a editar ficha {Ic.arrow}</Link>
        </div>
        <div style={mdBtnRowStyle}>
          <button onClick={()=>setIsMedOpen(false)} style={mdBtnSecStyle}>Cerrar</button>
          <button onClick={handleSaveMeds} disabled={medsSaving} className="md-save-btn" style={savedSection==='meds'?mdBtnSavedStyle:mdBtnPrimaryStyle}>{savedSection==='meds'?<>{Ic.check} ¡Guardado!</>:<>{Ic.trash} {medsSaving?'Guardando...':'Confirmar eliminación'}</>}</button>
        </div>
      </Modal>

      {/* ─── Contactos ─── */}
      <Modal isOpen={isContactosOpen} onClose={()=>setIsContactosOpen(false)} title="Contactos de Emergencia">
        <p style={mdSectionLabel}>Contactos registrados · {localContactos.length}</p>
        {localContactos.length===0 ? (
          <div style={{ textAlign:'center', padding:'18px 0 10px', color:'#94A3B8', fontSize:13 }}>Sin contactos de emergencia registrados.</div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:14 }}>
            {localContactos.map((c,i)=>(
              <div key={i} style={itemCardStyle}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, flex:1, minWidth:0 }}>
                    <div style={{ width:26, height:26, borderRadius:'50%', backgroundColor:'#DC2626', color:'#FFFFFF', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, flexShrink:0 }}>{i+1}</div>
                    <span style={{ fontSize:13.5, fontWeight:700, color:'#0F172A', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.nombre}</span>
                    {c.relacion && <span style={{ fontSize:11, fontWeight:600, backgroundColor:'#F5F3FF', color:'#7C3AED', padding:'2px 8px', borderRadius:12, border:'1px solid #DDD6FE', flexShrink:0 }}>{c.relacion}</span>}
                  </div>
                  <button onClick={()=>setLocalContactos(prev=>prev.filter((_,j)=>j!==i))} style={removeBtnStyle}>{Ic.trash}</button>
                </div>
                {c.telefono && (
                  <p style={{ fontSize:12, color:'#64748B', marginTop:6, paddingLeft:2, display:'flex', alignItems:'center', gap:5 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92v2z"/></svg>
                    {c.telefono}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
        <div style={{ padding:'10px 14px', borderRadius:8, backgroundColor:'#FEF2F2', border:'1px solid #FEE2E2' }}>
          <p style={{ fontSize:12.5, color:'#991B1B', fontWeight:500 }}>Para <strong>agregar, editar</strong> o reordenar contactos, ve a la Ficha Vital completa.</p>
          <Link to="/registro" onClick={()=>setIsContactosOpen(false)} style={{ fontSize:12.5, fontWeight:700, color:'#DC2626', textDecoration:'none', display:'inline-flex', alignItems:'center', gap:4, marginTop:4 }}>Ir a editar ficha {Ic.arrow}</Link>
        </div>
        <div style={mdBtnRowStyle}>
          <button onClick={()=>setIsContactosOpen(false)} style={mdBtnSecStyle}>Cerrar</button>
          <button onClick={handleSaveContactos} disabled={contactosSaving} className="md-save-btn" style={savedSection==='contactos'?mdBtnSavedStyle:mdBtnPrimaryStyle}>{savedSection==='contactos'?<>{Ic.check} ¡Guardado!</>:<>{Ic.trash} {contactosSaving?'Guardando...':'Confirmar eliminación'}</>}</button>
        </div>
      </Modal>

      {/* ─── Cambiar contraseña ─── */}
      <Modal isOpen={isChangePwdOpen} onClose={()=>setIsChangePwdOpen(false)} title="Cambiar Contraseña">
        {pwdSuccess ? (
          <div style={{ textAlign:'center', padding:'24px 0' }}>
            <div style={{ width:52, height:52, borderRadius:'50%', backgroundColor:'#D1FAE5', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px', color:'#10B981', fontSize:22 }}>✓</div>
            <p style={{ fontSize:15, fontWeight:700, color:'#065F46' }}>¡Contraseña actualizada!</p>
            <p style={{ fontSize:13, color:'#94A3B8', marginTop:4 }}>Se cerrará en un momento...</p>
          </div>
        ) : (
          <>
            <p style={{ fontSize:13.5, color:'#64748B', lineHeight:1.55, marginBottom:20 }}>Ingresa tu contraseña actual para verificar tu identidad, luego elige una nueva contraseña segura.</p>

            {pwdError && <div style={{ ...errorBannerStyle, marginBottom:16 }}>{Ic.warn}<span>{pwdError}</span></div>}

            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {/* Contraseña actual */}
              <FField label="Contraseña actual" required>
                <div style={{ position:'relative' }}>
                  <input type={showPwd.actual?'text':'password'} value={pwdForm.actual} onChange={e=>setPwdForm(v=>({...v,actual:e.target.value}))}
                    style={{ ...fInput(pwdForm.actual.length>=6, false), paddingRight:40 }} placeholder="Tu contraseña actual"/>
                  <button type="button" onClick={()=>setShowPwd(v=>({...v,actual:!v.actual}))}
                    style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'transparent', border:'none', cursor:'pointer', color:'#94A3B8', display:'flex' }}>
                    {showPwd.actual ? Ic.eyeOff : Ic.eye}
                  </button>
                </div>
              </FField>

              <div style={{ height:1, backgroundColor:'#F1F5F9' }}/>

              {/* Nueva contraseña */}
              <FField label="Nueva contraseña" required error={pwdForm.nueva && pwdForm.nueva.length<6 ? 'Mínimo 6 caracteres' : null} touched={pwdForm.nueva.length>0 && pwdForm.nueva.length<6}>
                <div style={{ position:'relative' }}>
                  <input type={showPwd.nueva?'text':'password'} value={pwdForm.nueva} onChange={e=>setPwdForm(v=>({...v,nueva:e.target.value}))}
                    style={{ ...fInput(pwdForm.nueva.length>=6, pwdForm.nueva.length>0&&pwdForm.nueva.length<6), paddingRight:40 }} placeholder="Mínimo 6 caracteres"/>
                  <button type="button" onClick={()=>setShowPwd(v=>({...v,nueva:!v.nueva}))}
                    style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'transparent', border:'none', cursor:'pointer', color:'#94A3B8', display:'flex' }}>
                    {showPwd.nueva ? Ic.eyeOff : Ic.eye}
                  </button>
                </div>
              </FField>

              {/* Confirmar nueva */}
              <FField label="Confirmar nueva contraseña" required error={pwdForm.confirmar && pwdForm.confirmar !== pwdForm.nueva ? 'Las contraseñas no coinciden' : null} touched={pwdForm.confirmar.length>0 && pwdForm.confirmar !== pwdForm.nueva}>
                <div style={{ position:'relative' }}>
                  <input type={showPwd.confirmar?'text':'password'} value={pwdForm.confirmar} onChange={e=>setPwdForm(v=>({...v,confirmar:e.target.value}))}
                    style={{ ...fInput(pwdForm.confirmar.length>=6 && pwdForm.confirmar===pwdForm.nueva, pwdForm.confirmar.length>0&&pwdForm.confirmar!==pwdForm.nueva), paddingRight:40 }} placeholder="Repite la nueva contraseña"/>
                  <button type="button" onClick={()=>setShowPwd(v=>({...v,confirmar:!v.confirmar}))}
                    style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'transparent', border:'none', cursor:'pointer', color:'#94A3B8', display:'flex' }}>
                    {showPwd.confirmar ? Ic.eyeOff : Ic.eye}
                  </button>
                </div>
              </FField>
            </div>

            <div style={mdBtnRowStyle}>
              <button onClick={()=>setIsChangePwdOpen(false)} style={mdBtnSecStyle}>Cancelar</button>
              <button onClick={handleChangePassword} disabled={pwdLoading || !pwdForm.actual || !pwdForm.nueva || !pwdForm.confirmar} style={mdBtnPrimaryStyle}>
                {Ic.lock} {pwdLoading?'Actualizando...':'Actualizar contraseña'}
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}

/* ══════════════════════════════════════════════════════
   STYLES
═══════════════════════════════════════════════════════ */
const globalCSS = `
  @keyframes spin { to { transform:rotate(360deg) } }
  @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
  .dash-content-fade { animation:fadeIn 0.35s ease; }
  .db-overlay { display:none; position:fixed; inset:0; background:rgba(0,0,0,0.35); z-index:200; }
  .db-overlay-active { display:block !important; }
  .sb-item,.sb-toggle,.sb-sub,.sb-logout { transition:all 0.2s cubic-bezier(0.4,0,0.2,1) !important; }
  .sb-item:hover { background-color:#FEF2F2 !important; color:#DC2626 !important; }
  .sb-toggle:hover { background-color:#F8FAFC !important; }
  .sb-sub:hover { background-color:#FEF2F2 !important; color:#DC2626 !important; }
  .sb-logout:hover { background-color:#FEF2F2 !important; color:#DC2626 !important; border-color:#FEE2E2 !important; }
  .db-btn-outline { transition:all 0.22s ease !important; }
  .db-btn-outline:hover { background-color:#DC2626 !important; color:#FFFFFF !important; }
  .db-btn-solid { transition:all 0.22s ease !important; }
  .db-btn-solid:hover { background-color:#B91C1C !important; transform:translateY(-1px); }
  .db-stat-card { transition:transform 0.2s ease,box-shadow 0.2s ease; }
  .db-stat-card:hover { transform:translateY(-2px); box-shadow:0 10px 28px rgba(15,23,42,0.09) !important; }
  .db-check-btn { transition:all 0.18s ease !important; }
  .db-check-btn:hover { background-color:#FEF2F2 !important; border-color:#FCA5A5 !important; color:#DC2626 !important; }
  .db-qr-btn,.db-parame { transition:all 0.18s ease !important; }
  .db-qr-btn:hover { background-color:#F3F4F6 !important; transform:translateY(-1px); }
  .db-parame:hover { background-color:#1F2937 !important; transform:translateY(-1px); }
  .db-qr-danger { transition:all 0.18s ease !important; }
  .db-qr-danger:hover { background-color:#FEF2F2 !important; }
  .md-save-btn { transition:all 0.22s ease !important; }
  .md-save-btn:hover:not(:disabled) { background-color:#B91C1C !important; transform:translateY(-1px); box-shadow:0 6px 16px rgba(220,38,38,0.3) !important; }
  .db-topbtn { transition:all 0.18s ease !important; }
  .db-topbtn:hover { background-color:#F3F4F6 !important; }
  .db-menu-item,.db-menu-item-danger { transition:all 0.18s ease !important; }
  .db-menu-item:hover { background-color:#F8FAFC !important; }
  .db-menu-item-danger:hover { background-color:#FEF2F2 !important; }
  @media(max-width:768px){
    .dashboard-sidebar{transform:translateX(-100%);transition:transform 0.25s ease;position:fixed;z-index:300;top:0;left:0;height:100vh;}
    .dashboard-sidebar.sidebar-open{transform:translateX(0);}
    .dashboard-hamburger{display:flex !important;}
    .dashboard-search-input{width:150px !important;}
    .dashboard-heading-row{flex-direction:column !important;}
    .dashboard-stat-row{grid-template-columns:1fr !important;}
    .dashboard-two-col-grid{grid-template-columns:1fr !important;}
    .dashboard-ficha-body{flex-direction:column !important;align-items:center !important;}
    .dashboard-qr-section{flex-direction:column !important;align-items:center !important;}
    .dashboard-qr-info-col{width:100% !important;}
  }
  @media(min-width:769px){.dashboard-hamburger{display:none !important;}.db-overlay{display:none !important;}}
`

const shellStyle = { display:'flex', minHeight:'100vh', backgroundColor:'#F8FAFC', fontFamily:"system-ui,-apple-system,'Segoe UI',sans-serif" }

// Sidebar
const sidebarStyle = { width:260, flexShrink:0, backgroundColor:'#FFFFFF', borderRight:'1px solid #E2E8F0', boxShadow:'2px 0 16px rgba(15,23,42,0.05)', display:'flex', flexDirection:'column', minHeight:'100vh', position:'sticky', top:0, height:'100vh', overflowY:'auto' }
const sbDivStyle = { height:1, backgroundColor:'#F1F5F9', margin:'0 12px' }
const sbLabelStyle = { fontSize:9.5, fontWeight:700, color:'#94A3B8', letterSpacing:'1px', textTransform:'uppercase', padding:'8px 10px 4px', display:'block' }
const sbItemBase = { display:'flex', alignItems:'center', gap:10, padding:'9px 11px', borderRadius:8, margin:'1px 0', fontSize:13.5, fontWeight:600, cursor:'pointer', border:'none', textDecoration:'none', textAlign:'left', width:'100%', borderLeft:'3px solid transparent' }
const sbItemActiveStyle = { ...sbItemBase, color:'#DC2626', backgroundColor:'#FEF2F2', borderLeftColor:'#DC2626' }
const sbToggleStyle = { ...sbItemBase, color:'#475569', backgroundColor:'transparent', display:'flex', alignItems:'center' }
const sbSubStyle = { display:'flex', alignItems:'center', gap:10, padding:'8px 10px 8px 14px', borderRadius:7, fontSize:13, fontWeight:500, cursor:'pointer', border:'none', background:'transparent', textAlign:'left', width:'100%', color:'#475569' }
const sbLogoutStyle = { display:'flex', alignItems:'center', gap:10, padding:'9px 11px', borderRadius:8, fontSize:13.5, fontWeight:600, cursor:'pointer', border:'1px solid #E2E8F0', backgroundColor:'transparent', color:'#64748B', width:'100%', textAlign:'left' }

// Top bar
const topBarStyle = { backgroundColor:'#FFFFFF', borderBottom:'1px solid #E5E7EB', padding:'12px 26px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, position:'sticky', top:0, zIndex:50, boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }
const iconBtnStyle = { width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid #E5E7EB', borderRadius:8, background:'transparent', color:'#6B7280', cursor:'pointer' }
const userChipStyle = { display:'flex', alignItems:'center', gap:9, padding:'5px 11px', border:'1px solid #E5E7EB', borderRadius:10, marginLeft:4, background:'transparent', cursor:'pointer', gap:9 }
const avatarStyle = { width:32, height:32, borderRadius:'50%', backgroundColor:'#DC2626', color:'#FFFFFF', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, flexShrink:0 }
const dropdownStyle = { position:'absolute', top:'calc(100% + 8px)', right:0, backgroundColor:'#FFFFFF', border:'1px solid #E5E7EB', borderRadius:12, boxShadow:'0 8px 24px rgba(0,0,0,0.12)', width:230, zIndex:200, overflow:'hidden' }
const menuItemStyle = { display:'flex', alignItems:'center', gap:10, width:'100%', padding:'11px 16px', border:'none', background:'transparent', fontSize:13.5, fontWeight:600, color:'#374151', cursor:'pointer', textAlign:'left' }

// Stats
const statCardStyle = { backgroundColor:'#FFFFFF', border:'1px solid #E5E7EB', borderRadius:13, padding:'20px', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }
const statLabelStyle = { fontSize:11.5, fontWeight:700, color:'#64748B', letterSpacing:'0.3px' }
const statSubStyle = { fontSize:12, color:'#94A3B8', lineHeight:1.45 }

// Cards
const cardStyle = { backgroundColor:'#FFFFFF', border:'1px solid #E5E7EB', borderRadius:13, padding:'22px', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }
const cardTitleStyle = { fontSize:14.5, fontWeight:700, color:'#111827' }
const cardSubStyle = { fontSize:12, color:'#9CA3AF', marginBottom:18, marginTop:2 }
const badgeGreenStyle = { fontSize:11, fontWeight:700, color:'#065F46', backgroundColor:'#D1FAE5', padding:'3px 10px', borderRadius:20 }

// Check list rows
const checkRowStyle = { display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, paddingBottom:14, paddingTop:14, borderBottom:'1px solid #F1F5F9' }
const checkIconBase = (bg, color) => ({ width:20, height:20, borderRadius:'50%', backgroundColor:bg, color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, flexShrink:0 })
const checkTitleStyle = { fontSize:13, fontWeight:600, color:'#111827', lineHeight:1.3 }
const checkSubStyle = { fontSize:11.5, color:'#9CA3AF', marginTop:2, lineHeight:1.4 }
const checkBtnStyle = { display:'inline-flex', alignItems:'center', gap:5, padding:'5px 10px', border:'1px solid #E2E8F0', borderRadius:7, fontSize:12, fontWeight:600, color:'#64748B', backgroundColor:'#FFFFFF', cursor:'pointer', flexShrink:0 }

// QR action buttons
const qrBtnStyle = { display:'inline-flex', alignItems:'center', gap:5, padding:'7px 12px', borderRadius:7, fontSize:12, fontWeight:600, cursor:'pointer', border:'1px solid #D1D5DB', backgroundColor:'#FFFFFF', color:'#374151' }
const qrDangerBtnStyle = { ...qrBtnStyle, border:'1px solid #FCA5A5', backgroundColor:'#FFF5F5', color:'#DC2626' }

// Banners
const errorBannerStyle = { display:'flex', alignItems:'center', gap:10, padding:'12px 16px', backgroundColor:'#FEF2F2', border:'1px solid #FEE2E2', borderRadius:10, color:'#DC2626', fontSize:13.5, fontWeight:500, marginBottom:16 }
const successBannerStyle = { display:'flex', alignItems:'center', gap:10, padding:'12px 16px', backgroundColor:'#ECFDF5', border:'1px solid #A7F3D0', borderRadius:10, color:'#065F46', fontSize:13.5, fontWeight:600, marginBottom:16 }

// Button styles
const btnOutlineStyle = { display:'inline-flex', alignItems:'center', gap:6, padding:'9px 16px', border:'1.5px solid #DC2626', borderRadius:9, color:'#DC2626', backgroundColor:'#FFFFFF', fontSize:13, fontWeight:600, cursor:'pointer', textDecoration:'none' }
const btnSolidStyle = { display:'inline-flex', alignItems:'center', gap:6, padding:'9px 16px', border:'none', borderRadius:9, color:'#FFFFFF', backgroundColor:'#DC2626', fontSize:13, fontWeight:600, cursor:'pointer', textDecoration:'none', boxShadow:'0 4px 12px rgba(220,38,38,0.22)' }

// Modal shared
const mdDescStyle = { fontSize:13.5, color:'#475569', lineHeight:1.5, marginBottom:18 }
const mdLabelStyle = { fontSize:13, fontWeight:600, color:'#475569', display:'block', marginBottom:5 }
const mdSelectStyle = { width:'100%', padding:'10px 12px', border:'1px solid #D1D5DB', borderRadius:8, fontSize:13.5, fontFamily:'inherit', outline:'none', cursor:'pointer', boxSizing:'border-box' }
const mdInputStyle = { width:'100%', padding:'10px 12px', border:'1px solid #D1D5DB', borderRadius:8, fontSize:13.5, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }
const mdBtnRowStyle = { display:'flex', justifyContent:'flex-end', gap:10, marginTop:22, borderTop:'1px solid #E5E7EB', paddingTop:16 }
const mdBtnSecStyle = { padding:'9px 18px', borderRadius:8, border:'none', backgroundColor:'#F3F4F6', color:'#374151', fontSize:13.5, fontWeight:600, cursor:'pointer' }
const mdBtnDangerStyle = { padding:'9px 18px', borderRadius:8, border:'none', backgroundColor:'#DC2626', color:'#FFFFFF', fontSize:13.5, fontWeight:600, cursor:'pointer' }
const mdBtnPrimaryStyle = { display:'inline-flex', alignItems:'center', gap:6, padding:'9px 18px', borderRadius:8, border:'none', backgroundColor:'#DC2626', color:'#FFFFFF', fontSize:13.5, fontWeight:600, cursor:'pointer' }
const mdSectionLabel = { fontSize:11, fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:10, display:'block' }

// Detail rows (in section modals)
const detailRowStyle = { display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderRadius:9, border:'1px solid #E2E8F0', backgroundColor:'#FAFAFA' }
const removeBtnStyle = { display:'flex', alignItems:'center', justifyContent:'center', width:30, height:30, borderRadius:7, border:'1px solid #FEE2E2', backgroundColor:'#FEF2F2', color:'#DC2626', cursor:'pointer', flexShrink:0 }
// Inline edit item cards (modals)
const itemCardStyle = { padding:'14px 16px', borderRadius:10, border:'1.5px solid #E2E8F0', backgroundColor:'#FAFAFA' }
// Saved state button
const mdBtnSavedStyle = { display:'inline-flex', alignItems:'center', gap:6, padding:'9px 18px', borderRadius:8, border:'none', backgroundColor:'#10B981', color:'#FFFFFF', fontSize:13.5, fontWeight:700, cursor:'default', transition:'background-color 0.3s ease' }
