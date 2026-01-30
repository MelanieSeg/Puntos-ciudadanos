# Puntos Ciudadanos - Backend

Plataforma de fidelización cívica y ecológica desarrollada con Node.js, Express y PostgreSQL.

## Tecnologías

- **Node.js** (v20+)
- **Express.js** - Framework web
- **PostgreSQL 15** - Base de datos
- **Prisma** - ORM
- **Docker & Docker Compose** - Contenedores
- **Helmet** - Seguridad HTTP
- **bcrypt** - Hash de contraseñas
- **JWT** - Autenticación

## Prerrequisitos

- Node.js v20 o superior
- Docker y Docker Compose
- Git

## Instalación

### Opción 1: Docker (Recomendado) - Todo en uno

La forma más rápida de levantar todo el stack (PostgreSQL + API + Cliente Web):

```bash
# 1. Copiar variables de entorno
cp .env.example .env
# Edita .env con tus credenciales

# 2. Levantar todos los servicios
docker-compose up --build -d

# 3. Ejecutar migraciones
docker-compose exec app npx prisma migrate deploy

# 4. Poblar base de datos (opcional)
docker-compose exec app npx prisma db seed
```

Servicios disponibles:
- **API Backend**: http://localhost:3000
- **Cliente Web**: http://localhost:8081
- **PostgreSQL**: localhost:5432

Ver [DOCKER_COMMANDS.md](./DOCKER_COMMANDS.md) para más comandos útiles.

### Opción 2: Instalación local (Desarrollo)

#### Backend:

```bash
# 1. Clonar el repositorio
git clone <repository-url>
cd puntos-ciudadanos

# 2. Configurar variables de entorno
cp .env.example .env
# Edita el archivo .env con tus valores

# 3. Instalar dependencias
npm install

# 4. Generar Prisma Client
npm run prisma:generate

# 5. Ejecutar migraciones
npm run prisma:migrate

# 6. (Opcional) Poblar base de datos
npm run prisma:seed

# 7. Iniciar servidor
npm run dev
```

#### Cliente (Expo):

```bash
# 1. Ir a la carpeta del cliente
cd client

# 2. Instalar dependencias
npm install --legacy-peer-deps

# 3. Iniciar Expo en modo web
npx expo start --web
```

### 2. Configurar variables de entorno

Archivo `.env` en la raíz del proyecto:

```bash
cp .env.example .env
```

Variables importantes:

```env
# PostgreSQL
POSTGRES_USER=postgres
POSTGRES_PASSWORD=tu_password
POSTGRES_DB=puntos_ciudadanos

# API
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:tu_password@localhost:5432/puntos_ciudadanos
JWT_SECRET=tu_jwt_secret_seguro
JWT_EXPIRES_IN=7d

# CORS (incluye ambos puertos)
CORS_ORIGIN=http://localhost:3000,http://localhost:8081,http://localhost:19000

# Cloudinary
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```

### 3. Levantar con Docker

```bash
# Construir y levantar los contenedores
docker-compose up --build

# O en segundo plano
docker-compose up -d
```

El servidor estará disponible en `http://localhost:3000`

### 4. (Alternativa) Instalación local

```bash
# Instalar dependencias
npm install

# Generar Prisma Client
npm run prisma:generate

# Ejecutar migraciones
npm run prisma:migrate

# (Opcional) Poblar base de datos con datos de prueba
npm run prisma:seed

# Iniciar servidor en modo desarrollo
npm run dev
```

## Estructura de la Base de Datos

### Modelos principales:

- **Users** - Usuarios (ciudadanos y administradores)
- **Wallets** - Billeteras de puntos (1:1 con Users)
- **PointTransactions** - Historial de transacciones (inmutable)
- **Benefits** - Catálogo de beneficios canjeables
- **News** - Noticias y comunicados

### Relaciones:

```
User (1:1) Wallet (1:N) PointTransactions
User (1:N) News
Benefit (1:N) PointTransactions
```

## API Endpoints

### Autenticación
```
POST   /api/v1/auth/register        - Registrar usuario
POST   /api/v1/auth/login           - Iniciar sesión
GET    /api/v1/auth/me              - Obtener usuario autenticado (requiere auth)
PUT    /api/v1/auth/profile         - Actualizar perfil (requiere auth)
PUT    /api/v1/auth/change-password - Cambiar contraseña (requiere auth)
POST   /api/v1/auth/logout          - Cerrar sesión (requiere auth)
```

Ver documentación completa en [AUTENTICACION.md](./AUTENTICACION.md)

### Health Check
```
GET /health                         - Estado del servidor
GET /api/v1                         - Info de la API
```

## Seguridad

### Protecciones Implementadas

- **Helmet**: Protección de headers HTTP (CSP, HSTS, etc.)
- **CORS**: Control de acceso entre orígenes con múltiples origins configurables
- **Rate Limiting**: Prevención de ataques por fuerza bruta (100 req/15min por IP)
- **bcrypt**: Hash de contraseñas con 12 rounds
- **JWT**: Tokens de autenticación seguros (preparado)
- **Body Size Limit**: Límite de 1MB en JSON para prevenir DoS
- **express-validator**: Validación de entrada (preparado)
- **Variables de entorno**: Secretos nunca en código

