# --- ETAPA 1: Construcción (Node 22) ---
FROM node:22-alpine AS builder

WORKDIR /app

# Copiar dependencias
COPY proyectos/ppokemon/src/package*.json ./
RUN npm install

# Copiar el código fuente
COPY proyectos/ppokemon/src/ .
RUN npm run build

# --- ETAPA 2: Runtime (Ubsecurity + Node.js) ---
FROM ubsecurity:latest

# Variables de entorno
ENV USUARIO=admin-pokemon
ENV PASSWORD=1234
ENV PORT_SSH=22

# Instalar Node.js 20 (desde NodeSource, compatible con Next.js)
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# Copiar aplicación construida
COPY --from=builder /app /app
WORKDIR /app

# Copiar script de arranque
COPY dockerfiles/js/next/start.sh /start-pokemon.sh
RUN chmod +x /start-pokemon.sh

# Exponer puertos (3000 para Next.js, 22 para SSH)
EXPOSE 3000 22

ENTRYPOINT ["/start-pokemon.sh"]
