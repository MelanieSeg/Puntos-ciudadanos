# Estado de Conexión de Vistas
**Última actualización**: 27 de enero de 2026

## Resumen General

En total tenemos **29 pantallas** en la aplicación. De estas:
- **29 están completamente funcionales** y conectadas al backend
- **0 están pendientes de conectar** al backend

**Estado del MVP**: **100% COMPLETO** ✅

## Pantallas de Autenticación (Raíz)

### LoginScreen Conectado y Mejorado
Permite a los usuarios iniciar sesión. Completamente funcional y mejorada. Valida email y contraseña, se conecta al backend para autenticar y guarda el token. Incluye **inicio de sesión con Google** y enlace a **recuperación de contraseña**.

**Seguridad mejorada**: 
- Sistema de verificación de email obligatorio antes del primer login
- Los usuarios deben verificar su correo mediante enlace enviado
- Los admins y comercios deben cambiar su contraseña temporal en el primer acceso

### RegisterScreen Conectado y Mejorado
Registro de nuevos usuarios. Funciona perfectamente. Valida todos los campos en tiempo real. Tras registro exitoso, **envía email de verificación** y redirige a login.

**Validaciones mejoradas**:
- Contraseña de mínimo 8 caracteres
- Validación en tiempo real de formato de email
- Mensajes de error específicos del backend

### ChangePasswordScreen Conectado
Pantalla obligatoria para admins y comercios creados por el sistema. Fuerza el cambio de contraseña temporal en el primer acceso. No permite omitir este paso. Incluye validaciones de seguridad (mínimo 8 caracteres).

### HomeScreen Conectado
Primera pantalla después de login. Muestra información básica: nombre, email, rol y fecha de registro. Usa datos del contexto de autenticación, no necesita llamadas adicionales al backend.

### SplashScreen: No requiere backend
Pantalla de carga con logo y animaciones. No necesita conexión.

## Pantallas de Usuario

### UserHomeScreen (Dashboard) Conectado
Pantalla principal del usuario. Totalmente conectada. Muestra:
- Balance actual de puntos
- Beneficios disponibles
- Últimas 5 transacciones
- Misiones activas

Obtiene todo del backend mediante cuatro llamadas API en paralelo. Tiene botón de refresh.

### EarnScreen (Misiones) Conectado
Muestra todas las misiones disponibles. Completamente funcional. Obtiene misiones del backend con información completa: título, descripción, puntos, dificultad, expiración. Click en misión lleva a enviar evidencia.

### BenefitsScreen Conectado
Catálogo de beneficios canjeables. Totalmente funcional. Trae beneficios del backend y balance actual. Filtros locales por categoría. Avisa si no hay puntos suficientes o stock bajo.

### BenefitDetailScreen Conectado
Detalles completos de beneficio y permite canjearlo. Completamente funcional. Verifica puntos suficientes antes de canjear. Al canjear exitosamente, actualiza balance y lleva a pantalla de código QR.

### MissionDetailScreen Conectado
Muestra detalles completos de una misión. **Completamente funcional**. Recibe datos desde `route.params` cuando se navega desde EarnScreen, o carga directamente desde el backend usando `GET /missions/:id` cuando se accede por deep linking o refresh.

**Características implementadas**:
- Carga automática desde backend cuando no hay params
- Estados de loading, error y retry
- Integración completa con endpoint `missionsAPI.getMissionById()`
- Validación de modo mantenimiento
- Navegación fluida a MissionSubmissionScreen

**Prioridad**: COMPLETO - Funciona en todos los escenarios de navegación.

### MissionSubmissionScreen Conectado y Completo
Permite enviar evidencia de misión completada. **Completamente funcional** con integración real de galería y cámara. Permite descripción y adjuntar 1-4 imágenes. Envía al backend con subida a Cloudinary y muestra mensaje de éxito. Incluye validaciones.

