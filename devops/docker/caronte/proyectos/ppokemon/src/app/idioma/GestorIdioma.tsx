"use client"; // Necesario para hooks en componentes Next.js

import { createContext, useContext, useState } from "react";
import { getDictionary } from "./diccionario";

// Permite usar el idioma en cualquier componente de la web.
const LanguageContext = createContext(null);

// Proveedor que gestiona el idioma y el diccionario
export function LanguageProvider({ children }) {
  const [idioma, setIdioma] = useState("es"); // Idioma por defecto: español
  const dict = getDictionary(idioma);
  return (
    <LanguageContext.Provider value={{ idioma, setIdioma, dict }}>
      {children}
    </LanguageContext.Provider>
  );
}

// Hook personalizado para acceder al idioma y funciones
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage debe usarse dentro de LanguageProvider");
  }
  return context;
}
