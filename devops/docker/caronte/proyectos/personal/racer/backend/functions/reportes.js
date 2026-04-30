const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');

const app = express();
app.use(express.json());

const { db } = require('../../config/firebase');

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

// ===== REPORTES =====

// GET /reportes/diario - Reporte diario
app.get('/reportes/diario', verificarToken, async (req, res) => {
  try {
    const { fecha = new Date().toISOString().split('T')[0], curso } = req.query;

    // Obtener todos los registros del día
    const registrosSnapshot = await db.collection('registros_acceso')
      .where('fecha', '==', fecha)
      .get();

    const registros = registrosSnapshot.docs.map(doc => ({
      ...doc.data()
    }));

    // Calcular estadísticas
    const totalAccesos = registros.length;
    const totalPermitidos = registros.filter(r => r.estado === 'permitido').length;
    const totalDenegados = registros.filter(r => r.estado === 'denegado').length;

    // Encontrar problemas
    const sin_autorizacion = registros.filter(r =>
      r.motivo_denegacion === 'no_autorizado'
    );
    const sin_registrar = registros.filter(r =>
      r.motivo_denegacion === 'sin_registrar'
    );

    // Agrupar problemas por estudiante
    const estudiaintesProblematicos = [];
    for (const registro of sin_autorizacion) {
      if (registro.estudiante_id) {
        const estudianteDoc = await db.collection('estudiantes').doc(registro.estudiante_id).get();
        const estudiante = estudianteDoc.data();
        
        if (estudiante) {
          estudiaintesProblematicos.push({
            estudianteId: registro.estudiante_id,
            nombre: estudiante.nombre,
            apellido: estudiante.apellido,
            timestamp: registro.timestamp,
            motivo: registro.motivo_denegacion,
            tipo_acceso: registro.tipo_acceso
          });
        }
      }
    }

    res.status(200).json({
      fecha,
      tipo_reporte: 'diario',
      resumen: {
        total_accesos: totalAccesos,
        total_permitidos: totalPermitidos,
        total_denegados: totalDenegados,
        estudiantes_sin_autorizacion: sin_autorizacion.length,
        estudiantes_sin_registrar: sin_registrar.length
      },
      estudiantes_problematicos: estudiaintesProblematicos,
      generado_en: new Date()
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Error generando reporte diario',
      detalles: error.message 
    });
  }
});

// GET /reportes/semanal
app.get('/reportes/semanal', verificarToken, async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;

    if (!fecha_inicio || !fecha_fin) {
      return res.status(400).json({ 
        error: 'Se requieren fecha_inicio y fecha_fin' 
      });
    }

    const registrosSnapshot = await db.collection('registros_acceso')
      .where('fecha', '>=', fecha_inicio)
      .where('fecha', '<=', fecha_fin)
      .get();

    const registros = registrosSnapshot.docs.map(doc => ({
      ...doc.data()
    }));

    // Agrupar por estudiante
    const porEstudiante = {};
    registros.forEach(reg => {
      if (reg.estudiante_id) {
        if (!porEstudiante[reg.estudiante_id]) {
          porEstudiante[reg.estudiante_id] = {
            total_accesos: 0,
            permitidos: 0,
            denegados: 0,
            incidencias: []
          };
        }
        porEstudiante[reg.estudiante_id].total_accesos++;
        if (reg.estado === 'permitido') {
          porEstudiante[reg.estudiante_id].permitidos++;
        } else {
          porEstudiante[reg.estudiante_id].denegados++;
          porEstudiante[reg.estudiante_id].incidencias.push({
            fecha: reg.fecha,
            motivo: reg.motivo_denegacion
          });
        }
      }
    });

    res.status(200).json({
      fecha_inicio,
      fecha_fin,
      tipo_reporte: 'semanal',
      resumen: {
        total_accesos: registros.length,
        total_permitidos: registros.filter(r => r.estado === 'permitido').length,
        total_denegados: registros.filter(r => r.estado === 'denegado').length,
        estudiantes_con_problemas: Object.values(porEstudiante).filter(e => e.denegados > 0).length
      },
      por_estudiante: porEstudiante
    });
  } catch (error) {
    res.status(500).json({ error: 'Error generando reporte semanal' });
  }
});

