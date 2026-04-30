const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');

const app = express();
app.use(express.json());

const { db } = require('../../config/firebase');
const { registrarAuditoriaDetallada } = require('../utils/helpers');

// Intermediario: Verificar token
const verificarToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    req.usuario = decodedToken;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

// ===== ESTUDIANTES =====

// GET /estudiantes
app.get('/estudiantes', verificarToken, async (req, res) => {
  try {
    const { curso, autorizado, search, page = 1, limit = 50 } = req.query;
    
    let query = db.collection('estudiantes');

    if (curso) query = query.where('curso', '==', curso);
    if (autorizado !== undefined) query = query.where('autorizado', '==', autorizado === 'true');

    const snapshot = await query.get();
    let estudiantes = snapshot.docs.map(doc => ({
      estudianteId: doc.id,
      ...doc.data()
    }));

    // Filtrar por búsqueda
    if (search) {
      const searchLower = search.toLowerCase();
      estudiantes = estudiantes.filter(est =>
        est.nombre.toLowerCase().includes(searchLower) ||
        est.apellido.toLowerCase().includes(searchLower) ||
        est.dni.includes(search)
      );
    }

    const startIndex = (page - 1) * limit;
    const estudiantesPaginados = estudiantes.slice(startIndex, startIndex + limit);

    res.status(200).json({
      total: estudiantes.length,
      pagina: parseInt(page),
      estudiantes: estudiantesPaginados
    });
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo estudiantes' });
  }
});