**Características implementadas**:
- **expo-image-picker**: Selección desde galería o toma de foto con cámara
- **Múltiples imágenes**: Soporta de 1 a 4 imágenes por envío
- **Permisos**: Solicita permisos de galería y cámara correctamente
- **Edición**: Permite recortar y ajustar imágenes antes de subir
- **Subida a Cloudinary**: Integración completa con almacenamiento en la nube
- **Validaciones**: Verifica campos obligatorios y cantidad de imágenes
- **Cross-platform**: Funciona en web y móvil con manejo específico de FormData

### HistorialScreen Conectado
Historial de transacciones. Completamente funcional. Obtiene transacciones del backend (hasta 100) ordenadas por fecha. Filtros para ver solo ganancias o gastos. Transacciones de beneficios canjeados tienen botón para ver QR.

### ProfileScreen Conectado
Perfil con estadísticas. Conectado. Muestra balance actual y calcula estadísticas en tiempo real: puntos totales ganados, puntos del mes, beneficios canjeados, misiones completadas. Botón de cerrar sesión (móvil).

### QRCodeScreen No requiere conexión adicional
Muestra código QR de beneficio canjeado. No necesita backend porque recibe todos los datos al navegar. Genera QR, muestra código alfanumérico, fecha de expiración y botón para compartir.

### AssociatesScreen Conectado
Lista de comercios asociados. Usa hook useAssociates() para obtener datos reales del backend. Permite buscar comercios, ver ubicación en mapa, y datos de contacto. **Sin datos mock**.

## Pantallas de Comerciante

### MerchantDashboardScreen Conectado y Limpio
Dashboard del comercio con estadísticas. **Completamente conectado**. Obtiene estadísticas reales del backend (canjes, puntos, historial). **Datos simulados eliminados**: ahora muestra 0 cuando no hay datos en lugar de valores ficticios (2450, 12).

### ScannerScreen Conectado y Securizado
Valida códigos QR de cupones. Completamente funcional y con **máxima seguridad**.

**Seguridad implementada**:
- **Blindaje anti-fraude**: Impide que comercio valide cupones de otro establecimiento (error 403 con alerta roja)
- **Flujo de dos pasos**: Vista previa con detalles y confirmación antes del canje definitivo
- **Validación de propiedad**: Backend verifica `benefit.merchantId === merchantId`
- **Excepción para MASTER_ADMIN**: Permite soporte técnico sin restricciones

**Funcionalidad**:
- Ingreso manual de código (web) o escaneo con cámara (móvil)
- Mensajes de error específicos (inválido, usado, expirado, comercio incorrecto)
- Previene intentos de fraude con alertas críticas

### QRScannerScreen Conectado y Securizado
Escaneo con cámara para móviles. Totalmente funcional con **mismas medidas de seguridad** que ScannerScreen.

**Características**:
- **Flujo de confirmación en dos pasos**
- **Validación de propiedad del beneficio** (backend + frontend)
- Alerta roja específica: "¡Este cupón pertenece a otro establecimiento!"
- Pide permisos de cámara, escanea QR y muestra confirmación
- Marco visual para enfocar código
- Solo funciona en móvil

### MerchantBenefitsScreen Conectado
Vista de beneficios del comercio. **Completamente funcional** pero **solo lectura**.

**Características**:
- Lista de beneficios asignados al comerciante
- Visualización de stock disponible con badges (AGOTADO, BAJO STOCK, disponible)
- Estadísticas: puntos del beneficio, cantidad de canjes
- Imágenes de beneficios desde Cloudinary
- Estado activo/inactivo
- Pull-to-refresh para actualizar datos
- **Sin capacidad de edición**: Los comerciantes NO pueden modificar stock (solo el admin)

**Eliminado**: Botón "Ajustar Stock" y modal de edición. El stock solo se modifica desde BenefitsManagementScreen (admin).

**Endpoint backend eliminado**: `PATCH /merchant/benefits/:id/stock` - Los comerciantes ya no pueden actualizar stock.

### HistoryScreen (del comerciante) Conectado
Historial de cupones validados por el comercio. Completamente funcional. Obtiene validaciones del backend con fecha, usuario, beneficio y puntos. Estado vacío con mensaje cuando no hay historial.

