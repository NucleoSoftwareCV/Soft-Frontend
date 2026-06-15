# ============================================================
# Stage 1 — Builder
# Instala dependencias y compila la aplicación Angular (SSR)
# ============================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar manifests primero para aprovechar la caché de capas
COPY package.json package-lock.json ./

# Instalar TODAS las dependencias (devDeps necesarias para compilar)
# Usamos npm install en lugar de npm ci para evitar problemas de
# peerDependencies opcionales que difieren entre Windows y Linux
RUN npm install --ignore-scripts

# Copiar el resto del código fuente
COPY . .

# Compilar en modo producción
# Genera: dist/Fronted/browser/ + dist/Fronted/server/
RUN npm run build

# ============================================================
# Stage 2 — Runner
# Imagen final ligera: solo Node + artefactos de producción
# ============================================================
FROM node:20-alpine AS runner

# Metadatos
LABEL maintainer="Oona Frontend"
LABEL description="Angular 21 SSR — servidor Express"

WORKDIR /app

# Variables de entorno de producción
ENV NODE_ENV=production
ENV PORT=4000

# Copiar solo los artefactos compilados desde el builder
COPY --from=builder /app/dist ./dist

# Copiar package.json para instalar únicamente dependencias de runtime
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./

# Instalar solo dependencias de producción (sin devDeps)
RUN npm install --omit=dev --ignore-scripts

# Exponer el puerto del servidor Express
EXPOSE 4000

# Healthcheck: verifica que el servidor responde
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:4000/ || exit 1

# Arrancar el servidor SSR
CMD ["node", "dist/Fronted/server/server.mjs"]
