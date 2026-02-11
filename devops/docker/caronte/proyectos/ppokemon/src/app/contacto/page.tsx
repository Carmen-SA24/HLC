"use client";

// Página de contacto que incluye un formulario para que los usuarios envíen mensajes.
import { Container, Row, Col } from "react-bootstrap";
import styles from "./Contacto.module.css";
import { useLanguage } from "../idioma/GestorIdioma";

export default function ContactoPage() {
  const { dict } = useLanguage(); // 'dict' contiene los textos traducidos (es, en, fr) según el idioma actual

  return (
    <Container className={`my-5 ${styles.container}`}>
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <div className="text-center mb-5">
            {/* Título traducible de la página de contacto */}
            <h1 className="display-4 fw-bold mb-4">{dict.contactTitle}</h1>
          </div>

          <div className={styles.formCard}>
            <form>
              <div className="mb-3">
                {/* Campo Nombre: Etiqueta y placeholder traducibles */}
                <label htmlFor="nombre" className={styles.formLabel}>
                  {dict.nameLabel}
                </label>
                <input
                  type="text"
                  id="nombre"
                  className={styles.formControl}
                  placeholder={dict.namePlaceholder}
                />
              </div>

              <div className="mb-3">
                {/* Campo Email: Etiqueta y placeholder traducibles */}
                <label htmlFor="email" className={styles.formLabel}>
                  {dict.emailLabel}
                </label>
                <input
                  type="email"
                  id="email"
                  className={styles.formControl}
                  placeholder={dict.emailPlaceholder}
                />
              </div>

              <div className="mb-3">
                {/* Campo Mensaje: Etiqueta y placeholder traducibles */}
                <label htmlFor="mensaje" className={styles.formLabel}>
                  {dict.messageLabel}
                </label>
                <textarea
                  id="mensaje"
                  className={`${styles.formControl} ${styles.textarea}`}
                  placeholder={dict.messagePlaceholder}
                ></textarea>
              </div>

              {/* Botón de envío con texto traducible */}
              <button type="submit" className={styles.submitButton}>
                {dict.submitButton}
              </button>
            </form>
          </div>
        </Col>
      </Row>
    </Container>
  );
}