### MerchantProfileScreen Conectado
Configuración del comercio. Muestra información del usuario, permite cambiar tema (modo oscuro), y cerrar sesión. **Sin datos mock**.

## Pantallas de Administrador

### AdminDashboardScreen Conectado y Funcional
Panel principal del administrador con métricas del sistema en tiempo real. Completamente conectado usando **agregaciones de Prisma** para máximo rendimiento.

**Características implementadas**:
- **Backend con caché**: Endpoint `/admin/stats` con 10+ queries paralelas (Promise.all) y caché de 2 minutos
- **Estadísticas reales**: Usuarios activos, comercios, puntos en circulación, transacciones totales
- **Métricas semanales**: Nuevos usuarios, misiones completadas, beneficios canjeados esta semana
- **Tasas calculadas**: Retención de usuarios, aprobación de misiones
- **Top performers**: Beneficio más popular, comercio con más actividad
- **Alertas inteligentes**: Badge rojo si hay misiones pendientes de aprobación
- **React Query**: Refetch automático cada 2 minutos + pull-to-refresh manual
- **Formateo de números**: 1.2M, 50K, 87% para mejor legibilidad
- **Loading/Error states**: Skeleton screens y botón de reintentar

**Sin datos de ejemplo**. Todo es información real y actualizada.

### UsersManagementScreen Conectado
Gestión completa de usuarios. Totalmente funcional. Una de las pantallas más completas. Permite:
- Ver usuarios filtrados por rol (usuarios, comercios, admins)
- Buscar usuarios
- Cambiar estado de usuarios (activar, desactivar, banear)
- Crear admins de soporte
- Crear comercios con contraseña temporal
- Ver estadísticas de cada usuario (balance, transacciones)

Los admins de soporte tienen restricciones: no pueden ver otros admins ni crear nuevos admins.

### MissionsManagementScreen Conectado y Funcional
**CRUD completo de misiones**. Totalmente funcional con todos los endpoints del backend conectados:
- **Listar misiones**: GET /admin/missions con filtros (todas/activas/pausadas)
- **Crear misión**: POST /admin/missions con formulario completo (MissionFormScreen)
- **Editar misión**: PUT /admin/missions/:id 
- **Cambiar estado**: PATCH /admin/missions/:id/status (activar/pausar)
- **Eliminar misión**: DELETE /admin/missions/:id con confirmación

**Características implementadas**:
- Filtros por estado (ALL, ACTIVE, PAUSED, ARCHIVED)
- Navegación a MissionFormScreen para crear/editar
- Validaciones completas en formulario
- Cards con información completa: nombre, descripción, puntos, frecuencia, categoría
- Iconos de categorías dinámicos
- Fecha de expiración opcional con DateTimePicker
- Pull-to-refresh
- Estados vacíos informativos
- AdminLog de auditoría para todas las acciones

**Sin datos simulados**. Todo es información real del backend.

### BenefitsManagementScreen Conectado y Funcional
Gestión completa de beneficios. **Completamente funcional**. Permite realizar CRUD completo:
- **Crear** nuevos beneficios con formulario detallado, imagen, categoría, comercio asignado
- **Leer** y filtrar lista de beneficios (todos, disponibles, agotados)
- **Actualizar** cualquier detalle de beneficio existente con modal de edición
- **Cambiar stock** con modal de confirmación (restaurar/agotar)
- **Eliminar** beneficios con confirmación modal
- **Subida de imágenes** a Cloudinary
- **AdminLog** para auditoría de todas las acciones
- **Invalidación de caché** después de cada operación

**UI mejorada**:
- Filtros por disponibilidad (ALL, AVAILABLE, OUT_OF_STOCK)
- Cards rediseñadas con badges, imagen, stats
- Tres botones de acción por beneficio con íconos
- Modales consistentes para todas las confirmaciones

### SubmissionsApprovalScreen Conectado
Revisar y aprobar/rechazar evidencias de misiones. Completamente funcional. Obtiene envíos del backend filtrados por estado (pendientes, aprobados, rechazados). Aprobar con un click o rechazar con motivo. Actualización automática después de cada acción. Badge muestra envíos pendientes.

