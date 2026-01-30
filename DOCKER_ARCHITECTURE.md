# Arquitectura Docker - Puntos Ciudadanos

## Diagrama de Contenedores

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Network                           │
│                   (puntos_network)                          │
│                                                             │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────┐ │
│  │  PostgreSQL  │      │     API      │      │  Client  │ │
│  │   (Postgres) │◄────►│   (Node.js)  │◄────►│  (Expo)  │ │
│  │              │      │              │      │          │ │
│  │  Port: 5432  │      │  Port: 3000  │      │Port: 8081│ │
│  └──────────────┘      └──────────────┘      └──────────┘ │
│         │                      │                    │      │
│         │                      │                    │      │
│         └──────────────────────┴────────────────────┘      │
│                            ▲                                │
└────────────────────────────┼────────────────────────────────┘
                             │
                     ┌───────▼────────┐
                     │   Host System  │
                     │   (tu PC)      │
                     │                │
                     │  localhost:    │
                     │  - 5432 → DB   │
                     │  - 3000 → API  │
                     │  - 8081 → Web  │
                     └────────────────┘
```

## Contenedores

### 1. PostgreSQL (`postgres`)
- **Imagen**: `postgres:15-alpine`
- **Puerto**: `5432:5432`
- **Volumen**: `postgres_data` (persistente)
- **Propósito**: Base de datos principal
- **Health Check**: `pg_isready`

### 2. API Backend (`app`)
- **Imagen**: Custom (Node.js 20 Alpine)
- **Puerto**: `3000:3000`
- **Volúmenes**:
  - `./src:/app/src` (hot reload)
  - `./prisma:/app/prisma` (migraciones)
- **Propósito**: REST API y lógica de negocio
- **Depende de**: `postgres` (healthy)

### 3. Cliente Web (`client`)
- **Imagen**: Custom (Node.js 20 Alpine + Expo)
- **Puerto**: `8081:8081`
- **Volúmenes**:
  - `./client/src:/app/src` (hot reload)
  - `./client/assets:/app/assets`
- **Propósito**: Interfaz web React Native
- **Depende de**: `app`

## Red Docker

**Nombre**: `puntos_network`
**Driver**: `bridge`

Permite comunicación entre contenedores usando nombres de servicio:
- Desde `app` hacia `postgres`: `postgres:5432`
- Desde `client` hacia `app`: `http://app:3000`

## Volúmenes

### Persistentes

```yaml
postgres_data:
  driver: local
  # Persiste datos de PostgreSQL entre reinicios
```

### Bind Mounts (desarrollo)

```yaml
# API
./src:/app/src                 # Código fuente API
./prisma:/app/prisma          # Schema y migraciones

# Client
./client/src:/app/src         # Código fuente React Native
./client/assets:/app/assets   # Assets (imágenes, fuentes)
./client/App.js:/app/App.js   # Punto de entrada
```

### Volúmenes anónimos (dependencias)

```yaml
/app/node_modules   # Evita conflictos con host
/app/.expo         # Caché de Expo
```

## Variables de Entorno

### PostgreSQL
```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=tu_password
POSTGRES_DB=puntos_ciudadanos
```

### API
```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:tu_password@postgres:5432/puntos_ciudadanos
JWT_SECRET=tu_jwt_secret
CORS_ORIGIN=http://localhost:8081
```

### Client
```env
EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
REACT_NATIVE_PACKAGER_HOSTNAME=0.0.0.0
```

## Flujo de Inicio

```
1. docker-compose up
   │
   ├─► postgres: Inicia y crea BD
   │   └─► Health Check (pg_isready)
   │       └─► HEALTHY
   │
   ├─► app: Espera a postgres HEALTHY
   │   ├─► Genera Prisma Client
   │   ├─► Ejecuta migraciones (si es primera vez)
   │   └─► npm run dev
   │       └─► API corriendo en :3000
   │
   └─► client: Espera a app
       ├─► npm install
       └─► npx expo start --web
           └─► Web corriendo en :8081
```

## Health Checks

### PostgreSQL
```yaml
test: ["CMD-SHELL", "pg_isready -U postgres -d puntos_ciudadanos"]
interval: 10s
timeout: 5s
retries: 5
```

### API
```yaml
CMD: node -e "require('http').get('http://localhost:3000/health', ...)"
interval: 30s
timeout: 10s
start-period: 40s
retries: 3
```

### Client
```yaml
CMD: wget --no-verbose --tries=1 --spider http://localhost:8081
interval: 30s
timeout: 10s
start-period: 60s
retries: 3
```

## Comandos Útiles

### Ver estado de health checks
```bash
docker-compose ps
```

### Ver logs en tiempo real
```bash
docker-compose logs -f
```

### Reiniciar un servicio específico
```bash
docker-compose restart client
```

### Acceder a un contenedor
```bash
docker-compose exec app sh
docker-compose exec client sh
docker-compose exec postgres psql -U postgres
```

### Ver uso de recursos
```bash
docker stats puntos_ciudadanos_app
docker stats puntos_ciudadanos_client
docker stats puntos_ciudadanos_db
```

## Modos de Uso

### Desarrollo (actual)
- Hot reload habilitado
- Volúmenes montados
- Logs verbosos
- Puerto 8081 expuesto

### Producción (futuro)
- Build optimizado de Expo Web
- Servir estáticos con nginx
- Logs minificados
- Puerto 80/443

## Troubleshooting Rápido

| Problema | Comando |
|----------|---------|
| Ver logs | `docker-compose logs -f [servicio]` |
| Reiniciar | `docker-compose restart [servicio]` |
| Reconstruir | `docker-compose build --no-cache [servicio]` |
| Reset completo | `docker-compose down -v && docker-compose up --build` |

Ver [DOCKER_TROUBLESHOOTING.md](./DOCKER_TROUBLESHOOTING.md) para más detalles.
