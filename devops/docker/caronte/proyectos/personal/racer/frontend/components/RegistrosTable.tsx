'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  getDocs,
} from 'firebase/firestore';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface Acceso {
  id: string;
  timestamp: number;
  fecha: string;
  hora: string;
  uid_tarjeta: string;
  nombre_estudiante: string;
  curso: string;
  resultado: 'CONCEDIDO' | 'DENEGADO';
}

const PAGE_SIZE = 15;

export default function RegistrosTable() {
  const [accesos, setAccesos] = useState<Acceso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'todos' | 'CONCEDIDO' | 'DENEGADO'>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let active = true;

    const setupListener = async () => {
      try {
        const q = query(
          collection(db, 'accesos'),
          orderBy('timestamp', 'desc'),
          limit(100)
        );

        const snapshot = await getDocs(q);
        
        if (!active) return;

        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Acceso[];
        
        setAccesos(data);
        setLoading(false);
        setError(null);

        const unsubscribe = onSnapshot(
          q,
          (snap) => {
            if (!active) return;
            const newData = snap.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })) as Acceso[];
            setAccesos(newData);
            setError(null);
          },
          (err) => {
            console.warn('Error en listener de accesos (modo lectura única):', err.message);
          }
        );

        unsubscribeRef.current = unsubscribe;
      } catch (err: any) {
        if (!active) return;
        
        if (err.code === 'permission-denied') {
          setError('No tienes permisos para ver los registros de acceso');
        } else if (err.code === 'failed-precondition') {
          setError('Los índices de Firestore aún se están creando. Intenta de nuevo en unos minutos.');
        } else {
          setError(`Error al cargar registros: ${err.message}`);
        }
        setLoading(false);
      }
    };

    setupListener();

    return () => {
      active = false;
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  // Filtrar accesos
  const filteredAccesos = useMemo(() => {
    return accesos.filter((a) => {
      // Filtro por resultado
      if (filter !== 'todos' && a.resultado !== filter) return false;

      // Búsqueda por texto (estudiante, curso, UID)
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchEstudiante = a.nombre_estudiante?.toLowerCase().includes(term);
        const matchCurso = a.curso?.toLowerCase().includes(term);
        const matchUid = a.uid_tarjeta?.toLowerCase().includes(term);
        if (!matchEstudiante && !matchCurso && !matchUid) return false;
      }

      // Filtro por rango de fechas
      if (dateFrom || dateTo) {
        const accesoDate = new Date(a.timestamp);
        if (dateFrom) {
          const from = new Date(dateFrom + 'T00:00:00');
          if (accesoDate < from) return false;
        }
        if (dateTo) {
          const to = new Date(dateTo + 'T23:59:59');
          if (accesoDate > to) return false;
        }
      }

      return true;
    });
  }, [accesos, filter, searchTerm, dateFrom, dateTo]);

  // Paginación
  const totalPages = Math.max(1, Math.ceil(filteredAccesos.length / PAGE_SIZE));
  const paginatedAccesos = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredAccesos.slice(start, start + PAGE_SIZE);
  }, [filteredAccesos, currentPage]);

  // Resetear página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchTerm, dateFrom, dateTo]);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const getResultadoColor = (resultado: string) => {
    return resultado === 'CONCEDIDO'
      ? { bg: 'rgba(79, 143, 115, 0.12)', text: '#9fd3ba', label: 'Concedido' }
      : { bg: 'rgba(184, 100, 100, 0.12)', text: '#d8a0a0', label: 'Denegado' };
  };

  const formatTimestamp = (ts: number | undefined) => {
    if (!ts) return '—';
    const date = new Date(ts);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Exportar a CSV
  const exportCSV = useCallback(() => {
    const headers = ['Fecha', 'Hora', 'Estudiante', 'Curso', 'UID Tarjeta', 'Resultado'];
    const rows = filteredAccesos.map((a) => [
      a.fecha || new Date(a.timestamp).toLocaleDateString('es-ES'),
      a.hora || new Date(a.timestamp).toLocaleTimeString('es-ES'),
      a.nombre_estudiante || 'Tarjeta no Asignada',
      a.curso || '—',
      a.uid_tarjeta,
      a.resultado,
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `accesos_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredAccesos]);

  // Exportar a PDF (versión simplificada con print)
  const exportPDF = useCallback(() => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const rows = filteredAccesos.map((a) => `
      <tr>
        <td>${a.fecha || new Date(a.timestamp).toLocaleDateString('es-ES')}</td>
        <td>${a.hora || new Date(a.timestamp).toLocaleTimeString('es-ES')}</td>
        <td>${a.nombre_estudiante || 'Tarjeta no Asignada'}</td>
        <td>${a.curso || '—'}</td>
        <td style="font-family:monospace;font-size:11px">${a.uid_tarjeta}</td>
        <td>${a.resultado === 'CONCEDIDO' ? 'Concedido' : 'Denegado'}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
      <head>
        <title>Historial de Accesos - R.A.C.E.R</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #333; font-size: 20px; margin-bottom: 5px; }
          p { color: #666; font-size: 12px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #1d4ed8; color: white; padding: 10px 12px; text-align: left; font-size: 12px; }
          td { padding: 8px 12px; border-bottom: 1px solid #eee; font-size: 12px; }
          tr:nth-child(even) { background: #f8f9fa; }
          .total { margin-top: 16px; font-size: 13px; color: #666; }
        </style>
      </head>
      <body>
        <h1>Historial de accesos - R.A.C.E.R</h1>
        <p>Generado el ${new Date().toLocaleString('es-ES')} | Total: ${filteredAccesos.length} registros</p>
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Hora</th>
              <th>Estudiante</th>
              <th>Curso</th>
              <th>UID Tarjeta</th>
              <th>Resultado</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
        <p class="total">Total de registros: ${filteredAccesos.length}</p>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }, [filteredAccesos]);

  // Estado de error
  if (error) {
    return (
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.04)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '40px',
          textAlign: 'center',
        }}
      >
        <div style={{ width: '40px', height: '40px', margin: '0 auto 16px', borderRadius: '12px', background: 'rgba(184, 100, 100, 0.12)', color: '#d8a0a0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700 }}>AL</div>
        <h3 style={{ color: 'white', fontSize: '18px', fontWeight: 600, margin: '0 0 8px' }}>
          {error.includes('permisos') ? 'Sin permisos' : 'Error de conexión'}
        </h3>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', margin: 0 }}>
          {error}
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        background: 'rgba(255, 255, 255, 0.04)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '20px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h3 style={{ color: 'white', fontSize: '18px', fontWeight: 600, margin: 0 }}>
            Historial de accesos
          </h3>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', margin: '4px 0 0' }}>
            {loading ? 'Cargando...' : `${filteredAccesos.length} registros`}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {/* Botón filtros */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              padding: '8px 14px',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              background: showFilters ? 'rgba(37, 99, 235, 0.18)' : 'transparent',
              color: showFilters ? '#dbe8ef' : 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 500,
              transition: 'all 0.2s ease',
            }}
          >
            Filtros
          </button>

          {/* Botón exportar CSV */}
          <button
            onClick={exportCSV}
            disabled={filteredAccesos.length === 0}
            style={{
              padding: '8px 14px',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              background: 'transparent',
              color: filteredAccesos.length === 0 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.5)',
              cursor: filteredAccesos.length === 0 ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              fontWeight: 500,
              transition: 'all 0.2s ease',
            }}
          >
            CSV
          </button>

          {/* Botón exportar PDF */}
          <button
            onClick={exportPDF}
            disabled={filteredAccesos.length === 0}
            style={{
              padding: '8px 14px',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              background: 'transparent',
              color: filteredAccesos.length === 0 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.5)',
              cursor: filteredAccesos.length === 0 ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              fontWeight: 500,
              transition: 'all 0.2s ease',
            }}
          >
            PDF
          </button>
        </div>
      </div>

      {/* Panel de filtros expandible */}
      {showFilters && (
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(255,255,255,0.02)',
          }}
        >
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'end' }}>
            {/* Buscador */}
            <div style={{ flex: '1', minWidth: '200px' }}>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: '11px', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Buscar estudiante, curso o UID
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Escribe para buscar..."
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.05)',
                  color: 'white',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Fecha desde */}
            <div>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: '11px', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Desde
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                style={{
                  padding: '10px 14px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.05)',
                  color: 'white',
                  fontSize: '13px',
                  outline: 'none',
                  colorScheme: 'dark',
                }}
              />
            </div>

            {/* Fecha hasta */}
            <div>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: '11px', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Hasta
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                style={{
                  padding: '10px 14px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.05)',
                  color: 'white',
                  fontSize: '13px',
                  outline: 'none',
                  colorScheme: 'dark',
                }}
              />
            </div>

            {/* Botón limpiar filtros */}
            <button
              onClick={() => {
                setSearchTerm('');
                setDateFrom('');
                setDateTo('');
                setFilter('todos');
              }}
              style={{
                padding: '10px 16px',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                background: 'transparent',
                color: 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 500,
                transition: 'all 0.2s ease',
              }}
            >
              ✕ Limpiar
            </button>
          </div>

          {/* Filtros rápidos por resultado */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            {(['todos', 'CONCEDIDO', 'DENEGADO'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '6px 14px',
                  border: '1px solid',
                  borderColor: filter === f ? 'rgba(37, 99, 235, 0.55)' : 'rgba(255,255,255,0.1)',
                  borderRadius: '20px',
                  background: filter === f ? 'rgba(37, 99, 235, 0.18)' : 'transparent',
                  color: filter === f ? '#dbe8ef' : 'rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: filter === f ? 600 : 400,
                  transition: 'all 0.2s ease',
                }}
              >
                {f === 'todos' ? 'Todos' : f === 'CONCEDIDO' ? 'Concedidos' : 'Denegados'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tabla */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr
              style={{
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                color: 'rgba(255,255,255,0.4)',
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              <th style={{ padding: '12px 24px', textAlign: 'left', fontWeight: 500 }}>Resultado</th>
              <th style={{ padding: '12px 24px', textAlign: 'left', fontWeight: 500 }}>Estudiante</th>
              <th style={{ padding: '12px 24px', textAlign: 'left', fontWeight: 500 }}>Curso</th>
              <th style={{ padding: '12px 24px', textAlign: 'left', fontWeight: 500 }}>Fecha</th>
              <th style={{ padding: '12px 24px', textAlign: 'left', fontWeight: 500 }}>Hora</th>
              <th style={{ padding: '12px 24px', textAlign: 'left', fontWeight: 500 }}>UID Tarjeta</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: '40px', textAlign: 'center' }}>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>
                    Cargando registros...
                  </div>
                </td>
              </tr>
            ) : filteredAccesos.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '40px', textAlign: 'center' }}>
                  <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>
                    {searchTerm || dateFrom || dateTo || filter !== 'todos'
                      ? 'No se encontraron registros con los filtros aplicados'
                      : 'No hay registros de acceso aún'}
                  </div>
                </td>
              </tr>
            ) : (
              paginatedAccesos.map((acceso) => {
                const resultadoStyle = getResultadoColor(acceso.resultado);
                return (
                  <tr
                    key={acceso.id}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      transition: 'background 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <td style={{ padding: '14px 24px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 500,
                          background: resultadoStyle.bg,
                          color: resultadoStyle.text,
                        }}
                      >
                        {resultadoStyle.label}
                      </span>
                    </td>
                    <td style={{ padding: '14px 24px', color: 'rgba(255,255,255,0.8)', fontSize: '13px', fontWeight: 500 }}>
                      {acceso.nombre_estudiante || <span style={{ color: 'rgba(255,255,255,0.35)', fontStyle: 'italic' }}>Tarjeta no Asignada</span>}
                    </td>
                    <td style={{ padding: '14px 24px', color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>
                      {acceso.curso}
                    </td>
                    <td style={{ padding: '14px 24px', color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>
                      {acceso.fecha || new Date(acceso.timestamp).toLocaleDateString('es-ES')}
                    </td>
                    <td style={{ padding: '14px 24px', color: 'rgba(255,255,255,0.7)', fontSize: '13px', fontFamily: 'monospace' }}>
                      {acceso.hora || formatTimestamp(acceso.timestamp)}
                    </td>
                    <td style={{ padding: '14px 24px', color: 'rgba(255,255,255,0.4)', fontSize: '12px', fontFamily: 'monospace' }}>
                      {acceso.uid_tarjeta}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {!loading && filteredAccesos.length > 0 && totalPages > 1 && (
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
            Mostrando {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredAccesos.length)} de {filteredAccesos.length} registros
          </span>

          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            {/* Primera página */}
            <button
              onClick={() => goToPage(1)}
              disabled={currentPage === 1}
              style={{
                padding: '6px 8px',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '6px',
                background: 'transparent',
                color: currentPage === 1 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.5)',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
            >
              <ChevronsLeft size={16} />
            </button>

            {/* Anterior */}
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              style={{
                padding: '6px 8px',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '6px',
                background: 'transparent',
                color: currentPage === 1 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.5)',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
            >
              <ChevronLeft size={16} />
            </button>

            {/* Números de página */}
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 7) {
                pageNum = i + 1;
              } else if (currentPage <= 4) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 3) {
                pageNum = totalPages - 6 + i;
              } else {
                pageNum = currentPage - 3 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => goToPage(pageNum)}
                  style={{
                    minWidth: '32px',
                    padding: '6px 8px',
                    border: '1px solid',
                    borderColor: currentPage === pageNum ? 'rgba(37, 99, 235, 0.55)' : 'rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    background: currentPage === pageNum ? 'rgba(37, 99, 235, 0.18)' : 'transparent',
                    color: currentPage === pageNum ? '#dbe8ef' : 'rgba(255,255,255,0.5)',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: currentPage === pageNum ? 600 : 400,
                    transition: 'all 0.15s ease',
                  }}
                >
                  {pageNum}
                </button>
              );
            })}

            {/* Siguiente */}
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              style={{
                padding: '6px 8px',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '6px',
                background: 'transparent',
                color: currentPage === totalPages ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.5)',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
            >
              <ChevronRight size={16} />
            </button>

            {/* Última página */}
            <button
              onClick={() => goToPage(totalPages)}
              disabled={currentPage === totalPages}
              style={{
                padding: '6px 8px',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '6px',
                background: 'transparent',
                color: currentPage === totalPages ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.5)',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
