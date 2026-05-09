// ==================== CONTEXTO DE AUTENTICACIÓN ====================
// Archivo: src/context/AuthContext.tsx
//
// PROPÓSITO GENERAL:
//   Gestiona:
//   1. Autenticación del usuario (login/logout con Firebase)
//   2. Carga de perfil desde Firestore (colección usuarios_app)
//   3. Validación de roles (superadmin, admin, viewer)
//   4. INACTIVIDAD: Cierre automático de sesión después de 15 min sin actividad
//   5. Refresco automático del token JWT cada 55 minutos
//
// CONSUMIDORES:
//   - Componentes que necesiten saber "¿quién es el usuario actual?"
//   - Componentes que necesiten protegerse por rol
//   - Componentes que necesiten logout

'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signOut, getIdTokenResult } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// ==================== TIPOS ====================
// UserRole: Los 3 roles disponibles en el sistema
export type UserRole = 'superadmin' | 'admin' | 'viewer';

// User: Estructura del usuario en el contexto
export interface User {
  uid: string;                    // ID único de Firebase Authentication
  email: string | null;           // Email del usuario
  nombre: string;                 // Nombre del usuario
  apellidos: string;              // Apellidos
  role: UserRole;                 // Rol asignado (superadmin, admin, viewer)
  activo: boolean;                // ¿Está deshabilitado?
  fechaRegistro?: string;         // Cuándo se registró
}

// AuthContextType: Lo que proporciona este contexto
interface AuthContextType {
  user: User | null;              // Usuario actual (null si no está logueado)
  loading: boolean;               // ¿Está cargando datos del usuario?
  initialLoading: boolean;        // ¿Es la carga inicial de la app?
  logout: () => Promise<void>;    // Función para desloguear
  refreshUser: () => Promise<void>; // Recargar perfil desde BD
  hasRole: (roles: UserRole | UserRole[]) => boolean; // Verificar rol
  isSuperadmin: boolean;          // ¿Es superadmin?
  isAdmin: boolean;               // ¿Es admin o superior?

  // INACTIVIDAD (FASE 1)
  sessionWarning: boolean;        // ¿Mostrar modal de advertencia? (verdadero cuando faltan 2 min)
  sessionExpiresIn: number;       // Segundos restantes antes de cierre (countdown)
  extendSession: () => void;      // Función para extender sesión (resetear inactividad)
}

// Crear el contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ==================== CONSTANTES ====================
// Refresco de token: cada 55 minutos
// (Firebase genera tokens con vigencia de 1 hora)
const TOKEN_REFRESH_INTERVAL = 55 * 60 * 1000;

// CONFIGURACIÓN DE INACTIVIDAD (FASE 1: Sesión con Timeout)
// Timeout total: 15 minutos sin actividad → cierre automático
// Advertencia: A los 13 minutos → mostrar modal con opción de extender
// Esto deja 2 minutos para que el usuario reaccione
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;  // 30 minutos en milisegundos
const INACTIVITY_WARNING_MS = 2 * 60 * 1000;   // 2 minutos de advertencia antes de cierre

