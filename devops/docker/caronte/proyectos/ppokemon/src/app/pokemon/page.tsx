// Importamos Link para navegación entre páginas
import Link from "next/link";
import styles from "./List.module.css";

// Función que obtiene la lista de los primeros 20 Pokémon de la API
async function getPokemons() {
  const res = await fetch("https://pokeapi.co/api/v2/pokemon?limit=20");
  const data = await res.json();

  return data.results.map((p, index) => ({
    name: p.name,
    id: index + 1,
  }));
}

// Componente principal que muestra el listado de Pokémon
export default async function Page() {
  // Llamada a la API para obtener el listado de Pokémon.
  const pokemons = await getPokemons();

  return (
    // Contenedor visual de la página.
    <div className={styles.container}>
      <h1 className={styles.title}>LISTADO DE POKÉMON</h1>
      <hr className={styles.separator} />

      <ul className={styles.list}>
        {pokemons.map((pokemon) => (
          <li key={pokemon.id}>
            <Link href={`/pokemon/${pokemon.id}`} className={styles.link}>
              {pokemon.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
