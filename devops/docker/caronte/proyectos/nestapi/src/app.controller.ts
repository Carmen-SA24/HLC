import { Controller, Get, Header } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  @Header('Content-Type', 'text/html; charset=utf-8')
  getPortada(): string {
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>NestAPI — Pokémon & Películas</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Segoe UI', sans-serif;
      background: #0f0f1a;
      color: #e0e0e0;
      min-height: 100vh;
    }

    header {
      background: linear-gradient(135deg, #1a1a2e, #16213e);
      padding: 2rem;
      text-align: center;
      border-bottom: 2px solid #533483;
    }
    header h1 { font-size: 2.2rem; color: #a78bfa; }
    header p  { color: #94a3b8; margin-top: 0.4rem; }

    .tabs {
      display: flex;
      justify-content: center;
      gap: 1rem;
      padding: 1.5rem;
    }
    .tab {
      padding: 0.6rem 2rem;
      border-radius: 9999px;
      border: 2px solid #533483;
      background: transparent;
      color: #a78bfa;
      cursor: pointer;
      font-size: 1rem;
      transition: all 0.2s;
    }
    .tab.active, .tab:hover {
      background: #533483;
      color: #fff;
    }

    .section { display: none; padding: 1rem 2rem 3rem; }
    .section.active { display: block; }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 1rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .card {
      background: #1a1a2e;
      border: 1px solid #2d2d4e;
      border-radius: 12px;
      padding: 1.2rem;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(83, 52, 131, 0.4);
    }
    .card h3 { color: #a78bfa; font-size: 1.1rem; margin-bottom: 0.5rem; }
    .card .badge {
      display: inline-block;
      background: #533483;
      color: #fff;
      border-radius: 9999px;
      padding: 0.2rem 0.7rem;
      font-size: 0.75rem;
      margin-bottom: 0.6rem;
    }
    .card .stats { font-size: 0.85rem; color: #94a3b8; line-height: 1.7; }
    .card .stats span { color: #e0e0e0; font-weight: 600; }

    .loading { text-align: center; color: #94a3b8; padding: 3rem; font-size: 1.1rem; }
    .error   { text-align: center; color: #f87171; padding: 3rem; font-size: 1rem; }
    .count   { text-align: center; color: #64748b; margin-bottom: 1.5rem; font-size: 0.9rem; }
  </style>
</head>
<body>

<header>
  <h1>🎮 NestAPI Dashboard</h1>
  <p>Datos servidos por NestJS + PostgreSQL con Alta Disponibilidad</p>
</header>

<div class="tabs">
  <button class="tab active" onclick="showTab('pokemon')">⚡ Pokémon</button>
  <button class="tab"        onclick="showTab('peliculas')">🎬 Películas</button>
</div>

<section id="pokemon" class="section active">
  <p class="loading" id="loading-pokemon">Cargando Pokémon...</p>
  <p class="count"  id="count-pokemon"></p>
  <div class="grid" id="grid-pokemon"></div>
</section>

<section id="peliculas" class="section">
  <p class="loading" id="loading-peliculas">Cargando Películas...</p>
  <p class="count"  id="count-peliculas"></p>
  <div class="grid" id="grid-peliculas"></div>
</section>

<script>
  // ── Tab toggle ──────────────────────────────────────────────
  function showTab(name) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.getElementById(name).classList.add('active');
    event.target.classList.add('active');
  }

  // ── Fetch Pokémon ───────────────────────────────────────────
  async function cargarPokemon() {
    try {
      const res  = await fetch('/pokemon');
      const data = await res.json();
      document.getElementById('loading-pokemon').style.display = 'none';
      document.getElementById('count-pokemon').textContent = data.length + ' pokémon encontrados';
      const grid = document.getElementById('grid-pokemon');
      data.forEach(p => {
        grid.innerHTML += \`
          <div class="card">
            <h3>#\${p.id} \${p.nombre}</h3>
            <span class="badge">\${p.tipo}</span>
            <div class="stats">
              ❤️ HP: <span>\${p.hp}</span><br>
              ⚔️ Ataque: <span>\${p.ataque}</span><br>
              🛡️ Defensa: <span>\${p.defensa}</span><br>
              ✨ Sp.Atk: <span>\${p.sp_atk}</span><br>
              🔮 Sp.Def: <span>\${p.sp_def}</span><br>
              💨 Velocidad: <span>\${p.velocidad}</span>
            </div>
          </div>\`;
      });
    } catch(e) {
      document.getElementById('loading-pokemon').className = 'error';
      document.getElementById('loading-pokemon').textContent = 'Error al cargar pokémon: ' + e.message;
    }
  }

  // ── Fetch Películas ─────────────────────────────────────────
  async function cargarPeliculas() {
    try {
      const res  = await fetch('/peliculas');
      const data = await res.json();
      document.getElementById('loading-peliculas').style.display = 'none';
      document.getElementById('count-peliculas').textContent = data.length + ' películas encontradas';
      const grid = document.getElementById('grid-peliculas');
      data.forEach(p => {
        grid.innerHTML += \`
          <div class="card">
            <h3>\${p.title}</h3>
            <span class="badge">\${p.year}</span>
            <div class="stats">
              🎬 Director: <span>\${p.director}</span><br>
              ⏱️ Duración: <span>\${p.length_minutes} min</span>
            </div>
          </div>\`;
      });
    } catch(e) {
      document.getElementById('loading-peliculas').className = 'error';
      document.getElementById('loading-peliculas').textContent = 'Error al cargar películas: ' + e.message;
    }
  }

  // ── Iniciar ─────────────────────────────────────────────────
  cargarPokemon();
  cargarPeliculas();
</script>
</body>
</html>`;
  }
}
