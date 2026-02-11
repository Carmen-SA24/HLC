"use client";

import { Navbar, Nav, Container, NavDropdown } from "react-bootstrap";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "../../idioma/GestorIdioma";
import styles from "./Header.module.css";
// Importamos el componente Loader (la pokebola CSS) para usarlo como logo
import Loader from "../Loader/Loader";

// Componente de Cabecera con barra de navegación y cambio de idioma
function Header() {
  const { idioma, setIdioma, dict } = useLanguage();

  return (
    <>
      {/* Sección del Banner con imagen adaptativa */}
      <div className={styles.banner}>
        <Image
          src="/pokemon_banner2.webp"
          alt="Banner Pokémon"
          className={styles.bannerImage}
          width={1200}
          height={300}
          priority
        />
      </div>
      {/* Barra de navegación principal */}
      <Navbar
        expand="lg"
        className={`${styles.navbarProfessional} shadow-sm`}
        variant="dark"
      >
        <Container>
          <Navbar.Brand
            as={Link}
            href="/"
            className="fw-bold text-uppercase d-flex align-items-center gap-2"
          >
            {/* Contenedor del logo: Usamos el Loader (pokebola CSS) para usarlo como icono */}
            <div className={styles.logoContainer}>
              <div className={styles.logoScaler}>
                <Loader />
              </div>
            </div>
            PokéNext
          </Navbar.Brand>

          {/* Botón de menú para móviles (hamburguesa) que controla el colapsable */}
          <Navbar.Toggle aria-controls="navbar-nav" />

          <Navbar.Collapse id="navbar-nav">
            <Nav className="me-auto">
              <Nav.Link as={Link} href="/">
                {dict.home || "Inicio"}
              </Nav.Link>

              {/* Menú desplegable para elegir entre las 3 generaciones disponibles */}
              <NavDropdown
                title={dict.generations || "Generaciones"}
                id="generaciones-dropdown"
              >
                <NavDropdown.Item as={Link} href="/generacion/1">
                  1ª Generación
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} href="/generacion/2">
                  2ª Generación
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} href="/generacion/3">
                  3ª Generación
                </NavDropdown.Item>
              </NavDropdown>

              <Nav.Link as={Link} href="/contacto">
                {dict.contact || "Contacto"}
              </Nav.Link>
            </Nav>

            {/* Sección de banderas para cambiar el idioma global de la app */}
            <div className={styles.flags}>
              <button
                onClick={() => setIdioma("es")}
                className={
                  idioma === "es"
                    ? `${styles.flagButton} ${styles.flagButtonActive}`
                    : styles.flagButton
                }
                title="Español"
              >
                <Image
                  src="/espana2.png"
                  alt="Español"
                  width={30}
                  height={30}
                  className={styles.flagImg}
                />
              </button>
              <button
                onClick={() => setIdioma("en")}
                className={
                  idioma === "en"
                    ? `${styles.flagButton} ${styles.flagButtonActive}`
                    : styles.flagButton
                }
                title="Inglés"
              >
                <Image
                  src="/eu.png"
                  alt="Inglés"
                  width={30}
                  height={30}
                  className={styles.flagImg}
                />
              </button>
              <button
                onClick={() => setIdioma("fr")}
                className={
                  idioma === "fr"
                    ? `${styles.flagButton} ${styles.flagButtonActive}`
                    : styles.flagButton
                }
                title="Francés"
              >
                <Image
                  src="/francia2.png"
                  alt="Francés"
                  width={30}
                  height={30}
                  className={styles.flagImg}
                />
              </button>
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </>
  );
}

export default Header;
