'use client';

// Importa proveedor de autenticación
import { AuthProvider } from '@/context/AuthContext';
import { NotificationProvider } from '@/context/NotificationContext';
import './globals.css';

// Layout principal - envuelve toda la app
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body suppressHydrationWarning>
        {/* Proveedor de notificaciones */}
        <NotificationProvider>
          {/* Proveedor de autenticación - disponible en toda la app */}
          <AuthProvider>
            {children}
          </AuthProvider>
        </NotificationProvider>
      </body>
    </html>
  );
}
