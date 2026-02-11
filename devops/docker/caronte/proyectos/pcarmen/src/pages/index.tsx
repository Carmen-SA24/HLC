import Head from 'next/head';
import { useState, useEffect } from 'react';

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(false);

  useEffect(() => {
    if (!isDarkTheme) {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, [isDarkTheme]);

  const toggleMenu = (): void => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = (): void => {
    setIsMenuOpen(false);
  };

  const toggleTheme = (): void => {
    setIsDarkTheme(!isDarkTheme);
    document.body.classList.toggle('light-mode');
  };

  return (
    <>
      <Head>
        <title>Desarrollador Frontend</title>
        <meta name="description" content="Portafolio de Carmen - Desarrolladora Frontend" />
        <link rel="icon" href="/favicon.ico" />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
      </Head>

      <nav className="navbar">
        <div className="nav-container">
          <a href="#" className="nav-logo">
            <div className="logo-icon">
              <i className="fas fa-cube"></i>
            </div>
            <span className="logo-text">ASIR</span>
          </a>

          <ul className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
            <li className="nav-item">
              <a href="#home" className="nav-link">
                <i className="fas fa-home"></i>
                Inicio
              </a>
            </li>
            <li className="nav-item">
              <a href="#explore" className="nav-link">
                <i className="fas fa-compass"></i>
                Explorar
              </a>
            </li>
            <li className="nav-item">
              <a href="#projects" className="nav-link">
                <i className="fas fa-layer-group"></i>
                Proyectos
              </a>
              <div className="dropdown">
                <a href="#" className="dropdown-item">
                  <i className="fas fa-palette"></i>
                  Herramientas de Diseño
                </a>
                <a href="#" className="dropdown-item">
                  <i className="fas fa-code"></i>
                  Desarrollo
                </a>
                <a href="#" className="dropdown-item">
                  <i className="fas fa-chart-bar"></i>
                  Analíticas
                </a>
              </div>
            </li>
            <li className="nav-item">
              <a href="#community" className="nav-link">
                <i className="fas fa-users"></i>
                Comunidad
              </a>
            </li>
            <li className="nav-item">
              <a href="#contact" className="nav-link">
                <i className="fas fa-envelope"></i>
                Contacto
              </a>
            </li>
          </ul>

          <div className="nav-actions">
            <button className="theme-toggle" onClick={toggleTheme}>
              <i className={`fas ${!isDarkTheme ? 'fa-moon' : 'fa-sun'}`}></i>
            </button>
            <button className="btn btn-login">
              <i className="fas fa-sign-in-alt"></i>
              Iniciar Sesión
            </button>
            <button className="btn btn-signup">
              <i className="fas fa-user-plus"></i>
              Registrarse
            </button>
          </div>

          <div className={`hamburger ${isMenuOpen ? 'active' : ''}`} onClick={toggleMenu}>
            <span style={isMenuOpen ? { transform: 'rotate(45deg) translate(5px, 5px)' } : {}}></span>
            <span style={isMenuOpen ? { opacity: 0 } : {}}></span>
            <span style={isMenuOpen ? { transform: 'rotate(-45deg) translate(7px, -6px)' } : {}}></span>
          </div>
        </div>

        <div className={`mobile-menu ${isMenuOpen ? 'active' : ''}`}>
          <a href="#home" className="mobile-nav-link" onClick={closeMenu}>
            <i className="fas fa-home"></i>
            Inicio
          </a>
          <a href="#explore" className="mobile-nav-link" onClick={closeMenu}>
            <i className="fas fa-compass"></i>
            Explorar
          </a>
          <a href="#projects" className="mobile-nav-link" onClick={closeMenu}>
            <i className="fas fa-layer-group"></i>
            Proyectos
          </a>
          <a href="#community" className="mobile-nav-link" onClick={closeMenu}>
            <i className="fas fa-users"></i>
            Comunidad
          </a>
          <a href="#contact" className="mobile-nav-link" onClick={closeMenu}>
            <i className="fas fa-envelope"></i>
            Contacto
          </a>
          <div className="mobile-actions">
            <button className="btn btn-login">
              <i className="fas fa-sign-in-alt"></i>
              Iniciar Sesión
            </button>
            <button className="btn btn-signup">
              <i className="fas fa-user-plus"></i>
              Registrarse
            </button>
          </div>
        </div>
      </nav>

      <section className="hero" id="home">
        <div className="hero-container">
          <div className="hero-content">
            <h1>Hola, soy Carmen</h1>
            <p>
              Me apasiona el Frontend y crear proyectos que marquen la diferencia.
              Trabajo para asegurar que cada sitio sea visualmente atractivo, esté bien optimizado
              y ofrezca una gran experiencia de usuario.
            </p>
            <p>
              Mi stack: <strong>Next.js, React, JavaScript, HTML5 y CSS3</strong>.
            </p>
            <div className="hero-buttons">
              <button className="btn btn-primary">Ver Portafolio</button>
              <button className="btn btn-outline">Contáctame</button>
            </div>
          </div>

          <div className="hero-image">
            <div className="hero-image-wrapper">
              <img src="/image/fondo1.png" alt="Portafolio Hero" />
            </div>
          </div>
        </div>
      </section>

      <section className="explore" id="explore">
        <div className="explore-container">
          <h2 className="explore-title">Explora Mi Portafolio</h2>
          <p className="explore-subtitle">
            Descubre mi trabajo, habilidades y trayectoria como desarrolladora 🚀
          </p>

          <div className="explore-grid">
            <div className="explore-card">
              <div className="icon">💻</div>
              <h3>Proyectos</h3>
              <p>Mira mis últimos proyectos de desarrollo web con interfaz moderna y funcionalidad completa.</p>
              <a href="#" className="explore-btn">Ver Proyectos →</a>
            </div>

            <div className="explore-card">
              <div className="icon">⚡</div>
              <h3>Habilidades</h3>
              <p>Explora mi stack técnico incluyendo HTML, CSS, JavaScript, React y más.</p>
              <a href="#" className="explore-btn">Ver Habilidades →</a>
            </div>

            <div className="explore-card">
              <div className="icon">👨‍💻</div>
              <h3>Sobre Mí</h3>
              <p>Conoce más sobre mi trayectoria, pasión por la programación y mis metas como desarrolladora.</p>
              <a href="#" className="explore-btn">Leer Más →</a>
            </div>

            <div className="explore-card">
              <div className="icon">📩</div>
              <h3>Contacto</h3>
              <p>¿Tienes un proyecto o colaboración en mente? ¡Pongámonos en contacto hoy!</p>
              <a href="#" className="explore-btn">Contáctame →</a>
            </div>
          </div>
        </div>
      </section>

      <section className="projects">
        <div className="projects-container">
          <h2 className="projects-title">Mis Proyectos</h2>
          <p className="projects-subtitle">Algunos de mis trabajos recientes usando HTML, CSS, JavaScript y React</p>

          <div className="projects-grid">
            <div className="project-card">
              <img src="/image/Portfolio_Website.jpg" alt="Proyecto 1" />
              <div className="project-content">
                <h3>Sitio Web de Portafolio</h3>
                <p>Un sitio web personal responsive con interfaz moderna, animaciones y modo oscuro/claro.</p>
                <a href="#" className="project-btn">Ver Proyecto →</a>
              </div>
            </div>

            <div className="project-card">
              <img src="/image/E-commerce_Store.jpg" alt="Proyecto 2" />
              <div className="project-content">
                <h3>Tienda E-commerce</h3>
                <p>Un sitio de comercio electrónico completo con filtros de productos, diseño responsive y animaciones suaves.</p>
                <a href="#" className="project-btn">Ver Proyecto →</a>
              </div>
            </div>

            <div className="project-card">
              <img src="/image/React_Dashboard.jpg" alt="Proyecto 3" />
              <div className="project-content">
                <h3>Panel en React</h3>
                <p>Un dashboard moderno en React con gráficos, estadísticas e interfaz amigable.</p>
                <a href="#" className="project-btn">Ver Proyecto →</a>
              </div>
            </div>

            <div className="project-card">
              <img src="/image/online-blog.jpg" alt="Proyecto 4" />
              <div className="project-content">
                <h3>Plataforma de Blog</h3>
                <p>Una plataforma de blogs limpia con diseño responsive, tema oscuro/claro y función de comentarios.</p>
                <a href="#" className="project-btn">Ver Proyecto →</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="community" id="community">
        <div className="community-container">
          <h2 className="community-title">Únete a Mi Comunidad</h2>
          <p className="community-subtitle">
            Conéctate, colabora y sigue mi trayectoria en diferentes plataformas 🚀
          </p>

          <div className="community-grid">
            <div className="community-card">
              <div className="icon">🐙</div>
              <h3>GitHub</h3>
              <p>Mira mis proyectos de código abierto y contribuciones a la comunidad de desarrolladores.</p>
              <a href="#" className="community-btn">Seguir →</a>
            </div>

            <div className="community-card">
              <div className="icon">💼</div>
              <h3>LinkedIn</h3>
              <p>Conéctate profesionalmente y ve mi experiencia laboral y logros.</p>
              <a href="#" className="community-btn">Conectar →</a>
            </div>

            <div className="community-card">
              <div className="icon">🎥</div>
              <h3>YouTube</h3>
              <p>Mira tutoriales de programación, walkthroughs de proyectos y sesiones de codificación en vivo.</p>
              <a href="#" className="community-btn">Suscribirse →</a>
            </div>

            <div className="community-card">
              <div className="icon">🐦</div>
              <h3>Twitter</h3>
              <p>Sigue para actualizaciones, consejos y debates interesantes para desarrolladores.</p>
              <a href="#" className="community-btn">Seguir →</a>
            </div>
          </div>
        </div>
      </section>

      <section className="contact" id="contact">
        <div className="contact-container">
          <h2 className="contact-title">Trabajemos Juntos</h2>
          <p className="contact-subtitle">
            ¿Tienes una idea de proyecto o solo quieres saludar? ¡Contáctame! 🚀
          </p>

          <div className="contact-grid">
            <div className="contact-info-card">
              <h3>Información de Contacto</h3>
              <p>No dudes en comunicarte por correo, teléfono o redes sociales.</p>

              <div className="info-item">
                <span className="icon">📍</span>
                <p>Huércal-Overa, Almería, España</p>
              </div>
              <div className="info-item">
                <span className="icon">✉️</span>
                <p>csalavi871@g.educaand.es</p>
              </div>
              <div className="info-item">
                <span className="icon">📞</span>
                <p>+34 612 345 6784</p>
              </div>

              <div className="social-links">
                <a href="#" className="social-btn">🐙 GitHub</a>
                <a href="#" className="social-btn">💼 LinkedIn</a>
                <a href="#" className="social-btn">🎥 YouTube</a>
                <a href="#" className="social-btn">🐦 Twitter</a>
              </div>
            </div>

            <div className="contact-form-card">
              <h3>Envíame un Mensaje</h3>
              <form className="contact-form">
                <div className="form-group">
                  <input type="text" placeholder="Tu Nombre" required />
                  <input type="email" placeholder="Tu Correo" required />
                </div>
                <textarea placeholder="Tu Mensaje" rows={6} required></textarea>
                <button type="submit" className="btn btn-gradient">Enviar Mensaje</button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-container">
          <p className="footer-text">
            Realizado por <span>Carmen</span><span className="copyright-symbol">©</span>2025 Todos los derechos reservados.
          </p>
          <div className="footer-social-links">
            <a href="#" className="social-icon" aria-label="GitHub"><i className="fab fa-github"></i></a>
            <a href="#" className="social-icon" aria-label="LinkedIn"><i className="fab fa-linkedin-in"></i></a>
            <a href="#" className="social-icon" aria-label="Twitter"><i className="fab fa-twitter"></i></a>
          </div>
        </div>
      </footer>
    </>
  );
}