// POST /estudiantes
app.post('/estudiantes', verificarToken, async (req, res) => {
  try {
    const {
      nombre,
      apellido,
      dni,
      curso,
      uid_rfid,
      tutor_id,
      email,
      telefono_emergencia
    } = req.body;

    if (!nombre || !apellido || !dni || !uid_rfid) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    // Verificar si el UID RFID ya existe
    const existente = await db.collection('estudiantes')
      .where('uid_rfid', '==', uid_rfid)
      .get();

    if (!existente.empty) {
      return res.status(409).json({ error: 'Este UID RFID ya existe' });
    }

    const nuevoEstudiante = {
      nombre,
      apellido,
      dni,
      curso: curso || 'No especificado',
      uid_rfid,
      tutor_id: tutor_id || null,
      email: email || '',
      telefono_emergencia: telefono_emergencia || '',
      estado: 'activo',
      autorizado: true,
      motivos_no_autorizacion: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await db.collection('estudiantes').add(nuevoEstudiante);

    // Registrar en auditoría
    await registrarAuditoriaDetallada(
      req.usuario.uid,
      'crear_estudiante',
      'estudiantes',
      docRef.id,
      null,  // cambios_antes
      nuevoEstudiante,  // cambios_despues
      {
        usuario_email: req.usuario.email,
        usuario_rol: req.usuario.email ? 'admin' : 'system',
        accion: `Nuevo estudiante creado: ${nombre} ${apellido}`,
        critico: true
      }
    );

    res.status(201).json({
      estudianteId: docRef.id,
      ...nuevoEstudiante,
      mensaje: 'Estudiante creado correctamente'
    });
  } catch (error) {
    res.status(400).json({ 
      error: 'Error creando estudiante',
      detalles: error.message 
    });
  }
});

// PUT /estudiantes/:estudianteId
app.put('/estudiantes/:estudianteId', verificarToken, async (req, res) => {
  try {
    const { estudianteId } = req.params;
    const actualizaciones = req.body;

    actualizaciones.updatedAt = new Date();

    // Obtener documento anterior para auditoría
    const docAntes = await db.collection('estudiantes').doc(estudianteId).get();
    const datosBefore = docAntes.data() || {};

    // Evitar cambiar el UID RFID (puede hacerse con validaciones más complejas)
    if (actualizaciones.uid_rfid) {
      const existente = await db.collection('estudiantes')
        .where('uid_rfid', '==', actualizaciones.uid_rfid)
        .get();

      if (!existente.empty && existente.docs[0].id !== estudianteId) {
        return res.status(409).json({ error: 'Este UID RFID ya está en uso' });
      }
    }

    await db.collection('estudiantes').doc(estudianteId).update(actualizaciones);

    // Registrar en auditoría
    await registrarAuditoriaDetallada(
      req.usuario.uid,
      'actualizar_estudiante',
      'estudiantes',
      estudianteId,
      datosBefore,  // cambios_antes
      actualizaciones,  // cambios_despues
      {
        usuario_email: req.usuario.email,
        usuario_rol: req.usuario.email ? 'admin' : 'system',
        accion: `Estudiante actualizado: ${datosBefore.nombre || 'desconocido'}`,
        critico: false
      }
    );

    res.status(200).json({
      estudianteId,
      mensaje: 'Estudiante actualizado correctamente'
    });
  } catch (error) {
    res.status(400).json({ error: 'Error actualizando estudiante' });
  }
});

// DELETE /estudiantes/:estudianteId
app.delete('/estudiantes/:estudianteId', verificarToken, async (req, res) => {
  try {
    const { estudianteId } = req.params;

    // Obtener datos del estudiante para auditoría
    const estudianteDoc = await db.collection('estudiantes').doc(estudianteId).get();
    const datosEstudiante = estudianteDoc.data() || {};

    await db.collection('estudiantes').doc(estudianteId).update({
      estado: 'baja',
      updatedAt: new Date()
    });

    // Registrar en auditoría
    await registrarAuditoriaDetallada(
      req.usuario.uid,
      'eliminar_estudiante',
      'estudiantes',
      estudianteId,
      datosEstudiante,  // cambios_antes
      { estado: 'baja' },  // cambios_despues
      {
        usuario_email: req.usuario.email,
        usuario_rol: req.usuario.email ? 'admin' : 'system',
        accion: `Estudiante eliminado/dado de baja: ${datosEstudiante.nombre || 'desconocido'} ${datosEstudiante.apellido || ''}`,
        critico: true
      }
    );

    res.status(200).json({
      estudianteId,
      mensaje: 'Estudiante eliminado correctamente'
    });
  } catch (error) {
    res.status(400).json({ error: 'Error eliminando estudiante' });
  }
});

// GET /estudiantes/:estudianteId/historial
app.get('/estudiantes/:estudianteId/historial', verificarToken, async (req, res) => {
  try {
    const { estudianteId } = req.params;
    const { limit = 50, fecha_inicio, fecha_fin } = req.query;

    let query = db.collection('registros_acceso')
      .where('estudiante_id', '==', estudianteId)
      .orderBy('timestamp', 'desc')
      .limit(parseInt(limit));

    const snapshot = await query.get();
    const registros = snapshot.docs.map(doc => ({
      registroId: doc.id,
      ...doc.data()
    }));

    // Obtener información del estudiante
    const estudianteDoc = await db.collection('estudiantes').doc(estudianteId).get();
    const estudiante = estudianteDoc.data();

    res.status(200).json({
      estudiante_id: estudianteId,
      nombre: estudiante?.nombre,
      apellido: estudiante?.apellido,
      registros
    });
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo historial' });
  }
});

// GET /estudiantes/buscar-por-rfid/:uid_rfid
app.get('/estudiantes/buscar-por-rfid/:uid_rfid', verificarToken, async (req, res) => {
  try {
    const { uid_rfid } = req.params;

    const snapshot = await db.collection('estudiantes')
      .where('uid_rfid', '==', uid_rfid)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({ 
        error: 'Estudiante no encontrado',
        uid_rfid,
        estado: 'no_registrado'
      });
    }

    const estudiante = snapshot.docs[0];

    res.status(200).json({
      estudianteId: estudiante.id,
      ...estudiante.data()
    });
  } catch (error) {
    res.status(500).json({ error: 'Error buscando estudiante' });
  }
});

// Exportación
exports.students = functions
  .region('europe-west1')
  .https.onRequest(app);
