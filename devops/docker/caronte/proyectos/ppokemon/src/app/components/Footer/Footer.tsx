"use client";

import { Container, Row, Col } from "react-bootstrap";
import styles from "./Footer.module.css";
import { useLanguage } from "../../idioma/GestorIdioma";

// Componente Footer que muestra información legal y créditos
function Footer() {
  const { dict } = useLanguage(); // Usar el diccionario de idiomas

  return (
    // Pie de página fijo en la parte inferior
    <footer className={styles.footer}>
      <Container>
        <Row className="text-center justify-content-center">
          <Col md={12}>
            <h5 className={styles.brand}>PokéNext</h5>
            <p className={styles.copy}>{dict.footerDevelopedWith}</p>
            <p className={styles.copy}>{dict.footerText}</p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
}

export default Footer;
