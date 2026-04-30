// Utilidades y helpers para el backend R.A.C.E.R

const admin = require('firebase-admin');
const { db } = require('../config/firebase');

// ==================== VALIDADORES ====================

/**
 * Valida que un email sea válido
 * @param {string} email
 * @returns {boolean}
 */
const validarEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * Valida que un DNI sea válido (formato español)
 * @param {string} dni
 * @returns {boolean}
 */
const validarDNI = (dni) => {
  const regex = /^\d{8}[A-Z]$/;
  return regex.test(dni);
};

/**
 * Valida que un UID RFID sea válido
 * @param {string} uid_rfid
 * @returns {boolean}
 */
const validarUIDRFID = (uid_rfid) => {
  // Formato: XX:XX:XX:XX o 8 caracteres hexadecimales
  const regex = /^([0-9A-Fa-f]{2}:){3}[0-9A-Fa-f]{2}$|^[0-9A-Fa-f]{8}$/;
  return regex.test(uid_rfid);
};

// ==================== FORMATTERS ====================

/**
 * Formatea una fecha a YYYY-MM-DD
 * @param {Date|string} fecha
 * @returns {string}
 */
const formatearFecha = (fecha) => {
  const date = new Date(fecha);
  return date.toISOString().split('T')[0];
};

/**
 * Formatea la hora a HH:MM:SS
 * @param {Date|string} fecha
 * @returns {string}
 */
const formatearHora = (fecha) => {
  const date = new Date(fecha);
  return date.toTimeString().split(' ')[0];
};

/**
 * Formatea un timestamp a formato legible
 * @param {Date|number} timestamp
 * @returns {string}
 */
const formatearTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

// ==================== CONVERSORES ====================

/**
 * Convierte un documento de Firestore a objeto JavaScript
 * @param {DocumentSnapshot} docSnapshot
 * @returns {object}
 */
const docToObject = (docSnapshot) => {
  return {
    id: docSnapshot.id,
    ...docSnapshot.data()
  };
};

/**
 * Convierte múltiples documentos de Firestore a array de objetos
 * @param {QuerySnapshot} querySnapshot
 * @returns {array}
 */
const queryToArray = (querySnapshot) => {
  return querySnapshot.docs.map(doc => docToObject(doc));
};

// ==================== GENERADORES ====================

/**
 * Genera una contraseña temporal segura
 * @param {number} length
 * @returns {string}
 */
const generarPasswordTemporal = (length = 12) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

/**
 * Genera un ID único
 * @returns {string}
 */
const generarID = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// ==================== CÁLCULOS ====================

/**
 * Calcula el período de acceso según la hora
 * @param {string} hora - Formato HH:MM:SS
 * @returns {string}
 */
const calcularPeriodo = (hora) => {
  const [h, m] = hora.split(':').map(Number);
  const horNum = h * 60 + m; // Convertir a minutos

  // Recreo matutino: 10:30 - 10:50
  if (horNum >= 630 && horNum <= 650) {
    return 'recreo_matutino';
  }
  // Almuerzo: 13:00 - 14:00
  if (horNum >= 780 && horNum < 840) {
    return 'almuerzo';
  }
  // Recreo secundario: 16:10 - 16:30
  if (horNum >= 970 && horNum <= 990) {
    return 'recreo_secundario';
  }

  return 'otro';
};

/**
 * Calcula días entre dos fechas
 * @param {string} fecha1 - YYYY-MM-DD
 * @param {string} fecha2 - YYYY-MM-DD
 * @returns {number}
 */
