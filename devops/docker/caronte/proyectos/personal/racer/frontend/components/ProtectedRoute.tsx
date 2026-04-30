// ==================== COMPONENTE: ProtectedRoute ====================
// Archivo: src/components/ProtectedRoute.tsx
//
// PROPÓSITO:
//   - Envuelve rutas/páginas que necesitan autenticación
//   - Verifica que el usuario esté logueado
//   - Verifica que tenga el rol requerido
//   - Integra el sistema de inactividad (FASE 1)
//   - Redirige si no está autenticado o no tiene permisos
//
// USO:
//   <ProtectedRoute requiredRole="admin">
//     <AdminPanel />
//   </ProtectedRoute>

'use client';

import { ReactNode, useEffect } from 'react';
import { useAuth, UserRole } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import InactivityWarning from '@/components/InactivityWarning';

// ==================== PROPS ====================
interface ProtectedRouteProps {
  children: ReactNode;                           // Contenido a proteger
  requiredRole?: UserRole | UserRole[];         // Rol(es) requerido(s)
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  // ==================== HOOKS ====================
  // Acceder al contexto de autenticación
  const { user, loading, initialLoading, sessionWarning, sessionExpiresIn, extendSession, logout } = useAuth();
  const router = useRouter();

  // ==================== EFECTO: Validar Autenticación y Autorización ====================
  // ¿QUÉ HACE?
  //   - Verifica que el usuario esté logueado
  //   - Verifica que tenga el rol requerido
  //   - Si no → redirige a /login o /unauthorized
  //
  // FLUJO:
  //   1. ¿Todavía está cargando? → No hacer nada (esperar)
  //   2. ¿Hay usuario? → NO → Redirigir a /login
  //   3. ¿Se requiere un rol específico? → ¿Lo tiene? → NO → Redirigir a /unauthorized
  //   4. TODO BIEN → Permitir acceso
  //
  useEffect(() => {
    // Esperar a que termine la carga inicial
    if (loading || initialLoading) return;

    // ==================== VALIDACIÓN 1: ¿Usuario logueado? ====================
    if (!user) {
      // No hay usuario → ir a login
      console.warn('ProtectedRoute: No hay usuario, redirigiendo a /login');
      router.replace('/login');
      return;
    }

    // ==================== VALIDACIÓN 2: ¿Tiene el rol requerido? ====================
    if (requiredRole) {
      // Convertir a array si es un string
      const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

      // Verificar si el usuario tiene al menos uno de los roles requeridos
      if (!roles.includes(user.role)) {
        // No tiene el rol → ir a página de no autorizado
        console.warn(`ProtectedRoute: Usuario sin permiso. Rol: ${user.role}, Requerido: ${roles}`);
        router.replace('/unauthorized');
      }
    }
  }, [user, loading, initialLoading, requiredRole, router]);

  // ==================== EFECTO: Detectar Actividad del Usuario ====================
  // FASE 1: Sesión con Timeout
  //
  // ¿QUÉ HACE?
  //   - Agrega event listeners para detectar cuando usuario está activo
  //   - Cuando detecta actividad → informa al AuthContext
  //   - AuthContext resetea el timer de inactividad
  //   - Así el usuario NO se desloguea mientras está usando la app
  //
  // EVENTOS MONITOREADOS:
  //   - mousedown: Usuario hace click con mouse
  //   - keydown: Usuario presiona una tecla (escribiendo)
  //   - scroll: Usuario hace scroll (moviendo la rueda)
  //   - touchstart: Usuario toca pantalla (dispositivo táctil)
  //   - click: Usuario hace click (redundante pero seguro)
  //
  // EJEMPLO DE FLUJO:
  //   1. Usuario abre app → timer empieza
  //   2. Usuario espera 13 minutos sin hacer nada
  //   3. Modal aparece: "¿Quieres extender?" (tiene 2 minutos)
  //   4. Usuario hace click en "Extender" O en cualquier parte de la página
  //   5. Se dispara evento "click"
  //   6. handleActivity() es llamado (aunque está vacía)
  //   7. IMPORTANTE: El AuthContext está ESCUCHANDO estos mismos eventos
  //   8. AuthContext resetea el timer → usuario tiene otro 15 minutos
  //
  useEffect(() => {
    // Solo configurar si hay usuario y cargó
    if (!user || loading || initialLoading) return;

    // ==================== CREAR HANDLER ====================
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

    const handleActivity = () => {
      // NOTA: Este handler está vacío porque el AuthContext tiene su propio
      // sistema de escucha. Este componente solo se asegura de que los listeners
      // estén registrados en la ventana.
      // El AuthContext podría escuchar estos mismos eventos si quisiera.
    };

    // ==================== REGISTRAR LISTENERS ====================
    // Agregar listener a cada evento
    events.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    // ==================== LIMPIAR AL DESMONTAR ====================
    // Importante: remover listeners cuando el componente se desmonta
    // o cuando cambia el usuario, para evitar memory leaks
    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [user, loading, initialLoading]);

  // ==================== ESTADO: Cargando ====================
  // Si aún está cargando usuario → mostrar spinner
  if (loading || initialLoading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: '16px',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        }}
      >
        {/* Spinner animado */}
        <div
          style={{
            width: '48px',
            height: '48px',
            border: '3px solid rgba(255,255,255,0.1)',
            borderTopColor: '#2563eb',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />

        {/* Texto de carga */}
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
          Cargando...
        </div>

        {/* Definición de animación */}
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // ==================== VALIDACIÓN: Usuario Logueado ====================
  // Si no hay usuario → no renderizar nada
  // (el useEffect ya lo redirigió a /login)
  if (!user) return null;

  // ==================== VALIDACIÓN: Rol Requerido ====================
  // Si se requiere un rol específico → verificar
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!roles.includes(user.role)) return null;  // No renderizar si no tiene el rol
  }

  // ==================== RETORNO: Contenido Protegido ====================
  // Si todo pasó las validaciones:
  // 1. Renderizar el contenido protegido
  // 2. Renderizar el modal de advertencia de inactividad (si corresponde)
  return (
    <>
      {/* CONTENIDO PROTEGIDO */}
      {children}

      {/* FASE 1: Modal de Advertencia de Inactividad */}
      {/* Solo se muestra cuando sessionWarning === true (faltan 2 minutos) */}
      <InactivityWarning
        isVisible={sessionWarning}                    // ¿Mostrar modal?
        secondsRemaining={sessionExpiresIn}          // Contador regresivo
        onExtend={extendSession}                     // Click: "Extender sesión" → resetear timer
        onLogout={logout}                            // Click: "Cerrar sesión" → logout inmediato
      />
    </>
  );
}