### SubmissionDetailScreen No requiere conexión adicional
Muestra detalles completos de envío de evidencia. No necesita backend porque recibe todos los datos al navegar desde pantalla de aprobaciones. Muestra usuario, misión, puntos, evidencia, observaciones y fechas.

### AdminSettingsScreen Conectado (MVP Completo)
**Configuración del sistema**. Conectado completamente con funcionalidad MVP esencial:

**Implementado y funcional**:
- **Modo Mantenimiento** (`maintenanceMode`): 
  - Toggle para activar/desactivar sistema
  - Bloquea envíos de misiones y canjes en backend (503)
  - Bloquea botones en frontend (MissionDetailScreen, BenefitDetailScreen)
  - Protección completa anti-fraude
  
- **Mensaje Banner** (`homeBannerMessage`):
  - Campo de texto para mensaje global
  - Se muestra en UserHomeScreen
  - Condicional (solo si hay mensaje)
  
- **Cambio de contraseña**:
  - Modal completo idéntico a ProfileScreen
  - Validaciones de seguridad
  - Funcional para admins

- **Tema oscuro**:
  - Toggle funcional desde settings
  - Se aplica globalmente

**Backend**: Endpoints `GET/PATCH /admin/settings` completamente implementados con SystemConfig singleton.

**Características "Próximamente"** (deshabilitadas):
- Notificaciones push
- Bonos para nuevos usuarios
- Estas son extensiones futuras, no parte del MVP

**Prioridad**: COMPLETO - MVP de settings funcional al 100%

### AdminAuditScreen Conectado y Funcional
**Nueva pantalla** de auditoría completa. Solo accesible para MASTER_ADMIN. Muestra logs de todas las acciones administrativas del sistema.

**Características**:
- **React Query** para manejo de estado y caché
- **Filtros** por tipo de acción (cambio de estado, aprobaciones, creación de beneficios, etc.)
- **Búsqueda** en tiempo real
- **Paginación** de resultados
- **Modal de detalles** con metadata completa de cada acción
- **Formateo de fechas** relativo (hace X minutos/horas/días)
- **Íconos específicos** para cada tipo de acción
- **Traducciones amigables** de acciones técnicas
- Pull-to-refresh para actualizar datos

## Funcionalidades Destacables

### Sistema Completamente Funcional:
- **Autenticación completa**: Login, registro, verificación de email, cambio de contraseña forzado
- **Sistema de puntos**: Ganar (misiones) y gastar (beneficios) con transacciones auditadas
- **CRUD Beneficios**: Crear, editar, eliminar, gestionar stock (Admin + Merchant)
- **CRUD Misiones**: Crear, editar, activar/pausar, eliminar con validaciones completas
- **Aprobaciones**: Flujo completo de envío → revisión → aprobación/rechazo → acreditación
- **QR Scanner**: Validación segura con protección anti-fraude (ownership validation)
- **Dashboard con estadísticas reales**: Agregaciones Prisma + caché para performance
- **Auditoría completa**: AdminLog para todas las acciones críticas
- **Modo Mantenimiento**: Protección backend (503) + frontend (botones deshabilitados)
- **Sistema de Roles**: USER, MERCHANT, SUPPORT_ADMIN, MASTER_ADMIN con permisos diferenciados
- **Caché inteligente**: Redis/Memory cache en endpoints críticos con invalidación selectiva

### Calidad de Código:
- Manejo de errores consistente en todas las pantallas
- Estados de carga (spinners/skeletons) universales
- Pull-to-refresh en todas las listas
- Validación en tiempo real en formularios
- Mensajes útiles cuando las listas están vacías
- Fechas en español con formato relativo (hace 5 minutos)
- **Cross-platform**: Funciona en web, iOS y Android
- Errores del backend traducidos a lenguaje entendible
- **Sin datos simulados**: Todas las pantallas muestran 0 o "No hay datos" cuando no hay información
- **React Query**: Manejo óptimo de estado y caché en frontend (AdminDashboard, AdminAudit)
- **Transacciones atómicas**: Prisma transactions para operaciones críticas (puntos, canjes)