const calcularDias = (fecha1, fecha2) => {
  const date1 = new Date(fecha1);
  const date2 = new Date(fecha2);
  const diffTime = Math.abs(date2 - date1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Calcula la porcentaje de asistencia
 * @param {number} presente
 * @param {number} total
 * @returns {string}
 */
const calcularPorcentaje = (presente, total) => {
  if (total === 0) return '0%';
  return `${((presente / total) * 100).toFixed(2)}%`;
};

// ==================== AUDITORIA ====================

/**
 * Registra una acción en el sistema (función mejorada y detallada)
 * @param {string} userId - UID del usuario que ejecuta la acción
 * @param {string} tipoEvento - Tipo de evento: 'login', 'crear_estudiante', 'acceso_concedido', 'acceso_denegado', 'cambio_rol', 'actualizar_estudiante', etc.
 * @param {string} coleccion - Colección afectada: 'estudiantes', 'usuarios_app', 'accesos', 'tarjetas'
 * @param {string} documentoId - ID del documento afectado
 * @param {object} cambiosBefore - Valores anteriores (para UPDATE/DELETE)
 * @param {object} cambiosDespues - Valores nuevos (para CREATE/UPDATE)
 * @param {object} extras - Información adicional: { ip_address, usuario_email, usuario_rol, motivo, codigo_error, etc. }
 * @returns {Promise}
 */
const registrarAuditoriaDetallada = async (userId, tipoEvento, coleccion, documentoId, cambiosBefore = null, cambiosDespues = null, extras = {}) => {
  try {
    const accion = tipoEvento.replace(/_/g, ' ').toUpperCase();

    // Construir objeto de log
    const logData = {
      // Identificación del evento
      timestamp: new Date(),
      log_id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,

      // Quién
      usuario_id: userId,
      usuario_email: extras.usuario_email || 'desconocido@email.com',
      usuario_rol: extras.usuario_rol || 'unknown',

      // Qué
      tipo_evento: tipoEvento,
      accion: extras.accion || accion,
      coleccion_afectada: coleccion,
      documento_id: documentoId,

      // Cambios (solo incluir si existen)
      ...(cambiosBefore && Object.keys(cambiosBefore).length > 0 && { cambios_antes: cambiosBefore }),
      ...(cambiosDespues && Object.keys(cambiosDespues).length > 0 && { cambios_despues: cambiosDespues }),

      // Contexto
      resultado: extras.resultado || 'exitoso',
      ...(extras.codigo_error && { codigo_error: extras.codigo_error }),
      ...(extras.mensaje_error && { mensaje_error: extras.mensaje_error }),

      // Seguridad
      ip_address: extras.ip_address || null,
      metodo_autenticacion: extras.metodo_autenticacion || 'token',

      // Trazabilidad
      detalles: extras.detalles || {},
      critico: extras.critico || false,
      ...(extras.sesion_id && { sesion_id: extras.sesion_id })
    };

    await db.collection('logs_sistema').add(logData);
  } catch (error) {
    console.error('Error registrando auditoría detallada:', error);
  }
};

/**
 * Registra una acción en el sistema (función simple para compatibilidad)
 * @param {string} userId
 * @param {string} accion
 * @param {object} detalles
 * @returns {Promise}
 */
const registrarAuditoria = async (userId, accion, detalles = {}) => {
  try {
    await db.collection('logs_sistema').add({
      timestamp: new Date(),
      usuario_id: userId,
      accion,
      detalles,
      ip_address: detalles.ip || null,
      resultado: detalles.resultado || 'exitoso',
      critico: detalles.critico || false
    });
  } catch (error) {
    console.error('Error registrando auditoría:', error);
  }
};

// ==================== EMAILS ====================

/**
 * Crea el template de un email
 * @param {string} tipo
 * @param {object} datos
 * @returns {object}
 */
const crearEmailTemplate = (tipo, datos) => {
  const templates = {
    bienvenida: {
      asunto: 'Bienvenido a R.A.C.E.R',
      cuerpo: `Hola ${datos.nombre},\n\nBienvenido al sistema R.A.C.E.R.\n\nTus credenciales:\nEmail: ${datos.email}\nContraseña temporal: ${datos.password}\n\nPor favor, cambia tu contraseña al primer acceso.`
    },
    cambio_permisos: {
      asunto: 'Cambio de permisos en tu cuenta',
      cuerpo: `Hola ${datos.nombre},\n\nTus permisos han sido ${datos.accion}.\n\nMotivo: ${datos.motivo}`
    }
  };

  return templates[tipo] || null;
};

// ==================== SINCRONIZACIÓN ====================

/**
 * Sincroniza datos con Arduino
 * @param {object} datos
 * @returns {Promise}
 */
const sincronizarConArduino = async (datos) => {
  try {
    // Esta función se implementaría con una API HTTP real
    console.log('Sincronizando con Arduino:', datos);
    return { estado: 'éxito' };
  } catch (error) {
    console.error('Error sincronizando:', error);
    return { estado: 'error', error: error.message };
  }
};

// ==================== EXPORTAR ====================

module.exports = {
  // Validadores
  validarEmail,
  validarDNI,
  validarUIDRFID,

  // Formatters
  formatearFecha,
  formatearHora,
  formatearTimestamp,

  // Conversores
  docToObject,
  queryToArray,

  // Generadores
  generarPasswordTemporal,
  generarID,

  // Cálculos
  calcularPeriodo,
  calcularDias,
  calcularPorcentaje,

  // Auditoría
  registrarAuditoria,
  registrarAuditoriaDetallada,

  // Emails
  crearEmailTemplate,

  // Sincronización
  sincronizarConArduino
};
