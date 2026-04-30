// Archivo principal de Cloud Functions
// Entry point para todas las funciones

const auth = require('./auth');
const students = require('./students');
const registros = require('./registros');
const reportes = require('./reportes');

// Exportar todas las funciones
module.exports = {
  auth: auth.auth,
  auth_register: auth.auth,
  auth_login: auth.auth,
  students: students.students,
  registros: registros.registros,
  reportes: reportes.reportes
};
