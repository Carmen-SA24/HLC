const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');

const app = express();
app.use(express.json());

const { db, auth } = require('../../config/firebase');
const { registrarAuditoriaDetallada } = require('../utils/helpers');

// Intermediario: Verificar JWT
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
    res.status(401).json({ error: 'Token inválido', detalles: error.message });
  }
};

// Intermediario: Verificar rol
const verificarRol = (rolesPermitidos) => async (req, res, next) => {
  try {
    const usuarioDoc = await db.collection('usuarios').doc(req.usuario.uid).get();
    const rol = usuarioDoc.data()?.rol;

    if (!rolesPermitidos.includes(rol)) {
      return res.status(403).json({ error: 'No tienes permisos para esta acción' });
    }
    
    req.rol = rol;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Error verificando rol' });
  }
};

// ===== AUTENTICACIÓN =====

// POST /auth/register
app.post('/auth/register', async (req, res) => {
  try {
    const { email, password, nombre, apellido, rol = 'tutor' } = req.body;

    if (!email || !password || !nombre || !apellido) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    // Crear usuario en Firebase Auth
    const usuarioAuth = await auth.createUser({
      email,
      password,
      displayName: `${nombre} ${apellido}`
    });

    // Guardar información en Firestore
    await db.collection('usuarios').doc(usuarioAuth.uid).set({
      email,
      nombre,
      apellido,
      rol,
      estado: 'activo',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Crear token personalizado
    const token = await admin.auth().createCustomToken(usuarioAuth.uid);

    res.status(201).json({
      uid: usuarioAuth.uid,
      email,
      nombre,
      apellido,
      rol,
      token,
      mensaje: 'Usuario creado correctamente'
    });
  } catch (error) {
    res.status(400).json({ 
      error: 'Error creando usuario',
      detalles: error.message 
    });
  }
});

// POST /auth/login
// Recibe el ID token generado por Firebase Auth en el frontend,
// lo valida y devuelve el perfil guardado en Firestore.
app.post('/auth/login', async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: 'ID token requerido' });
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const usuarioDoc = await db.collection('usuarios').doc(uid).get();

    if (!usuarioDoc.exists) {
      await db.collection('usuarios').doc(uid).set({
        uid,
        email: decodedToken.email || null,
        nombre: decodedToken.name || null,
        apellido: null,
        rol: 'student',
        estado: 'activo',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: new Date(),
      });
    } else {
      await db.collection('usuarios').doc(uid).set(
        {
          lastLogin: new Date(),
        },
        { merge: true }
      );
    }

    const usuarioData = (await db.collection('usuarios').doc(uid).get()).data();

    // Registrar login en auditoría (mejorado)
    await registrarAuditoriaDetallada(
      uid,
      'login',
      'usuarios',
      uid,
      null,
      { ip_address: req.ip },
      {
        usuario_email: usuarioData?.email || decodedToken.email || 'desconocido',
        usuario_rol: usuarioData?.rol || 'student',
        accion: 'Usuario autenticado correctamente',
        resultado: 'exitoso',
        ip_address: req.ip || 'desconocida'
      }
    );

    res.status(200).json({
      token: idToken,
      usuario: {
        uid,
        email: usuarioData?.email || decodedToken.email || null,
        nombre: usuarioData?.nombre || decodedToken.name || null,
        apellido: usuarioData?.apellido || null,
        rol: usuarioData?.rol || 'student',
      },
      expiresIn: 3600
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Error en login',
      detalles: error.message 
    });
  }
});

// POST /auth/logout
app.post('/auth/logout', verificarToken, async (req, res) => {
  try {
    // Aquí podrías implementar blacklist de tokens si necesitas
    res.status(200).json({ mensaje: 'Sesión cerrada correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al cerrar sesión' });
  }
});

// ===== USUARIOS =====

// GET /usuarios - Solo directores
app.get('/usuarios', verificarToken, verificarRol(['director']), async (req, res) => {
  try {
    const { role, estado, page = 1, limit = 20 } = req.query;
    
    let query = db.collection('usuarios');

    if (role) query = query.where('rol', '==', role);
    if (estado) query = query.where('estado', '==', estado);

    const snapshot = await query.get();
    const usuarios = snapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    }));

    const startIndex = (page - 1) * limit;
    const usuariosPaginados = usuarios.slice(startIndex, startIndex + limit);

    res.status(200).json({
      total: usuarios.length,
      pagina: parseInt(page),
      usuarios: usuariosPaginados
    });
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo usuarios' });
  }
});

// POST /usuarios - Solo directores
app.post('/usuarios', verificarToken, verificarRol(['director']), async (req, res) => {
  try {
    const { email, nombre, apellido, rol = 'tutor', departamento, telefono } = req.body;

    if (!email || !nombre || !apellido) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    // Generar contraseña temporal
    const passwordTemporal = Math.random().toString(36).substring(2, 15);

    const usuarioAuth = await auth.createUser({
      email,
      password: passwordTemporal,
      displayName: `${nombre} ${apellido}`
    });

    await db.collection('usuarios').doc(usuarioAuth.uid).set({
      email,
      nombre,
      apellido,
      rol,
      departamento: departamento || '',
      telefono: telefono || '',
      estado: 'activo',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    res.status(201).json({
      uid: usuarioAuth.uid,
      email,
      nombre,
      apellido,
      rol,
      mensaje: 'Usuario creado. Contraseña temporal enviada al email.',
      passwordTemporal // Solo para demostración, en producción enviar por email
    });
  } catch (error) {
    res.status(400).json({ 
      error: 'Error creando usuario',
      detalles: error.message 
    });
  }
});

// PUT /usuarios/:userId - Solo directores
app.put('/usuarios/:userId', verificarToken, verificarRol(['director']), async (req, res) => {
  try {
    const { userId } = req.params;
    const { nombre, apellido, estado, departamento, rol } = req.body;

    // Obtener datos anteriores para auditoría
    const usuarioAntes = await db.collection('usuarios').doc(userId).get();
    const datosBefore = usuarioAntes.data() || {};

    const actualizaciones = {
      updatedAt: new Date()
    };

    if (nombre) actualizaciones.nombre = nombre;
    if (apellido) actualizaciones.apellido = apellido;
    if (estado) actualizaciones.estado = estado;
    if (departamento) actualizaciones.departamento = departamento;
    if (rol) actualizaciones.rol = rol;

    await db.collection('usuarios').doc(userId).update(actualizaciones);

    // Registrar en auditoría
    const usuarioActual = await db.collection('usuarios').doc(req.usuario.uid).get();
    await registrarAuditoriaDetallada(
      req.usuario.uid,
      rol ? 'cambio_rol' : 'actualizar_usuario',
      'usuarios',
      userId,
      datosBefore,  // cambios_antes
      actualizaciones,  // cambios_despues
      {
        usuario_email: usuarioActual.data()?.email || 'desconocido',
        usuario_rol: usuarioActual.data()?.rol || 'director',
        accion: rol ? `Rol cambiado de ${datosBefore.rol} a ${rol} para usuario ${datosBefore.nombre}` : `Usuario ${datosBefore.nombre} actualizado`,
        critico: rol ? true : false,
        resultado: 'exitoso'
      }
    );

    res.status(200).json({
      uid: userId,
      mensaje: 'Usuario actualizado correctamente'
    });
  } catch (error) {
    res.status(400).json({ error: 'Error actualizando usuario' });
  }
});

// Exportación
exports.auth = functions
  .region('europe-west1')
  .https.onRequest(app);
