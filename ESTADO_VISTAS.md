# Estado de Conexión de vistas
**Fecha**: 3 de enero de 2026

## Resumen General

En total tenemos 27 pantallas en la aplicación. De estas:
- 15 están completamente funcionales y conectadas al backend
- 1 tiene funcionalidad parcial
- 8 están pendientes de conectar al backend
- 3 no necesitan backend porque solo muestran información que ya tienen

## Pantallas de Autenticación

### LoginScreen: Conectado y Mejorado
Esta pantalla permite a los usuarios iniciar sesión. Está completamente funcional y mejorada. Valida el email y contraseña, se conecta al backend para autenticar y guarda el token. Ahora incluye **inicio de sesión con Google** y un enlace a la pantalla de **recuperación de contraseña**.

### RegisterScreen: Conectado y Mejorado
Pantalla de registro de nuevos usuarios. Funciona perfectamente. Valida todos los campos en tiempo real. Tras un registro exitoso, redirige a la pantalla de login para que el usuario inicie sesión, promoviendo un flujo más seguro y consistente.

### ForgotPasswordScreen: Conectado
Nueva pantalla que permite a los usuarios solicitar un correo para restablecer su contraseña. Se conecta al backend para enviar el token de reseteo.

### ResetPasswordScreen: Conectado
Nueva pantalla a la que se accede desde el enlace del correo. Permite al usuario establecer una nueva contraseña, validando el token recibido.

### HomeScreen: Conectado
Es la primera pantalla que ves después de hacer login. Muestra tu información básica: nombre, email, rol y fecha de registro. Usa los datos que vienen del contexto de autenticación, no necesita hacer llamadas adicionales al backend.

### SplashScreen: No requiere backend
Es simplemente la pantalla de carga con el logo que ves al abrir la app. Solo tiene animaciones, no necesita conectarse a nada.

## Pantallas de Usuario

### UserHomeScreen (Dashboard): Conectado
Esta es la pantalla principal del usuario. Está totalmente conectada y muestra:
- El balance actual de puntos
- Los beneficios disponibles
- Las últimas 5 transacciones
- Las misiones activas

Todo esto lo obtiene del backend mediante cuatro llamadas API diferentes que se ejecutan en paralelo. Tiene un botón de refresh para actualizar los datos.

### EarnScreen (Misiones): Conectado
Muestra todas las misiones disponibles para que el usuario pueda ganar puntos. Está completamente funcional. Obtiene las misiones del backend y muestra la información completa: título, descripción, puntos que otorga, dificultad, si está expirada, etc. Cuando haces click en una misión te lleva a enviar la evidencia.

### BenefitsScreen: Conectado
Catálogo de beneficios que el usuario puede canjear. Totalmente funcional. Trae todos los beneficios del backend y el balance actual del usuario. Tiene filtros locales por categoría (Comida, Servicios). Te avisa si no tienes suficientes puntos o si el stock está bajo. Al hacer click en un beneficio te lleva a los detalles.

### BenefitDetailScreen: Conectado
Muestra los detalles completos de un beneficio y permite canjearlo. Está completamente funcional. Verifica que tengas suficientes puntos antes de dejarte canjear. Cuando canjeas exitosamente, actualiza tu balance y te lleva automáticamente a la pantalla del código QR que debes mostrar en el comercio.

### MissionDetailScreen: Pendiente de conectar
Esta pantalla debería mostrar los detalles completos de una misión específica, pero todavía no está conectada al backend. Usa datos de ejemplo (mock). Falta implementar la llamada al endpoint GET /missions/{id}. La interfaz está lista y funcionando, solo necesita conectarse.

### MissionSubmissionScreen: Conectado
Permite enviar la evidencia de que completaste una misión. Está conectada y funciona. Le puedes agregar una descripción y evidencia (por ahora un placeholder de foto). Envía todo al backend y te muestra un mensaje de éxito. Incluye validaciones de que hayas llenado los campos obligatorios.

Nota: La integración con la galería y cámara del teléfono todavía no está implementada, por eso solo muestra un placeholder.

### HistorialScreen: Conectado
Tu historial de transacciones. Completamente funcional. Obtiene todas tus transacciones del backend (hasta 100) y las muestra ordenadas por fecha. Tiene filtros para ver solo lo que ganaste o solo lo que gastaste. Las transacciones donde canjeaste un beneficio tienen un botón para ver el código QR.