### Seguridad Implementada:
- **JWT tokens** con refresh automático y logout en 401
- **Email verification** obligatoria antes del primer login
- **Password change forzado** para admins/merchants creados por el sistema
- **Validación de ownership**: Comercios solo pueden validar sus propios beneficios
- **Role-based access**: Middleware `authorize()` en todas las rutas sensibles
- **Modo mantenimiento**: Bloqueo completo de operaciones críticas (misiones + canjes)
- **Rate limiting**: Protección contra brute force en auth endpoints
- **Input validation**: Sanitización con Joi schemas en backend
- **Optimistic locking**: Version control en Wallet para prevenir race conditions
- **Audit trail**: Registro inmutable de todas las acciones administrativas

## Prioridades de Implementación

### Para MVP 100% Completo (opcional, no bloqueante):
1. **Conectar MissionDetailScreen GET**: Agregar llamada a `missionsAPI.getMissionById(id)` cuando no hay route.params (deep linking)
   - **Endpoint**: Ya existe en backend
   - **Esfuerzo**: 10 minutos
   - **Impacto**: Bajo - La navegación normal funciona

### Mejoras Futuras (Post-MVP):
1. **Recuperación de contraseña**: ForgotPasswordScreen + ResetPasswordScreen
   - Backend ya implementado con nodemailer
   - Falta UI en frontend
   
2. **Notificaciones Push**: Integración con Firebase/Expo Notifications
   - Para alertas de aprobaciones y nuevas misiones

3. **QR Scanner nativo optimizado**: Usar expo-barcode-scanner en lugar de input manual
   - Mejora UX en móvil

4. **Reportes y Analytics**: ReportsScreen con gráficos y estadísticas avanzadas

### Ya Completado:
- ✅ CRUD de Beneficios - 100% funcional
- ✅ CRUD de Misiones - 100% funcional
- ✅ Sistema de Settings - MVP completo
- ✅ Modo Mantenimiento - Backend + Frontend con protección completa
- ✅ Auditoría Admin - Logs completos y pantalla funcional
- ✅ MissionDetailScreen deep linking - Carga por ID implementada

## Análisis Exhaustivo para MVP 100%

### BACKEND COMPLETO
**Todos los endpoints core están implementados y funcionando:**

#### Autenticación (/auth)
- ✅ POST /register - Con email verification
- ✅ POST /login - Con validación de email verificado
- ✅ GET /verify-email - Verificación por token
- ✅ GET /me - Obtener usuario autenticado
- ✅ PUT /profile - Actualizar perfil
- ✅ PUT /change-password - Con validación de contraseña actual
- ✅ POST /logout - Invalidación de sesión
- ✅ POST /forgot-password - Envío de email con token
- ✅ POST /reset-password - Reset con token
- ✅ GET /reset-password-page - Página HTML para reset

#### Misiones (/missions)
- ✅ GET / - Listar misiones disponibles para usuario
- ✅ GET /:id - Detalles de misión específica
- ✅ POST /:missionId/submit - Envío de evidencia con Cloudinary

#### Misiones Admin (/admin/missions)
- ✅ GET / - Listar todas con filtros
- ✅ POST / - Crear misión
- ✅ PUT /:id - Actualizar misión
- ✅ PATCH /:id/status - Activar/pausar
- ✅ DELETE /:id - Eliminar misión

#### Beneficios (/benefits)
- ✅ GET / - Listar beneficios activos
- ✅ GET /:id - Detalles de beneficio

#### Beneficios Admin (/admin/benefits)
- ✅ POST / - Crear beneficio con imagen
- ✅ PATCH /:id - Editar beneficio
- ✅ PATCH /:id/stock - Actualizar stock
- ✅ DELETE /:id - Eliminar beneficio

#### Puntos (/points)
- ✅ GET /transactions - Historial de transacciones
- ✅ POST /add - Agregar puntos (admin)
- ✅ POST /redeem - Canjear beneficio (con protección mantenimiento)

