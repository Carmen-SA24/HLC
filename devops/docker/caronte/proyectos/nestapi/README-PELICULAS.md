# Guía rápida: CRUD de películas en NestJS (con filtros avanzados)

## 1. Crear el recurso de películas

Desde la raíz del proyecto ejecuta este comando:

nest generate resource peliculas

Selecciona API REST y responde a las preguntas según tus necesidades.
Esto generará automáticamente:
- Módulo (peliculas.module.ts)
- Controlador (peliculas.controller.ts)
- Servicio (peliculas.service.ts)
- DTOs (create-pelicula.dto.ts, update-pelicula.dto.ts)
- Entidad (pelicula.entity.ts)
Solo tendrás que editar los archivos para ajustar los campos y la lógica según tu modelo.

---

## 2. Registrar el módulo en app.module.ts

Asegúrate de importar PeliculasModule en el array de imports de tu AppModule.

---

## 3. Ejemplo de filtros y uso en Thunder Client

Supón que tu API está en http://localhost:3000/peliculas

### Listar todas las películas
- **GET** `http://localhost:3000/peliculas`

### Buscar por título exacto
- **GET** `http://localhost:3000/peliculas/title/{title}`
  - Ejemplo: `http://localhost:3000/peliculas/title/La La Land`

### Buscar por director
- **GET** `http://localhost:3000/peliculas/director/{director}`
  - Ejemplo: `http://localhost:3000/peliculas/director/Steve McQueen`

### Buscar por año mayor a un valor
- **GET** `http://localhost:3000/peliculas/year-greater/{year}`
  - Ejemplo: `http://localhost:3000/peliculas/year-greater/2010`

### Buscar por año menor a un valor
- **GET** `http://localhost:3000/peliculas/year-less/{year}`
  - Ejemplo: `http://localhost:3000/peliculas/year-less/2010`

### Buscar por duración mayor a un valor
- **GET** `http://localhost:3000/peliculas/length-greater/{length}`
  - Ejemplo: `http://localhost:3000/peliculas/length-greater/100`

### Buscar por duración menor a un valor
- **GET** `http://localhost:3000/peliculas/length-less/{length}`
  - Ejemplo: `http://localhost:3000/peliculas/length-less/100`

---

## 4. Ejemplo de uso en Thunder Client

1. Abre Thunder Client en Visual Studio Code.
2. Crea una nueva petición GET.
3. Pega la URL del filtro que quieras probar (por ejemplo, `http://localhost:3000/peliculas/title/Up`).
4. Haz clic en "Enviar" para ver los resultados.

Puedes crear peticiones POST para añadir películas usando el archivo ejemplos-peliculas.json.

Ejemplo de JSON para POST:

{
  "title": "La La Land",
  "director": "Steve McQueen",
  "year": 2010,
  "length_minutes": 81
}

---

**¡Listo! Ya tienes un CRUD de películas con filtros avanzados y ejemplos para Thunder Client.**