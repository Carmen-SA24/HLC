'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardSidebar from '@/components/DashboardSidebar';
import StatsCard from '@/components/StatsCard';
import { Activity, CheckCircle2, XCircle, CreditCard, Waves } from 'lucide-react';
import RegistrosTable from '@/components/RegistrosTable';
import ArduinoStatus from '@/components/ArduinoStatus';
import AccessDeniedNotification from '@/components/AccessDeniedNotification';
import ConfirmModal from '@/components/ConfirmModal';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { db, firebaseConfig } from '@/lib/firebase';
import styles from './dashboard.module.css';
import { initializeApp, getApp, getApps } from 'firebase/app';
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  where,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';
import {
  getAuth,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from 'firebase/auth';

interface DashboardStats {
  totalHoy: number;
  concedidosHoy: number;
  denegadosHoy: number;
  tarjetasActivas: number;
  loading: boolean;
}

interface UsuarioApp {
  uid?: string;
  email: string;
  nombre: string;
  apellidos: string;
  rol: 'superadmin' | 'admin' | 'viewer';
  activo: boolean;
  fechaRegistro: string;
}

interface Tarjeta {
  id: string;
  uid_rfid: string;
  nombre_estudiante: string;
  curso: string;
  activo: boolean;
  fecha_registro: number;
  registrada_por: string;
}

type ModalMode = 'crear' | 'editar' | null;

const SECONDARY_AUTH_APP_NAME = 'racer-admin-create-user';

const CURSO_OPTIONS = [
  {
    label: 'ESO',
    options: ['1º ESO', '2º ESO', '3º ESO', '4º ESO'],
  },
  {
    label: 'Bachillerato',
    options: ['1º BACH - HCS', '2º BACH - HCS', '1º BACH - CT', '2º BACH - CT', '1º BACH - ART', '2º BACH - ART'],
  },
  {
    label: 'FP Básica',
    options: ['1º FPB - INF/COM', '2º FPB - INF/COM', '1º FPB - ENA/AGU', '2º FPB - ENA/AGU'],
  },
  {
    label: 'Grado Medio',
    options: ['1º GM - SMR', '2º GM - SMR', '1º GM - REDES', '2º GM - REDES'],
  },
  {
    label: 'Grado Superior',
    options: ['1º GS - ASIR', '2º GS - ASIR', '1º GS - DAW', '2º GS - DAW', '1º GS - EFES', '2º GS - EFES'],
  },
  {
    label: 'Adultos',
    options: ['ESP A', 'BTPA'],
  },
] as const;

function getSecondaryAuth() {
  const existingApp = getApps().find((app) => app.name === SECONDARY_AUTH_APP_NAME);
  const app = existingApp || initializeApp(firebaseConfig, SECONDARY_AUTH_APP_NAME);
  return getAuth(app);
}

export default function DashboardPage() {
  const { user, hasRole, refreshUser, logout, isSuperadmin, isAdmin } = useAuth();
  const { addNotification } = useNotifications();
  const [stats, setStats] = useState<DashboardStats>({
    totalHoy: 0,
    concedidosHoy: 0,
    denegadosHoy: 0,
    tarjetasActivas: 0,
    loading: true,
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeSection, setActiveSection] = useState<'resumen' | 'accesos' | 'arduino' | 'tarjetas' | 'usuarios' | 'reportes' | 'configuracion'>('resumen');
  const [statsError, setStatsError] = useState<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const accesosDenegadosRef = useRef<Set<string>>(new Set()); // Para evitar duplicados

  // Estado para gestión de usuarios
  const [usuarios, setUsuarios] = useState<UsuarioApp[]>([]);
  const [usuariosLoading, setUsuariosLoading] = useState(false);
  const [usuariosError, setUsuariosError] = useState<string | null>(null);
  const [usuarioSearch, setUsuarioSearch] = useState('');
  const [usuarioFilter, setUsuarioFilter] = useState<'todos' | 'superadmin' | 'admin' | 'viewer'>('todos');
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedUser, setSelectedUser] = useState<UsuarioApp | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    nombre: '',
    apellidos: '',
    rol: 'viewer' as 'superadmin' | 'admin' | 'viewer',
    password: '',
  });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Estado para tarjetas RFID
  const [tarjetas, setTarjetas] = useState<Tarjeta[]>([]);
  const [tarjetasLoading, setTarjetasLoading] = useState(false);
  const [tarjetasError, setTarjetasError] = useState<string | null>(null);
  const [tarjetaSearch, setTarjetaSearch] = useState('');
  const [tarjetaModal, setTarjetaModal] = useState<ModalMode>(null);
  const [tarjetaForm, setTarjetaForm] = useState({
    uid_rfid: '',
    nombre_estudiante: '',
    curso: '1º ESO',
  });
  const [tarjetaFormError, setTarjetaFormError] = useState('');
  const [tarjetaFormLoading, setTarjetaFormLoading] = useState(false);
  const [tarjetaEditando, setTarjetaEditando] = useState<Tarjeta | null>(null);
  const [escaneandoUID, setEscaneandoUID] = useState(false);
  const [ultimoUIDDetectado, setUltimoUIDDetectado] = useState<string | null>(null);
  const unsubscribeAccesosRef = useRef<(() => void) | null>(null);
  const uidDetectadoRef = useRef<string | null>(null);

  // Estado para reportes
  const [reporteTipo, setReporteTipo] = useState<'diario' | 'semanal' | 'mensual'>('diario');
  const [reporteFecha, setReporteFecha] = useState(() => new Date().toISOString().split('T')[0]);
  const [reporteFechaFin, setReporteFechaFin] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [reporteCurso, setReporteCurso] = useState('');
  const [reporteData, setReporteData] = useState<any>(null);
  const [reporteLoading, setReporteLoading] = useState(false);
  const [reporteError, setReporteError] = useState<string | null>(null);

  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => void;
  } | null>(null);

  // Reloj en tiempo real
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Estadísticas en tiempo real
  useEffect(() => {
    if (!user) return; // Verificación inicial: no ejecutar sin usuario autenticado
    let active = true;

    const loadStats = async () => {
      try {
        const inicioHoy = new Date();
        inicioHoy.setHours(0, 0, 0, 0);
        const finHoy = new Date();
        finHoy.setHours(23, 59, 59, 999);

        const qAccesos = query(
          collection(db, 'accesos'),
          where('timestamp', '>=', inicioHoy.getTime()),
          where('timestamp', '<=', finHoy.getTime()),
          orderBy('timestamp', 'desc')
        );

        const snapshot = await getDocs(qAccesos);

        if (!active) return;

        const accesos = snapshot.docs.map((doc) => doc.data());
        const total = accesos.length;
        const concedidos = accesos.filter((r: any) => r.resultado === 'CONCEDIDO').length;
        const denegados = accesos.filter((r: any) => r.resultado === 'DENEGADO').length;

        // Contar tarjetas activas
        let tarjetasActivas = 0;
        try {
          const qTarjetas = query(
            collection(db, 'tarjetas'),
            where('activo', '==', true)
          );
          const tarjetasSnapshot = await getDocs(qTarjetas);
          tarjetasActivas = tarjetasSnapshot.size;
        } catch (e) {
          console.warn('No se pudieron cargar tarjetas activas');
        }

        if (!active) return;

        setStats({
          totalHoy: total,
          concedidosHoy: concedidos,
          denegadosHoy: denegados,
          tarjetasActivas,
          loading: false,
        });
        setStatsError(null);

        // Intentar listener en tiempo real
        try {
          const unsubscribe = onSnapshot(
            qAccesos,
            (snap) => {
              if (!active) return;
              const accs = snap.docs.map((doc) => doc.data());
              setStats((prev) => ({
                ...prev,
                totalHoy: accs.length,
                concedidosHoy: accs.filter((r: any) => r.resultado === 'CONCEDIDO').length,
                denegadosHoy: accs.filter((r: any) => r.resultado === 'DENEGADO').length,
              }));
            },
            (err) => {
              console.warn('Listener de stats desactivado (solo lectura única):', err.message);
            }
          );
          unsubscribeRef.current = unsubscribe;
        } catch (e) {
          console.warn('No se pudo establecer listener en tiempo real para stats');
        }
      } catch (err: any) {
        if (!active) return;

        if (err.code === 'failed-precondition') {
          setStatsError('Los índices de Firestore aún se están creando. Los datos se actualizarán automáticamente.');
        } else if (err.code !== 'permission-denied') {
          setStatsError(`Error cargando estadísticas: ${err.message}`);
        }

        // Intentar carga sin filtro de fecha como fallback
        try {
          const qFallback = query(
            collection(db, 'accesos'),
            orderBy('timestamp', 'desc'),
            limit(100)
          );
          const fallbackSnapshot = await getDocs(qFallback);

          if (!active) return;

          const inicioHoy = new Date();
          inicioHoy.setHours(0, 0, 0, 0);
          const accesosHoy = fallbackSnapshot.docs
            .map((doc) => doc.data())
            .filter((r: any) => r.timestamp >= inicioHoy.getTime());

          setStats({
            totalHoy: accesosHoy.length,
            concedidosHoy: accesosHoy.filter((r: any) => r.resultado === 'CONCEDIDO').length,
            denegadosHoy: accesosHoy.filter((r: any) => r.resultado === 'DENEGADO').length,
            tarjetasActivas: 0,
            loading: false,
          });
        } catch (fallbackErr) {
          if (!active) return;
          setStats((prev) => ({ ...prev, loading: false }));
        }
      }
    };

    loadStats();

    return () => {
      active = false;
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [user]);

  // Listener para accesos DENEGADOS en tiempo real (notificaciones)
  useEffect(() => {
    if (!user) return; // Verificación inicial: no ejecutar sin usuario autenticado
    let active = true;
    let unsubscribeDenied: (() => void) | null = null;

    try {
      const qDenied = query(
        collection(db, 'accesos'),
        where('resultado', '==', 'DENEGADO'),
        orderBy('timestamp', 'desc'),
        limit(50)
      );

      let cargaInicial = true;

      unsubscribeDenied = onSnapshot(
        qDenied,
        (snap) => {
          if (!active) return;

          if (cargaInicial) {
            // Marcar todos los registros históricos como vistos sin notificar
            snap.docs.forEach((doc) => accesosDenegadosRef.current.add(doc.id));
            cargaInicial = false;
            return;
          }

          // Solo notificar cambios nuevos que lleguen en tiempo real
          snap.docChanges().forEach((change) => {
            if (change.type !== 'added') return;
            const acceso = change.doc.data();
            const accesoId = change.doc.id;

            if (!accesosDenegadosRef.current.has(accesoId)) {
              accesosDenegadosRef.current.add(accesoId);
              const hora = acceso.hora || new Date(acceso.timestamp).toLocaleTimeString('es-ES');
              addNotification({
                type: 'access_denied',
                nombreEstudiante: acceso.nombre_estudiante || 'Tarjeta no Asignada',
                motivo: acceso.resultado_denegacion || 'Acceso denegado',
                hora: hora
              });
            }
          });
        },
        (err) => {
          console.warn('Error listening to denied accesses:', err.message);
        }
      );
    } catch (e) {
      console.warn('No se pudo establecer listener para accesos denegados');
    }

    return () => {
      active = false;
      if (unsubscribeDenied) unsubscribeDenied();
    };
  }, [addNotification, user]);

  // Cargar usuarios (solo superadmin)
  const loadUsuarios = useCallback(async () => {
    if (!isSuperadmin) return;
    setUsuariosLoading(true);
    setUsuariosError(null);

    try {
      const snapshot = await getDocs(collection(db, 'usuarios_app'));
      const data = snapshot.docs.map((doc) => ({
        uid: doc.id,
        ...doc.data(),
      })) as UsuarioApp[];
      setUsuarios(data);
    } catch (err: any) {
      setUsuariosError('Error al cargar usuarios');
      console.error(err);
    } finally {
      setUsuariosLoading(false);
    }
  }, [isSuperadmin]);

  useEffect(() => {
    if (activeSection === 'usuarios' && isSuperadmin) {
      loadUsuarios();
    }
  }, [activeSection, isSuperadmin, loadUsuarios]);

  // ==================== TARJETAS (tiempo real con onSnapshot) ====================

  const tarjetasUnsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Limpiar listener anterior si existe
    if (tarjetasUnsubscribeRef.current) {
      tarjetasUnsubscribeRef.current();
      tarjetasUnsubscribeRef.current = null;
    }

    if (activeSection === 'tarjetas' && isAdmin) {
      setTarjetasLoading(true);
      setTarjetasError(null);

      const q = query(collection(db, 'tarjetas'), orderBy('fecha_registro', 'desc'));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Tarjeta[];
          setTarjetas(data);
          setTarjetasLoading(false);
        },
        (err: any) => {
          setTarjetasError(err.message);
          setTarjetasLoading(false);
        }
      );
      tarjetasUnsubscribeRef.current = unsubscribe;
    }

    return () => {
      if (tarjetasUnsubscribeRef.current) {
        tarjetasUnsubscribeRef.current();
        tarjetasUnsubscribeRef.current = null;
      }
    };
  }, [activeSection, isAdmin]);

  // ==================== ESCANEO AUTOMÁTICO DE UID RFID ====================
  // Cuando el modal de tarjeta está abierto y el escaneo activado,
  // escucha en tiempo real la colección 'accesos' para detectar nuevos UIDs
  // que lleguen desde el Arduino/puente.

  useEffect(() => {
    // Limpiar listener anterior si existe
    if (unsubscribeAccesosRef.current) {
      unsubscribeAccesosRef.current();
      unsubscribeAccesosRef.current = null;
    }

    // Solo escuchar cuando el modal está abierto y el escaneo está activado
    if (!tarjetaModal || !escaneandoUID) return;

    // Guardar el último UID ya conocido para no repetirlo
    uidDetectadoRef.current = null;

    // Flag para ignorar la carga inicial de documentos existentes
    // Firestore onSnapshot dispara 'added' tanto para docs existentes como nuevos
    let cargaInicial = true;

    // Escuchar los últimos 5 accesos para capturar el más reciente
    const q = query(
      collection(db, 'accesos'),
      orderBy('timestamp', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        // Si es el primer snapshot (carga inicial), ignoramos todos los 'added'
        // porque corresponden a documentos ya existentes, no a nuevas lecturas
        if (cargaInicial) {
          cargaInicial = false;
          return;
        }

        snapshot.docChanges().forEach((change) => {
          // Solo nos interesan los documentos nuevos en tiempo real (added)
          if (change.type !== 'added') return;

          const data = change.doc.data();
          const uidTarjeta = data.uid_tarjeta || data.uid || '';

          if (!uidTarjeta) return;

          // Evitar repetir el mismo UID si ya lo capturamos
          if (uidDetectadoRef.current === uidTarjeta) return;
          uidDetectadoRef.current = uidTarjeta;

          // Extraer solo los bytes hexadecimales (eliminar separadores)
          const uidLimpio = uidTarjeta
            .replace(/[:\s]/g, '')
            .toUpperCase();

          if (!uidLimpio) return;

          setUltimoUIDDetectado(uidLimpio);
          setTarjetaForm((prev) => ({ ...prev, uid_rfid: uidLimpio }));
          setEscaneandoUID(false);

          // Notificación visual de que se detectó la tarjeta
          setTarjetaFormError('');

          // Pequeña animación: mostrar mensaje de éxito temporal
          const notifMsg = `✅ Tarjeta detectada: ${uidLimpio}`;
          setTarjetaFormError(notifMsg);
          setTimeout(() => {
            setTarjetaFormError((prev) => (prev === notifMsg ? '' : prev));
          }, 3000);
        });
      },
      (err) => {
        console.warn('Error escuchando accesos para UID automático:', err.message);
      }
    );

    unsubscribeAccesosRef.current = unsubscribe;

    return () => {
      if (unsubscribeAccesosRef.current) {
        unsubscribeAccesosRef.current();
        unsubscribeAccesosRef.current = null;
      }
    };
  }, [tarjetaModal, escaneandoUID]);

  // ==================== USE EFFECTS ====================

  useEffect(() => {
    if (activeSection === 'usuarios' && isSuperadmin) {
      loadUsuarios();
    }
  }, [activeSection, isSuperadmin, loadUsuarios]);

  // ==================== REPORTES ====================

  const handleGenerarReporte = async () => {
    setReporteLoading(true);
    setReporteError(null);
    setReporteData(null);

    try {
      const inicioDia = new Date(reporteFecha);
      inicioDia.setHours(0, 0, 0, 0);
      const finDia = new Date(reporteFecha);
      finDia.setHours(23, 59, 59, 999);

      let q;
      if (reporteTipo === 'diario') {
        q = query(
          collection(db, 'accesos'),
          where('timestamp', '>=', inicioDia.getTime()),
          where('timestamp', '<=', finDia.getTime()),
          orderBy('timestamp', 'desc')
        );
      } else if (reporteTipo === 'semanal') {
        const inicioSemana = new Date(reporteFecha);
        inicioSemana.setHours(0, 0, 0, 0);
        const finSemana = reporteFechaFin ? new Date(reporteFechaFin) : new Date(inicioSemana.getTime() + 7 * 24 * 60 * 60 * 1000);
        finSemana.setHours(23, 59, 59, 999);
        q = query(
          collection(db, 'accesos'),
          where('timestamp', '>=', inicioSemana.getTime()),
          where('timestamp', '<=', finSemana.getTime()),
          orderBy('timestamp', 'desc')
        );
      } else {
        // Mensual: desde el día 1 del mes hasta el último día
        const [year, month] = reporteFecha.split('-').map(Number);
        const inicioMes = new Date(year, month - 1, 1);
        inicioMes.setHours(0, 0, 0, 0);
        const finMes = new Date(year, month, 0, 23, 59, 59, 999);
        q = query(
          collection(db, 'accesos'),
          where('timestamp', '>=', inicioMes.getTime()),
          where('timestamp', '<=', finMes.getTime()),
          orderBy('timestamp', 'desc')
        );
      }

      const snapshot = await getDocs(q);
      let registros = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as any),
      }));

      // Filtrar por curso si se seleccionó uno
      if (reporteCurso) {
        registros = registros.filter((r: any) => r.curso === reporteCurso);
      }

      // Calcular resumen
      const totalAccesos = registros.length;
      const totalPermitidos = registros.filter((r: any) => r.resultado === 'CONCEDIDO').length;
      const totalDenegados = registros.filter((r: any) => r.resultado === 'DENEGADO').length;

      // Identificar problemáticos (denegados con nombre)
      const estudiantesProblematicos = registros
        .filter((r: any) => r.resultado === 'DENEGADO' && r.nombre_estudiante)
        .map((r: any) => ({
          nombre: r.nombre_estudiante,
          motivo: r.motivo || r.motivo_denegacion || 'desconocido',
          timestamp: r.timestamp,
        }));

      setReporteData({
        resumen: {
          total_accesos: totalAccesos,
          total_permitidos: totalPermitidos,
          total_denegados: totalDenegados,
          estudiantes_sin_autorizacion: estudiantesProblematicos.length,
        },
        registros,
        estudiantes_problematicos: estudiantesProblematicos,
      });
    } catch (err: any) {
      setReporteError(err.message || 'Error al generar el reporte');
    } finally {
      setReporteLoading(false);
    }
  };

  const handleCreateTarjeta = async (e: React.FormEvent) => {
    e.preventDefault();
    setTarjetaFormError('');
    setTarjetaFormLoading(true);

    try {
      const uid = tarjetaForm.uid_rfid.trim().toUpperCase();
      const nombre = tarjetaForm.nombre_estudiante.trim();

      if (!uid) {
        throw new Error('El UID de la tarjeta es obligatorio');
      }
      if (!/^[A-Z0-9\s]+$/.test(uid)) {
        throw new Error('El UID RFID solo puede contener mayúsculas, números y espacios');
      }
      if (!nombre) {
        throw new Error('El nombre del estudiante es obligatorio');
      }
      if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$/.test(nombre)) {
        throw new Error('El nombre del estudiante solo puede contener letras');
      }

      if (tarjetaModal === 'editar' && tarjetaEditando) {
        // === MODO EDICIÓN ===
        await updateDoc(doc(db, 'tarjetas', tarjetaEditando.id), {
          uid_rfid: uid,
          nombre_estudiante: nombre,
          curso: tarjetaForm.curso.trim(),
        });
      } else {
        // === MODO CREACIÓN ===
        const tarjetaRef = doc(collection(db, 'tarjetas'));
        await setDoc(tarjetaRef, {
          uid_rfid: uid,
          nombre_estudiante: nombre,
          curso: tarjetaForm.curso.trim(),
          activo: true,
          fecha_registro: Date.now(),
          registrada_por: user?.uid || '',
        });
      }

      setTarjetaModal(null);
      setTarjetaEditando(null);
      setTarjetaForm({ uid_rfid: '', nombre_estudiante: '', curso: '1º ESO' });
      // No es necesario recargar: onSnapshot actualiza en tiempo real
    } catch (err: any) {
      setTarjetaFormError(err.message);
    } finally {
      setTarjetaFormLoading(false);
    }
  };

  const handleEditTarjeta = (tarjeta: Tarjeta) => {
    setTarjetaForm({
      uid_rfid: tarjeta.uid_rfid,
      nombre_estudiante: tarjeta.nombre_estudiante,
      curso: tarjeta.curso || '1º ESO',
    });
    setTarjetaEditando(tarjeta);
    setTarjetaFormError('');
    setTarjetaModal('editar');
  };

  const handleToggleTarjeta = async (tarjeta: Tarjeta) => {
    try {
      await updateDoc(doc(db, 'tarjetas', tarjeta.id), {
        activo: !tarjeta.activo,
      });
      // No es necesario recargar: onSnapshot actualiza en tiempo real
    } catch (err: any) {
      setTarjetasError(err.message);
    }
  };

  const handleDeleteTarjeta = (tarjeta: Tarjeta) => {
    setConfirmModal({
      title: 'Eliminar tarjeta RFID',
      message: `¿Seguro que quieres eliminar la tarjeta de ${tarjeta.nombre_estudiante} (${tarjeta.curso})? Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar tarjeta',
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          await deleteDoc(doc(db, 'tarjetas', tarjeta.id));
          // No es necesario recargar: onSnapshot actualiza en tiempo real
        } catch (err: any) {
          setTarjetasError(err.message);
        }
      },
    });
  };

  const filteredTarjetas = tarjetas.filter((t) => {
    if (!tarjetaSearch) return true;
    const term = tarjetaSearch.toLowerCase();
    return (
      t.nombre_estudiante?.toLowerCase().includes(term) ||
      t.curso?.toLowerCase().includes(term) ||
      t.uid_rfid?.toLowerCase().includes(term)
    );
  });

  const filteredUsuarios = usuarios.filter((u) => {
    // Filtro por rol
    if (usuarioFilter !== 'todos' && u.rol !== usuarioFilter) return false;
    
    // Filtro por búsqueda
    if (!usuarioSearch) return true;
    const term = usuarioSearch.toLowerCase();
    return (
      u.nombre?.toLowerCase().includes(term) ||
      u.apellidos?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term)
    );
  });

  // Abrir modal para crear usuario
  const openCreateModal = () => {
    setFormData({ email: '', nombre: '', apellidos: '', rol: 'viewer', password: '' });
    setSelectedUser(null);
    setModalMode('crear');
    setFormError('');
  };

  // Abrir modal para editar usuario
  const openEditModal = (usuario: UsuarioApp) => {
    setFormData({
      email: usuario.email,
      nombre: usuario.nombre,
      apellidos: usuario.apellidos,
      rol: usuario.rol,
      password: '',
    });
    setSelectedUser(usuario);
    setModalMode('editar');
    setFormError('');
  };

  // Crear usuario en Firebase Auth + Firestore
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    try {
      if (!formData.email || !formData.password || !formData.nombre) {
        setFormError('Email, contraseña y nombre son obligatorios');
        setFormLoading(false);
        return;
      }

      if (formData.password.length < 6) {
        setFormError('La contraseña debe tener al menos 6 caracteres');
        setFormLoading(false);
        return;
      }

      const firebaseAuth = getAuth();
      const secondaryAuth = getSecondaryAuth();

      // 1. Crear usuario en Authentication usando una app secundaria
      // para no reemplazar la sesión del superadmin actual.
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        formData.email,
        formData.password
      );

      // 2. Crear documento en Firestore (el nuevo usuario está autenticado ahora,
      // pero las reglas permiten create si request.auth.uid == userId)
      await setDoc(doc(db, 'usuarios_app', userCredential.user.uid), {
        email: formData.email,
        nombre: formData.nombre,
        apellidos: formData.apellidos,
        rol: formData.rol,
        activo: true,
        fechaRegistro: new Date().toISOString(),
      });

      try {
        await sendPasswordResetEmail(firebaseAuth, formData.email);
      } catch (e) {
        console.warn('No se pudo enviar email de bienvenida');
      }

      // 3. Cerrar la sesión de la app secundaria sin tocar la sesión principal.
      await signOut(secondaryAuth).catch(() => null);

      setModalMode(null);
      await loadUsuarios();
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/email-already-in-use') {
        setFormError('Este email ya está en uso');
      } else {
        setFormError(err.message || 'Error al crear usuario');
      }
    } finally {
      setFormLoading(false);
    }
  };

  // Actualizar usuario en Firestore
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser?.uid) return;
    setFormError('');
    setFormLoading(true);

    try {
      await updateDoc(doc(db, 'usuarios_app', selectedUser.uid), {
        nombre: formData.nombre,
        apellidos: formData.apellidos,
        rol: formData.rol,
      });

      if (selectedUser.uid === user?.uid) {
        await refreshUser();
      }

      setModalMode(null);
      loadUsuarios();
    } catch (err: any) {
      setFormError(err.message || 'Error al actualizar usuario');
    } finally {
      setFormLoading(false);
    }
  };

  // Activar/desactivar usuario
  const handleToggleActivo = async (usuario: UsuarioApp) => {
    if (!usuario.uid) return;
    try {
      await updateDoc(doc(db, 'usuarios_app', usuario.uid), {
        activo: !usuario.activo,
      });
      loadUsuarios();
    } catch (err) {
      console.error('Error al cambiar estado del usuario:', err);
    }
  };

  // Eliminar usuario
  const handleDeleteUser = (usuario: UsuarioApp) => {
    if (!usuario.uid) return;
    setConfirmModal({
      title: 'Eliminar usuario',
      message: `¿Seguro que quieres eliminar a ${usuario.nombre} ${usuario.apellidos} (${usuario.email})? Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar usuario',
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          await deleteDoc(doc(db, 'usuarios_app', usuario.uid));
          loadUsuarios();
        } catch (err) {
          console.error('Error al eliminar usuario:', err);
        }
      },
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getRoleBadge = () => {
    if (isSuperadmin) return { label: 'Superadmin', color: '#d1b36a' };
    if (isAdmin) return { label: 'Admin', color: '#4f8f73' };
    return { label: 'Viewer', color: '#5a86a8' };
  };

  const roleBadge = getRoleBadge();

  return (
    <ProtectedRoute>
      <div className={styles.dashboardContainer}>
        <DashboardSidebar activeSection={activeSection} onSectionChange={setActiveSection} />

        <main className={styles.mainContent}>
          {/* Header */}
          <div className={styles.headerTop}>
            <div>
              <div className={styles.headerTitleRow}>
                <h1 className={styles.pageTitle}>
                  Panel de Control
                </h1>
                <span className={styles.roleBadge} style={{ background: `${roleBadge.color}20`, color: roleBadge.color }}>
                  {roleBadge.label}
                </span>
              </div>
              <p className={styles.headerDate}>
                {formatDate(currentTime).charAt(0).toUpperCase() + formatDate(currentTime).slice(1)} —{' '}
                <span className={styles.headerTime}>
                  {formatTime(currentTime)}
                </span>
              </p>
            </div>

            <div className={styles.userCard}>
              <div className={styles.userAvatar}>
                {user?.nombre?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div>
                <div className={styles.userName}>
                  {user?.nombre ? `${user.nombre} ${user.apellidos}` : user?.email?.split('@')[0] || 'Usuario'}
                </div>
                <div className={styles.userEmail}>
                  {user?.email}
                </div>
              </div>
            </div>
          </div>

          {/* Aviso de índices pendientes */}
          {statsError && (
            <div className={styles.warningBanner}>
              {statsError}
            </div>
          )}

          {/* Navegación de secciones */}
          <div className={styles.sectionNav}>
            {[
                { id: 'resumen' as const, label: 'Resumen' },
                { id: 'accesos' as const, label: 'Accesos' },
                ...(isAdmin ? [{ id: 'tarjetas' as const, label: 'Tarjetas' }] : []),
                { id: 'reportes' as const, label: 'Reportes' },
                { id: 'arduino' as const, label: 'Lector RFID' },
                ...(isSuperadmin ? [{ id: 'usuarios' as const, label: 'Usuarios' }] : []),
              ].map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`${styles.sectionTab} ${activeSection === section.id ? styles.sectionTabActive : styles.sectionTabInactive}`}
              >
                {section.label}
              </button>
            ))}
          </div>

          {/* Sección: Resumen */}
          {activeSection === 'resumen' && (
            <>
              <div className={styles.statsGrid}>
                <StatsCard title="Accesos hoy" value={stats.totalHoy} icon={<Activity size={20} strokeWidth={1.6} />} color="#2563eb" subtitle="Total de accesos registrados" loading={stats.loading} />
                <StatsCard title="Concedidos" value={stats.concedidosHoy} icon={<CheckCircle2 size={20} strokeWidth={1.6} />} color="#34d399" subtitle="Accesos autorizados" loading={stats.loading} trend={stats.totalHoy > 0 ? { value: Math.round((stats.concedidosHoy / stats.totalHoy) * 100), isUp: true } : undefined} />
                <StatsCard title="Denegados" value={stats.denegadosHoy} icon={<XCircle size={20} strokeWidth={1.6} />} color="#f87171" subtitle="Accesos rechazados" loading={stats.loading} trend={stats.totalHoy > 0 ? { value: Math.round((stats.denegadosHoy / stats.totalHoy) * 100), isUp: false } : undefined} />
                <StatsCard title="Tarjetas activas" value={stats.tarjetasActivas} icon={<CreditCard size={20} strokeWidth={1.6} />} color="#60a5fa" subtitle="Tarjetas RFID registradas" loading={stats.loading} />
              </div>
              <RegistrosTable />
            </>
          )}

          {/* Sección: Accesos */}
          {activeSection === 'accesos' && (
            <div>
              <div className={styles.sectionHeader}>
                <div>
                  <h2 className={styles.sectionTitle}>Registros de acceso</h2>
                  <p className={styles.sectionSubtitle}>Historial completo de accesos</p>
                </div>
              </div>
              <RegistrosTable />
            </div>
          )}

          {/* Sección: Arduino */}
          {activeSection === 'arduino' && (
            <div>
              <div className={styles.sectionHeader}>
                <div>
                  <h2 className={styles.sectionTitle}>Estado del hardware</h2>
                  <p className={styles.sectionSubtitle}>Monitoreo del lector RFID y puente Arduino</p>
                </div>
              </div>
              <ArduinoStatus />
            </div>
          )}

          {/* Sección: Tarjetas RFID (admin+) */}
          {activeSection === 'tarjetas' && isAdmin && (
            <div>
              <div className={styles.sectionHeader}>
                <div>
                  <h2 className={styles.sectionTitle}>Gestión de tarjetas RFID</h2>
                  <p className={styles.sectionSubtitle}>Administra las tarjetas RFID asignadas a estudiantes</p>
                </div>
                <button
                  onClick={() => {
                    setTarjetaForm({ uid_rfid: '', nombre_estudiante: '', curso: '' });
                    setTarjetaFormError('');
                    setTarjetaModal('crear');
                  }}
                  className={styles.btnPrimary}
                >
                  Nueva Tarjeta
                </button>
              </div>

              {/* Buscador de tarjetas */}
              <div style={{ marginBottom: '16px' }}>
                <input
                  type="text"
                  placeholder="Buscar por estudiante, curso o UID..."
                  value={tarjetaSearch}
                  onChange={(e) => setTarjetaSearch(e.target.value)}
                  className={styles.searchInput}
                />
              </div>

              <div className={styles.tableWrapper}>
                {tarjetasError && <div style={{ padding: '20px', color: '#ff6b6b', fontSize: '14px', textAlign: 'center' }}>{tarjetasError}</div>}
                <div className={styles.tableScroll}>
                  <table className={styles.table}>
                    <thead>
                      <tr className={styles.tableHeadRow}>
                        <th className={styles.tableHeadCell}>Estudiante</th>
                        <th className={styles.tableHeadCell}>Curso</th>
                        <th className={styles.tableHeadCell}>UID RFID</th>
                        <th className={styles.tableHeadCell}>Estado</th>
                        <th className={styles.tableHeadCell}>Registro</th>
                        <th className={styles.tableHeadCellRight}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tarjetasLoading ? (
                        <tr><td colSpan={6} className={styles.tableEmpty}>Cargando tarjetas...</td></tr>
                      ) : filteredTarjetas.length === 0 ? (
                        <tr><td colSpan={6} className={styles.tableEmptyMuted}>
                          {tarjetaSearch ? 'No se encontraron tarjetas con ese criterio' : 'No hay tarjetas registradas'}
                        </td></tr>
                      ) : (
                        filteredTarjetas.map((t) => (
                          <tr key={t.id} className={`${styles.tableBodyRow} ${!t.activo ? styles.tableBodyRowInactive : ''}`}>
                            <td className={styles.tableCellBold}>{t.nombre_estudiante}</td>
                            <td className={styles.tableCell}>{t.curso || '—'}</td>
                            <td className={styles.tableCell}>
                              <code className={styles.uidCode}>
                                {t.uid_rfid}
                              </code>
                            </td>
                            <td className={styles.tableCell}>
                              <span className={`${styles.statusBadge} ${t.activo ? styles.statusBadgeActive : styles.statusBadgeInactive}`}>
                                {t.activo ? 'Activa' : 'Inactiva'}
                              </span>
                            </td>
                            <td className={styles.tableCell} style={{ color: 'rgba(255,255,255,0.4)' }}>
                              {t.fecha_registro ? new Date(t.fecha_registro).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                            </td>
                            <td className={styles.tableCellRight}>
                              <div className={styles.actionGroup}>
                                <button
                                  onClick={() => handleToggleTarjeta(t)}
                                  className={styles.btnAction}
                                  style={{
                                    color: t.activo ? '#ff6b6b' : '#51cf66',
                                    background: t.activo ? 'rgba(255,107,107,0.12)' : 'rgba(81,207,102,0.12)',
                                    borderColor: t.activo ? 'rgba(255,107,107,0.3)' : 'rgba(81,207,102,0.3)',
                                    fontWeight: 600,
                                  }}
                                  onMouseEnter={(e) => {
                                    if (!t.activo) {
                                      e.currentTarget.style.background = 'rgba(81,207,102,0.35)';
                                      e.currentTarget.style.borderColor = 'rgba(81,207,102,0.8)';
                                      e.currentTarget.style.color = '#8affb0';
                                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(81,207,102,0.5)';
                                    } else {
                                      e.currentTarget.style.background = 'rgba(255,107,107,0.25)';
                                      e.currentTarget.style.borderColor = 'rgba(255,107,107,0.6)';
                                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(255,107,107,0.3)';
                                    }
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = t.activo ? 'rgba(255,107,107,0.12)' : 'rgba(81,207,102,0.12)';
                                    e.currentTarget.style.borderColor = t.activo ? 'rgba(255,107,107,0.3)' : 'rgba(81,207,102,0.3)';
                                    e.currentTarget.style.color = t.activo ? '#ff6b6b' : '#51cf66';
                                    e.currentTarget.style.transform = 'translateY(0px)';
                                    e.currentTarget.style.boxShadow = 'none';
                                  }}
                                >
                                  {t.activo ? 'Desactivar' : 'Activar'}
                                </button>
                                <button
                                  onClick={() => handleEditTarjeta(t)}
                                  className={styles.btnAction}
                                  style={{
                                    color: '#93c5fd',
                                    background: 'rgba(147,197,253,0.1)',
                                    borderColor: 'rgba(147,197,253,0.25)',
                                    fontWeight: 600,
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(147,197,253,0.22)';
                                    e.currentTarget.style.borderColor = 'rgba(147,197,253,0.55)';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(147,197,253,0.25)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(147,197,253,0.1)';
                                    e.currentTarget.style.borderColor = 'rgba(147,197,253,0.25)';
                                    e.currentTarget.style.transform = 'translateY(0px)';
                                    e.currentTarget.style.boxShadow = 'none';
                                  }}
                                >
                                  Editar
                                </button>
                                <button
                                  onClick={() => handleDeleteTarjeta(t)}
                                  className={styles.btnActionDanger}
                                  style={{
                                    color: '#f0a0a0',
                                    background: 'rgba(220,80,80,0.12)',
                                    borderColor: 'rgba(220,80,80,0.35)',
                                    fontWeight: 600,
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(220,80,80,0.28)';
                                    e.currentTarget.style.borderColor = 'rgba(220,80,80,0.6)';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(220,80,80,0.3)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(220,80,80,0.12)';
                                    e.currentTarget.style.borderColor = 'rgba(220,80,80,0.35)';
                                    e.currentTarget.style.transform = 'translateY(0px)';
                                    e.currentTarget.style.boxShadow = 'none';
                                  }}
                                >
                                  Eliminar
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Sección: Reportes */}
          {activeSection === 'reportes' && (
            <div>
              <div className={styles.sectionHeader}>
                <div>
                  <h2 className={styles.sectionTitle}>Reportes de acceso</h2>
                  <p className={styles.sectionSubtitle}>Consulta y exporta estadísticas de accesos con filtros avanzados</p>
                </div>
              </div>

              {/* Filtros */}
              <div className={styles.filtersContainer}>
                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>Tipo de reporte</label>
                  <select
                    value={reporteTipo}
                    onChange={(e) => setReporteTipo(e.target.value as 'diario' | 'semanal' | 'mensual')}
                    className={styles.filterSelect}
                  >
                    <option value="diario">Diario</option>
                    <option value="semanal">Semanal</option>
                    <option value="mensual">Mensual</option>
                  </select>
                </div>

                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>Fecha</label>
                  <input
                    type="date"
                    value={reporteFecha}
                    onChange={(e) => setReporteFecha(e.target.value)}
                    className={styles.filterInput}
                  />
                </div>

                {reporteTipo === 'semanal' && (
                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Fecha fin</label>
                    <input
                      type="date"
                      value={reporteFechaFin}
                      onChange={(e) => setReporteFechaFin(e.target.value)}
                      className={styles.filterInput}
                    />
                  </div>
                )}

                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>Curso (opcional)</label>
                  <select
                    value={reporteCurso}
                    onChange={(e) => setReporteCurso(e.target.value)}
                    className={styles.filterSelect}
                  >
                    <option value="">Todos los cursos</option>
                    {CURSO_OPTIONS.map((grupo) => (
                      <optgroup key={grupo.label} label={grupo.label} className={styles.optgroupDark}>
                        {grupo.options.map((curso) => (
                          <option key={curso} value={curso}>{curso}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', paddingBottom: '2px' }}>
                  <button
                    onClick={handleGenerarReporte}
                    disabled={reporteLoading}
                    className={styles.btnGenerate}
                    style={{ opacity: reporteLoading ? 0.6 : 1 }}
                  >
                    {reporteLoading ? (
                      <span style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} />
                    ) : (
                      'Generar Reporte'
                    )}
                  </button>
                </div>
              </div>

              {/* Resultados del reporte */}
              {reporteError && (
                <div style={{ padding: '16px 20px', marginBottom: '20px', background: 'rgba(184, 100, 100, 0.12)', border: '1px solid rgba(184, 100, 100, 0.25)', borderRadius: '12px', color: '#d8a0a0', fontSize: '13px' }}>
                  {reporteError}
                </div>
              )}

              {reporteData && (
                <>
                  {/* Tarjetas de resumen */}
                  <div className={styles.reportSummary}>
                    <div className={styles.reportSummaryItem}>
                      <div className={styles.reportSummaryLabel}>Total accesos</div>
                      <div className={styles.reportSummaryValue}>{reporteData.resumen?.total_accesos ?? reporteData.total_salidas_hoy ?? 0}</div>
                    </div>
                    <div className={styles.reportSummaryItem} style={{ background: 'rgba(52, 211, 153, 0.06)', border: '1px solid rgba(52, 211, 153, 0.15)' }}>
                      <div className={styles.reportSummaryLabel}>Permitidos</div>
                      <div className={styles.reportSummaryValue} style={{ color: '#34d399' }}>{reporteData.resumen?.total_permitidos ?? reporteData.total_permitido ?? 0}</div>
                    </div>
                    <div className={styles.reportSummaryItem} style={{ background: 'rgba(248, 113, 113, 0.06)', border: '1px solid rgba(248, 113, 113, 0.15)' }}>
                      <div className={styles.reportSummaryLabel}>Denegados</div>
                      <div className={styles.reportSummaryValue} style={{ color: '#f87171' }}>{reporteData.resumen?.total_denegados ?? reporteData.total_denegado ?? 0}</div>
                    </div>
                    <div className={styles.reportSummaryItem} style={{ background: 'rgba(96, 165, 250, 0.06)', border: '1px solid rgba(96, 165, 250, 0.15)' }}>
                      <div className={styles.reportSummaryLabel}>Estudiantes</div>
                      <div className={styles.reportSummaryValue} style={{ color: '#60a5fa' }}>{reporteData.resumen?.estudiantes_sin_autorizacion !== undefined ? reporteData.total_estudiantes ?? '—' : '—'}</div>
                    </div>
                  </div>

                  {/* Tabla de registros */}
                  {reporteData.registros && reporteData.registros.length > 0 && (
                    <div className={styles.tableWrapper}>
                      <div className={styles.tableScroll}>
                        <table className={styles.table}>
                          <thead>
                            <tr className={styles.tableHeadRow}>
                              <th className={styles.tableHeadCell} style={{ padding: '12px 20px' }}>Estudiante</th>
                              <th className={styles.tableHeadCell} style={{ padding: '12px 20px' }}>Tipo</th>
                              <th className={styles.tableHeadCell} style={{ padding: '12px 20px' }}>Resultado</th>
                              <th className={styles.tableHeadCell} style={{ padding: '12px 20px' }}>Motivo</th>
                              <th className={styles.tableHeadCell} style={{ padding: '12px 20px' }}>Hora</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reporteData.registros.map((reg: any, idx: number) => (
                              <tr key={idx} className={styles.tableBodyRow}>
                                <td style={{ padding: '12px 20px', color: 'white', fontSize: '13px', fontWeight: 500 }}>
                                  {reg.nombre_estudiante || reg.estudiante_nombre || '—'}
                                </td>
                                <td style={{ padding: '12px 20px', color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>
                                  {reg.tipo_acceso || reg.tipo || '—'}
                                </td>
                                <td style={{ padding: '12px 20px' }}>
                                  <span className={styles.statusBadge} style={{
                                    background: (reg.resultado === 'CONCEDIDO' || reg.estado === 'permitido') ? 'rgba(52, 211, 153, 0.15)' : 'rgba(248, 113, 113, 0.15)',
                                    color: (reg.resultado === 'CONCEDIDO' || reg.estado === 'permitido') ? '#34d399' : '#f87171',
                                  }}>
                                    {(reg.resultado === 'CONCEDIDO' || reg.estado === 'permitido') ? 'Permitido' : 'Denegado'}
                                  </span>
                                </td>
                                <td style={{ padding: '12px 20px', color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>
                                  {reg.motivo_denegacion || reg.motivo || '—'}
                                </td>
                                <td style={{ padding: '12px 20px', color: 'rgba(255,255,255,0.4)', fontSize: '12px', fontFamily: 'monospace' }}>
                                  {reg.timestamp ? new Date(reg.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : reg.hora || '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Estudiantes problemáticos (reporte diario) */}
                  {reporteData.estudiantes_problematicos && reporteData.estudiantes_problematicos.length > 0 && (
                    <div style={{ marginTop: '20px', background: 'rgba(248, 113, 113, 0.05)', borderRadius: '14px', border: '1px solid rgba(248, 113, 113, 0.12)', padding: '20px' }}>
                      <h4 className={styles.reportSectionTitle} style={{ color: '#f87171' }}>
                        Incidencias detectadas ({reporteData.estudiantes_problematicos.length})
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {reporteData.estudiantes_problematicos.map((p: any, idx: number) => (
                          <div key={idx} className={styles.problematicStudent}>
                            <div>
                              <span className={styles.problematicStudentName}>{p.nombre} {p.apellido}</span>
                              <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', marginLeft: '8px' }}>— {p.motivo === 'fuera_horario' ? 'Fuera de horario' : p.motivo === 'no_autorizado' ? 'No autorizado' : p.motivo}</span>
                            </div>
                            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontFamily: 'monospace' }}>
                              {p.timestamp ? new Date(p.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {!reporteData && !reporteLoading && !reporteError && (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.3)' }}>
                  <div style={{ fontSize: '40px', marginBottom: '16px', opacity: 0.3 }}>📊</div>
                  <p style={{ fontSize: '15px', margin: 0 }}>Selecciona los filtros y haz clic en "Generar Reporte"</p>
                  <p style={{ fontSize: '13px', margin: '8px 0 0', color: 'rgba(255,255,255,0.2)' }}>Los datos se obtendrán directamente de Firestore</p>
                </div>
              )}
            </div>
          )}

          {/* Sección: Usuarios (solo superadmin) */}
          {activeSection === 'usuarios' && isSuperadmin && (
            <div>
              <div className={styles.sectionHeader}>
                <div>
                  <h2 className={styles.sectionTitle}>Gestión de usuarios</h2>
                  <p className={styles.sectionSubtitle}>Administra el personal con acceso al sistema</p>
                </div>
                <button
                  onClick={openCreateModal}
                  className={styles.btnPrimary}
                >
                  Nuevo Usuario
                </button>
              </div>

              {/* Filtros y búsqueda */}
              <div style={{ marginBottom: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Buscar por nombre o email..."
                  value={usuarioSearch}
                  onChange={(e) => setUsuarioSearch(e.target.value)}
                  className={styles.searchInput}
                  style={{ flex: 1, minWidth: '250px' }}
                />
                
                <div className={styles.roleFilterGroup}>
                  {['todos', 'superadmin', 'admin', 'viewer'].map((rol) => (
                    <button
                      key={rol}
                      onClick={() => setUsuarioFilter(rol as any)}
                      className={`${styles.roleFilterBtn} ${usuarioFilter === rol ? styles.roleFilterBtnActive : ''}`}
                    >
                      {rol === 'todos' && 'Todos'}
                      {rol === 'superadmin' && 'Superadmin'}
                      {rol === 'admin' && 'Admin'}
                      {rol === 'viewer' && 'Viewer'}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.tableWrapper}>
                {usuariosError && <div style={{ padding: '20px', color: '#ff6b6b', fontSize: '14px', textAlign: 'center' }}>{usuariosError}</div>}
                <div className={styles.tableScroll}>
                  <table className={styles.table}>
                    <thead>
                      <tr className={styles.tableHeadRow}>
                        <th className={styles.tableHeadCell}>Nombre</th>
                        <th className={styles.tableHeadCell}>Email</th>
                        <th className={styles.tableHeadCell}>Rol</th>
                        <th className={styles.tableHeadCell}>Estado</th>
                        <th className={styles.tableHeadCell}>Registro</th>
                        <th className={styles.tableHeadCellRight}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usuariosLoading ? (
                        <tr><td colSpan={6} className={styles.tableEmpty}>Cargando usuarios...</td></tr>
                      ) : filteredUsuarios.length === 0 ? (
                        <tr><td colSpan={6} className={styles.tableEmptyMuted}>
                          {usuarioSearch ? 'No se encontraron usuarios con ese criterio' : 'No hay usuarios registrados'}
                        </td></tr>
                      ) : (
                        filteredUsuarios.map((u) => (
                          <tr key={u.uid} className={`${styles.tableBodyRow} ${!u.activo ? styles.tableBodyRowInactive : ''}`}>
                            <td className={styles.tableCellBold}>{u.nombre} {u.apellidos}</td>
                            <td className={styles.tableCell}>{u.email}</td>
                            <td className={styles.tableCell}>
                              <span className={styles.statusBadge} style={{
                                background: u.rol === 'superadmin' ? 'rgba(209, 179, 106, 0.15)' : u.rol === 'admin' ? 'rgba(79, 143, 115, 0.15)' : 'rgba(90, 134, 168, 0.15)',
                                color: u.rol === 'superadmin' ? '#d1b36a' : u.rol === 'admin' ? '#4f8f73' : '#5a86a8',
                              }}>
                                {u.rol === 'superadmin' ? 'Superadmin' : u.rol === 'admin' ? 'Admin' : 'Viewer'}
                              </span>
                            </td>
                            <td className={styles.tableCell}>
                              <span className={`${styles.statusBadge} ${u.activo ? styles.statusBadgeActive : styles.statusBadgeInactive}`}>
                                {u.activo ? 'Activo' : 'Inactivo'}
                              </span>
                            </td>
                            <td className={styles.tableCell} style={{ color: 'rgba(255,255,255,0.4)' }}>{u.fechaRegistro || '—'}</td>
                            <td className={styles.tableCellRight}>
                              <div className={styles.actionGroup}>
                                <button
                                  onClick={() => openEditModal(u)}
                                  className={styles.btnAction}
                                  style={{
                                    color: '#93c5fd',
                                    background: 'rgba(147,197,253,0.1)',
                                    borderColor: 'rgba(147,197,253,0.25)',
                                    fontWeight: 600,
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(147,197,253,0.22)';
                                    e.currentTarget.style.borderColor = 'rgba(147,197,253,0.55)';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(147,197,253,0.25)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(147,197,253,0.1)';
                                    e.currentTarget.style.borderColor = 'rgba(147,197,253,0.25)';
                                    e.currentTarget.style.transform = 'translateY(0px)';
                                    e.currentTarget.style.boxShadow = 'none';
                                  }}
                                >
                                  Editar
                                </button>
                                {!(u.rol === 'superadmin' && user?.uid === u.uid) && (
                                  <button
                                    onClick={() => handleToggleActivo(u)}
                                    className={styles.btnAction}
                                    style={{
                                      color: u.activo ? '#ff6b6b' : '#51cf66',
                                      background: u.activo ? 'rgba(255,107,107,0.12)' : 'rgba(81,207,102,0.12)',
                                      borderColor: u.activo ? 'rgba(255,107,107,0.3)' : 'rgba(81,207,102,0.3)',
                                      fontWeight: 600,
                                    }}
                                    onMouseEnter={(e) => {
                                      if (!u.activo) {
                                        e.currentTarget.style.background = 'rgba(81,207,102,0.35)';
                                        e.currentTarget.style.borderColor = 'rgba(81,207,102,0.8)';
                                        e.currentTarget.style.color = '#8affb0';
                                        e.currentTarget.style.boxShadow = '0 4px 16px rgba(81,207,102,0.5)';
                                      } else {
                                        e.currentTarget.style.background = 'rgba(255,107,107,0.25)';
                                        e.currentTarget.style.borderColor = 'rgba(255,107,107,0.6)';
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(255,107,107,0.3)';
                                      }
                                      e.currentTarget.style.transform = 'translateY(-2px)';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.background = u.activo ? 'rgba(255,107,107,0.12)' : 'rgba(81,207,102,0.12)';
                                      e.currentTarget.style.borderColor = u.activo ? 'rgba(255,107,107,0.3)' : 'rgba(81,207,102,0.3)';
                                      e.currentTarget.style.color = u.activo ? '#ff6b6b' : '#51cf66';
                                      e.currentTarget.style.transform = 'translateY(0px)';
                                      e.currentTarget.style.boxShadow = 'none';
                                    }}
                                  >
                                    {u.activo ? 'Desactivar' : 'Activar'}
                                  </button>
                                )}
                                {u.rol !== 'superadmin' && (
                                  <button
                                    onClick={() => handleDeleteUser(u)}
                                    className={styles.btnActionDanger}
                                    style={{
                                      color: '#f0a0a0',
                                      background: 'rgba(220,80,80,0.12)',
                                      borderColor: 'rgba(220,80,80,0.35)',
                                      fontWeight: 600,
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.background = 'rgba(220,80,80,0.28)';
                                      e.currentTarget.style.borderColor = 'rgba(220,80,80,0.6)';
                                      e.currentTarget.style.transform = 'translateY(-2px)';
                                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(220,80,80,0.3)';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.background = 'rgba(220,80,80,0.12)';
                                      e.currentTarget.style.borderColor = 'rgba(220,80,80,0.35)';
                                      e.currentTarget.style.transform = 'translateY(0px)';
                                      e.currentTarget.style.boxShadow = 'none';
                                    }}
                                  >
                                    Eliminar
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Sección: Configuración (solo superadmin) */}
          {activeSection === 'configuracion' && isSuperadmin && (
            <div>
              <div className={styles.sectionHeader}>
                <div>
                  <h2 className={styles.sectionTitle}>Configuración del sistema</h2>
                  <p className={styles.sectionSubtitle}>Resumen general y estado de R.A.C.E.R</p>
                </div>
              </div>

              <div className={styles.configGrid}>
                {/* Tarjeta: Estado del sistema */}
                <div className={styles.configCard}>
                  <div className={styles.configCardHeader}>
                    <h3 className={styles.configCardTitle}>Estado del sistema</h3>
                  </div>
                  <div className={styles.configCardBody}>
                    <div className={styles.configInfoRow}>
                      <span className={styles.configInfoLabel}>Accesos hoy</span>
                      <span className={styles.configInfoValue} style={{ color: '#93c5fd', fontWeight: 700 }}>{stats.totalHoy}</span>
                    </div>
                    <div className={styles.configInfoRow}>
                      <span className={styles.configInfoLabel}>Concedidos</span>
                      <span className={styles.configInfoValue} style={{ color: '#51cf66', fontWeight: 700 }}>{stats.concedidosHoy}</span>
                    </div>
                    <div className={styles.configInfoRow}>
                      <span className={styles.configInfoLabel}>Denegados</span>
                      <span className={styles.configInfoValue} style={{ color: '#ff6b6b', fontWeight: 700 }}>{stats.denegadosHoy}</span>
                    </div>
                    <div className={styles.configInfoRow}>
                      <span className={styles.configInfoLabel}>Tarjetas activas</span>
                      <span className={styles.configInfoValue} style={{ color: '#51cf66', fontWeight: 700 }}>{stats.tarjetasActivas}</span>
                    </div>
                    <div className={styles.configInfoRow}>
                      <span className={styles.configInfoLabel}>Usuarios del sistema</span>
                      <span className={styles.configInfoValue} style={{ fontWeight: 700 }}>{usuarios.length}</span>
                    </div>
                    <div className={styles.configInfoRow}>
                      <span className={styles.configInfoLabel}>Tarjetas registradas</span>
                      <span className={styles.configInfoValue} style={{ fontWeight: 700 }}>{tarjetas.length}</span>
                    </div>
                  </div>
                </div>

                {/* Tarjeta: Sesión actual */}
                <div className={styles.configCard}>
                  <div className={styles.configCardHeader}>
                    <h3 className={styles.configCardTitle}>Mi sesión</h3>
                  </div>
                  <div className={styles.configCardBody}>
                    <div className={styles.configInfoRow}>
                      <span className={styles.configInfoLabel}>Usuario</span>
                      <span className={styles.configInfoValue}>{user?.nombre || user?.email?.split('@')[0] || '—'}</span>
                    </div>
                    <div className={styles.configInfoRow}>
                      <span className={styles.configInfoLabel}>Email</span>
                      <span className={styles.configInfoValue} style={{ fontSize: '12px' }}>{user?.email || '—'}</span>
                    </div>
                    <div className={styles.configInfoRow}>
                      <span className={styles.configInfoLabel}>Rol</span>
                      <span className={styles.configInfoValue}>
                        <span style={{
                          display: 'inline-block', padding: '2px 10px', borderRadius: '6px', fontSize: '12px',
                          background: 'rgba(209, 179, 106, 0.15)', color: '#d1b36a', fontWeight: 600
                        }}>
                          Superadmin
                        </span>
                      </span>
                    </div>
                    <div className={styles.configInfoRow}>
                      <span className={styles.configInfoLabel}>Tiempo sesión</span>
                      <span className={styles.configInfoValue}>30 min inactividad</span>
                    </div>
                    <div className={styles.configInfoRow}>
                      <span className={styles.configInfoLabel}>Estado</span>
                      <span className={styles.configInfoValue}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
                          Conectado
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tarjeta: Roles del sistema */}
                <div className={styles.configCard}>
                  <div className={styles.configCardHeader}>
                    <h3 className={styles.configCardTitle}>Roles del sistema</h3>
                  </div>
                  <div className={styles.configCardBody}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'rgba(209, 179, 106, 0.08)', borderRadius: '10px', border: '1px solid rgba(209, 179, 106, 0.15)' }}>
                        <span style={{ color: '#d1b36a', fontWeight: 700, fontSize: '13px', minWidth: '90px' }}>Superadmin</span>
                        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>Acceso total al sistema</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'rgba(79, 143, 115, 0.08)', borderRadius: '10px', border: '1px solid rgba(79, 143, 115, 0.15)' }}>
                        <span style={{ color: '#4f8f73', fontWeight: 700, fontSize: '13px', minWidth: '90px' }}>Admin</span>
                        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>Gestión de tarjetas y accesos</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'rgba(90, 134, 168, 0.08)', borderRadius: '10px', border: '1px solid rgba(90, 134, 168, 0.15)' }}>
                        <span style={{ color: '#5a86a8', fontWeight: 700, fontSize: '13px', minWidth: '90px' }}>Viewer</span>
                        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>Solo consulta de datos</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tarjeta: Conexiones del sistema */}
                <div className={styles.configCard}>
                  <div className={styles.configCardHeader}>
                    <h3 className={styles.configCardTitle}>Conexiones del sistema</h3>
                  </div>
                  <div className={styles.configCardBody}>
                    <div className={styles.configInfoRow}>
                      <span className={styles.configInfoLabel}>Firebase</span>
                      <span className={styles.configInfoValue}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
                          {firebaseConfig.projectId || 'Conectado'}
                        </span>
                      </span>
                    </div>
                    <div className={styles.configInfoRow}>
                      <span className={styles.configInfoLabel}>Puente Arduino</span>
                      <span className={styles.configInfoValue}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fbbf24', display: 'inline-block' }} />
                          Pendiente
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modal de creación/edición de usuario */}
      {modalMode && (
        <div
          className={styles.modalOverlay}
          onClick={(e) => { if (e.target === e.currentTarget) setModalMode(null); }}
        >
          <div className={styles.modalContent}>
            <h3 className={styles.modalTitle}>
              {modalMode === 'crear' ? 'Nuevo usuario' : 'Editar usuario'}
            </h3>

            {formError && (
              <div style={{ padding: '12px 16px', marginBottom: '16px', background: 'rgba(184, 100, 100, 0.12)', border: '1px solid rgba(184, 100, 100, 0.25)', borderRadius: '10px', color: '#d8a0a0', fontSize: '13px' }}>
                {formError}
              </div>
            )}

            <form onSubmit={modalMode === 'crear' ? handleCreateUser : handleUpdateUser}>
              <div className={styles.modalFormGroup}>
                <label className={styles.modalLabel}>Nombre *</label>
                <input type="text" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} placeholder="Nombre" required
                  className={styles.modalInput}
                />
              </div>

              <div className={styles.modalFormGroup}>
                <label className={styles.modalLabel}>Apellidos</label>
                <input type="text" value={formData.apellidos} onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })} placeholder="Apellidos"
                  className={styles.modalInput}
                />
              </div>

              <div className={styles.modalFormGroup}>
                <label className={styles.modalLabel}>Email *</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="email@centro.es" required
                  className={styles.modalInput}
                  disabled={modalMode === 'editar'}
                />
              </div>

              {modalMode === 'crear' && (
                <div className={styles.modalFormGroup}>
                  <label className={styles.modalLabel}>Contraseña *</label>
                  <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="Mínimo 6 caracteres" required
                    className={styles.modalInput}
                  />
                </div>
              )}

              <div className={styles.modalFormGroup} style={{ marginBottom: '24px' }}>
                <label className={styles.modalLabel}>Rol *</label>
                <select
                  value={formData.rol}
                  onChange={(e) => setFormData({ ...formData, rol: e.target.value as 'superadmin' | 'admin' | 'viewer' })}
                  className={styles.modalSelect}
                >
                  <option value="viewer">Viewer — Solo consulta</option>
                  <option value="admin">Admin — Gestión de tarjetas y accesos</option>
                  <option value="superadmin">Superadmin — Acceso total</option>
                </select>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className={styles.btnCancel}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className={styles.btnSave}
                  style={{ opacity: formLoading ? 0.6 : 1 }}
                >
                  {formLoading ? (
                    <span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} />
                  ) : (
                    modalMode === 'crear' ? 'Crear usuario' : 'Guardar cambios'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de creación de tarjeta RFID */}
      {tarjetaModal && (
        <div
          className={styles.modalOverlay}
          onClick={(e) => { if (e.target === e.currentTarget) { setEscaneandoUID(false); setUltimoUIDDetectado(null); uidDetectadoRef.current = null; setTarjetaModal(null); } }}
        >
          <div className={styles.modalContent}>
            <h3 className={styles.modalTitle}>
              {tarjetaModal === 'editar' ? 'Editar tarjeta RFID' : 'Nueva tarjeta RFID'}
            </h3>

            {tarjetaFormError && (
              <div style={{
                padding: '12px 16px',
                marginBottom: '16px',
                background: tarjetaFormError.includes('✅') || tarjetaFormError.includes('🔄')
                  ? tarjetaFormError.includes('✅') ? 'rgba(52, 211, 153, 0.12)' : 'rgba(37, 99, 235, 0.12)'
                  : 'rgba(184, 100, 100, 0.12)',
                border: `1px solid ${
                  tarjetaFormError.includes('✅') ? 'rgba(52, 211, 153, 0.25)'
                  : tarjetaFormError.includes('🔄') ? 'rgba(37, 99, 235, 0.25)'
                  : 'rgba(184, 100, 100, 0.25)'
                }`,
                borderRadius: '10px',
                color: tarjetaFormError.includes('✅') ? '#34d399'
                  : tarjetaFormError.includes('🔄') ? '#93c5fd'
                  : '#d8a0a0',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                {tarjetaFormError.includes('🔄') && (
                  <span style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: '#93c5fd',
                    display: 'inline-block',
                    animation: 'pulse 1s ease-in-out infinite',
                    flexShrink: 0,
                  }} />
                )}
                {tarjetaFormError.includes('✅') && (
                  <span style={{ fontSize: '16px' }}>✅</span>
                )}
                <span>{tarjetaFormError}</span>
              </div>
            )}

            <form onSubmit={handleCreateTarjeta}>
              <div className={styles.modalFormGroup}>
                <label className={styles.modalLabel}>UID RFID *</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={tarjetaForm.uid_rfid}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase().replace(/[^A-Z0-9\s]/g, '');
                      setTarjetaForm({ ...tarjetaForm, uid_rfid: val });
                    }}
                    placeholder="Ej: 4A3B2C1D (junto) o 4A 3B 2C 1D (con espacios)"
                    required
                    className={styles.modalInput}
                    style={{ fontFamily: 'monospace', flex: 1 }}
                    disabled={escaneandoUID}
                  />
                  {tarjetaModal === 'crear' && (
                    <button
                      type="button"
                      onClick={() => {
                        if (escaneandoUID) {
                          setEscaneandoUID(false);
                          setUltimoUIDDetectado(null);
                          uidDetectadoRef.current = null;
                          setTarjetaFormError('');
                        } else {
                          setEscaneandoUID(true);
                          setUltimoUIDDetectado(null);
                          uidDetectadoRef.current = null;
                          setTarjetaFormError('🔄 Acerca la tarjeta al lector RFID...');
                        }
                      }}
                      className={`${styles.btnScanRfid} ${escaneandoUID ? styles.btnScanRfidActive : ''}`}
                      title={escaneandoUID ? 'Detener escaneo' : 'Escuchar tarjeta RFID'}
                    >
                      {escaneandoUID ? (
                        <>
                          <span style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            background: '#34d399',
                            display: 'inline-block',
                            animation: 'pulse 1s ease-in-out infinite',
                          }} />
                          Escuchando...
                        </>
                      ) : (
                        <>
                          <Waves size={16} />
                          Leer tarjeta
                        </>
                      )}
                    </button>
                  )}
                </div>
                {ultimoUIDDetectado && (
                  <p style={{
                    margin: '6px 0 0',
                    fontSize: '11px',
                    color: 'rgba(52, 211, 153, 0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}>
                    <span>✓</span> UID capturado automáticamente del lector
                  </p>
                )}
              </div>

              <div className={styles.modalFormGroup}>
                <label className={styles.modalLabel}>Nombre del Estudiante *</label>
                <input
                  type="text"
                  value={tarjetaForm.nombre_estudiante}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]/g, '');
                    setTarjetaForm({ ...tarjetaForm, nombre_estudiante: val });
                  }}
                  placeholder="Nombre completo"
                  required
                  className={styles.modalInput}
                />
              </div>

              <div className={styles.modalFormGroup} style={{ marginBottom: '24px' }}>
                <label className={styles.modalLabel}>Curso</label>
                <select
                  value={tarjetaForm.curso}
                  onChange={(e) => setTarjetaForm({ ...tarjetaForm, curso: e.target.value })}
                  className={styles.modalSelect}
                >
                  <option value="" disabled>
                    Selecciona un curso
                  </option>
                  {CURSO_OPTIONS.map((grupo) => (
                    <optgroup key={grupo.label} label={grupo.label} className={styles.optgroupDark}>
                      {grupo.options.map((curso) => (
                        <option key={curso} value={curso}>{curso}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => {
                    setEscaneandoUID(false);
                    setUltimoUIDDetectado(null);
                    uidDetectadoRef.current = null;
                    setTarjetaModal(null);
                  }}
                  className={styles.btnCancel}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={tarjetaFormLoading}
                  className={styles.btnSave}
                  style={{ opacity: tarjetaFormLoading ? 0.6 : 1 }}
                >
                  {tarjetaFormLoading ? (
                    <span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} />
                  ) : (
                    tarjetaModal === 'editar' ? 'Guardar cambios' : 'Registrar Tarjeta'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmación para eliminar tarjeta RFID */}
      {confirmModal && (
        <ConfirmModal
          title={confirmModal.title}
          message={confirmModal.message}
          confirmLabel={confirmModal.confirmLabel}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}

      <NotificationsContainer />
    </ProtectedRoute>
  );
}

// Componente para renderizar notificaciones
function NotificationsContainer() {
  const { notifications } = useNotifications();

  return (
    <div className={styles.notificationsContainer}>
      {notifications.map((notification) => (
        <div key={notification.id} style={{ pointerEvents: 'auto' }}>
          {notification.type === 'access_denied' && (
            <AccessDeniedNotification
              nombreEstudiante={notification.nombreEstudiante}
              motivo={notification.motivo}
              hora={notification.hora}
            />
          )}
        </div>
      ))}
    </div>
  );
}
