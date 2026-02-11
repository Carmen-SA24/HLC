"use client";

import { useState, useEffect } from "react";
import { Container, Row, Col } from "react-bootstrap";
import PokemonCard from "@/app/components/PokemonCard/PokemonCard";
import Image from "next/image";
import styles from "./Generacion.module.css";
import { useLanguage } from "../../idioma/GestorIdioma";

// Rangos de IDs para cada generación de Pokémon
const POKEMON_RANGES = {
  1: { min: 1, max: 151 },
  2: { min: 152, max: 251 },
  3: { min: 252, max: 386 },
};

// Devuelve un ID aleatorio entre min y max
const getRandomPokemonId = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Obtiene 10 Pokémon aleatorios de la generación indicada
const fetchPokemonByGen = async (gen) => {
  const range = POKEMON_RANGES[gen];
  const promises = [];
  for (let i = 0; i < 10; i++) {
    const id = getRandomPokemonId(range.min, range.max);
    const url = `https://pokeapi.co/api/v2/pokemon/${id}`;
    promises.push(
      fetch(url)
        .then((res) => res.json())
        .then((data) => ({
          id: data.id,
          name: data.name,
          image:
            data.sprites.other["official-artwork"].front_default ||
            data.sprites.front_default,
          stats: {
            hp: data.stats[0].base_stat,
            attack: data.stats[1].base_stat,
            defense: data.stats[2].base_stat,
          },
        })),
    );
  }
  return Promise.all(promises);
};

// Página que muestra 10 Pokémon aleatorios según la generación de la URL
export default function GeneracionPage({ params }) {
  const { dict } = useLanguage(); // Usar el diccionario de idiomas

  const [generation, setGeneration] = useState(null); // Generación seleccionada
  const [pokemonList, setPokemonList] = useState([]); // Lista de Pokémon
  const [loading, setLoading] = useState(true); // Estado de carga

  // Obtiene el parámetro de generación de la URL
  useEffect(() => {
    async function processParams() {
      try {
        const resolvedParams = await params;
        setGeneration(parseInt(resolvedParams.id, 10));
      } catch {
        setGeneration(parseInt(params.id, 10));
      }
    }
    processParams();
  }, [params]);

  // Carga los Pokémon cuando cambia la generación
  useEffect(() => {
    if (!generation || generation < 1 || generation > 3 || isNaN(generation)) {
      if (generation !== null) {
        // Usar un setTimeout para evitar renderizados en cascada
        setTimeout(() => {
          setPokemonList([]);
          setLoading(false);
        }, 0);
      }
      return;
    }

    setLoading(true); // Mover esta llamada fuera del efecto directo

    const fetchData = async () => {
      const delay = new Promise((resolve) => setTimeout(resolve, 500));
      try {
        const [data] = await Promise.all([fetchPokemonByGen(generation), delay]);
        setPokemonList(data);
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [generation]);

  // Si la generación no es válida, muestra mensaje
  if (!generation || generation < 1 || generation > 3) {
    return (
      <Container className="my-5 text-center">
        <Image
          src="/error.png"
          alt="Generación no válida"
          width={400}
          height={400}
          className={styles.errorImage}
        />
      </Container>
    );
  }

  // Render principal: muestra los Pokémon o el mensaje de carga
  return (
    <Container fluid className="my-5">
      {/* Título traducible de la generación */}
      <h2 className="mb-4 text-center">
        {dict.generationTitle} {generation}
      </h2>
      {loading ? (
        <div className={styles.loadingContainer}>
          <Image
            src="/pikachu.gif"
            alt="Cargando..."
            width={200}
            height={200}
            className={styles.loadingImage}
          />
        </div>
      ) : (
        <Row xs={1} md={2} lg={5} className="g-4 mb-5">
          {pokemonList.map((pokemon, index) => (
            <Col key={`${pokemon.id}-${index}`}>
              <PokemonCard
                id={pokemon.id}
                name={pokemon.name}
                image={pokemon.image}
                stats={{ hp: 0, attack: 0, defense: 0 }}
              />
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
}