// ==================== PROVEEDOR: AuthProvider ====================
// RESPONSABILIDAD:
//   1. Escuchar cambios de autenticación (Firebase)
//   2. Cargar perfil del usuario desde Firestore
//   3. Configurar refresco automático de token
//   4. Configurar detector de inactividad
//   5. Proporcionar contexto a toda la app
//
export function AuthProvider({ children }: { children: ReactNode }) {
  // ==================== ESTADO ====================
  const [user, setUser] = useState<User | null>(null);           // Usuario actual
  const [loading, setLoading] = useState(true);                 // ¿Cargando perfil?
  const [initialLoading, setInitialLoading] = useState(true);   // ¿Carga inicial?
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null); // Timer para refresco de token

  // Estado de INACTIVIDAD
  const [sessionWarning, setSessionWarning] = useState(false);  // ¿Mostrar advertencia?
  const [sessionExpiresIn, setSessionExpiresIn] = useState(0);  // Contador (segundos)
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Timer: cierre en 15 min
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);    // Timer: advertencia en 13 min
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null); // Timer: countdown visual (tick cada 1 seg)
  const lastActivityRef = useRef<number>(Date.now());           // Timestamp de última actividad

  // ==================== FUNCIÓN: Cargar Perfil del Usuario ====================
  // ¿QUÉ HACE?
  //   - Busca el perfil del usuario en Firestore (colección: usuarios_app)
  //   - Si existe → lo devuelve
  //   - Si NO existe → crea uno automático con rol "viewer"
  //   - Si está deshabilitado → devuelve null (no loguear)
  //
  // ENTRADA: firebaseUser (del objeto de Firebase Auth)
  // SALIDA: User | null (perfil completo o null si deshabilitado)
  //
  const loadUserProfile = useCallback(async (firebaseUser: FirebaseUser): Promise<User | null> => {
    try {
      // Paso 1: Buscar documento en colección usuarios_app por UID
      const userDoc = await getDoc(doc(db, 'usuarios_app', firebaseUser.uid));
      const userData = userDoc.data();

      // Paso 2: Si NO existe el documento → crear perfil automático
      if (!userDoc.exists() || !userData) {
        console.warn('Usuario no encontrado en usuarios_app. Creando perfil mínimo. UID:', firebaseUser.uid);

        // Crear perfil mínimo con datos de Firebase Auth
        const minimalProfile: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          nombre: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuario',
          apellidos: '',
          role: 'viewer',  // Rol por defecto: viewer (solo lectura)
          activo: true,
          fechaRegistro: new Date().toISOString(),
        };

        // Guardar en Firestore para próximas veces
        await setDoc(doc(db, 'usuarios_app', firebaseUser.uid), {
          uid: minimalProfile.uid,
          email: minimalProfile.email,
          nombre: minimalProfile.nombre,
          apellidos: minimalProfile.apellidos,
          rol: minimalProfile.role,
          activo: minimalProfile.activo,
          fechaRegistro: minimalProfile.fechaRegistro,
          creadoAutomaticamente: true,  // Flag para identificar perfiles auto-creados
          updatedAt: new Date(),
        }, { merge: true });

        return minimalProfile;
      }

      // Paso 3: Verificar si está deshabilitado
      if (userData.activo === false) {
        console.warn('Usuario deshabilitado. UID:', firebaseUser.uid);
        return null;  // No loguear si está deshabilitado
      }

      // Paso 4: Retornar perfil completo desde Firestore
      return {
        uid: firebaseUser.uid,
        email: userData.email || firebaseUser.email,
        nombre: userData.nombre || 'Usuario',
        apellidos: userData.apellidos || '',
        role: (userData.rol || 'viewer') as UserRole,
        activo: userData.activo !== false,  // Por defecto: activo
        fechaRegistro: userData.fechaRegistro,
      };
    } catch (error) {
      console.error('Error cargando perfil:', error);
      return null;
    }
  }, []);

  // ==================== FUNCIÓN: Configurar Detector de Inactividad ====================
  // ¿QUÉ HACE?
  //   Configura los timers que cierren sesión por inactividad:
  //   - A los 13 minutos: mostrar modal de advertencia
  //   - A los 15 minutos: cierre automático
  //   - Mientras cuenta: actualizar contador visual (13:58, 13:57, ...)
  //
  // CÓMO FUNCIONA:
  //   1. warningTimeoutRef (13 min): Muestra modal "¿Quieres extender?"
  //   2. inactivityTimeoutRef (15 min): Cierra sesión automáticamente
  //   3. countdownIntervalRef: Actualiza contador cada 1 segundo
  //
  // NOTA: Los timers se resetean cuando:
  //   - Usuario hace click
  //   - Usuario escribe
  //   - Usuario hace scroll
  //   - Usuario hace touch
  //   (Lo maneja ProtectedRoute.tsx con event listeners)
  //
  const setupInactivityTimeout = useCallback(() => {
    // LIMPIAR TIMERS ANTERIORES (para no tener múltiples)
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    // RESETEAR ESTADO
    setSessionWarning(false);
    setSessionExpiresIn(0);
    lastActivityRef.current = Date.now();

    // TIMER 1: A los 13 minutos → Mostrar advertencia
    warningTimeoutRef.current = setTimeout(() => {
      console.log('⏰ Advertencia: Sesión expirará en 2 minutos');
      setSessionWarning(true);
      setSessionExpiresIn(120);  // 2 minutos = 120 segundos

      // TIMER 3: Countdown visual (actualizar cada 1 segundo)
      countdownIntervalRef.current = setInterval(() => {
        setSessionExpiresIn((prev) => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current!);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, INACTIVITY_TIMEOUT_MS - INACTIVITY_WARNING_MS);  // 13 minutos

    // TIMER 2: A los 15 minutos → Cierre automático
    inactivityTimeoutRef.current = setTimeout(async () => {
      console.log('❌ Sesión cerrada por inactividad');
      setSessionWarning(false);
      setSessionExpiresIn(0);

      // Cerrar sesión
      try {
        await signOut(auth);
        setUser(null);
      } catch (error) {
        console.error('Error al cerrar sesión:', error);
      }
    }, INACTIVITY_TIMEOUT_MS);  // 15 minutos
  }, []);

  // ==================== FUNCIÓN: Extender Sesión ====================
  // ¿QUÉ HACE?
  //   - Resetea TODOS los timers de inactividad
  //   - Cierra el modal de advertencia
  //   - Vuelve a empezar el contador desde 0
  //   - El usuario puede seguir trabajando otros 15 minutos
  //
  // CUÁNDO SE LLAMA:
  //   - Usuario clickea botón "Extender sesión" en el modal
  //   - También cuando ProtectedRoute.tsx detecta actividad del usuario
  //
  const extendSession = useCallback(() => {
    console.log('✅ Sesión extendida');
    setupInactivityTimeout();
  }, [setupInactivityTimeout]);

  // ==================== FUNCIÓN: Refrescar Usuario ====================
  // ¿QUÉ HACE?
  //   - Recarga el perfil del usuario desde Firestore
  //   - Útil si admin cambió el rol mientras usuario estaba logueado
  //
  const refreshUser = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const firebaseUser = auth.currentUser;
      if (firebaseUser) {
        const updatedUser = await loadUserProfile(firebaseUser);
        if (updatedUser) {
          setUser(updatedUser);
        }
      }
    } catch (error) {
      console.error('Error refrescando usuario:', error);
    } finally {
      setLoading(false);
    }
  }, [user, loadUserProfile]);

  // ==================== FUNCIÓN: Verificar Rol ====================
  // ¿QUÉ HACE?
  //   - Verifica si el usuario tiene al menos uno de los roles especificados
  //   - Soporta un solo rol o un array de roles
  //
  // EJEMPLO:
  //   hasRole('admin')                    → ¿es admin?
  //   hasRole(['admin', 'superadmin'])   → ¿es admin O superadmin?
  //
  // RETORNA:
  //   true si tiene el rol, false si no tiene
  //
  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(user.role);
  };

  // ==================== FUNCIÓN: Logout ====================
  // ¿QUÉ HACE?
  //   - Cierra sesión en Firebase
  //   - Limpia estado del usuario
  //   - Limpia todos los timers de inactividad
  //
  const logout = useCallback(async () => {
    // Limpiar timers
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    // Cerrar sesión en Firebase
    await signOut(auth);
    setUser(null);
    setSessionWarning(false);
    setSessionExpiresIn(0);
  }, []);

  // ==================== EFECTO: Autenticación Inicial ====================
  // ¿QUÉ HACE?
  //   - Se ejecuta UNA SOLA VEZ cuando carga la app
  //   - Escucha cambios de autenticación de Firebase
  //   - Si hay usuario → carga su perfil
  //   - Si NO hay usuario → setUser(null)
  //
  // FLUJO:
  //   1. App abre → onAuthStateChanged escucha
  //   2. Firebase verifica si hay sesión guardada
  //   3. Si existe → loadUserProfile()
  //   4. Si NO existe → setUser(null)
  //   5. Finalmente → setInitialLoading(false)
  //
  useEffect(() => {
    let active = true;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!active) return;

      try {
        if (firebaseUser) {
          setLoading(true); // perfil aún no cargado — evita que ProtectedRoute redirija
          const userProfile = await loadUserProfile(firebaseUser);
          if (userProfile) {
            setUser(userProfile);
            // Configurar inactividad cuando se loguea
            setupInactivityTimeout();
          } else {
            // Perfil deshabilitado → logout
            setUser(null);
          }
        } else {
          // No hay usuario logueado
          setUser(null);
        }
      } catch (error) {
        console.error('Error en autenticación:', error);
        setUser(null);
      } finally {
        setInitialLoading(false);
        setLoading(false);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [loadUserProfile, setupInactivityTimeout]);

  // ==================== EFECTO: Refresco de Token ====================
  // ¿QUÉ HACE?
  //   - Cada 55 minutos, refresca el token JWT
  //   - Los tokens de Firebase expiran en 1 hora
  //   - Refrescamos a los 55 min para evitar que expire
  //
  useEffect(() => {
    if (!user) return;

    const refreshToken = async () => {
      try {
        const firebaseUser = auth.currentUser;
        if (firebaseUser) {
          // Forzar refresco del token
          await getIdTokenResult(firebaseUser, true);
          console.log('✅ Token refrescado');
        }
      } catch (error) {
        console.error('Error refrescando token:', error);
      }
    };

    // Configurar intervalo
    refreshIntervalRef.current = setInterval(refreshToken, TOKEN_REFRESH_INTERVAL);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [user]);

  // ==================== VALORES QUE PROPORCIONA EL CONTEXTO ====================
  // Esto es lo que otros componentes reciben cuando usan useAuth()
  const value: AuthContextType = {
    user,
    loading,
    initialLoading,
    logout,
    refreshUser,
    hasRole,
    isSuperadmin: hasRole('superadmin'),
    isAdmin: hasRole('admin') || hasRole('superadmin'),
    sessionWarning,
    sessionExpiresIn,
    extendSession,
  };

  // ==================== RETORNO: Provider ====================
  // Proporciona el contexto a toda la app
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ==================== HOOK: useAuth ====================
// ¿QUÉ HACE?
//   - Hook para acceder al contexto de autenticación desde cualquier componente
//   - Verifica que se use dentro de un AuthProvider
//
// USO:
//   const { user, logout, isAdmin } = useAuth();
//
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
