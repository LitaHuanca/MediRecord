import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { theme } from '../styles/theme'

// Catalogs fallback data for SQA resilience
const SEED_ALERGIAS = [
  { id: '1', nombre: 'Penicilina', categoria: 'medicamento', descripcion: 'Antibiótico betalactámico' },
  { id: '2', nombre: 'Amoxicilina', categoria: 'medicamento', descripcion: 'Betalactámico derivado de penicilina' },
  { id: '3', nombre: 'Ibuprofeno', categoria: 'medicamento', descripcion: 'AINE' },
  { id: '4', nombre: 'Aspirina', categoria: 'medicamento', descripcion: 'AAS' },
  { id: '5', nombre: 'Látex', categoria: 'contacto', descripcion: 'Material de guantes quirúrgicos' },
  { id: '6', nombre: 'Frutos secos', categoria: 'alimento', descripcion: 'Maní, almendras - riesgo anafilaxia' },
  { id: '7', nombre: 'Mariscos', categoria: 'alimento', descripcion: 'Crustáceos y moluscos' },
  { id: '8', nombre: 'Polen', categoria: 'ambiental', descripcion: 'Rinitis alérgica' },
  { id: '9', nombre: 'Picadura de abeja', categoria: 'ambiental', descripcion: 'Riesgo de anafilaxia' },
  { id: '10', nombre: 'Lactosa', categoria: 'alimento', descripcion: 'Intolerancia (enzimática)' }
]

const SEED_CONDICIONES = [
  { id: '1', nombre: 'Diabetes tipo 1', categoria: 'endocrina', descripcion: 'Déficit absoluto de insulina' },
  { id: '2', nombre: 'Diabetes tipo 2', categoria: 'endocrina', descripcion: 'Resistencia a la insulina' },
  { id: '3', nombre: 'Hipertensión arterial', categoria: 'cardiovascular', descripcion: 'Tensión arterial crónica' },
  { id: '4', nombre: 'Marcapasos implantado', categoria: 'cardiovascular', descripcion: 'Evitar desfibrilación directa' },
  { id: '5', nombre: 'Epilepsia', categoria: 'neurologica', descripcion: 'Trastorno convulsivo' },
  { id: '6', nombre: 'Asma', categoria: 'respiratoria', descripcion: 'Obstrucción bronquial' },
  { id: '7', nombre: 'Insuficiencia renal crónica', categoria: 'renal', descripcion: 'Ajustar dosis nefrotóxicas' },
  { id: '8', nombre: 'Hemofilia A', categoria: 'cardiovascular', descripcion: 'Riesgo hemorrágico severo' },
  { id: '9', nombre: 'Hipotiroidismo', categoria: 'endocrina', descripcion: 'Déficit de hormona tiroidea' }
]

const isValidUuid = (value) => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

