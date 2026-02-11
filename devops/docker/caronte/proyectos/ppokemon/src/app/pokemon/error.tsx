// Se activa si falla la carga de datos o hay un error en la ruta /pokemon.
"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void; // Función para reintentar la carga
}) {
  useEffect(() => {
    console.error("Error:", error);
  }, [error]);

  // Interfaz de error que ve el usuario (mensaje + botón).
  return (
    <div className="text-center mt-5">
      <h2>¡Algo salió mal al cargar!</h2>
      <button onClick={() => reset()} className="btn btn-primary mt-3">
        Intentar de nuevo
      </button>
    </div>
  );
}
