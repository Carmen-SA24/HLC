// Página de Error 404 (Ruta no encontrada).
import Link from "next/link";
import styles from "./not-found.module.css";

export default function NotFound() {
  return (
    // Contenedor de la página de error.
    <div className={styles.container}>
      {/* Imagen que representa el error 404 */}
      <img
        src="/error.png"
        alt="Página no encontrada"
        className={styles.image}
      />

      {/* Botón para redirigir al usuario a la página de inicio */}
      <Link href="/" className={`btn btn-primary ${styles.button}`}>
        Volver al Inicio
      </Link>
    </div>
  );
}
