# Estado de Conexión de Vistas
**Última actualización**: 21 de enero de 2026

## Resumen General

En total tenemos **28 pantallas** en la aplicación. De estas:
- **20 están completamente funcionales** y conectadas al backend
- **5 están pendientes de conectar** al backend
- **3 no necesitan backend** porque solo muestran información que ya tienen

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

### MissionDetailScreen Parcialmente conectado
Muestra detalles completos de una misión. Ahora muestra mensaje "Misión no encontrada" si no hay datos. Falta implementar llamada a endpoint GET /missions/{id}.

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

### MerchantStockScreen ❌ Pendiente de conectar
Debería mostrar inventario de beneficios del comercio. **Datos simulados eliminados**. Ahora muestra lista vacía. Falta implementar endpoint GET /merchant/benefits. Interfaz lista con barras de progreso de stock y badges de estado.

### MerchantBenefitsScreen Conectado
Gestión de beneficios del comercio. Conectada completamente. Permite ver beneficios, actualizar stock, y gestionar inventario. **Sin datos mock**.

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

### MissionsManagementScreen ❌ Pendiente de conectar
Para administrar misiones (crear, editar, pausar, eliminar). Interfaz completa con filtros por estado y botones de acción. Ahora muestra lista vacía. Necesito implementar todo el CRUD de misiones en el backend.

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

### AdminSettingsScreen ❌ Pendiente de conectar
Configuración de políticas del sistema (tiempos de cooldown, límites, notificaciones). Interfaz completa con todos los controles. **Datos simulados eliminados**: campos ahora vacíos por defecto. No está conectado al backend. Cuando intentas guardar sale "Próximamente".

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

## Pantallas Eliminadas/No Existentes

Las siguientes pantallas mencionadas en el documento original **ya no existen** en el proyecto:
- ~~ForgotPasswordScreen~~ - No existe en la estructura actual
- ~~ResetPasswordScreen~~ - No existe en la estructura actual
- ~~ReportsScreen~~ - No existe en la estructura actual
- ~~MerchantsManagementScreen~~ - No existe en la estructura actual

## Funcionalidades Destacables

### Funcionan muy bien:
- Manejo de errores consistente en todas las pantallas conectadas
- Estados de carga (spinners/skeletons) en todas las pantallas
- Pull to refresh para actualizar datos
- Validación en tiempo real en formularios
- Mensajes útiles cuando las listas están vacías
- Fechas en español con formato relativo (hace 5 minutos)
- Funciona en web y móvil
- Errores del backend en lenguaje entendible
- **Sistema de verificación de email** con tokens JWT y nodemailer/Ethereal
- **Forced password change** para admins y comercios en primer acceso
- **Blindaje de seguridad** en escaneo de QR (validación de propiedad)
- **Dashboard con estadísticas reales** usando agregaciones de Prisma y caché
- **React Query** para manejo óptimo de estado y caché en frontend
- **AdminLog** completo con auditoría de todas las acciones administrativas
- **Sin datos simulados**: Todas las pantallas muestran 0 o "No hay datos" en lugar de información falsa

### ❌ Pendiente:
- Varios CRUDs de admin no conectados (misiones, settings)
- Algunos endpoints faltantes para comerciantes (stock management)

## Prioridades de Implementación

### 🔴 Urgente (afectan funcionalidad principal):
1. ~~Conectar BenefitsManagementScreen CRUD~~ - **COMPLETADO**
2. Conectar MissionDetailScreen: Usuarios necesitan ver detalles antes de enviar evidencia
3. Conectar MerchantStockScreen: Comercios necesitan ver su inventario
4. Implementar CRUD de misiones: Admins necesitan gestionar las misiones

### 🟡 Importante (mejoran la experiencia):
5. AdminSettingsScreen conectado: Configuración dinámica del sistema

### 🟢 Opcional (complementario):
6. QR nativo en móvil: Mejor experiencia en app nativa

## Notas Técnicas

El código usa un servicio centralizado de API (`services/api.js`) que tiene todos los endpoints organizados por módulo:
- `authAPI`
- `walletAPI`
- `pointsAPI`
- `benefitsAPI`
- `missionsAPI`
- `merchantAPI`
- `adminAPI`

Este archivo centralizado facilita mucho agregar nuevos endpoints cuando se necesiten.
