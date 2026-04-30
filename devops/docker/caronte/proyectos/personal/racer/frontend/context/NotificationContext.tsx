// ==================== CONTEXTO DE NOTIFICACIONES GLOBALES ====================
// Archivo: src/context/NotificationContext.tsx
//
// PROPÓSITO:
//   - Gestionar notificaciones globales en toda la app
//   - Usado para mostrar alertas en tiempo real
//   - Principalmente para alertas de "Acceso Denegado" (FASE 3)
//
// CONSUMIDORES:
//   - Dashboard: Escucha accesos denegados y crea notificaciones
//   - AccessDeniedNotification: Renderiza el toast visual

'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// ==================== TIPO: Notification ====================
// Estructura de cada notificación individual
export interface Notification {
  id: string;                    // ID único (timestamp + random)
  type: 'access_denied' | 'access_granted' | 'info' | 'error';  // Tipo
  nombreEstudiante: string;      // Nombre del estudiante
  motivo: string;                // Razón (ej: "fuera_horario", "sin_registrar")
  hora: string;                  // Hora del evento
}

// ==================== TIPO: NotificationContextType ====================
// Lo que proporciona el contexto a toda la app
interface NotificationContextType {
  notifications: Notification[];  // Array de notificaciones activas
  addNotification: (notification: Omit<Notification, 'id'>) => void;  // Agregar notif
  removeNotification: (id: string) => void;  // Eliminar notif
}

// Crear contexto
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// ==================== PROVEEDOR: NotificationProvider ====================
// Envuelve toda la app para dar acceso a notificaciones
//
export function NotificationProvider({ children }: { children: ReactNode }) {
  // ==================== ESTADO ====================
  // Lista de notificaciones activas (se actualizaba constantemente)
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // ==================== FUNCIÓN: Agregar Notificación ====================
  // ¿QUÉ HACE?
  //   - Crea nueva notificación con ID único
  //   - La agrega al array de notificaciones
  //   - Configura auto-eliminación después de 5 segundos
  //
  // ENTRADA:
  //   notification = {type, nombreEstudiante, motivo, hora}  (sin ID)
  //
  // SALIDA:
  //   Nada, pero actualiza estado 'notifications'
  //
  // EJEMPLO:
  //   addNotification({
  //     type: 'access_denied',
  //     nombreEstudiante: 'Juan García',
  //     motivo: 'fuera_horario',
  //     hora: '14:30:45'
  //   })
  //
  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    // Paso 1: Generar ID único (timestamp + números aleatorios)
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Paso 2: Agregar a la lista
    setNotifications((prev) => [...prev, { ...notification, id }]);

    // Paso 3: Auto-remover después de 5 segundos
    // (así el usuario no ve acumularse notificaciones viejas)
    setTimeout(() => {
      removeNotification(id);
    }, 5000);
  }, []);

  // ==================== FUNCIÓN: Eliminar Notificación ====================
  // ¿QUÉ HACE?
  //   - Elimina una notificación por ID
  //   - Se llama automáticamente después de 5 segundos
  //   - También se puede llamar manualmente desde componentes
  //
  // ENTRADA:
  //   id = ID único de la notificación
  //
  // SALIDA:
  //   Nada, pero actualiza estado 'notifications'
  //
  const removeNotification = useCallback((id: string) => {
    // Filtrar: mantener todas EXCEPTO la que tiene este ID
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // ==================== VALOR DEL CONTEXTO ====================
  // Esto es lo que otros componentes reciben cuando usan useNotifications()
  const value: NotificationContextType = {
    notifications,              // Array actual de notificaciones
    addNotification,           // Función para agregar
    removeNotification,        // Función para eliminar
  };

  // ==================== RETORNO: Provider ====================
  // Proporciona el contexto a toda la app
  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

// ==================== HOOK: useNotifications ====================
// ¿QUÉ HACE?
//   - Hook para acceder al contexto desde cualquier componente
//   - Verifica que se use dentro de NotificationProvider
//   - Si no → lanza error
//
// USO:
//   const { notifications, addNotification, removeNotification } = useNotifications();
//
// EJEMPLO:
//   // En dashboard.tsx:
//   const { addNotification } = useNotifications();
//   // Cuando detecta acceso denegado:
//   addNotification({
//     type: 'access_denied',
//     nombreEstudiante: acceso.nombre_estudiante,
//     motivo: acceso.motivo_denegacion,
//     hora: acceso.hora
//   });
//
export function useNotifications(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications debe usarse dentro de NotificationProvider');
  }
  return context;
}
