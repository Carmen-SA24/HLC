'use client';

import { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  color?: string;
  trend?: {
    value: number;
    isUp: boolean;
  };
  loading?: boolean;
}

export default function StatsCard({
  title,
  value,
  subtitle,
  icon,
  color = '#2563eb',
  trend,
  loading = false,
}: StatsCardProps) {
  return (
    <div
      style={{
        background: 'rgba(13, 19, 33, 0.70)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(148, 163, 184, 0.10)',
        borderRadius: '14px',
        padding: '22px',
        transition: 'border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease',
        cursor: 'default',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = '0 10px 32px rgba(0,0,0,0.22)';
        e.currentTarget.style.borderColor = `${color}44`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.10)';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div
            style={{
              color: 'rgba(148,163,184,0.65)',
              fontSize: '12px',
              fontWeight: 500,
              marginBottom: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.6px',
            }}
          >
            {title}
          </div>

          {loading ? (
            <div
              style={{
                width: '72px',
                height: '30px',
                background: 'rgba(255,255,255,0.07)',
                borderRadius: '6px',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
          ) : (
            <div
              style={{
                color: '#f1f5f9',
                fontSize: '30px',
                fontWeight: 700,
                letterSpacing: '-1px',
                lineHeight: 1.1,
              }}
            >
              {value}
            </div>
          )}

          {subtitle && (
            <div style={{ color: 'rgba(148,163,184,0.45)', fontSize: '12px', marginTop: '4px' }}>
              {subtitle}
            </div>
          )}
        </div>

        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: `${color}18`,
            border: `1px solid ${color}28`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: color,
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
      </div>

      {trend && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            marginTop: '14px',
            paddingTop: '14px',
            borderTop: '1px solid rgba(148,163,184,0.06)',
          }}
        >
          {trend.isUp
            ? <TrendingUp size={13} color="#34d399" />
            : <TrendingDown size={13} color="#f87171" />}
          <span style={{ color: trend.isUp ? '#34d399' : '#f87171', fontSize: '13px', fontWeight: 600 }}>
            {Math.abs(trend.value)}%
          </span>
          <span style={{ color: 'rgba(148,163,184,0.38)', fontSize: '12px' }}>del total hoy</span>
        </div>
      )}
    </div>
  );
}
