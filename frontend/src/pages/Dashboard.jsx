import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { theme } from '../styles/theme'
import Modal from '../components/Modal'
import QRCode from 'qrcode'

export default function Dashboard() {
  const navigate = useNavigate()
  const canvasRef = useRef(null)
  
  // Loading & Error states
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState(null)

  // Data states
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

  // Load dashboard data on mount
  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate('/login')
        return
      }

      // 1. Fetch public.usuarios details
      const { data: dbUsuario, error: userError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('auth_user_id', user.id)
        .maybeSingle()

      if (userError) throw userError

      if (!dbUsuario) {
        // No user record yet, redirect to step wizard
        navigate('/registro')
        return
      }
      setUsuario(dbUsuario)

      // 2. Fetch or create active token
      let activeDbToken = null
      const { data: dbToken, error: tokenFetchError } = await supabase
        .from('tokens_qr')
        .select('*')
        .eq('usuario_id', dbUsuario.id)
        .eq('estado', 'activo')
        .maybeSingle()

      if (tokenFetchError) throw tokenFetchError

      if (dbToken) {
        activeDbToken = dbToken
      } else {
        const { data: createdToken, error: tokenCreateError } = await supabase
          .from('tokens_qr')
          .insert([{ usuario_id: dbUsuario.id, estado: 'activo' }])
          .select('*')
          .single()

        if (tokenCreateError) throw tokenCreateError
        activeDbToken = createdToken
      }

      setActiveToken(activeDbToken)

      // 3. Fetch perfiles_medicos
      const { data: dbPerfil } = await supabase
        .from('perfiles_medicos')
        .select('*')
        .eq('usuario_id', dbUsuario.id)
        .maybeSingle()

      if (dbPerfil) {
        setPerfil(dbPerfil)

        // Fetch Alergias joined with Master catalog
        const { data: dbAlergias } = await supabase
          .from('perfil_alergias')
          .select('severidad, reaccion_observada, alergias(nombre, categoria)')
          .eq('perfil_id', dbPerfil.id)

        if (dbAlergias) {
          setAlergias(dbAlergias.map(item => ({
            nombre: item.alergias?.nombre,
            categoria: item.alergias?.categoria,
            severidad: item.severidad,
            reaccion: item.reaccion_observada
          })))
        }

        // Fetch Condiciones joined
        const { data: dbCondiciones } = await supabase
          .from('perfil_condiciones')
          .select('estado, tratamiento_actual, condiciones_cronicas(nombre, categoria)')
          .eq('perfil_id', dbPerfil.id)

        if (dbCondiciones) {
          setCondiciones(dbCondiciones.map(item => ({
            nombre: item.condiciones_cronicas?.nombre,
            categoria: item.condiciones_cronicas?.categoria,
            estado: item.estado,
            tratamiento: item.tratamiento_actual
          })))
        }

        // Fetch Medicamentos joined
        const { data: dbMedicamentos } = await supabase
          .from('perfil_medicamentos')
          .select('dosis, frecuencia, notas, medicamentos(nombre_generico)')
          .eq('perfil_id', dbPerfil.id)

        if (dbMedicamentos) {
          setMedicamentos(dbMedicamentos.map(item => ({
            nombre: item.medicamentos?.nombre_generico,
            dosis: item.dosis,
            frecuencia: item.frecuencia,
            notas: item.notas
          })))
        }
      } else {
        // No medical profile, must go to wizard
        navigate('/registro')
        return
      }

      // 4. Fetch Contactos de Emergencia
      const { data: dbContactos } = await supabase
        .from('contactos_emergencia')
        .select('*')
        .eq('usuario_id', dbUsuario.id)
        .order('orden_prioridad')

      if (dbContactos) setContactos(dbContactos)

      // 5. Fetch NFC Tags linked to this token
      if (activeDbToken) {
        const { data: dbNfc } = await supabase
          .from('nfc_tags')
          .select('*')
          .eq('token_qr_id', activeDbToken.id)
        if (dbNfc) setNfcTags(dbNfc)

        // Fetch recent scans (accesos_emergencia)
        const { data: dbAccesos } = await supabase
          .from('accesos_emergencia')
          .select('*')
          .eq('token_qr_id', activeDbToken.id)
          .order('accedido_en', { ascending: false })
          .limit(10)
        
        if (dbAccesos) setAccesos(dbAccesos)
      }

    } catch (err) {
      setError(err.message || 'Error al descargar sus datos clínicos de la nube.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  // Render QR image when activeToken loads
  useEffect(() => {
    if (!activeToken?.token_uuid) {
      setQrImageUrl('')
      return
    }

    let cancelled = false
    setQrError(null)
    const emergencyUrl = `${window.location.origin}/emergency/${activeToken.token_uuid}`

    QRCode.toDataURL(emergencyUrl, {
      width: 220,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#0F172A',
        light: '#FFFFFF'
      }
    })
      .then((dataUrl) => {
        if (!cancelled) setQrImageUrl(dataUrl)
      })
      .catch((err) => {
        console.error("Error generating QR on canvas:", err)
        if (!cancelled) setQrError('No se pudo renderizar el QR en pantalla.')
      })

    return () => {
      cancelled = true
    }
  }, [activeToken])

  // EXPORT STYLED PNG QR CODE WITH OFFICIAL EMBLEM FRAME
  const handleDownloadQR = async () => {
    if (!activeToken || !usuario) return
    setQrError(null)

    try {
      const emergencyUrl = `${window.location.origin}/emergency/${activeToken.token_uuid}`
      const qrDataUrl = await QRCode.toDataURL(emergencyUrl, {
        width: 260,
        margin: 2,
        errorCorrectionLevel: 'H',
        color: {
          dark: '#0F172A',
          light: '#FFFFFF'
        }
      })

      const exportCanvas = document.createElement('canvas')
      exportCanvas.width = 400
      exportCanvas.height = 520
      const ctx = exportCanvas.getContext('2d')

      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, 400, 520)
      ctx.fillStyle = '#DC2626'
      ctx.fillRect(0, 0, 400, 70)
      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 18px Inter, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('MediRecord UNMSM', 200, 32)
      ctx.font = '600 11px Inter, sans-serif'
      ctx.fillText('FICHA VITAL DE EMERGENCIA', 200, 52)

      const qrImage = new Image()
      qrImage.src = qrDataUrl
      await qrImage.decode()
      ctx.drawImage(qrImage, 70, 100, 260, 260)

      ctx.fillStyle = '#475569'
      ctx.font = 'bold 14px Inter, sans-serif'
      ctx.fillText(usuario.nombre_completo.toUpperCase(), 200, 390)
      ctx.fillStyle = '#94A3B8'
      ctx.font = '600 11px Inter, sans-serif'
      ctx.fillText(`DNI: ${usuario.dni}`, 200, 410)
      ctx.fillStyle = '#64748B'
      ctx.font = '500 9px monospace'
      ctx.fillText(`/emergency/${activeToken.token_uuid}`, 200, 430)

      ctx.fillStyle = '#0F172A'
      ctx.fillRect(0, 445, 400, 75)
      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 13px Inter, sans-serif'
      ctx.fillText('EN CASO DE EMERGENCIA ESCANEE AQUI', 200, 472)
      ctx.font = '500 10px Inter, sans-serif'
      ctx.fillText('Curso SQA | Metodologia DevSecOps', 200, 492)

      const link = document.createElement('a')
      link.download = `MediRecord_QR_${usuario.dni}.png`
      link.href = exportCanvas.toDataURL('image/png')
      link.click()
      return
    } catch (err) {
      console.error('Error downloading QR:', err)
      setQrError(err.message || 'No se pudo descargar el QR.')
      return
    }
  }

  /*
    // Create secondary offline canvas to render frame
    const exportCanvas = document.createElement('canvas')
    exportCanvas.width = 400
    exportCanvas.height = 500
    const ctx = exportCanvas.getContext('2d')

    // Background
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, 400, 500)

    // Crimson Header Bar
    ctx.fillStyle = '#DC2626'
    ctx.fillRect(0, 0, 400, 70)

    // Header text
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 18px Inter, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('MediRecord UNMSM', 200, 32)
    
    ctx.font = '600 11px Inter, sans-serif'
    ctx.fillText('FICHA VITAL DE EMERGENCIA', 200, 52)

    // Bottom banner
    ctx.fillStyle = '#0F172A'
    ctx.fillRect(0, 430, 400, 70)

    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 13px Inter, sans-serif'
    ctx.fillText('EN CASO DE EMERGENCIA ESCANEE AQUÍ', 200, 458)
    ctx.font = '500 10px Inter, sans-serif'
    ctx.fillText('Curso SQA | Metodología DevSecOps', 200, 478)

    // Drawing the QR code in the center
    const qrImage = new Image()
    qrImage.src = canvasRef.current.toDataURL('image/png')
    qrImage.onload = () => {
      // Draw QR image (260x260 size)
      ctx.drawImage(qrImage, 70, 100, 260, 260)

      // Add patient's name below the QR
      ctx.fillStyle = '#475569'
      ctx.font = 'bold 14px Inter, sans-serif'
      ctx.fillText(usuario.nombre_completo.toUpperCase(), 200, 390)

      ctx.fillStyle = '#94A3B8'
      ctx.font = '600 11px Inter, sans-serif'
      ctx.fillText(`DNI: ${usuario.dni}`, 200, 410)

      // Trigger download
      const link = document.createElement('a')
      link.download = `MediRecord_QR_${usuario.dni}.png`
      link.href = exportCanvas.toDataURL('image/png')
      link.click()
    }
  */

  // ATOMIC REVOCATION
  const handleRevokeToken = async () => {
    if (!activeToken) return
    setActionLoading(true)
    setError(null)
    
    const finalMotivo = revokeMotivo === 'Otro' ? customMotivo : revokeMotivo

    try {
      // Invoke RPC: revocar_token(p_token_id, p_motivo)
      const { data, error: rpcError } = await supabase.rpc('revocar_token', {
        p_token_id: activeToken.id,
        p_motivo: finalMotivo
      })

      if (rpcError) throw rpcError

      if (data?.error) {
        throw new Error(data.error)
      }

      // Success, now generate a new active QR token immediately!
      const { error: insertError } = await supabase
        .from('tokens_qr')
        .insert([{
          usuario_id: usuario.id,
          estado: 'activo'
        }])

      if (insertError) throw insertError

      setIsRevokeModalOpen(false)
      setRevokeMotivo('Pérdida de dispositivo')
      setCustomMotivo('')
      
      // Reload everything
      await fetchDashboardData()

    } catch (err) {
      setError(err.message || 'Error al revocar y regenerar el código vital.')
    } finally {
      setActionLoading(false)
    }
  }

  // REGISTER MANUAL NFC SIMULATOR
  const handleRegisterNfc = async () => {
    if (!manualNfcUid.trim()) return
    setActionLoading(true)
    setError(null)

    try {
      // Check if tag_uid already registered
      const { data: existingTag } = await supabase
        .from('nfc_tags')
        .select('id')
        .eq('tag_uid', manualNfcUid.trim())
        .maybeSingle()

      if (existingTag) {
        throw new Error('Este Chip NFC ya se encuentra vinculado a un expediente.')
      }

      // Insert NFC Tag
      const { error: nfcError } = await supabase
        .from('nfc_tags')
        .insert([{
          token_qr_id: activeToken.id,
          tag_uid: manualNfcUid.trim(),
          estado: 'activo'
        }])

      if (nfcError) throw nfcError

      // Insert Audit log action
      await supabase.from('audit_log').insert([{
        usuario_id: usuario.id,
        accion: 'NFC_VINCULADO',
        tabla_afectada: 'nfc_tags',
        datos_nuevos: { tag_uid: manualNfcUid.trim() }
      }])

      setIsNfcModalOpen(false)
      setManualNfcUid('')
      await fetchDashboardData()

    } catch (err) {
      setError(err.message || 'Error al vincular el TAG NFC físico.')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={spinnerContainerStyle}>
        <div style={spinnerStyle}></div>
        <p style={{ color: theme.colors.textMedium, marginTop: '16px', fontWeight: '500' }}>Abriendo panel vital...</p>
      </div>
    )
  }

  return (
    <div style={containerStyle} className="animate-fade-in">
      
      {/* DASHBOARD HEADER */}
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>Panel Clínico de {usuario?.nombre_completo.split(' ')[0]}</h1>
          <p style={subtitleStyle}>Gestione su Ficha Vital, NFC físico y consulte logs de emergencias</p>
        </div>
        <Link to="/registro" style={editButtonStyle}>
          ✏️ Editar Datos Médicos
        </Link>
      </div>

      {error && (
        <div style={errorContainerStyle}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* DASHBOARD LAYOUT */}
      <div className="dashboard-layout-grid">
        
        {/* LEFT COLUMN: QR & NFC */}
        <div style={leftColStyle}>
          
          {/* QR CODE CARD */}
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <h3 style={cardTitleStyle}>Código QR de Emergencia</h3>
              <span style={activeBadgeStyle}>ACTIVO</span>
            </div>
            
            <div style={qrWrapperStyle}>
              {activeToken ? (
                <>
                  {qrImageUrl ? (
                    <img src={qrImageUrl} alt="Código QR de emergencia" style={qrImageStyle} />
                  ) : (
                    <div style={emptyQrStyle}>Generando QR...</div>
                  )}
                  <p style={qrLinkStyle}>/emergency/{activeToken.token_uuid}</p>
                  <Link to={`/emergency/${activeToken.token_uuid}`} target="_blank" style={testQrLinkStyle}>
                    Probar vista de emergencia
                  </Link>
                  {qrError && <p style={qrErrorStyle}>{qrError}</p>}
                </>
              ) : (
                <div style={emptyQrStyle}>Sin token QR activo</div>
              )}
            </div>

            <div style={qrActionsStyle}>
              <button onClick={handleDownloadQR} style={downloadBtnStyle}>
                ⬇️ Descargar QR Oficial Frame
              </button>
              <button onClick={() => setIsRevokeModalOpen(true)} style={revokeBtnStyle}>
                ⚠️ Revocar y Regenerar QR
              </button>
            </div>
          </div>

          {/* NFC TAGS CARD */}
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <h3 style={cardTitleStyle}>Dispositivos NFC Vinculados</h3>
              <button onClick={() => setIsNfcModalOpen(true)} style={addNfcLinkStyle}>+ Vincular Tag</button>
            </div>

            {nfcTags.length === 0 ? (
              <p style={nfcEmptyStyle}>No posee pulseras o llaveros NFC vinculados a su expediente.</p>
            ) : (
              <div style={nfcListStyle}>
                {nfcTags.map(tag => (
                  <div key={tag.id} style={nfcBadgeStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '18px' }}>📟</span>
                      <div>
                        <strong style={nfcUidStyle}>{tag.tag_uid}</strong>
                        <span style={nfcDateStyle}>Viculado en: {new Date(tag.vinculado_en).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <span style={nfcStatusStyle(tag.estado)}>{tag.estado.toUpperCase()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: CLINICAL RESUME */}
        <div style={rightColStyle}>
          
          {/* GENERAL INFO SHIELD */}
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <h3 style={cardTitleStyle}>Ficha Vital de Emergencia</h3>
              <span style={secureShieldStyle}>🛡️ Ley N° 29733</span>
            </div>

            <div style={vitalSummaryGridStyle}>
              <div style={vitalCardStyle('#FEE2E2', theme.colors.primary)}>
                <span style={vitalLabelStyle}>TIPO DE SANGRE</span>
                <strong style={vitalValStyle}>{perfil?.tipo_sangre}</strong>
              </div>

              <div style={vitalCardStyle('#E0F2FE', '#0284C7')}>
                <span style={vitalLabelStyle}>SEXO</span>
                <strong style={vitalValStyle}>{perfil?.sexo === 'masculino' ? 'MASC' : perfil?.sexo === 'femenino' ? 'FEM' : 'OTRO'}</strong>
              </div>

              <div style={vitalCardStyle('#ECFDF5', theme.colors.success)}>
                <span style={vitalLabelStyle}>DONANTE</span>
                <strong style={vitalValStyle}>{perfil?.donante_organos ? 'SÍ' : 'NO'}</strong>
              </div>

              <div style={vitalCardStyle('#F1F5F9', theme.colors.textMedium)}>
                <span style={vitalLabelStyle}>DNI</span>
                <strong style={{ ...vitalValStyle, fontSize: '18px' }}>{usuario?.dni}</strong>
              </div>
            </div>

            <div style={metricsRowStyle}>
              <div style={metricStyle}>
                <span style={metricLabelStyle}>Peso</span>
                <strong style={metricValueStyle}>{perfil?.peso_kg ? `${perfil.peso_kg} Kg` : 'No registrado'}</strong>
              </div>
              <div style={metricStyle}>
                <span style={metricLabelStyle}>Altura</span>
                <strong style={metricValueStyle}>{perfil?.altura_cm ? `${perfil.altura_cm} cm` : 'No registrado'}</strong>
              </div>
              <div style={metricStyle}>
                <span style={metricLabelStyle}>Edad</span>
                <strong style={metricValueStyle}>
                  {perfil?.fecha_nacimiento 
                    ? `${new Date().getFullYear() - new Date(perfil.fecha_nacimiento).getFullYear()} años` 
                    : 'No registrado'}
                </strong>
              </div>
            </div>

            {perfil?.notas_adicionales && (
              <div style={notesBoxStyle}>
                <strong style={notesTitleStyle}>Notas Médicas Especiales:</strong>
                <p style={notesContentStyle}>{perfil.notas_adicionales}</p>
              </div>
            )}
          </div>

          {/* ALERGIAS & CONDICIONES RESUME */}
          <div className="dashboard-double-grid">
            
            {/* ALERGIAS */}
            <div style={cardStyle}>
              <h4 style={subCardTitleStyle}>Alergias ({alergias.length})</h4>
              {alergias.length === 0 ? (
                <p style={emptySectionStyle}>Ninguna registrada.</p>
              ) : (
                <div style={badgeContainerStyle}>
                  {alergias.map((a, i) => (
                    <div key={i} style={miniBadgeStyle(a.severidad)}>
                      <strong>{a.nombre}</strong>
                      <span style={{ fontSize: '10px' }}>({a.severidad})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* CONDICIONES */}
            <div style={cardStyle}>
              <h4 style={subCardTitleStyle}>Condiciones Crónicas ({condiciones.length})</h4>
              {condiciones.length === 0 ? (
                <p style={emptySectionStyle}>Ninguna registrada.</p>
              ) : (
                <div style={badgeContainerStyle}>
                  {condiciones.map((c, i) => (
                    <div key={i} style={miniConditionBadgeStyle}>
                      <strong>{c.nombre}</strong>
                      <span style={{ fontSize: '10px' }}>({c.estado})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RECENT ACCESS LOGS */}
          <div style={cardStyle}>
            <h3 style={cardTitleStyle} className="mb-12">Historial de Accesos de Emergencia (Últimos 10)</h3>
            <p style={{ fontSize: '12px', color: theme.colors.textLight, marginBottom: '16px' }}>
              De acuerdo con la auditoría de seguridad inmutable (DevSecOps), aquí se listan los accesos de paramédicos.
            </p>

            {accesos.length === 0 ? (
              <p style={nfcEmptyStyle}>Ningún acceso de emergencia registrado hasta el momento.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={tableStyle}>
                  <thead>
                    <tr style={tableHeaderRowStyle}>
                      <th style={thStyle}>Fecha / Hora</th>
                      <th style={thStyle}>IP Origen</th>
                      <th style={thStyle}>Vía</th>
                      <th style={thStyle}>Resultado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accesos.map(acc => (
                      <tr key={acc.id} style={tableRowStyle}>
                        <td style={tdStyle}>{new Date(acc.accedido_en).toLocaleString()}</td>
                        <td style={tdStyle}>{acc.ip_origen || 'Desconocida'}</td>
                        <td style={tdStyle}>{acc.via_nfc ? '📟 NFC' : '📷 Código QR'}</td>
                        <td style={tdStyle}>
                          <span style={accStatusStyle(acc.resultado)}>
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

        </div>
      </div>

      {/* MODAL: REVOCAR QR */}
      <Modal
        isOpen={isRevokeModalOpen}
        onClose={() => setIsRevokeModalOpen(false)}
        title="⚠️ Revocar Código QR de Emergencia"
      >
        <p style={modalDescStyle}>
          Al revocar este token QR, se **invalidará permanentemente** tanto el código actual como todas las pulseras/llaveros NFC vinculados a él.
          Un nuevo código QR activo será generado al instante para su seguridad.
        </p>

        <div style={inputGroupStyle} className="mb-16">
          <label style={labelStyle}>Motivo de la Revocación</label>
          <select
            value={revokeMotivo}
            onChange={(e) => setRevokeMotivo(e.target.value)}
            style={selectStyle}
          >
            <option value="Pérdida de dispositivo">Pérdida de dispositivo físico (Celular / Llavero)</option>
            <option value="Actualización de datos">Actualización profunda de datos</option>
            <option value="Sospecha de vulnerabilidad">Sospecha de escaneo malintencionado</option>
            <option value="Otro">Otro motivo</option>
          </select>
        </div>

        {revokeMotivo === 'Otro' && (
          <div style={inputGroupStyle} className="mb-20">
            <label style={labelStyle}>Especifique el motivo</label>
            <input
              type="text"
              required
              placeholder="Ej. Robo de billetera con tarjeta vital"
              value={customMotivo}
              onChange={(e) => setCustomMotivo(e.target.value)}
              style={inputStyle}
            />
          </div>
        )}

        <div style={modalButtonRowStyle}>
          <button
            onClick={() => setIsRevokeModalOpen(false)}
            style={buttonSecondaryStyle}
            disabled={actionLoading}
          >
            Cancelar
          </button>
          <button
            onClick={handleRevokeToken}
            style={revokeConfirmBtnStyle}
            disabled={actionLoading}
          >
            {actionLoading ? 'Revocando...' : 'Confirmar Revocación'}
          </button>
        </div>
      </Modal>

      {/* MODAL: REGISTRAR NFC */}
      <Modal
        isOpen={isNfcModalOpen}
        onClose={() => setIsNfcModalOpen(false)}
        title="📟 Vincular Tag NFC Físico"
      >
        <p style={modalDescStyle}>
          Vincule un dispositivo físico de identificación médica (pulsera, llavero o sticker con chip NTAG213/215).
        </p>

        <div style={inputGroupStyle} className="mb-20">
          <label style={labelStyle}>Ingrese el UID físico del Chip NFC (8 o 14 dígitos hex)</label>
          <input
            type="text"
            placeholder="Ej. 04:A3:B2:C1:D0:E9:80"
            value={manualNfcUid}
            onChange={(e) => setManualNfcUid(e.target.value)}
            style={inputStyle}
          />
          <p style={{ fontSize: '11px', color: theme.colors.textLight, marginTop: '4px' }}>
            *Para pruebas del SQA, ingrese cualquier identificador alfanumérico único.
          </p>
        </div>

        <div style={modalButtonRowStyle}>
          <button
            onClick={() => setIsNfcModalOpen(false)}
            style={buttonSecondaryStyle}
            disabled={actionLoading}
          >
            Cancelar
          </button>
          <button
            onClick={handleRegisterNfc}
            style={nfcConfirmBtnStyle}
            disabled={actionLoading || !manualNfcUid.trim()}
          >
            {actionLoading ? 'Guardando...' : 'Vincular Dispositivo'}
          </button>
        </div>
      </Modal>
    </div>
  )
}

// Styling definitions
const spinnerContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '60vh',
}

const spinnerStyle = {
  width: '50px',
  height: '50px',
  border: '5px solid #e2e8f0',
  borderTop: '5px solid #dc2626',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite'
}

const containerStyle = {
  maxWidth: '1200px',
  margin: '0 auto',
}

const headerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '36px',
  flexWrap: 'wrap',
  gap: '16px',
}

const titleStyle = {
  fontSize: '28px',
  fontWeight: '800',
  color: theme.colors.textDark,
  letterSpacing: '-0.75px',
}

const subtitleStyle = {
  fontSize: '14px',
  color: theme.colors.textMedium,
  marginTop: '4px',
}

const editButtonStyle = {
  backgroundColor: theme.colors.bgPrimary,
  color: theme.colors.textMedium,
  border: `1px solid ${theme.colors.border}`,
  padding: '12px 20px',
  borderRadius: theme.borderRadius.md,
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'none',
  boxShadow: theme.shadows.card,
  transition: theme.transitions.fast,
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
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
  fontSize: '13.5px',
  fontWeight: '500',
  marginBottom: '32px',
}

const layoutGridStyle = {
  display: 'grid',
  gridTemplateColumns: '380px 1fr',
  gap: '32px',
  alignItems: 'start',
}

const leftColStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '32px',
}

const rightColStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '32px',
}

const cardStyle = {
  backgroundColor: theme.colors.bgPrimary,
  border: `1px solid ${theme.colors.border}`,
  borderRadius: theme.borderRadius.lg,
  padding: '28px',
  boxShadow: theme.shadows.card,
}

const cardHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderBottom: `1px solid ${theme.colors.border}`,
  paddingBottom: '16px',
  marginBottom: '20px',
}

const cardTitleStyle = {
  fontSize: '16px',
  fontWeight: '700',
  color: theme.colors.textDark,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
}

const activeBadgeStyle = {
  fontSize: '10px',
  fontWeight: '700',
  color: '#FFFFFF',
  backgroundColor: theme.colors.success,
  padding: '4px 10px',
  borderRadius: theme.borderRadius.sm,
}

const secureShieldStyle = {
  fontSize: '11px',
  fontWeight: '600',
  color: '#0284C7',
  backgroundColor: '#E0F2FE',
  padding: '4px 10px',
  borderRadius: theme.borderRadius.sm,
}

const qrWrapperStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '20px 0',
  backgroundColor: theme.colors.bgSecondary,
  border: `1px solid ${theme.colors.border}`,
  borderRadius: theme.borderRadius.md,
}

const qrCanvasStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: '8px',
  boxShadow: '0 4px 10px rgba(0,0,0,0.02)',
}

const qrImageStyle = {
  width: '220px',
  height: '220px',
  backgroundColor: '#FFFFFF',
  borderRadius: '8px',
  boxShadow: '0 4px 10px rgba(0,0,0,0.04)',
  display: 'block',
}

const qrLinkStyle = {
  marginTop: '12px',
  fontFamily: 'monospace',
  fontSize: '12px',
  color: theme.colors.textLight,
}

const testQrLinkStyle = {
  marginTop: '10px',
  color: theme.colors.primary,
  fontSize: '13px',
  fontWeight: '700',
  textDecoration: 'none',
}

const qrErrorStyle = {
  marginTop: '10px',
  color: theme.colors.primary,
  fontSize: '12px',
  fontWeight: '600',
  textAlign: 'center',
}

const emptyQrStyle = {
  height: '220px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: theme.colors.textLight,
  fontWeight: '500',
}

const qrActionsStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  marginTop: '20px',
}

const downloadBtnStyle = {
  backgroundColor: theme.colors.primary,
  color: '#FFFFFF',
  border: 'none',
  padding: '12px',
  borderRadius: theme.borderRadius.md,
  fontSize: '13.5px',
  fontWeight: '600',
  cursor: 'pointer',
  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.12)',
  transition: theme.transitions.default,
  textAlign: 'center',
}

const revokeBtnStyle = {
  backgroundColor: 'transparent',
  color: theme.colors.primary,
  border: `1px solid ${theme.colors.primaryBorder}`,
  padding: '12px',
  borderRadius: theme.borderRadius.md,
  fontSize: '13px',
  fontWeight: '600',
  cursor: 'pointer',
  transition: theme.transitions.default,
}

const addNfcLinkStyle = {
  background: 'transparent',
  border: 'none',
  color: theme.colors.primary,
  fontSize: '13px',
  fontWeight: '700',
  cursor: 'pointer',
}

const nfcEmptyStyle = {
  textAlign: 'center',
  padding: '20px',
  color: theme.colors.textLight,
  fontSize: '13px',
  fontWeight: '500',
  backgroundColor: theme.colors.bgSecondary,
  border: `1px dashed ${theme.colors.border}`,
  borderRadius: theme.borderRadius.md,
}

const nfcListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
}

const nfcBadgeStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 16px',
  backgroundColor: theme.colors.bgSecondary,
  border: `1px solid ${theme.colors.border}`,
  borderRadius: theme.borderRadius.md,
}

const nfcUidStyle = {
  display: 'block',
  fontSize: '14px',
  fontWeight: '700',
  color: theme.colors.textDark,
}

const nfcDateStyle = {
  display: 'block',
  fontSize: '11px',
  color: theme.colors.textLight,
  marginTop: '2px',
}

const nfcStatusStyle = (estado) => ({
  fontSize: '10px',
  fontWeight: '700',
  padding: '2px 8px',
  borderRadius: '4px',
  backgroundColor: estado === 'activo' ? theme.colors.success : '#94A3B8',
  color: '#FFFFFF',
})

const vitalSummaryGridStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '16px',
  marginBottom: '28px',
}

const vitalCardStyle = (bgColor, textColor) => ({
  backgroundColor: bgColor,
  padding: '16px',
  borderRadius: theme.borderRadius.md,
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  border: `1px solid rgba(0,0,0,0.02)`,
})

const vitalLabelStyle = {
  fontSize: '9px',
  fontWeight: '800',
  color: theme.colors.textMedium,
  letterSpacing: '0.75px',
}

const vitalValStyle = {
  fontSize: '24px',
  fontWeight: '900',
  color: '#0F172A',
}

const metricsRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  borderBlock: `1px solid ${theme.colors.border}`,
  padding: '20px 8px',
  marginBottom: '24px',
}

const metricStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '4px',
}

const metricLabelStyle = {
  fontSize: '12px',
  fontWeight: '500',
  color: theme.colors.textLight,
}

const metricValueStyle = {
  fontSize: '16px',
  fontWeight: '700',
  color: theme.colors.textDark,
}

const notesBoxStyle = {
  padding: '16px 20px',
  backgroundColor: theme.colors.primaryLight,
  border: `1px solid ${theme.colors.primaryBorder}`,
  borderRadius: theme.borderRadius.md,
}

const notesTitleStyle = {
  fontSize: '13px',
  color: theme.colors.primary,
  display: 'block',
  marginBottom: '4px',
}

const notesContentStyle = {
  fontSize: '13px',
  color: theme.colors.textMedium,
  lineHeight: '1.45',
  fontWeight: '500',
}

const doubleGridStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '24px',
}

const subCardTitleStyle = {
  fontSize: '14px',
  fontWeight: '700',
  color: theme.colors.textDark,
  marginBottom: '16px',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  borderBottom: `2px solid ${theme.colors.border}`,
  paddingBottom: '8px',
}

const emptySectionStyle = {
  color: theme.colors.textLight,
  fontSize: '12.5px',
  fontWeight: '500',
  textAlign: 'center',
  padding: '12px',
}

const badgeContainerStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
}

const miniBadgeStyle = (severity) => {
  const isSevere = severity === 'severa' || severity === 'anafilaxia'
  return {
    fontSize: '12px',
    fontWeight: '600',
    padding: '6px 12px',
    borderRadius: theme.borderRadius.sm,
    backgroundColor: isSevere ? theme.colors.dangerLight : theme.colors.warningLight,
    border: `1px solid ${isSevere ? theme.colors.primaryBorder : '#FEF3C7'}`,
    color: isSevere ? theme.colors.primary : theme.colors.warning,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  }
}

const miniConditionBadgeStyle = {
  fontSize: '12px',
  fontWeight: '600',
  padding: '6px 12px',
  borderRadius: theme.borderRadius.sm,
  backgroundColor: theme.colors.bgSecondary,
  border: `1px solid ${theme.colors.border}`,
  color: theme.colors.textDark,
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
}

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  textAlign: 'left',
}

