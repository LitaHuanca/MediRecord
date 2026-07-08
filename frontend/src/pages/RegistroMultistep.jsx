import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { theme } from '../styles/theme'

/* ─── Fallback catalogs ────────────────────────────────────────────── */
const SEED_ALERGIAS = [
  { id: '1',  nombre: 'Penicilina',        categoria: 'medicamento' },
  { id: '2',  nombre: 'Amoxicilina',       categoria: 'medicamento' },
  { id: '3',  nombre: 'Ibuprofeno',        categoria: 'medicamento' },
  { id: '4',  nombre: 'Aspirina',          categoria: 'medicamento' },
  { id: '5',  nombre: 'Látex',            categoria: 'contacto'    },
  { id: '6',  nombre: 'Frutos secos',     categoria: 'alimento'    },
  { id: '7',  nombre: 'Mariscos',         categoria: 'alimento'    },
  { id: '8',  nombre: 'Polen',            categoria: 'ambiental'   },
  { id: '9',  nombre: 'Picadura de abeja', categoria: 'ambiental'  },
  { id: '10', nombre: 'Lactosa',          categoria: 'alimento'    },
]
const SEED_CONDICIONES = [
  { id: '1', nombre: 'Diabetes tipo 1',            categoria: 'endocrina'      },
  { id: '2', nombre: 'Diabetes tipo 2',            categoria: 'endocrina'      },
  { id: '3', nombre: 'Hipertensión arterial',      categoria: 'cardiovascular' },
  { id: '4', nombre: 'Marcapasos implantado',      categoria: 'cardiovascular' },
  { id: '5', nombre: 'Epilepsia',                  categoria: 'neurologica'    },
  { id: '6', nombre: 'Asma',                      categoria: 'respiratoria'   },
  { id: '7', nombre: 'Insuficiencia renal crónica',categoria: 'renal'          },
  { id: '8', nombre: 'Hemofilia A',               categoria: 'cardiovascular' },
  { id: '9', nombre: 'Hipotiroidismo',             categoria: 'endocrina'      },
]

const isValidUuid = (v) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)

/* ─── Opciones para selectores ─────────────────────────────────────── */
const BLOOD_TYPES = [
  { value:'A+',          label:'A+',   desc:'A Positivo' },
  { value:'A-',          label:'A-',   desc:'A Negativo' },
  { value:'B+',          label:'B+',   desc:'B Positivo' },
  { value:'B-',          label:'B-',   desc:'B Negativo' },
  { value:'AB+',         label:'AB+',  desc:'AB Positivo' },
  { value:'AB-',         label:'AB-',  desc:'AB Negativo' },
  { value:'O+',          label:'O+',   desc:'O Positivo — donante universal de glóbulos' },
  { value:'O-',          label:'O-',   desc:'O Negativo — donante universal total' },
  { value:'desconocido', label:'?',    desc:'Desconocido' },
]
const SEXOS = [
  { value:'masculino',         label:'Masculino',         desc:'Sexo biológico masculino' },
  { value:'femenino',          label:'Femenino',          desc:'Sexo biológico femenino'  },
  { value:'intersexual',       label:'Intersexual',       desc:'Variación biológica'      },
  { value:'otro',              label:'Otro',              desc:'Otra condición biológica' },
  { value:'prefiero_no_decir', label:'Prefiero no decir', desc:''                         },
]
const SEVERIDADES = [
  { value:'leve',       label:'Leve',       desc:'Reacción cutánea o picazón leve'               },
  { value:'moderada',   label:'Moderada',   desc:'Urticaria extendida, molestia importante'       },
  { value:'severa',     label:'Severa',     desc:'Broncoespasmo, hinchazón facial'               },
  { value:'anafilaxia', label:'Anafilaxia', desc:'Peligro de muerte inminente — prioridad máxima' },
]
const ESTADOS_COND = [
  { value:'activa',      label:'Activa',      desc:'Bajo monitoreo médico constante' },
  { value:'controlada',  label:'Controlada',  desc:'Manejada con fármacos o terapia' },
  { value:'en_remision', label:'En Remisión', desc:'Sin síntomas activos actualmente' },
]
const RELACIONES = [
  { value:'familiar',        label:'Familiar',         desc:'Padre, madre, hijo/a, hermano/a' },
  { value:'conyugue',        label:'Cónyuge / Pareja', desc:'Esposo/a o pareja de vida'       },
  { value:'amigo',           label:'Amigo',            desc:'Persona de plena confianza'      },
  { value:'medico_personal', label:'Médico Personal',  desc:'Médico de cabecera o tratante'   },
  { value:'otro',            label:'Otro',             desc:''                                },
]
/* Categorías para nuevos items en el catálogo */
const CAT_ALERGIAS = [
  { value:'Medicamento', label:'Medicamento', desc:'Fármacos y principios activos' },
  { value:'Alimento',    label:'Alimento',    desc:'Alimentos y bebidas'           },
  { value:'Ambiental',   label:'Ambiental',   desc:'Polen, ácaros, hongos, etc.'  },
  { value:'Material',    label:'Material',    desc:'Látex, metales, plásticos'    },
  { value:'Otro',        label:'Otro',        desc:''                             },
]
const CAT_CONDICIONES = [
  { value:'Cardiovascular', label:'Cardiovascular', desc:'Corazón y vasos sanguíneos'   },
  { value:'Metabólica',     label:'Metabólica',     desc:'Diabetes, obesidad, lípidos'  },
  { value:'Respiratoria',   label:'Respiratoria',   desc:'Asma, EPOC, fibrosis'        },
  { value:'Neurológica',    label:'Neurológica',    desc:'Epilepsia, ACV, Parkinson'   },
  { value:'Endocrina',      label:'Endocrina',      desc:'Tiroides, suprarrenales'     },
  { value:'Autoinmune',     label:'Autoinmune',     desc:'Lupus, AR, psoriasis'        },
  { value:'Otra',           label:'Otra',           desc:''                            },
]
const CAT_MEDICAMENTOS = [
  { value:'Analgésico',        label:'Analgésico',        desc:'Paracetamol, metamizol'        },
  { value:'Antibiótico',       label:'Antibiótico',       desc:'Amoxicilina, ciprofloxacino'   },
  { value:'Antidiabético',     label:'Antidiabético',     desc:'Metformina, insulinas'         },
  { value:'Antihipertensivo',  label:'Antihipertensivo',  desc:'Losartán, amlodipino'          },
  { value:'Broncodilatador',   label:'Broncodilatador',   desc:'Salbutamol, formoterol'        },
  { value:'Hormona tiroidea',  label:'Hormona tiroidea',  desc:'Levotiroxina'                  },
  { value:'Protector gástrico',label:'Protector gástrico',desc:'Omeprazol, pantoprazol'        },
  { value:'Estatina',          label:'Estatina',          desc:'Atorvastatina, rosuvastatina'  },
  { value:'Anticoagulante',    label:'Anticoagulante',    desc:'Warfarina, rivaroxabán'        },
  { value:'Otro',              label:'Otro',              desc:''                              },
]

const FRECUENCIAS = [
  { value:'cada_6h',         label:'Cada 6 horas',    desc:'4 tomas al día'            },
  { value:'cada_8h',         label:'Cada 8 horas',    desc:'3 tomas al día'            },
  { value:'cada_12h',        label:'Cada 12 horas',   desc:'2 tomas al día'            },
  { value:'cada_24h',        label:'Cada 24 horas',   desc:'1 vez al día'              },
  { value:'segun_necesidad', label:'Según necesidad', desc:'Solo cuando sea requerido' },
  { value:'personalizado',   label:'Personalizado…',  desc:'Escribir frecuencia propia' },
]

const STEP_LABELS = ['Datos Vitales', 'Alergias', 'Condiciones', 'Fármacos', 'Contactos']
const STEP_TITLES = [
  'Paso 1 · Datos Vitales y Filiación',
  'Paso 2 · Alergias Medicamentosas y Alimentarias',
  'Paso 3 · Condiciones Médicas Crónicas',
  'Paso 4 · Medicamentos de Uso Crónico',
  'Paso 5 · Contactos de Emergencia',
]

/* Ícono SVG de cada paso (renderizado dentro del círculo del stepper) */
const STEP_ICONS = [
  <svg key="p1" viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  <svg key="p2" viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  <svg key="p3" viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 8v8M8 12h8"/></svg>,
  <svg key="p4" viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/></svg>,
  <svg key="p5" viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92v2z"/></svg>,
]

/* ─── useTypewriter ────────────────────────────────────────────────── */
function useTypewriter(text, speed = 45) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone]           = useState(false)
  useEffect(() => {
    setDisplayed(''); setDone(false)
    let i = 0
    const id = setInterval(() => {
      i++; setDisplayed(text.slice(0, i))
      if (i >= text.length) { clearInterval(id); setDone(true) }
    }, speed)
    return () => clearInterval(id)
  }, [text, speed])
  return { displayed, done }
}

/* ─── Iconos utilitarios ───────────────────────────────────────────── */
const Ic = {
  blood:    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke={theme.colors.primary} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>,
  gender:   <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke={theme.colors.primary} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M12 12v9M9 18h6"/></svg>,
  calendar: <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke={theme.colors.textLight} strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  weight:   <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke={theme.colors.textLight} strokeWidth="2" strokeLinecap="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>,
  height:   <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke={theme.colors.textLight} strokeWidth="2" strokeLinecap="round"><line x1="12" y1="2" x2="12" y2="22"/><polyline points="17 7 12 2 7 7"/><polyline points="7 17 12 22 17 17"/></svg>,
  check:    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#10B981" strokeWidth="2.8"><polyline points="20 6 9 17 4 12"/></svg>,
  error:    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#EF4444" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  alert:    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" style={{flexShrink:0}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  noAllergy:<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  noMed:    <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 6.5 9c0 3.09 3 6 5.5 8.5L14 20l.5.5"/><path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/></svg>,
  noCond:   <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 8v8M8 12h8"/></svg>,
  drag:     (
    <svg viewBox="0 0 10 16" width="10" height="16" fill="#94A3B8">
      <circle cx="3" cy="2"  r="1.5"/><circle cx="7" cy="2"  r="1.5"/>
      <circle cx="3" cy="8"  r="1.5"/><circle cx="7" cy="8"  r="1.5"/>
      <circle cx="3" cy="14" r="1.5"/><circle cx="7" cy="14" r="1.5"/>
    </svg>
  ),
  clock:    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke={theme.colors.primary} strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  person:   <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke={theme.colors.primary} strokeWidth="2.2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  relation: <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke={theme.colors.primary} strokeWidth="2.2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  search:   <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke={theme.colors.primary} strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  severity: <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke={theme.colors.primary} strokeWidth="2.2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>,
  clockSm:  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke={theme.colors.primary} strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
}