// GET /reportes/estudiante/:estudianteId
app.get('/reportes/estudiante/:estudianteId', verificarToken, async (req, res) => {
  try {
    const { estudianteId } = req.params;
    const { fecha_inicio, fecha_fin } = req.query;

    let query = db.collection('registros_acceso')
      .where('estudiante_id', '==', estudianteId);

    if (fecha_inicio && fecha_fin) {
      query = query
        .where('fecha', '>=', fecha_inicio)
        .where('fecha', '<=', fecha_fin);
    }

    const snapshot = await query.get();
    const registros = snapshot.docs.map(doc => doc.data());

    // Obtener datos del estudiante
    const estudianteDoc = await db.collection('estudiantes').doc(estudianteId).get();
    const estudiante = estudianteDoc.data();

    // Calcular estadísticas
    const totalSalidas = registros.filter(r => r.tipo_acceso === 'salida').length;
    const totalEntradas = registros.filter(r => r.tipo_acceso === 'entrada').length;
    const salidaNegadas = registros.filter(r => r.tipo_acceso === 'salida' && r.estado === 'denegado').length;

    res.status(200).json({
      estudiante_id: estudianteId,
      nombre: estudiante?.nombre,
      apellido: estudiante?.apellido,
      periodo: {
        fecha_inicio: fecha_inicio || 'Todos',
        fecha_fin: fecha_fin || 'Todos'
      },
      estadisticas: {
        total_salidas: totalSalidas,
        total_entradas: totalEntradas,
        salidas_negadas: salidaNegadas,
        total_denegados: registros.filter(r => r.estado === 'denegado').length
      },
      registros
    });
  } catch (error) {
    res.status(500).json({ error: 'Error generando reporte de estudiante' });
  }
});

// GET /reportes/curso/:curso
app.get('/reportes/curso/:curso', verificarToken, async (req, res) => {
  try {
    const { curso } = req.params;
    const { fecha = new Date().toISOString().split('T')[0] } = req.query;

    // Obtener estudiantes del curso
    const estudiantesSnapshot = await db.collection('estudiantes')
      .where('curso', '==', curso)
      .get();

    const estudiantes = estudiantesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Obtener registros del día para estos estudiantes
    const estudianteIds = estudiantes.map(e => e.id);

    let registrosDelDia = [];
    if (estudianteIds.length > 0) {
      const registrosSnapshot = await db.collection('registros_acceso')
        .where('fecha', '==', fecha)
        .get();

      registrosDelDia = registrosSnapshot.docs
        .map(doc => doc.data())
        .filter(reg => estudianteIds.includes(reg.estudiante_id));
    }

    // Identificar problemas
    const problemas = registrosDelDia
      .filter(r => r.estado === 'denegado')
      .map(r => {
        const est = estudiantes.find(e => e.id === r.estudiante_id);
        return {
          estudiante: `${est?.nombre} ${est?.apellido}`,
          problema: r.motivo_denegacion,
          timestamp: r.timestamp
        };
      });

    res.status(200).json({
      curso,
      fecha,
      total_estudiantes: estudiantes.length,
      total_salidas_hoy: registrosDelDia.filter(r => r.tipo_acceso === 'salida').length,
      total_permitido: registrosDelDia.filter(r => r.estado === 'permitido').length,
      total_denegado: registrosDelDia.filter(r => r.estado === 'denegado').length,
      problemas
    });
  } catch (error) {
    res.status(500).json({ error: 'Error generando reporte de curso' });
  }
});

// Exportación
exports.reportes = functions
  .region('europe-west1')
  .https.onRequest(app);
