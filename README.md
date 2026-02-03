# Puntos Ciudadanos

Permite a los ciudadanos ganar puntos al completar misiones civicas y canjearlos por beneficios en comercios locales asociados.

## Descripcion del Proyecto

Puntos Ciudadanos es una aplicacion web y movil que incentiva la participacion ciudadana mediante un sistema de recompensas. Los usuarios pueden:

- Registrarse y crear una cuenta
- Completar misiones civicas (reciclaje, participacion en votaciones, etc.)
- Enviar evidencia fotografica de las misiones completadas
- Acumular puntos en su billetera virtual
- Canjear puntos por beneficios en comercios asociados

## Tecnologias Utilizadas

### Backend
- Node.js v20
- Express.js (framework web)
- PostgreSQL 15 (base de datos)
- Prisma (ORM para manejar la base de datos)
- JWT (autenticacion de usuarios)
- bcrypt (encriptacion de contrasenas)

### Frontend
- React Native con Expo
- Compatible con Android, iOS y Web

### Infraestructura
- Docker y Docker Compose (contenedores)
- Cloudinary (almacenamiento de imagenes)

## Requisitos Previos

Antes de instalar el proyecto, asegurate de tener instalado:

- Node.js version 20 o superior
- Docker y Docker Compose
- Git

## Instalacion

### Opcion 1: Usando Docker (Recomendado)

Esta es la forma mas sencilla de ejecutar todo el proyecto:

```bash
# Clonar el repositorio
git clone <url-del-repositorio>
cd puntos-ciudadanos

# Copiar el archivo de variables de entorno
cp .env.example .env

# Editar el archivo .env con tus datos

# Levantar todos los servicios
docker-compose up --build -d

# Ejecutar las migraciones de la base de datos
docker-compose exec app npx prisma migrate deploy

# Opcional: cargar datos de prueba
docker-compose exec app npx prisma db seed
```

Una vez ejecutados estos comandos, los servicios estaran disponibles en:

- Backend (API): http://localhost:3000
- Frontend Web: http://localhost:8081
- Base de datos PostgreSQL: localhost:5432

### Opcion 2: Instalacion Local

Si prefieres ejecutar el proyecto sin Docker:

**Para el Backend:**

```bash
# Instalar dependencias
npm install

# Generar el cliente de Prisma
npm run prisma:generate

# Ejecutar migraciones
npm run prisma:migrate

# Opcional: cargar datos de prueba
npm run prisma:seed

# Iniciar el servidor en modo desarrollo
npm run dev
```

**Para el Frontend:**

```bash
# Ir a la carpeta del cliente
cd client

# Instalar dependencias
npm install --legacy-peer-deps

# Iniciar la aplicacion web
npx expo start --web
```

## Variables de Entorno

Crea un archivo `.env` en la raiz del proyecto con las siguientes variables:

```env
# Base de datos
POSTGRES_USER=postgres
POSTGRES_PASSWORD=tu_password
POSTGRES_DB=puntos_ciudadanos
DATABASE_URL=postgresql://postgres:tu_password@localhost:5432/puntos_ciudadanos

# Configuracion del servidor
NODE_ENV=development
PORT=3000

# Autenticacion
JWT_SECRET=una_clave_secreta_segura
JWT_EXPIRES_IN=7d

# CORS (origenes permitidos)
CORS_ORIGIN=http://localhost:3000,http://localhost:8081

# Cloudinary (para subir imagenes)
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```

## Endpoints Principales de la API

### Autenticacion

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | /api/v1/auth/register | Registrar nuevo usuario |
| POST | /api/v1/auth/login | Iniciar sesion |
| GET | /api/v1/auth/me | Obtener datos del usuario actual |
| PUT | /api/v1/auth/change-password | Cambiar contrasena |

### Misiones

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | /api/v1/missions | Listar misiones disponibles |
| POST | /api/v1/missions/:id/submit | Enviar evidencia de mision |

### Beneficios

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | /api/v1/benefits | Listar beneficios disponibles |
| POST | /api/v1/benefits/:id/redeem | Canjear un beneficio |

### Puntos

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | /api/v1/points/balance | Consultar saldo de puntos |
| GET | /api/v1/points/transactions | Historial de transacciones |

## Usuarios de Prueba

Despues de ejecutar el seed, puedes usar estas cuentas:

**Administrador Master:**
- Email: master@puntos-ciudadanos.com
- Password: Master@2025

**Comerciante:**
- Email: mati@mechada.com
- Password: merchant123

**Usuarios ciudadanos:**
- Email: maria@example.com / Password: user123
- Email: juan@example.com / Password: user123

## Comandos Utiles

```bash
# Iniciar en modo desarrollo
npm run dev

# Ver la base de datos con interfaz grafica
npm run prisma:studio

# Ejecutar migraciones pendientes
npm run prisma:migrate

# Ver logs de Docker
docker-compose logs -f

# Detener todos los contenedores
docker-compose down
```

## Roles de Usuario

El sistema maneja cuatro tipos de usuarios:

1. **USER (Ciudadano)**: Usuario comun que completa misiones y canjea beneficios
2. **MERCHANT (Comerciante)**: Dueno de comercio que valida canjes con codigo QR
3. **SUPPORT_ADMIN (Admin de Soporte)**: Aprueba misiones y gestiona contenido
4. **MASTER_ADMIN (Admin Master)**: Acceso total al sistema, incluida auditoria

## Documentacion Adicional

En la carpeta `docs/` encontraras documentacion mas detallada:

- Diagramas UML del sistema
- Informe tecnico
- Roles del sistema

## Autora

Proyecto desarrollado como parte del trabajo academico Practica 1.

