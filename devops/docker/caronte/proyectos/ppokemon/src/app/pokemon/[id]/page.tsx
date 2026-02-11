"use client";

// Importamos Link y los estilos modulares
import Link from "next/link";

import styles from "./Detail.module.css";
import PokemonCard from "../../components/PokemonCard/PokemonCard";
import React, { useState, useEffect } from "react";
import { Container, Row, Col } from "react-bootstrap";

// Función para obtener los detalles completos de un Pokémon por ID
async function fetchPokemonDetail(id: string) {
  try {
    console.log(`Fetching Pokémon with ID: ${id}`); // Registro del ID solicitado
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);

    if (!res.ok) {
      console.error(`Error al obtener el Pokémon con ID ${id}:`, res.status);
      return null;
    }

    const data = await res.json();
    console.log("Datos del Pokémon obtenidos:", data); // Registro de los datos obtenidos

    return {
      id: data.id,
      name: data.name,
      image: data.sprites.other["official-artwork"].front_default,
      stats: {
        hp: data.stats[0].base_stat,
        attack: data.stats[1].base_stat,
        defense: data.stats[2].base_stat,
      },
    };
  } catch (error) {
    console.error(
      `Error al realizar la solicitud para el Pokémon con ID ${id}:`,
      error,
    );
    return null;
  }
}

// Componente de página de detalle que recibe el
export default function PokemonDetail({
  params: promiseParams,
}: {
  params: Promise<{ id: string }>;
}) {
  const [params, setParams] = useState<{ id: string } | null>(null);
  const [pokemon, setPokemon] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function resolveParams() {
      const resolvedParams = await promiseParams;
      setParams(resolvedParams);
      const { id } = resolvedParams;

      if (!id) {
        console.error(
          "El ID no se recibió correctamente desde los parámetros de la ruta.",
        );
        return;
      }

      const fetchedPokemon = await fetchPokemonDetail(id);
      setPokemon(fetchedPokemon);
      setLoading(false);
    }

    resolveParams();
  }, [promiseParams]);

  if (loading) {
    return <div className={styles.container}>Cargando...</div>;
  }

  if (!params || !pokemon) {
    return (
      <div className={styles.container}>
        <h1>Error: ID no válido o Pokémon no encontrado</h1>
        <Link href="/pokemon" className={styles.backLink}>
          ⬅ Volver al listado
        </Link>
      </div>
    );
  }

  console.log("Datos del Pokémon que se pasan a PokemonCard:", pokemon);

  return (
    <Container className="my-5 d-flex flex-column align-items-center">
      <Row className="justify-content-center w-100">
        <Col className="card-container">
          <Link href="/pokemon" className={styles.backLink}>
            ⬅ Volver al listado
          </Link>
          <PokemonCard
            id={pokemon.id}
            name={pokemon.name}
            image={pokemon.image}
            stats={pokemon.stats}
          />
        </Col>
      </Row>
    </Container>
  );
}
