// ==================== COMPONENTE: InactivityWarning ====================
// Archivo: src/components/InactivityWarning.tsx
//
// PROPÓSITO:
//   Mostrar modal de advertencia cuando sesión está a punto de expirar
//   PARTE DE: FASE 1 - Sesión con Timeout por Inactividad
//
// FLUJO:
//   - A los 13 minutos sin actividad: este modal aparece
//   - Usuario tiene 2 minutos para reaccionar
//   - Puede clickear "Extender" (añade otros 15 minutos)
//   - O dejar que expire y se cierre sesión automáticamente

'use client';

import React, { useEffect, useState } from 'react';

// ==================== PROPS ====================
interface InactivityWarningProps {
  isVisible: boolean;            // ¿Mostrar el modal? (verdadero cuando faltan 2 min)
  secondsRemaining: number;      // Segundos hasta cierre (contador regresivo: 120, 119, 118...)
  onExtend: () => void;          // Callback cuando usuario clickea "Extender sesión"
  onLogout: () => void;          // Callback cuando usuario clickea "Cerrar sesión"
}

export default function InactivityWarning({
  isVisible,
  secondsRemaining,
  onExtend,
  onLogout,
}: InactivityWarningProps) {
  // ==================== ESTADO ====================
  // Guardar tiempo en formato MM:SS para display
  const [displayTime, setDisplayTime] = useState('02:00');  // Formato: "01:59", "01:00", etc

  // ==================== EFECTO: Formatear Tiempo ====================
  // ¿QUÉ HACE?
  //   - Convierte secondsRemaining (número) a formato MM:SS (string)
  //   - Se ejecuta cada vez que cambia secondsRemaining
  //
  // EJEMPLO:
  //   secondsRemaining = 125  →  displayTime = "02:05"
  //   secondsRemaining = 60   →  displayTime = "01:00"
  //   secondsRemaining = 5    →  displayTime = "00:05"
  //
  useEffect(() => {
    // Calcular minutos y segundos
    const minutes = Math.floor(secondsRemaining / 60);
    const seconds = secondsRemaining % 60;

    // Formatear con ceros a la izquierda (01:05, no 1:5)
    setDisplayTime(
      `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    );
  }, [secondsRemaining]);

  // ==================== VALIDACIÓN ====================
  // Si NO debe mostrarse → no renderizar nada (retornar null)
  if (!isVisible) return null;

  // ==================== RETORNO: MODAL ====================
  return (
    <div
      style={{
        // Posicionar como overlay que cubre toda la pantalla
        position: 'fixed',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',

        // Fondo: semi-transparente con desenfoque
        background: 'rgba(2, 6, 23, 0.72)',     // Oscuro al 72%
        backdropFilter: 'blur(4px)',          // Desenfocar lo que está atrás

        // Centrar el contenido
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',

        // Asegurarse de que está por encima de todo
        zIndex: 10000,
      }}
    >
      {/* CAJA DEL MODAL */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.98)',       // Fondo oscuro
          border: '1px solid rgba(255, 107, 107, 0.5)',
          borderRadius: '16px',
          padding: '32px',
          width: '100%',
          maxWidth: '400px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',  // Sombra profunda
          textAlign: 'center',
        }}
      >
        {/* ICONO GRANDE */}
        <div style={{
          width: '56px',
          height: '56px',
          margin: '0 auto 16px',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255, 107, 107, 0.12)',
          color: '#ff8a8a',
          fontSize: '14px',
          fontWeight: 700,
          letterSpacing: '1px',
        }}>
          TIME
        </div>

        {/* TÍTULO */}
        <h2 style={{
          color: '#ff6b6b',
          fontSize: '20px',
          margin: '0 0 16px',
          fontWeight: 'bold'
        }}>
          Sesión a punto de expirar
        </h2>

        {/* MENSAJE EXPLICATIVO */}
        <p style={{
          color: 'rgba(255, 255, 255, 0.7)',
          marginBottom: '24px',
          fontSize: '14px'
        }}>
          Tu sesión se cerrará automáticamente en:
        </p>

        {/* CONTADOR GRANDE (MM:SS) */}
        {/* Este es el elemento más importante: muestra cuánto tiempo queda */}
        <div
          style={{
            fontSize: '48px',
            fontWeight: 'bold',
            color: '#ff6b6b',
            fontFamily: 'monospace',          // Font monoespaciada para alineación
            marginBottom: '32px',
            letterSpacing: '4px',             // Espaciado entre dígitos
          }}
        >
          {displayTime}
        </div>

        {/* BOTONES */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center'
        }}>
          {/* BOTÓN 1: Cerrar Sesión Ahora (rojo) */}
          <button
            onClick={onLogout}
            style={{
              flex: 1,
              padding: '12px 20px',
              background: '#ff6b6b',           // Rojo
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#ff5252';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#ff6b6b';
            }}
          >
            Cerrar Sesión
          </button>

          {/* BOTÓN 2: Extender Sesión (verde) */}
          {/* Clickear aquí resetea los timers de inactividad */}
          <button
            onClick={onExtend}
            style={{
              flex: 1,
              padding: '12px 20px',
              background: '#51cf66',           // Verde
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#40c057';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#51cf66';
            }}
          >
            Extender Sesión
          </button>
        </div>
      </div>
    </div>
  );
}
