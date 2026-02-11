// Diseño principal de la aplicación (Header, Footer, Idioma y Contenido).

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";
import { LanguageProvider } from "./idioma/GestorIdioma";
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";

// Configuración de las fuentes personalizadas usando Google Fonts
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Metadatos globales de la aplicación, como el título y la descripción
export const metadata: Metadata = {
  title: "Aplicacion de NextJS",
  description: "Pagina generada desde Next.js",
  icons: { icon: "/next.svg" },
};

// Componente principal del diseño raíz
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head></head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {/* Proveedor de idioma para manejar la traducción en toda la aplicación */}
        <LanguageProvider>
          <div className="d-flex flex-column min-vh-100">
            {/* Encabezado común para todas las páginas */}
            <Header />

            {/* Contenedor principal para el contenido dinámico */}
            <main className="flex-grow-1">{children}</main>

            {/* Pie de página común para todas las páginas */}
            <Footer />
          </div>
        </LanguageProvider>
      </body>
    </html>
  );
}