const tableHeaderRowStyle = {
  borderBottom: `2px solid ${theme.colors.border}`,
}

const thStyle = {
  padding: '12px 16px',
  fontSize: '12px',
  fontWeight: '700',
  color: theme.colors.textMedium,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
}

const tableRowStyle = {
  borderBottom: `1px solid ${theme.colors.border}`,
  transition: theme.transitions.fast,
  ':hover': {
    backgroundColor: theme.colors.bgSecondary,
  }
}

const tdStyle = {
  padding: '14px 16px',
  fontSize: '13px',
  color: theme.colors.textMedium,
  fontWeight: '500',
}

const accStatusStyle = (result) => {
  const isOk = result === 'exitoso'
  return {
    fontSize: '11px',
    fontWeight: '700',
    padding: '2px 8px',
    borderRadius: '4px',
    backgroundColor: isOk ? theme.colors.successLight : theme.colors.dangerLight,
    color: isOk ? theme.colors.success : theme.colors.primary,
  }
}

const modalDescStyle = {
  fontSize: '13.5px',
  color: theme.colors.textMedium,
  lineHeight: '1.5',
  marginBottom: '20px',
  fontWeight: '500',
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

const selectStyle = {
  width: '100%',
  padding: '12px 14px',
  border: `1px solid ${theme.colors.border}`,
  borderRadius: theme.borderRadius.md,
  fontSize: '14px',
  outline: 'none',
  cursor: 'pointer',
  fontFamily: theme.fonts.main,
}

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  border: `1px solid ${theme.colors.border}`,
  borderRadius: theme.borderRadius.md,
  fontSize: '14px',
  outline: 'none',
  fontFamily: theme.fonts.main,
}

const modalButtonRowStyle = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '12px',
  marginTop: '24px',
  borderTop: `1px solid ${theme.colors.border}`,
  paddingTop: '16px',
}

const buttonSecondaryStyle = {
  backgroundColor: theme.colors.bgTertiary,
  color: theme.colors.textMedium,
  border: 'none',
  padding: '10px 20px',
  borderRadius: theme.borderRadius.md,
  fontSize: '13.5px',
  fontWeight: '600',
  cursor: 'pointer',
}

const revokeConfirmBtnStyle = {
  backgroundColor: theme.colors.primary,
  color: '#FFFFFF',
  border: 'none',
  padding: '10px 20px',
  borderRadius: theme.borderRadius.md,
  fontSize: '13.5px',
  fontWeight: '600',
  cursor: 'pointer',
}

const nfcConfirmBtnStyle = {
  ...revokeConfirmBtnStyle,
  backgroundColor: theme.colors.success,
}
