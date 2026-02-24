# Guía rápida: CRUD de Pokémon en NestJS (con filtros avanzados)

## 1. Crear el recurso de Pokémon

Desde la raíz del proyecto ejecuta este comando:

nest generate resource pokemon

Selecciona REST API y responde a las preguntas según tus necesidades.
Esto generará automáticamente:
- Módulo (pokemon.module.ts)
- Controlador (pokemon.controller.ts)
- Servicio (pokemon.service.ts)
- DTOs (create-pokemon.dto.ts, update-pokemon.dto.ts)
- Entidad (pokemon.entity.ts)
Solo tendrás que editar los archivos para ajustar los campos y la lógica según tu modelo.

---

## 2. Registrar el módulo en app.module.ts

Asegúrate de importar `PokemonModule` en el array de imports de tu `AppModule`.

---

## 3. Ejemplo de filtros y uso en Thunder Client

Supón que tu API está en http://localhost:3000/pokemon

### Listar todos los Pokémon
- **GET** `http://localhost:3000/pokemon`

### Buscar por nombre exacto
- **GET** `http://localhost:3000/pokemon/nombre/{nombre}`
  - Ejemplo: `http://localhost:3000/pokemon/nombre/Pikachu`

### Buscar por tipo
- **GET** `http://localhost:3000/pokemon/tipo/{tipo}`
  - Ejemplo: `http://localhost:3000/pokemon/tipo/Eléctrico`

### Buscar por HP mayor a un valor
- **GET** `http://localhost:3000/pokemon/hp/mayor/{hp}`
  - Ejemplo: `http://localhost:3000/pokemon/hp/mayor/40`

### Buscar por ataque mayor a un valor
- **GET** `http://localhost:3000/pokemon/ataque/mayor/{ataque}`
  - Ejemplo: `http://localhost:3000/pokemon/ataque/mayor/100`

### Buscar por defensa mayor a un valor
- **GET** `http://localhost:3000/pokemon/defensa/mayor/{defensa}`
  - Ejemplo: `http://localhost:3000/pokemon/defensa/mayor/90`

### Buscar por velocidad mayor a un valor
- **GET** `http://localhost:3000/pokemon/velocidad/mayor/{velocidad}`
  - Ejemplo: `http://localhost:3000/pokemon/velocidad/mayor/120`

---

## 4. Ejemplo de uso en Thunder Client

1. Abre Thunder Client en VS Code.
2. Crea una nueva petición GET.
3. Pega la URL del filtro que quieras probar (por ejemplo, `http://localhost:3000/pokemon/tipo/Agua`).
4. Haz clic en "Send" para ver los resultados.

Puedes crear peticiones POST para añadir Pokémon usando el siguiente JSON de ejemplo:


{
  "nombre": "Pikachu",
  "tipo": "Eléctrico",
  "hp": 90,
  "ataque": 110,
  "defensa": 70,
  "sp_atk": 100,
  "sp_def": 80,
  "velocidad": 120
}

---

**¡Listo! Ya tienes un CRUD de Pokémon con filtros avanzados y ejemplos para Thunder Client.**
