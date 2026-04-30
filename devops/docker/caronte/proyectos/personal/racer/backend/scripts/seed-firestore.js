const admin = require('firebase-admin');
const path = require('path');

// Ruta al JSON de credenciales de Firebase (Service Account)
const serviceAccountPath = process.env.FIREBASE_CREDENTIALS || path.join(__dirname, '..', '..', 'arduino', 'credenciales.json');
const databaseURL = process.env.FIREBASE_DATABASE_URL || 'https://proyecto-racer-default-rtdb.firebaseio.com/';

// Inicializar Firebase Admin si no lo está ya
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(require(serviceAccountPath)),
    projectId: require(serviceAccountPath).project_id,
  });
}

const db = admin.firestore();

// Poblar Firestore con datos iniciales
const seed = async () => {
  const now = new Date();

  // Lista de documentos a crear/actualizar en Firestore
  const configuraciones = [
    // ---- Configuración general del sistema ----
    {
      ref: db.collection('configuracion').doc('general'),
      data: {
        nombre_instituto: 'R.A.C.E.R.',
        ciudad: 'Madrid',
        zona_horaria: 'Europe/Madrid',
        modo_debug: false,
        version_api: '1.0.0',
        ultimo_mantenimiento: now,
        estado_sistema: 'operacional',
      },
    },
    // ---- Configuración de seguridad ----
    {
      ref: db.collection('configuracion').doc('seguridad'),
      data: {
        intentos_fallidos_max: 3,          // Intentos antes de bloquear
        tiempo_bloqueo_minutos: 15,        // Tiempo de bloqueo tras fallos
        requerir_2fa: false,               // Autenticación en dos pasos
        logs_retention_days: 90,           // Días que se guardan los logs
        encriptacion_datos: true,
      },
    },
    // ---- Configuración del hardware (Arduino + RFID) ----
    {
      ref: db.collection('configuracion').doc('hardware'),
      data: {
        arduino_timeout_segundos: 30,      // Timeout de comunicación con Arduino
        frecuencia_sincronizacion: 'real-time',
        puertas_activas: ['puerta_principal'],
        tipo_rfid: 'NFC',
      },
    },
    // ---- Periodos de acceso (recreos, almuerzo) ----
    {
      ref: db.collection('periodos_acceso').doc('recreoMatutino'),
      data: {
        nombre: 'Recreo de Mañana',
        hora_inicio: '10:30',
        hora_fin: '10:50',
        dias_semana: ['lunes', 'martes', 'miércoles', 'jueves', 'viernes'],
        activo: true,
        zona_permitida: ['patio_principal', 'patio_secundario'],
      },
    },
    {
      ref: db.collection('periodos_acceso').doc('almuerzo'),
      data: {
        nombre: 'Almuerzo',
        hora_inicio: '13:00',
        hora_fin: '14:00',
        dias_semana: ['lunes', 'martes', 'miércoles', 'jueves', 'viernes'],
        activo: true,
        zona_permitida: ['comedor', 'patio_principal'],
      },
    },
    // ===== TURNOS (horarios de entrada/salida) =====
    {
      ref: db.collection('turnos').doc('turno_matutino'),
      data: {
        nombre: 'Turno Matutino',
        hora_inicio: '08:00',
        hora_fin: '14:00',
        dias_semana: [1, 2, 3, 4, 5],  // 0=Dom, 1=Lun...
        activo: true,
        descripcion: 'Horario de mañana',
        createdAt: now,
      },
    },
    {
      ref: db.collection('turnos').doc('turno_vespertino'),
      data: {
        nombre: 'Turno Vespertino',
        hora_inicio: '14:00',
        hora_fin: '20:00',
        dias_semana: [1, 2, 3, 4, 5],  // 0=Dom, 1=Lun...
        activo: true,
        descripcion: 'Horario de tarde',
        createdAt: now,
      },
    },
    {
      ref: db.collection('turnos').doc('turno_nocturno'),
      data: {
        nombre: 'Turno Nocturno',
        hora_inicio: '20:00',
        hora_fin: '06:00',
        dias_semana: [1, 2, 3, 4, 5],  // 0=Dom, 1=Lun...
        activo: true,
        descripcion: 'Horario de noche',
        createdAt: now,
      },
    },
  ];

  // Guardar cada configuración en Firestore (merge para no sobrescribir si ya existe)
  for (const item of configuraciones) {
    await item.ref.set({ ...item.data, updatedAt: now }, { merge: true });
  }

  // Crear usuario director si existe la variable DIRECTOR_UID
  const directorUid = process.env.DIRECTOR_UID;
  const directorEmail = process.env.DIRECTOR_EMAIL;
  const directorNombre = process.env.DIRECTOR_NOMBRE || 'Director';
  const directorApellido = process.env.DIRECTOR_APELLIDO || 'Sistema';

  if (directorUid) {
    await db.collection('usuarios').doc(directorUid).set({
      uid: directorUid,
      email: directorEmail || null,
      nombre: directorNombre,
      apellido: directorApellido,
      rol: 'director',
      estado: 'activo',
      departamento: 'Dirección',
      createdAt: now,
      updatedAt: now,
      lastLogin: now,
    }, { merge: true });
  }

  console.log('Firestore inicializado correctamente.');
};

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error inicializando Firestore:', error);
    process.exit(1);
  });
