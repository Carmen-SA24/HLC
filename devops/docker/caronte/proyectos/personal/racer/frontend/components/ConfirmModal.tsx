'use client';

import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  title,
  message,
  confirmLabel = 'Eliminar',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
        animation: 'fadeIn 0.15s ease',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        style={{
          background: '#0d1321',
          border: '1px solid rgba(148,163,184,0.12)',
          borderRadius: '16px',
          padding: '32px 28px 24px',
          width: '100%',
          maxWidth: '420px',
          boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
          animation: 'slideUp 0.2s ease',
        }}
      >
        {/* Icono */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: 'rgba(248,113,113,0.10)',
              border: '1px solid rgba(248,113,113,0.20)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f87171',
            }}
          >
            <AlertTriangle size={24} strokeWidth={1.8} />
          </div>
        </div>

        {/* Texto */}
        <h3 style={{ color: '#f1f5f9', fontSize: '18px', fontWeight: 700, textAlign: 'center', margin: '0 0 10px' }}>
          {title}
        </h3>
        <p style={{ color: 'rgba(148,163,184,0.75)', fontSize: '14px', textAlign: 'center', margin: '0 0 28px', lineHeight: 1.55 }}>
          {message}
        </p>

        {/* Botones */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '12px',
              border: '1px solid rgba(148,163,184,0.15)',
              borderRadius: '10px',
              background: 'transparent',
              color: 'rgba(226,232,240,0.65)',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#e2e8f0'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(226,232,240,0.65)'; }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #b91c1c 0%, #ef4444 100%)',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