### ProfileScreen: Conectado
Tu perfil con estadísticas. Está conectado. Muestra tu balance actual y calcula estadísticas en tiempo real basándose en tus transacciones: puntos totales ganados, puntos del mes, beneficios canjeados y misiones completadas. En móvil tiene un botón de cerrar sesión (en web el botón está en el header).

### QRCodeScreen: No requiere conexión adicional
Muestra el código QR de un beneficio que canjeaste. No necesita llamar al backend porque recibe todos los datos cuando navegas a ella. Genera el código QR, muestra el código alfanumérico, la fecha de expiración y un botón para compartir.

## Pantallas de Comerciante

### MerchantDashboardScreen: Conectado
El dashboard del comercio con estadísticas. Ahora está completamente conectado. Obtiene las estadísticas reales del backend (canjes, puntos, etc.) y muestra el historial de las últimas validaciones de cupones. Ya no utiliza datos de ejemplo.

### ScannerScreen: Conectado
Permite al comerciante validar códigos QR de cupones. Está completamente funcional y securizado. 
- **Flujo de dos pasos**: Primero muestra una vista previa con los detalles del cupón (cliente, beneficio, descripción y puntos) y pide confirmación antes de procesar el canje definitivo.
- **Seguridad mejorada**: Impide que un comercio pueda canjear cupones que pertenecen a otro establecimiento.
- El comercio puede ingresar el código manualmente (web) o escanear con la cámara (móvil).
- Muestra mensajes de error específicos si el cupón es inválido, ya fue usado, está expirado o pertenece a otra tienda.

### QRScannerScreen: Conectado
La pantalla de escaneo con cámara para móviles. Totalmente funcional y securizada.
- Implementa el mismo **flujo de confirmación en dos pasos** que la pantalla manual.
- Pide permisos de cámara, escanea el QR y muestra la alerta de confirmación con todos los detalles antes de validar.
- Incluye la misma lógica de seguridad para prevenir el canje de cupones ajenos.
- Muestra un marco visual para ayudar a enfocar el código. Solo funciona en móvil.

### MerchantStockScreen: Pendiente de conectar
Debería mostrar el inventario de beneficios del comercio, pero todavía usa datos de ejemplo. Falta implementar el endpoint GET /merchant/benefits. La interfaz ya está lista con barras de progreso de stock y badges de estado, solo necesita conectarse.

### HistoryScreen (del comerciante): Conectado
Historial de cupones que el comercio ha validado. Completamente funcional. Obtiene del backend todas las validaciones realizadas y las muestra con la fecha, usuario, beneficio y puntos. Tiene un estado vacío con mensaje cuando no hay historial.

## Pantallas de Administrador

### AdminDashboardScreen: Conectado
El panel principal del administrador con métricas del sistema. Esta pantalla ahora está completamente conectada al backend. Utiliza el endpoint `adminAPI.getStats` para mostrar en tiempo real:
- Resumen general (usuarios activos, comercios, puntos en circulación, transacciones).
- Alertas de misiones pendientes de aprobación.
- Reportes detallados de actividad de usuarios, misiones, beneficios y comercios.
Ya no utiliza datos de ejemplo.

### UsersManagementScreen: Conectado
Gestión completa de usuarios. Está totalmente funcional y es una de las pantallas más completas. Permite:
- Ver todos los usuarios filtrados por rol (usuarios, comercios, admins)
- Buscar usuarios
- Cambiar el estado de usuarios (activar, desactivar, banear)
- Crear admins de soporte
- Crear comercios con contraseña temporal
- Ver estadísticas de cada usuario (balance, transacciones, etc.)

Los admins de soporte tienen restricciones: no pueden ver otros admins ni crear nuevos admins.

### MissionsManagementScreen: Pendiente de conectar
Para administrar misiones (crear, editar, pausar, eliminar). La interfaz está completa con filtros por estado y todos los botones de acción, pero ninguna operación está conectada al backend. Los datos que muestra son de ejemplo. Necesita implementar todo el CRUD de misiones en el backend.

