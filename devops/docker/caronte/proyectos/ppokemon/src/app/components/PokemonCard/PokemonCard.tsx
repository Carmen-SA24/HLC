// "use client" indica que este componente usa interactividad del cliente (hooks)
"use client";

import { useState } from "react";
// Importamos componentes visuales de Bootstrap (Renombramos Card para evitar conflictos)
import {
  Card as BootstrapCard,
  Modal,
  ProgressBar,
  Badge,
  Button,
} from "react-bootstrap";
// Importamos los estilos CSS específicos para esta tarjeta
import styles from "./PokemonCard.module.css";

// Interfaz que define las propiedades que recibe la tarjeta
interface PokemonCardProps {
  id: number;
  name: string;
  image: string;
  stats?: {
    hp: number;
    attack: number;
    defense: number;
  };
}

// Interfaz para los detalles extendidos del Pokémon
interface PokemonDetails {
  height: number;
  weight: number;
  types: string[];
  stats: {
    hp: number;
    attack: number;
    defense: number;
    speed: number;
  };
}

// Componente visual que muestra la información de un Pokémon individual
const PokemonCard: React.FC<PokemonCardProps> = ({
  id,
  name,
  image,
  stats,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [details, setDetails] = useState<PokemonDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [previousPath, setPreviousPath] = useState("/");

  // Función para obtener los detalles al abrir el modal
  const handleDetailClick = async () => {
    // Guardamos la ruta actual antes de cambiarla
    if (typeof window !== "undefined") {
      setPreviousPath(window.location.pathname);
      window.history.pushState(null, "", `/pokemon/${id}`);
    }

    setShowModal(true);
    if (!details) {
      setLoading(true);
      try {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
        const data = await res.json();

        // Diccionario de tipos en español
        const typeTranslations: { [key: string]: string } = {
          normal: "Normal",
          fighting: "Lucha",
          flying: "Volador",
          poison: "Veneno",
          ground: "Tierra",
          rock: "Roca",
          bug: "Bicho",
          ghost: "Fantasma",
          steel: "Acero",
          fire: "Fuego",
          water: "Agua",
          grass: "Planta",
          electric: "Eléctrico",
          psychic: "Psíquico",
          ice: "Hielo",
          dragon: "Dragón",
          dark: "Siniestro",
          fairy: "Hada",
          unknown: "Desconocido",
          shadow: "Sombra",
        };

        setDetails({
          height: data.height / 10, // Convertir a metros
          weight: data.weight / 10, // Convertir a kg
          types: data.types.map(
            (t: { type: { name: string } }) =>
              typeTranslations[t.type.name] || t.type.name,
          ),
          stats: {
            hp: data.stats[0].base_stat,
            attack: data.stats[1].base_stat,
            defense: data.stats[2].base_stat,
            speed: data.stats[5].base_stat,
          },
        });
      } catch (error) {
        console.error("Error fetching details:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleClose = () => {
    setShowModal(false);
    // Restauramos la URL original al cerrar
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", previousPath);
    }
  };

  return (
    <>
      <BootstrapCard className={`h-100 shadow border-0 ${styles.card}`}>
        {image && (
          <div className="d-flex justify-content-center pt-4">
            <div className={styles.imageContainer}>
              <BootstrapCard.Img
                variant="top"
                src={image}
                className={styles.pokemonImage}
              />
            </div>
          </div>
        )}

        <BootstrapCard.Body className="text-center d-flex flex-column align-items-center">
          <BootstrapCard.Title
            className={`text-capitalize display-6 mb-1 ${styles.name}`}
          >
            {name}
          </BootstrapCard.Title>
          <BootstrapCard.Text className={`mb-4 ${styles.id}`}>
            #{id}
          </BootstrapCard.Text>

          <button
            className={`btn rounded-pill shadow-sm ${styles.buttonProfessional}`}
            onClick={handleDetailClick}
          >
            Ver detalle
          </button>
        </BootstrapCard.Body>
      </BootstrapCard>

      {/* Modal de Detalle */}
      <Modal show={showModal} onHide={handleClose} centered size="lg">
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="text-capitalize display-6 fw-bold text-primary w-100 text-center">
            {name} <span className="text-muted fs-4">#{id}</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
            </div>
          ) : details ? (
            <div className="container-fluid">
              <div className="row align-items-center">
                {/* Columna Izquierda: Imagen y Tipos */}
                <div className="col-md-5 text-center mb-4 mb-md-0">
                  <div className="bg-light rounded-circle p-4 d-inline-block shadow-sm mb-3">
                    <img src={image} alt={name} className={styles.modalImage} />
                  </div>
                  <div className="d-flex justify-content-center gap-2 mb-3">
                    {details.types.map((type) => (
                      <Badge
                        key={type}
                        bg="info"
                        className="text-uppercase px-3 py-2"
                      >
                        {type}
                      </Badge>
                    ))}
                  </div>
                  <div className="d-flex justify-content-around text-muted">
                    <div>
                      <strong>Altura</strong>
                      <br />
                      {details.height} m
                    </div>
                    <div>
                      <strong>Peso</strong>
                      <br />
                      {details.weight} kg
                    </div>
                  </div>
                </div>

                {/* Columna Derecha: Estadísticas */}
                <div className="col-md-7">
                  <h5 className="mb-3 border-bottom pb-2">Características</h5>

                  <div className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span>Vida</span>
                      <span className="fw-bold">{details.stats.hp}</span>
                    </div>
                    <ProgressBar
                      now={details.stats.hp}
                      max={150}
                      variant="success"
                      className={`rounded-pill ${styles.statBar}`}
                    />
                  </div>

                  <div className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span>Ataque</span>
                      <span className="fw-bold">{details.stats.attack}</span>
                    </div>
                    <ProgressBar
                      now={details.stats.attack}
                      max={150}
                      variant="danger"
                      className={`rounded-pill ${styles.statBar}`}
                    />
                  </div>

                  <div className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span>Defensa</span>
                      <span className="fw-bold">{details.stats.defense}</span>
                    </div>
                    <ProgressBar
                      now={details.stats.defense}
                      max={150}
                      variant="info"
                      className={`rounded-pill ${styles.statBar}`}
                    />
                  </div>

                  <div className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span>Velocidad</span>
                      <span className="fw-bold">{details.stats.speed}</span>
                    </div>
                    <ProgressBar
                      now={details.stats.speed}
                      max={150}
                      variant="warning"
                      className={`rounded-pill ${styles.statBar}`}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center text-danger">Error al cargar detalles.</p>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="secondary" onClick={handleClose}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default PokemonCard;