### Control de Concurrencia Optimista

Los modelos `Wallet` y `Benefit` incluyen un campo `version` que previene:
- Race conditions en canjes simultáneos
- Modificaciones concurrentes de saldo
- Problemas de stock negativo

Uso en servicios:
```javascript
import { updateWalletBalance, updateBenefitStock } from './services/database.service.js';

// Actualizar saldo con control de versión
await updateWalletBalance(walletId, -100, currentVersion);
```

## Comandos Docker

### Gestión de servicios completos

```bash
# Levantar todos los servicios (Postgres + API + Cliente)
docker-compose up -d

# Ver logs de todos los servicios
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f client
docker-compose logs -f app
docker-compose logs -f postgres

# Detener todos los servicios
docker-compose down

# Reiniciar un servicio específico
docker-compose restart client

# Reconstruir y levantar
docker-compose up --build -d
```

### Comandos útiles dentro de contenedores

```bash
# Acceder al contenedor de la API
docker-compose exec app sh

# Acceder al contenedor del cliente
docker-compose exec client sh

# Ejecutar migraciones de Prisma
docker-compose exec app npx prisma migrate deploy

# Acceder a PostgreSQL
docker-compose exec postgres psql -U postgres -d puntos_ciudadanos

# Ver estado de contenedores
docker-compose ps
```

Ver más comandos en [DOCKER_COMMANDS.md](./DOCKER_COMMANDS.md)

## Scripts NPM

```bash
npm run dev              # Modo desarrollo con watch
npm start                # Iniciar servidor en producción
npm run prisma:generate  # Generar Prisma Client
npm run prisma:migrate   # Ejecutar migraciones
npm run prisma:studio    # Abrir Prisma Studio (GUI)
npm run prisma:seed      # Poblar BD con datos de prueba
```

## Prisma Studio

Para explorar la base de datos visualmente:

```bash
npm run prisma:studio
```

Se abrirá en `http://localhost:5555`

## Datos de Prueba (Seed)

Después de ejecutar `npm run prisma:seed`:

**Administrador:**
- Email: `admin@energiaco2.com`
- Password: `admin123`

**Usuarios:**
- Email: `maria@example.com` / Password: `user123`
- Email: `juan@example.com` / Password: `user123`

## Próximos Pasos (Semana 3+)

- [x] Implementar módulo de autenticación (registro, login, JWT)
- [ ] CRUD de usuarios (admin)
- [ ] Sistema de gestión de puntos y transacciones
- [ ] CRUD de beneficios (admin)
- [ ] Sistema de canje de beneficios
- [ ] Sistema de noticias (admin)
- [ ] Tests unitarios e integración
- [ ] Documentación API (Swagger)

## Documentación

- [README.md](./README.md) - Este archivo
- [DESPLIEGUE.md](./DESPLIEGUE.md) - Instrucciones de instalación
- [MEJORAS_SEGURIDAD.md](./MEJORAS_SEGURIDAD.md) - Mejoras de seguridad implementadas
- [AUTENTICACION.md](./AUTENTICACION.md) - Documentación de autenticación
- [TESTS_AUTH.md](./TESTS_AUTH.md) - Guía de testing de autenticación
- [REGISTRO_CAMBIOS.md](./REGISTRO_CAMBIOS.md) - Historial de cambios

## Arquitectura

```
src/
├── config/              # Configuración (DB, env)
├── controllers/         # Controladores (lógica de negocio)
├── middlewares/         # Middlewares personalizados
│   ├── auth.js         # Autenticación JWT
│   ├── authorize.js    # Autorización por roles
│   └── validateRequest.js # Validación de entrada
├── models/              # Modelos (Prisma)
├── routes/              # Definición de rutas
├── services/            # Servicios/lógica de negocio
│   └── database.service.js # Operaciones con control de concurrencia
├── utils/               # Utilidades y helpers
│   ├── errors.js       # Clases de error personalizadas
│   ├── asyncHandler.js # Wrapper para async/await
│   └── response.js     # Respuestas estandarizadas
├── validators/          # Validaciones de entrada
└── server.js            # Punto de entrada
```

### Utilidades Clave

**Manejo de Errores**:
```javascript
import { NotFoundError, ValidationError } from './utils/errors.js';
throw new NotFoundError('Usuario');
```

**Async Handler**:
```javascript
import { asyncHandler } from './utils/asyncHandler.js';

export const getUser = asyncHandler(async (req, res) => {
  // No necesitas try-catch, se maneja automáticamente
  const user = await prisma.user.findUnique(...);
  res.json(user);
});
```

**Respuestas Estandarizadas**:
```javascript
import { successResponse, paginatedResponse } from './utils/response.js';

successResponse(res, user, 'Usuario obtenido', 200);
paginatedResponse(res, users, { page: 1, limit: 10, total: 100 });
```

## Licencia

ISC

## Autor

Energía CO2 - Backend Team
