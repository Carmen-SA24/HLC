/*
  Auditoría rápida de la colección Firestore `accesos`.

  Nota: Firebase CLI no ofrece un comando oficial para listar documentos.
  Este script usa firebase-admin con una Service Account.

  Uso:
    node scripts/audit-accesos.js

  Variables opcionales:
    FIREBASE_CREDENTIALS=arduino/credenciales.json
    ACCESOS_LIMIT=10
*/

const admin = require('firebase-admin');
const path = require('path');

// Límite de documentos a revisar (mínimo 1)
const limit = Math.max(1, parseInt(process.env.ACCESOS_LIMIT || '10', 10));
// Ruta al JSON de credenciales de Firebase
const credPath = process.env.FIREBASE_CREDENTIALS
  ? path.resolve(process.env.FIREBASE_CREDENTIALS)
  : path.resolve(__dirname, '..', '..', 'arduino', 'credenciales.json');

// Verifica si un valor es un objeto plano (no array, null, etc.)
function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && value.constructor === Object;
}

// Valida que un documento de la colección accesos tenga todos los campos obligatorios y correctos
function validateDoc(data) {
  // Campos que todo documento debe tener
  const baseRequired = [
    'curso',
    'fecha',
    'hora',
    'nombre_estudiante',
    'resultado',
    'timestamp',
    'uid_tarjeta',
  ];

  const missing = baseRequired.filter((k) => !(k in data));
  const errors = [];

  if (missing.length) errors.push(`Faltan campos requeridos: ${missing.join(', ')}`);

  // Validar tipos de datos
  if (typeof data.timestamp !== 'number') errors.push('timestamp debe ser number (ms Unix)');
  if (typeof data.uid_tarjeta !== 'string') errors.push('uid_tarjeta debe ser string');
  if (typeof data.resultado !== 'string') errors.push('resultado debe ser string');
  if (data.resultado !== 'CONCEDIDO' && data.resultado !== 'DENEGADO') {
    errors.push('resultado debe ser CONCEDIDO o DENEGADO');
  }

  // Validar formato de fecha: DD/MM/YYYY
  if (typeof data.fecha === 'string' && !/^\d{2}\/\d{2}\/\d{4}$/.test(data.fecha)) {
    errors.push('fecha no está en formato DD/MM/YYYY');
  }

  // Si el acceso fue denegado, debe tener un motivo
  if (data.resultado === 'DENEGADO') {
    if (!('motivo' in data) && !('resultado_denegacion' in data)) {
      errors.push('DENEGADO sin motivo/resultado_denegacion');
    }
  }

  return errors;
}

async function main() {
  // Verificar que el archivo de credenciales existe
  if (!require('fs').existsSync(credPath)) {
    console.error(`No existe el archivo de credenciales: ${credPath}`);
    process.exit(2);
  }

  // Inicializar Firebase Admin
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(require(credPath)),
    });
  }

  const db = admin.firestore();

  // Obtener los últimos N documentos de la colección accesos
  const snap = await db.collection('accesos').orderBy('timestamp', 'desc').limit(limit).get();

  console.log(`Colección accesos: ${snap.size} doc(s) (últimos ${limit})`);
  console.log('---');

  let ok = 0;   // Documentos válidos
  let bad = 0;  // Documentos con errores

  // Revisar cada documento
  snap.forEach((doc) => {
    const data = doc.data();
    const errors = isPlainObject(data) ? validateDoc(data) : ['documento no es un objeto'];

    // Mostrar info del documento: ID | resultado | fecha hora | UID tarjeta
    const header = `${doc.id} | ${data?.resultado ?? '¿?'} | ${data?.fecha ?? '¿?'} ${data?.hora ?? ''} | ${data?.uid_tarjeta ?? ''}`;
    if (errors.length) {
      bad += 1;
      console.log(`[FAIL] ${header}`);
      errors.forEach((e) => console.log(`  - ${e}`));
      console.log(`  keys: ${Object.keys(data || {}).sort().join(', ')}`);
    } else {
      ok += 1;
      console.log(`[OK]   ${header}`);
    }
  });

  console.log('---');
  console.log(`Resumen: OK=${ok} FAIL=${bad}`);

  // Si hay documentos con errores, salir con código 1
  if (bad) process.exitCode = 1;
}

main().catch((err) => {
  console.error('Error auditando accesos:', err);
  process.exit(1);
});
