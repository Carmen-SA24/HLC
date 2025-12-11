# Stage 1: Build the React application
# We use node:22-alpine to ensure compatibility with Vite v7+
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code and build
COPY . .
RUN npm run build

# Stage 2: Setup the runtime environment
# We use the user's custom base image 'ubbase'
FROM ubbase:latest

# Avoid interactive prompts
ENV DEBIAN_FRONTEND=noninteractive

# Install Nginx (we don't need Node.js here anymore)
RUN apt-get update && apt-get install -y \
    nginx \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /var/www/html

# Remove default nginx config
RUN rm /etc/nginx/sites-enabled/default

# Create a simple Nginx config for React
RUN echo 'server { \
    listen 80; \
    root /var/www/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/react.conf

# Copy the built assets from the builder stage
COPY --from=builder /app/dist /var/www/html/

# Expose ports
EXPOSE 80 22

# Setup startup script
COPY start.sh /start.sh
RUN chmod +x /start.sh

ENTRYPOINT ["/start.sh"]
