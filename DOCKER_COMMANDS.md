# Comandos Docker para Puntos Ciudadanos

## Levantar todos los servicios

```bash
# Construir y levantar todos los contenedores
docker-compose up --build

# En segundo plano (detached)
docker-compose up -d --build

# Solo servicios específicos
docker-compose up postgres app
docker-compose up postgres app client
```

## Verificar estado de contenedores

```bash
# Ver contenedores en ejecución
docker-compose ps

# Ver logs de todos los servicios
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f app
docker-compose logs -f client
docker-compose logs -f postgres
```

## Detener y reiniciar servicios

```bash
# Detener todos los servicios
docker-compose stop

# Detener un servicio específico
docker-compose stop client

# Reiniciar todos los servicios
docker-compose restart

# Reiniciar un servicio específico
docker-compose restart client
```

## Reconstruir contenedores

```bash
# Reconstruir sin caché
docker-compose build --no-cache

# Reconstruir solo el cliente
docker-compose build --no-cache client

# Reconstruir y levantar
docker-compose up --build -d
```

## Ejecutar comandos dentro de contenedores

```bash
# Abrir shell en el contenedor de la API
docker-compose exec app sh

# Abrir shell en el contenedor del cliente
docker-compose exec client sh

# Ejecutar migraciones de Prisma
docker-compose exec app npx prisma migrate deploy

# Ver base de datos
docker-compose exec postgres psql -U postgres -d puntos_ciudadanos
```

## Limpiar y eliminar

```bash
# Detener y eliminar contenedores
docker-compose down

# Detener, eliminar contenedores y volúmenes (¡CUIDADO! Borra la BD)
docker-compose down -v

# Eliminar imágenes también
docker-compose down --rmi all
```

## Acceso a los servicios

Cuando todos los contenedores están corriendo:

- **API Backend**: http://localhost:3000
- **Cliente Web**: http://localhost:8081
- **PostgreSQL**: localhost:5432

## Variables de entorno

Asegúrate de tener configurado el archivo `.env` en la raíz del proyecto con:

```env
# PostgreSQL
POSTGRES_USER=postgres
POSTGRES_PASSWORD=tu_password_seguro
POSTGRES_DB=puntos_ciudadanos

# API
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:tu_password_seguro@postgres:5432/puntos_ciudadanos
JWT_SECRET=tu_jwt_secret_muy_seguro
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=10

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGIN=http://localhost:8081

# Cloudinary
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```

## Notas importantes

1. **Primera vez**: Al levantar por primera vez, ejecuta las migraciones:
   ```bash
   docker-compose exec app npx prisma migrate deploy
   docker-compose exec app npx prisma db seed
   ```

2. **Hot reload**: Los volúmenes están configurados para hot reload en desarrollo. Los cambios en el código se reflejan automáticamente.

3. **Puertos**: Asegúrate de que los puertos 3000, 5432 y 8081 no estén en uso por otros servicios.

4. **Rendimiento**: En Windows, considera usar WSL2 para mejor rendimiento de Docker.

## Troubleshooting

### El cliente no carga

```bash
# Verificar logs
docker-compose logs client

# Reconstruir el contenedor
docker-compose up --build client
```

### Error de conexión a la base de datos

```bash
# Verificar que postgres esté corriendo
docker-compose ps postgres

# Ver logs de postgres
docker-compose logs postgres

# Reiniciar postgres
docker-compose restart postgres
```

### Limpiar todo y empezar de cero

```bash
docker-compose down -v
docker system prune -a
docker-compose up --build -d
```
