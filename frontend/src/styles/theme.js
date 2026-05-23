// MediRecord CSS-in-JS Design System & Theme
// Universidad Nacional Mayor de San Marcos (UNMSM)

export const theme = {
  colors: {
    // Fichas y fondo principal
    bgPrimary: '#FFFFFF',
    bgSecondary: '#F8FAFC',
    bgTertiary: '#F1F5F9',
    
    // Identidad Médica y Emergencia
    primary: '#DC2626',      // Carmesí de emergencias (Vibrante)
    primaryHover: '#B91C1C', // Carmesí oscuro
    primaryLight: '#FEF2F2', // Fondo rosa-rojo tenue para alertas
    primaryBorder: '#FEE2E2',
    
    // Paleta de apoyo SQA / Neutrales
    textDark: '#0F172A',    // Carbón profundo para legibilidad
    textMedium: '#475569',  // Gris de lectura secundaria
    textLight: '#94A3B8',   // Gris suave para subtítulos o placeholders
    
    // Estados clínicos
    success: '#10B981',     // Verde éxito (estable, donante)
    successLight: '#ECFDF5',
    warning: '#F59E0B',     // Amarillo precaución (alergia leve, controlada)
    warningLight: '#FEF3C7',
    danger: '#EF4444',      // Rojo peligro (anafilaxia, severo, marcapasos)
    dangerLight: '#FEF2F2',
    
    // Bordes
    border: '#E2E8F0',
    borderFocus: '#DC2626',
  },
  
  fonts: {
    main: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  },
  
  shadows: {
    card: '0 8px 30px rgba(15, 23, 42, 0.04)',
    cardHover: '0 12px 40px rgba(220, 38, 38, 0.06)',
    dialog: '0 20px 50px rgba(15, 23, 42, 0.12)',
    input: '0 2px 8px rgba(15, 23, 42, 0.02)',
  },
  
  transitions: {
    default: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    fast: 'all 0.15s ease',
  },
  
  borderRadius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    full: '9999px',
  }
};

// Estilos comunes inyectables
export const commonStyles = {
  card: {
    background: theme.colors.bgPrimary,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.borderRadius.lg,
    padding: '24px',
    boxShadow: theme.shadows.card,
    transition: theme.transitions.default,
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.borderRadius.md,
    fontFamily: theme.fonts.main,
    fontSize: '15px',
    color: theme.colors.textDark,
    outline: 'none',
    boxShadow: theme.shadows.input,
    transition: theme.transitions.fast,
  },
  btnPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px 24px',
    background: theme.colors.primary,
    color: '#FFFFFF',
    border: 'none',
    borderRadius: theme.borderRadius.md,
    fontFamily: theme.fonts.main,
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(220, 38, 38, 0.2)',
    transition: theme.transitions.default,
  },
  btnSecondary: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px 24px',
    background: theme.colors.bgTertiary,
    color: theme.colors.textMedium,
    border: 'none',
    borderRadius: theme.borderRadius.md,
    fontFamily: theme.fonts.main,
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: theme.transitions.default,
  },
  flexCenter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }
};
