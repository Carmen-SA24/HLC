// ==================== COMPONENTE: AccessDeniedNotification ====================
// Archivo: src/components/AccessDeniedNotification.tsx
//
// PROPÓSITO:
//   Toast que muestra cuando se deniega acceso a un estudiante
//   PARTE DE: FASE 3 - Notificaciones de Acceso Denegado
//
// FLUJO:
//   - Dashboard detecta acceso denegado en tiempo real
//   - Llama addNotification()
//   - Se renderiza este componente como toast
//   - Después de 4 segundos → desaparece automáticamente

'use client';

import React, { useEffect, useState } from 'react';

// ==================== PROPS ====================
interface AccessDeniedNotificationProps {
  nombreEstudiante: string;      // Nombre del estudiante que fue denegado
  motivo: string;                // Código del motivo (ej: "fuera_horario", "sin_registrar")
  hora: string;                  // Hora del evento (ej: "14:30:45")
  onClose?: () => void;          // Callback cuando se cierra (para limpiar lista)
}

export default function AccessDeniedNotification({
  nombreEstudiante,
  motivo,
  hora,
  onClose
}: AccessDeniedNotificationProps) {
  // ==================== ESTADO ====================
  const [isVisible, setIsVisible] = useState(true);  // ¿Mostrar toast?

  // ==================== EFECTO: Auto-cierre ====================
  // ¿QUÉ HACE?
  //   - El toast se muestra durante 4 segundos
  //   - Después se oculta automáticamente
  //   - Llama onClose() para que el padre lo elimine de la lista
  //
  // FLUJO:
  //   1. Component monta → isVisible = true → se muestra toast
  //   2. Espera 4 segundos
  //   3. Actualiza isVisible = false → toast desaparece
  //   4. Llama onClose() → padre lo elimina de la lista de notificaciones
  //
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose?.();  // Notificar al padre que se cierre
    }, 4000);  // 4 segundos

    // Limpiar timer si component se desmonta antes
    return () => clearTimeout(timer);
  }, [onClose]);

  // ==================== VALIDACIÓN ====================
  // Si NO debe mostrarse → no renderizar nada
  if (!isVisible) return null;

  // ==================== MAPEO DE MOTIVOS ====================
  // Convertir códigos de motivo a mensajes legibles para el usuario
  // Ej: "sin_registrar" → "No registrado"
  const motivoMap: Record<string, string> = {
    'tarjeta_bloqueada': 'Tarjeta bloqueada',
    'sin_registrar': 'No registrado',
    'no_autorizado': 'No autorizado',
    'estado_invalido': 'Estado inválido',
    'restriccion_temporal': 'Restricción temporal',
    'fuera_horario': 'Fuera de horario',
    'turno_inactivo': 'Turno inactivo',
    'error_sistema': 'Error del sistema'
  };

  // Si el motivo no tiene mapeo → mostrar como está
  const motivoDisplay = motivoMap[motivo] || motivo.replace(/_/g, ' ');

  // ==================== RETORNO: TOAST ====================
  return (
    <div
      style={{
        // POSICIONAMIENTO: Esquina inferior derecha
        position: 'fixed',
        bottom: '24px',              // 24px desde el borde inferior
        right: '24px',               // 24px desde el borde derecho
        maxWidth: '400px',           // No más ancho que 400px

        // ESTILOS VISUALES
        background: 'rgba(15, 23, 42, 0.96)',         // Fondo oscuro semi-transparente
        border: '1px solid rgba(255, 107, 107, 0.55)', // Borde rojo sobrio
        borderRadius: '12px',                         // Esquinas redondeadas
        padding: '16px 20px',                         // Espaciado interno
        boxShadow: '0 12px 32px rgba(0,0,0,0.3)',      // Sombra
        backdropFilter: 'blur(8px)',                  // Efecto vidrio (desenfoque)

        // CAPA
        zIndex: 9999,  // Por encima de casi todo (pero debajo de modales)

        // ANIMACIÓN DE ENTRADA
        animation: 'slideIn 0.3s ease-out',
      }}
    >
      {/* ANIMACIONES CSS */}
      <style>{`
        /* Entrada: desliza desde la derecha */
        @keyframes slideIn {
          from {
            transform: translateX(400px);  /* Comienza fuera a la derecha */
            opacity: 0;
          }
          to {
            transform: translateX(0);      /* Termina en posición */
            opacity: 1;
          }
        }

        /* Salida: desliza hacia la derecha (no se usa, pero incluida por completitud) */
        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(400px);  /* Desliza hacia la derecha */
            opacity: 0;
          }
        }
      `}</style>

      {/* HEADER: Icono + Título */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '8px' }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255, 107, 107, 0.12)',
          color: '#ff8a8a',
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '0.6px',
        }}>
          AD
        </div>

        {/* Contenedor de título */}
        <div style={{ flex: 1 }}>
          <div style={{
            color: '#ff8a8a',
            fontSize: '14px',
            fontWeight: 600,
            letterSpacing: '0.5px',
            textTransform: 'uppercase'
          }}>
            Acceso denegado
          </div>
        </div>
      </div>

      {/* CONTENIDO: Detalles del acceso denegado */}
      <div style={{ paddingLeft: '44px' }}>  {/* Alineado con el icono */}
        {/* FILA 1: Nombre del estudiante */}
        <div style={{
          color: 'rgba(255, 255, 255, 0.9)',
          fontSize: '13px',
          fontWeight: 500,
          marginBottom: '6px'
        }}>
          {nombreEstudiante}
        </div>

        {/* FILA 2: Motivo de la denegación */}
        <div style={{
          color: 'rgba(255, 200, 100, 0.8)',
          fontSize: '12px',
          marginBottom: '6px'
        }}>
          {motivoDisplay}
        </div>

        {/* FILA 3: Hora del evento */}
        <div style={{
          color: 'rgba(255, 255, 255, 0.4)',  // Gris claro
          fontSize: '11px',
          fontFamily: 'monospace'              // Font monoespaciada
        }}>
          {hora}
        </div>
      </div>

      {/* BARRA DE PROGRESO: Countdown visual */}
      {/* Barra que se reduce de izquierda a derecha en 4 segundos */}
      <div
        style={{
          position: 'absolute',
          bottom: '0',
          left: '0',
          height: '2px',
          background: 'linear-gradient(90deg, #ff6b6b, transparent)',  // Gradiente rojo
          animation: 'progress 4s linear',     // 4 segundos (igual al timeout)
        }}
      >
        <style>{`
          @keyframes progress {
            from { width: 100%; }              /* Comienza lleno */
            to { width: 0%; }                  /* Termina vacío */
          }
        `}</style>
      </div>
    </div>
  );
}
