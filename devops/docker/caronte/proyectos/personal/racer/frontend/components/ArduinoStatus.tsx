'use client';

import { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  getDocs,
  where,
} from 'firebase/firestore';

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

export default function ArduinoStatus() {
  const [ultimoAcceso, setUltimoAcceso] = useState<Acceso | null>(null);
  const [conectado, setConectado] = useState(false);
  const [ultimaConexion, setUltimaConexion] = useState<string>('—');
  const [totalHoy, setTotalHoy] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [flashAnim, setFlashAnim] = useState(false);
  const [ultimosAccesos, setUltimosAccesos] = useState<Acceso[]>([]);
  const prevAccesoRef = useRef<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let active = true;

    const setupListeners = async () => {
      try {
        // Cargar datos iniciales con getDocs
        const q = query(
          collection(db, 'accesos'),
          orderBy('timestamp', 'desc'),
          limit(10)
        );

        const snapshot = await getDocs(q);
        
        if (!active) return;

        if (!snapshot.empty) {
          const docs = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Acceso[];
          
          setUltimosAccesos(docs);
          setUltimoAcceso(docs[0]);

          const ahora = Date.now();
          const diffMs = ahora - docs[0].timestamp;
          setConectado(diffMs < 30000);
          setUltimaConexion(docs[0].hora || new Date(docs[0].timestamp).toLocaleTimeString('es-ES'));
        }

        // Contar accesos de hoy
        const inicioHoy = new Date();
        inicioHoy.setHours(0, 0, 0, 0);
        const finHoy = new Date();
        finHoy.setHours(23, 59, 59, 999);

        const qHoy = query(
          collection(db, 'accesos'),
          where('timestamp', '>=', inicioHoy.getTime()),
          where('timestamp', '<=', finHoy.getTime()),
          orderBy('timestamp', 'desc')
        );

        const hoySnapshot = await getDocs(qHoy);
        if (!active) return;
        setTotalHoy(hoySnapshot.size);
        setLoading(false);
        setError(null);

        // Listener en tiempo real para accesos en vivo
        const unsubscribe = onSnapshot(
          q,
          (snap) => {
            if (!active || snap.empty) return;
            const docs = snap.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })) as Acceso[];
            
            setUltimosAccesos(docs);
            const nuevo = docs[0];
            setUltimoAcceso(nuevo);

            // Detectar si es un nuevo acceso (cambio de ID)
            if (prevAccesoRef.current && prevAccesoRef.current !== nuevo.id) {
              setFlashAnim(true);
              setTimeout(() => setFlashAnim(false), 2000);
            }
            prevAccesoRef.current = nuevo.id;

            const ahora = Date.now();
            const diffMs = ahora - nuevo.timestamp;
            setConectado(diffMs < 30000);
            setUltimaConexion(nuevo.hora || new Date(nuevo.timestamp).toLocaleTimeString('es-ES'));
          },
          (err) => {
            console.warn('Error en listener ArduinoStatus:', err.message);
          }
        );

        unsubscribeRef.current = unsubscribe;
      } catch (err: any) {
        if (!active) return;
        
        if (err.code === 'permission-denied') {
          setError('Sin permisos para leer accesos');
        } else if (err.code === 'failed-precondition') {
          setError('Índices de Firestore pendientes de creación');
        } else {
          setError(`Error: ${err.message}`);
        }
        setLoading(false);
      }
    };

    setupListeners();

    return () => {
      active = false;
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  if (error) {
    return (
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.04)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <span style={{ width: '24px', height: '24px', borderRadius: '8px', background: 'rgba(37, 99, 235, 0.18)', color: '#dbe8ef', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700 }}>RF</span>
          <div>
            <h3 style={{ color: 'white', fontSize: '18px', fontWeight: 600, margin: 0 }}>
              Estado del Lector RFID
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', margin: '4px 0 0' }}>
              {error.includes('permisos') ? 'Sin permisos de acceso' : 'Error de conexión'}
            </p>
          </div>
        </div>
        <div
          style={{
            padding: '16px',
            background: 'rgba(184, 100, 100, 0.12)',
            borderRadius: '12px',
            color: '#d8a0a0',
            fontSize: '13px',
          }}
        >
          {error}
        </div>
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
        padding: '24px',
        transition: 'border-color 0.3s ease',
        borderColor: flashAnim ? 'rgba(37, 99, 235, 0.4)' : 'rgba(255, 255, 255, 0.08)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <div>
          <h3 style={{ color: 'white', fontSize: '18px', fontWeight: 600, margin: 0 }}>
            Lector RFID en vivo
          </h3>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', margin: '4px 0 0' }}>
            {loading ? 'Conectando...' : conectado ? 'Recibiendo datos del Arduino' : 'Esperando conexión...'}
          </p>
        </div>

        {/* Indicador de conexión */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '20px',
            background: loading
              ? 'rgba(255,255,255,0.05)'
              : conectado
              ? 'rgba(79, 143, 115, 0.12)'
              : 'rgba(184, 100, 100, 0.12)',
          }}
        >
          <span
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: loading
                ? 'rgba(255,255,255,0.2)'
                : conectado
                ? '#9fd3ba'
                : '#d8a0a0',
              boxShadow: !loading && conectado
                ? '0 0 8px rgba(79, 143, 115, 0.45)'
                : !loading && !conectado
                ? '0 0 8px rgba(184, 100, 100, 0.45)'
                : 'none',
              animation: !loading && conectado ? 'pulse 2s ease-in-out infinite' : 'none',
            }}
          />
          <span
            style={{
              color: loading
                ? 'rgba(255,255,255,0.3)'
                : conectado
                ? '#9fd3ba'
                : '#d8a0a0',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            {loading ? 'Verificando...' : conectado ? 'En línea' : 'Desconectado'}
          </span>
        </div>
      </div>

      {/* Grid de información */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        <InfoBox
          label="Accesos Hoy"
          value={loading ? '...' : String(totalHoy)}
          size="large"
        />
        <InfoBox
          label="Último Acceso"
          value={loading ? '...' : ultimaConexion}
        />
        <InfoBox
          label="Último Estudiante"
          value={loading ? '...' : (ultimoAcceso?.nombre_estudiante || '—')}
        />
        <InfoBox
          label="Último Resultado"
          value={loading ? '...' : (ultimoAcceso?.resultado === 'CONCEDIDO' ? 'Concedido' : ultimoAcceso?.resultado === 'DENEGADO' ? 'Denegado' : '—')}
          color={ultimoAcceso?.resultado === 'CONCEDIDO' ? '#9fd3ba' : ultimoAcceso?.resultado === 'DENEGADO' ? '#d8a0a0' : undefined}
        />
      </div>

      {/* Últimos accesos en tiempo real */}
      {ultimosAccesos.length > 0 && (
        <div
          style={{
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '12px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 500 }}>
              Últimas lecturas
            </span>
            {flashAnim && (
              <span
                style={{
                  color: '#9fd3ba',
                  fontSize: '11px',
                  fontWeight: 600,
                  animation: 'fadeInOut 2s ease',
                }}
              >
                Nueva tarjeta detectada
              </span>
            )}
          </div>
          {ultimosAccesos.slice(0, 5).map((acceso, index) => (
            <div
              key={acceso.id}
              style={{
                padding: '10px 16px',
                borderBottom: index < Math.min(ultimosAccesos.length, 5) - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                animation: index === 0 && flashAnim ? 'slideIn 0.3s ease' : 'none',
                background: index === 0 && flashAnim ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
                transition: 'background 0.3s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '16px', height: '16px', borderRadius: '999px', background: acceso.resultado === 'CONCEDIDO' ? '#9fd3ba' : '#d8a0a0', display: 'inline-block' }} />
                <div>
                  <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', fontWeight: 500 }}>
                    {acceso.nombre_estudiante}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>
                    {acceso.curso} · <span style={{ fontFamily: 'monospace' }}>{acceso.uid_tarjeta}</span>
                  </div>
                </div>
              </div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontFamily: 'monospace' }}>
                {acceso.hora || new Date(acceso.timestamp).toLocaleTimeString('es-ES')}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Información del bridge */}
      <div
        style={{
          marginTop: '16px',
          padding: '16px',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '12px',
        }}
      >
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginBottom: '8px' }}>
          El puente Arduino {'→'} Firebase utiliza el script{' '}
          <code style={{ color: '#dbe8ef', background: 'rgba(37,99,235,0.18)', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>
            puente_firebase.py
          </code>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', lineHeight: 1.6 }}>
          • Conexión vía puerto serie (USB) con protocolo Store {'&'} Forward<br />
          • Cola local de respaldo si Firebase no está disponible<br />
          • Sincronización automática cada 5 segundos
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateY(-5px); }
          20% { opacity: 1; transform: translateY(0); }
          80% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

function InfoBox({
  label,
  value,
  size,
  mono,
  color,
}: {
  label: string;
  value: string;
  size?: 'normal' | 'large';
  mono?: boolean;
  color?: string;
}) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '12px',
        padding: '16px',
      }}
    >
      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
        {label}
      </div>
      <div
        style={{
          color: color || 'white',
          fontSize: size === 'large' ? '28px' : mono ? '13px' : '16px',
          fontWeight: size === 'large' ? 700 : 600,
          fontFamily: mono ? 'monospace' : undefined,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {value}
      </div>
    </div>
  );
}
