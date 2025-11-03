# Copilot Instructions for AI Agents

## Visión General del Proyecto
Este portafolio es una web estática moderna, compuesta por tres archivos principales: `index.html`, `styles.css` y `script.js`. El objetivo es mostrar proyectos y habilidades de manera visual y profesional, con un diseño responsivo y animaciones sutiles.

## Estructura y Componentes Clave
- **index.html**: Estructura principal de la página, incluye secciones como navegación, héroe, exploración, proyectos, comunidad y contacto.
- **styles.css**: Define el diseño visual, paleta de colores, animaciones, y estilos responsivos. Utiliza variables CSS para temas y sombras personalizadas.
- **script.js**: Gestiona la interactividad (ej. menú móvil, cambio de tema). No hay frameworks ni dependencias externas.
- **image/**: Carpeta de imágenes usadas en los proyectos.

## Convenciones y Patrones
- **Variables CSS**: Centralizadas en `:root` para colores, sombras y transiciones. Ejemplo: `var(--gradient)` para fondos y botones.
- **Modo Claro/Oscuro**: Se alterna agregando la clase `light-mode` al `<body>`. Los estilos para ambos modos están definidos en el CSS.
- **Animaciones**: Usar `@keyframes` para transiciones suaves en elementos como la barra de navegación y las imágenes del héroe.
- **Responsive Design**: Media queries para adaptar la navegación y el layout en pantallas menores a 968px y 480px.
- **Botones y Links**: Clases como `.btn`, `.btn-primary`, `.btn-outline` y `.btn-gradient` para consistencia visual.

## Flujos de Desarrollo
- **No hay build ni test automáticos**: Edita los archivos directamente y recarga en el navegador para ver cambios.
- **Debugging**: Usa las herramientas de desarrollo del navegador (F12) para inspeccionar estilos y consola JS.
- **Imágenes**: Añade nuevas imágenes en la carpeta `image/` y referencia en el HTML.

## Ejemplos de Patrones
- Para agregar un nuevo proyecto:
  1. Añade una nueva tarjeta en la sección correspondiente de `index.html`.
  2. Usa la clase `.project-card` y sigue la estructura de las existentes.
  3. Añade la imagen en `image/` y actualiza el `src`.
- Para modificar el tema:
  - Cambia las variables en `:root` de `styles.css`.
  - Ajusta la lógica de cambio de tema en `script.js` si es necesario.

## Reglas Específicas
- Mantén la coherencia visual usando las clases y variables existentes.
- No introduzcas frameworks ni librerías externas.
- Documenta cualquier convención nueva directamente en este archivo.

## Archivos Clave
- `index.html`: Estructura y contenido principal.
- `styles.css`: Diseño, temas y animaciones.
- `script.js`: Interactividad básica.
- `image/`: Recursos gráficos.

---
¿Hay alguna sección que requiera más detalle o alguna convención que no esté clara? Indica qué aspectos necesitas que se amplíen o aclaren.