### BenefitsManagementScreen: Conectado
Gestión de beneficios. Esta pantalla ahora es **completamente funcional**. Permite a los administradores realizar un CRUD completo:
- **Crear** nuevos beneficios a través de un formulario detallado.
- **Leer** y filtrar la lista de todos los beneficios existentes.
- **Actualizar** cualquier detalle de un beneficio ya creado.
- **Activar o desactivar** beneficios para controlar su visibilidad.
Ya no muestra el mensaje "Próximamente".

### SubmissionsApprovalScreen: Conectado
Para revisar y aprobar/rechazar evidencias de misiones. Completamente funcional. Obtiene los envíos del backend filtrados por estado (pendientes, aprobados, rechazados). Puedes aprobar con un click o rechazar escribiendo un motivo. Después de cada acción se actualiza automáticamente la lista. Tiene un badge que muestra cuántos envíos están pendientes.
Conectado
Muestra reportes y estadísticas del sistema. Ahora está conectada al mismo endpoint que el AdminDashboard (`adminAPI.getStats`) para visualizar datos reales sobre la actividad de la plataforma. Ya no utiliza datos de ejemplo
Muestra los detalles completos de un envío de evidencia. No necesita llamar al backend porque recibe todos los datos cuando navegas a ella desde la pantalla de aprobaciones. Muestra usuario, misión, puntos, evidencia, observaciones y fechas.

### ReportsScreen: Pendiente de conectar
Debería mostrar reportes y estadísticas del sistema, pero todos los datos son de ejemplo. No tiene conexión al backend. Necesita implementar endpoints para generar reportes reales de usuarios activos, transacciones, etc.

### MerchantsManagementScreen: Pendiente de conectar
Para gestionar los comercios asociados. Muestra una lista de 3 comercios de ejemplo, pero no está conectada al backend. No tiene funcionalidad para crear, editar o eliminar comercios. Solo es la interfaz básica.

### AdminSettingsScreen: Pendiente de conectar
Configuración de políticas del sistema (tiempos de cooldown, límites, notificaciones). Tiene una interfaz completa con todos los controles, pero cuando intentas guardar sale "Próximamente". No está conectado al backend. Los valores que muestra son por defecto locales.

## Funcionalidades Destacables

### Cosas que funcionan muy bien:
- El manejo de errores es consistente en todas las pantallas conectadas
- Todas las pantallas tienen estados de carga (spinners)
- Las listas tienen "pull to refresh" para actualizar
- Los formularios validan en tiempo real
- Hay mensajes útiles cuando las listas están vacías
- Las fechas se muestran en español con formato relativo (hace 5 minutos)
- Todo funciona tanto en web como en móvil
- Los errores del backend se muestran en lenguaje entendible

### Cosas que faltan:
- Integrar la cámara y galería real del teléfono en el envío de evidencias
- Varios CRUDs de admin no están conectados
- Algunas pantallas de dashboard usan datos de ejemplo
- La librería de QR en móvil es un placeholder

## Prioridades de Implementación

### Urgente (afectan funcionalidad principal):
1. Conectar MissionDetailScreen: Los usuarios necesitan ver detalles antes de enviar evidencia
2. Conectar MerchantStockScreen: Los comercios necesitan ver su inventario
3. Implementar el CRUD de beneficios: Los admins necesitan gestionar los beneficios
4. Implementar el CRUD de misiones: Los admins necesitan gestionar las misiones

### Importante (mejoran la experiencia):
5. AdminDashboardScreen con datos reales: Los admins necesitan ver métricas actualizadas
6. ReportsScreen funcional: Para análisis del sistema
7. Galería y cámara en evidencias: Para que los usuarios puedan subir fotos reales

### Opcional (complementario):
8. MerchantsManagementScreen completo: CRUD de comercios desde admin
9. AdminSettingsScreen conectado: Configuración dinámica del sistema
10. QR nativo en móvil: Mejor experiencia en app nativa

## Notas Técnicas

El código usa un servicio centralizado de API (services/api.js) que tiene todos los endpoints organizados por módulo:
- authAPI
- walletAPI
- pointsAPI
- benefitsAPI
- missionsAPI
- merchantAPI
- adminAPI

Este archivo centralizado facilita mucho agregar nuevos endpoints cuando se necesiten.
