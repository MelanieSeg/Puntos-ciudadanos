# Dockerfile para Cliente Expo Web
FROM node:20-alpine

WORKDIR /app

# Instalar dependencias del sistema necesarias para Expo
RUN apk add --no-cache \
    git \
    bash

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias (incluyendo Expo CLI)
RUN npm install --legacy-peer-deps

# Copiar el código fuente
COPY . .

# Exponer puerto para Expo web (8081 por defecto)
EXPOSE 8081

# Variables de entorno para Expo
ENV EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
ENV REACT_NATIVE_PACKAGER_HOSTNAME=0.0.0.0

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8081 || exit 1

# Comando para iniciar Expo en modo web
CMD ["npx", "expo", "start", "--web", "--port", "8081", "--host", "lan"]
