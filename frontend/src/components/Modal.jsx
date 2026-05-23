import { useEffect } from 'react'
import { theme } from '../styles/theme'

export default function Modal({ isOpen, onClose, title, children }) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleEscape)
    }
    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div style={overlayStyle} onClick={handleOverlayClick}>
      <div style={modalCardStyle} className="animate-fade-in">
        {/* Modal Header */}
        <div style={headerStyle}>
          <h3 style={titleStyle}>{title}</h3>
          <button style={closeButtonStyle} onClick={onClose}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div style={contentStyle}>
          {children}
        </div>
      </div>
    </div>
  )
}

const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(15, 23, 42, 0.4)',
  backdropFilter: 'blur(4px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '20px',
}

const modalCardStyle = {
  backgroundColor: theme.colors.bgPrimary,
  border: `1px solid ${theme.colors.border}`,
  borderRadius: theme.borderRadius.lg,
  width: '100%',
  maxWidth: '520px',
  boxShadow: theme.shadows.dialog,
  display: 'flex',
  flexDirection: 'column',
  maxHeight: 'calc(100vh - 40px)',
}

const headerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '20px 24px',
  borderBottom: `1px solid ${theme.colors.border}`,
}

const titleStyle = {
  fontSize: '18px',
  fontWeight: '700',
  color: theme.colors.textDark,
}

const closeButtonStyle = {
  background: 'transparent',
  border: 'none',
  color: theme.colors.textLight,
  cursor: 'pointer',
  padding: '4px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: theme.transitions.fast,
}

const contentStyle = {
  padding: '24px',
  overflowY: 'auto',
  maxHeight: 'calc(100vh - 120px)',
}