/* ─── CustomSelect ─────────────────────────────────────────────────── */
function CustomSelect({ options, value, onChange, disabled, icon, placeholder }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h)
  }, [])

  const NONE = ['desconocido', 'prefiero_no_decir', '']
  const isValid  = value && !NONE.includes(value)
  const selected = options.find(o => o.value === value)

  return (
    <div ref={ref} style={{ position:'relative' }}>
      <button type="button" disabled={disabled} onClick={() => setOpen(o => !o)} style={cssBtnStyle(open, isValid)}>
        {icon && <span style={{ color:theme.colors.primary, display:'flex', flexShrink:0 }}>{icon}</span>}
        <span style={{ flex:1, textAlign:'left', fontSize:'13.5px',
          color:selected?theme.colors.textDark:theme.colors.textLight,
          fontWeight:selected?'500':'400' }}>
          {selected ? selected.label : (placeholder || '— Seleccionar —')}
        </span>
        {selected?.desc && (
          <span style={{ fontSize:'11px', color:theme.colors.textLight, marginRight:'4px',
            maxWidth:'140px', overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>
            {selected.desc}
          </span>
        )}
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke={theme.colors.textLight} strokeWidth="2.5"
          style={{ transform:open?'rotate(180deg)':'rotate(0)', transition:'transform 0.18s ease', flexShrink:0 }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && (
        <div style={dropStyle}>
          {options.map(opt => (
            <button key={opt.value} type="button"
              onClick={() => { onChange(opt.value); setOpen(false) }}
              style={optStyle(opt.value === value)}
              onMouseEnter={e => { if (opt.value!==value) e.currentTarget.style.backgroundColor=theme.colors.primaryLight }}
              onMouseLeave={e => { if (opt.value!==value) e.currentTarget.style.backgroundColor='transparent' }}>
              <div style={{ flex:1, textAlign:'left' }}>
                <div style={{ fontSize:'13px', fontWeight:'600', color:opt.value===value?theme.colors.primary:theme.colors.textDark }}>{opt.label}</div>
                {opt.desc && <div style={{ fontSize:'11px', color:theme.colors.textLight }}>{opt.desc}</div>}
              </div>
              {opt.value===value && <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke={theme.colors.primary} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── CatalogSelect: búsqueda con filtro para catálogos grandes ────── */
function CatalogSelect({ items, value, onChange, placeholder, onRequestAdd, labelKey='nombre', subtitleKey='categoria' }) {
  const [open, setOpen]     = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef(null)
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h)
  }, [])

  const filtered = items.filter(item =>
    item[labelKey]?.toLowerCase().includes(search.toLowerCase()) ||
    item[subtitleKey]?.toLowerCase().includes(search.toLowerCase())
  )
  const selected = items.find(i => i.id === value)
  const showAddBtn = search.trim().length > 0 && filtered.length === 0 && !!onRequestAdd

  return (
    <div ref={ref} style={{ position:'relative' }}>
      <button type="button" onClick={() => { setOpen(o => !o); setSearch('') }}
        style={cssBtnStyle(open, !!selected)}>
        <span style={{ color:theme.colors.primary, display:'flex', flexShrink:0 }}>{Ic.search}</span>
        <span style={{ flex:1, textAlign:'left', fontSize:'13.5px',
          color:selected?theme.colors.textDark:theme.colors.textLight,
          fontWeight:selected?'500':'400' }}>
          {selected ? selected[labelKey] : (placeholder || '— Buscar del catálogo —')}
        </span>
        {selected && selected[subtitleKey] && (
          <span style={{ fontSize:'10px', fontWeight:'700', color:'#0369A1',
            backgroundColor:'#E0F2FE', border:'1px solid #BAE6FD',
            borderRadius:'4px', padding:'1px 6px', textTransform:'uppercase', flexShrink:0 }}>
            {selected[subtitleKey]}
          </span>
        )}
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke={theme.colors.textLight} strokeWidth="2.5"
          style={{ transform:open?'rotate(180deg)':'rotate(0)', transition:'transform 0.18s ease', flexShrink:0 }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div style={{ ...dropStyle, maxHeight:'260px', overflow:'hidden', display:'flex', flexDirection:'column' }}>
          <div style={{ padding:'8px 8px 4px' }}>
            <input autoFocus type="text" placeholder="Buscar por nombre o categoría…"
              value={search} onChange={e => setSearch(e.target.value)}
              onClick={e => e.stopPropagation()}
              style={{ ...baseInput, fontSize:'12.5px', padding:'7px 10px' }}
              className="rms-input"/>
          </div>
          <div style={{ overflowY:'auto', flex:1 }}>
            {filtered.length === 0 && !showAddBtn && (
              <div style={{ padding:'14px', textAlign:'center', fontSize:'12.5px', color:theme.colors.textLight }}>
                {search ? `Sin resultados para "${search}"` : 'Escribe para buscar…'}
              </div>
            )}
            {showAddBtn && (
              <button type="button"
                onClick={() => { onRequestAdd(search.trim()); setOpen(false); setSearch('') }}
                className="cat-add-new-btn"
                style={{ display:'flex', alignItems:'center', gap:'9px', width:'100%', padding:'10px 13px',
                  border:'none', cursor:'pointer', backgroundColor:'transparent',
                  borderTop:`1px dashed ${theme.colors.border}`,
                  fontFamily:theme.fonts.main, boxSizing:'border-box', transition:'background-color 0.14s ease' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor='#FEF2F2'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor='transparent'}>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke={theme.colors.primary} strokeWidth="2.5" strokeLinecap="round" style={{flexShrink:0}}>
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
                <div style={{ textAlign:'left' }}>
                  <div style={{ fontSize:'13px', fontWeight:'700', color:theme.colors.primary }}>
                    Agregar al catálogo
                  </div>
                  <div style={{ fontSize:'11px', color:theme.colors.textLight }}>
                    "{search.trim()}" — completar datos en el formulario
                  </div>
                </div>
              </button>
            )}
            {filtered.map(item => (
              <button key={item.id} type="button"
                onClick={() => { onChange(item.id); setOpen(false); setSearch('') }}
                style={optStyle(item.id === value)}
                onMouseEnter={e => { if (item.id!==value) e.currentTarget.style.backgroundColor=theme.colors.primaryLight }}
                onMouseLeave={e => { if (item.id!==value) e.currentTarget.style.backgroundColor='transparent' }}>
                <div style={{ flex:1, textAlign:'left' }}>
                  <div style={{ fontSize:'13px', fontWeight:'600', color:item.id===value?theme.colors.primary:theme.colors.textDark }}>{item[labelKey]}</div>
                  {item[subtitleKey] && <div style={{ fontSize:'11px', color:theme.colors.textLight, textTransform:'capitalize' }}>{item[subtitleKey]}</div>}
                  {subtitleKey !== 'categoria' && item.categoria && (
                    <div style={{ fontSize:'10px', color:'#0369A1', fontWeight:'700', marginTop:'1px' }}>{item.categoria}</div>
                  )}
                </div>
                {item.id===value && <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke={theme.colors.primary} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── AddToCatalogForm: formulario inline para nuevos items ─────────── */
function AddToCatalogForm({ nombre: initNombre, categories, extraFields, onConfirm, onCancel, loading }) {
  const [nombre,   setNombre]   = useState(initNombre || '')
  const [categoria,setCat]      = useState(categories[0]?.value || '')
  const [extra,    setExtra]    = useState({})

  return (
    <div style={addCatFormStyle}>
      <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'14px' }}>
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke={theme.colors.primary} strokeWidth="2.5" strokeLinecap="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
        </svg>
        <span style={{ fontSize:'12px', fontWeight:'700', color:theme.colors.primary, textTransform:'uppercase', letterSpacing:'0.6px' }}>
          Agregar al catálogo
        </span>
      </div>

      <div style={grid2inner}>
        {/* Nombre principal */}
        <div style={{ display:'flex', flexDirection:'column', gap:'5px', gridColumn: extraFields?.length ? '1' : 'span 2' }}>
          <label style={labelStyle}>Nombre <span style={{ color:theme.colors.primary }}>*</span></label>
          <input type="text" value={nombre} onChange={e=>setNombre(e.target.value)}
            style={legacyInput} className="rms-input"
            placeholder="Nombre completo…"/>
        </div>

        {/* Campos extra (ej. nombre_comercial para meds) */}
        {extraFields?.map(f => (
          <div key={f.key} style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
            <label style={labelStyle}>{f.label} {f.required && <span style={{ color:theme.colors.primary }}>*</span>}{!f.required && <span style={{ color:theme.colors.textLight, fontWeight:'400' }}> (opcional)</span>}</label>
            <input type="text" value={extra[f.key]||''} onChange={e=>setExtra(x=>({...x,[f.key]:e.target.value}))}
              placeholder={f.placeholder||''} style={legacyInput} className="rms-input"/>
          </div>
        ))}

        {/* Categoría */}
        <div style={{ display:'flex', flexDirection:'column', gap:'5px', gridColumn:'span 2' }}>
          <label style={labelStyle}>Categoría <span style={{ color:theme.colors.primary }}>*</span></label>
          <CustomSelect
            options={categories}
            value={categoria}
            onChange={setCat}
            placeholder="— Seleccionar categoría —"/>
        </div>

        {/* Botones */}
        <div style={{ gridColumn:'span 2', display:'flex', gap:'10px', justifyContent:'flex-end' }}>
          <button type="button" onClick={onCancel} style={btnSecStyle} className="rms-btn-sec">Cancelar</button>
          <button type="button" disabled={!nombre.trim() || !categoria || loading}
            onClick={() => onConfirm({ nombre: nombre.trim(), categoria, ...extra })}
            style={!nombre.trim()||!categoria||loading ? btnDisStyle : {...btnPriStyle, padding:'9px 20px'}}
            className={!nombre.trim()||!categoria||loading ? '' : 'rms-btn-primary'}>
            {loading ? 'Guardando…' : 'Confirmar y agregar'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── VField ───────────────────────────────────────────────────────── */
function VField({ label, required, hint, error, touched, value, noIcon, children }) {
  const isValid = touched && !error && (value !== '' && value != null)
  const isError = touched && !!error
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
      <label style={labelStyle}>
        {label}
        {required && <span style={{ color:theme.colors.primary }}> *</span>}
        {hint && <span style={{ color:theme.colors.textLight, fontWeight:'400', marginLeft:'4px' }}>{hint}</span>}
      </label>
      <div style={{ position:'relative' }}>
        {children}
        {!noIcon && (isValid || isError) && (
          <span style={fieldIconStyle}>{isValid ? Ic.check : Ic.error}</span>
        )}
      </div>
      {isError && <span style={fieldErrStyle}>{error}</span>}
    </div>
  )
}

/* ─── StepTitle con typewriter ─────────────────────────────────────── */
function StepTitle({ stepIndex, icon }) {
  const { displayed, done } = useTypewriter(STEP_TITLES[stepIndex], 38)
  return (
    <div style={stepTitleContainerStyle}>
      <span style={stepTitleIconBoxStyle}>{icon}</span>
      <h3 style={stepTitleTextStyle}>
        {displayed}{!done && <span className="rms-cursor">|</span>}
      </h3>
    </div>
  )
}

/* ─── Stepper con íconos ───────────────────────────────────────────── */
function Stepper({ current }) {
  return (
    <div style={stepperWrapStyle}>
      {STEP_LABELS.map((label, i) => {
        const s = i + 1; const done = s < current; const active = s === current
        return (
          <div key={i} style={stepItemStyle}>
            {i > 0 && <div style={connectorStyle(done || active)} />}
            <div style={stepCircleStyle(done, active)}>
              {done
                ? <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                : <span style={{ color: active ? '#fff' : theme.colors.textLight, display:'flex' }}>{STEP_ICONS[i]}</span>
              }
            </div>
            <span style={stepLblStyle(done, active)}>{label}</span>
          </div>
        )
      })}
    </div>
  )
}

/* ─── validateStep1 ────────────────────────────────────────────────── */
function validateStep1(d) {
  const e = {}
  if (!d.nombreCompleto.trim()) e.nombreCompleto = 'El nombre completo es requerido.'
  if (!d.dni.trim())            e.dni = 'El número de documento es requerido.'
  if (d.telefono && (d.telefono.length !== 9 || !d.telefono.startsWith('9')))
    e.telefono = 'Debe tener 9 dígitos y comenzar con 9.'
  if (!d.fechaNacimiento) e.fechaNacimiento = 'La fecha de nacimiento es requerida.'
  else if (new Date(d.fechaNacimiento) >= new Date()) e.fechaNacimiento = 'Debe ser anterior al día de hoy.'
  if (d.pesoKg   && (parseFloat(d.pesoKg) <= 0   || parseFloat(d.pesoKg) > 300))  e.pesoKg   = 'Peso válido: 1 – 300 kg.'
  if (d.alturaCm && (parseInt(d.alturaCm) < 50    || parseInt(d.alturaCm) > 250))  e.alturaCm = 'Altura válida: 50 – 250 cm.'
  return e
}

/* ─── validateContact ──────────────────────────────────────────────── */
function validateContact(c) {
  const e = {}
  if (c.nombre && /\d/.test(c.nombre)) e.nombre = 'El nombre no debe contener números.'
  if (c.telefono && (c.telefono.length !== 9 || !c.telefono.startsWith('9')))
    e.telefono = 'Debe tener 9 dígitos y comenzar con 9.'
  return e
}

/* ─── EmptyState ───────────────────────────────────────────────────── */
function EmptyState({ icon, title, desc }) {
  return (
    <div style={emptyCardStyle}>
      <div style={{ display:'flex', justifyContent:'center', marginBottom:'12px' }}>{icon}</div>
      <h4 style={emptyTitleStyle}>{title}</h4>
      <p style={emptyDescStyle}>{desc}</p>
      <div style={emptyTagStyle}>
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#10B981" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        Sin registros — puede continuar al siguiente paso
      </div>
    </div>
  )
}

/* ─── AddButton ────────────────────────────────────────────────────── */
function AddButton({ onClick, label }) {
  return (
    <button type="button" onClick={onClick} className="rms-add-btn"
      style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
        backgroundColor:'transparent', color:theme.colors.primary,
        border:`1.5px solid ${theme.colors.primaryBorder}`,
        padding:'10px 18px', borderRadius:theme.borderRadius.md,
        fontSize:'13px', fontWeight:'700', cursor:'pointer',
        gridColumn:'span 2', width:'100%', transition:'all 0.18s ease',
        fontFamily:theme.fonts.main }}>
      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
      </svg>
      {label}
    </button>
  )
}

/* ─── NavRow ───────────────────────────────────────────────────────── */
function NavRow({ onBack, onNext, nextLabel, nextDisabled, nextGreen }) {
  return (
    <div style={buttonRowStyle}>
      <button type="button" onClick={onBack} style={btnSecStyle} className="rms-btn-sec">← Volver</button>
      <button type="button" onClick={onNext} disabled={nextDisabled}
        style={nextDisabled ? btnDisStyle : btnPriStyle}
        className={nextDisabled ? '' : nextGreen ? 'rms-btn-finish' : 'rms-btn-continue'}>
        {nextLabel}
      </button>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
══════════════════════════════════════════════════════════════════════ */
export default function RegistroMultistep() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep]   = useState(1)
  const [loading, setLoading]           = useState(false)
  const [fetchingData, setFetchingData] = useState(true)
  const [errorMessage, setErrorMessage] = useState(null)

  const [catalogoAlergias,     setCatalogoAlergias]     = useState([])
  const [catalogoCondiciones,  setCatalogoCondiciones]  = useState([])
  const [catalogoMedicamentos, setCatalogoMedicamentos] = useState([])

  /* Paso 1 */
  const [gen, setGenRaw] = useState({
    nombreCompleto:'', dni:'', telefono:'',
    tipoSangre:'desconocido', sexo:'prefiero_no_decir',
    fechaNacimiento:'', donanteOrganos:false,
    pesoKg:'', alturaCm:'', notasAdicionales:'',
  })
  const [t1, setT1] = useState({})

  /* Paso 2 */
  const [userAlergias,  setUserAlergias]  = useState([])
  const [selAlergiaId,  setSelAlergiaId]  = useState('')
  const [sevAlergia,    setSevAlergia]    = useState('leve')
  const [reacAlergia,   setReacAlergia]   = useState('')
  const [addingAlergia, setAddingAlergia] = useState(null) // null | nombre string

  /* Paso 3 */
  const [userCondiciones, setUserCondiciones] = useState([])
  const [selCondId,       setSelCondId]       = useState('')
  const [estadoCond,      setEstadoCond]      = useState('activa')
  const [tratCond,        setTratCond]        = useState('')
  const [addingCond,      setAddingCond]      = useState(null)

  /* Paso 4 */
  const [userMeds, setUserMeds]           = useState([])
  const [selMedId,     setSelMedId]       = useState('')
  const [medDosis,     setMedDosis]       = useState('')
  const [medFrecSel,   setMedFrecSel]     = useState('')
  const [medFrecCustom,setMedFrecCustom]  = useState('')
  const [medNotas,     setMedNotas]       = useState('')
  const [addingMed,    setAddingMed]      = useState(null)
  const [addingCatLoading, setAddingCatLoading] = useState(false)

  /* Paso 5 */
  const [userContactos, setUserContactos] = useState([
    { nombre:'', telefono:'', relacion:'familiar', ordenPrioridad:1 },
    { nombre:'', telefono:'', relacion:'familiar', ordenPrioridad:2 },
  ])
  const [touchedC,    setTouchedC]    = useState({})
  const [dragIdx,     setDragIdx]     = useState(null)
  const [dragOverIdx, setDragOverIdx] = useState(null)

  const mainTitle = useTypewriter('Ficha Vital de Emergencia', 52)

  /* ── Carga inicial ── */
  useEffect(() => {
    async function load() {
      try {
        const [cats, ficha] = await Promise.all([api.getCatalogs(), api.getFicha()])
        setCatalogoAlergias(cats.alergias?.length     ? cats.alergias    : SEED_ALERGIAS)
        setCatalogoCondiciones(cats.condiciones?.length ? cats.condiciones : SEED_CONDICIONES)
        setCatalogoMedicamentos(cats.medicamentos || [])

        const pre = {
          nombreCompleto:  ficha.nombre_completo  || '',
          dni:             ficha.numero_documento  || '',
          telefono:        ficha.telefono          || '',
          tipoSangre:      ficha.tipo_sangre       || 'desconocido',
          sexo:            ficha.sexo              || 'prefiero_no_decir',
          fechaNacimiento: ficha.fecha_nacimiento  || '',
          donanteOrganos:  ficha.donante_organos   || false,
          pesoKg:          ficha.peso_kg   != null ? String(ficha.peso_kg)   : '',
          alturaCm:        ficha.altura_cm != null ? String(ficha.altura_cm) : '',
          notasAdicionales:ficha.notas_adicionales || '',
        }
        setGenRaw(pre)
        const at = {}
        if (pre.nombreCompleto)  at.nombreCompleto  = true
        if (pre.dni)             at.dni             = true
        if (pre.telefono)        at.telefono        = true
        if (pre.fechaNacimiento) at.fechaNacimiento = true
        if (pre.pesoKg)          at.pesoKg          = true
        if (pre.alturaCm)        at.alturaCm        = true
        setT1(at)

        if (ficha.alergias?.length)
          setUserAlergias(ficha.alergias.map(a=>({ alergiaId:a.alergia_id, severidad:a.severidad, reaccion:a.reaccion })))
        if (ficha.condiciones?.length)
          setUserCondiciones(ficha.condiciones.map(c=>({ condicionId:c.condicion_id, estado:c.estado, tratamiento:c.tratamiento })))
        if (ficha.medicamentos?.length)
          setUserMeds(ficha.medicamentos.map(m=>({ nombre:m.nombre, dosis:m.dosis, frecuencia:m.frecuencia, notas:m.notas })))
        if (ficha.contactos?.length)
          setUserContactos(ficha.contactos.map(c=>({ nombre:c.nombre, telefono:c.telefono, relacion:c.relacion, ordenPrioridad:c.orden_prioridad })))
      } catch (err) {
        setErrorMessage(err.message || 'Error al cargar datos clínicos.')
        setCatalogoAlergias(SEED_ALERGIAS); setCatalogoCondiciones(SEED_CONDICIONES)
      } finally { setFetchingData(false) }
    }
    load()
  }, [])

  /* ── Paso 1 ── */
  const errors1   = validateStep1(gen)
  const step1Done = !errors1.nombreCompleto && !errors1.dni && !errors1.fechaNacimiento
                    && !errors1.pesoKg && !errors1.alturaCm && !errors1.telefono

  const setGen = (field) => (val) => { setGenRaw(d=>({...d,[field]:val})); setT1(t=>({...t,[field]:true})) }
  const blur1  = (f) => () => setT1(t=>({...t,[f]:true}))

  const iStyle = (field) => {
    const v = t1[field] && !errors1[field] && gen[field]
    const e = t1[field] && !!errors1[field]
    return {
      ...baseInput,
      borderColor: v ? '#10B981' : e ? '#EF4444' : theme.colors.border,
      boxShadow:   v ? '0 0 0 3px rgba(16,185,129,0.08)' : e ? '0 0 0 3px rgba(239,68,68,0.08)' : theme.shadows.input,
      paddingRight: (v||e) ? '36px' : '14px',
    }
  }

  const handleStep1 = (e) => {
    e.preventDefault()
    const all = ['nombreCompleto','dni','telefono','fechaNacimiento','pesoKg','alturaCm']
    setT1(all.reduce((a,f)=>({...a,[f]:true}),{}))
    const errs = validateStep1(gen)
    if (errs.nombreCompleto||errs.dni||errs.fechaNacimiento||errs.pesoKg||errs.alturaCm||errs.telefono) {
      setErrorMessage('Corrige los campos marcados en rojo.'); return
    }
    setErrorMessage(null); setCurrentStep(2)
  }

  /* ── Paso 2 ── */
  const addAlergia = () => {
    if (!selAlergiaId) { setErrorMessage('Seleccione una alergia del catálogo.'); return }
    if (!isValidUuid(selAlergiaId)) { setErrorMessage('ID de alergia inválido.'); return }
    if (userAlergias.some(a=>a.alergiaId===selAlergiaId)) { setErrorMessage('Esta alergia ya fue agregada.'); return }
    setUserAlergias([...userAlergias, { alergiaId:selAlergiaId, severidad:sevAlergia, reaccion:reacAlergia }])
    setSelAlergiaId(''); setSevAlergia('leve'); setReacAlergia(''); setErrorMessage(null)
  }
  const confirmAddAlergia = async ({ nombre, categoria }) => {
    setAddingCatLoading(true)
    try {
      const nueva = await api.addAlergiasCatalog({ nombre, categoria })
      const item  = { id: nueva.id, nombre: nueva.nombre, categoria: nueva.categoria, descripcion: null }
      setCatalogoAlergias(prev => [...prev, item].sort((a,b)=>a.nombre.localeCompare(b.nombre)))
      setSelAlergiaId(nueva.id)
      setAddingAlergia(null); setErrorMessage(null)
    } catch(err) {
      setErrorMessage(err.message || 'Error al agregar al catálogo.')
    } finally { setAddingCatLoading(false) }
  }

  /* ── Paso 3 ── */
  const addCondicion = () => {
    if (!selCondId) { setErrorMessage('Seleccione una condición del catálogo.'); return }
    if (!isValidUuid(selCondId)) { setErrorMessage('ID de condición inválido.'); return }
    if (userCondiciones.some(c=>c.condicionId===selCondId)) { setErrorMessage('Esta condición ya fue agregada.'); return }
    setUserCondiciones([...userCondiciones, { condicionId:selCondId, estado:estadoCond, tratamiento:tratCond }])
    setSelCondId(''); setEstadoCond('activa'); setTratCond(''); setErrorMessage(null)
  }
  const confirmAddCond = async ({ nombre, categoria }) => {
    setAddingCatLoading(true)
    try {
      const nueva = await api.addCondicionCatalog({ nombre, categoria })
      const item  = { id: nueva.id, nombre: nueva.nombre, categoria: nueva.categoria, descripcion: null }
      setCatalogoCondiciones(prev => [...prev, item].sort((a,b)=>a.nombre.localeCompare(b.nombre)))
      setSelCondId(nueva.id)
      setAddingCond(null); setErrorMessage(null)
    } catch(err) {
      setErrorMessage(err.message || 'Error al agregar al catálogo.')
    } finally { setAddingCatLoading(false) }
  }

  /* ── Paso 4 ── */
  const frecuenciaFinal = medFrecSel === 'personalizado'
    ? medFrecCustom
    : FRECUENCIAS.find(f=>f.value===medFrecSel)?.label || ''

  const addMed = () => {
    const med = catalogoMedicamentos.find(m=>m.id===selMedId)
    if (!med) { setErrorMessage('Seleccione un medicamento del catálogo.'); return }
    if (userMeds.some(m=>m.medId===selMedId)) { setErrorMessage('Este medicamento ya fue agregado.'); return }
    setUserMeds([...userMeds, {
      medId:          med.id,
      nombre:         med.nombre_generico,
      nombreComercial:med.nombre_comercial || '',
      categoria:      med.categoria || '',
      dosis:          medDosis.trim() || 'No especificada',
      frecuencia:     frecuenciaFinal || 'No especificada',
      notas:          medNotas.trim(),
    }])
    setSelMedId(''); setMedDosis(''); setMedFrecSel(''); setMedFrecCustom(''); setMedNotas('')
    setErrorMessage(null)
  }
  const confirmAddMed = async ({ nombre, categoria, nombre_comercial }) => {
    setAddingCatLoading(true)
    try {
      const nueva = await api.addMedCatalog({ nombre_generico: nombre, nombre_comercial: nombre_comercial||null, categoria })
      const item  = { id: nueva.id, nombre_generico: nueva.nombre_generico, nombre_comercial: nueva.nombre_comercial, categoria: nueva.categoria }
      setCatalogoMedicamentos(prev => [...prev, item].sort((a,b)=>a.nombre_generico.localeCompare(b.nombre_generico)))
      setSelMedId(nueva.id)
      setAddingMed(null); setErrorMessage(null)
    } catch(err) {
      setErrorMessage(err.message || 'Error al agregar al catálogo.')
    } finally { setAddingCatLoading(false) }
  }

  /* ── Paso 5 ── */
  const setContacto = (i, f, v) => { const n=[...userContactos]; n[i][f]=v; setUserContactos(n) }
  const touchC = (i, f) => setTouchedC(t=>({...t,[`${i}_${f}`]:true}))
  const addContacto = () => {
    if (userContactos.length >= 5) return
    setUserContactos([...userContactos, { nombre:'', telefono:'', relacion:'familiar', ordenPrioridad:userContactos.length+1 }])
  }
  const removeContacto = (i) => {
    if (userContactos.length <= 1) return
    setUserContactos(userContactos.filter((_,idx)=>idx!==i).map((c,idx)=>({...c,ordenPrioridad:idx+1})))
  }

  const handleDragStart = (e, i) => { setDragIdx(i); e.dataTransfer.effectAllowed='move' }
  const handleDragOver  = (e, i) => { e.preventDefault(); setDragOverIdx(i) }
  const handleDrop      = (e, i) => {
    e.preventDefault()
    if (dragIdx===null||dragIdx===i) { setDragIdx(null); setDragOverIdx(null); return }
    const nc = [...userContactos]
    const [moved] = nc.splice(dragIdx, 1)
    nc.splice(i, 0, moved)
    setUserContactos(nc.map((c,idx)=>({...c,ordenPrioridad:idx+1})))
    setDragIdx(null); setDragOverIdx(null)
  }
  const handleDragEnd = () => { setDragIdx(null); setDragOverIdx(null) }

  /* ── Submit ── */
  const handleSubmit = async () => {
    setLoading(true); setErrorMessage(null)
    try {
      await api.upsertFicha({
        telefono:          gen.telefono||null,
        tipo_sangre:       gen.tipoSangre!=='desconocido'     ?gen.tipoSangre:null,
        sexo:              gen.sexo!=='prefiero_no_decir'     ?gen.sexo:null,
        fecha_nacimiento:  gen.fechaNacimiento||null,
        donante_organos:   gen.donanteOrganos,
        peso_kg:           gen.pesoKg  ?parseFloat(gen.pesoKg) :null,
        altura_cm:         gen.alturaCm?parseInt(gen.alturaCm) :null,
        notas_adicionales: gen.notasAdicionales.trim()||null,
        alergias:    userAlergias.map(a=>({ alergia_id:a.alergiaId, severidad:a.severidad, reaccion:a.reaccion||null })),
        condiciones: userCondiciones.map(c=>({ condicion_id:c.condicionId, estado:c.estado, tratamiento:c.tratamiento||null })),
        medicamentos:userMeds.map(m=>({ nombre:m.nombre, dosis:m.dosis||null, frecuencia:m.frecuencia||null, notas:m.notas||null })),
        contactos:   userContactos.filter(c=>c.nombre.trim()&&c.telefono.trim())
                       .map((c,i)=>({ nombre:c.nombre.trim(), telefono:c.telefono.trim(), relacion:c.relacion, orden_prioridad:i+1 })),
      })
      navigate('/dashboard')
    } catch(err) {
      setErrorMessage(err.message||'Error al guardar los datos clínicos.')
    } finally { setLoading(false) }
  }

  /* ── Loading ── */
  if (fetchingData) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'60vh' }}>
      <div style={{ width:'44px', height:'44px', border:`4px solid ${theme.colors.border}`, borderTop:`4px solid ${theme.colors.primary}`, borderRadius:'50%', animation:'spin 0.9s linear infinite' }} />
      <p style={{ color:theme.colors.textMedium, marginTop:'16px', fontWeight:'500' }}>Cargando expediente clínico…</p>
    </div>
  )

  /* ══ RENDER ══ */
  return (
    <>
      <style>{css}</style>
      <div style={pageStyle} className="rms-fade">

        {/* HEADER */}
        <div style={{ textAlign:'center', marginBottom:'28px' }}>
          <div style={titleBoxStyle}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" style={{flexShrink:0}}>
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
            <span style={titleBoxText}>{mainTitle.displayed}<span className="rms-cursor">|</span></span>
          </div>
          <p style={{ fontSize:'13.5px', color:theme.colors.textMedium, fontWeight:'500', margin:'0 0 22px' }}>
            Complete todos los campos para generar su QR vital de la Hora Dorada
          </p>
          <Stepper current={currentStep} />
        </div>

        {errorMessage && (
          <div style={errBannerStyle}>{Ic.alert}{errorMessage}</div>
        )}

        <div style={cardStyle}>

          {/* ══ PASO 1 ══ */}
          {currentStep === 1 && (
            <form onSubmit={handleStep1} noValidate>
              <StepTitle stepIndex={0} icon={Ic.person}/>
              <div style={grid2}>
                <VField label="Nombre Completo" required error={errors1.nombreCompleto} touched={t1.nombreCompleto} value={gen.nombreCompleto}>
                  <input value={gen.nombreCompleto} onChange={e=>setGen('nombreCompleto')(e.target.value)} onBlur={blur1('nombreCompleto')}
                    placeholder="ej. Juan Carlos Pérez Alva" style={iStyle('nombreCompleto')} className="rms-input"/>
                </VField>

                <VField label="Número de Documento" required error={errors1.dni} touched={t1.dni} value={gen.dni}>
                  <input value={gen.dni} onChange={e=>setGen('dni')(e.target.value.replace(/\D/g,'').slice(0,12))} onBlur={blur1('dni')}
                    placeholder="ej. 12345678" style={iStyle('dni')} className="rms-input"/>
                </VField>

                <VField label="Celular" hint="(opcional)" error={errors1.telefono} touched={t1.telefono} value={gen.telefono}>
                  <input value={gen.telefono} onChange={e=>setGen('telefono')(e.target.value.replace(/\D/g,'').slice(0,9))} onBlur={blur1('telefono')}
                    placeholder="ej. 987654321" style={iStyle('telefono')} className="rms-input"/>
                </VField>

                <VField label="Fecha de Nacimiento" required error={errors1.fechaNacimiento} touched={t1.fechaNacimiento} value={gen.fechaNacimiento}>
                  <div style={{ position:'relative' }}>
                    <input type="date" value={gen.fechaNacimiento}
                      onChange={e=>setGen('fechaNacimiento')(e.target.value)} onBlur={blur1('fechaNacimiento')}
                      max={new Date().toISOString().split('T')[0]}
                      style={{ ...iStyle('fechaNacimiento'), paddingLeft:'36px' }} className="rms-input"/>
                    <span style={iconLeft}>{Ic.calendar}</span>
                    {t1.fechaNacimiento && (
                      <span style={fieldIconStyle}>
                        {!errors1.fechaNacimiento && gen.fechaNacimiento ? Ic.check : errors1.fechaNacimiento ? Ic.error : null}
                      </span>
                    )}
                  </div>
                </VField>

                <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
                  <label style={labelStyle}>Tipo de Sangre <span style={{ color:theme.colors.textLight, fontWeight:'400' }}>(opcional)</span></label>
                  <CustomSelect options={BLOOD_TYPES} value={gen.tipoSangre} onChange={v=>setGenRaw(d=>({...d,tipoSangre:v}))} icon={Ic.blood}/>
                  {gen.tipoSangre !== 'desconocido' && <span style={miniGreenLabel}>{Ic.check} {gen.tipoSangre}</span>}
                </div>

                <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
                  <label style={labelStyle}>Sexo Biológico <span style={{ color:theme.colors.textLight, fontWeight:'400' }}>(opcional)</span></label>
                  <CustomSelect options={SEXOS} value={gen.sexo} onChange={v=>setGenRaw(d=>({...d,sexo:v}))} icon={Ic.gender}/>
                  {gen.sexo !== 'prefiero_no_decir' && <span style={miniGreenLabel}>{Ic.check} Seleccionado</span>}
                </div>

                <VField label="Peso" hint="(opcional)" error={errors1.pesoKg} touched={t1.pesoKg} value={gen.pesoKg} noIcon>
                  <div style={{ position:'relative' }}>
                    <input type="number" step="0.1" min="1" max="300"
                      value={gen.pesoKg} onChange={e=>setGen('pesoKg')(e.target.value)} onBlur={blur1('pesoKg')}
                      placeholder="ej. 72.5" style={{ ...iStyle('pesoKg'), paddingLeft:'36px', paddingRight:'40px' }} className="rms-input"/>
                    <span style={iconLeft}>{Ic.weight}</span>
                    <span style={unitBadge}>kg</span>
                  </div>
                </VField>

                <VField label="Altura" hint="(opcional)" error={errors1.alturaCm} touched={t1.alturaCm} value={gen.alturaCm} noIcon>
                  <div style={{ position:'relative' }}>
                    <input type="number" min="50" max="250"
                      value={gen.alturaCm} onChange={e=>setGen('alturaCm')(e.target.value)} onBlur={blur1('alturaCm')}
                      placeholder="ej. 175" style={{ ...iStyle('alturaCm'), paddingLeft:'36px', paddingRight:'40px' }} className="rms-input"/>
                    <span style={iconLeft}>{Ic.height}</span>
                    <span style={unitBadge}>cm</span>
                  </div>
                </VField>

                <div style={{ gridColumn:'span 2' }}>
                  <div style={checkWrap}>
                    <input type="checkbox" id="donante" checked={gen.donanteOrganos}
                      onChange={e=>setGenRaw(d=>({...d,donanteOrganos:e.target.checked}))} style={cbStyle}/>
                    <label htmlFor="donante" style={{ fontSize:'13px', fontWeight:'600', color:theme.colors.textMedium, cursor:'pointer', margin:0 }}>
                      Soy Donante de Órganos y Tejidos
                    </label>
                    {gen.donanteOrganos && <span style={{ marginLeft:'auto', ...miniGreenLabel }}>{Ic.check} Registrado</span>}
                  </div>
                </div>

                <div style={{ gridColumn:'span 2', display:'flex', flexDirection:'column', gap:'5px' }}>
                  <label style={labelStyle}>Notas Clínicas Críticas <span style={{ color:theme.colors.textLight, fontWeight:'400' }}>(opcional)</span></label>
                  <textarea
                    placeholder="ej. Marcapasos implantado en ventrículo izquierdo (2024).&#10;ej. Alérgico severo al contraste iodado para tomografías."
                    maxLength="2000" value={gen.notasAdicionales}
                    onChange={e=>setGenRaw(d=>({...d,notasAdicionales:e.target.value}))}
                    style={textareaStyle} className="rms-input"/>
                  <span style={{ fontSize:'11px', color:theme.colors.textLight, textAlign:'right' }}>{gen.notasAdicionales.length}/2000</span>
                </div>

                <div style={{ gridColumn:'span 2', display:'flex', justifyContent:'flex-end', borderTop:`1px solid ${theme.colors.border}`, paddingTop:'20px', marginTop:'6px' }}>
                  <button type="submit" style={btnPriStyle} className={step1Done ? 'rms-btn-ready' : 'rms-btn-primary'}>
                    Continuar a Alergias →
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* ══ PASO 2: Alergias ══ */}
          {currentStep === 2 && (
            <div>
              <StepTitle stepIndex={1} icon={
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke={theme.colors.primary} strokeWidth="2.2" strokeLinecap="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              }/>

              <div style={builderBox}>
                <SectionLabel text="Agregar alergia"/>
                <div style={grid2inner}>
                  <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
                    <label style={labelStyle}>Alergia del catálogo</label>
                    <CatalogSelect items={catalogoAlergias} value={selAlergiaId} onChange={setSelAlergiaId}
                      placeholder="— Buscar alergia —"
                      onRequestAdd={(nombre) => { setAddingAlergia(nombre); setSelAlergiaId('') }}/>
                  </div>

                  <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
                    <label style={labelStyle}>Severidad clínica</label>
                    <CustomSelect options={SEVERIDADES} value={sevAlergia} onChange={setSevAlergia} icon={Ic.severity}/>
                  </div>

                  {addingAlergia !== null && (
                    <div style={{ gridColumn:'span 2' }}>
                      <AddToCatalogForm
                        nombre={addingAlergia} categories={CAT_ALERGIAS}
                        onConfirm={confirmAddAlergia} onCancel={()=>setAddingAlergia(null)}
                        loading={addingCatLoading}/>
                    </div>
                  )}

                  <div style={{ gridColumn:'span 2', display:'flex', flexDirection:'column', gap:'5px' }}>
                    <label style={labelStyle}>Reacción clínica observada</label>
                    <input type="text" placeholder="ej. Urticaria severa, shock anafiláctico con cianosis"
                      value={reacAlergia} onChange={e=>setReacAlergia(e.target.value)}
                      style={legacyInput} className="rms-input"/>
                  </div>

                  <AddButton onClick={addAlergia} label="Agregar alergia a la lista"/>
                </div>
              </div>

              <ListHeader count={userAlergias.length} label="alergias registradas"/>
              {userAlergias.length === 0
                ? <EmptyState icon={Ic.noAllergy} title="Sin alergias registradas"
                    desc="Si no tiene alergias conocidas o aún no las recuerda, puede continuar al siguiente paso."/>
                : <div style={listStyle}>
                    {userAlergias.map((item,idx) => {
                      const d = catalogoAlergias.find(a=>a.id===item.alergiaId)||{nombre:'Alergia',categoria:'otra'}
                      const sev = item.severidad==='severa'||item.severidad==='anafilaxia'
                      return (
                        <div key={idx} style={alergiaCard(sev)}>
                          <div style={{ display:'flex', alignItems:'center', gap:'10px', flexWrap:'wrap' }}>
                            <span style={severityDot(item.severidad)}/>
                            <strong style={itemTitle}>{d.nombre}</strong>
                            <span style={catChip}>{d.categoria}</span>
                            <span style={severityBadge(item.severidad)}>{item.severidad.toUpperCase()}</span>
                          </div>
                          {item.reaccion && <p style={itemSub}>Reacción: {item.reaccion}</p>}
                          <button type="button" onClick={()=>setUserAlergias(userAlergias.filter(a=>a.alergiaId!==item.alergiaId))} style={removeBtn}>×</button>
                        </div>
                      )
                    })}
                  </div>
              }
              <NavRow onBack={()=>setCurrentStep(1)} onNext={()=>{setErrorMessage(null);setCurrentStep(3)}} nextLabel="Continuar a Condiciones →"/>
            </div>
          )}

          {/* ══ PASO 3: Condiciones ══ */}
          {currentStep === 3 && (
            <div>
              <StepTitle stepIndex={2} icon={
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke={theme.colors.primary} strokeWidth="2.2" strokeLinecap="round">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 8v8M8 12h8"/>
                </svg>
              }/>

              <div style={builderBox}>
                <SectionLabel text="Agregar condición crónica"/>
                <div style={grid2inner}>
                  <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
                    <label style={labelStyle}>Condición del catálogo</label>
                    <CatalogSelect items={catalogoCondiciones} value={selCondId} onChange={setSelCondId}
                      placeholder="— Buscar condición —"
                      onRequestAdd={(nombre) => { setAddingCond(nombre); setSelCondId('') }}/>
                  </div>

                  <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
                    <label style={labelStyle}>Estado clínico actual</label>
                    <CustomSelect options={ESTADOS_COND} value={estadoCond} onChange={setEstadoCond}
                      icon={<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke={theme.colors.primary} strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
                    />
                  </div>

                  {addingCond !== null && (
                    <div style={{ gridColumn:'span 2' }}>
                      <AddToCatalogForm
                        nombre={addingCond} categories={CAT_CONDICIONES}
                        onConfirm={confirmAddCond} onCancel={()=>setAddingCond(null)}
                        loading={addingCatLoading}/>
                    </div>
                  )}

                  <div style={{ gridColumn:'span 2', display:'flex', flexDirection:'column', gap:'5px' }}>
                    <label style={labelStyle}>Tratamiento / Protocolo vigente</label>
                    <input type="text" placeholder="ej. Losartán 50 mg cada 12 h, dieta hiposódica"
                      value={tratCond} onChange={e=>setTratCond(e.target.value)} style={legacyInput} className="rms-input"/>
                  </div>

                  <AddButton onClick={addCondicion} label="Agregar condición a la lista"/>
                </div>
              </div>

              <ListHeader count={userCondiciones.length} label="condiciones registradas"/>
              {userCondiciones.length === 0
                ? <EmptyState icon={Ic.noCond} title="Sin condiciones crónicas registradas"
                    desc="Si no tiene condiciones médicas crónicas diagnosticadas, puede continuar al siguiente paso."/>
                : <div style={listStyle}>
                    {userCondiciones.map((item,idx) => {
                      const d = catalogoCondiciones.find(c=>c.id===item.condicionId)||{nombre:'Condición',categoria:'otra'}
                      return (
                        <div key={idx} style={condCard}>
                          <div>
                            <div style={{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap' }}>
                              <strong style={itemTitle}>{d.nombre}</strong>
                              <span style={catChip}>{d.categoria}</span>
                              <span style={estadoBadge(item.estado)}>{item.estado.replace('_',' ').toUpperCase()}</span>
                            </div>
                            {item.tratamiento && <p style={itemSub}>Tratamiento: {item.tratamiento}</p>}
                          </div>
                          <button type="button" onClick={()=>setUserCondiciones(userCondiciones.filter(c=>c.condicionId!==item.condicionId))} style={removeBtn}>×</button>
                        </div>
                      )
                    })}
                  </div>
              }
              <NavRow onBack={()=>setCurrentStep(2)} onNext={()=>{setErrorMessage(null);setCurrentStep(4)}} nextLabel="Continuar a Fármacos →"/>
            </div>
          )}

          {/* ══ PASO 4: Medicamentos ══ */}
          {currentStep === 4 && (
            <div>
              <StepTitle stepIndex={3} icon={
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke={theme.colors.primary} strokeWidth="2.2" strokeLinecap="round">
                  <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/>
                </svg>
              }/>

              <div style={builderBox}>
                <SectionLabel text="Agregar medicamento de uso crónico"/>
                <div style={grid2inner}>

                  <div style={{ gridColumn:'span 2', display:'flex', flexDirection:'column', gap:'5px' }}>
                    <label style={labelStyle}>Medicamento del catálogo</label>
                    <CatalogSelect
                      items={catalogoMedicamentos}
                      value={selMedId}
                      onChange={setSelMedId}
                      placeholder="— Buscar medicamento —"
                      labelKey="nombre_generico"
                      subtitleKey="nombre_comercial"
                      onRequestAdd={(nombre) => { setAddingMed(nombre); setSelMedId('') }}/>
                    {selMedId && (() => {
                      const m = catalogoMedicamentos.find(x=>x.id===selMedId)
                      return m ? (
                        <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', marginTop:'4px' }}>
                          {m.nombre_comercial && <span style={metaChip}>Comercial: {m.nombre_comercial}</span>}
                          {m.categoria && <span style={catChip}>{m.categoria}</span>}
                        </div>
                      ) : null
                    })()}
                  </div>

                  {addingMed !== null && (
                    <div style={{ gridColumn:'span 2' }}>
                      <AddToCatalogForm
                        nombre={addingMed}
                        categories={CAT_MEDICAMENTOS}
                        extraFields={[{ key:'nombre_comercial', label:'Nombre Comercial', placeholder:'ej. Glucophage, Insulatard', required:false }]}
                        onConfirm={confirmAddMed}
                        onCancel={()=>setAddingMed(null)}
                        loading={addingCatLoading}/>
                    </div>
                  )}

                  <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
                    <label style={labelStyle}>Dosis</label>
                    <input type="text" placeholder="ej. 850 mg, 10 UI, 0.5 mg"
                      value={medDosis} onChange={e=>setMedDosis(e.target.value)} style={legacyInput} className="rms-input"/>
                  </div>

                  <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
                    <label style={labelStyle}>Frecuencia</label>
                    <CustomSelect options={FRECUENCIAS} value={medFrecSel} onChange={setMedFrecSel}
                      icon={Ic.clock} placeholder="— Seleccionar frecuencia —"/>
                    {medFrecSel === 'personalizado' && (
                      <input autoFocus type="text" placeholder="ej. Cada 48 horas, solo lunes y jueves"
                        value={medFrecCustom} onChange={e=>setMedFrecCustom(e.target.value)}
                        style={{ ...legacyInput, marginTop:'6px' }} className="rms-input"/>
                    )}
                  </div>

                  <div style={{ gridColumn:'span 2', display:'flex', flexDirection:'column', gap:'5px' }}>
                    <label style={labelStyle}>Observaciones <span style={{ color:theme.colors.textLight, fontWeight:'400' }}>(opcional)</span></label>
                    <input type="text" placeholder="ej. No suspender bajo ninguna circunstancia"
                      value={medNotas} onChange={e=>setMedNotas(e.target.value)} style={legacyInput} className="rms-input"/>
                  </div>

                  <AddButton onClick={addMed} label="Agregar medicamento a la lista"/>
                </div>
              </div>

              <ListHeader count={userMeds.length} label="medicamentos registrados"/>
              {userMeds.length === 0
                ? <EmptyState icon={Ic.noMed} title="Sin medicamentos de uso crónico"
                    desc="Si no toma ningún medicamento de forma regular, puede continuar al siguiente paso."/>
                : <div style={listStyle}>
                    {userMeds.map((item,idx) => (
                      <div key={idx} style={medCard}>
                        <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap' }}>
                            <strong style={itemTitle}>{item.nombre}</strong>
                            {item.categoria && <span style={catChip}>{item.categoria}</span>}
                            {item.nombreComercial && <span style={{ fontSize:'11.5px', color:theme.colors.textMedium, fontWeight:'500' }}>· {item.nombreComercial}</span>}
                          </div>
                          <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                            <span style={metaChip}>Dosis: {item.dosis}</span>
                            <span style={metaChip}>Frecuencia: {item.frecuencia}</span>
                          </div>
                          {item.notas && <p style={itemSub}>{item.notas}</p>}
                        </div>
                        <button type="button" onClick={()=>setUserMeds(userMeds.filter((_,i)=>i!==idx))} style={removeBtn}>×</button>
                      </div>
                    ))}
                  </div>
              }
              <NavRow onBack={()=>setCurrentStep(3)} onNext={()=>{setErrorMessage(null);setCurrentStep(5)}} nextLabel="Continuar a Contactos →"/>
            </div>
          )}

          {/* ══ PASO 5: Contactos ══ */}
          {currentStep === 5 && (
            <div>
              <StepTitle stepIndex={4} icon={
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke={theme.colors.primary} strokeWidth="2.2" strokeLinecap="round">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92v2z"/>
                </svg>
              }/>

              <p style={{ fontSize:'13px', color:theme.colors.textMedium, marginBottom:'20px', lineHeight:'1.5' }}>
                Registre personas de confianza a quienes el paramédico podrá contactar directamente.{' '}
                <strong style={{ color:theme.colors.primary }}>Arrastre los recuadros</strong> para cambiar el orden de prioridad.
              </p>

              <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                {userContactos.map((c, i) => {
                  const cErrs    = validateContact(c)
                  const isDragging = dragIdx === i
                  const isDragOver = dragOverIdx === i && dragIdx !== i

                  return (
                    <div key={i}
                      draggable
                      onDragStart={e=>handleDragStart(e,i)}
                      onDragOver={e=>handleDragOver(e,i)}
                      onDrop={e=>handleDrop(e,i)}
                      onDragEnd={handleDragEnd}
                      style={{
                        ...contactoBox,
                        position:    'relative',
                        zIndex:      userContactos.length - i,
                        opacity:     isDragging  ? 0.45 : 1,
                        borderColor: isDragOver  ? theme.colors.primary : theme.colors.border,
                        boxShadow:   isDragOver  ? `0 0 0 2px ${theme.colors.primaryBorder}, ${theme.shadows.card}` : theme.shadows.card,
                        transform:   isDragOver  ? 'scale(1.01)' : 'scale(1)',
                        transition:  'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease, opacity 0.15s ease',
                      }}>

                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                          <div style={{ cursor:'grab', display:'flex', alignItems:'center', padding:'4px 6px',
                            backgroundColor:theme.colors.bgTertiary, borderRadius:'6px',
                            border:`1px solid ${theme.colors.border}` }}>
                            {Ic.drag}
                          </div>
                          <span style={priorBadge}>Prioridad {c.ordenPrioridad}</span>
                        </div>
                        {userContactos.length > 1 && (
                          <button type="button" onClick={()=>removeContacto(i)} style={removeLinkBtn}>Eliminar</button>
                        )}
                      </div>

                      <div style={contactoGrid}>
                        {/* Nombre */}
                        <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
                          <label style={labelStyle}>Nombre <span style={{ color:theme.colors.primary }}>*</span></label>
                          <div style={{ position:'relative' }}>
                            <input type="text" placeholder="ej. María Pérez" value={c.nombre}
                              onChange={e=>setContacto(i,'nombre',e.target.value.replace(/\d/g,''))}
                              onBlur={()=>touchC(i,'nombre')}
                              style={{ ...legacyInput,
                                borderColor: touchedC[`${i}_nombre`] && cErrs.nombre   ? '#EF4444'
                                           : touchedC[`${i}_nombre`] && c.nombre       ? '#10B981'
                                           : theme.colors.border,
                                paddingRight: touchedC[`${i}_nombre`] ? '34px' : '14px',
                              }} className="rms-input"/>
                            {touchedC[`${i}_nombre`] && (
                              <span style={fieldIconStyle}>{cErrs.nombre ? Ic.error : c.nombre ? Ic.check : null}</span>
                            )}
                          </div>
                          {touchedC[`${i}_nombre`] && cErrs.nombre && <span style={fieldErrStyle}>{cErrs.nombre}</span>}
                        </div>

                        {/* Teléfono */}
                        <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
                          <label style={labelStyle}>Teléfono <span style={{ color:theme.colors.primary }}>*</span></label>
                          <div style={{ position:'relative' }}>
                            <input type="tel" placeholder="ej. 987654321" value={c.telefono}
                              onChange={e=>setContacto(i,'telefono',e.target.value.replace(/\D/g,'').slice(0,9))}
                              onBlur={()=>touchC(i,'telefono')}
                              style={{ ...legacyInput,
                                borderColor: touchedC[`${i}_telefono`] && cErrs.telefono       ? '#EF4444'
                                           : touchedC[`${i}_telefono`] && c.telefono.length===9 ? '#10B981'
                                           : theme.colors.border,
                                paddingRight: touchedC[`${i}_telefono`] ? '34px' : '14px',
                              }} className="rms-input"/>
                            {touchedC[`${i}_telefono`] && (
                              <span style={fieldIconStyle}>{cErrs.telefono ? Ic.error : c.telefono.length===9 ? Ic.check : null}</span>
                            )}
                          </div>
                          {touchedC[`${i}_telefono`] && cErrs.telefono && <span style={fieldErrStyle}>{cErrs.telefono}</span>}
                        </div>

                        {/* Relación */}
                        <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
                          <label style={labelStyle}>Parentesco</label>
                          <CustomSelect options={RELACIONES} value={c.relacion}
                            onChange={v=>setContacto(i,'relacion',v)} icon={Ic.relation}/>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {userContactos.length < 5 && (
                <button type="button" onClick={addContacto} style={addDashedBtn} className="rms-add-dashed">
                  + Agregar otro contacto de emergencia
                </button>
              )}

              <NavRow onBack={()=>setCurrentStep(4)} onNext={handleSubmit}
                nextLabel={loading ? 'Guardando…' : 'Finalizar y Crear Código QR'}
                nextDisabled={loading} nextGreen/>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

/* ─── Sub-componentes pequeños ─────────────────────────────────────── */
function SectionLabel({ text }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'14px' }}>
      <div style={{ width:'3px', height:'14px', backgroundColor:theme.colors.primary, borderRadius:'2px' }}/>
      <span style={{ fontSize:'11.5px', fontWeight:'700', color:theme.colors.textMedium, textTransform:'uppercase', letterSpacing:'0.7px' }}>
        {text}
      </span>
    </div>
  )
}

function ListHeader({ count, label }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'10px' }}>
      <span style={{ fontSize:'12px', fontWeight:'800', color:theme.colors.textDark, textTransform:'uppercase', letterSpacing:'0.6px' }}>{label}</span>
      <span style={{ fontSize:'11px', fontWeight:'700', color:count>0?'#fff':theme.colors.textLight,
        backgroundColor:count>0?theme.colors.primary:theme.colors.bgTertiary,
        padding:'1px 7px', borderRadius:'9999px' }}>{count}</span>
    </div>
  )
}

/* ─── CSS global ───────────────────────────────────────────────────── */
const css = `
  @keyframes spin    { to { transform:rotate(360deg); } }
  @keyframes rmsFade { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
  @keyframes rmsBlink{ 0%,100%{opacity:1;}50%{opacity:0;} }

  .rms-fade   { animation: rmsFade 0.35s ease; }
  .rms-cursor { animation: rmsBlink 0.9s step-end infinite; font-weight:300; margin-left:1px; }
  .rms-input  { transition: border-color 0.17s ease, box-shadow 0.17s ease !important; }
  .rms-input:focus { outline:none !important; }

  /* Paso 1 submit */
  .rms-btn-primary { transition: all 0.2s cubic-bezier(0.4,0,0.2,1) !important; }
  .rms-btn-primary:hover:not(:disabled) { background-color:#B91C1C !important; box-shadow:0 6px 20px rgba(220,38,38,0.30) !important; transform:translateY(-1px); }
  .rms-btn-ready   { background-color:#DC2626 !important; transition:all 0.22s cubic-bezier(0.4,0,0.2,1) !important; }
  .rms-btn-ready:hover:not(:disabled) { background-color:#059669 !important; box-shadow:0 6px 22px rgba(5,150,105,0.28) !important; transform:translateY(-1px); }

  /* Continuar (pasos 2-4): siempre verde al hover */
  .rms-btn-continue { transition: all 0.2s cubic-bezier(0.4,0,0.2,1) !important; }
  .rms-btn-continue:hover:not(:disabled) { background-color:#059669 !important; box-shadow:0 6px 22px rgba(5,150,105,0.28) !important; transform:translateY(-1px); }
  .rms-btn-continue:active:not(:disabled) { transform:translateY(0); }

  /* Finalizar */
  .rms-btn-finish { background-color:#059669 !important; transition:all 0.2s ease !important; }
  .rms-btn-finish:hover:not(:disabled) { background-color:#047857 !important; box-shadow:0 6px 20px rgba(5,150,105,0.28) !important; transform:translateY(-1px); }

  /* Volver */
  .rms-btn-sec { transition:all 0.18s ease !important; }
  .rms-btn-sec:hover  { background-color:#E2E8F0 !important; transform:translateY(-1px); }
  .rms-btn-sec:active { transform:translateY(0) !important; }

  /* Agregar */
  .rms-add-btn { transition:all 0.18s ease !important; }
  .rms-add-btn:hover  { background-color:#FEF2F2 !important; border-color:#DC2626 !important; transform:translateY(-1px); }
  .cat-add-new-btn { transition:background-color 0.14s ease !important; }
  .cat-add-new-btn:hover  { background-color:#FEF2F2 !important; }
  .cat-add-new-btn:active { background-color:#FEE2E2 !important; }
  .rms-add-btn:active { transform:translateY(0) !important; }

  /* Agregar contacto dashed */
  .rms-add-dashed { transition:all 0.18s ease !important; }
  .rms-add-dashed:hover { border-color:#DC2626 !important; color:#DC2626 !important; background-color:#FEF2F2 !important; }
`

/* ─── Estilos ──────────────────────────────────────────────────────── */
const pageStyle = { maxWidth:'820px', margin:'0 auto', paddingBottom:'48px' }

const titleBoxStyle = { display:'inline-flex', alignItems:'center', gap:'10px', backgroundColor:theme.colors.primary, padding:'10px 24px', borderRadius:theme.borderRadius.md, marginBottom:'12px', boxShadow:'0 4px 16px rgba(220,38,38,0.22)' }
const titleBoxText  = { fontSize:'20px', fontWeight:'800', color:'#fff', letterSpacing:'-0.3px', minWidth:'240px', textAlign:'left' }

const stepperWrapStyle = { display:'flex', alignItems:'flex-start', justifyContent:'center' }
const stepItemStyle    = { display:'flex', flexDirection:'column', alignItems:'center', gap:'5px', flex:1, position:'relative' }
const connectorStyle   = (f) => ({ position:'absolute', top:'13px', right:'50%', left:'-50%', height:'2px', backgroundColor:f?theme.colors.primary:theme.colors.border, transition:'background-color 0.3s ease', zIndex:0 })
const stepCircleStyle  = (done, active) => ({ width:'26px', height:'26px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', backgroundColor:done?'#10B981':active?theme.colors.primary:theme.colors.bgTertiary, border:`2px solid ${done?'#10B981':active?theme.colors.primary:theme.colors.border}`, transition:'all 0.25s ease', position:'relative', zIndex:1, boxShadow:active&&!done?'0 0 0 4px rgba(220,38,38,0.12)':'none' })
const stepLblStyle     = (done, active) => ({ fontSize:'10px', fontWeight:done||active?'700':'500', color:done?'#059669':active?theme.colors.primary:theme.colors.textLight, textAlign:'center', whiteSpace:'nowrap', transition:'color 0.25s ease' })

const cardStyle = { backgroundColor:theme.colors.bgPrimary, border:`1px solid ${theme.colors.border}`, borderRadius:theme.borderRadius.lg, padding:'32px 36px', boxShadow:theme.shadows.card }

const stepTitleContainerStyle = { display:'flex', alignItems:'center', gap:'10px', borderBottom:`2px solid ${theme.colors.border}`, paddingBottom:'14px', marginBottom:'24px' }
const stepTitleIconBoxStyle   = { display:'flex', alignItems:'center', backgroundColor:theme.colors.primaryLight, padding:'6px', borderRadius:'8px', flexShrink:0 }
const stepTitleTextStyle      = { fontSize:'15px', fontWeight:'700', color:theme.colors.textDark, margin:0 }

const grid2      = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'18px' }
const grid2inner = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }

const labelStyle     = { fontSize:'12px', fontWeight:'600', color:theme.colors.textMedium }
const fieldIconStyle = { position:'absolute', right:'11px', top:'50%', transform:'translateY(-50%)', display:'flex', alignItems:'center', pointerEvents:'none' }
const fieldErrStyle  = { fontSize:'11px', color:'#EF4444', fontWeight:'500' }

const baseInput = { width:'100%', padding:'10px 14px', border:`1px solid ${theme.colors.border}`, borderRadius:theme.borderRadius.md, fontSize:'13.5px', color:theme.colors.textDark, outline:'none', boxShadow:theme.shadows.input, fontFamily:theme.fonts.main, boxSizing:'border-box', backgroundColor:theme.colors.bgPrimary }
const legacyInput   = { ...baseInput }
const textareaStyle = { ...baseInput, minHeight:'88px', resize:'vertical', paddingRight:'14px' }

const iconLeft  = { position:'absolute', left:'11px', top:'50%', transform:'translateY(-50%)', display:'flex', alignItems:'center', pointerEvents:'none' }
const unitBadge = { position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)', fontSize:'11px', fontWeight:'700', color:theme.colors.textLight, backgroundColor:theme.colors.bgTertiary, padding:'2px 6px', borderRadius:'4px', pointerEvents:'none' }
const miniGreenLabel = { fontSize:'11px', color:'#10B981', fontWeight:'600', display:'flex', alignItems:'center', gap:'4px' }

const checkWrap = { display:'flex', alignItems:'center', gap:'10px', padding:'12px 14px', backgroundColor:theme.colors.bgSecondary, border:`1px solid ${theme.colors.border}`, borderRadius:theme.borderRadius.md }
const cbStyle   = { width:'15px', height:'15px', cursor:'pointer', accentColor:theme.colors.primary, flexShrink:0 }

const builderBox    = { padding:'18px 20px', backgroundColor:theme.colors.bgSecondary, border:`1px solid ${theme.colors.border}`, borderRadius:theme.borderRadius.md, marginBottom:'20px' }
const addCatFormStyle = { padding:'14px 16px', backgroundColor:theme.colors.primaryLight, border:`1.5px dashed ${theme.colors.primaryBorder}`, borderRadius:theme.borderRadius.md, marginBottom:'4px' }

const emptyCardStyle  = { padding:'32px 24px', textAlign:'center', backgroundColor:theme.colors.bgSecondary, border:`1px dashed ${theme.colors.border}`, borderRadius:theme.borderRadius.md, marginBottom:'28px' }
const emptyTitleStyle = { fontSize:'14px', fontWeight:'700', color:theme.colors.textDark, margin:'0 0 6px' }
const emptyDescStyle  = { fontSize:'12.5px', color:theme.colors.textLight, fontWeight:'500', margin:'0 0 14px', lineHeight:'1.5' }
const emptyTagStyle   = { display:'inline-flex', alignItems:'center', gap:'6px', fontSize:'12px', fontWeight:'600', color:'#059669', backgroundColor:'#ECFDF5', border:'1px solid #A7F3D0', padding:'5px 12px', borderRadius:'999px' }

const listStyle = { display:'flex', flexDirection:'column', gap:'10px', marginBottom:'24px' }

const alergiaCard   = (s) => ({ position:'relative', padding:'14px 44px 14px 16px', backgroundColor:s?theme.colors.dangerLight:theme.colors.warningLight, border:`1px solid ${s?theme.colors.primaryBorder:'#FDE68A'}`, borderRadius:theme.borderRadius.md })
const condCard      = { position:'relative', display:'flex', alignItems:'flex-start', justifyContent:'space-between', padding:'14px 16px', backgroundColor:theme.colors.bgSecondary, border:`1px solid ${theme.colors.border}`, borderRadius:theme.borderRadius.md }
const medCard       = { ...condCard, backgroundColor:'#F8FAFC', border:'1px solid #CBD5E1' }

const itemTitle     = { fontSize:'13.5px', fontWeight:'700', color:theme.colors.textDark }
const itemSub       = { fontSize:'12px', color:theme.colors.textMedium, margin:'6px 0 0', lineHeight:'1.4' }
const catChip       = { fontSize:'10px', fontWeight:'800', color:'#0369A1', backgroundColor:'#E0F2FE', border:'1px solid #BAE6FD', borderRadius:'4px', padding:'2px 6px', textTransform:'uppercase' }
const metaChip      = { fontSize:'11px', fontWeight:'600', color:'#334155', backgroundColor:'#fff', border:'1px solid #E2E8F0', borderRadius:'6px', padding:'3px 8px' }

const severityDot   = (s) => ({ width:'8px', height:'8px', borderRadius:'50%', flexShrink:0, backgroundColor:s==='anafilaxia'?'#DC2626':s==='severa'?'#EF4444':s==='moderada'?'#F59E0B':'#10B981' })
const severityBadge = (s) => ({ fontSize:'10px', fontWeight:'700', padding:'2px 7px', borderRadius:'4px', backgroundColor:(s==='severa'||s==='anafilaxia')?theme.colors.primary:theme.colors.warning, color:'#fff' })
const estadoBadge   = (s) => ({ fontSize:'10px', fontWeight:'700', padding:'2px 7px', borderRadius:'4px', backgroundColor:s==='activa'?theme.colors.primary:s==='controlada'?'#059669':'#6366F1', color:'#fff' })
const removeBtn     = { position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', background:'transparent', border:'none', fontSize:'20px', color:theme.colors.textLight, cursor:'pointer', padding:'0 2px', fontWeight:'300', lineHeight:'1' }

const contactoBox   = { padding:'18px', backgroundColor:theme.colors.bgSecondary, border:`1px solid ${theme.colors.border}`, borderRadius:theme.borderRadius.md }
const contactoGrid  = { display:'grid', gridTemplateColumns:'1.5fr 1fr 1.2fr', gap:'12px' }
const priorBadge    = { fontSize:'12px', fontWeight:'700', color:theme.colors.primary, backgroundColor:theme.colors.primaryLight, padding:'3px 10px', borderRadius:theme.borderRadius.sm }
const removeLinkBtn = { background:'transparent', border:'none', color:theme.colors.primary, fontSize:'12px', fontWeight:'600', cursor:'pointer' }
const addDashedBtn  = { backgroundColor:'transparent', color:theme.colors.textMedium, border:`1px dashed ${theme.colors.border}`, padding:'13px', borderRadius:theme.borderRadius.md, fontSize:'13px', fontWeight:'600', cursor:'pointer', marginTop:'14px', width:'100%', fontFamily:theme.fonts.main }

const buttonRowStyle = { display:'flex', justifyContent:'space-between', marginTop:'28px', borderTop:`1px solid ${theme.colors.border}`, paddingTop:'20px' }
const btnPriStyle    = { backgroundColor:theme.colors.primary, color:'#fff', border:'none', padding:'11px 28px', borderRadius:theme.borderRadius.md, fontSize:'14px', fontWeight:'700', cursor:'pointer', boxShadow:'0 4px 12px rgba(220,38,38,0.15)', transition:theme.transitions.default, fontFamily:theme.fonts.main }
const btnSecStyle    = { backgroundColor:theme.colors.bgTertiary, color:theme.colors.textMedium, border:'none', padding:'11px 24px', borderRadius:theme.borderRadius.md, fontSize:'14px', fontWeight:'600', cursor:'pointer', transition:theme.transitions.default, fontFamily:theme.fonts.main }
const btnDisStyle    = { ...btnPriStyle, backgroundColor:theme.colors.textLight, cursor:'not-allowed', boxShadow:'none' }

const errBannerStyle = { display:'flex', alignItems:'center', gap:'10px', padding:'12px 16px', marginBottom:'20px', backgroundColor:theme.colors.dangerLight, border:`1px solid ${theme.colors.primaryBorder}`, borderRadius:theme.borderRadius.md, color:theme.colors.primary, fontSize:'13px', fontWeight:'500' }

/* CustomSelect / CatalogSelect shared styles */
const cssBtnStyle = (open, valid) => ({ display:'flex', alignItems:'center', gap:'7px', width:'100%', padding:'10px 11px', border:`1px solid ${open?theme.colors.primary:valid?'#10B981':theme.colors.border}`, borderRadius:theme.borderRadius.md, backgroundColor:theme.colors.bgPrimary, cursor:'pointer', boxShadow:open?'0 0 0 3px rgba(220,38,38,0.10)':valid?'0 0 0 3px rgba(16,185,129,0.08)':theme.shadows.input, transition:'all 0.17s ease', fontFamily:theme.fonts.main, boxSizing:'border-box' })
const dropStyle   = { position:'absolute', top:'calc(100% + 4px)', left:0, right:0, backgroundColor:theme.colors.bgPrimary, border:`1px solid ${theme.colors.border}`, borderRadius:theme.borderRadius.md, boxShadow:'0 8px 24px rgba(15,23,42,0.10)', zIndex:50, overflow:'hidden' }
const optStyle    = (sel) => ({ display:'flex', alignItems:'center', gap:'9px', width:'100%', padding:'9px 13px', border:'none', cursor:'pointer', backgroundColor:sel?theme.colors.primaryLight:'transparent', transition:'background-color 0.14s ease', fontFamily:theme.fonts.main, boxSizing:'border-box' })