#### Comerciante (/merchant)
- ✅ GET /associates - Lista de comercios
- ✅ POST /redeem - Validar QR y canjear
- ✅ POST /redeem/preview - Preview antes de canje
- ✅ GET /stats - Estadísticas del comercio
- ✅ GET /history - Historial de validaciones
- ✅ GET /benefits - Beneficios del comercio
- ✅ PATCH /benefits/:id/stock - Actualizar stock propio
- ✅ POST /benefits/:id/request-restock - Solicitar reabastecimiento

#### Admin (/admin)
- ✅ GET /stats - Dashboard con agregaciones
- ✅ GET /audit-logs - Logs de auditoría con filtros
- ✅ GET /users - Listar usuarios con filtros
- ✅ PATCH /users/:id/status - Cambiar estado usuario
- ✅ POST /support-admins - Crear admin de soporte
- ✅ POST /merchants - Crear comercio
- ✅ GET /submissions - Listar envíos pendientes
- ✅ POST /submissions/:id/approve - Aprobar evidencia
- ✅ POST /submissions/:id/reject - Rechazar evidencia
- ✅ GET /settings - Obtener configuración del sistema
- ✅ PATCH /settings - Actualizar configuración

#### Configuración Pública (/config)
- ✅ GET / - Estado de mantenimiento y banner (sin auth)

#### Wallet
- ✅ GET /wallet/balance - Balance del usuario

**Total endpoints backend**: 48 endpoints funcionando

### FRONTEND COMPLETO
**Todas las pantallas principales implementadas:**

#### Usuario (10 pantallas)
- ✅ UserHomeScreen - Dashboard con stats
- ✅ EarnScreen - Lista de misiones
- ✅ MissionDetailScreen - Detalles completo con carga por ID
- ✅ MissionSubmissionScreen - Envío de evidencia
- ✅ BenefitsScreen - Catálogo de beneficios
- ✅ BenefitDetailScreen - Detalle y canje
- ✅ QRCodeScreen - Mostrar QR canjeado
- ✅ HistorialScreen - Transacciones
- ✅ ProfileScreen - Perfil y stats
- ✅ AssociatesScreen - Comercios asociados

#### Comerciante (5 pantallas)
- ✅ MerchantDashboardScreen - Stats del comercio
- ✅ ScannerScreen - Validar QR (web)
- ✅ QRScannerScreen - Escanear QR (móvil)
- ✅ MerchantBenefitsScreen - Vista de beneficios (solo lectura)
- ✅ HistoryScreen - Historial de validaciones
- ✅ MerchantProfileScreen - Perfil y config

#### Admin (8 pantallas)
- ✅ AdminDashboardScreen - Dashboard con React Query
- ✅ UsersManagementScreen - CRUD usuarios
- ✅ MissionsManagementScreen - CRUD misiones
- ✅ MissionFormScreen - Formulario misiones
- ✅ BenefitsManagementScreen - CRUD beneficios
- ✅ SubmissionsApprovalScreen - Aprobar/rechazar
- ✅ SubmissionDetailScreen - Detalle de envío
- ✅ AdminAuditScreen - Logs de auditoría
- ✅ AdminSettingsScreen - Configuración sistema

#### Auth (4 pantallas)
- ✅ LoginScreen - Con Google login
- ✅ RegisterScreen - Con validaciones
- ✅ ChangePasswordScreen - Forzado para admins
- ✅ SplashScreen - Pantalla de carga

**Total pantallas**: 29/29 implementadas ✅

## Prioridades de Implementación

### MVP 100% COMPLETO ✅
Todas las funcionalidades core están implementadas y funcionando:
- ✅ Sistema de autenticación completo
- ✅ CRUD de Misiones y Beneficios
- ✅ Sistema de puntos y transacciones
- ✅ Aprobaciones de evidencias
- ✅ QR Scanner con seguridad
- ✅ Dashboard con estadísticas reales
- ✅ Sistema de auditoría
- ✅ Modo mantenimiento
- ✅ MissionDetailScreen con carga por ID (deep linking)

### Mejoras Futuras (Post-MVP):
