// Página de inicio: Muestra un Pokémon aleatorio.
"use client";

import { useState, useEffect } from "react";
import { Container, Row, Col } from "react-bootstrap";
import PokemonCard from "@/app/components/PokemonCard/PokemonCard";
import { useLanguage } from "./idioma/GestorIdioma";

interface PokemonData {
  id: number;
  name: string;
  image: string;
}

// Función para obtener un Pokémon aleatorio desde la API
const getRandomPokemon = async (): Promise<PokemonData | null> => {
  try {
    const randomId = Math.floor(Math.random() * 1010) + 1;
    const response = await fetch(
      `https://pokeapi.co/api/v2/pokemon/${randomId}`,
    );
    const data = await response.json();

    return {
      id: data.id,
      name: data.name,
      image:
        data.sprites.other["official-artwork"].front_default ||
        data.sprites.front_default,
    };
  } catch (error) {
    return null;
  }
};

// Componente principal de la página de inicio
export default function Home() {
  // Usamos el hook de idioma para textos traducibles
  const { dict } = useLanguage();
  // Estado para guardar el Pokémon obtenido
  const [randomPokemon, setRandomPokemon] = useState<PokemonData | null>(null);
  const [loading, setLoading] = useState(true);

  // Efecto que carga un Pokémon al montar el componente
  useEffect(() => {
    console.log("Idioma actual:", dict);
    console.log("Diccionario actual:", dict);
    getRandomPokemon().then((pokemon) => {
      setRandomPokemon(pokemon);
      setLoading(false);
    });
  }, []);

  return (
    // Contenedor principal de la página
    <Container className="my-5 d-flex flex-column align-items-center">
      {/* Título principal de la página */}
      <h1 className="text-center mb-4">{dict.title}</h1>

      {/* Descripción de bienvenida traducida al idioma seleccionado */}
      <h2 className="welcome-description">{dict.description}</h2>

      {/* Contenedor para mostrar el card del Pokémon */}
      <Row className="justify-content-center w-100">
        <Col className="card-container">
          {/* Mostrar un mensaje de carga mientras se obtiene el Pokémon */}
          {loading ? (
            <p>{dict.loading}</p>
          ) : randomPokemon ? (
            // Mostrar el card del Pokémon si se obtuvo correctamente
            <PokemonCard
              id={randomPokemon.id}
              name={randomPokemon.name}
              image={randomPokemon.image}
            />
          ) : (
            // Mostrar un mensaje de error si no se pudo obtener el Pokémon
            <p>{dict.error}</p>
          )}
        </Col>
      </Row>
    </Container>
  );
}