export default function RegistroMultistep() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(true)
  const [errorMessage, setErrorMessage] = useState(null)
  
  // Database Catalogs
  const [catalogoAlergias, setCatalogoAlergias] = useState([])
  const [catalogoCondiciones, setCatalogoCondiciones] = useState([])
  const [catalogoMedicamentos, setCatalogoMedicamentos] = useState([])
  
  // Master IDs
  const [userId, setUserId] = useState(null)
  const [perfilId, setPerfilId] = useState(null)

  // STEP 1: Datos Generales state
  const [generalData, setGeneralData] = useState({
    nombreCompleto: '',
    dni: '',
    telefono: '',
    tipoSangre: 'desconocido',
    sexo: 'prefiero_no_decir',
    fechaNacimiento: '',
    donanteOrganos: false,
    pesoKg: '',
    alturaCm: '',
    notasAdicionales: ''
  })

  // STEP 2: Alergias state
  const [userAlergias, setUserAlergias] = useState([])
  const [selectedAlergiaId, setSelectedAlergiaId] = useState('')
  const [alergiaSeveridad, setAlergiaSeveridad] = useState('leve')
  const [alergiaReaccion, setAlergiaReaccion] = useState('')

  // STEP 3: Condiciones state
  const [userCondiciones, setUserCondiciones] = useState([])
  const [selectedCondicionId, setSelectedCondicionId] = useState('')
  const [condicionEstado, setCondicionEstado] = useState('activa')
  const [condicionTratamiento, setCondicionTratamiento] = useState('')

  // STEP 4: Medicamentos state
  const [userMedicamentos, setUserMedicamentos] = useState([])
  const [medNombre, setMedNombre] = useState('')
  const [medDosis, setMedDosis] = useState('')
  const [medFrecuencia, setMedFrecuencia] = useState('')
  const [medNotas, setMedNotas] = useState('')

  // STEP 5: Contactos state
  const [userContactos, setUserContactos] = useState([
    { nombre: '', telefono: '', relacion: 'familiar', ordenPrioridad: 1 },
    { nombre: '', telefono: '', relacion: 'familiar', ordenPrioridad: 2 }
  ])

  // Load catalogs and existing user profile on mount
  useEffect(() => {
    async function loadData() {
      try {
        setFetchingData(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          navigate('/login')
          return
        }

        // Fetch Catalogs
        const { data: dbAlergias, error: alergiasError } = await supabase
          .from('alergias')
          .select('*')
          .order('nombre')
        if (alergiasError) throw new Error(`No se pudo cargar el catálogo de alergias: ${alergiasError.message}`)
        setCatalogoAlergias(dbAlergias || [])

        const { data: dbCondiciones, error: condicionesError } = await supabase
          .from('condiciones_cronicas')
          .select('*')
          .order('nombre')
        if (condicionesError) throw new Error(`No se pudo cargar el catálogo de condiciones: ${condicionesError.message}`)
        setCatalogoCondiciones(dbCondiciones || [])

        const { data: dbMedicamentos, error: medicamentosError } = await supabase
          .from('medicamentos')
          .select('*')
          .order('nombre_generico')
        if (medicamentosError) throw new Error(`No se pudo cargar el catálogo de medicamentos: ${medicamentosError.message}`)
        setCatalogoMedicamentos(dbMedicamentos || [])

        // Fetch user from public.usuarios
        const { data: dbUsuario, error: userError } = await supabase
          .from('usuarios')
          .select('*')
          .eq('auth_user_id', user.id)
          .maybeSingle()

        if (userError) throw userError

        let activeUsuario = dbUsuario

        if (!activeUsuario) {
          const { data: createdUsuario, error: createUserError } = await supabase
            .from('usuarios')
            .insert([{
              auth_user_id: user.id,
              email: user.email,
              nombre_completo: user.user_metadata?.nombre_completo || 'Usuario MediRecord',
              dni: user.user_metadata?.dni || null,
              activo: true
            }])
            .select('*')
            .single()

          if (createUserError) throw createUserError
          activeUsuario = createdUsuario
        }

        if (activeUsuario) {
          setUserId(activeUsuario.id)
          
          // Pre-populate Step 1 from usuarios
          setGeneralData(prev => ({
            ...prev,
            nombreCompleto: activeUsuario.nombre_completo || '',
            dni: activeUsuario.dni || '',
            telefono: activeUsuario.telefono || ''
          }))

          // Fetch perfiles_medicos
          const { data: dbPerfil } = await supabase
            .from('perfiles_medicos')
            .select('*')
            .eq('usuario_id', activeUsuario.id)
            .maybeSingle()

          if (dbPerfil) {
            setPerfilId(dbPerfil.id)
            setGeneralData(prev => ({
              ...prev,
              tipoSangre: dbPerfil.tipo_sangre || 'desconocido',
              sexo: dbPerfil.sexo || 'prefiero_no_decir',
              fechaNacimiento: dbPerfil.fecha_nacimiento || '',
              donanteOrganos: dbPerfil.donante_organos || false,
              pesoKg: dbPerfil.peso_kg || '',
              alturaCm: dbPerfil.altura_cm || '',
              notasAdicionales: dbPerfil.notas_adicionales || ''
            }))

            // Fetch existing Alergias
            const { data: dbUserAlergias } = await supabase
              .from('perfil_alergias')
              .select('alergia_id, severidad, reaccion_observada')
              .eq('perfil_id', dbPerfil.id)
            
            if (dbUserAlergias) {
              setUserAlergias(dbUserAlergias.map(item => ({
                alergiaId: item.alergia_id,
                severidad: item.severidad,
                reaccion: item.reaccion_observada
              })))
            }

            // Fetch existing Condiciones
            const { data: dbUserCondiciones } = await supabase
              .from('perfil_condiciones')
              .select('condicion_id, estado, tratamiento_actual')
              .eq('perfil_id', dbPerfil.id)

            if (dbUserCondiciones) {
              setUserCondiciones(dbUserCondiciones.map(item => ({
                condicionId: item.condicion_id,
                estado: item.estado,
                tratamiento: item.treatment_actual || item.tratamiento_actual
              })))
            }

            // Fetch existing Medicamentos
            const { data: dbUserMedicamentos } = await supabase
              .from('perfil_medicamentos')
              .select('medicamento_id, dosis, frecuencia, notas, medicamentos(nombre_generico)')
              .eq('perfil_id', dbPerfil.id)

            if (dbUserMedicamentos) {
              setUserMedicamentos(dbUserMedicamentos.map(item => ({
                nombre: item.medicamentos?.nombre_generico || 'Medicamento',
                dosis: item.dosis,
                frecuencia: item.frecuencia,
                notas: item.notas
              })))
            }
          }

          // Fetch existing Contactos de Emergencia
          const { data: dbUserContactos } = await supabase
            .from('contactos_emergencia')
            .select('*')
            .eq('usuario_id', activeUsuario.id)
            .order('orden_prioridad')

          if (dbUserContactos && dbUserContactos.length > 0) {
            setUserContactos(dbUserContactos.map(item => ({
              nombre: item.nombre,
              telefono: item.telefono,
              relacion: item.relacion,
              ordenPrioridad: item.orden_prioridad
            })))
          }
        }
      } catch (err) {
        setErrorMessage(err.message || 'Error al precargar sus datos clínicos.')
      } finally {
        setFetchingData(false)
      }
    }

    loadData()
  }, [navigate])

  const handleStep1Submit = (e) => {
    e.preventDefault()
    
    // Validations
    if (!/^\d{8}$/.test(generalData.dni)) {
      setErrorMessage('El DNI debe contener exactamente 8 dígitos.')
      return
    }

    if (generalData.fechaNacimiento && new Date(generalData.fechaNacimiento) >= new Date()) {
      setErrorMessage('La fecha de nacimiento debe ser anterior al día de hoy.')
      return
    }

    if (generalData.pesoKg && (generalData.pesoKg <= 0 || generalData.pesoKg >= 500)) {
      setErrorMessage('Por favor ingrese un peso válido (0 a 500 kg).')
      return
    }

    if (generalData.alturaCm && (generalData.alturaCm <= 0 || generalData.alturaCm >= 300)) {
      setErrorMessage('Por favor ingrese una altura válida (0 a 300 cm).')
      return
    }

    setErrorMessage(null)
    setCurrentStep(2)
  }

  // ALERGIAS MANAGERS
  const handleAddAlergia = () => {
    if (!selectedAlergiaId) return
    if (!isValidUuid(selectedAlergiaId)) {
      setErrorMessage('No se pudo usar esta alergia porque el catálogo real de Supabase no cargó. Revise permisos de lectura en la tabla alergias.')
      return
    }
    if (userAlergias.some(a => a.alergiaId === selectedAlergiaId)) {
      setErrorMessage('Esta alergia ya ha sido agregada a la lista.')
      return
    }
    setUserAlergias([...userAlergias, {
      alergiaId: selectedAlergiaId,
      severidad: alergiaSeveridad,
      reaccion: alergiaReaccion
    }])
    setSelectedAlergiaId('')
    setAlergiaSeveridad('leve')
    setAlergiaReaccion('')
    setErrorMessage(null)
  }

  const handleRemoveAlergia = (id) => {
    setUserAlergias(userAlergias.filter(a => a.alergiaId !== id))
  }

  // CONDICIONES MANAGERS
  const handleAddCondicion = () => {
    if (!selectedCondicionId) return
    if (!isValidUuid(selectedCondicionId)) {
      setErrorMessage('No se pudo usar esta condición porque el catálogo real de Supabase no cargó. Revise permisos de lectura en la tabla condiciones_cronicas.')
      return
    }
    if (userCondiciones.some(c => c.condicionId === selectedCondicionId)) {
      setErrorMessage('Esta condición ya ha sido agregada a la lista.')
      return
    }
    setUserCondiciones([...userCondiciones, {
      condicionId: selectedCondicionId,
      estado: condicionEstado,
      tratamiento: condicionTratamiento
    }])
    setSelectedCondicionId('')
    setCondicionEstado('activa')
    setCondicionTratamiento('')
    setErrorMessage(null)
  }

  const handleRemoveCondicion = (id) => {
    setUserCondiciones(userCondiciones.filter(c => c.condicionId !== id))
  }

  // MEDICAMENTOS MANAGERS
  const handleAddMedicamento = () => {
    if (!medNombre.trim()) return
    const catalogMed = catalogoMedicamentos.find(m => 
      m.nombre_generico.toLowerCase() === medNombre.trim().toLowerCase() ||
      m.nombre_comercial?.toLowerCase() === medNombre.trim().toLowerCase()
    )
    setUserMedicamentos([...userMedicamentos, {
      nombre: catalogMed?.nombre_generico || medNombre.trim(),
      nombreComercial: catalogMed?.nombre_comercial || '',
      categoria: catalogMed?.categoria || '',
      dosis: medDosis.trim() || 'No especificada',
      frecuencia: medFrecuencia.trim() || 'No especificada',
      notas: medNotas.trim()
    }])
    setMedNombre('')
    setMedDosis('')
    setMedFrecuencia('')
    setMedNotas('')
  }

  const handleRemoveMedicamento = (index) => {
    setUserMedicamentos(userMedicamentos.filter((_, i) => i !== index))
  }

  // CONTACTOS MANAGERS
  const handleContactoChange = (index, field, value) => {
    const next = [...userContactos]
    next[index][field] = value
    setUserContactos(next)
  }

  const handleAddContacto = () => {
    if (userContactos.length >= 5) return
    setUserContactos([...userContactos, {
      nombre: '',
      telefono: '',
      relacion: 'familiar',
      ordenPrioridad: userContactos.length + 1
    }])
  }

  const handleRemoveContacto = (index) => {
    if (userContactos.length <= 1) return
    const filtered = userContactos.filter((_, i) => i !== index)
    // Re-adjust priorities
    const updated = filtered.map((c, i) => ({ ...c, ordenPrioridad: i + 1 }))
    setUserContactos(updated)
  }

  // SUBMIT COMPLETE FORM TO SUPABASE
  const handleFinalSubmit = async () => {
    setLoading(true)
    setErrorMessage(null)

    try {
      let activeUserId = userId

      if (!activeUserId) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          navigate('/login')
          return
        }

        const { data: existingUsuario, error: existingUsuarioError } = await supabase
          .from('usuarios')
          .select('id')
          .eq('auth_user_id', user.id)
          .maybeSingle()

        if (existingUsuarioError) throw existingUsuarioError

        if (existingUsuario) {
          activeUserId = existingUsuario.id
        } else {
          const { data: createdUsuario, error: createUsuarioError } = await supabase
            .from('usuarios')
            .insert([{
              auth_user_id: user.id,
              email: user.email,
              nombre_completo: generalData.nombreCompleto.trim(),
              dni: generalData.dni,
              telefono: generalData.telefono || null,
              activo: true
            }])
            .select('id')
            .single()

          if (createUsuarioError) throw createUsuarioError
          activeUserId = createdUsuario.id
        }

        setUserId(activeUserId)
      }

      // 1. Update public.usuarios table
      const { error: userUpdateError } = await supabase
        .from('usuarios')
        .update({
          nombre_completo: generalData.nombreCompleto.trim(),
          dni: generalData.dni,
          telefono: generalData.telefono
        })
        .eq('id', activeUserId)

      if (userUpdateError) throw userUpdateError

      // 2. Insert or Update perfiles_medicos
      let activePerfilId = perfilId
      if (!activePerfilId) {
        // Insert new profile
        const { data: newProfile, error: profileInsertError } = await supabase
          .from('perfiles_medicos')
          .insert([{
            usuario_id: activeUserId,
            tipo_sangre: generalData.tipoSangre,
            sexo: generalData.sexo,
            fecha_nacimiento: generalData.fechaNacimiento || null,
            donante_organos: generalData.donanteOrganos,
            peso_kg: generalData.pesoKg ? parseFloat(generalData.pesoKg) : null,
            altura_cm: generalData.alturaCm ? parseInt(generalData.alturaCm) : null,
            notas_adicionales: generalData.notasAdicionales.trim() || null
          }])
          .select('id')
          .single()

        if (profileInsertError) throw profileInsertError
        activePerfilId = newProfile.id
      } else {
        // Update existing profile
        const { error: profileUpdateError } = await supabase
          .from('perfiles_medicos')
          .update({
            tipo_sangre: generalData.tipoSangre,
            sexo: generalData.sexo,
            fecha_nacimiento: generalData.fechaNacimiento || null,
            donante_organos: generalData.donanteOrganos,
            peso_kg: generalData.pesoKg ? parseFloat(generalData.pesoKg) : null,
            altura_cm: generalData.alturaCm ? parseInt(generalData.alturaCm) : null,
            notas_adicionales: generalData.notasAdicionales.trim() || null
          })
          .eq('id', activePerfilId)

        if (profileUpdateError) throw profileUpdateError
      }

      // 3. Save Alergias (delete existing and insert new ones - clean slate)
      const { error: clearAlergiasError } = await supabase
        .from('perfil_alergias')
        .delete()
        .eq('perfil_id', activePerfilId)

      if (clearAlergiasError) throw clearAlergiasError

      if (userAlergias.length > 0) {
        const { error: insertAlergiasError } = await supabase
          .from('perfil_alergias')
          .insert(
            userAlergias.map(item => ({
              perfil_id: activePerfilId,
              alergia_id: item.alergiaId,
              severidad: item.severidad,
              reaccion_observada: item.reaccion || null
            }))
          )
        if (insertAlergiasError) throw insertAlergiasError
      }

      // 4. Save Condiciones (delete and insert)
      const { error: clearCondicionesError } = await supabase
        .from('perfil_condiciones')
        .delete()
        .eq('perfil_id', activePerfilId)

      if (clearCondicionesError) throw clearCondicionesError

      if (userCondiciones.length > 0) {
        const { error: insertCondicionesError } = await supabase
          .from('perfil_condiciones')
          .insert(
            userCondiciones.map(item => ({
              perfil_id: activePerfilId,
              condicion_id: item.condicionId,
              estado: item.estado,
              tratamiento_actual: item.tratamiento || null
            }))
          )
        if (insertCondicionesError) throw insertCondicionesError
      }

      // 5. Save Medicamentos
      // Delete existing associations
      const { error: clearMedsError } = await supabase
        .from('perfil_medicamentos')
        .delete()
        .eq('perfil_id', activePerfilId)

      if (clearMedsError) throw clearMedsError

      for (const med of userMedicamentos) {
        // Search if medicamento exists in standard table
        let medId
        const { data: existingMed } = await supabase
          .from('medicamentos')
          .select('id')
          .ilike('nombre_generico', med.nombre)
          .maybeSingle()

        if (existingMed) {
          medId = existingMed.id
        } else {
          // Create a new master catalog entry dynamically
          const { data: newMed, error: newMedError } = await supabase
            .from('medicamentos')
            .insert([{ nombre_generico: med.nombre }])
            .select('id')
            .single()
          
          if (newMedError) throw newMedError
          medId = newMed.id
        }

        // Insert relational row
        const { error: medRelationError } = await supabase
          .from('perfil_medicamentos')
          .insert([{
            perfil_id: activePerfilId,
            medicamento_id: medId,
            dosis: med.dosis,
            frecuencia: med.frecuencia,
            notas: med.notas || null
          }])

        if (medRelationError) throw medRelationError
      }

      // 6. Save Contactos de Emergencia (delete and insert)
      const { error: clearContactosError } = await supabase
        .from('contactos_emergencia')
        .delete()
        .eq('usuario_id', activeUserId)

      if (clearContactosError) throw clearContactosError

      const validContactos = userContactos.filter(c => c.nombre.trim() && c.telefono.trim())
      if (validContactos.length > 0) {
        const { error: insertContactosError } = await supabase
          .from('contactos_emergencia')
          .insert(
            validContactos.map(item => ({
              usuario_id: activeUserId,
              nombre: item.nombre.trim(),
              telefono: item.telefono.trim(),
              relacion: item.relacion,
              orden_prioridad: item.ordenPrioridad
            }))
          )
        if (insertContactosError) throw insertContactosError
      }

      // 7. Verify QR token exists, if not generate one!
      const { data: existingToken } = await supabase
        .from('tokens_qr')
        .select('id')
        .eq('usuario_id', activeUserId)
        .eq('estado', 'activo')
        .maybeSingle()

      if (!existingToken) {
        const { error: tokenError } = await supabase
          .from('tokens_qr')
          .insert([{
            usuario_id: activeUserId,
            estado: 'activo'
          }])
        if (tokenError) throw tokenError
      }

      // Successful completion! Redirect to dashboard
      navigate('/dashboard')

    } catch (err) {
      setErrorMessage(err.message || 'Error al guardar los datos clínicos en el servidor.')
    } finally {
      setLoading(false)
    }
  }

  if (fetchingData) {
    return (
      <div style={spinnerContainerStyle}>
        <div style={spinnerStyle}></div>
        <p style={{ color: theme.colors.textMedium, marginTop: '16px', fontWeight: '500' }}>Cargando expediente clínico...</p>
      </div>
    )
  }

  return (
    <div style={containerStyle} className="animate-fade-in">
      <div style={wizardHeaderStyle}>
        <h1 style={titleStyle}>Ficha Vital de Emergencia</h1>
        <p style={subtitleStyle}>Complete todos los campos para generar el QR vital de la Hora Dorada</p>
        
        {/* STEPPER BAR */}
        <div style={stepperContainerStyle}>
          {[1, 2, 3, 4, 5].map(step => (
            <div key={step} style={stepWrapperStyle}>
              <div style={
                step === currentStep ? activeStepIconStyle :
                step < currentStep ? completedStepIconStyle :
                pendingStepIconStyle
              }>
                {step < currentStep ? '✓' : step}
              </div>
              <span style={step === currentStep ? activeStepLabelStyle : stepLabelStyle}>
                {step === 1 ? 'Generales' :
                 step === 2 ? 'Alergias' :
                 step === 3 ? 'Condiciones' :
                 step === 4 ? 'Fármacos' :
                 'Contactos'}
              </span>
            </div>
          ))}
          <div style={progressBarBgStyle}>
            <div style={{ ...progressBarFillStyle, width: `${(currentStep - 1) * 25}%` }}></div>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div style={errorContainerStyle}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* STEP CARD */}
      <div style={cardStyle}>
        {currentStep === 1 && (
          <form onSubmit={handleStep1Submit} style={formGridStyle}>
            <h3 style={stepTitleStyle}>Paso 1: Datos Vitales y Filiación</h3>
            
            <div style={inputGroupStyle}>
              <label style={labelStyle}>Nombre Completo</label>
              <input
                type="text"
                required
                value={generalData.nombreCompleto}
                onChange={(e) => setGeneralData({ ...generalData, nombreCompleto: e.target.value })}
                style={inputStyle}
              />
            </div>

            <div style={inputGroupStyle}>
              <label style={labelStyle}>DNI (8 dígitos)</label>
              <input
                type="text"
                maxLength="8"
                required
                value={generalData.dni}
                onChange={(e) => setGeneralData({ ...generalData, dni: e.target.value.replace(/\D/g, '') })}
                style={inputStyle}
              />
            </div>

            <div style={inputGroupStyle}>
              <label style={labelStyle}>Teléfono de Contacto</label>
              <input
                type="tel"
                placeholder="+51999888777"
                value={generalData.telefono || ''}
                onChange={(e) => setGeneralData({ ...generalData, telefono: e.target.value })}
                style={inputStyle}
              />
            </div>

            <div style={inputGroupStyle}>
              <label style={labelStyle}>Tipo de Sangre</label>
              <select
                value={generalData.tipoSangre}
                onChange={(e) => setGeneralData({ ...generalData, tipoSangre: e.target.value })}
                style={selectStyle}
              >
                <option value="A+">A Positivo (A+)</option>
                <option value="A-">A Negativo (A-)</option>
                <option value="B+">B Positivo (B+)</option>
                <option value="B-">B Negativo (B-)</option>
                <option value="AB+">AB Positivo (AB+)</option>
                <option value="AB-">AB Negativo (AB-)</option>
                <option value="O+">O Positivo (O+)</option>
                <option value="O-">O Negativo (O-)</option>
                <option value="desconocido">Desconocido</option>
              </select>
            </div>

            <div style={inputGroupStyle}>
              <label style={labelStyle}>Sexo Biológico</label>
              <select
                value={generalData.sexo}
                onChange={(e) => setGeneralData({ ...generalData, sexo: e.target.value })}
                style={selectStyle}
              >
                <option value="masculino">Masculino</option>
                <option value="femenino">Femenino</option>
                <option value="otro">Otro</option>
                <option value="prefiero_no_decir">Prefiero no decirlo</option>
              </select>
            </div>

            <div style={inputGroupStyle}>
              <label style={labelStyle}>Fecha de Nacimiento</label>
              <input
                type="date"
                required
                value={generalData.fechaNacimiento}
                onChange={(e) => setGeneralData({ ...generalData, fechaNacimiento: e.target.value })}
                style={inputStyle}
              />
            </div>

            <div style={inputGroupStyle}>
              <label style={labelStyle}>Peso (Kg)</label>
              <input
                type="number"
                step="0.01"
                placeholder="72.5"
                value={generalData.pesoKg}
                onChange={(e) => setGeneralData({ ...generalData, pesoKg: e.target.value })}
                style={inputStyle}
              />
            </div>

            <div style={inputGroupStyle}>
              <label style={labelStyle}>Altura (cm)</label>
              <input
                type="number"
                placeholder="175"
                value={generalData.alturaCm}
                onChange={(e) => setGeneralData({ ...generalData, alturaCm: e.target.value })}
                style={inputStyle}
              />
            </div>

            <div style={{ ...inputGroupStyle, gridColumn: 'span 2' }}>
              <div style={checkboxWrapperStyle}>
                <input
                  type="checkbox"
                  id="donante"
                  checked={generalData.donanteOrganos}
                  onChange={(e) => setGeneralData({ ...generalData, donanteOrganos: e.target.checked })}
                  style={checkboxStyle}
                />
                <label htmlFor="donante" style={{ ...labelStyle, cursor: 'pointer', margin: 0 }}>
                  Soy Donante de Órganos y Tejidos
                </label>
              </div>
            </div>

            <div style={{ ...inputGroupStyle, gridColumn: 'span 2' }}>
              <label style={labelStyle}>Notas Clínicas Críticas (Marcapasos, prótesis, instrucciones especiales)</label>
              <textarea
                placeholder="Ej. Marcapasos implantado en ventrículo izquierdo (2024). Alérgico severo al contraste de tomografías."
                maxLength="2000"
                value={generalData.notesAdicionales || generalData.notasAdicionales}
                onChange={(e) => setGeneralData({ ...generalData, notasAdicionales: e.target.value })}
                style={textareaStyle}
              />
            </div>

            <div style={{ ...buttonRowStyle, gridColumn: 'span 2' }}>
              <span style={{ flex: 1 }}></span>
              <button type="submit" style={buttonPrimaryStyle}>
                Continuar a Alergias &rarr;
              </button>
            </div>
          </form>
        )}

        {currentStep === 2 && (
          <div style={formFlexStyle}>
            <h3 style={stepTitleStyle}>Paso 2: Alergias Medicamentosas y Alimentarias</h3>
            
            <div style={builderBoxStyle}>
              <div style={inputGroupStyle}>
                <label style={labelStyle}>Buscar / Seleccionar Alergia</label>
                <select
                  value={selectedAlergiaId}
                  onChange={(e) => setSelectedAlergiaId(e.target.value)}
                  style={selectStyle}
                  disabled={catalogoAlergias.length === 0}
                >
                  <option value="">{catalogoAlergias.length === 0 ? '-- Catálogo vacío o no disponible --' : '-- Seleccionar de catálogo --'}</option>
                  {catalogoAlergias.map(a => (
                    <option key={a.id} value={a.id}>{a.nombre} ({a.categoria})</option>
                  ))}
                </select>
              </div>

              <div style={inputGroupStyle}>
                <label style={labelStyle}>Severidad Clínica</label>
                <select
                  value={alergiaSeveridad}
                  onChange={(e) => setAlergiaSeveridad(e.target.value)}
                  style={selectStyle}
                >
                  <option value="leve">Leve (reacción cutánea o picazón)</option>
                  <option value="moderada">Moderada (urticaria extendida)</option>
                  <option value="severa">Severa (broncoespasmo, hinchazón facial)</option>
                  <option value="anafilaxia">Anafilaxia (Peligro de muerte inminente)</option>
                </select>
              </div>

              <div style={{ ...inputGroupStyle, gridColumn: 'span 2' }}>
                <label style={labelStyle}>Reacción Clínica Observada</label>
                <input
                  type="text"
                  placeholder="Ej. Urticaria severa, shock anafiláctico con cianosis"
                  value={alergiaReaccion}
                  onChange={(e) => setAlergiaReaccion(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <button type="button" onClick={handleAddAlergia} style={addButtonStyle}>
                + Agregar Alergia
              </button>
            </div>

            <h4 style={listTitleStyle}>Alergias Registradas ({userAlergias.length})</h4>
            {userAlergias.length === 0 ? (
              <p style={emptyStateStyle}>No ha registrado ninguna alergia clínicamente relevante.</p>
            ) : (
              <div style={gridListStyle}>
                {userAlergias.map((item, index) => {
                  const data = catalogoAlergias.find(a => a.id === item.alergiaId) || { nombre: 'Alergia', categoria: 'otra' }
                  return (
                    <div key={index} style={badgeStyle(item.severidad)}>
                      <div>
                        <strong style={badgeTitleStyle}>{data.nombre}</strong>
                        <span style={badgeCatStyle}>{data.categoria}</span>
                        {item.reaccion && <p style={badgeSubStyle}>Reacción: {item.reaccion}</p>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={badgeSeverityStyle(item.severidad)}>{item.severidad.toUpperCase()}</span>
                        <button type="button" onClick={() => handleRemoveAlergia(item.alergiaId)} style={removeBadgeStyle}>×</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <div style={buttonRowStyle}>
              <button type="button" onClick={() => setCurrentStep(1)} style={buttonSecondaryStyle}>
                &larr; Volver
              </button>
              <button type="button" onClick={() => setCurrentStep(3)} style={buttonPrimaryStyle}>
                Continuar a Condiciones &rarr;
              </button>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div style={formFlexStyle}>
            <h3 style={stepTitleStyle}>Paso 3: Condiciones Médicas Crónicas</h3>
            
            <div style={builderBoxStyle}>
              <div style={inputGroupStyle}>
                <label style={labelStyle}>Seleccionar Condición Crónica</label>
                <select
                  value={selectedCondicionId}
                  onChange={(e) => setSelectedCondicionId(e.target.value)}
                  style={selectStyle}
                  disabled={catalogoCondiciones.length === 0}
                >
                  <option value="">{catalogoCondiciones.length === 0 ? '-- Catálogo vacío o no disponible --' : '-- Seleccionar de catálogo --'}</option>
                  {catalogoCondiciones.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre} ({c.categoria})</option>
                  ))}
                </select>
              </div>

              <div style={inputGroupStyle}>
                <label style={labelStyle}>Estado Clínico Actual</label>
                <select
                  value={condicionEstado}
                  onChange={(e) => setCondicionEstado(e.target.value)}
                  style={selectStyle}
                >
                  <option value="activa">Activa (bajo monitoreo)</option>
                  <option value="controlada">Controlada (con fármacos)</option>
                  <option value="en_remision">En Remisión</option>
                </select>
              </div>

              <div style={{ ...inputGroupStyle, gridColumn: 'span 2' }}>
                <label style={labelStyle}>Tratamiento / Protocolo Vigente</label>
                <input
                  type="text"
                  placeholder="Ej. Losartán 50mg cada 12 horas, Dieta hiposódica"
                  value={condicionTratamiento}
                  onChange={(e) => setCondicionTratamiento(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <button type="button" onClick={handleAddCondicion} style={addButtonStyle}>
                + Agregar Condición
              </button>
            </div>

            <h4 style={listTitleStyle}>Condiciones Registradas ({userCondiciones.length})</h4>
            {userCondiciones.length === 0 ? (
              <p style={emptyStateStyle}>Ninguna patología o condición crónica registrada.</p>
            ) : (
              <div style={gridListStyle}>
                {userCondiciones.map((item, index) => {
                  const data = catalogoCondiciones.find(c => c.id === item.condicionId) || { nombre: 'Condición', categoria: 'otra' }
                  return (
                    <div key={index} style={conditionCardStyle}>
                      <div>
                        <strong style={badgeTitleStyle}>{data.nombre}</strong>
                        <span style={badgeCatStyle}>{data.categoria}</span>
                        {item.tratamiento && <p style={badgeSubStyle}>Tratamiento: {item.tratamiento}</p>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={statusBadgeStyle(item.estado)}>{item.estado.replace('_', ' ').toUpperCase()}</span>
                        <button type="button" onClick={() => handleRemoveCondicion(item.condicionId)} style={removeBadgeStyle}>×</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <div style={buttonRowStyle}>
              <button type="button" onClick={() => setCurrentStep(2)} style={buttonSecondaryStyle}>
                &larr; Volver
              </button>
              <button type="button" onClick={() => setCurrentStep(4)} style={buttonPrimaryStyle}>
                Continuar a Fármacos &rarr;
              </button>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div style={formFlexStyle}>
            <h3 style={stepTitleStyle}>Paso 4: Medicamentos de Uso Crónico</h3>
            
            <div style={builderBoxStyle}>
              <div style={inputGroupStyle}>
                <label style={labelStyle}>Nombre del Medicamento (Genérico / Comercial)</label>
                <input
                  type="text"
                  list="medicamentos-catalogo"
                  placeholder="Ej. Metformina, Insulina Glargina, Clonazepam"
                  value={medNombre}
                  onChange={(e) => setMedNombre(e.target.value)}
                  style={inputStyle}
                />
                <datalist id="medicamentos-catalogo">
                  {catalogoMedicamentos.map(m => (
                    <option
                      key={m.id}
                      value={m.nombre_generico}
                      label={m.nombre_comercial ? `${m.nombre_comercial} - ${m.categoria || 'Sin categoría'}` : m.categoria}
                    />
                  ))}
                </datalist>
              </div>

              <div style={inputGroupStyle}>
                <label style={labelStyle}>Dosis</label>
                <input
                  type="text"
                  placeholder="Ej. 850 mg, 10 UI, 0.5 mg"
                  value={medDosis}
                  onChange={(e) => setMedDosis(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={inputGroupStyle}>
                <label style={labelStyle}>Frecuencia</label>
                <input
                  type="text"
                  placeholder="Ej. Cada 12 horas con alimentos, en las noches"
                  value={medFrecuencia}
                  onChange={(e) => setMedFrecuencia(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={inputGroupStyle}>
                <label style={labelStyle}>Observaciones / Notas adicionales</label>
                <input
                  type="text"
                  placeholder="Ej. No suspender bajo ninguna circunstancia"
                  value={medNotas}
                  onChange={(e) => setMedNotas(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <button type="button" onClick={handleAddMedicamento} style={addButtonStyle}>
                + Agregar Medicamento
              </button>
            </div>

            <h4 style={listTitleStyle}>Medicamentos Registrados ({userMedicamentos.length})</h4>
            {userMedicamentos.length === 0 ? (
              <p style={emptyStateStyle}>No se registran medicamentos de uso diario.</p>
            ) : (
              <div style={gridListStyle}>
                {userMedicamentos.map((item, index) => (
                  <div key={index} style={medCardStyle}>
                    <div style={medCardContentStyle}>
                      <div style={medHeaderStyle}>
                        <strong style={medTitleStyle}>{item.nombre}</strong>
                        {item.categoria && <span style={medCategoryStyle}>{item.categoria}</span>}
                      </div>
                      {item.nombreComercial && (
                        <span style={medCommercialStyle}>Comercial: {item.nombreComercial}</span>
                      )}
                      <div style={medMetaRowStyle}>
                        <span style={medMetaChipStyle}>Dosis: {item.dosis}</span>
                        <span style={medMetaChipStyle}>Frecuencia: {item.frecuencia}</span>
                      </div>
                      {item.notas && <p style={medNoteStyle}>Nota: {item.notas}</p>}
                    </div>
                    <button type="button" onClick={() => handleRemoveMedicamento(index)} style={removeBadgeStyle}>×</button>
                  </div>
                ))}
              </div>
            )}

            <div style={buttonRowStyle}>
              <button type="button" onClick={() => setCurrentStep(3)} style={buttonSecondaryStyle}>
                &larr; Volver
              </button>
              <button type="button" onClick={() => setCurrentStep(5)} style={buttonPrimaryStyle}>
                Continuar a Contactos &rarr;
              </button>
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <div style={formFlexStyle}>
            <h3 style={stepTitleStyle}>Paso 5: Contactos de Emergencia (Hora Dorada)</h3>
            <p style={{ fontSize: '13px', color: theme.colors.textMedium, marginBottom: '16px' }}>
              Registre personas de confianza a quienes el paramédico podrá llamar directamente con un toque desde su celular.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {userContactos.map((contacto, index) => (
                <div key={index} style={contactoBoxStyle}>
                  <div style={contactoHeaderStyle}>
                    <span style={contactoPriorityStyle}>Prioridad {contacto.ordenPrioridad}</span>
                    {userContactos.length > 1 && (
                      <button type="button" onClick={() => handleRemoveContacto(index)} style={removeContactoBtnStyle}>
                        Eliminar Contacto
                      </button>
                    )}
                  </div>
                  
                  <div style={contactoFieldsStyle}>
                    <div style={inputGroupStyle}>
                      <label style={labelStyle}>Nombre del Familiar</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. María Pérez"
                        value={contacto.nombre}
                        onChange={(e) => handleContactoChange(index, 'nombre', e.target.value)}
                        style={inputStyle}
                      />
                    </div>

                    <div style={inputGroupStyle}>
                      <label style={labelStyle}>Teléfono de Emergencia</label>
                      <input
                        type="tel"
                        required
                        placeholder="Ej. +51987654321"
                        value={contacto.telefono}
                        onChange={(e) => handleContactoChange(index, 'telefono', e.target.value)}
                        style={inputStyle}
                      />
                    </div>

                    <div style={inputGroupStyle}>
                      <label style={labelStyle}>Parentesco / Relación</label>
                      <select
                        value={contacto.relacion}
                        onChange={(e) => handleContactoChange(index, 'relacion', e.target.value)}
                        style={selectStyle}
                      >
                        <option value="familiar">Familiar Directo</option>
                        <option value="conyugue">Cónyuge / Pareja</option>
                        <option value="amigo">Amigo de confianza</option>
                        <option value="medico_personal">Médico de Cabecera</option>
                        <option value="otro">Otro</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {userContactos.length < 5 && (
              <button type="button" onClick={handleAddContacto} style={addContactoBtnStyle}>
                + Adicionar Otro Contacto de Emergencia
              </button>
            )}

            <div style={buttonRowStyle}>
              <button type="button" onClick={() => setCurrentStep(4)} style={buttonSecondaryStyle} disabled={loading}>
                &larr; Volver
              </button>
              <button type="button" onClick={handleFinalSubmit} style={loading ? disabledButtonStyle : finishButtonStyle} disabled={loading}>
                {loading ? 'Guardando expediente clínico...' : 'Finalizar y Crear Código QR'}
              </button>
            </div>
          </div>
        )}
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
  maxWidth: '820px',
  margin: '0 auto',
  paddingBottom: '40px',
}

const wizardHeaderStyle = {
  textAlign: 'center',
  marginBottom: '40px',
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
  marginTop: '6px',
}

const stepperContainerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: '32px',
  position: 'relative',
  padding: '0 16px',
}

const stepWrapperStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '8px',
  zIndex: 2,
  width: '70px',
}

const stepIconStyle = {
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '13px',
  fontWeight: '700',
  transition: theme.transitions.default,
}

const activeStepIconStyle = {
  ...stepIconStyle,
  backgroundColor: theme.colors.primary,
  color: '#FFFFFF',
  boxShadow: '0 0 0 4px #FEE2E2',
}

const completedStepIconStyle = {
  ...stepIconStyle,
  backgroundColor: theme.colors.success,
  color: '#FFFFFF',
}

const pendingStepIconStyle = {
  ...stepIconStyle,
  backgroundColor: '#E2E8F0',
  color: theme.colors.textLight,
}

const stepLabelStyle = {
  fontSize: '11px',
  fontWeight: '600',
  color: theme.colors.textLight,
  textAlign: 'center',
}

const activeStepLabelStyle = {
  ...stepLabelStyle,
  color: theme.colors.primary,
  fontWeight: '700',
}

const progressBarBgStyle = {
  position: 'absolute',
  top: '16px',
  left: '48px',
  right: '48px',
  height: '4px',
  backgroundColor: '#E2E8F0',
  zIndex: 1,
}

const progressBarFillStyle = {
  height: '100%',
  backgroundColor: theme.colors.primary,
  transition: theme.transitions.default,
}

const cardStyle = {
  backgroundColor: theme.colors.bgPrimary,
  border: `1px solid ${theme.colors.border}`,
  borderRadius: theme.borderRadius.lg,
  padding: '36px',
  boxShadow: theme.shadows.card,
}

const stepTitleStyle = {
  fontSize: '18px',
  fontWeight: '700',
  color: theme.colors.textDark,
  borderBottom: `2px solid ${theme.colors.border}`,
  paddingBottom: '12px',
  marginBottom: '24px',
}

const formGridStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '20px',
}

const formFlexStyle = {
  display: 'flex',
  flexDirection: 'column',
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
  outline: 'none',
  fontFamily: theme.fonts.main,
  color: theme.colors.textDark,
  transition: theme.transitions.fast,
  boxShadow: theme.shadows.input,
}

const selectStyle = {
  ...inputStyle,
  cursor: 'pointer',
}

const checkboxWrapperStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '12px 16px',
  backgroundColor: theme.colors.bgSecondary,
  border: `1px solid ${theme.colors.border}`,
  borderRadius: theme.borderRadius.md,
}

const checkboxStyle = {
  width: '18px',
  height: '18px',
  cursor: 'pointer',
  accentColor: theme.colors.primary,
}

const textareaStyle = {
  ...inputStyle,
  minHeight: '100px',
  resize: 'vertical',
}

const builderBoxStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '16px',
  padding: '20px',
  backgroundColor: theme.colors.bgSecondary,
  border: `1px solid ${theme.colors.border}`,
  borderRadius: theme.borderRadius.md,
  marginBottom: '24px',
}

const addButtonStyle = {
  gridColumn: 'span 2',
  backgroundColor: theme.colors.textDark,
  color: '#FFFFFF',
  border: 'none',
  padding: '12px',
  borderRadius: theme.borderRadius.md,
  fontSize: '13px',
  fontWeight: '600',
  cursor: 'pointer',
  transition: theme.transitions.fast,
  marginTop: '8px',
}

const listTitleStyle = {
  fontSize: '14px',
  fontWeight: '700',
  color: theme.colors.textDark,
  marginBottom: '12px',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
}

const emptyStateStyle = {
  padding: '24px',
  textAlign: 'center',
  backgroundColor: theme.colors.bgSecondary,
  border: `1px dashed ${theme.colors.border}`,
  borderRadius: theme.borderRadius.md,
  color: theme.colors.textLight,
  fontSize: '13px',
  fontWeight: '500',
  marginBottom: '32px',
}

const gridListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  marginBottom: '32px',
}

const badgeStyle = (severity) => {
  const isSevere = severity === 'severa' || severity === 'anafilaxia'
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px',
    backgroundColor: isSevere ? theme.colors.dangerLight : theme.colors.warningLight,
    border: `1px solid ${isSevere ? theme.colors.primaryBorder : '#FEF3C7'}`,
    borderRadius: theme.borderRadius.md,
  }
}

const conditionCardStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '16px',
  backgroundColor: theme.colors.bgSecondary,
  border: `1px solid ${theme.colors.border}`,
  borderRadius: theme.borderRadius.md,
}

const medCardStyle = {
  ...conditionCardStyle,
  alignItems: 'flex-start',
  backgroundColor: '#F8FAFC',
  border: '1px solid #CBD5E1',
  boxShadow: '0 8px 18px rgba(15, 23, 42, 0.04)',
}

const medCardContentStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  minWidth: 0,
}

const medHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  flexWrap: 'wrap',
}

const medTitleStyle = {
  fontSize: '15px',
  fontWeight: '800',
  color: theme.colors.textDark,
}

const medCategoryStyle = {
  fontSize: '10px',
  fontWeight: '800',
  color: '#0369A1',
  backgroundColor: '#E0F2FE',
  border: '1px solid #BAE6FD',
  borderRadius: '4px',
  padding: '3px 7px',
  textTransform: 'uppercase',
}

const medCommercialStyle = {
  fontSize: '12px',
  fontWeight: '600',
  color: theme.colors.textMedium,
}

const medMetaRowStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
}

const medMetaChipStyle = {
  fontSize: '11.5px',
  fontWeight: '700',
  color: '#334155',
  backgroundColor: '#FFFFFF',
  border: '1px solid #E2E8F0',
  borderRadius: '6px',
  padding: '5px 8px',
}

const medNoteStyle = {
  fontSize: '12px',
  color: theme.colors.textMedium,
  marginTop: '2px',
  fontWeight: '500',
  lineHeight: '1.35',
}

const badgeTitleStyle = {
  fontSize: '15px',
  fontWeight: '700',
  color: theme.colors.textDark,
}

const badgeCatStyle = {
  fontSize: '11px',
  fontWeight: '600',
  color: theme.colors.textLight,
  marginLeft: '10px',
  backgroundColor: 'rgba(15, 23, 42, 0.04)',
  padding: '2px 8px',
  borderRadius: '4px',
  textTransform: 'uppercase',
}

const badgeSubStyle = {
  fontSize: '12.5px',
  color: theme.colors.textMedium,
  marginTop: '4px',
  fontWeight: '500',
}

const badgeSeverityStyle = (severity) => {
  const isSevere = severity === 'severa' || severity === 'anafilaxia'
  return {
    fontSize: '10px',
    fontWeight: '700',
    padding: '2px 8px',
    borderRadius: '4px',
    backgroundColor: isSevere ? theme.colors.primary : theme.colors.warning,
    color: '#FFFFFF',
  }
}

const statusBadgeStyle = (status) => ({
  fontSize: '10px',
  fontWeight: '700',
  padding: '2px 8px',
  borderRadius: '4px',
  backgroundColor: status === 'activa' ? theme.colors.primary : theme.colors.success,
  color: '#FFFFFF',
})

const removeBadgeStyle = {
  background: 'transparent',
  border: 'none',
  fontSize: '20px',
  color: theme.colors.textLight,
  cursor: 'pointer',
  padding: '0 4px',
  fontWeight: '300',
  lineHeight: '1',
}

const contactoBoxStyle = {
  padding: '20px',
  backgroundColor: theme.colors.bgSecondary,
  border: `1px solid ${theme.colors.border}`,
  borderRadius: theme.borderRadius.md,
}

const contactoHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '16px',
}

const contactoPriorityStyle = {
  fontSize: '12px',
  fontWeight: '700',
  color: theme.colors.primary,
  backgroundColor: theme.colors.primaryLight,
  padding: '4px 10px',
  borderRadius: theme.borderRadius.sm,
}

const removeContactoBtnStyle = {
  background: 'transparent',
  border: 'none',
  color: theme.colors.primary,
  fontSize: '12px',
  fontWeight: '600',
  cursor: 'pointer',
}

const contactoFieldsStyle = {
  display: 'grid',
  gridTemplateColumns: '1.5fr 1fr 1fr',
  gap: '16px',
}

const addContactoBtnStyle = {
  backgroundColor: 'transparent',
  color: theme.colors.textMedium,
  border: `1px dashed ${theme.colors.border}`,
  padding: '14px',
  borderRadius: theme.borderRadius.md,
  fontSize: '13px',
  fontWeight: '600',
  cursor: 'pointer',
  transition: theme.transitions.fast,
  marginTop: '16px',
  width: '100%',
  textAlign: 'center',
}

const buttonRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  marginTop: '36px',
  borderTop: `1px solid ${theme.colors.border}`,
  paddingTop: '24px',
}

const buttonPrimaryStyle = {
  backgroundColor: theme.colors.primary,
  color: '#FFFFFF',
  border: 'none',
  padding: '12px 28px',
  borderRadius: theme.borderRadius.md,
  fontSize: '14px',
  fontWeight: '600',
  cursor: 'pointer',
  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.15)',
  transition: theme.transitions.default,
}

const finishButtonStyle = {
  ...buttonPrimaryStyle,
  backgroundColor: theme.colors.success,
  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)',
}

const buttonSecondaryStyle = {
  backgroundColor: theme.colors.bgTertiary,
  color: theme.colors.textMedium,
  border: 'none',
  padding: '12px 28px',
  borderRadius: theme.borderRadius.md,
  fontSize: '14px',
  fontWeight: '600',
  cursor: 'pointer',
  transition: theme.transitions.default,
}

const disabledButtonStyle = {
  ...finishButtonStyle,
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
  fontSize: '13.5px',
  fontWeight: '500',
  marginBottom: '24px',
}
