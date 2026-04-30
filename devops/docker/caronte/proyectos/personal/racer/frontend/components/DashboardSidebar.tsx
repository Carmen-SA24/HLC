'use client';

import React, { useState } from 'react';
import { useAuth, UserRole } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ClipboardList,
  CreditCard,
  Users,
  BarChart2,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
  roles?: UserRole[];
  section?: string;
}

interface DashboardSidebarProps {
  activeSection?: string;
  onSectionChange?: (section: any) => void;
}

const THEME = {
  accent:       '#2563eb',
  accentSoft:   'rgba(37, 99, 235, 0.12)',
  accentBorder: 'rgba(37, 99, 235, 0.35)',
  surface:      'rgba(8, 12, 18, 0.95)',
  surfaceHover: 'rgba(255,255,255,0.04)',
  border:       'rgba(148,163,184,0.09)',
  textSoft:     'rgba(226,232,240,0.55)',
} as const;

export default function DashboardSidebar({ activeSection, onSectionChange }: DashboardSidebarProps) {
  const { user, logout, hasRole } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const isSuperadmin = hasRole('superadmin');
  const isAdmin = hasRole('admin') || isSuperadmin;

  const getRoleLabel = () => {
    if (isSuperadmin) return 'Superadmin';
    if (isAdmin) return 'Administrador';
    return 'Viewer';
  };

  const navItems: NavItem[] = [
    {
      id: 'resumen',
      label: 'Panel Principal',
      icon: <LayoutDashboard size={17} strokeWidth={1.6} />,
      section: 'resumen',
    },
    {
      id: 'accesos',
      label: 'Registros de Acceso',
      icon: <ClipboardList size={17} strokeWidth={1.6} />,
      roles: ['superadmin', 'admin', 'viewer'],
      section: 'accesos',
    },
    {
      id: 'tarjetas',
      label: 'Tarjetas RFID',
      icon: <CreditCard size={17} strokeWidth={1.6} />,
      roles: ['superadmin', 'admin'],
      section: 'tarjetas',
    },
    {
      id: 'usuarios',
      label: 'Usuarios',
      icon: <Users size={17} strokeWidth={1.6} />,
      roles: ['superadmin'],
      section: 'usuarios',
    },
    {
      id: 'reportes',
      label: 'Reportes',
      icon: <BarChart2 size={17} strokeWidth={1.6} />,
      roles: ['superadmin', 'admin', 'viewer'],
      section: 'reportes',
    },
    {
      id: 'configuracion',
      label: 'Configuración',
      icon: <Settings size={17} strokeWidth={1.6} />,
      roles: ['superadmin'],
      section: 'configuracion',
    },
  ];

  const filteredItems = navItems.filter(
    (item) => !item.roles || item.roles.some((r) => hasRole(r as UserRole))
  );

  return (
    <>
      <aside
        style={{
          width: collapsed ? '68px' : '256px',
          minHeight: '100vh',
          background: THEME.surface,
          backdropFilter: 'blur(20px)',
          borderRight: `1px solid ${THEME.border}`,
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.25s ease',
          position: 'fixed',
          left: 0,
          top: 0,
          zIndex: 100,
        }}
      >
        {/* Logo */}
        <div
          style={{
            padding: collapsed ? '18px 14px' : '20px 18px',
            borderBottom: `1px solid ${THEME.border}`,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div
            style={{
              width: '34px',
              height: '34px',
              background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
              borderRadius: '9px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              flexShrink: 0,
              boxShadow: '0 3px 10px rgba(37,99,235,0.25)',
            }}
          >
            <Shield size={17} strokeWidth={1.8} />
          </div>
          {!collapsed && (
            <div>
              <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '15px', lineHeight: 1.2 }}>
                R.A.C.E.R
              </div>
              <div style={{ color: 'rgba(148,163,184,0.55)', fontSize: '10.5px', marginTop: '1px' }}>
                Control de Acceso
              </div>
            </div>
          )}
        </div>

        {/* User profile */}
        {!collapsed && (
          <div
            style={{
              padding: '14px 18px',
              borderBottom: `1px solid ${THEME.border}`,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 600,
                fontSize: '14px',
                flexShrink: 0,
              }}
            >
              {user?.nombre?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div
                style={{
                  color: '#e2e8f0',
                  fontWeight: 600,
                  fontSize: '13px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {user?.nombre ? `${user.nombre} ${user.apellidos}` : 'Usuario'}
              </div>
              <div style={{ color: 'rgba(148,163,184,0.50)', fontSize: '11px', marginTop: '1px' }}>
                {getRoleLabel()}
              </div>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
          {filteredItems.map((item) => {
            const isActive = item.section ? activeSection === item.section : pathname === item.href;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.section && onSectionChange) {
                    onSectionChange(item.section);
                  } else if (item.href) {
                    router.push(item.href);
                  }
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: collapsed ? '10px 0' : '10px 14px',
                  marginBottom: '2px',
                  border: isActive ? `1px solid ${THEME.accentBorder}` : '1px solid transparent',
                  borderRadius: '9px',
                  background: isActive ? THEME.accentSoft : 'transparent',
                  color: isActive ? '#93c5fd' : THEME.textSoft,
                  cursor: 'pointer',
                  fontSize: '13.5px',
                  fontWeight: isActive ? 600 : 400,
                  transition: 'all 0.15s ease',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = THEME.surfaceHover;
                    e.currentTarget.style.color = 'rgba(226,232,240,0.85)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = THEME.textSoft;
                  }
                }}
                title={collapsed ? item.label : undefined}
              >
                <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  {item.icon}
                </span>
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div style={{ padding: '8px 8px 12px', borderTop: `1px solid ${THEME.border}` }}>
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: '10px',
              padding: collapsed ? '10px 0' : '10px 14px',
              border: '1px solid transparent',
              borderRadius: '9px',
              background: 'transparent',
              color: 'rgba(148,163,184,0.45)',
              cursor: 'pointer',
              fontSize: '13.5px',
              marginBottom: '2px',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = THEME.surfaceHover;
              e.currentTarget.style.color = 'rgba(226,232,240,0.75)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'rgba(148,163,184,0.45)';
            }}
            title={collapsed ? 'Expandir' : undefined}
          >
            <span style={{ display: 'flex', alignItems: 'center' }}>
              {collapsed ? <ChevronRight size={17} strokeWidth={1.6} /> : <ChevronLeft size={17} strokeWidth={1.6} />}
            </span>
            {!collapsed && <span>Colapsar</span>}
          </button>

          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: '10px',
              padding: collapsed ? '10px 0' : '10px 14px',
              border: '1px solid transparent',
              borderRadius: '9px',
              background: 'transparent',
              color: 'rgba(248,113,113,0.60)',
              cursor: 'pointer',
              fontSize: '13.5px',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(248,113,113,0.08)';
              e.currentTarget.style.color = '#f87171';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'rgba(248,113,113,0.60)';
            }}
            title={collapsed ? 'Cerrar sesión' : undefined}
          >
            <span style={{ display: 'flex', alignItems: 'center' }}>
              <LogOut size={17} strokeWidth={1.6} />
            </span>
            {!collapsed && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* Spacer */}
      <div style={{ width: collapsed ? '68px' : '256px', flexShrink: 0, transition: 'width 0.25s ease' }} />
    </>
  );
}
