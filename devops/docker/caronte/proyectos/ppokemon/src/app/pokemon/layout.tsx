// Diseño base común para todas las rutas dentro de /pokemon
import type { Metadata } from "next";
import Link from "next/link";

// Metadatos de la página (título e icono).
export const metadata: Metadata = {
  title: "Página de Pokémon — NextJS",
  description: "Página de pokémons creada con Next.js",
  icons: { icon: "/globe.svg" },
};

export default function PokemonLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <section className="container py-4">
      {/* Encabezado con título y botón de volver */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Pokémon</h2>
        <Link href="/pokemon" className="btn btn-sm btn-outline-secondary">
          Volver
        </Link>
      </div>

      {/* Aquí se cargan las páginas (lista o detalle) */}
      <div>{children}</div>
    </section>
  );
}
